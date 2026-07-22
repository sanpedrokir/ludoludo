import { pgTable, pgEnum, text, integer, boolean, timestamp, jsonb, date, uuid, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import type { TokenState } from '@/lib/game/types'

export const roomStatusEnum = pgEnum('room_status', ['waiting', 'playing', 'finished'])
export const roomModeEnum = pgEnum('room_mode', ['computer', 'online'])
export const playerColorEnum = pgEnum('player_color', ['red', 'blue', 'green', 'yellow'])
export const playerDifficultyEnum = pgEnum('player_difficulty', ['easy', 'normal', 'hard'])
export const playerStatusEnum = pgEnum('player_status', ['active', 'disconnected', 'forfeited'])
export const gamePhaseEnum = pgEnum('game_phase', ['roll', 'move', 'finished'])
export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'expired'])

// Primary key is the Clerk user id (e.g. "user_xxx") — no in-DB FK to an auth
// table, since auth no longer lives in this Postgres instance.
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  phoneNumber: text('phone_number').unique(),
  avatarId: integer('avatar_id').notNull().default(1),
  gamesPlayed: integer('games_played').notNull().default(0),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  balance: integer('balance').notNull().default(0),
  lastDailyReward: date('last_daily_reward'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const gameRooms = pgTable('game_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomCode: text('room_code').notNull().unique(),
  name: text('name'),
  hostId: text('host_id').notNull().references(() => profiles.id),
  status: roomStatusEnum('status').notNull().default('waiting'),
  maxPlayers: integer('max_players').notNull().default(4),
  fillWithComputers: boolean('fill_with_computers').notNull().default(false),
  mode: roomModeEnum('mode').notNull().default('online'),
  stake: integer('stake').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
})

export const gamePlayers = pgTable('game_players', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => gameRooms.id, { onDelete: 'cascade' }),
  playerId: text('player_id').references(() => profiles.id),
  color: playerColorEnum('color').notNull(),
  isComputer: boolean('is_computer').notNull().default(false),
  difficulty: playerDifficultyEnum('difficulty'),
  turnOrder: integer('turn_order').notNull(),
  rank: integer('rank'),
  tokensCompleted: integer('tokens_completed').notNull().default(0),
  capturesMade: integer('captures_made').notNull().default(0),
  status: playerStatusEnum('status').notNull().default('active'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.roomId, t.color),
  unique().on(t.roomId, t.turnOrder),
])

export const gameStates = pgTable('game_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().unique().references(() => gameRooms.id, { onDelete: 'cascade' }),
  currentPlayerOrder: integer('current_player_order').notNull().default(0),
  diceValue: integer('dice_value'),
  phase: gamePhaseEnum('phase').notNull().default('roll'),
  // 16 tokens: [{color, index, position}] where position: -1=home, 0-51=track, 52-56=final lane, 57=done
  tokens: jsonb('tokens').$type<TokenState[]>().notNull().default([]),
  lastActivity: timestamp('last_activity', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => gameRooms.id, { onDelete: 'cascade' }),
  invitedPhone: text('invited_phone').notNull(),
  invitedBy: text('invited_by').notNull().references(() => profiles.id),
  status: invitationStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const gameHistory = pgTable('game_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => gameRooms.id),
  playerId: text('player_id').notNull().references(() => profiles.id),
  rank: integer('rank').notNull(),
  tokensCompleted: integer('tokens_completed').notNull().default(0),
  capturesMade: integer('captures_made').notNull().default(0),
  mode: roomModeEnum('mode').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
})

// Two independent, functionally-duplicate ownership tables carried over as-is
// from the pre-migration app (purchaseItem() vs buyItem() write to different
// tables) — a pre-existing inconsistency, not fixed as part of this migration.
export const userCollection = pgTable('user_collection', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => profiles.id),
  itemId: text('item_id').notNull(),
})

export const purchases = pgTable('purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => profiles.id),
  itemId: text('item_id').notNull(),
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => gameRooms.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => profiles.id),
  displayName: text('display_name').notNull(),
  avatarId: integer('avatar_id').notNull().default(1),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const gameRoomsRelations = relations(gameRooms, ({ many }) => ({
  gamePlayers: many(gamePlayers),
}))

export const gamePlayersRelations = relations(gamePlayers, ({ one }) => ({
  room: one(gameRooms, { fields: [gamePlayers.roomId], references: [gameRooms.id] }),
  profile: one(profiles, { fields: [gamePlayers.playerId], references: [profiles.id] }),
}))

export const gameHistoryRelations = relations(gameHistory, ({ one }) => ({
  room: one(gameRooms, { fields: [gameHistory.roomId], references: [gameRooms.id] }),
}))
