export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Gauge } from "lucide-react";
import { supabase, isSupabaseConfigured, Creature, CharacterSkill } from "@/lib/supabase";

type CharacterForDifficulty = {
  id: string;
  name: string;
  hp_max: number;
  san_max: number;
  character_skills: CharacterSkill[];
};

type ParticipantWithCharacter = {
  id: string;
  characters: CharacterForDifficulty | null;
};

// Parse SAN loss strings like "1D6", "2D6+2", "1/1D4", "0/1D6+2" → estimated max value
function parseSanLoss(expr: string | null): number {
  if (!expr) return 0;
  // If slash-separated, take the rightmost part (failure = worse result)
  const parts = expr.split("/");
  const worst = parts[parts.length - 1].trim();

  const match = worst.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (match) {
    const count = parseInt(match[1] || "1", 10);
    const sides = parseInt(match[2], 10);
    const bonus = parseInt(match[3] || "0", 10);
    return count * sides + bonus;
  }
  const num = parseInt(worst, 10);
  return isNaN(num) ? 0 : num;
}

type DifficultyLevel = "safe" | "normal" | "dangerous" | "hopeless" | "no_data";

const DIFFICULTY_CONFIG: Record<
  DifficultyLevel,
  { label: string; badgeClass: string; desc: string }
> = {
  safe: {
    label: "安全",
    badgeClass: "text-green-300 border-green-700 bg-green-950/40",
    desc: "クリーチャーの脅威度が低く、パーティーが優位に立てます。",
  },
  normal: {
    label: "標準",
    badgeClass: "text-yellow-300 border-yellow-700 bg-yellow-950/40",
    desc: "クリーチャーとパーティーが拮抗しています。油断は禁物です。",
  },
  dangerous: {
    label: "危険",
    badgeClass: "text-orange-300 border-orange-700 bg-orange-950/40",
    desc: "クリーチャーの脅威が高く、SAN喪失への備えが必要です。",
  },
  hopeless: {
    label: "絶望的",
    badgeClass: "text-red-300 border-red-700 bg-red-950/40",
    desc: "クリーチャーの脅威がパーティーを圧倒しています。シナリオの調整を検討してください。",
  },
  no_data: {
    label: "データ不足",
    badgeClass: "text-coc-muted border-coc-border bg-coc-surface",
    desc: "クリーチャーまたは参加キャラクターが未登録のため、難易度を計算できません。",
  },
};

function calcDifficulty(
  creatures: Creature[],
  partyAvgSan: number,
  partyAvgHp: number
): DifficultyLevel {
  if (creatures.length === 0 || partyAvgSan === 0 || partyAvgHp === 0) return "no_data";

  const totalSanThreat = creatures.reduce(
    (sum, c) => sum + parseSanLoss(c.san_loss_failure),
    0
  );
  const avgCreatureHp =
    creatures.reduce((sum, c) => sum + (c.hp ?? 10), 0) / creatures.length;

  // SAN threat ratio vs party average SAN
  const sanRatio = totalSanThreat / partyAvgSan;
  // HP threat ratio: average creature HP vs party average HP
  const hpRatio = avgCreatureHp / partyAvgHp;

  const threatScore = sanRatio * 0.6 + hpRatio * 0.4;

  if (threatScore < 0.3) return "safe";
  if (threatScore < 0.8) return "normal";
  if (threatScore < 1.5) return "dangerous";
  return "hopeless";
}

const KEY_SKILLS = ["回避", "幸運", "目星", "聴耳", "図書館", "心理学", "医学"];

type Props = { params: Promise<{ id: string }> };

export default async function DifficultyAssessmentPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const [{ data: participantRows }, { data: creatureRows }] = await Promise.all([
    supabase
      .from("scenario_participants")
      .select("id, characters(id, name, hp_max, san_max, character_skills(*))")
      .eq("scenario_id", id),
    supabase.from("creatures").select("*").eq("scenario_id", id),
  ]);

  const creatures = (creatureRows ?? []) as Creature[];
  const participants = (participantRows ?? []) as unknown as ParticipantWithCharacter[];
  const chars = participants
    .map((p) => p.characters)
    .filter((c): c is CharacterForDifficulty => c !== null);

  const partyCount = chars.length;
  const partyAvgHp =
    partyCount > 0
      ? Math.round(chars.reduce((s, c) => s + c.hp_max, 0) / partyCount)
      : 0;
  const partyAvgSan =
    partyCount > 0
      ? Math.round(chars.reduce((s, c) => s + c.san_max, 0) / partyCount)
      : 0;

  const totalSanThreat = creatures.reduce(
    (sum, c) => sum + parseSanLoss(c.san_loss_failure),
    0
  );
  // Recommended SAN prep = 70% of total creature SAN threat (per party member estimate)
  const recommendedSanPrep =
    partyCount > 0 ? Math.round(totalSanThreat * 0.7) : 0;

  const difficulty = calcDifficulty(creatures, partyAvgSan, partyAvgHp);
  const config = DIFFICULTY_CONFIG[difficulty];

  // Aggregate key skill averages across all party members
  const allSkills = chars.flatMap((c) => c.character_skills);
  const skillAverages = KEY_SKILLS.map((skillName) => {
    const matching = allSkills.filter((s) => s.skill_name === skillName);
    const avg =
      matching.length > 0
        ? Math.round(
            matching.reduce((s, sk) => s + sk.current_value, 0) / matching.length
          )
        : 0;
    return { name: skillName, avg };
  }).filter((s) => s.avg > 0);

  const spellcasterCount = creatures.filter((c) => c.can_use_spells).length;

  return (
    <div className="coc-page-enter mx-auto max-w-xl px-4 py-8">
      <Link
        href={`/scenarios/${id}`}
        className="mb-6 flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
      >
        <ArrowLeft size={16} />
        シナリオ詳細
      </Link>

      <div className="mb-1">
        <p className="text-xs text-coc-muted mb-1">{scenario.title}</p>
        <div className="flex items-center gap-2">
          <Gauge size={20} className="text-coc-gold" />
          <h1 className="font-cinzel text-xl font-bold text-coc-text">難易度アセスメント</h1>
        </div>
        <p className="text-sm text-coc-muted mt-1">
          パーティースペックとクリーチャー脅威を自動試算
        </p>
      </div>

      {/* Difficulty badge */}
      <div className={`my-6 rounded-2xl border px-6 py-6 text-center ${config.badgeClass}`}>
        <p className="text-3xl font-bold mb-2">{config.label}</p>
        <p className="text-sm leading-relaxed">{config.desc}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-coc-text">{partyCount}</p>
          <p className="text-xs text-coc-muted mt-1">パーティー人数</p>
        </div>
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-coc-text">{creatures.length}</p>
          <p className="text-xs text-coc-muted mt-1">クリーチャー数</p>
        </div>
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-green-400">{partyAvgHp}</p>
          <p className="text-xs text-coc-muted mt-1">パーティー平均HP</p>
        </div>
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-green-400">{partyAvgSan}</p>
          <p className="text-xs text-coc-muted mt-1">パーティー平均SAN</p>
        </div>
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-red-400">{totalSanThreat}</p>
          <p className="text-xs text-coc-muted mt-1">クリーチャー合計SAN脅威</p>
        </div>
        {recommendedSanPrep > 0 && (
          <div className="rounded-xl border border-yellow-800 bg-yellow-950/20 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-yellow-300">{recommendedSanPrep}</p>
            <p className="text-xs text-coc-muted mt-1">推奨SAN準備量</p>
          </div>
        )}
      </div>

      {spellcasterCount > 0 && (
        <div className="mb-4 rounded-lg border border-purple-800 bg-purple-950/30 px-4 py-3 text-sm text-purple-300">
          呪文使用可能クリーチャーが {spellcasterCount} 体います。追加の精神的脅威に注意してください。
        </div>
      )}

      {/* Key skills bar chart (CSS only) */}
      {skillAverages.length > 0 && (
        <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
            主要技能 平均値
          </p>
          <div className="space-y-3">
            {skillAverages.map(({ name, avg }) => (
              <div key={name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-coc-text">{name}</span>
                  <span className="text-sm font-mono text-coc-muted">{avg}</span>
                </div>
                <div className="h-2 rounded-full bg-coc-raised overflow-hidden">
                  <div
                    className="h-full rounded-full bg-coc-gold transition-all"
                    style={{ width: `${Math.min(avg, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Creature list */}
      {creatures.length > 0 && (
        <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
            登録クリーチャー
          </p>
          <ul className="space-y-2">
            {creatures.map((c) => {
              const sanMax = parseSanLoss(c.san_loss_failure);
              return (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <span className="text-coc-text">
                    {c.name}
                    {c.can_use_spells && (
                      <span className="ml-1.5 rounded-full bg-purple-900/40 border border-purple-800 px-1.5 py-0.5 text-xs text-purple-300">
                        呪文
                      </span>
                    )}
                  </span>
                  <div className="flex gap-3 text-xs text-coc-muted">
                    <span>HP {c.hp ?? "—"}</span>
                    {sanMax > 0 && (
                      <span className="text-red-400">SAN脅威 {sanMax}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Party list */}
      {chars.length > 0 && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
            参加キャラクター
          </p>
          <ul className="space-y-2">
            {chars.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-coc-text">{c.name}</span>
                <div className="flex gap-3 text-xs text-coc-muted">
                  <span>HP {c.hp_max}</span>
                  <span>SAN {c.san_max}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {creatures.length === 0 && (
        <div className="mt-4 rounded-xl border border-coc-border bg-coc-surface px-5 py-4 text-sm text-coc-muted">
          クリーチャーが登録されていません。
          <Link
            href={`/creatures/new?scenario=${id}`}
            className="ml-1 text-coc-gold hover:underline"
          >
            クリーチャーを追加 →
          </Link>
        </div>
      )}

      {chars.length === 0 && (
        <div className="mt-3 rounded-xl border border-coc-border bg-coc-surface px-5 py-4 text-sm text-coc-muted">
          参加キャラクターが登録されていません。
          <Link
            href={`/scenarios/${id}/participants`}
            className="ml-1 text-coc-gold hover:underline"
          >
            参加者を追加 →
          </Link>
        </div>
      )}
    </div>
  );
}
