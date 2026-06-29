-- Run this in the Supabase SQL Editor to set up the LudoLudo schema.

-- Profiles (extends auth.users, created automatically on signup)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  phone_number text unique,
  avatar_id int default 1,
  games_played int default 0,
  wins int default 0,
  losses int default 0,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can view all profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name, phone_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.phone
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Game rooms
create table if not exists game_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  name text,
  host_id uuid references profiles not null,
  status text default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  max_players int default 4 check (max_players between 2 and 4),
  fill_with_computers boolean default false,
  mode text default 'online' check (mode in ('computer', 'online')),
  created_at timestamptz default now(),
  started_at timestamptz,
  finished_at timestamptz
);

alter table game_rooms enable row level security;
create policy "Anyone can view game rooms" on game_rooms for select using (true);
create policy "Authenticated users can create rooms" on game_rooms for insert with check (auth.uid() = host_id);
create policy "Host can update room" on game_rooms for update using (auth.uid() = host_id);

-- Players in a game room (includes computer slots)
create table if not exists game_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references game_rooms on delete cascade not null,
  player_id uuid references profiles,
  color text not null check (color in ('red', 'blue', 'green', 'yellow')),
  is_computer boolean default false,
  difficulty text check (difficulty in ('easy', 'normal', 'hard')),
  turn_order int not null check (turn_order between 0 and 3),
  rank int,
  tokens_completed int default 0,
  captures_made int default 0,
  status text default 'active' check (status in ('active', 'disconnected', 'forfeited')),
  joined_at timestamptz default now(),
  unique (room_id, color),
  unique (room_id, turn_order)
);

alter table game_players enable row level security;
create policy "Anyone can view game players" on game_players for select using (true);
create policy "Authenticated users can join rooms" on game_players for insert with check (
  auth.uid() = player_id or is_computer = true
);
create policy "Players can update own slot" on game_players for update using (auth.uid() = player_id);

-- Live game state (one row per active room)
create table if not exists game_states (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references game_rooms on delete cascade unique not null,
  current_player_order int default 0,
  dice_value int,
  phase text default 'roll' check (phase in ('roll', 'move', 'finished')),
  -- 16 tokens: [{color, index, position}] where position: -1=home, 0-51=track, 52-56=final lane, 57=done
  tokens jsonb not null default '[]',
  last_activity timestamptz default now(),
  updated_at timestamptz default now()
);

alter table game_states enable row level security;
create policy "Anyone can view game state" on game_states for select using (true);
create policy "Authenticated users can update game state" on game_states for update using (auth.uid() is not null);
create policy "Authenticated users can insert game state" on game_states for insert with check (auth.uid() is not null);

-- Invitations sent via SMS
create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references game_rooms on delete cascade not null,
  invited_phone text not null,
  invited_by uuid references profiles not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at timestamptz default now()
);

alter table invitations enable row level security;
create policy "Host can manage invitations" on invitations for all using (auth.uid() = invited_by);
create policy "Anyone can view invitation by room" on invitations for select using (true);

-- Game history (one row per player per completed game)
create table if not exists game_history (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references game_rooms not null,
  player_id uuid references profiles not null,
  rank int not null,
  tokens_completed int default 0,
  captures_made int default 0,
  mode text not null check (mode in ('computer', 'online')),
  completed_at timestamptz default now()
);

alter table game_history enable row level security;
create policy "Users can view own history" on game_history for select using (auth.uid() = player_id);
create policy "Authenticated users can insert history" on game_history for insert with check (auth.uid() is not null);

-- Enable realtime for game_states and game_players
alter publication supabase_realtime add table game_states;
alter publication supabase_realtime add table game_players;
alter publication supabase_realtime add table game_rooms;
