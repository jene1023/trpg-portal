-- CoC Portal Database Schema

-- キャラクターテーブル
create table characters (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  player_name   text,
  portrait_url  text,
  occupation    text,
  catchphrase   text,
  age           integer,
  gender        text,
  scenario_name text,
  status        text not null default 'alive'
                check (status in ('alive', 'dead', 'insane', 'retired')),

  -- CoC 7版 能力値
  str           integer not null default 50,
  con           integer not null default 50,
  pow           integer not null default 50,
  dex           integer not null default 50,
  app           integer not null default 50,
  siz           integer not null default 50,
  int_stat      integer not null default 50,
  edu           integer not null default 50,

  -- 派生ステータス (セッションで変動するため別保存)
  hp_max        integer not null default 10,
  hp_current    integer not null default 10,
  mp_max        integer not null default 10,
  mp_current    integer not null default 10,
  san_start     integer not null default 50,
  san_current   integer not null default 50,
  san_max       integer not null default 99,
  luck          integer not null default 50,

  background    text,
  notes         text,

  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- スキルテーブル
create table character_skills (
  id             uuid primary key default gen_random_uuid(),
  character_id   uuid not null references characters(id) on delete cascade,
  skill_name     text not null,
  base_value     integer not null default 0,
  current_value  integer not null default 0,
  is_occupation  boolean not null default false,
  created_at     timestamptz default now(),
  unique (character_id, skill_name)
);

-- 素材ライブラリ（将来用）
create table materials (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  type         text not null check (type in ('portrait', 'background', 'other')),
  storage_url  text not null,
  tags         text[] default '{}',
  created_at   timestamptz default now()
);

-- updated_at 自動更新トリガー
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger characters_updated_at
  before update on characters
  for each row execute function set_updated_at();

-- Row Level Security
alter table characters enable row level security;
alter table character_skills enable row level security;
alter table materials enable row level security;

-- 個人使用のため anon に全権限（将来ログイン認証追加時に絞り込む）
create policy "allow all for anon" on characters for all using (true) with check (true);
create policy "allow all for anon" on character_skills for all using (true) with check (true);
create policy "allow all for anon" on materials for all using (true) with check (true);

-- Storage: character-portraits バケットを作成後に実行
-- insert into storage.buckets (id, name, public) values ('character-portraits', 'character-portraits', true);

-- 技能成長チェックフラグ (追加マイグレーション)
alter table character_skills add column if not exists growth_checked boolean not null default false;

-- セッションログテーブル (追加マイグレーション)
create table if not exists sessions (
  id             uuid primary key default gen_random_uuid(),
  character_id   uuid not null references characters(id) on delete cascade,
  session_number integer not null default 1,
  title          text not null,
  summary        text,
  san_loss       integer not null default 0,
  hp_loss        integer not null default 0,
  played_at      date,
  created_at     timestamptz default now()
);

alter table sessions enable row level security;
create policy "allow all for anon" on sessions for all using (true) with check (true);

-- シナリオテーブル (追加マイグレーション)
create table if not exists scenarios (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  synopsis   text,
  gm_notes   text,
  status     text not null default 'planning'
             check (status in ('planning', 'ongoing', 'completed')),
  played_at  date,
  created_at timestamptz default now()
);

alter table scenarios enable row level security;
create policy "allow all for anon" on scenarios for all using (true) with check (true);

-- シナリオ参加キャラクターテーブル (追加マイグレーション)
create table if not exists scenario_participants (
  id           uuid primary key default gen_random_uuid(),
  scenario_id  uuid not null references scenarios(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  created_at   timestamptz default now(),
  unique (scenario_id, character_id)
);

alter table scenario_participants enable row level security;
create policy "allow all for anon" on scenario_participants for all using (true) with check (true);

-- 出欠管理カラム追加 (追加マイグレーション)
alter table scenario_participants
  add column if not exists attendance_status text not null default 'unconfirmed'
    check (attendance_status in ('unconfirmed', 'attending', 'absent'));

-- ダイスロール履歴テーブル (追加マイグレーション)
create table if not exists dice_rolls (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid not null references characters(id) on delete cascade,
  skill_name    text not null,
  skill_value   integer not null,
  roll_value    integer not null,
  success_level text not null
                check (success_level in ('critical_success', 'success', 'failure', 'fumble')),
  rolled_at     timestamptz not null default now()
);

alter table dice_rolls enable row level security;
create policy "allow all for anon" on dice_rolls for all using (true) with check (true);

-- NPCスタッツ拡張 (追加マイグレーション)
alter table npcs add column if not exists str integer;
alter table npcs add column if not exists con integer;
alter table npcs add column if not exists pow integer;
alter table npcs add column if not exists dex integer;
alter table npcs add column if not exists app integer;
alter table npcs add column if not exists siz integer;
alter table npcs add column if not exists int_stat integer;
alter table npcs add column if not exists edu integer;
alter table npcs add column if not exists hp integer;
alter table npcs add column if not exists mp integer;
alter table npcs add column if not exists db text;

-- ハンドアウト共有URLテーブル (追加マイグレーション)
create table if not exists share_tokens (
  id          uuid primary key default gen_random_uuid(),
  handout_id  uuid not null references handouts(id) on delete cascade,
  token       uuid not null default gen_random_uuid() unique,
  expires_at  timestamptz not null,
  created_at  timestamptz default now()
);

alter table share_tokens enable row level security;
create policy "allow all for anon" on share_tokens for all using (true) with check (true);

-- シナリオ共有メモテーブル (追加マイグレーション)
create table if not exists scenario_notes (
  id          uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  content     text not null,
  author_name text,
  created_at  timestamptz default now()
);

alter table scenario_notes enable row level security;
create policy "allow all for anon" on scenario_notes for all using (true) with check (true);

-- シナリオ次回予定リマインド (追加マイグレーション)
alter table scenarios add column if not exists next_session_at timestamptz;

-- NPC判定履歴記録 (追加マイグレーション)
create table if not exists npc_dice_rolls (
  id            uuid primary key default gen_random_uuid(),
  npc_id        uuid not null references npcs(id) on delete cascade,
  skill_name    text not null,
  skill_value   integer not null,
  roll_value    integer not null,
  success_level text not null
                check (success_level in ('critical_success', 'success', 'failure', 'fumble')),
  rolled_at     timestamptz not null default now()
);

alter table npc_dice_rolls enable row level security;
create policy "allow all for anon" on npc_dice_rolls for all using (true) with check (true);

-- 職業技能テンプレート (追加マイグレーション)
create table if not exists skill_templates (
  id              uuid primary key default gen_random_uuid(),
  occupation_name text not null,
  skill_name      text not null,
  is_occupation   boolean not null default true,
  created_at      timestamptz default now()
);

alter table skill_templates enable row level security;
create policy "allow all for anon" on skill_templates for all using (true) with check (true);

-- 所持金・出費管理 (追加マイグレーション)
create table if not exists character_finances (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid not null references characters(id) on delete cascade,
  amount        integer not null,
  reason        text not null,
  recorded_at   timestamptz not null default now(),
  created_at    timestamptz default now()
);

alter table character_finances enable row level security;
create policy "allow all for anon" on character_finances for all using (true) with check (true);

-- NPC遭遇ログ（セッション×NPC紐付け） (追加マイグレーション)
create table if not exists session_npc_encounters (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  npc_id      uuid not null references npcs(id) on delete cascade,
  created_at  timestamptz default now(),
  unique (session_id, npc_id)
);

alter table session_npc_encounters enable row level security;
create policy "allow all for anon" on session_npc_encounters for all using (true) with check (true);

-- KPシナリオ振り返りノート (追加マイグレーション)
create table if not exists scenario_retrospectives (
  id                uuid primary key default gen_random_uuid(),
  scenario_id       uuid not null references scenarios(id) on delete cascade,
  what_worked       text,
  what_to_improve   text,
  player_reactions  text,
  difficulty_rating integer check (difficulty_rating between 1 and 5),
  horror_rating     integer check (horror_rating between 1 and 5),
  created_at        timestamptz default now(),
  unique (scenario_id)
);

alter table scenario_retrospectives enable row level security;
create policy "allow all for anon" on scenario_retrospectives for all using (true) with check (true);

-- 能力値成長記録（EDU成長チェック） (追加マイグレーション)
create table if not exists character_ability_growths (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid not null references characters(id) on delete cascade,
  ability_name  text not null,
  old_value     integer not null,
  new_value     integer not null,
  grown_at      timestamptz,
  created_at    timestamptz default now()
);

alter table character_ability_growths enable row level security;
create policy "allow all for anon" on character_ability_growths for all using (true) with check (true);

-- NPC陣営・組織タグ (追加マイグレーション)
alter table npcs add column if not exists faction text;

-- プレイヤー情報管理 (追加マイグレーション)
create table if not exists players (
  id                uuid primary key default gen_random_uuid(),
  display_name      text not null,
  contact_discord   text,
  contact_other     text,
  preferred_genre   text,
  notes             text,
  created_at        timestamptz default now()
);

alter table players enable row level security;
create policy "allow all for anon" on players for all using (true) with check (true);

alter table scenario_participants add column if not exists player_id uuid references players(id);

-- セッション情報パック配布 (追加マイグレーション)
alter table share_tokens alter column handout_id drop not null;
alter table share_tokens add column if not exists target_type text not null default 'handout'
  check (target_type in ('handout', 'session_pack'));
alter table share_tokens add column if not exists scenario_id uuid references scenarios(id) on delete cascade;

-- 技能カテゴリ別フィルタ (追加マイグレーション)
alter table character_skills add column if not exists category text;
