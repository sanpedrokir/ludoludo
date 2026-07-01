'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const maxPlayers = parseInt(formData.get('maxPlayers') as string) || 4
  const name = (formData.get('name') as string) || null
  const fillWithComputers = formData.get('fillWithComputers') === 'true'
  const hostColor = (formData.get('hostColor') as Color) || 'red'
  const isStakeGame = formData.get('isStakeGame') === 'true'

  if (isStakeGame) {
    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single()
    const balance = (profile as any)?.balance ?? 0
    if (balance < STAKE_AMOUNT) {
      return { error: `You need $${STAKE_AMOUNT.toLocaleString()} to create a stake game. Your balance: $${balance.toLocaleString()}` }
    }
  }

  const roomCode = generateRoomCode()

  const { data: room, error: roomError } = await supabase
    .from('game_rooms')
    .insert({
      room_code: roomCode,
      name,
      host_id: user.id,
      max_players: maxPlayers,
      fill_with_computers: fillWithComputers,
      mode: 'online',
      status: 'waiting',
      stake: isStakeGame ? STAKE_AMOUNT : 0,
    })
    .select()
    .single()

  if (roomError || !room) return { error: roomError?.message ?? 'Failed to create room' }

  const { error: playerError } = await supabase
    .from('game_players')
    .insert({
      room_id: room.id,
      player_id: user.id,
      color: hostColor,
      is_computer: false,
      turn_order: 0,
      status: 'active',
    })

  if (playerError) return { error: playerError.message }

  // Deduct stake from host after room + player created
  if (isStakeGame) {
    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single()
    await supabase.from('profiles').update({ balance: ((profile as any)?.balance ?? 0) - STAKE_AMOUNT } as any).eq('id', user.id)
  }

  redirect(`/lobby/${room.id}`)
}

export async function lookupRoom(code: string): Promise<
  { available: Color[]; takenColors: Color[]; roomId: string; stake: number } | { error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: room, error } = await supabase
    .from('game_rooms')
    .select('*, game_players(*)')
    .eq('room_code', code.trim().toUpperCase())
    .single()

  if (error || !room) return { error: 'Game room not found.' }
  if (room.status === 'playing') return { error: 'This game has already started.' }
  if (room.status === 'finished') return { error: 'This game has already ended.' }

  const humanPlayers = room.game_players.filter((p: { is_computer: boolean }) => !p.is_computer)
  const alreadyJoined = humanPlayers.some((p: { player_id: string }) => p.player_id === user.id)
  if (alreadyJoined) redirect(`/lobby/${room.id}`)

  if (humanPlayers.length >= room.max_players) return { error: 'This game room is full.' }

  const takenColors = room.game_players.map((p: { color: string }) => p.color) as Color[]
  const available = COLORS.filter(c => !takenColors.includes(c))
  if (available.length === 0) return { error: 'No colour slots available.' }

  return { available, takenColors, roomId: room.id, stake: (room as any).stake ?? 0 }
}

export async function joinGameByCode(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const code = (formData.get('code') as string).trim().toUpperCase()
  const chosenColor = formData.get('color') as Color | null

  const { data: room, error } = await supabase
    .from('game_rooms')
    .select('*, game_players(*)')
    .eq('room_code', code)
    .single()

  if (error || !room) return { error: 'Game room not found.' }
  if (room.status === 'playing') return { error: 'This game has already started.' }
  if (room.status === 'finished') return { error: 'This game has already ended.' }

  const humanPlayers = room.game_players.filter((p: { is_computer: boolean }) => !p.is_computer)
  if (humanPlayers.length >= room.max_players) return { error: 'This game room is full.' }

  const alreadyJoined = humanPlayers.some((p: { player_id: string }) => p.player_id === user.id)
  if (alreadyJoined) redirect(`/lobby/${room.id}`)

  const takenColors = new Set(room.game_players.map((p: { color: string }) => p.color))
  if (chosenColor && takenColors.has(chosenColor)) return { error: 'That colour was just taken. Please pick another.' }

  const colorToUse = (chosenColor && !takenColors.has(chosenColor))
    ? chosenColor
    : COLORS.find(c => !takenColors.has(c))
  if (!colorToUse) return { error: 'No colour slots available.' }

  const stakeAmount = (room as any).stake ?? 0
  if (stakeAmount > 0) {
    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single()
    const balance = (profile as any)?.balance ?? 0
    if (balance < stakeAmount) {
      return { error: `This is a stake game. Entry fee: $${stakeAmount.toLocaleString()}. Your balance: $${balance.toLocaleString()}` }
    }
  }

  const maxTurnOrder = room.game_players.reduce(
    (max: number, p: { turn_order: number }) => Math.max(max, p.turn_order), -1
  )
  const turnOrder = maxTurnOrder + 1

  const { error: joinError } = await supabase
    .from('game_players')
    .insert({
      room_id: room.id,
      player_id: user.id,
      color: colorToUse,
      is_computer: false,
      turn_order: turnOrder,
      status: 'active',
    })

  if (joinError) return { error: joinError.message }

  // Deduct stake after successful join
  if (stakeAmount > 0) {
    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single()
    await supabase.from('profiles').update({ balance: ((profile as any)?.balance ?? 0) - stakeAmount } as any).eq('id', user.id)
  }

  redirect(`/lobby/${room.id}`)
}

export async function startGame(roomId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: room, error: roomError } = await supabase
    .from('game_rooms')
    .select('*, game_players(*)')
    .eq('id', roomId)
    .single()

  if (roomError || !room) return { error: 'Room not found' }
  if (room.host_id !== user.id) return { error: 'Only the host can start the game' }

  const players = room.game_players
  if (players.length < 2) return { error: 'Need at least 2 players to start' }

  const colors: Color[] = players.map((p: { color: Color }) => p.color)
  const tokens = buildInitialTokens(colors)

  const { error: stateError } = await supabase
    .from('game_states')
    .insert({
      room_id: roomId,
      current_player_order: 0,
      dice_value: null,
      phase: 'roll',
      tokens: tokens,
    })

  if (stateError) return { error: stateError.message }

  const { error: updateError } = await supabase
    .from('game_rooms')
    .update({ status: 'playing', started_at: new Date().toISOString() })
    .eq('id', roomId)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/lobby/${roomId}`)
  redirect(`/game/${roomId}`)
}

export async function leaveRoom(roomId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get leaving player's turn_order before marking forfeited
  const { data: myPlayer } = await supabase
    .from('game_players')
    .select('color, turn_order')
    .eq('room_id', roomId)
    .eq('player_id', user.id)
    .single()

  const { error: forfeitError } = await supabase
    .from('game_players')
    .update({ status: 'forfeited' })
    .eq('room_id', roomId)
    .eq('player_id', user.id)

  if (forfeitError) {
    console.error('[leaveRoom] failed to set forfeited status:', forfeitError.message)
    return { error: 'Could not leave game. Please run the RLS fix in Supabase: ALTER POLICY or add UPDATE policy for game_players.' }
  }

  const { data: room } = await supabase
    .from('game_rooms')
    .select('status')
    .eq('id', roomId)
    .single()

  if (room?.status === 'playing') {
    const { data: allPlayers } = await supabase
      .from('game_players')
      .select('player_id, turn_order, status, is_computer')
      .eq('room_id', roomId)
      .order('turn_order')

    const { data: gameState } = await supabase
      .from('game_states')
      .select('current_player_order, phase')
      .eq('room_id', roomId)
      .single()

    if (allPlayers && gameState) {
      // Active = not this player and either computer or still active human
      const remaining = allPlayers.filter(p =>
        p.player_id !== user.id && (p.is_computer || p.status === 'active')
      )

      if (remaining.length <= 1) {
        // End the game — only 0 or 1 player(s) left
        await supabase
          .from('game_rooms')
          .update({ status: 'finished', finished_at: new Date().toISOString() })
          .eq('id', roomId)
        await supabase
          .from('game_states')
          .update({ phase: 'finished', updated_at: new Date().toISOString() })
          .eq('room_id', roomId)
      } else if (myPlayer && gameState.current_player_order === myPlayer.turn_order) {
        // It was this player's turn — advance to next active player
        const count = allPlayers.length
        let next = (myPlayer.turn_order + 1) % count
        for (let i = 0; i < count; i++) {
          const candidate = allPlayers.find(p => p.turn_order === next)
          if (candidate && candidate.player_id !== user.id &&
              (candidate.is_computer || candidate.status === 'active')) break
          next = (next + 1) % count
        }
        await supabase
          .from('game_states')
          .update({ current_player_order: next, dice_value: null, phase: 'roll', updated_at: new Date().toISOString() })
          .eq('room_id', roomId)
      }
    }
  }

  return { success: true }
}

const WIN_REWARDS = [10000, 5000, 1000, 200] as const

export async function recordOnlineGameResult(rank: number, roomId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Idempotency: skip if already recorded for this room
  const { data: existing } = await supabase
    .from('game_history')
    .select('id')
    .eq('room_id', roomId)
    .eq('player_id', user.id)
    .maybeSingle()
  if (existing) return

  // Compute pot payout for winner
  let potPayout = 0
  const { data: roomData } = await supabase.from('game_rooms').select('stake').eq('id', roomId).single()
  const stake = (roomData as any)?.stake ?? 0
  if (rank === 1 && stake > 0) {
    const { count } = await supabase
      .from('game_players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('is_computer', false)
    potPayout = stake * (count ?? 0)
  }

  const reward = WIN_REWARDS[Math.min(rank - 1, WIN_REWARDS.length - 1)]
  const totalReward = reward + potPayout

  const { data: current } = await supabase
    .from('profiles')
    .select('games_played, wins, balance')
    .eq('id', user.id)
    .single()

  if (!current) return

  await supabase
    .from('profiles')
    .update({
      games_played: (current.games_played ?? 0) + 1,
      wins: (current.wins ?? 0) + (rank === 1 ? 1 : 0),
      balance: ((current as any).balance ?? 0) + totalReward,
    } as any)
    .eq('id', user.id)

  // Record history for idempotency
  await supabase.from('game_history').insert({
    room_id: roomId,
    player_id: user.id,
    rank,
    mode: 'online',
  })
}

export async function sendInvitation(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const roomId = formData.get('roomId') as string
  const phonesRaw = formData.get('phones') as string
  const phones = phonesRaw.split(',').map(p => p.trim()).filter(Boolean)

  if (phones.length === 0) return { error: 'No phone numbers provided' }
  if (phones.length > 3) return { error: 'Maximum 3 invitations per game' }

  const { data: room } = await supabase
    .from('game_rooms')
    .select('room_code, name')
    .eq('id', roomId)
    .single()

  if (!room) return { error: 'Room not found' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const inviterName = profile?.display_name ?? 'Someone'

  const invitations = phones.map(phone => ({
    room_id: roomId,
    invited_phone: phone,
    invited_by: user.id,
    status: 'pending',
  }))

  const { error } = await supabase.from('invitations').insert(invitations)
  if (error) return { error: error.message }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const smsResults = await Promise.allSettled(
    phones.map(phone =>
      fetch(`${appUrl}/api/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, inviterName, roomCode: room.room_code, roomId }),
      })
    )
  )

  const failed = smsResults.filter(r => r.status === 'rejected').length
  if (failed > 0) return { warning: `${failed} SMS(es) could not be sent, but invitations were saved.`, success: true }

  return { success: true, message: `Invited ${phones.length} friend(s)!` }
}
