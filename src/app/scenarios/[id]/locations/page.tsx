"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Plus, Eye, EyeOff, Trash2, AlertTriangle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type ScenarioLocation = {
  id: string;
  scenario_id: string;
  name: string;
  description: string | null;
  clue_summary: string | null;
  npc_names: string[];
  danger_level: number;
  is_revealed: boolean;
  display_order: number;
  created_at: string;
};

type TabKey = "all" | "unvisited" | "visited";

const DANGER_COLORS: Record<number, string> = {
  1: "text-green-400 border-green-800 bg-green-950/30",
  2: "text-yellow-400 border-yellow-800 bg-yellow-950/30",
  3: "text-red-400 border-red-800 bg-red-950/30",
};

const DANGER_LABELS: Record<number, string> = {
  1: "低",
  2: "中",
  3: "高",
};

export default function LocationsPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [locations, setLocations] = useState<ScenarioLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("all");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clueSummary, setClueSummary] = useState("");
  const [npcNamesInput, setNpcNamesInput] = useState("");
  const [dangerLevel, setDangerLevel] = useState(1);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    loadAll();
  }, [scenarioId]);

  async function loadAll() {
    const [{ data: scenarioData }, { data: locationData }] = await Promise.all([
      supabase.from("scenarios").select("title").eq("id", scenarioId).single(),
      supabase
        .from("scenario_locations")
        .select("*")
        .eq("scenario_id", scenarioId)
        .order("display_order", { ascending: true }),
    ]);
    setScenarioTitle(scenarioData?.title ?? "");
    setLocations((locationData ?? []) as ScenarioLocation[]);
    setLoading(false);
  }

  async function handleAdd() {
    if (!name.trim() || !isSupabaseConfigured) return;
    setAdding(true);

    const npcNames = npcNamesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const maxOrder =
      locations.length > 0
        ? Math.max(...locations.map((l) => l.display_order))
        : 0;

    const { data, error } = await supabase
      .from("scenario_locations")
      .insert({
        scenario_id: scenarioId,
        name: name.trim(),
        description: description.trim() || null,
        clue_summary: clueSummary.trim() || null,
        npc_names: npcNames,
        danger_level: dangerLevel,
        is_revealed: false,
        display_order: maxOrder + 1,
      })
      .select()
      .single();

    if (!error && data) {
      setLocations((prev) => [...prev, data as ScenarioLocation]);
      setName("");
      setDescription("");
      setClueSummary("");
      setNpcNamesInput("");
      setDangerLevel(1);
      setShowForm(false);
    }
    setAdding(false);
  }

  async function toggleReveal(loc: ScenarioLocation) {
    if (!isSupabaseConfigured) return;
    const newValue = !loc.is_revealed;
    await supabase
      .from("scenario_locations")
      .update({ is_revealed: newValue })
      .eq("id", loc.id);
    setLocations((prev) =>
      prev.map((l) => (l.id === loc.id ? { ...l, is_revealed: newValue } : l))
    );
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scenario_locations").delete().eq("id", id);
    setLocations((prev) => prev.filter((l) => l.id !== id));
  }

  const filtered = locations.filter((l) => {
    if (tab === "visited") return l.is_revealed;
    if (tab === "unvisited") return !l.is_revealed;
    return true;
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {scenarioTitle || "シナリオ詳細"}
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <MapPin size={22} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">ロケーション管理</h1>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-800 bg-yellow-950/20 px-4 py-3">
          <AlertTriangle size={15} className="text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-300">Supabase が未設定です</p>
        </div>
      )}

      {/* タブ */}
      <div className="flex gap-1 mb-4 rounded-lg border border-coc-border bg-coc-surface p-1">
        {(["all", "unvisited", "visited"] as TabKey[]).map((key) => {
          const labels: Record<TabKey, string> = {
            all: "全件",
            unvisited: "未公開",
            visited: "公開済み",
          };
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-coc-gold/20 text-coc-gold"
                  : "text-coc-muted hover:text-coc-text"
              }`}
            >
              {labels[key]}
            </button>
          );
        })}
      </div>

      {/* ロケーション一覧 */}
      <div className="space-y-3 mb-6">
        {filtered.length === 0 && (
          <p className="text-sm text-coc-muted text-center py-6">
            {tab === "all" ? "ロケーションがまだありません" : "該当するロケーションがありません"}
          </p>
        )}
        {filtered.map((loc) => (
          <div
            key={loc.id}
            className={`rounded-xl border bg-coc-surface px-5 py-4 transition-colors ${
              loc.is_revealed ? "border-coc-gold-dim" : "border-coc-border"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-coc-text">{loc.name}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${DANGER_COLORS[loc.danger_level] ?? DANGER_COLORS[1]}`}
                >
                  危険度: {DANGER_LABELS[loc.danger_level] ?? "低"}
                </span>
                {loc.is_revealed ? (
                  <span className="rounded-full border border-coc-gold-dim bg-coc-gold/10 px-2 py-0.5 text-xs text-coc-gold">
                    公開中
                  </span>
                ) : (
                  <span className="rounded-full border border-coc-border px-2 py-0.5 text-xs text-coc-muted">
                    非公開
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleReveal(loc)}
                  title={loc.is_revealed ? "非公開にする" : "PLに公開する"}
                  className="rounded-lg border border-coc-border bg-coc-raised px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors flex items-center gap-1"
                >
                  {loc.is_revealed ? (
                    <>
                      <EyeOff size={13} />
                      非公開
                    </>
                  ) : (
                    <>
                      <Eye size={13} />
                      公開
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(loc.id)}
                  className="rounded-lg border border-coc-border bg-coc-raised p-1.5 text-coc-muted hover:text-red-400 hover:border-red-900 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {loc.description && (
              <p className="text-sm text-coc-text mt-1 mb-2">{loc.description}</p>
            )}

            {(loc.clue_summary || (loc.npc_names && loc.npc_names.length > 0)) && (
              <div className="mt-2 space-y-1 rounded-lg border border-coc-border bg-coc-raised px-3 py-2">
                {loc.clue_summary && (
                  <p className="text-xs text-coc-muted">
                    <span className="text-coc-text font-medium">手がかり: </span>
                    {loc.clue_summary}
                  </p>
                )}
                {loc.npc_names && loc.npc_names.length > 0 && (
                  <p className="text-xs text-coc-muted">
                    <span className="text-coc-text font-medium">在中NPC: </span>
                    {loc.npc_names.join("、")}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 追加フォーム */}
      {showForm ? (
        <div className="rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-4 space-y-3">
          <h2 className="font-medium text-coc-text text-sm">ロケーション追加</h2>

          <div>
            <label className="block text-xs text-coc-muted mb-1">場所名 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
              placeholder="例: 屋敷の書斎"
            />
          </div>

          <div>
            <label className="block text-xs text-coc-muted mb-1">説明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
              placeholder="場所の外観・雰囲気など"
            />
          </div>

          <div>
            <label className="block text-xs text-coc-muted mb-1">手がかりメモ</label>
            <textarea
              value={clueSummary}
              onChange={(e) => setClueSummary(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
              placeholder="発見できる手がかり・証拠など"
            />
          </div>

          <div>
            <label className="block text-xs text-coc-muted mb-1">在中NPC（カンマ区切り）</label>
            <input
              value={npcNamesInput}
              onChange={(e) => setNpcNamesInput(e.target.value)}
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
              placeholder="例: 執事のアルバート, 謎の訪問者"
            />
          </div>

          <div>
            <label className="block text-xs text-coc-muted mb-1">危険度</label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDangerLevel(level)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    dangerLevel === level
                      ? DANGER_COLORS[level]
                      : "border-coc-border text-coc-muted hover:text-coc-text"
                  }`}
                >
                  {DANGER_LABELS[level]}（{level}）
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={!name.trim() || adding}
              className="flex-1 rounded-lg border border-coc-gold bg-coc-gold/10 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {adding ? "追加中..." : "追加"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-coc-border py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
        >
          <Plus size={16} />
          ロケーションを追加
        </button>
      )}
    </div>
  );
}
