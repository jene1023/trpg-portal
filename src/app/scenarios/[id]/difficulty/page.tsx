"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { supabase, isSupabaseConfigured, Creature, Character } from "@/lib/supabase";

type ParticipantRow = {
  id: string;
  characters: Character | null;
};

type DifficultyLevel = "safe" | "normal" | "dangerous" | "catastrophic" | "no_data";

const DIFFICULTY_CONFIG = {
  safe: {
    label: "安全",
    emoji: "🟢",
    colorClass: "text-green-400 border-green-700 bg-green-950/40",
    desc: "クリーチャーの脅威度が低く、パーティーが優勢です。",
  },
  normal: {
    label: "普通",
    emoji: "🟡",
    colorClass: "text-yellow-400 border-yellow-700 bg-yellow-950/40",
    desc: "クリーチャーとパーティーが拮抗しています。標準的な難易度です。",
  },
  dangerous: {
    label: "危険",
    emoji: "🟠",
    colorClass: "text-orange-400 border-orange-700 bg-orange-950/40",
    desc: "クリーチャーの脅威度が高く、パーティーには相当の圧力がかかります。",
  },
  catastrophic: {
    label: "壊滅",
    emoji: "🔴",
    colorClass: "text-red-400 border-red-700 bg-red-950/40",
    desc: "クリーチャーの脅威度がパーティーを大幅に上回っています。壊滅的な結末に注意してください。",
  },
  no_data: {
    label: "データ不足",
    emoji: "⚪",
    colorClass: "text-coc-muted border-coc-border bg-coc-surface",
    desc: "クリーチャーまたは参加キャラクターが登録されていないため、難易度を計算できません。",
  },
};

function calcDifficulty(creatures: Creature[], characters: Character[]): DifficultyLevel {
  if (creatures.length === 0 || characters.length === 0) return "no_data";

  const creatureTotalHP = creatures.reduce((sum, c) => sum + (c.hp ?? 10), 0);
  const partyTotalHP = characters.reduce((sum, c) => sum + c.hp_current, 0);
  if (partyTotalHP === 0) return "no_data";

  // Spellcasting creatures add extra threat (20% per caster)
  const spellcasterCount = creatures.filter((c) => c.can_use_spells).length;
  const spellBonus = spellcasterCount * 0.2;

  const creatureScore = creatureTotalHP * (1 + spellBonus);
  const ratio = creatureScore / partyTotalHP;

  if (ratio < 0.5) return "safe";
  if (ratio < 1.0) return "normal";
  if (ratio < 2.0) return "dangerous";
  return "catastrophic";
}

export default function DifficultyPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    Promise.all([
      supabase.from("creatures").select("*").eq("scenario_id", id),
      supabase.from("scenario_participants").select("id, characters(*)").eq("scenario_id", id),
    ]).then(([creaturesRes, participantsRes]) => {
      setCreatures((creaturesRes.data ?? []) as Creature[]);
      const rows = (participantsRes.data ?? []) as unknown as ParticipantRow[];
      const chars = rows.map((r) => r.characters).filter((c): c is Character => c !== null);
      setCharacters(chars);
      setLoading(false);
    });
  }, [id]);

  const difficulty = loading ? null : calcDifficulty(creatures, characters);
  const config = difficulty ? DIFFICULTY_CONFIG[difficulty] : null;

  const creatureTotalHP = creatures.reduce((s, c) => s + (c.hp ?? 10), 0);
  const partyTotalHP = characters.reduce((s, c) => s + c.hp_current, 0);
  const partyAvgHP = characters.length > 0 ? Math.round(partyTotalHP / characters.length) : 0;
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

      <div className="flex items-center gap-2 mb-6">
        <ShieldAlert size={22} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">エンカウンター難易度チェッカー</h1>
      </div>

      {loading ? (
        <p className="text-sm text-coc-muted">読み込み中...</p>
      ) : (
        <>
          {config && (
            <div className={`mb-6 rounded-2xl border px-6 py-6 text-center ${config.colorClass}`}>
              <p className="text-5xl mb-3">{config.emoji}</p>
              <p className="text-2xl font-bold mb-2">{config.label}</p>
              <p className="text-sm leading-relaxed">{config.desc}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
              <p className="text-2xl font-bold text-coc-text">{creatures.length}</p>
              <p className="text-xs text-coc-muted mt-1">クリーチャー数</p>
            </div>
            <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
              <p className="text-2xl font-bold text-coc-text">{characters.length}</p>
              <p className="text-xs text-coc-muted mt-1">パーティー人数</p>
            </div>
            <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
              <p className="text-2xl font-bold text-red-400">{creatureTotalHP}</p>
              <p className="text-xs text-coc-muted mt-1">クリーチャー総HP</p>
            </div>
            <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
              <p className="text-2xl font-bold text-green-400">{partyAvgHP}</p>
              <p className="text-xs text-coc-muted mt-1">パーティー平均HP</p>
            </div>
          </div>

          {spellcasterCount > 0 && (
            <div className="mb-4 rounded-lg border border-purple-800 bg-purple-950/30 px-4 py-3 text-sm text-purple-300">
              呪文使用可能クリーチャーが {spellcasterCount} 体います（難易度スコアに加算済み）。
            </div>
          )}

          {creatures.length > 0 && (
            <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">登録クリーチャー</p>
              <ul className="space-y-2">
                {creatures.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span className="text-coc-text">
                      {c.name}
                      {c.can_use_spells && (
                        <span className="ml-1.5 rounded-full bg-purple-900/40 border border-purple-800 px-1.5 py-0.5 text-xs text-purple-300">呪文</span>
                      )}
                    </span>
                    <span className="text-coc-muted">HP {c.hp ?? "??"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {characters.length > 0 && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">参加キャラクター</p>
              <ul className="space-y-2">
                {characters.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span className="text-coc-text">{c.name}</span>
                    <span className={c.hp_current <= Math.ceil(c.hp_max * 0.25) ? "text-red-400" : c.hp_current <= Math.ceil(c.hp_max * 0.5) ? "text-yellow-400" : "text-coc-muted"}>
                      HP {c.hp_current}/{c.hp_max}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {creatures.length === 0 && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 text-sm text-coc-muted">
              クリーチャーが登録されていません。
              <Link href={`/creatures/new?scenario=${id}`} className="ml-1 text-coc-gold hover:underline">
                クリーチャーを追加 →
              </Link>
            </div>
          )}

          {characters.length === 0 && (
            <div className="mt-3 rounded-xl border border-coc-border bg-coc-surface px-5 py-4 text-sm text-coc-muted">
              参加キャラクターが登録されていません。
              <Link href={`/scenarios/${id}/participants`} className="ml-1 text-coc-gold hover:underline">
                参加者を追加 →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
