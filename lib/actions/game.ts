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

export async function createGameRoom(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const maxPlayers = parseInt(formData.get('maxPlayers') as string) || 4
  const name = (formData.get('name') as string) || null
  const fillWithComputers = formData.get('fillWithComputers') === 'true'
  const hostColor = (formData.get('hostColor') as Color) || 'red'

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

  redirect(`/lobby/${room.id}`)
}

export async function joinGameByCode(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const code = (formData.get('code') as string).trim()

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
  const availableColor = COLORS.find(c => !takenColors.has(c))
  if (!availableColor) return { error: 'No colour slots available.' }

  const turnOrder = humanPlayers.length

  const { error: joinError } = await supabase
    .from('game_players')
    .insert({
      room_id: room.id,
      player_id: user.id,
      color: availableColor,
      is_computer: false,
      turn_order: turnOrder,
      status: 'active',
    })

  if (joinError) return { error: joinError.message }

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

  await supabase
    .from('game_players')
    .update({ status: 'forfeited' })
    .eq('room_id', roomId)
    .eq('player_id', user.id)

  return { success: true }
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
