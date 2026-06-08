-- =============================================================================
-- Poker Night — one-off import of 12 historical games into group
--   "חמישי שמח אצל זולא"
-- Net-only results (no buy-in data). Names base64-encoded so the SQL editor's
-- RTL rendering can't scramble them. Idempotent: on conflict (id) do nothing.
-- Run once in the Supabase SQL editor.
-- =============================================================================
with grp as (
  select id as gid, owner_id from public.groups
  where lower(btrim(name)) = lower(btrim(convert_from(decode('15fXnteZ16nXmSDXqdee15cg15DXptecINeW15XXnNeQ','base64'),'utf8')))
  limit 1
),
raw(idx, date_iso, name_b64, net) as (
  values
  ('imp01','2026-03-13','15DXnteZ16g=',315),
  ('imp01','2026-03-13','16nXqdeV158=',460),
  ('imp01','2026-03-13','16jXlg==',16),
  ('imp01','2026-03-13','16LXldee16jXmQ==',-50),
  ('imp01','2026-03-13','15nXqNeT158=',-140),
  ('imp01','2026-03-13','15DXmdeZ15w=',-151),
  ('imp01','2026-03-13','15DXmdeq15k=',-150),
  ('imp01','2026-03-13','15bXldec15A=',-300),
  ('imp02','2026-03-20','16LXldee16jXmQ==',400),
  ('imp02','2026-03-20','16LXnteZ16o=',196),
  ('imp02','2026-03-20','15DXmdeq15k=',60),
  ('imp02','2026-03-20','15DXmdeZ15w=',5),
  ('imp02','2026-03-20','15DXnteZ16g=',-50),
  ('imp02','2026-03-20','15nXqNeT158=',-115),
  ('imp02','2026-03-20','15bXldec15A=',-196),
  ('imp02','2026-03-20','16nXqdeV158=',-300),
  ('imp03','2026-03-27','15DXmdeq15k=',145),
  ('imp03','2026-03-27','16jXlg==',130),
  ('imp03','2026-03-27','16nXqdeV158=',-58),
  ('imp03','2026-03-27','15nXqNeT158=',-50),
  ('imp03','2026-03-27','15DXnteZ16g=',-200),
  ('imp03','2026-03-27','15bXldec15A=',-220),
  ('imp03','2026-03-27','16LXldee16jXmQ==',-255),
  ('imp04','2026-04-03','15nXqNeT158=',370),
  ('imp04','2026-04-03','15DXmdeq15k=',110),
  ('imp04','2026-04-03','16nXqdeV158=',71),
  ('imp04','2026-04-03','16LXnteZ16o=',70),
  ('imp04','2026-04-03','16jXlg==',15),
  ('imp04','2026-04-03','15DXnteZ16g=',-50),
  ('imp04','2026-04-03','15DXmdeZ15w=',-200),
  ('imp04','2026-04-03','15bXldec15A=',-450),
  ('imp05','2026-04-10','15bXldec15A=',300),
  ('imp05','2026-04-10','16nXqdeV158=',120),
  ('imp05','2026-04-10','15DXnteZ16g=',45),
  ('imp05','2026-04-10','15DXmdeZ15w=',-50),
  ('imp05','2026-04-10','16LXnteZ16o=',-200),
  ('imp05','2026-04-10','15DXmdeq15k=',-212),
  ('imp06','2026-04-17','15nXqNeT158=',57),
  ('imp06','2026-04-17','15DXmdeZ15w=',50),
  ('imp06','2026-04-17','15DXnteZ16g=',20),
  ('imp06','2026-04-17','15DXmdeq157XqA==',17),
  ('imp06','2026-04-17','16jXlg==',10),
  ('imp06','2026-04-17','15bXldec15A=',-120),
  ('imp07','2026-04-24','16jXlg==',275),
  ('imp07','2026-04-24','16nXqdeV158=',125),
  ('imp07','2026-04-24','15DXnteZ16g=',90),
  ('imp07','2026-04-24','15DXmdeZ15w=',75),
  ('imp07','2026-04-24','16LXldee16jXmQ==',-50),
  ('imp07','2026-04-24','15nXqNeT158=',-50),
  ('imp07','2026-04-24','15bXldec15A=',-440),
  ('imp08','2026-05-01','15nXqNeT158=',240),
  ('imp08','2026-05-01','16nXqdeV158=',150),
  ('imp08','2026-05-01','15DXnteZ16g=',129),
  ('imp08','2026-05-01','15bXldec15A=',44),
  ('imp08','2026-05-01','15DXmdeZ15w=',-21),
  ('imp08','2026-05-01','15DXmdeq157XqA==',-100),
  ('imp08','2026-05-01','16LXnteZ16o=',-48),
  ('imp08','2026-05-01','15DXmdeq15k=',-129),
  ('imp08','2026-05-01','16LXldee16jXmQ==',-215),
  ('imp09','2026-05-08','15nXqNeT158=',120),
  ('imp09','2026-05-08','16nXqdeV158=',92),
  ('imp09','2026-05-08','15DXmdeZ15w=',-6),
  ('imp09','2026-05-08','15DXmdeq15k=',-58),
  ('imp09','2026-05-08','16LXldee16jXmQ==',-150),
  ('imp10','2026-05-15','15DXnteZ16g=',316),
  ('imp10','2026-05-15','16jXlg==',140),
  ('imp10','2026-05-15','15bXldec15A=',90),
  ('imp10','2026-05-15','15nXqNeT158=',30),
  ('imp10','2026-05-15','15DXmdeZ15w=',-100),
  ('imp10','2026-05-15','16nXqdeV158=',-206),
  ('imp10','2026-05-15','15DXmdeq15k=',-262),
  ('imp11','2026-05-29','16nXqdeV158=',590),
  ('imp11','2026-05-29','15DXmdeZ15w=',160),
  ('imp11','2026-05-29','16jXlg==',106),
  ('imp11','2026-05-29','15DXmdeq15k=',-88),
  ('imp11','2026-05-29','15nXqNeT158=',-150),
  ('imp11','2026-05-29','15DXnteZ16g=',-250),
  ('imp11','2026-05-29','15bXldec15A=',-300),
  ('imp12','2026-06-06','15DXmdeq15k=',100),
  ('imp12','2026-06-06','15DXmdeZ15w=',40),
  ('imp12','2026-06-06','15nXqNeT158=',25),
  ('imp12','2026-06-06','15DXnteZ16g=',-185)
),
resolved as (
  select r.idx, r.date_iso,
    jsonb_build_object(
      'id', rp.id::text,
      'rosterId', rp.id::text,
      'name', rp.name,
      'buyIns', case when r.net < 0 then jsonb_build_array(-r.net) else jsonb_build_array(0) end,
      'cashedOut', case when r.net > 0 then r.net else 0 end,
      'joinedAt', (extract(epoch from (r.date_iso||'T20:00:00Z')::timestamptz)*1000)::bigint
    ) as player
  from raw r
  cross join grp
  join public.roster_players rp
    on rp.group_id = grp.gid
   and lower(btrim(rp.name)) = lower(btrim(convert_from(decode(r.name_b64,'base64'),'utf8')))
),
agg as (
  select idx, min(date_iso) as date_iso, jsonb_agg(player) as players
  from resolved group by idx
)
insert into public.games (id, host_id, group_id, state, completed_at, created_at, updated_at)
select
  r.idx,
  grp.owner_id,
  grp.gid,
  jsonb_build_object('phase','settlement','players', a.players),
  (a.date_iso||'T20:00:00Z')::timestamptz,
  (a.date_iso||'T20:00:00Z')::timestamptz,
  (a.date_iso||'T20:00:00Z')::timestamptz
from agg a
join (select distinct idx from raw) r on r.idx = a.idx
cross join grp
on conflict (id) do nothing;
