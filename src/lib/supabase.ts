import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = url.startsWith("http");

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url, key)
  : (null as unknown as SupabaseClient);

export type CharacterStatus = "alive" | "dead" | "insane" | "retired";

export type Character = {
  id: string;
  name: string;
  player_name: string | null;
  portrait_url: string | null;
  occupation: string | null;
  catchphrase: string | null;
  age: number | null;
  gender: string | null;
  scenario_name: string | null;
  status: CharacterStatus;
  str: number;
  con: number;
  pow: number;
  dex: number;
  app: number;
  siz: number;
  int_stat: number;
  edu: number;
  hp_max: number;
  hp_current: number;
  mp_max: number;
  mp_current: number;
  san_start: number;
  san_current: number;
  san_max: number;
  luck: number;
  background: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CharacterSkill = {
  id: string;
  character_id: string;
  skill_name: string;
  base_value: number;
  current_value: number;
  is_occupation: boolean;
  growth_checked: boolean;
};

export type Material = {
  id: string;
  name: string;
  type: "portrait" | "background" | "other";
  storage_url: string;
  tags: string[];
  created_at: string;
};

export type CharacterWithSkills = Character & {
  character_skills: CharacterSkill[];
};

export type SessionLog = {
  id: string;
  character_id: string;
  session_number: number;
  title: string;
  summary: string | null;
  san_loss: number;
  hp_loss: number;
  played_at: string | null;
  created_at: string;
};

export type Npc = {
  id: string;
  scenario_name: string | null;
  name: string;
  appearance: string | null;
  purpose: string | null;
  notes: string | null;
  created_at: string;
};

export type RelationType = "友人" | "ライバル" | "恩人" | "要注意" | "その他";

export type CharacterRelation = {
  id: string;
  character_id: string;
  target_name: string;
  relation_type: RelationType;
  memo: string | null;
  created_at: string;
};

export type MadnessType = "temporary" | "indefinite";

export type MadnessRecord = {
  id: string;
  character_id: string;
  madness_type: MadnessType;
  symptom: string;
  is_active: boolean;
  started_at: string | null;
  recovered_at: string | null;
  created_at: string;
};

export type ScenarioStatus = "planning" | "ongoing" | "completed";

export type Scenario = {
  id: string;
  title: string;
  synopsis: string | null;
  gm_notes: string | null;
  status: ScenarioStatus;
  played_at: string | null;
  created_at: string;
};

export type Handout = {
  id: string;
  scenario_id: string;
  title: string;
  content: string | null;
  recipient_name: string | null;
  is_secret: boolean;
  created_at: string;
};

export type ItemType = "weapon" | "item";

export type InventoryItem = {
  id: string;
  character_id: string;
  item_type: ItemType;
  name: string;
  damage: string | null;
  range: string | null;
  ammo_current: number | null;
  ammo_max: number | null;
  notes: string | null;
  created_at: string;
};

export type ScenarioParticipant = {
  id: string;
  scenario_id: string;
  character_id: string;
  created_at: string;
};

export type TraitType =
  | "person"
  | "place"
  | "treasure"
  | "personality"
  | "ideology"
  | "wound";

export type CharacterTrait = {
  id: string;
  character_id: string;
  trait_type: TraitType;
  content: string;
  created_at: string;
};

export type SuccessLevel = "critical_success" | "success" | "failure" | "fumble";

export type DiceRoll = {
  id: string;
  character_id: string;
  skill_name: string;
  skill_value: number;
  roll_value: number;
  success_level: SuccessLevel;
  rolled_at: string;
};
