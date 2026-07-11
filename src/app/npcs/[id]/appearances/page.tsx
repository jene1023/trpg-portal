"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, History } from "lucide-react";
import { supabase, isSupabaseConfigured, NpcAppearance, NpcDispositionType } from "@/lib/supabase";

type AppearanceWithScenario = NpcAppearance & {
  scenarios: { id: string; title: string } | null;
};

const DISPOSITION_OPTIONS: { value: NpcDispositionType; label: string }[] = [
  { value: "friendly", label: "好意的" },
  { value: "neutral", label: "中立" },
  { value: "hostile", label: "敵対的" },
  { value: "unknown", label: "未知" },
];

function dispositionBadgeClass(d: NpcDispositionType | null) {
  if (d === "friendly") return "border-green-700 bg-green-500/20 text-green-400";
  if (d === "neutral") return "border-blue-700 bg-blue-500/20 text-blue-400";
  if (d === "hostile") return "border-red-700 bg-red-500/20 text-red-400";
  return "border-gray-600 bg-gray-500/20 text-gray-400";
}

function dispositionLabel(d: NpcDispositionType | null) {
  return DISPOSITION_OPTIONS.find((o) => o.value === d)?.label ?? "未知";
}

export default function NpcAppearancesPage() {
  const params = useParams();
  const id = params.id as string;

  const [npcName, setNpcName] = useState("");
  const [appearances, setAppearances] = useState<AppearanceWithScenario[]>([]);
  const [scenarios, setScenarios] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newScenarioId, setNewScenarioId] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newDisposition, setNewDisposition] = useState<NpcDispositionType | "">("");

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const fetchData = async () => {
      const [{ data: npc }, { data: apps }, { data: scens }] = await Promise.all([
        supabase.from("npcs").select("name").eq("id", id).single(),
        supabase
          .from("npc_appearances")
          .select("*, scenarios(id, title)")
          .eq("npc_id", id)
          .order("created_at", { ascending: false }),
        supabase.from("scenarios").select("id, title").order("title"),
      ]);
      if (npc) setNpcName(npc.name);
      setAppearances((apps ?? []) as AppearanceWithScenario[]);
      setScenarios(scens ?? []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const addAppearance = useCallback(async () => {
    if (!isSupabaseConfigured || !newScenarioId) return;
    setSaving(true);
    const { data } = await supabase
      .from("npc_appearances")
      .insert({
        npc_id: id,
        scenario_id: newScenarioId,
        role_in_scenario: newRole.trim() || null,
        disposition_change: newDisposition || null,
      })
      .select("*, scenarios(id, title)")
      .single();
    if (data) {
      setAppearances((prev: AppearanceWithScenario[]) => [data as AppearanceWithScenario, ...prev]);
      setNewScenarioId("");
      setNewRole("");
      setNewDisposition("");
    }
    setSaving(false);
  }, [id, newScenarioId, newRole, newDisposition]);

  const remove = useCallback(async (appearanceId: string) => {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    await supabase.from("npc_appearances").delete().eq("id", appearanceId);
    setAppearances((prev: AppearanceWithScenario[]) => prev.filter((a: AppearanceWithScenario) => a.id !== appearanceId));
    setSaving(false);
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/npcs/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          NPC 詳細
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <History size={20} className="text-coc-gold shrink-0" />
        <div>
          <p className="text-xs text-coc-muted">{npcName}</p>
          <h1 className="font-cinzel text-xl font-bold text-coc-text">登場履歴</h1>
        </div>
      </div>

      {/* 追加フォーム */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-4 mb-6 space-y-3">
        <h2 className="font-cinzel text-xs font-semibold text-coc-muted uppercase tracking-widest">
          登場を追加
        </h2>
        <div className="space-y-2">
          <select
            value={newScenarioId}
            onChange={(e) => setNewScenarioId(e.target.value)}
            className="w-full rounded-md border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold"
          >
            <option value="">シナリオを選択…</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          <input
            type="text"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="シナリオでの役割（任意）"
            className="w-full rounded-md border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold"
          />
          <select
            value={newDisposition}
            onChange={(e) => setNewDisposition(e.target.value as NpcDispositionType | "")}
            className="w-full rounded-md border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold"
          >
            <option value="">立場の変化（任意）</option>
            {DISPOSITION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={addAppearance}
          disabled={saving || !newScenarioId}
          className="flex items-center gap-1.5 rounded-md bg-coc-gold/10 border border-coc-gold/40 px-3 py-1.5 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40"
        >
          <Plus size={14} />
          追加
        </button>
      </div>

      {/* 一覧 */}
      {loading ? (
        <p className="text-sm text-coc-muted text-center py-8">読み込み中…</p>
      ) : appearances.length === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center">
          <History size={32} className="text-coc-muted mx-auto mb-3" />
          <p className="text-sm text-coc-muted">登場履歴がありません</p>
          <p className="text-xs text-coc-faint mt-1">上のフォームからシナリオへの登場を記録できます</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {appearances.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-coc-border bg-coc-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  {a.scenarios ? (
                    <Link
                      href={`/scenarios/${a.scenario_id}`}
                      className="text-sm font-medium text-coc-text hover:text-coc-gold transition-colors"
                    >
                      {a.scenarios.title}
                    </Link>
                  ) : (
                    <span className="text-sm text-coc-muted">シナリオ不明</span>
                  )}
                  {a.role_in_scenario && (
                    <p className="text-xs text-coc-muted">{a.role_in_scenario}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.disposition_change && (
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${dispositionBadgeClass(a.disposition_change)}`}>
                      {dispositionLabel(a.disposition_change)}
                    </span>
                  )}
                  <button
                    onClick={() => remove(a.id)}
                    disabled={saving}
                    className="rounded p-1 text-coc-muted hover:text-red-400 transition-colors disabled:opacity-40"
                    aria-label="削除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-coc-faint mt-2">
                {new Date(a.created_at).toLocaleDateString("ja-JP")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
