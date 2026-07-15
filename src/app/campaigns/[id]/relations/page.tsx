"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  Character,
  CampaignCharacterRelation,
  CampaignRelationType,
} from "@/lib/supabase";

const NODE_R = 38;
const SVG_W = 800;
const SVG_H = 520;

const RELATION_COLORS: Record<CampaignRelationType, string> = {
  ally: "#22c55e",
  rival: "#ef4444",
  romantic: "#ec4899",
  mentor: "#3b82f6",
  distrust: "#f97316",
  other: "#6b7280",
};

const RELATION_LABELS: Record<CampaignRelationType, string> = {
  ally: "友好",
  rival: "ライバル",
  romantic: "恋愛",
  mentor: "師弟",
  distrust: "疑惑",
  other: "その他",
};

function circlePosition(index: number, total: number): { x: number; y: number } {
  const angle = (index / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
  return {
    x: SVG_W / 2 + 200 * Math.cos(angle),
    y: SVG_H / 2 + 170 * Math.sin(angle),
  };
}

export default function CampaignRelationsPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params.id;

  const [characters, setCharacters] = useState<Character[]>([]);
  const [relations, setRelations] = useState<CampaignCharacterRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignTitle, setCampaignTitle] = useState("");
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  const [showAddForm, setShowAddForm] = useState(false);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [relationType, setRelationType] = useState<CampaignRelationType>("ally");
  const [relationNote, setRelationNote] = useState("");
  const [isMutual, setIsMutual] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    async function load() {
      const [{ data: campaign }, { data: links }] = await Promise.all([
        supabase.from("campaigns").select("title").eq("id", campaignId).single(),
        supabase.from("campaign_scenarios").select("scenario_id").eq("campaign_id", campaignId),
      ]);
      setCampaignTitle(campaign?.title ?? "");

      const scenarioIds = (links ?? []).map((l) => l.scenario_id as string);

      let chars: Character[] = [];
      if (scenarioIds.length > 0) {
        const { data: participants } = await supabase
          .from("scenario_participants")
          .select("characters(*)")
          .in("scenario_id", scenarioIds);

        const seen = new Set<string>();
        chars = (participants ?? [])
          .map((p) => p.characters as unknown as Character)
          .filter((c) => c && !seen.has(c.id) && seen.add(c.id) as unknown as boolean);
      }

      const { data: rels } = await supabase
        .from("character_relations")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at");

      setCharacters(chars);
      setRelations((rels ?? []) as CampaignCharacterRelation[]);

      const pos: Record<string, { x: number; y: number }> = {};
      chars.forEach((c, i) => {
        pos[c.id] = circlePosition(i, chars.length);
      });
      setPositions(pos);
      setLoading(false);
    }
    load();
  }, [campaignId]);

  async function handleAddRelation() {
    if (!isSupabaseConfigured || !fromId || !toId || fromId === toId) return;
    setAddLoading(true);
    const { data } = await supabase
      .from("character_relations")
      .insert({
        campaign_id: campaignId,
        from_character_id: fromId,
        to_character_id: toId,
        relation_type: relationType,
        relation_note: relationNote.trim() || null,
        is_mutual: isMutual,
      })
      .select()
      .single();
    if (data) setRelations((prev) => [...prev, data as CampaignCharacterRelation]);
    setFromId("");
    setToId("");
    setRelationType("ally");
    setRelationNote("");
    setIsMutual(false);
    setShowAddForm(false);
    setAddLoading(false);
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("character_relations").delete().eq("id", id);
    setRelations((prev) => prev.filter((r) => r.id !== id));
  }

  const charMap = new Map(characters.map((c) => [c.id, c]));

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-coc-muted text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/campaigns/${campaignId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          キャンペーンに戻る
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-coc-text">🤝 キャラクター関係図</h1>
          {campaignTitle && <p className="text-sm text-coc-muted mt-1">{campaignTitle}</p>}
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-1.5 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors"
        >
          <Plus size={15} />
          関係を追加
        </button>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4">
        {(Object.entries(RELATION_LABELS) as [CampaignRelationType, string][]).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RELATION_COLORS[type] }} />
            <span className="text-xs text-coc-muted">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-3 ml-2 text-xs text-coc-muted">
          <span>— — 片方向</span>
          <span>——— 相互</span>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <p className="text-sm font-medium text-coc-text mb-3">関係を追加</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-coc-muted mb-1 block">自キャラクター（from）</label>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text"
              >
                <option value="">選択してください</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-coc-muted mb-1 block">相手キャラクター（to）</label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text"
              >
                <option value="">選択してください</option>
                {characters
                  .filter((c) => c.id !== fromId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-coc-muted mb-1 block">関係種別</label>
              <select
                value={relationType}
                onChange={(e) => setRelationType(e.target.value as CampaignRelationType)}
                className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text"
              >
                {(Object.entries(RELATION_LABELS) as [CampaignRelationType, string][]).map(([t, l]) => (
                  <option key={t} value={t}>{l}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-coc-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMutual}
                  onChange={(e) => setIsMutual(e.target.checked)}
                  className="w-4 h-4 rounded accent-coc-gold"
                />
                相互関係
              </label>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs text-coc-muted mb-1 block">メモ（任意）</label>
            <input
              value={relationNote}
              onChange={(e) => setRelationNote(e.target.value)}
              placeholder="例: 同じ事件の生存者"
              className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleAddRelation}
              disabled={!fromId || !toId || fromId === toId || addLoading}
              className="rounded-lg bg-coc-gold px-4 py-1.5 text-sm font-medium text-coc-bg hover:bg-coc-gold/90 disabled:opacity-50 transition-colors"
            >
              {addLoading ? "追加中..." : "追加"}
            </button>
          </div>
        </div>
      )}

      {/* SVG Map */}
      {characters.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-12 text-center">
          <p className="text-coc-muted text-sm">
            このキャンペーンにはまだキャラクターが登録されていません。
          </p>
          <p className="text-coc-muted text-xs mt-2">
            各シナリオに参加者を追加するとここに表示されます。
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-coc-border bg-coc-surface overflow-hidden mb-4">
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full">
            {/* Edges */}
            {relations.map((rel) => {
              const from = positions[rel.from_character_id];
              const to = positions[rel.to_character_id];
              if (!from || !to) return null;
              const color = RELATION_COLORS[rel.relation_type as CampaignRelationType] ?? "#6b7280";
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist === 0) return null;
              const ux = dx / dist;
              const uy = dy / dist;
              const x1 = from.x + ux * NODE_R;
              const y1 = from.y + uy * NODE_R;
              const x2 = to.x - ux * NODE_R;
              const y2 = to.y - uy * NODE_R;
              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2;
              return (
                <g key={rel.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth={rel.is_mutual ? 2 : 1.5}
                    strokeDasharray={rel.is_mutual ? undefined : "5 3"}
                    opacity={0.75}
                  />
                  <text x={mx} y={my - 6} textAnchor="middle" fontSize="10" fill={color}>
                    {RELATION_LABELS[rel.relation_type as CampaignRelationType]}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {characters.map((char) => {
              const pos = positions[char.id] ?? { x: SVG_W / 2, y: SVG_H / 2 };
              return (
                <g key={char.id} transform={`translate(${pos.x},${pos.y})`}>
                  <circle r={NODE_R} fill="#1e293b" stroke="#b8860b" strokeWidth={1.5} />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="#e2c97e"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {char.name.length > 6 ? char.name.slice(0, 5) + "…" : char.name}
                  </text>
                  {char.occupation && (
                    <text
                      y={NODE_R + 13}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#9ca3af"
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {char.occupation.length > 8
                        ? char.occupation.slice(0, 7) + "…"
                        : char.occupation}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Relations list */}
      {relations.length > 0 && (
        <div>
          <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-2">関係一覧</p>
          <div className="space-y-2">
            {relations.map((rel) => {
              const from = charMap.get(rel.from_character_id);
              const to = charMap.get(rel.to_character_id);
              const color = RELATION_COLORS[rel.relation_type as CampaignRelationType] ?? "#6b7280";
              return (
                <div
                  key={rel.id}
                  className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-xs"
                >
                  <span className="font-medium text-coc-text">{from?.name ?? "?"}</span>
                  <span style={{ color }} className="font-medium">
                    {rel.is_mutual ? "⇄" : "→"}{" "}
                    {RELATION_LABELS[rel.relation_type as CampaignRelationType]}
                  </span>
                  <span className="font-medium text-coc-text">{to?.name ?? "?"}</span>
                  {rel.relation_note && (
                    <span className="text-coc-muted ml-1">— {rel.relation_note}</span>
                  )}
                  <button
                    onClick={() => handleDelete(rel.id)}
                    className="ml-auto text-coc-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
