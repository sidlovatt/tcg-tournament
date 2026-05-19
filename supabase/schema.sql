-- TCG Tournament Manager Schema
-- Run this in Supabase SQL Editor

create extension if not exists "uuid-ossp";

create table tournaments (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  type text not null check (type in ('swiss', 'single_elim', 'double_elim')),
  game text not null,
  format text not null check (format in ('bo1', 'bo3', 'custom')),
  timer_minutes integer not null,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'complete')),
  current_round integer not null default 0,
  total_rounds integer not null default 0,
  timer_started_at timestamptz,
  timer_paused_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create table players (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null,
  points integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  byes integer not null default 0,
  game_wins integer not null default 0,
  game_losses integer not null default 0,
  eliminated boolean not null default false,
  bracket_side text,
  seed integer,
  created_at timestamptz not null default now()
);

create table pairings (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  round integer not null,
  table_number integer not null,
  player1_id uuid not null references players(id),
  player2_id uuid references players(id),
  player1_game_wins integer not null default 0,
  player2_game_wins integer not null default 0,
  result text check (result in ('player1', 'player2', 'draw', 'pending')) default 'pending',
  submitted_by text,
  bracket_round text,
  created_at timestamptz not null default now()
);

create index idx_tournaments_code on tournaments(code);
create index idx_tournaments_expires on tournaments(expires_at);
create index idx_players_tournament on players(tournament_id);
create index idx_pairings_tournament_round on pairings(tournament_id, round);

-- RLS: open access, room code is the access control
alter table tournaments enable row level security;
alter table players enable row level security;
alter table pairings enable row level security;

create policy "open_tournaments" on tournaments for all using (true) with check (true);
create policy "open_players" on players for all using (true) with check (true);
create policy "open_pairings" on pairings for all using (true) with check (true);

-- Cleanup expired tournaments (schedule via Supabase Dashboard > Database > Functions > Cron)
create or replace function delete_expired_tournaments()
returns void language sql security definer as $$
  delete from tournaments where expires_at < now();
$$;

-- Enable realtime on all tables
alter publication supabase_realtime add table tournaments;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table pairings;
