"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Users } from "lucide-react";
import { supabase, isSupabaseConfigured, Npc, NpcRelationship, NpcRelationType } from "@/lib/supabase";

const RELATION_COLORS: Record<NpcRelationType, string> = {
  ally: "#22c55e",
  enemy: "#ef4444",
  family: "#3b82f6",
  employer: "#eab308",
  secret: "#a855f7",
  unknown: "#6b7280",
};

const RELATION_LABELS: Record<NpcRelationType, string> = {
  ally: "協力",
  enemy: "対立",
  family: "家族",
  employer: "雇用",
  secret: "秘密",
  unknown: "不明",
};

const NODE_R = 36;
const SVG_W = 800;
const SVG_H = 520;

type NodePos = { x: number; y: number };

function buildInitialPositions(npcs: Npc[], scenarioId: string): Record<string, NodePos> {
  let stored: Record<string, NodePos> = {};
  try {
    const raw = localStorage.getItem(`npc-map-pos-${scenarioId}`);
    if (raw) stored = JSON.parse(raw);
  } catch {}

  const positions: Record<string, NodePos> = {};
  npcs.forEach((npc, i) => {
    if (stored[npc.id]) {
      positions[npc.id] = stored[npc.id];
    } else {
      const angle = (i / Math.max(npcs.length, 1)) * 2 * Math.PI - Math.PI / 2;
      positions[npc.id] = {
        x: SVG_W / 2 + 200 * Math.cos(angle),
        y: SVG_H / 2 + 160 * Math.sin(angle),
      };
    }
  });
  return positions;
}

export default function NpcRelationshipMapPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;
  const router = useRouter();

  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [relationships, setRelationships] = useState<NpcRelationship[]>([]);
  const [positions, setPositions] = useState<Record<string, NodePos>>({});
  const [loading, setLoading] = useState(true);
  const [scenarioTitle, setScenarioTitle] = useState("");

  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<{ npcId: string; offsetX: number; offsetY: number } | null>(null);
  const didDragRef = useRef(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formFromId, setFormFromId] = useState("");
  const [formToId, setFormToId] = useState("");
  const [formRelationType, setFormRelationType] = useState<NpcRelationType>("unknown");
  const [formLabel, setFormLabel] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    async function load() {
      const { data: scenario } = await supabase
        .from("scenarios")
        .select("title")
        .eq("id", scenarioId)
        .single();

      const title = scenario?.title ?? "";
      setScenarioTitle(title);

      const [{ data: npcData }, { data: relData }] = await Promise.all([
        supabase.from("npcs").select("*").eq("scenario_name", title),
        supabase.from("npc_relationships").select("*").eq("scenario_id", scenarioId),
      ]);

      const loaded = npcData ?? [];
      setNpcs(loaded);
      setRelationships(relData ?? []);
      setPositions(buildInitialPositions(loaded, scenarioId));
      setLoading(false);
    }
    load();
  }, [scenarioId]);

  const savePositions = useCallback(
    (pos: Record<string, NodePos>) => {
      try {
        localStorage.setItem(`npc-map-pos-${scenarioId}`, JSON.stringify(pos));
      } catch {}
    },
    [scenarioId]
  );

  const getSvgPoint = (e: { clientX: number; clientY: number }): NodePos | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * SVG_W,
      y: ((e.clientY - rect.top) / rect.height) * SVG_H,
    };
  };

  const onNodeMouseDown = (e: React.MouseEvent, npcId: string) => {
    e.preventDefault();
    e.stopPropagation();
    didDragRef.current = false;
    const pt = getSvgPoint(e);
    if (!pt) return;
    const pos = positions[npcId] ?? { x: SVG_W / 2, y: SVG_H / 2 };
    draggingRef.current = { npcId, offsetX: pt.x - pos.x, offsetY: pt.y - pos.y };
  };

  const onSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingRef.current) return;
    didDragRef.current = true;
    const pt = getSvgPoint(e);
    if (!pt) return;
    const { npcId, offsetX, offsetY } = draggingRef.current;
    setPositions((prev) => ({
      ...prev,
      [npcId]: {
        x: Math.max(NODE_R, Math.min(SVG_W - NODE_R, pt.x - offsetX)),
        y: Math.max(NODE_R, Math.min(SVG_H - NODE_R, pt.y - offsetY)),
      },
    }));
  };

  const onSvgMouseUp = () => {
    if (draggingRef.current) {
      draggingRef.current = null;
      setPositions((latest) => {
        savePositions(latest);
        return latest;
      });
    }
  };

  const onNodeClick = (npcId: string) => {
    if (didDragRef.current) return;
    router.push(`/npcs/${npcId}`);
  };

  const handleAddRelationship = async () => {
    if (!formFromId || !formToId || formFromId === formToId) return;
    setAdding(true);
    const { data } = await supabase
      .from("npc_relationships")
      .insert({
        scenario_id: scenarioId,
        from_npc_id: formFromId,
        to_npc_id: formToId,
        relation_type: formRelationType,
        label: formLabel.trim() || null,
      })
      .select()
      .single();
    if (data) setRelationships((prev) => [...prev, data as NpcRelationship]);
    setFormFromId("");
    setFormToId("");
    setFormLabel("");
    setFormRelationType("unknown");
    setShowAddForm(false);
    setAdding(false);
  };

  const handleDeleteRelationship = async (id: string) => {
    await supabase.from("npc_relationships").delete().eq("id", id);
    setRelationships((prev) => prev.filter((r) => r.id !== id));
  };

  const npcMap = new Map(npcs.map((n) => [n.id, n]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオに戻る
        </Link>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-coc-text">NPC関係図</h1>
          {scenarioTitle && <p className="text-sm text-coc-muted mt-1">{scenarioTitle}</p>}
        </div>
        {npcs.length > 0 && (
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-1.5 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors"
          >
            <Plus size={15} />
            関係を追加
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4">
        {(Object.entries(RELATION_LABELS) as [NpcRelationType, string][]).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-8 h-0.5 rounded" style={{ backgroundColor: RELATION_COLORS[type] }} />
            <span className="text-xs text-coc-muted">{label}</span>
          </div>
        ))}
      </div>

      {showAddForm && (
        <div className="mb-5 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <p className="text-sm font-medium text-coc-text mb-3">NPC間の関係を追加</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-coc-muted mb-1 block">NPC（from）</label>
              <select
                value={formFromId}
                onChange={(e) => setFormFromId(e.target.value)}
                className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text"
              >
                <option value="">選択...</option>
                {npcs.map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-coc-muted mb-1 block">NPC（to）</label>
              <select
                value={formToId}
                onChange={(e) => setFormToId(e.target.value)}
                className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text"
              >
                <option value="">選択...</option>
                {npcs.filter((n) => n.id !== formFromId).map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-coc-muted mb-1 block">関係タイプ</label>
              <select
                value={formRelationType}
                onChange={(e) => setFormRelationType(e.target.value as NpcRelationType)}
                className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text"
              >
                {(Object.entries(RELATION_LABELS) as [NpcRelationType, string][]).map(([type, label]) => (
                  <option key={type} value={type}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-coc-muted mb-1 block">ラベル（任意）</label>
              <input
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="例: 上司と部下"
                className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleAddRelationship}
              disabled={!formFromId || !formToId || adding}
              className="rounded-lg bg-coc-gold px-4 py-1.5 text-sm font-medium text-coc-bg hover:bg-coc-gold/90 disabled:opacity-50 transition-colors"
            >
              {adding ? "追加中..." : "追加"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-coc-muted">読み込み中...</p>
      ) : npcs.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center">
          <Users size={32} className="text-coc-muted mx-auto mb-3" />
          <p className="text-sm text-coc-muted mb-3">NPCが登録されていません</p>
          <Link
            href={`/scenarios/${scenarioId}/npcs`}
            className="text-xs text-coc-gold hover:underline"
          >
            NPCを登録する →
          </Link>
        </div>
      ) : (
        <div
          className="rounded-xl border border-coc-border bg-coc-surface overflow-hidden"
          style={{ touchAction: "none" }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full"
            style={{ userSelect: "none" }}
            onMouseMove={onSvgMouseMove}
            onMouseUp={onSvgMouseUp}
            onMouseLeave={onSvgMouseUp}
          >
            {/* Edges */}
            {relationships.map((rel) => {
              const from = positions[rel.from_npc_id];
              const to = positions[rel.to_npc_id];
              if (!from || !to) return null;
              const color = RELATION_COLORS[rel.relation_type as NpcRelationType] ?? "#6b7280";
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              const displayLabel = rel.label ?? RELATION_LABELS[rel.relation_type as NpcRelationType];
              return (
                <g key={rel.id}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={color}
                    strokeWidth={2}
                    strokeOpacity={0.75}
                  />
                  <text
                    x={mx}
                    y={my}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={11}
                    fill={color}
                    stroke="var(--coc-bg,#111)"
                    strokeWidth={3}
                    paintOrder="stroke"
                    className="pointer-events-none select-none"
                  >
                    {displayLabel}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {npcs.map((npc) => {
              const pos = positions[npc.id];
              if (!pos) return null;
              const displayName = npc.name.length > 7 ? npc.name.slice(0, 6) + "…" : npc.name;
              return (
                <g
                  key={npc.id}
                  transform={`translate(${pos.x},${pos.y})`}
                  style={{ cursor: "grab" }}
                  onMouseDown={(e) => onNodeMouseDown(e, npc.id)}
                  onClick={() => onNodeClick(npc.id)}
                >
                  <circle
                    r={NODE_R}
                    fill="var(--coc-raised,#1a1a1a)"
                    stroke="var(--coc-gold,#c9a96e)"
                    strokeWidth={1.5}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={12}
                    fill="var(--coc-text,#e8dcc8)"
                    className="pointer-events-none select-none"
                  >
                    {displayName}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      <p className="mt-3 text-xs text-coc-muted">
        ノードをドラッグして配置を調整できます（位置は自動保存）。ノードをクリックするとNPC詳細へ移動します。
      </p>

      {/* Relationship list */}
      {relationships.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-coc-text mb-3">関係一覧</h2>
          <div className="flex flex-col gap-2">
            {relationships.map((rel) => {
              const from = npcMap.get(rel.from_npc_id);
              const to = npcMap.get(rel.to_npc_id);
              const color = RELATION_COLORS[rel.relation_type as NpcRelationType] ?? "#6b7280";
              const displayLabel = rel.label ?? RELATION_LABELS[rel.relation_type as NpcRelationType];
              return (
                <div
                  key={rel.id}
                  className="flex items-center gap-3 rounded-lg border border-coc-border bg-coc-surface px-4 py-2"
                >
                  <Link
                    href={`/npcs/${rel.from_npc_id}`}
                    className="text-sm text-coc-text hover:text-coc-gold transition-colors truncate max-w-[100px]"
                  >
                    {from?.name ?? "?"}
                  </Link>
                  <span
                    className="flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium"
                    style={{ color, borderColor: `${color}60` }}
                  >
                    {displayLabel}
                  </span>
                  <Link
                    href={`/npcs/${rel.to_npc_id}`}
                    className="text-sm text-coc-text hover:text-coc-gold transition-colors truncate max-w-[100px]"
                  >
                    {to?.name ?? "?"}
                  </Link>
                  <button
                    onClick={() => handleDeleteRelationship(rel.id)}
                    className="ml-auto flex-shrink-0 text-coc-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
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
