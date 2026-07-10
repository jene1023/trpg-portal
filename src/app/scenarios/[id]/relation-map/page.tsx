"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import { supabase, isSupabaseConfigured, CharacterRelation, RelationType } from "@/lib/supabase";

const NODE_R = 40;

type NodeKind = "character" | "npc";

type MapNode = {
  id: string;
  name: string;
  kind: NodeKind;
  x: number;
  y: number;
};

type MapEdge = {
  id: string;
  sourceId: string;
  targetName: string;
  relationType: RelationType;
};

function edgeStyle(rt: RelationType): { stroke: string; strokeDasharray?: string } {
  if (rt === "友人" || rt === "恩人") return { stroke: "#34d399" };
  if (rt === "要注意" || rt === "ライバル") return { stroke: "#f87171", strokeDasharray: "6 3" };
  return { stroke: "#6b7280", strokeDasharray: "3 3" };
}

function layoutNodes(
  raw: Omit<MapNode, "x" | "y">[],
  saved: Record<string, { x: number; y: number }>
): MapNode[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(raw.length)));
  const GAP_X = 140;
  const GAP_Y = 130;
  const PAD = 80;
  return raw.map((n, i) => ({
    ...n,
    x: saved[n.id]?.x ?? PAD + (i % cols) * GAP_X,
    y: saved[n.id]?.y ?? PAD + Math.floor(i / cols) * GAP_Y,
  }));
}

function splitLabel(name: string): string[] {
  if (name.length <= 5) return [name];
  if (name.length <= 10) return [name.slice(0, 5), name.slice(5)];
  return [name.slice(0, 5), name.slice(5, 9) + "…"];
}

const LEGEND: { label: string; stroke: string; dash?: string }[] = [
  { label: "友人・恩人", stroke: "#34d399" },
  { label: "ライバル・要注意", stroke: "#f87171", dash: "6 3" },
  { label: "その他", stroke: "#6b7280", dash: "3 3" },
];

export default function RelationMapPage() {
  const { id: scenarioId } = useParams<{ id: string }>();
  const localKey = `relation-map-${scenarioId}`;

  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<MapEdge[]>([]);
  const [scenarioTitle, setScenarioTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const nodesRef = useRef<MapNode[]>([]);
  const dragging = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data: sc } = await supabase
        .from("scenarios")
        .select("id,title")
        .eq("id", scenarioId)
        .single();
      if (!sc) {
        setLoading(false);
        return;
      }
      setScenarioTitle(sc.title);

      const [{ data: npcs }, { data: parts }, { data: rels }] = await Promise.all([
        supabase.from("npcs").select("id,name").eq("scenario_name", sc.title),
        supabase
          .from("scenario_participants")
          .select("character_id, characters(id,name)")
          .eq("scenario_id", scenarioId),
        supabase.from("character_relations").select("*"),
      ]);

      const raw: Omit<MapNode, "x" | "y">[] = [];
      const seenNames = new Set<string>();

      for (const n of npcs ?? []) {
        if (!seenNames.has(n.name)) {
          raw.push({ id: `npc-${n.id}`, name: n.name, kind: "npc" });
          seenNames.add(n.name);
        }
      }
      for (const p of (parts ?? []) as Array<{ character_id: string; characters: { id: string; name: string } | null }>) {
        if (p.characters && !seenNames.has(p.characters.name)) {
          raw.push({ id: `char-${p.characters.id}`, name: p.characters.name, kind: "character" });
          seenNames.add(p.characters.name);
        }
      }

      let saved: Record<string, { x: number; y: number }> = {};
      try {
        saved = JSON.parse(localStorage.getItem(localKey) ?? "{}") ?? {};
      } catch {}

      setNodes(layoutNodes(raw, saved));

      const charIds = new Set((parts ?? []).map((p: { character_id: string }) => p.character_id));
      setEdges(
        ((rels ?? []) as CharacterRelation[])
          .filter((r) => charIds.has(r.character_id))
          .map((r) => ({
            id: r.id,
            sourceId: `char-${r.character_id}`,
            targetName: r.target_name,
            relationType: r.relation_type,
          }))
      );
      setLoading(false);
    })();
  }, [scenarioId, localKey]);

  const onNodeMouseDown = useCallback(
    (e: React.MouseEvent<SVGGElement>, nodeId: string) => {
      e.preventDefault();
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (!node) return;
      dragging.current = {
        id: nodeId,
        ox: e.clientX - rect.left - node.x,
        oy: e.clientY - rect.top - node.y,
      };
    },
    []
  );

  const onSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { id, ox, oy } = dragging.current;
    const nx = e.clientX - rect.left - ox;
    const ny = e.clientY - rect.top - oy;
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x: nx, y: ny } : n)));
  }, []);

  const onSvgMouseUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = null;
    const pos: Record<string, { x: number; y: number }> = {};
    nodesRef.current.forEach((n) => {
      pos[n.id] = { x: n.x, y: n.y };
    });
    localStorage.setItem(localKey, JSON.stringify(pos));
  }, [localKey]);

  const W = Math.max(640, ...nodes.map((n) => n.x + NODE_R + 30));
  const H = Math.max(400, ...nodes.map((n) => n.y + NODE_R + 50));

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const byName = new Map(nodes.map((n) => [n.name, n]));

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

      <div className="mb-4">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">キャラクター関係マップ</h1>
        {scenarioTitle && <p className="text-sm text-coc-muted mt-1">{scenarioTitle}</p>}
      </div>

      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded-full"
            style={{ border: "2px solid #c9a96e", background: "#c9a96e22" }}
          />
          <span className="text-xs text-coc-muted">PC</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded-full"
            style={{ border: "2px solid #7eb8f7", background: "#7eb8f722" }}
          />
          <span className="text-xs text-coc-muted">NPC</span>
        </div>
        {LEGEND.map(({ label, stroke, dash }) => (
          <div key={label} className="flex items-center gap-1.5">
            <svg width={28} height={10}>
              <line
                x1={0}
                y1={5}
                x2={28}
                y2={5}
                stroke={stroke}
                strokeWidth={2}
                strokeDasharray={dash}
              />
            </svg>
            <span className="text-xs text-coc-muted">{label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-coc-muted">読み込み中...</p>
      ) : nodes.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center">
          <Share2 size={32} className="text-coc-muted mx-auto mb-3" />
          <p className="text-sm text-coc-muted">参加キャラクターまたはNPCが登録されていません</p>
        </div>
      ) : (
        <div
          className="rounded-xl border border-coc-border bg-coc-surface overflow-auto"
          style={{ maxHeight: 580 }}
        >
          <svg
            ref={svgRef}
            width={W}
            height={H}
            className="select-none"
            onMouseMove={onSvgMouseMove}
            onMouseUp={onSvgMouseUp}
            onMouseLeave={onSvgMouseUp}
          >
            {edges.map((edge) => {
              const src = byId.get(edge.sourceId);
              const tgt = byName.get(edge.targetName);
              if (!src || !tgt || src.id === tgt.id) return null;
              const { stroke, strokeDasharray } = edgeStyle(edge.relationType);
              return (
                <g key={edge.id}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={stroke}
                    strokeWidth={1.5}
                    strokeDasharray={strokeDasharray}
                    strokeOpacity={0.75}
                  />
                  <text
                    x={(src.x + tgt.x) / 2}
                    y={(src.y + tgt.y) / 2 - 5}
                    textAnchor="middle"
                    fontSize={9}
                    fill={stroke}
                    fillOpacity={0.9}
                  >
                    {edge.relationType}
                  </text>
                </g>
              );
            })}

            {nodes.map((node) => {
              const color = node.kind === "character" ? "#c9a96e" : "#7eb8f7";
              const bg = node.kind === "character" ? "#c9a96e1a" : "#7eb8f71a";
              const lines = splitLabel(node.name);
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  onMouseDown={(e) => onNodeMouseDown(e, node.id)}
                  style={{ cursor: "grab" }}
                >
                  <circle r={NODE_R} fill={bg} stroke={color} strokeWidth={2} />
                  {lines.map((line, i) => (
                    <text
                      key={i}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      y={(i - (lines.length - 1) / 2) * 13}
                      fontSize={11}
                      fill={color}
                      fontWeight={600}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      <p className="mt-3 text-xs text-coc-muted">
        ノードをドラッグして配置を変更できます。位置はブラウザに自動保存されます。
      </p>
    </div>
  );
}
