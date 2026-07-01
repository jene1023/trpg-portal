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
  is_pinned: boolean;
  is_public: boolean;
  public_slug: string | null;
  farewell_scene: string | null;
  farewell_message: string | null;
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
  str: number | null;
  con: number | null;
  pow: number | null;
  dex: number | null;
  app: number | null;
  siz: number | null;
  int_stat: number | null;
  edu: number | null;
  hp: number | null;
  mp: number | null;
  db: string | null;
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
  next_session_at: string | null;
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

export type AttendanceStatus = "unconfirmed" | "attending" | "absent";

export type ScenarioParticipant = {
  id: string;
  scenario_id: string;
  character_id: string;
  attendance_status: AttendanceStatus;
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

export type QuickNote = {
  id: string;
  character_id: string;
  content: string;
  created_at: string;
};

export type GrowthHistory = {
  id: string;
  character_id: string;
  skill_name: string;
  old_value: number;
  new_value: number;
  session_label: string | null;
  grown_at: string | null;
  created_at: string;
};

export type CharacterSpell = {
  id: string;
  character_id: string;
  spell_name: string;
  mp_cost: number | null;
  san_cost: number | null;
  casting_time: string | null;
  effect: string | null;
  source_page: string | null;
  created_at: string;
};

export type ShareToken = {
  id: string;
  handout_id: string;
  token: string;
  expires_at: string;
  created_at: string;
};

export type ScenarioNote = {
  id: string;
  scenario_id: string;
  content: string;
  author_name: string | null;
  created_at: string;
};

export type NpcDiceRoll = {
  id: string;
  npc_id: string;
  skill_name: string;
  skill_value: number;
  roll_value: number;
  success_level: SuccessLevel;
  rolled_at: string;
};

export type SkillTemplate = {
  id: string;
  occupation_name: string;
  skill_name: string;
  is_occupation: boolean;
  created_at: string;
};

export type CharacterFinance = {
  id: string;
  character_id: string;
  amount: number;
  reason: string;
  recorded_at: string;
  created_at: string;
};

export type SessionNpcEncounter = {
  id: string;
  session_id: string;
  npc_id: string;
  created_at: string;
};

export type SkillGoal = {
  id: string;
  character_id: string;
  skill_name: string;
  target_value: number;
  created_at: string;
};

export type ScenarioRetrospective = {
  id: string;
  scenario_id: string;
  what_worked: string | null;
  what_to_improve: string | null;
  player_reactions: string | null;
  difficulty_rating: number | null;
  horror_rating: number | null;
  created_at: string;
};

export type ScenarioArea = {
  id: string;
  scenario_id: string;
  name: string;
  description: string | null;
  gm_notes: string | null;
  order_index: number;
  created_at: string;
};

export type ScheduleProposal = {
  id: string;
  scenario_id: string;
  proposed_at: string;
  created_at: string;
};

export type ScheduleVote = {
  id: string;
  proposal_id: string;
  voter_name: string;
  is_available: boolean;
  created_at: string;
};

export type Creature = {
  id: string;
  scenario_id: string | null;
  name: string;
  mythos_background: string | null;
  san_loss_success: string | null;
  san_loss_failure: string | null;
  str: number | null;
  con: number | null;
  pow: number | null;
  dex: number | null;
  siz: number | null;
  hp: number | null;
  mp: number | null;
  armor: string | null;
  attacks: string | null;
  can_use_spells: boolean;
  notes: string | null;
  created_at: string;
};

export type BgmCue = {
  id: string;
  scenario_id: string;
  order_index: number;
  label: string;
  bgm_url: string | null;
  mood: string | null;
  direction_notes: string | null;
  created_at: string;
};

export type ScenarioScene = {
  id: string;
  scenario_id: string;
  scene_order: number;
  title: string;
  notes: string | null;
  is_done: boolean;
  created_at: string;
};

export type ScenarioPlayerRating = {
  id: string;
  scenario_id: string;
  voter_name: string;
  fun_rating: number;
  horror_rating: number;
  mystery_rating: number;
  character_rating: number;
  comment: string | null;
  created_at: string;
};
