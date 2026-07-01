"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, CharacterRelation, RelationType } from "@/lib/supabase";

const RELATION_COLORS: Record<RelationType, { fill: string; stroke: string; text: string }> = {
  友人: { fill: "#14532d", stroke: "#22c55e", text: "#86efac" },
  ライバル: { fill: "#7c2d12", stroke: "#f97316", text: "#fdba74" },
  恩人: { fill: "#1e3a5f", stroke: "#3b82f6", text: "#93c5fd" },
  要注意: { fill: "#7f1d1d", stroke: "#ef4444", text: "#fca5a5" },
  その他: { fill: "#374151", stroke: "#6b7280", text: "#d1d5db" },
};

const SVG_W = 600;
const SVG_H = 500;
const CX = SVG_W / 2;
const CY = SVG_H / 2;
const CENTER_R = 44;
const NODE_R = 36;
const ORBIT_R = 180;

type Props = { params: Promise<{ id: string }> };

export default function RelationGraphPage({ params }: Props) {
  const [characterName, setCharacterName] = useState<string>("");
  const [characterId, setCharacterId] = useState<string>("");
  const [relations, setRelations] = useState<CharacterRelation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => {
      setCharacterId(id);
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      Promise.all([
        supabase.from("characters").select("id, name").eq("id", id).single(),
        supabase.from("character_relations").select("*").eq("character_id", id).order("created_at", { ascending: true }),
      ]).then(([{ data: char }, { data: rels }]) => {
        setCharacterName(char?.name ?? "");
        setRelations(rels ?? []);
        setLoading(false);
      });
    });
  }, [params]);

  const count = relations.length;
  const angleStep = count > 0 ? (2 * Math.PI) / count : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={characterId ? `/characters/${characterId}/relations` : "#"}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          関係メモへ
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-6">
        キャラクター相関図
      </h1>

      {loading && (
        <p className="text-coc-muted text-sm">読み込み中…</p>
      )}

      {!loading && count === 0 && (
        <div className="rounded-lg border border-coc-border p-6 text-center">
          <p className="text-coc-muted text-sm mb-3">関係メモがまだ登録されていません。</p>
          <Link
            href={characterId ? `/characters/${characterId}/relations` : "#"}
            className="text-sm text-coc-gold hover:underline"
          >
            関係メモを追加する →
          </Link>
        </div>
      )}

      {!loading && count > 0 && (
        <>
          {/* 凡例 */}
          <div className="flex flex-wrap gap-3 mb-4">
            {(Object.entries(RELATION_COLORS) as [RelationType, typeof RELATION_COLORS[RelationType]][]).map(([type, col]) => (
              <span key={type} className="flex items-center gap-1.5 text-xs" style={{ color: col.text }}>
                <span
                  className="inline-block w-3 h-3 rounded-full border"
                  style={{ background: col.fill, borderColor: col.stroke }}
                />
                {type}
              </span>
            ))}
          </div>

          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full max-w-[600px] mx-auto block"
              style={{ minHeight: 320 }}
              aria-label="キャラクター相関図"
            >
              {/* エッジ */}
              {relations.map((rel: CharacterRelation, i: number) => {
                const angle = i * angleStep - Math.PI / 2;
                const nx = CX + ORBIT_R * Math.cos(angle);
                const ny = CY + ORBIT_R * Math.sin(angle);
                const col = RELATION_COLORS[rel.relation_type as RelationType] ?? RELATION_COLORS["その他"];
                const mx = (CX + nx) / 2;
                const my = (CY + ny) / 2;
                return (
                  <g key={rel.id}>
                    <line
                      x1={CX}
                      y1={CY}
                      x2={nx}
                      y2={ny}
                      stroke={col.stroke}
                      strokeWidth={1.5}
                      strokeOpacity={0.5}
                    />
                    <text
                      x={mx}
                      y={my - 4}
                      textAnchor="middle"
                      fontSize={10}
                      fill={col.text}
                      className="pointer-events-none select-none"
                    >
                      {rel.relation_type}
                    </text>
                  </g>
                );
              })}

              {/* 外周ノード */}
              {relations.map((rel: CharacterRelation, i: number) => {
                const angle = i * angleStep - Math.PI / 2;
                const nx = CX + ORBIT_R * Math.cos(angle);
                const ny = CY + ORBIT_R * Math.sin(angle);
                const col = RELATION_COLORS[rel.relation_type as RelationType] ?? RELATION_COLORS["その他"];
                const maxLen = 8;
                const displayName =
                  rel.target_name.length > maxLen
                    ? rel.target_name.slice(0, maxLen - 1) + "…"
                    : rel.target_name;
                return (
                  <g key={rel.id}>
                    <circle
                      cx={nx}
                      cy={ny}
                      r={NODE_R}
                      fill={col.fill}
                      stroke={col.stroke}
                      strokeWidth={2}
                    />
                    <text
                      x={nx}
                      y={ny + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={11}
                      fontWeight="600"
                      fill={col.text}
                      className="pointer-events-none select-none"
                    >
                      {displayName}
                    </text>
                    {rel.memo && (
                      <title>{rel.target_name}: {rel.memo}</title>
                    )}
                  </g>
                );
              })}

              {/* 中心ノード（現キャラ） */}
              <circle
                cx={CX}
                cy={CY}
                r={CENTER_R}
                fill="#1c1a14"
                stroke="#b8960c"
                strokeWidth={2.5}
              />
              <text
                x={CX}
                y={CY + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12}
                fontWeight="700"
                fill="#f0e6c0"
                className="pointer-events-none select-none"
              >
                {characterName.length > 7
                  ? characterName.slice(0, 6) + "…"
                  : characterName}
              </text>
            </svg>
          </div>

          {/* メモ一覧 */}
          {relations.some((r: CharacterRelation) => r.memo) && (
            <div className="mt-6 space-y-2">
              <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-2">関係メモ詳細</h2>
              {relations.filter((r: CharacterRelation) => r.memo).map((rel: CharacterRelation) => {
                const col = RELATION_COLORS[rel.relation_type as RelationType] ?? RELATION_COLORS["その他"];
                return (
                  <div
                    key={rel.id}
                    className="rounded border px-3 py-2 text-sm"
                    style={{ borderColor: col.stroke + "55", background: col.fill + "33" }}
                  >
                    <span className="font-semibold" style={{ color: col.text }}>{rel.target_name}</span>
                    <span className="mx-1.5 text-coc-muted text-xs">({rel.relation_type})</span>
                    <span className="text-coc-text">{rel.memo}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
