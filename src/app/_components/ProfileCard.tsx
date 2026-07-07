"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import type { Character, CharacterSkill } from "@/lib/supabase";

type Props = {
  character: Character;
  skills: CharacterSkill[];
};

export default function ProfileCard({ character: c, skills }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const occupationSkills = skills
    .filter((s) => s.is_occupation)
    .sort((a, b) => b.current_value - a.current_value)
    .slice(0, 5);

  const statItems = [
    { label: "STR", value: c.str },
    { label: "CON", value: c.con },
    { label: "POW", value: c.pow },
    { label: "DEX", value: c.dex },
    { label: "APP", value: c.app },
    { label: "SIZ", value: c.siz },
    { label: "INT", value: c.int_stat },
    { label: "EDU", value: c.edu },
  ];

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#1a1612",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${c.name}_profile.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors disabled:opacity-50"
        >
          <Download size={14} />
          {downloading ? "生成中…" : "PNG ダウンロード"}
        </button>
      </div>

      {/* カード本体 — html2canvas のキャプチャ対象 */}
      <div
        ref={cardRef}
        className="rounded-xl border-2 border-coc-gold-dim bg-coc-bg p-6 space-y-5 max-w-sm mx-auto"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {/* ヘッダー */}
        <div className="text-center border-b border-coc-border pb-4">
          {(c.avatar_url ?? c.portrait_url) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(c.avatar_url ?? c.portrait_url) as string}
              alt={c.name}
              className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-coc-gold-dim"
            />
          )}
          <p className="text-xs text-coc-muted tracking-widest uppercase mb-1">
            Call of Cthulhu
          </p>
          <h2
            className="text-2xl font-bold text-coc-text leading-tight"
            style={{ fontFamily: "Cinzel, Georgia, serif" }}
          >
            {c.name}
          </h2>
          {c.occupation && (
            <p className="text-sm text-coc-gold mt-1">{c.occupation}</p>
          )}
          <div className="flex items-center justify-center gap-3 mt-2 text-xs text-coc-muted">
            {c.age && <span>{c.age}歳</span>}
            {c.gender && <span>{c.gender}</span>}
            {c.player_name && <span>PL: {c.player_name}</span>}
          </div>
        </div>

        {/* キャッチフレーズ */}
        {c.catchphrase && (
          <p
            className="text-center text-sm text-coc-gold italic leading-relaxed border-l-2 border-coc-gold-dim pl-3"
            style={{ fontFamily: "'Crimson Text', Georgia, serif" }}
          >
            &ldquo;{c.catchphrase}&rdquo;
          </p>
        )}

        {/* HP / SAN */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "HP", current: c.hp_current, max: c.hp_max },
            { label: "SAN", current: c.san_current, max: c.san_max },
            { label: "MP", current: c.mp_current, max: c.mp_max },
          ].map(({ label, current, max }) => (
            <div
              key={label}
              className="rounded-lg border border-coc-border bg-coc-surface p-2 text-center"
            >
              <p className="text-xs text-coc-muted mb-0.5">{label}</p>
              <p className="text-lg font-bold text-coc-text leading-none">
                {current}
              </p>
              <p className="text-xs text-coc-muted">/ {max}</p>
            </div>
          ))}
        </div>

        {/* 能力値 */}
        <div>
          <p className="text-xs text-coc-muted uppercase tracking-widest mb-2">
            能力値
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {statItems.map(({ label, value }) => (
              <div
                key={label}
                className="rounded border border-coc-border bg-coc-surface p-1.5 text-center"
              >
                <p className="text-[10px] text-coc-muted">{label}</p>
                <p className="text-sm font-bold text-coc-text">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 職業技能 */}
        {occupationSkills.length > 0 && (
          <div>
            <p className="text-xs text-coc-muted uppercase tracking-widest mb-2">
              得意技能
            </p>
            <div className="space-y-1">
              {occupationSkills.map((s) => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span className="text-coc-text">{s.skill_name}</span>
                  <span className="text-coc-gold font-bold">
                    {s.current_value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 背景 */}
        {c.background && (
          <div>
            <p className="text-xs text-coc-muted uppercase tracking-widest mb-1">
              背景
            </p>
            <p
              className="text-xs text-coc-text leading-relaxed line-clamp-4"
              style={{ fontFamily: "'Crimson Text', Georgia, serif" }}
            >
              {c.background}
            </p>
          </div>
        )}

        {/* フッター */}
        <div className="border-t border-coc-border pt-3 text-center">
          <p className="text-[10px] text-coc-muted tracking-widest">
            CoC Portal — trpg-portal
          </p>
        </div>
      </div>
    </div>
  );
}
