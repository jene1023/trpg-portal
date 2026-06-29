"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, GrowthHistory } from "@/lib/supabase";

type Props = {
  characterId: string;
  initialHistory: GrowthHistory[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP");
}

export default function GrowthHistoryList({ characterId, initialHistory }: Props) {
  const [history, setHistory] = useState<GrowthHistory[]>(initialHistory);
  const [skillName, setSkillName] = useState("");
  const [oldValue, setOldValue] = useState<string>("");
  const [newValue, setNewValue] = useState<string>("");
  const [sessionLabel, setSessionLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!skillName.trim() || oldValue === "" || newValue === "") return;
    if (!isSupabaseConfigured) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("growth_history")
      .insert({
        character_id: characterId,
        skill_name: skillName.trim(),
        old_value: Number(oldValue),
        new_value: Number(newValue),
        session_label: sessionLabel.trim() || null,
        grown_at: new Date().toISOString(),
      })
      .select()
      .single();
    setSaving(false);

    if (!error && data) {
      setHistory((prev) => [data as GrowthHistory, ...prev]);
      setSkillName("");
      setOldValue("");
      setNewValue("");
      setSessionLabel("");
    }
  }

  async function remove(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("growth_history").delete().eq("id", id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }

  const gain = (h: GrowthHistory) => h.new_value - h.old_value;

  return (
    <div className="space-y-4">
      {/* 追加フォーム */}
      <form onSubmit={save} className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
        <h3 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
          成長を記録する
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-coc-muted block mb-1">技能名</label>
            <input
              type="text"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className={inputClass}
              placeholder="例: 図書館"
              required
            />
          </div>
          <div>
            <label className="text-xs text-coc-muted block mb-1">セッション（任意）</label>
            <input
              type="text"
              value={sessionLabel}
              onChange={(e) => setSessionLabel(e.target.value)}
              className={inputClass}
              placeholder="例: セッション3"
            />
          </div>
          <div>
            <label className="text-xs text-coc-muted block mb-1">成長前</label>
            <input
              type="number"
              value={oldValue}
              onChange={(e) => setOldValue(e.target.value)}
              className={inputClass}
              min={0}
              max={100}
              required
            />
          </div>
          <div>
            <label className="text-xs text-coc-muted block mb-1">成長後</label>
            <input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className={inputClass}
              min={0}
              max={100}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving || !skillName.trim() || oldValue === "" || newValue === ""}
          className="w-full rounded-lg bg-coc-gold text-black font-semibold text-sm py-2 disabled:opacity-40 hover:brightness-110 transition-all"
        >
          {saving ? "保存中…" : "成長を記録"}
        </button>
      </form>

      {/* 成長履歴一覧 */}
      {history.length === 0 ? (
        <p className="text-sm text-coc-muted text-center py-4">成長記録はまだありません。</p>
      ) : (
        <div className="space-y-2">
          {history.map((h) => (
            <div
              key={h.id}
              className="rounded-lg border border-coc-border bg-coc-surface p-3 flex gap-3 items-start"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-coc-text">{h.skill_name}</span>
                  <span className="text-xs text-coc-muted">
                    {h.old_value} → {h.new_value}
                  </span>
                  <span className="text-xs font-bold text-coc-gold">
                    +{gain(h)}
                  </span>
                  {h.session_label && (
                    <span className="text-xs text-coc-muted border border-coc-border rounded px-1.5 py-0.5">
                      {h.session_label}
                    </span>
                  )}
                </div>
                <time className="text-xs text-coc-muted mt-1 block">
                  {h.grown_at ? formatDate(h.grown_at) : formatDate(h.created_at)}
                </time>
              </div>
              <button
                onClick={() => remove(h.id)}
                className="shrink-0 text-coc-muted hover:text-red-400 text-xs transition-colors pt-0.5"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
