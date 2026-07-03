"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Character, CharacterSkill, supabase, isSupabaseConfigured } from "@/lib/supabase";
import StatusBadge from "./StatusBadge";
import PortraitImage from "./PortraitImage";
import DerivedStatBar from "./DerivedStatBar";

type Props = {
  character: Character;
  skills?: CharacterSkill[];
  onTogglePin?: (id: string, pinned: boolean) => void;
  isCompared?: boolean;
  onToggleCompare?: (id: string) => void;
};

function topSkills(skills: CharacterSkill[]): CharacterSkill[] {
  return [...skills]
    .sort((a, b) => b.current_value - a.current_value)
    .slice(0, 3);
}

export default function CharacterCard({ character, skills = [], onTogglePin, isCompared, onToggleCompare }: Props) {
  const top = topSkills(skills);

  async function handlePin(e: { preventDefault: () => void; stopPropagation: () => void }) {
    e.preventDefault();
    e.stopPropagation();
    if (!isSupabaseConfigured) return;
    const newPinned = !character.is_pinned;
    await supabase.from("characters").update({ is_pinned: newPinned }).eq("id", character.id);
    onTogglePin?.(character.id, newPinned);
  }

  return (
    <Link href={`/characters/${character.id}`} className="group block">
      <div className="relative rounded-lg border border-coc-border coc-card-bg coc-tile-shimmer overflow-hidden transition-all duration-300 ease-out group-hover:border-coc-border-glow group-hover:shadow-[0_4px_20px_rgba(201,133,58,0.30),inset_0_1px_0_rgba(201,133,58,0.14)] motion-safe:group-hover:-translate-y-1 motion-safe:group-active:scale-[0.98] motion-safe:group-active:translate-y-0">
        {/* ポートレート */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <PortraitImage
            url={character.portrait_url}
            name={character.name}
            className="transition-transform duration-300 group-hover:scale-105"
          />
          {/* 燭台ホバーグロー: ポートレート上部から降り注ぐ暖色の光 */}
          <div
            className="absolute inset-0 pointer-events-none coc-portrait-amber-glow opacity-0 motion-safe:group-hover:opacity-100 transition-opacity duration-500"
            aria-hidden="true"
          />
          {/* ビネット */}
          <div className="absolute inset-0 pointer-events-none coc-portrait-vignette" />
          {/* グラデーションオーバーレイ: 名前・職業 */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-3 pb-3 pt-8">
            <p className="font-cinzel text-base font-bold text-white leading-tight truncate">
              {character.name}
            </p>
            {character.occupation && (
              <p className="text-xs text-coc-muted mt-0.5 truncate">
                {character.occupation}
                {character.age ? `・${character.age}歳` : ""}
              </p>
            )}
          </div>
          {/* ステータスバッジ */}
          <div className="absolute top-2 right-2">
            <StatusBadge status={character.status} />
          </div>
          {/* 追悼バッジ（死亡・引退で最終章記録済みの場合） */}
          {(character.status === "dead" || character.status === "retired") &&
            (character.farewell_scene || character.farewell_message) && (
              <div className="absolute bottom-2 right-2">
                <span
                  className="rounded-full bg-black/70 border border-white/20 px-1.5 py-0.5 text-[10px] text-white/60 font-cinzel"
                  title="最終章が記録されています"
                >
                  ✦ 最終章
                </span>
              </div>
            )}
          {/* ピン留めボタン */}
          <button
            onClick={handlePin}
            className={`absolute top-2 left-2 p-1 rounded-full transition-colors ${
              character.is_pinned
                ? "text-coc-gold bg-black/60"
                : "text-white/50 bg-black/40 hover:text-coc-gold hover:bg-black/60"
            }`}
            title={character.is_pinned ? "ピン留め解除" : "ピン留め"}
          >
            <Star size={14} fill={character.is_pinned ? "currentColor" : "none"} />
          </button>
        </div>

        {/* 下部テキストエリア */}
        <div className="px-3 py-3 space-y-2">
          {/* キャッチフレーズ */}
          {character.catchphrase && (
            <p className="text-xs italic text-coc-gold font-crimson leading-snug line-clamp-2 pl-2 border-l-2 border-coc-gold-dim">
              &ldquo;{character.catchphrase}&rdquo;
            </p>
          )}

          {/* シナリオ */}
          {character.scenario_name && (
            <p className="text-xs text-coc-muted truncate">
              {character.scenario_name}
            </p>
          )}

          {/* HP / SAN バー */}
          <div className="space-y-1.5">
            <DerivedStatBar
              label="HP"
              current={character.hp_current}
              max={character.hp_max}
              color="hp"
              compact
            />
            <DerivedStatBar
              label="SAN"
              current={character.san_current}
              max={character.san_max}
              color="san"
              compact
            />
          </div>

          {/* 特技スキル Top3 */}
          {top.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {top.map((skill) => (
                <span
                  key={skill.id}
                  className={`rounded-full px-2 py-0.5 text-xs border transition-all duration-200 ${
                    skill.is_occupation
                      ? "text-coc-gold border-coc-gold-dim bg-coc-void hover:border-coc-gold hover:shadow-[0_0_8px_rgba(201,133,58,0.45)]"
                      : "text-coc-muted border-coc-border bg-coc-void hover:text-coc-text hover:border-coc-border-glow"
                  }`}
                >
                  {skill.skill_name} {skill.current_value}%
                </span>
              ))}
            </div>
          )}

          {/* 比較ボタン */}
          {onToggleCompare && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleCompare(character.id);
              }}
              className={`w-full rounded py-1 text-xs border transition-colors ${
                isCompared
                  ? "border-coc-gold text-coc-gold bg-coc-gold/10 hover:bg-coc-gold/20"
                  : "border-coc-border/60 text-coc-muted hover:border-coc-gold hover:text-coc-gold"
              }`}
            >
              {isCompared ? "✓ 比較中" : "+ 比較に追加"}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
