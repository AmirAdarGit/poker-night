-- =============================================================================
-- Poker Night — import 12 historical games into group "חמישי שמח אצל זולא"
-- Group + player ids hardcoded (resolved from the DB) — no name matching.
-- Names base64-encoded (RTL-safe). Idempotent: on conflict (id) do nothing.
-- =============================================================================
insert into public.games (id, host_id, group_id, state, completed_at, created_at, updated_at)
values
  ('imp01', null, 'f5f2634e-5479-4cf9-aa28-25f33abb181d'::uuid,
   jsonb_build_object('phase','settlement','players', jsonb_build_array(
    jsonb_build_object('id','a810be84-7b36-4070-a1d7-8d370c97351b','rosterId','a810be84-7b36-4070-a1d7-8d370c97351b','name',convert_from(decode('15DXnteZ16g=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',315,'joinedAt',1773432000000),
    jsonb_build_object('id','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','rosterId','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','name',convert_from(decode('16nXqdeV158=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',460,'joinedAt',1773432000000),
    jsonb_build_object('id','682ba926-1345-4905-a555-b502ae79e52f','rosterId','682ba926-1345-4905-a555-b502ae79e52f','name',convert_from(decode('16jXlg==','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',16,'joinedAt',1773432000000),
    jsonb_build_object('id','a0b28360-3af0-4b0d-826e-adba18a4f394','rosterId','a0b28360-3af0-4b0d-826e-adba18a4f394','name',convert_from(decode('16LXldee16jXmQ==','base64'),'utf8'),'buyIns',jsonb_build_array(50),'cashedOut',0,'joinedAt',1773432000000),
    jsonb_build_object('id','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','rosterId','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','name',convert_from(decode('15nXqNeT158=','base64'),'utf8'),'buyIns',jsonb_build_array(140),'cashedOut',0,'joinedAt',1773432000000),
    jsonb_build_object('id','6947c74f-764d-4ba8-b581-f502edf600ac','rosterId','6947c74f-764d-4ba8-b581-f502edf600ac','name',convert_from(decode('15DXmdeZ15w=','base64'),'utf8'),'buyIns',jsonb_build_array(151),'cashedOut',0,'joinedAt',1773432000000),
    jsonb_build_object('id','e830e0df-896d-4d14-80ca-aeebf8e52ee2','rosterId','e830e0df-896d-4d14-80ca-aeebf8e52ee2','name',convert_from(decode('15DXmdeq15k=','base64'),'utf8'),'buyIns',jsonb_build_array(150),'cashedOut',0,'joinedAt',1773432000000),
    jsonb_build_object('id','b0fda376-f44b-4f53-bf9a-cd21f43fe731','rosterId','b0fda376-f44b-4f53-bf9a-cd21f43fe731','name',convert_from(decode('15bXldec15A=','base64'),'utf8'),'buyIns',jsonb_build_array(300),'cashedOut',0,'joinedAt',1773432000000)
   )),
   '2026-03-13T20:00:00Z'::timestamptz, '2026-03-13T20:00:00Z'::timestamptz, '2026-03-13T20:00:00Z'::timestamptz),
  ('imp02', null, 'f5f2634e-5479-4cf9-aa28-25f33abb181d'::uuid,
   jsonb_build_object('phase','settlement','players', jsonb_build_array(
    jsonb_build_object('id','a0b28360-3af0-4b0d-826e-adba18a4f394','rosterId','a0b28360-3af0-4b0d-826e-adba18a4f394','name',convert_from(decode('16LXldee16jXmQ==','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',400,'joinedAt',1774036800000),
    jsonb_build_object('id','3868c7b8-7df6-4fed-9e05-90dae08badf9','rosterId','3868c7b8-7df6-4fed-9e05-90dae08badf9','name',convert_from(decode('16LXnteZ16o=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',196,'joinedAt',1774036800000),
    jsonb_build_object('id','e830e0df-896d-4d14-80ca-aeebf8e52ee2','rosterId','e830e0df-896d-4d14-80ca-aeebf8e52ee2','name',convert_from(decode('15DXmdeq15k=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',60,'joinedAt',1774036800000),
    jsonb_build_object('id','6947c74f-764d-4ba8-b581-f502edf600ac','rosterId','6947c74f-764d-4ba8-b581-f502edf600ac','name',convert_from(decode('15DXmdeZ15w=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',5,'joinedAt',1774036800000),
    jsonb_build_object('id','a810be84-7b36-4070-a1d7-8d370c97351b','rosterId','a810be84-7b36-4070-a1d7-8d370c97351b','name',convert_from(decode('15DXnteZ16g=','base64'),'utf8'),'buyIns',jsonb_build_array(50),'cashedOut',0,'joinedAt',1774036800000),
    jsonb_build_object('id','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','rosterId','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','name',convert_from(decode('15nXqNeT158=','base64'),'utf8'),'buyIns',jsonb_build_array(115),'cashedOut',0,'joinedAt',1774036800000),
    jsonb_build_object('id','b0fda376-f44b-4f53-bf9a-cd21f43fe731','rosterId','b0fda376-f44b-4f53-bf9a-cd21f43fe731','name',convert_from(decode('15bXldec15A=','base64'),'utf8'),'buyIns',jsonb_build_array(196),'cashedOut',0,'joinedAt',1774036800000),
    jsonb_build_object('id','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','rosterId','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','name',convert_from(decode('16nXqdeV158=','base64'),'utf8'),'buyIns',jsonb_build_array(300),'cashedOut',0,'joinedAt',1774036800000)
   )),
   '2026-03-20T20:00:00Z'::timestamptz, '2026-03-20T20:00:00Z'::timestamptz, '2026-03-20T20:00:00Z'::timestamptz),
  ('imp03', null, 'f5f2634e-5479-4cf9-aa28-25f33abb181d'::uuid,
   jsonb_build_object('phase','settlement','players', jsonb_build_array(
    jsonb_build_object('id','e830e0df-896d-4d14-80ca-aeebf8e52ee2','rosterId','e830e0df-896d-4d14-80ca-aeebf8e52ee2','name',convert_from(decode('15DXmdeq15k=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',145,'joinedAt',1774641600000),
    jsonb_build_object('id','682ba926-1345-4905-a555-b502ae79e52f','rosterId','682ba926-1345-4905-a555-b502ae79e52f','name',convert_from(decode('16jXlg==','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',130,'joinedAt',1774641600000),
    jsonb_build_object('id','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','rosterId','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','name',convert_from(decode('16nXqdeV158=','base64'),'utf8'),'buyIns',jsonb_build_array(58),'cashedOut',0,'joinedAt',1774641600000),
    jsonb_build_object('id','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','rosterId','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','name',convert_from(decode('15nXqNeT158=','base64'),'utf8'),'buyIns',jsonb_build_array(50),'cashedOut',0,'joinedAt',1774641600000),
    jsonb_build_object('id','a810be84-7b36-4070-a1d7-8d370c97351b','rosterId','a810be84-7b36-4070-a1d7-8d370c97351b','name',convert_from(decode('15DXnteZ16g=','base64'),'utf8'),'buyIns',jsonb_build_array(200),'cashedOut',0,'joinedAt',1774641600000),
    jsonb_build_object('id','b0fda376-f44b-4f53-bf9a-cd21f43fe731','rosterId','b0fda376-f44b-4f53-bf9a-cd21f43fe731','name',convert_from(decode('15bXldec15A=','base64'),'utf8'),'buyIns',jsonb_build_array(220),'cashedOut',0,'joinedAt',1774641600000),
    jsonb_build_object('id','a0b28360-3af0-4b0d-826e-adba18a4f394','rosterId','a0b28360-3af0-4b0d-826e-adba18a4f394','name',convert_from(decode('16LXldee16jXmQ==','base64'),'utf8'),'buyIns',jsonb_build_array(255),'cashedOut',0,'joinedAt',1774641600000)
   )),
   '2026-03-27T20:00:00Z'::timestamptz, '2026-03-27T20:00:00Z'::timestamptz, '2026-03-27T20:00:00Z'::timestamptz),
  ('imp04', null, 'f5f2634e-5479-4cf9-aa28-25f33abb181d'::uuid,
   jsonb_build_object('phase','settlement','players', jsonb_build_array(
    jsonb_build_object('id','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','rosterId','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','name',convert_from(decode('15nXqNeT158=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',370,'joinedAt',1775246400000),
    jsonb_build_object('id','e830e0df-896d-4d14-80ca-aeebf8e52ee2','rosterId','e830e0df-896d-4d14-80ca-aeebf8e52ee2','name',convert_from(decode('15DXmdeq15k=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',110,'joinedAt',1775246400000),
    jsonb_build_object('id','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','rosterId','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','name',convert_from(decode('16nXqdeV158=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',71,'joinedAt',1775246400000),
    jsonb_build_object('id','3868c7b8-7df6-4fed-9e05-90dae08badf9','rosterId','3868c7b8-7df6-4fed-9e05-90dae08badf9','name',convert_from(decode('16LXnteZ16o=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',70,'joinedAt',1775246400000),
    jsonb_build_object('id','682ba926-1345-4905-a555-b502ae79e52f','rosterId','682ba926-1345-4905-a555-b502ae79e52f','name',convert_from(decode('16jXlg==','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',15,'joinedAt',1775246400000),
    jsonb_build_object('id','a810be84-7b36-4070-a1d7-8d370c97351b','rosterId','a810be84-7b36-4070-a1d7-8d370c97351b','name',convert_from(decode('15DXnteZ16g=','base64'),'utf8'),'buyIns',jsonb_build_array(50),'cashedOut',0,'joinedAt',1775246400000),
    jsonb_build_object('id','6947c74f-764d-4ba8-b581-f502edf600ac','rosterId','6947c74f-764d-4ba8-b581-f502edf600ac','name',convert_from(decode('15DXmdeZ15w=','base64'),'utf8'),'buyIns',jsonb_build_array(200),'cashedOut',0,'joinedAt',1775246400000),
    jsonb_build_object('id','b0fda376-f44b-4f53-bf9a-cd21f43fe731','rosterId','b0fda376-f44b-4f53-bf9a-cd21f43fe731','name',convert_from(decode('15bXldec15A=','base64'),'utf8'),'buyIns',jsonb_build_array(450),'cashedOut',0,'joinedAt',1775246400000)
   )),
   '2026-04-03T20:00:00Z'::timestamptz, '2026-04-03T20:00:00Z'::timestamptz, '2026-04-03T20:00:00Z'::timestamptz),
  ('imp05', null, 'f5f2634e-5479-4cf9-aa28-25f33abb181d'::uuid,
   jsonb_build_object('phase','settlement','players', jsonb_build_array(
    jsonb_build_object('id','b0fda376-f44b-4f53-bf9a-cd21f43fe731','rosterId','b0fda376-f44b-4f53-bf9a-cd21f43fe731','name',convert_from(decode('15bXldec15A=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',300,'joinedAt',1775851200000),
    jsonb_build_object('id','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','rosterId','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','name',convert_from(decode('16nXqdeV158=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',120,'joinedAt',1775851200000),
    jsonb_build_object('id','a810be84-7b36-4070-a1d7-8d370c97351b','rosterId','a810be84-7b36-4070-a1d7-8d370c97351b','name',convert_from(decode('15DXnteZ16g=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',45,'joinedAt',1775851200000),
    jsonb_build_object('id','6947c74f-764d-4ba8-b581-f502edf600ac','rosterId','6947c74f-764d-4ba8-b581-f502edf600ac','name',convert_from(decode('15DXmdeZ15w=','base64'),'utf8'),'buyIns',jsonb_build_array(50),'cashedOut',0,'joinedAt',1775851200000),
    jsonb_build_object('id','3868c7b8-7df6-4fed-9e05-90dae08badf9','rosterId','3868c7b8-7df6-4fed-9e05-90dae08badf9','name',convert_from(decode('16LXnteZ16o=','base64'),'utf8'),'buyIns',jsonb_build_array(200),'cashedOut',0,'joinedAt',1775851200000),
    jsonb_build_object('id','e830e0df-896d-4d14-80ca-aeebf8e52ee2','rosterId','e830e0df-896d-4d14-80ca-aeebf8e52ee2','name',convert_from(decode('15DXmdeq15k=','base64'),'utf8'),'buyIns',jsonb_build_array(212),'cashedOut',0,'joinedAt',1775851200000)
   )),
   '2026-04-10T20:00:00Z'::timestamptz, '2026-04-10T20:00:00Z'::timestamptz, '2026-04-10T20:00:00Z'::timestamptz),
  ('imp06', null, 'f5f2634e-5479-4cf9-aa28-25f33abb181d'::uuid,
   jsonb_build_object('phase','settlement','players', jsonb_build_array(
    jsonb_build_object('id','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','rosterId','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','name',convert_from(decode('15nXqNeT158=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',57,'joinedAt',1776456000000),
    jsonb_build_object('id','6947c74f-764d-4ba8-b581-f502edf600ac','rosterId','6947c74f-764d-4ba8-b581-f502edf600ac','name',convert_from(decode('15DXmdeZ15w=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',50,'joinedAt',1776456000000),
    jsonb_build_object('id','a810be84-7b36-4070-a1d7-8d370c97351b','rosterId','a810be84-7b36-4070-a1d7-8d370c97351b','name',convert_from(decode('15DXnteZ16g=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',20,'joinedAt',1776456000000),
    jsonb_build_object('id','bad9401c-e260-41bb-b421-65983b97709e','rosterId','bad9401c-e260-41bb-b421-65983b97709e','name',convert_from(decode('15DXmdeq157XqA==','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',17,'joinedAt',1776456000000),
    jsonb_build_object('id','682ba926-1345-4905-a555-b502ae79e52f','rosterId','682ba926-1345-4905-a555-b502ae79e52f','name',convert_from(decode('16jXlg==','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',10,'joinedAt',1776456000000),
    jsonb_build_object('id','b0fda376-f44b-4f53-bf9a-cd21f43fe731','rosterId','b0fda376-f44b-4f53-bf9a-cd21f43fe731','name',convert_from(decode('15bXldec15A=','base64'),'utf8'),'buyIns',jsonb_build_array(120),'cashedOut',0,'joinedAt',1776456000000)
   )),
   '2026-04-17T20:00:00Z'::timestamptz, '2026-04-17T20:00:00Z'::timestamptz, '2026-04-17T20:00:00Z'::timestamptz),
  ('imp07', null, 'f5f2634e-5479-4cf9-aa28-25f33abb181d'::uuid,
   jsonb_build_object('phase','settlement','players', jsonb_build_array(
    jsonb_build_object('id','682ba926-1345-4905-a555-b502ae79e52f','rosterId','682ba926-1345-4905-a555-b502ae79e52f','name',convert_from(decode('16jXlg==','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',275,'joinedAt',1777060800000),
    jsonb_build_object('id','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','rosterId','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','name',convert_from(decode('16nXqdeV158=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',125,'joinedAt',1777060800000),
    jsonb_build_object('id','a810be84-7b36-4070-a1d7-8d370c97351b','rosterId','a810be84-7b36-4070-a1d7-8d370c97351b','name',convert_from(decode('15DXnteZ16g=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',90,'joinedAt',1777060800000),
    jsonb_build_object('id','6947c74f-764d-4ba8-b581-f502edf600ac','rosterId','6947c74f-764d-4ba8-b581-f502edf600ac','name',convert_from(decode('15DXmdeZ15w=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',75,'joinedAt',1777060800000),
    jsonb_build_object('id','a0b28360-3af0-4b0d-826e-adba18a4f394','rosterId','a0b28360-3af0-4b0d-826e-adba18a4f394','name',convert_from(decode('16LXldee16jXmQ==','base64'),'utf8'),'buyIns',jsonb_build_array(50),'cashedOut',0,'joinedAt',1777060800000),
    jsonb_build_object('id','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','rosterId','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','name',convert_from(decode('15nXqNeT158=','base64'),'utf8'),'buyIns',jsonb_build_array(50),'cashedOut',0,'joinedAt',1777060800000),
    jsonb_build_object('id','b0fda376-f44b-4f53-bf9a-cd21f43fe731','rosterId','b0fda376-f44b-4f53-bf9a-cd21f43fe731','name',convert_from(decode('15bXldec15A=','base64'),'utf8'),'buyIns',jsonb_build_array(440),'cashedOut',0,'joinedAt',1777060800000)
   )),
   '2026-04-24T20:00:00Z'::timestamptz, '2026-04-24T20:00:00Z'::timestamptz, '2026-04-24T20:00:00Z'::timestamptz),
  ('imp08', null, 'f5f2634e-5479-4cf9-aa28-25f33abb181d'::uuid,
   jsonb_build_object('phase','settlement','players', jsonb_build_array(
    jsonb_build_object('id','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','rosterId','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','name',convert_from(decode('15nXqNeT158=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',240,'joinedAt',1777665600000),
    jsonb_build_object('id','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','rosterId','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','name',convert_from(decode('16nXqdeV158=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',150,'joinedAt',1777665600000),
    jsonb_build_object('id','a810be84-7b36-4070-a1d7-8d370c97351b','rosterId','a810be84-7b36-4070-a1d7-8d370c97351b','name',convert_from(decode('15DXnteZ16g=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',129,'joinedAt',1777665600000),
    jsonb_build_object('id','b0fda376-f44b-4f53-bf9a-cd21f43fe731','rosterId','b0fda376-f44b-4f53-bf9a-cd21f43fe731','name',convert_from(decode('15bXldec15A=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',44,'joinedAt',1777665600000),
    jsonb_build_object('id','6947c74f-764d-4ba8-b581-f502edf600ac','rosterId','6947c74f-764d-4ba8-b581-f502edf600ac','name',convert_from(decode('15DXmdeZ15w=','base64'),'utf8'),'buyIns',jsonb_build_array(21),'cashedOut',0,'joinedAt',1777665600000),
    jsonb_build_object('id','bad9401c-e260-41bb-b421-65983b97709e','rosterId','bad9401c-e260-41bb-b421-65983b97709e','name',convert_from(decode('15DXmdeq157XqA==','base64'),'utf8'),'buyIns',jsonb_build_array(100),'cashedOut',0,'joinedAt',1777665600000),
    jsonb_build_object('id','3868c7b8-7df6-4fed-9e05-90dae08badf9','rosterId','3868c7b8-7df6-4fed-9e05-90dae08badf9','name',convert_from(decode('16LXnteZ16o=','base64'),'utf8'),'buyIns',jsonb_build_array(48),'cashedOut',0,'joinedAt',1777665600000),
    jsonb_build_object('id','e830e0df-896d-4d14-80ca-aeebf8e52ee2','rosterId','e830e0df-896d-4d14-80ca-aeebf8e52ee2','name',convert_from(decode('15DXmdeq15k=','base64'),'utf8'),'buyIns',jsonb_build_array(129),'cashedOut',0,'joinedAt',1777665600000),
    jsonb_build_object('id','a0b28360-3af0-4b0d-826e-adba18a4f394','rosterId','a0b28360-3af0-4b0d-826e-adba18a4f394','name',convert_from(decode('16LXldee16jXmQ==','base64'),'utf8'),'buyIns',jsonb_build_array(215),'cashedOut',0,'joinedAt',1777665600000)
   )),
   '2026-05-01T20:00:00Z'::timestamptz, '2026-05-01T20:00:00Z'::timestamptz, '2026-05-01T20:00:00Z'::timestamptz),
  ('imp09', null, 'f5f2634e-5479-4cf9-aa28-25f33abb181d'::uuid,
   jsonb_build_object('phase','settlement','players', jsonb_build_array(
    jsonb_build_object('id','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','rosterId','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','name',convert_from(decode('15nXqNeT158=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',120,'joinedAt',1778270400000),
    jsonb_build_object('id','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','rosterId','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','name',convert_from(decode('16nXqdeV158=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',92,'joinedAt',1778270400000),
    jsonb_build_object('id','6947c74f-764d-4ba8-b581-f502edf600ac','rosterId','6947c74f-764d-4ba8-b581-f502edf600ac','name',convert_from(decode('15DXmdeZ15w=','base64'),'utf8'),'buyIns',jsonb_build_array(6),'cashedOut',0,'joinedAt',1778270400000),
    jsonb_build_object('id','e830e0df-896d-4d14-80ca-aeebf8e52ee2','rosterId','e830e0df-896d-4d14-80ca-aeebf8e52ee2','name',convert_from(decode('15DXmdeq15k=','base64'),'utf8'),'buyIns',jsonb_build_array(58),'cashedOut',0,'joinedAt',1778270400000),
    jsonb_build_object('id','a0b28360-3af0-4b0d-826e-adba18a4f394','rosterId','a0b28360-3af0-4b0d-826e-adba18a4f394','name',convert_from(decode('16LXldee16jXmQ==','base64'),'utf8'),'buyIns',jsonb_build_array(150),'cashedOut',0,'joinedAt',1778270400000)
   )),
   '2026-05-08T20:00:00Z'::timestamptz, '2026-05-08T20:00:00Z'::timestamptz, '2026-05-08T20:00:00Z'::timestamptz),
  ('imp10', null, 'f5f2634e-5479-4cf9-aa28-25f33abb181d'::uuid,
   jsonb_build_object('phase','settlement','players', jsonb_build_array(
    jsonb_build_object('id','a810be84-7b36-4070-a1d7-8d370c97351b','rosterId','a810be84-7b36-4070-a1d7-8d370c97351b','name',convert_from(decode('15DXnteZ16g=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',316,'joinedAt',1778875200000),
    jsonb_build_object('id','682ba926-1345-4905-a555-b502ae79e52f','rosterId','682ba926-1345-4905-a555-b502ae79e52f','name',convert_from(decode('16jXlg==','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',140,'joinedAt',1778875200000),
    jsonb_build_object('id','b0fda376-f44b-4f53-bf9a-cd21f43fe731','rosterId','b0fda376-f44b-4f53-bf9a-cd21f43fe731','name',convert_from(decode('15bXldec15A=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',90,'joinedAt',1778875200000),
    jsonb_build_object('id','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','rosterId','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','name',convert_from(decode('15nXqNeT158=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',30,'joinedAt',1778875200000),
    jsonb_build_object('id','6947c74f-764d-4ba8-b581-f502edf600ac','rosterId','6947c74f-764d-4ba8-b581-f502edf600ac','name',convert_from(decode('15DXmdeZ15w=','base64'),'utf8'),'buyIns',jsonb_build_array(100),'cashedOut',0,'joinedAt',1778875200000),
    jsonb_build_object('id','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','rosterId','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','name',convert_from(decode('16nXqdeV158=','base64'),'utf8'),'buyIns',jsonb_build_array(206),'cashedOut',0,'joinedAt',1778875200000),
    jsonb_build_object('id','e830e0df-896d-4d14-80ca-aeebf8e52ee2','rosterId','e830e0df-896d-4d14-80ca-aeebf8e52ee2','name',convert_from(decode('15DXmdeq15k=','base64'),'utf8'),'buyIns',jsonb_build_array(262),'cashedOut',0,'joinedAt',1778875200000)
   )),
   '2026-05-15T20:00:00Z'::timestamptz, '2026-05-15T20:00:00Z'::timestamptz, '2026-05-15T20:00:00Z'::timestamptz),
  ('imp11', null, 'f5f2634e-5479-4cf9-aa28-25f33abb181d'::uuid,
   jsonb_build_object('phase','settlement','players', jsonb_build_array(
    jsonb_build_object('id','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','rosterId','7a3c0b00-1d77-4f97-bddf-d296c8b08b5b','name',convert_from(decode('16nXqdeV158=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',590,'joinedAt',1780084800000),
    jsonb_build_object('id','6947c74f-764d-4ba8-b581-f502edf600ac','rosterId','6947c74f-764d-4ba8-b581-f502edf600ac','name',convert_from(decode('15DXmdeZ15w=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',160,'joinedAt',1780084800000),
    jsonb_build_object('id','682ba926-1345-4905-a555-b502ae79e52f','rosterId','682ba926-1345-4905-a555-b502ae79e52f','name',convert_from(decode('16jXlg==','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',106,'joinedAt',1780084800000),
    jsonb_build_object('id','e830e0df-896d-4d14-80ca-aeebf8e52ee2','rosterId','e830e0df-896d-4d14-80ca-aeebf8e52ee2','name',convert_from(decode('15DXmdeq15k=','base64'),'utf8'),'buyIns',jsonb_build_array(88),'cashedOut',0,'joinedAt',1780084800000),
    jsonb_build_object('id','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','rosterId','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','name',convert_from(decode('15nXqNeT158=','base64'),'utf8'),'buyIns',jsonb_build_array(150),'cashedOut',0,'joinedAt',1780084800000),
    jsonb_build_object('id','a810be84-7b36-4070-a1d7-8d370c97351b','rosterId','a810be84-7b36-4070-a1d7-8d370c97351b','name',convert_from(decode('15DXnteZ16g=','base64'),'utf8'),'buyIns',jsonb_build_array(250),'cashedOut',0,'joinedAt',1780084800000),
    jsonb_build_object('id','b0fda376-f44b-4f53-bf9a-cd21f43fe731','rosterId','b0fda376-f44b-4f53-bf9a-cd21f43fe731','name',convert_from(decode('15bXldec15A=','base64'),'utf8'),'buyIns',jsonb_build_array(300),'cashedOut',0,'joinedAt',1780084800000)
   )),
   '2026-05-29T20:00:00Z'::timestamptz, '2026-05-29T20:00:00Z'::timestamptz, '2026-05-29T20:00:00Z'::timestamptz),
  ('imp12', null, 'f5f2634e-5479-4cf9-aa28-25f33abb181d'::uuid,
   jsonb_build_object('phase','settlement','players', jsonb_build_array(
    jsonb_build_object('id','e830e0df-896d-4d14-80ca-aeebf8e52ee2','rosterId','e830e0df-896d-4d14-80ca-aeebf8e52ee2','name',convert_from(decode('15DXmdeq15k=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',100,'joinedAt',1780776000000),
    jsonb_build_object('id','6947c74f-764d-4ba8-b581-f502edf600ac','rosterId','6947c74f-764d-4ba8-b581-f502edf600ac','name',convert_from(decode('15DXmdeZ15w=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',40,'joinedAt',1780776000000),
    jsonb_build_object('id','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','rosterId','cf1f75ed-b3c9-4947-ac24-e79aba08f5a7','name',convert_from(decode('15nXqNeT158=','base64'),'utf8'),'buyIns',jsonb_build_array(0),'cashedOut',25,'joinedAt',1780776000000),
    jsonb_build_object('id','a810be84-7b36-4070-a1d7-8d370c97351b','rosterId','a810be84-7b36-4070-a1d7-8d370c97351b','name',convert_from(decode('15DXnteZ16g=','base64'),'utf8'),'buyIns',jsonb_build_array(185),'cashedOut',0,'joinedAt',1780776000000)
   )),
   '2026-06-06T20:00:00Z'::timestamptz, '2026-06-06T20:00:00Z'::timestamptz, '2026-06-06T20:00:00Z'::timestamptz)
on conflict (id) do nothing;
