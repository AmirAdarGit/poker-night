-- =============================================================================
-- Migration: v2 (auth + game_players) → v3 (name-based players, open edits)
--
-- Run this in your Supabase SQL editor IF you already ran the v2 schema and
-- don't want to wipe your data. It only changes the policies/tables that
-- differ in v3 — your existing games and profiles stay intact.
--
-- If you've never run the schema, just run schema.sql instead.
-- =============================================================================

-- 1. Drop the unused link table.
drop table if exists public.game_players cascade;

-- 2. Loosen the games UPDATE policy: anyone with a game ID can update it.
drop policy if exists "host can update own games" on public.games;

create policy "anyone can update games"
  on public.games for update
  using (true)
  with check (true);
