"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  ScenarioClue,
  ClueStatus,
  Scenario,
} from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

const STATUS_LABELS: Record<ClueStatus, string> = {
  found: "発見済み",
  investigating: "調査中",
  resolved: "解決済み",
};

const STATUS_COLUMN_STYLE: Record<ClueStatus, string> = {
  found: "border-blue-700/50 bg-blue-950/10",
  investigating: "border-yellow-700/50 bg-yellow-950/10",
  resolved: "border-green-700/50 bg-green-950/10",
};

const STATUS_BADGE_STYLE: Record<ClueStatus, string> = {
  found: "border-blue-700 bg-blue-950/40 text-blue-300",
  investigating: "border-yellow-700 bg-yellow-950/40 text-yellow-300",
  resolved: "border-green-700 bg-green-950/40 text-green-300",
};

const STATUS_ORDER: ClueStatus[] = ["found", "investigating", "resolved"];

export default function CluesBoardPage({ params }: Props) {
  const [characterId, setCharacterId] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [clues, setClues] = useState<ScenarioClue[]>([]);
  const [selectedScenario, setSelectedScenario] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newStatus, setNewStatus] = useState<ClueStatus>("found");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setCharacterId(id);
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      Promise.all([
        supabase.from("characters").select("id, name").eq("id", id).single(),
        supabase
          .from("scenarios")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("scenario_clues")
          .select("*")
          .eq("character_id", id)
          .order("created_at", { ascending: false }),
      ]).then(([charRes, scenariosRes, cluesRes]) => {
        if (charRes.data) setCharacterName(charRes.data.name);
        setScenarios(scenariosRes.data ?? []);
        setClues(cluesRes.data ?? []);
        setLoading(false);
      });
    });
  }, [params]);

  const filteredClues = selectedScenario
    ? clues.filter((c) => c.scenario_id === selectedScenario)
    : clues;

  async function addClue() {
    if (!newTitle.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const { data } = await supabase
      .from("scenario_clues")
      .insert({
        character_id: characterId,
        scenario_id: selectedScenario || null,
        title: newTitle.trim(),
        content: newContent.trim() || null,
        status: newStatus,
      })
      .select()
      .single();
    if (data) {
      setClues((prev) => [data, ...prev]);
    }
    setNewTitle("");
    setNewContent("");
    setNewStatus("found");
    setAdding(false);
    setSaving(false);
  }

  async function updateStatus(clue: ScenarioClue, status: ClueStatus) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scenario_clues").update({ status }).eq("id", clue.id);
    setClues((prev) =>
      prev.map((c) => (c.id === clue.id ? { ...c, status } : c))
    );
  }

  async function deleteClue(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scenario_clues").delete().eq("id", id);
    setClues((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-coc-muted text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/characters/${characterId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {characterName || "キャラクター詳細"}
        </Link>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-3 py-1.5 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors motion-safe:active:scale-[0.97]"
        >
          <Plus size={14} />
          手がかりを追加
        </button>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">
        手がかりボード
      </h1>
      <p className="text-xs text-coc-muted mb-6">
        発見した手がかりを「発見済み」「調査中」「解決済み」で管理します。
      </p>

      {/* シナリオフィルタ */}
      {scenarios.length > 0 && (
        <div className="mb-6">
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold/60"
          >
            <option value="">すべてのシナリオ</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 追加フォーム */}
      {adding && (
        <div className="mb-6 rounded-lg border border-coc-gold/40 bg-coc-gold/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-coc-gold">手がかりを追加</h2>
            <button
              onClick={() => setAdding(false)}
              className="text-coc-muted hover:text-coc-text transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="手がかりのタイトル *"
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold/60"
            onKeyDown={(e) => e.key === "Enter" && addClue()}
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="詳細メモ（任意）"
            rows={2}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold/60 resize-none"
          />
          <div className="flex items-center gap-3">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ClueStatus)}
              className="rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold/60"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <button
              onClick={addClue}
              disabled={saving || !newTitle.trim()}
              className="rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-4 py-2 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 disabled:opacity-50 transition-colors"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}

      {/* カンバンボード */}
      {filteredClues.length > 0 || adding ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_ORDER.map((status) => {
            const col = filteredClues.filter((c) => c.status === status);
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded border px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE_STYLE[status]}`}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="text-xs text-coc-muted">{col.length}件</span>
                </div>

                {col.length === 0 ? (
                  <div
                    className={`rounded-lg border border-dashed p-4 text-center ${STATUS_COLUMN_STYLE[status]}`}
                  >
                    <p className="text-xs text-coc-muted/60">なし</p>
                  </div>
                ) : (
                  col.map((clue) => (
                    <div
                      key={clue.id}
                      className="rounded-lg border border-coc-border coc-card-bg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-coc-text leading-tight">
                          {clue.title}
                        </p>
                        <button
                          onClick={() => deleteClue(clue.id)}
                          className="flex-shrink-0 text-coc-muted hover:text-red-400 transition-colors mt-0.5"
                          title="削除"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      {clue.content && (
                        <p className="text-xs text-coc-muted leading-relaxed whitespace-pre-wrap">
                          {clue.content}
                        </p>
                      )}
                      <div className="flex gap-1.5 flex-wrap pt-0.5">
                        {STATUS_ORDER.filter((s) => s !== status).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(clue, s)}
                            className="rounded border border-coc-border px-2 py-0.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
                          >
                            → {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-coc-border coc-card-bg p-8 text-center">
          <p className="text-coc-muted text-sm">手がかりがまだありません。</p>
          <p className="text-xs text-coc-muted mt-1">
            右上の「手がかりを追加」から登録できます。
          </p>
        </div>
      )}
    </div>
  );
}
