import Link from "next/link";
import { Character, CharacterSkill } from "@/lib/supabase";
import StatusBadge from "./StatusBadge";
import PortraitImage from "./PortraitImage";
import DerivedStatBar from "./DerivedStatBar";

type Props = {
  character: Character;
  skills?: CharacterSkill[];
};

function topSkills(skills: CharacterSkill[]): CharacterSkill[] {
  return [...skills]
    .sort((a, b) => b.current_value - a.current_value)
    .slice(0, 3);
}

export default function CharacterCard({ character, skills = [] }: Props) {
  const top = topSkills(skills);

  return (
    <Link href={`/characters/${character.id}`} className="group block">
      <div className="rounded-lg border border-coc-border bg-coc-surface overflow-hidden transition-all duration-300 ease-out group-hover:border-coc-border-glow group-hover:shadow-[0_4px_20px_rgba(201,133,58,0.30)] motion-safe:group-hover:-translate-y-1">
        {/* ポートレート */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <PortraitImage
            url={character.portrait_url}
            name={character.name}
            className="transition-transform duration-300 group-hover:scale-105"
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
        </div>

        {/* 下部テキストエリア */}
        <div className="px-3 py-3 space-y-2">
          {/* キャッチフレーズ */}
          {character.catchphrase && (
            <p className="text-xs italic text-coc-gold font-crimson leading-snug line-clamp-2">
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
                  className={`rounded-full px-2 py-0.5 text-xs border border-coc-border ${
                    skill.is_occupation
                      ? "text-coc-gold border-coc-gold-dim bg-coc-void"
                      : "text-coc-muted bg-coc-void"
                  }`}
                >
                  {skill.skill_name} {skill.current_value}%
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
