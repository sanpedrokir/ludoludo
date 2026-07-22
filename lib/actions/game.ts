'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, and, asc, count, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { gameRooms, gamePlayers, gameStates, gameHistory, invitations, profiles } from '@/lib/db/schema'
import { getSessionUser, getSessionUserId } from '@/lib/auth/getUser'
import { pusherServer } from '@/lib/pusher/server'
import { generateRoomCode, buildInitialTokens } from '@/lib/game/engine'
import { Color, COLORS } from '@/lib/game/types'

type ActionResult = {
  error?: string
  success?: boolean
  message?: string
  warning?: string
}

const STAKE_AMOUNT = 250_000

export async function createGameRoom(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getSessionUser()
  if (!session) return { error: 'Not authenticated' }

  const maxPlayers = parseInt(formData.get('maxPlayers') as string) || 4
  const name = (formData.get('name') as string) || null
  const fillWithComputers = formData.get('fillWithComputers') === 'true'
  const hostColor = (formData.get('hostColor') as Color) || 'red'
  const isStakeGame = formData.get('isStakeGame') === 'true'

  if (isStakeGame && session.profile.balance < STAKE_AMOUNT) {
    return {
      error: `You need $${STAKE_AMOUNT.toLocaleString()} to create a stake game. Your balance: $${session.profile.balance.toLocaleString()}`,
    }
  }

  const roomCode = generateRoomCode()

  const [room] = await db
    .insert(gameRooms)
    .values({
      roomCode,
      name,
      hostId: session.id,
      maxPlayers,
      fillWithComputers,
      mode: 'online',
      status: 'waiting',
      stake: isStakeGame ? STAKE_AMOUNT : 0,
    })
    .returning()

  if (!room) return { error: 'Failed to create room' }

  await db.insert(gamePlayers).values({
    roomId: room.id,
    playerId: session.id,
    color: hostColor,
    isComputer: false,
    turnOrder: 0,
    status: 'active',
  })

  if (isStakeGame) {
    await db
      .update(profiles)
      .set({ balance: sql`${profiles.balance} - ${STAKE_AMOUNT}` })
      .where(eq(profiles.id, session.id))
  }

  redirect(`/lobby/${room.id}`)
}

export async function lookupRoom(code: string): Promise<
  { available: Color[]; takenColors: Color[]; roomId: string; stake: number } | { error: string }
> {
  const userId = await getSessionUserId()
  if (!userId) return { error: 'Not authenticated' }

  const room = await db.query.gameRooms.findFirst({
    where: eq(gameRooms.roomCode, code.trim().toUpperCase()),
    with: { gamePlayers: true },
  })

  if (!room) return { error: 'Game room not found.' }
  if (room.status === 'playing') return { error: 'This game has already started.' }
  if (room.status === 'finished') return { error: 'This game has already ended.' }

  const humanPlayers = room.gamePlayers.filter((p) => !p.isComputer)
  const alreadyJoined = humanPlayers.some((p) => p.playerId === userId)
  if (alreadyJoined) redirect(`/lobby/${room.id}`)

  if (humanPlayers.length >= room.maxPlayers) return { error: 'This game room is full.' }

  const takenColors = room.gamePlayers.map((p) => p.color) as Color[]
  const available = COLORS.filter((c) => !takenColors.includes(c))
  if (available.length === 0) return { error: 'No colour slots available.' }

  return { available, takenColors, roomId: room.id, stake: room.stake }
}

export async function joinGameByCode(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getSessionUser()
  if (!session) return { error: 'Not authenticated' }

  const code = (formData.get('code') as string).trim().toUpperCase()
  const chosenColor = formData.get('color') as Color | null

  const room = await db.query.gameRooms.findFirst({
    where: eq(gameRooms.roomCode, code),
    with: { gamePlayers: true },
  })

  if (!room) return { error: 'Game room not found.' }
  if (room.status === 'playing') return { error: 'This game has already started.' }
  if (room.status === 'finished') return { error: 'This game has already ended.' }

  const humanPlayers = room.gamePlayers.filter((p) => !p.isComputer)
  if (humanPlayers.length >= room.maxPlayers) return { error: 'This game room is full.' }

  const alreadyJoined = humanPlayers.some((p) => p.playerId === session.id)
  if (alreadyJoined) redirect(`/lobby/${room.id}`)

  const takenColors = new Set(room.gamePlayers.map((p) => p.color))
  if (chosenColor && takenColors.has(chosenColor)) return { error: 'That colour was just taken. Please pick another.' }

  const colorToUse = chosenColor && !takenColors.has(chosenColor)
    ? chosenColor
    : COLORS.find((c) => !takenColors.has(c))
  if (!colorToUse) return { error: 'No colour slots available.' }

  const stakeAmount = room.stake
  if (stakeAmount > 0 && session.profile.balance < stakeAmount) {
    return { error: `This is a stake game. Entry fee: $${stakeAmount.toLocaleString()}. Your balance: $${session.profile.balance.toLocaleString()}` }
  }

  const maxTurnOrder = room.gamePlayers.reduce((max, p) => Math.max(max, p.turnOrder), -1)
  const turnOrder = maxTurnOrder + 1

  await db.insert(gamePlayers).values({
    roomId: room.id,
    playerId: session.id,
    color: colorToUse,
    isComputer: false,
    turnOrder,
    status: 'active',
  })

  if (stakeAmount > 0) {
    await db
      .update(profiles)
      .set({ balance: sql`${profiles.balance} - ${stakeAmount}` })
      .where(eq(profiles.id, session.id))
  }

  const players = await db.query.gamePlayers.findMany({
    where: eq(gamePlayers.roomId, room.id),
    with: { profile: true },
  })
  await pusherServer.trigger(`game_players:${room.id}`, 'player-joined', players)

  redirect(`/lobby/${room.id}`)
}

export async function startGame(roomId: string): Promise<ActionResult> {
  const session = await getSessionUser()
  if (!session) return { error: 'Not authenticated' }

  const room = await db.query.gameRooms.findFirst({
    where: eq(gameRooms.id, roomId),
    with: { gamePlayers: true },
  })

  if (!room) return { error: 'Room not found' }
  if (room.hostId !== session.id) return { error: 'Only the host can start the game' }

  const players = room.gamePlayers
  if (players.length < 2) return { error: 'Need at least 2 players to start' }

  const colors: Color[] = players.map((p) => p.color as Color)
  const tokens = buildInitialTokens(colors)

  await db.insert(gameStates).values({
    roomId,
    currentPlayerOrder: 0,
    diceValue: null,
    phase: 'roll',
    tokens,
  })

  await db.update(gameRooms).set({ status: 'playing', startedAt: new Date() }).where(eq(gameRooms.id, roomId))

  await pusherServer.trigger(`game_rooms:${roomId}`, 'status-changed', { status: 'playing' })

  revalidatePath(`/lobby/${roomId}`)
  redirect(`/game/${roomId}`)
}

export async function leaveRoom(roomId: string): Promise<ActionResult> {
  const userId = await getSessionUserId()
  if (!userId) return { error: 'Not authenticated' }

  const [myPlayer] = await db
    .select({ color: gamePlayers.color, turnOrder: gamePlayers.turnOrder })
    .from(gamePlayers)
    .where(and(eq(gamePlayers.roomId, roomId), eq(gamePlayers.playerId, userId)))
    .limit(1)

  await db
    .update(gamePlayers)
    .set({ status: 'forfeited' })
    .where(and(eq(gamePlayers.roomId, roomId), eq(gamePlayers.playerId, userId)))

  await pusherServer.trigger(`game_players:${roomId}`, 'player-forfeited', { playerId: userId })

  const [room] = await db.select({ status: gameRooms.status }).from(gameRooms).where(eq(gameRooms.id, roomId)).limit(1)

  if (room?.status === 'playing') {
    const allPlayers = await db
      .select({
        playerId: gamePlayers.playerId,
        turnOrder: gamePlayers.turnOrder,
        status: gamePlayers.status,
        isComputer: gamePlayers.isComputer,
      })
      .from(gamePlayers)
      .where(eq(gamePlayers.roomId, roomId))
      .orderBy(asc(gamePlayers.turnOrder))

    const [gameState] = await db
      .select({ currentPlayerOrder: gameStates.currentPlayerOrder, phase: gameStates.phase })
      .from(gameStates)
      .where(eq(gameStates.roomId, roomId))
      .limit(1)

    if (allPlayers.length && gameState) {
      const remaining = allPlayers.filter((p) => p.playerId !== userId && (p.isComputer || p.status === 'active'))

      if (remaining.length <= 1) {
        await db.update(gameRooms).set({ status: 'finished', finishedAt: new Date() }).where(eq(gameRooms.id, roomId))
        await db.update(gameStates).set({ phase: 'finished', updatedAt: new Date() }).where(eq(gameStates.roomId, roomId))
        await pusherServer.trigger(`game_rooms:${roomId}`, 'status-changed', { status: 'finished' })
      } else if (myPlayer && gameState.currentPlayerOrder === myPlayer.turnOrder) {
        const total = allPlayers.length
        let next = (myPlayer.turnOrder + 1) % total
        for (let i = 0; i < total; i++) {
          const candidate = allPlayers.find((p) => p.turnOrder === next)
          if (candidate && candidate.playerId !== userId && (candidate.isComputer || candidate.status === 'active')) break
          next = (next + 1) % total
        }
        const [newState] = await db
          .update(gameStates)
          .set({ currentPlayerOrder: next, diceValue: null, phase: 'roll', updatedAt: new Date() })
          .where(eq(gameStates.roomId, roomId))
          .returning()
        if (newState) await pusherServer.trigger(`game_states:${roomId}`, 'state-updated', newState)
      }
    }
  }

  return { success: true }
}

const WIN_REWARDS = [10000, 5000, 1000, 200] as const

export async function recordOnlineGameResult(rank: number, roomId: string): Promise<void> {
  const session = await getSessionUser()
  if (!session) return
  const userId = session.id

  const [existing] = await db
    .select({ id: gameHistory.id })
    .from(gameHistory)
    .where(and(eq(gameHistory.roomId, roomId), eq(gameHistory.playerId, userId)))
    .limit(1)
  if (existing) return

  let potPayout = 0
  const [roomData] = await db.select({ stake: gameRooms.stake }).from(gameRooms).where(eq(gameRooms.id, roomId)).limit(1)
  const stake = roomData?.stake ?? 0
  if (rank === 1 && stake > 0) {
    const [{ value }] = await db
      .select({ value: count() })
      .from(gamePlayers)
      .where(and(eq(gamePlayers.roomId, roomId), eq(gamePlayers.isComputer, false)))
    potPayout = stake * value
  }

  const reward = WIN_REWARDS[Math.min(rank - 1, WIN_REWARDS.length - 1)]
  const totalReward = reward + potPayout

  const [updated] = await db
    .update(profiles)
    .set({
      gamesPlayed: sql`${profiles.gamesPlayed} + 1`,
      ...(rank === 1 ? { wins: sql`${profiles.wins} + 1` } : {}),
      balance: sql`${profiles.balance} + ${totalReward}`,
    })
    .where(eq(profiles.id, userId))
    .returning({ balance: profiles.balance })

  await db.insert(gameHistory).values({ roomId, playerId: userId, rank, mode: 'online' })

  if (updated) await pusherServer.trigger(`profile:${userId}`, 'balance-updated', { balance: updated.balance })
}

export async function sendInvitation(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getSessionUser()
  if (!session) return { error: 'Not authenticated' }

  const roomId = formData.get('roomId') as string
  const phonesRaw = formData.get('phones') as string
  const phones = phonesRaw.split(',').map((p) => p.trim()).filter(Boolean)

  if (phones.length === 0) return { error: 'No phone numbers provided' }
  if (phones.length > 3) return { error: 'Maximum 3 invitations per game' }

  const [room] = await db
    .select({ roomCode: gameRooms.roomCode, name: gameRooms.name })
    .from(gameRooms)
    .where(eq(gameRooms.id, roomId))
    .limit(1)

  if (!room) return { error: 'Room not found' }

  const inviterName = session.profile.displayName ?? 'Someone'

  await db.insert(invitations).values(
    phones.map((phone) => ({
      roomId,
      invitedPhone: phone,
      invitedBy: session.id,
      status: 'pending' as const,
    }))
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const smsResults = await Promise.allSettled(
    phones.map((phone) =>
      fetch(`${appUrl}/api/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, inviterName, roomCode: room.roomCode, roomId }),
      })
    )
  )

  const failed = smsResults.filter((r) => r.status === 'rejected').length
  if (failed > 0) return { warning: `${failed} SMS(es) could not be sent, but invitations were saved.`, success: true }

  return { success: true, message: `Invited ${phones.length} friend(s)!` }
}

/** Fallback re-fetch for realtime desync (e.g. after rejoin) — was a direct client-side Supabase select. */
export async function getGameState(roomId: string) {
  const [row] = await db.select().from(gameStates).where(eq(gameStates.roomId, roomId)).limit(1)
  return row ?? null
}

/**
 * Persists live game-board state and broadcasts it. Was a direct client-side
 * Supabase write in OnlineGameClient.tsx's persistState() — moved server-side
 * because Pusher's secret key can't be used from the browser.
 */
export async function updateGameState(
  roomId: string,
  state: { currentPlayerOrder: number; diceValue: number | null; phase: 'roll' | 'move' | 'finished'; tokens: unknown }
): Promise<void> {
  const userId = await getSessionUserId()
  if (!userId) return

  const [row] = await db
    .update(gameStates)
    .set({
      currentPlayerOrder: state.currentPlayerOrder,
      diceValue: state.diceValue,
      phase: state.phase,
      tokens: state.tokens as never,
      updatedAt: new Date(),
    })
    .where(eq(gameStates.roomId, roomId))
    .returning()

  if (row) await pusherServer.trigger(`game_states:${roomId}`, 'state-updated', row)
}

/** Marks a room finished once the board reaches a terminal state — was a direct client-side write in OnlineGameClient.tsx. */
export async function finishGame(roomId: string): Promise<void> {
  const userId = await getSessionUserId()
  if (!userId) return

  await db.update(gameRooms).set({ status: 'finished', finishedAt: new Date() }).where(eq(gameRooms.id, roomId))
  await pusherServer.trigger(`game_rooms:${roomId}`, 'status-changed', { status: 'finished' })
}
