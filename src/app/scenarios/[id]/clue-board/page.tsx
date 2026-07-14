"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Link2, Plus, Trash2, X } from "lucide-react";
import { supabase, isSupabaseConfigured, ClueNode, ClueEdge, ClueNodeType } from "@/lib/supabase";

const NODE_R = 40;
const SVG_W = 900;
const SVG_H = 560;

const NODE_TYPE_COLORS: Record<ClueNodeType, string> = {
  clue: "#eab308",
  npc: "#3b82f6",
  location: "#22c55e",
  event: "#a855f7",
};

const NODE_TYPE_LABELS: Record<ClueNodeType, string> = {
  clue: "手がかり",
  npc: "NPC",
  location: "場所",
  event: "出来事",
};

type NodePos = { x: number; y: number };

function initialPosition(index: number, total: number): NodePos {
  const angle = (index / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
  return {
    x: SVG_W / 2 + 220 * Math.cos(angle),
    y: SVG_H / 2 + 170 * Math.sin(angle),
  };
}

export default function ClueBoardPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [nodes, setNodes] = useState<ClueNode[]>([]);
  const [edges, setEdges] = useState<ClueEdge[]>([]);
  const [positions, setPositions] = useState<Record<string, NodePos>>({});
  const [loading, setLoading] = useState(true);
  const [scenarioTitle, setScenarioTitle] = useState("");

  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const didDragRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<ClueNodeType>("clue");
  const [addLabel, setAddLabel] = useState("");
  const [addDetail, setAddDetail] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [edgeLabel, setEdgeLabel] = useState("");
  const [showEdgeLabelInput, setShowEdgeLabelInput] = useState(false);
  const [pendingEdge, setPendingEdge] = useState<{ from: string; to: string } | null>(null);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    async function load() {
      const [{ data: scenario }, { data: nodeData }, { data: edgeData }] = await Promise.all([
        supabase.from("scenarios").select("title").eq("id", scenarioId).single(),
        supabase.from("clue_nodes").select("*").eq("scenario_id", scenarioId).order("created_at"),
        supabase.from("clue_edges").select("*").order("created_at"),
      ]);
      setScenarioTitle(scenario?.title ?? "");
      const loaded: ClueNode[] = nodeData ?? [];
      setNodes(loaded);
      setEdges(edgeData ?? []);
      const pos: Record<string, NodePos> = {};
      loaded.forEach((n, i) => {
        pos[n.id] = { x: n.position_x || initialPosition(i, loaded.length).x, y: n.position_y || initialPosition(i, loaded.length).y };
      });
      setPositions(pos);
      setLoading(false);
    }
    load();
  }, [scenarioId]);

  const getSvgPoint = (e: { clientX: number; clientY: number }): NodePos | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * SVG_W,
      y: ((e.clientY - rect.top) / rect.height) * SVG_H,
    };
  };

  const scheduleSavePosition = useCallback(
    (nodeId: string, x: number, y: number) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        if (!isSupabaseConfigured) return;
        await supabase
          .from("clue_nodes")
          .update({ position_x: Math.round(x), position_y: Math.round(y) })
          .eq("id", nodeId);
      }, 600);
    },
    []
  );

  const onNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (connectingFrom) return;
    e.preventDefault();
    e.stopPropagation();
    didDragRef.current = false;
    const pt = getSvgPoint(e);
    if (!pt) return;
    const pos = positions[nodeId] ?? { x: SVG_W / 2, y: SVG_H / 2 };
    draggingRef.current = { nodeId, offsetX: pt.x - pos.x, offsetY: pt.y - pos.y };
  };

  const onSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingRef.current) return;
    didDragRef.current = true;
    const pt = getSvgPoint(e);
    if (!pt) return;
    const { nodeId, offsetX, offsetY } = draggingRef.current;
    const newX = Math.max(NODE_R, Math.min(SVG_W - NODE_R, pt.x - offsetX));
    const newY = Math.max(NODE_R, Math.min(SVG_H - NODE_R, pt.y - offsetY));
    setPositions((prev) => ({ ...prev, [nodeId]: { x: newX, y: newY } }));
  };

  const onSvgMouseUp = () => {
    if (draggingRef.current) {
      const { nodeId } = draggingRef.current;
      draggingRef.current = null;
      setPositions((latest) => {
        const pos = latest[nodeId];
        if (pos) scheduleSavePosition(nodeId, pos.x, pos.y);
        return latest;
      });
    }
  };

  const onNodeClick = (nodeId: string) => {
    if (didDragRef.current) return;
    if (connectingFrom) {
      if (connectingFrom === nodeId) {
        setConnectingFrom(null);
        return;
      }
      setPendingEdge({ from: connectingFrom, to: nodeId });
      setEdgeLabel("");
      setShowEdgeLabelInput(true);
      setConnectingFrom(null);
      return;
    }
    setSelectedNode((prev) => (prev === nodeId ? null : nodeId));
  };

  const handleConfirmEdge = async () => {
    if (!pendingEdge) return;
    const { data } = await supabase
      .from("clue_edges")
      .insert({
        from_node_id: pendingEdge.from,
        to_node_id: pendingEdge.to,
        relation_label: edgeLabel.trim() || null,
      })
      .select()
      .single();
    if (data) setEdges((prev) => [...prev, data as ClueEdge]);
    setPendingEdge(null);
    setShowEdgeLabelInput(false);
    setEdgeLabel("");
  };

  const handleAddNode = async () => {
    if (!addLabel.trim()) return;
    setAddLoading(true);
    const cx = SVG_W / 2 + (Math.random() - 0.5) * 300;
    const cy = SVG_H / 2 + (Math.random() - 0.5) * 200;
    const { data } = await supabase
      .from("clue_nodes")
      .insert({
        scenario_id: scenarioId,
        node_type: addType,
        label: addLabel.trim(),
        detail: addDetail.trim() || null,
        is_revealed: false,
        position_x: Math.round(cx),
        position_y: Math.round(cy),
      })
      .select()
      .single();
    if (data) {
      const node = data as ClueNode;
      setNodes((prev) => [...prev, node]);
      setPositions((prev) => ({ ...prev, [node.id]: { x: cx, y: cy } }));
    }
    setAddLabel("");
    setAddDetail("");
    setAddType("clue");
    setShowAddForm(false);
    setAddLoading(false);
  };

  const handleToggleReveal = async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const next = !node.is_revealed;
    await supabase.from("clue_nodes").update({ is_revealed: next }).eq("id", nodeId);
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, is_revealed: next } : n)));
  };

  const handleDeleteNode = async (nodeId: string) => {
    await supabase.from("clue_edges").delete().or(`from_node_id.eq.${nodeId},to_node_id.eq.${nodeId}`);
    await supabase.from("clue_nodes").delete().eq("id", nodeId);
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.from_node_id !== nodeId && e.to_node_id !== nodeId));
    setPositions((prev) => {
      const copy = { ...prev };
      delete copy[nodeId];
      return copy;
    });
    if (selectedNode === nodeId) setSelectedNode(null);
  };

  const handleDeleteEdge = async (edgeId: string) => {
    await supabase.from("clue_edges").delete().eq("id", edgeId);
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
  };

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const selectedNodeObj = selectedNode ? nodeMap.get(selectedNode) : null;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-coc-muted text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオに戻る
        </Link>
      </div>

      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-coc-text">🕵️ 手がかりボード</h1>
          {scenarioTitle && <p className="text-sm text-coc-muted mt-1">{scenarioTitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setConnectingFrom(null);
              setShowAddForm((v) => !v);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-1.5 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors"
          >
            <Plus size={15} />
            ノード追加
          </button>
          <button
            onClick={() => {
              setShowAddForm(false);
              setConnectingFrom(connectingFrom ? null : "__start__");
            }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              connectingFrom
                ? "border-purple-500 bg-purple-500/20 text-purple-300"
                : "border-coc-border bg-coc-surface text-coc-muted hover:text-coc-text"
            }`}
          >
            <Link2 size={15} />
            {connectingFrom && connectingFrom !== "__start__" ? "接続先を選択..." : connectingFrom === "__start__" ? "接続元を選択..." : "エッジを引く"}
          </button>
          {connectingFrom && (
            <button
              onClick={() => setConnectingFrom(null)}
              className="text-coc-muted hover:text-coc-text transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-4">
        {(Object.entries(NODE_TYPE_LABELS) as [ClueNodeType, string][]).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_TYPE_COLORS[type] }} />
            <span className="text-xs text-coc-muted">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <Eye size={12} className="text-coc-gold" />
          <span className="text-xs text-coc-muted">PL公開済み</span>
        </div>
        <div className="flex items-center gap-1.5">
          <EyeOff size={12} className="text-coc-muted" />
          <span className="text-xs text-coc-muted">KP秘匿</span>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <p className="text-sm font-medium text-coc-text mb-3">ノードを追加</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-coc-muted mb-1 block">タイプ</label>
              <select
                value={addType}
                onChange={(e) => setAddType(e.target.value as ClueNodeType)}
                className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text"
              >
                {(Object.entries(NODE_TYPE_LABELS) as [ClueNodeType, string][]).map(([t, l]) => (
                  <option key={t} value={t}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-coc-muted mb-1 block">ラベル</label>
              <input
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder="例: 血痕のある手袋"
                className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs text-coc-muted mb-1 block">詳細（任意）</label>
            <textarea
              value={addDetail}
              onChange={(e) => setAddDetail(e.target.value)}
              rows={2}
              placeholder="手がかりの詳細説明..."
              className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted resize-none"
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
              onClick={handleAddNode}
              disabled={!addLabel.trim() || addLoading}
              className="rounded-lg bg-coc-gold px-4 py-1.5 text-sm font-medium text-coc-bg hover:bg-coc-gold/90 disabled:opacity-50 transition-colors"
            >
              {addLoading ? "追加中..." : "追加"}
            </button>
          </div>
        </div>
      )}

      {showEdgeLabelInput && pendingEdge && (
        <div className="mb-4 rounded-xl border border-purple-800 bg-purple-950/20 px-5 py-4">
          <p className="text-sm font-medium text-coc-text mb-3">
            「{nodeMap.get(pendingEdge.from)?.label}」→「{nodeMap.get(pendingEdge.to)?.label}」の関係ラベル
          </p>
          <div className="flex gap-2">
            <input
              value={edgeLabel}
              onChange={(e) => setEdgeLabel(e.target.value)}
              placeholder="例: 指し示す（空欄でもOK）"
              className="flex-1 rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted"
              onKeyDown={(e) => e.key === "Enter" && handleConfirmEdge()}
              autoFocus
            />
            <button
              onClick={handleConfirmEdge}
              className="rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
            >
              接続
            </button>
            <button
              onClick={() => { setShowEdgeLabelInput(false); setPendingEdge(null); }}
              className="px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {nodes.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-12 text-center">
          <p className="text-coc-muted text-sm">ノードがまだありません。「ノード追加」からボードを構築してください。</p>
        </div>
      ) : (
        <div className="rounded-xl border border-coc-border bg-coc-surface overflow-hidden">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full"
            style={{ touchAction: "none", cursor: connectingFrom ? "crosshair" : "default" }}
            onMouseMove={onSvgMouseMove}
            onMouseUp={onSvgMouseUp}
            onMouseLeave={onSvgMouseUp}
          >
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map((edge) => {
              const from = positions[edge.from_node_id];
              const to = positions[edge.to_node_id];
              if (!from || !to) return null;
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist === 0) return null;
              const ux = dx / dist;
              const uy = dy / dist;
              const x1 = from.x + ux * NODE_R;
              const y1 = from.y + uy * NODE_R;
              const x2 = to.x - ux * (NODE_R + 6);
              const y2 = to.y - uy * (NODE_R + 6);
              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2;
              return (
                <g key={edge.id}>
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="#6b7280"
                    strokeWidth={1.5}
                    markerEnd="url(#arrowhead)"
                  />
                  {edge.relation_label && (
                    <text
                      x={mx} y={my - 5}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#9ca3af"
                    >
                      {edge.relation_label}
                    </text>
                  )}
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="transparent"
                    strokeWidth={12}
                    className="cursor-pointer"
                    onClick={() => handleDeleteEdge(edge.id)}
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const pos = positions[node.id] ?? { x: SVG_W / 2, y: SVG_H / 2 };
              const color = NODE_TYPE_COLORS[node.node_type];
              const isSelected = selectedNode === node.id;
              const isConnecting = connectingFrom && connectingFrom !== "__start__" && connectingFrom === node.id;
              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x},${pos.y})`}
                  style={{ cursor: connectingFrom ? "pointer" : "grab" }}
                  onMouseDown={(e) => onNodeMouseDown(e, node.id)}
                  onClick={() => {
                    if (connectingFrom === "__start__") {
                      setConnectingFrom(node.id);
                      return;
                    }
                    onNodeClick(node.id);
                  }}
                >
                  <circle
                    r={NODE_R}
                    fill={`${color}22`}
                    stroke={isSelected || isConnecting ? color : node.is_revealed ? color : "#4b5563"}
                    strokeWidth={isSelected || isConnecting ? 2.5 : 1.5}
                    opacity={node.is_revealed ? 1 : 0.65}
                  />
                  {!node.is_revealed && (
                    <circle r={NODE_R} fill="none" stroke="#4b5563" strokeWidth={1} strokeDasharray="4 3" />
                  )}
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill={node.is_revealed ? color : "#9ca3af"}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {node.label.length > 8 ? node.label.slice(0, 7) + "…" : node.label}
                  </text>
                  <text
                    y={NODE_R + 13}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#9ca3af"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {NODE_TYPE_LABELS[node.node_type]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Node detail panel */}
      {selectedNodeObj && (
        <div className="mt-4 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: NODE_TYPE_COLORS[selectedNodeObj.node_type] }}
                />
                <span className="text-xs text-coc-muted">{NODE_TYPE_LABELS[selectedNodeObj.node_type]}</span>
              </div>
              <h3 className="font-medium text-coc-text mt-1">{selectedNodeObj.label}</h3>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleToggleReveal(selectedNodeObj.id)}
                title={selectedNodeObj.is_revealed ? "PLに公開中（クリックで非公開に）" : "KP秘匿中（クリックでPLに公開）"}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                  selectedNodeObj.is_revealed
                    ? "border-coc-gold text-coc-gold hover:bg-coc-gold/10"
                    : "border-coc-border text-coc-muted hover:text-coc-text"
                }`}
              >
                {selectedNodeObj.is_revealed ? <Eye size={13} /> : <EyeOff size={13} />}
                {selectedNodeObj.is_revealed ? "PL公開中" : "KP秘匿"}
              </button>
              <button
                onClick={() => handleDeleteNode(selectedNodeObj.id)}
                className="flex items-center gap-1 rounded-lg border border-red-900 px-2.5 py-1 text-xs text-red-400 hover:bg-red-950/30 transition-colors"
              >
                <Trash2 size={13} />
                削除
              </button>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-coc-muted hover:text-coc-text transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          {selectedNodeObj.detail && (
            <p className="text-sm text-coc-text whitespace-pre-wrap">{selectedNodeObj.detail}</p>
          )}
          {!selectedNodeObj.detail && (
            <p className="text-xs text-coc-muted italic">詳細なし</p>
          )}
        </div>
      )}

      {/* Edge list */}
      {edges.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-2">接続一覧</p>
          <div className="space-y-1.5">
            {edges.map((edge) => {
              const from = nodeMap.get(edge.from_node_id);
              const to = nodeMap.get(edge.to_node_id);
              if (!from || !to) return null;
              return (
                <div
                  key={edge.id}
                  className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-xs"
                >
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: `${NODE_TYPE_COLORS[from.node_type]}22`, color: NODE_TYPE_COLORS[from.node_type] }}
                  >
                    {from.label}
                  </span>
                  <span className="text-coc-muted">→</span>
                  {edge.relation_label && <span className="text-coc-muted">{edge.relation_label}</span>}
                  {edge.relation_label && <span className="text-coc-muted">→</span>}
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: `${NODE_TYPE_COLORS[to.node_type]}22`, color: NODE_TYPE_COLORS[to.node_type] }}
                  >
                    {to.label}
                  </span>
                  <button
                    onClick={() => handleDeleteEdge(edge.id)}
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
