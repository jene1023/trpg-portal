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
  speech_style: string | null;
  furigana: string | null;
  birthday: string | null;
  eye_color: string | null;
  hair_color: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  mythos_books_read: number;
  rule_edition: "6th" | "7th";
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
  is_favorite: boolean;
  category: string | null;
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
  recording_url: string | null;
  created_at: string;
};

export type Npc = {
  id: string;
  scenario_name: string | null;
  name: string;
  appearance: string | null;
  purpose: string | null;
  notes: string | null;
  faction: string | null;
  speech_style: string | null;
  sample_quotes: string | null;
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
export type ScenarioDifficulty = "beginner" | "intermediate" | "advanced";
export type ScenarioPlaytimeType = "short" | "medium" | "long";

export type Scenario = {
  id: string;
  title: string;
  synopsis: string | null;
  gm_notes: string | null;
  status: ScenarioStatus;
  played_at: string | null;
  next_session_at: string | null;
  vtt_url: string | null;
  vtt_type: string | null;
  discord_webhook_url: string | null;
  difficulty: ScenarioDifficulty | null;
  playtime_type: ScenarioPlaytimeType | null;
  min_players: number | null;
  max_players: number | null;
  content_tags: string[] | null;
  remind_enabled: boolean;
  remind_email: string | null;
  created_at: string;
};

export type Handout = {
  id: string;
  scenario_id: string;
  title: string;
  content: string | null;
  recipient_name: string | null;
  is_secret: boolean;
  is_distributed: boolean;
  image_url: string | null;
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
  player_id: string | null;
  created_at: string;
};

export type Player = {
  id: string;
  display_name: string;
  contact_discord: string | null;
  contact_other: string | null;
  preferred_genre: string | null;
  notes: string | null;
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
  handout_id: string | null;
  scenario_id: string | null;
  target_type: "handout" | "session_pack";
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

export type ScenarioTimelineEvent = {
  id: string;
  scenario_id: string;
  event_date: string | null;
  event_order: number;
  title: string;
  description: string | null;
  is_revealed: boolean;
  created_at: string;
};

export type CharacterAbilityGrowth = {
  id: string;
  character_id: string;
  ability_name: string;
  old_value: number;
  new_value: number;
  grown_at: string | null;
  created_at: string;
};

export type ClueStatus = "found" | "investigating" | "resolved";

export type ScenarioClue = {
  id: string;
  scenario_id: string | null;
  character_id: string;
  title: string;
  content: string | null;
  status: ClueStatus;
  created_at: string;
};

export type VowStatus = "active" | "fulfilled" | "failed" | "abandoned";

export type CharacterVow = {
  id: string;
  character_id: string;
  title: string;
  description: string | null;
  status: VowStatus;
  resolved_at: string | null;
  created_at: string;
};

export type CharacterCondition = {
  id: string;
  character_id: string;
  condition_name: string;
  color: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
};

export type CharacterGalleryImage = {
  id: string;
  character_id: string;
  image_url: string;
  caption: string | null;
  is_main: boolean;
  order_index: number;
  created_at: string;
};

export type ScenarioProp = {
  id: string;
  scenario_id: string;
  name: string;
  description: string | null;
  acquisition_condition: string | null;
  is_distributed: boolean;
  created_at: string;
};

export type ScenarioRandomEvent = {
  id: string;
  scenario_id: string;
  weight: number;
  title: string;
  description: string | null;
  created_at: string;
};

export type ReflectionRole = "kp" | "pl" | "other";

export type SessionReflection = {
  id: string;
  session_id: string | null;
  author_name: string | null;
  role: ReflectionRole;
  content: string;
  created_at: string;
};

export type DowntimeActivityType = "research" | "training" | "rest" | "social" | "other";

export type CharacterDowntime = {
  id: string;
  character_id: string;
  activity_type: DowntimeActivityType;
  title: string;
  description: string | null;
  duration_days: number | null;
  result: string | null;
  created_at: string;
};

export type ReactionType = "heart" | "dice" | "skull" | "scream";

export type CharacterReaction = {
  id: string;
  character_id: string;
  reactor_name: string | null;
  reaction_type: ReactionType;
  message: string | null;
  created_at: string;
};

export type DiceShortcut = {
  id: string;
  character_id: string;
  label: string;
  expression: string;
  created_at: string;
};

export type ScenarioReview = {
  id: string;
  scenario_id: string;
  rating: number;
  went_well: string | null;
  improvements: string | null;
  overall_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type ItemCatalogCategory = "weapon" | "medical" | "tool" | "misc";

export type ItemCatalog = {
  id: string;
  category: ItemCatalogCategory;
  name: string;
  damage: string | null;
  notes: string | null;
  created_at: string;
};

export type CampaignStatus = "ongoing" | "completed" | "planning";

export type Campaign = {
  id: string;
  title: string;
  synopsis: string | null;
  status: CampaignStatus;
  created_at: string;
};

export type CampaignScenario = {
  id: string;
  campaign_id: string;
  scenario_id: string;
  order_index: number;
  created_at: string;
};

export type PlotThreadStatus = "pending" | "revealed" | "abandoned";

export type PlotThread = {
  id: string;
  scenario_id: string;
  title: string;
  description: string | null;
  status: PlotThreadStatus;
  created_at: string;
};

export type SessionAgendaItemType = "scene" | "handout" | "npc" | "note";

export type SessionAgendaItem = {
  id: string;
  scenario_id: string;
  item_type: SessionAgendaItemType;
  label: string;
  is_done: boolean;
  order_index: number;
  created_at: string;
};

export type CharacterMessage = {
  id: string;
  sender_character_id: string;
  recipient_character_id: string;
  subject: string;
  body: string | null;
  sent_at: string;
  is_read: boolean;
  created_at: string;
};

export type CharacterMessageWithSender = CharacterMessage & {
  sender: { id: string; name: string } | null;
};

export type ScenePacingLog = {
  id: string;
  scenario_id: string;
  scene_label: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
};

export type SessionGoalStatus = "pending" | "achieved" | "failed";

export type SessionGoal = {
  id: string;
  character_id: string;
  goal: string;
  status: SessionGoalStatus;
  set_at: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type PhobiaType = "phobia" | "mania";

export type CharacterPhobia = {
  id: string;
  character_id: string;
  phobia_type: PhobiaType;
  name: string;
  trigger_description: string | null;
  is_active: boolean;
  acquired_at: string | null;
  created_at: string;
};

export type CharacterTome = {
  id: string;
  character_id: string;
  title: string;
  author: string | null;
  language: string | null;
  san_loss_skimming: string | null;
  san_loss_full_read: string | null;
  cthulhu_mythos_gain: number | null;
  spells_contained: string | null;
  is_read: boolean;
  notes: string | null;
  created_at: string;
};

export type KpMemoEntityType = "character" | "npc" | "scenario";

export type KpMemo = {
  id: string;
  entity_type: KpMemoEntityType;
  entity_id: string;
  content: string;
  created_at: string;
};

export type CharacterBond = {
  id: string;
  character_id: string;
  target_name: string;
  bond_score: number;
  damage_taken: number;
  is_lost: boolean;
  notes: string | null;
  created_at: string;
};

export type Tag = {
  id: string;
  name: string;
  created_at: string;
};

export type EntityTagEntityType = "character" | "scenario" | "npc";

export type EntityTag = {
  id: string;
  entity_type: EntityTagEntityType;
  entity_id: string;
  tag_id: string;
  created_at: string;
};

export type CharacterSnapshot = {
  id: string;
  character_id: string;
  label: string;
  snapshot_data: Record<string, unknown>;
  taken_at: string;
  created_at: string;
};

export type NpcPreset = {
  id: string;
  name: string;
  occupation_name: string | null;
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

export type SessionReview = {
  id: string;
  scenario_id: string;
  session_label: string | null;
  fun_score: number;
  tension_score: number;
  highlight: string | null;
  improvement: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type PlayerFeedback = {
  id: string;
  scenario_id: string;
  session_label: string | null;
  player_name: string;
  fun_score: number;
  highlight: string | null;
  improvement: string | null;
  created_at: string;
};
