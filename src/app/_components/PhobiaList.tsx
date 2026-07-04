"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, CharacterPhobia, PhobiaType } from "@/lib/supabase";

type Props = {
  characterId: string;
  initialPhobias: CharacterPhobia[];
};

const PHOBIA_LABELS: Record<PhobiaType, string> = {
  phobia: "恐怖症（フォビア）",
  mania: "マニア（躁病）",
};

const EMPTY_LABELS: Record<PhobiaType, string> = {
  phobia: "登録された恐怖症なし",
  mania: "登録されたマニアなし",
};

const TRIGGER_LABELS: Record<PhobiaType, string> = {
  phobia: "発動トリガー（例: 暗所・クモ・血液）",
  mania: "発動トリガー（例: 炎・金銭・特定の状況）",
};

export default function PhobiaList({ characterId, initialPhobias }: Props) {
  const [phobias, setPhobias] = useState<CharacterPhobia[]>(initialPhobias);
  const [activeTab, setActiveTab] = useState<PhobiaType>("phobia");
  const [formType, setFormType] = useState<PhobiaType>("phobia");
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("");
  const [acquiredAt, setAcquiredAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = phobias.filter((p) => p.phobia_type === activeTab);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || !name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("character_phobias")
      .insert({
        character_id: characterId,
        phobia_type: formType,
        name: name.trim(),
        trigger_description: trigger.trim() || null,
        is_active: true,
        acquired_at: acquiredAt || null,
      })
      .select()
      .single();
    if (!error && data) {
      setPhobias((prev) => [data as CharacterPhobia, ...prev]);
      setName("");
      setTrigger("");
      setAcquiredAt("");
      setActiveTab(formType);
    }
    setSaving(false);
  }

  async function toggleActive(phobia: CharacterPhobia) {
    if (!isSupabaseConfigured) return;
    setTogglingId(phobia.id);
    const newActive = !phobia.is_active;
    const { error } = await supabase
      .from("character_phobias")
      .update({ is_active: newActive })
      .eq("id", phobia.id);
    if (!error) {
      setPhobias((prev) =>
        prev.map((p) => (p.id === phobia.id ? { ...p, is_active: newActive } : p))
      );
    }
    setTogglingId(null);
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    setDeletingId(id);
    const { error } = await supabase.from("character_phobias").delete().eq("id", id);
    if (!error) {
      setPhobias((prev) => prev.filter((p) => p.id !== id));
    }
    setDeletingId(null);
  }

  const tabClass = (tab: PhobiaType) =>
    `px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
      activeTab === tab
        ? "border-coc-gold text-coc-gold"
        : "border-transparent text-coc-muted hover:text-coc-text"
    }`;

  const activeCount = phobias.filter((p) => p.is_active && p.phobia_type === activeTab).length;

  return (
    <div className="space-y-6">
      {/* タブ */}
      <div className="flex border-b border-coc-border">
        <button className={tabClass("phobia")} onClick={() => setActiveTab("phobia")}>
          恐怖症
          {phobias.filter((p) => p.phobia_type === "phobia" && p.is_active).length > 0 && (
            <span className="ml-2 rounded bg-red-900/60 border border-red-700 px-1.5 py-0.5 text-xs text-red-300">
              {phobias.filter((p) => p.phobia_type === "phobia" && p.is_active).length}
            </span>
          )}
        </button>
        <button className={tabClass("mania")} onClick={() => setActiveTab("mania")}>
          マニア
          {phobias.filter((p) => p.phobia_type === "mania" && p.is_active).length > 0 && (
            <span className="ml-2 rounded bg-purple-900/60 border border-purple-700 px-1.5 py-0.5 text-xs text-purple-300">
              {phobias.filter((p) => p.phobia_type === "mania" && p.is_active).length}
            </span>
          )}
        </button>
      </div>

      {/* 一覧 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">
            {PHOBIA_LABELS[activeTab]}
          </h2>
          {activeCount > 0 && (
            <span className={`ml-auto rounded border px-2 py-0.5 text-xs font-semibold ${
              activeTab === "phobia"
                ? "bg-red-900/60 border-red-700 text-red-300"
                : "bg-purple-900/60 border-purple-700 text-purple-300"
            }`}>
              発症中 {activeCount}件
            </span>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-coc-muted py-2">{EMPTY_LABELS[activeTab]}</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((p) => (
              <li
                key={p.id}
                className={`rounded-lg border px-4 py-3 space-y-1 ${
                  p.is_active
                    ? activeTab === "phobia"
                      ? "border-red-800 bg-red-950/20"
                      : "border-purple-800 bg-purple-950/20"
                    : "border-coc-border bg-coc-raised opacity-60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-semibold text-sm ${
                    p.is_active
                      ? activeTab === "phobia" ? "text-red-300" : "text-purple-300"
                      : "text-coc-muted"
                  }`}>
                    {p.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(p)}
                      disabled={togglingId === p.id}
                      className={`rounded px-2 py-0.5 text-xs border transition-colors ${
                        p.is_active
                          ? "border-coc-border bg-coc-raised text-coc-muted hover:text-coc-text"
                          : activeTab === "phobia"
                          ? "border-red-700 bg-red-950/40 text-red-300 hover:bg-red-900/40"
                          : "border-purple-700 bg-purple-950/40 text-purple-300 hover:bg-purple-900/40"
                      }`}
                    >
                      {p.is_active ? "回復" : "発症"}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="rounded px-2 py-0.5 text-xs border border-coc-border text-coc-muted hover:border-red-700 hover:text-red-400 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
                {p.trigger_description && (
                  <p className="text-xs text-coc-muted leading-relaxed">
                    トリガー: {p.trigger_description}
                  </p>
                )}
                {p.acquired_at && (
                  <p className="text-xs text-coc-muted">
                    取得日: {new Date(p.acquired_at).toLocaleDateString("ja-JP")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 追加フォーム */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
        <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest mb-4">
          新規追加
        </h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="block text-xs text-coc-muted mb-1">種別</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as PhobiaType)}
              className="w-full rounded-md border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
            >
              <option value="phobia">恐怖症（フォビア）</option>
              <option value="mania">マニア（躁病）</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-coc-muted mb-1">
              症状名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={formType === "phobia" ? "例: 暗所恐怖症・蛇恐怖症" : "例: 放火狂・窃盗症"}
              required
              className="w-full rounded-md border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-muted/50 focus:border-coc-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-coc-muted mb-1">
              {TRIGGER_LABELS[formType]}
            </label>
            <input
              type="text"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="w-full rounded-md border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-muted/50 focus:border-coc-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-coc-muted mb-1">取得日（任意）</label>
            <input
              type="date"
              value={acquiredAt}
              onChange={(e) => setAcquiredAt(e.target.value)}
              className="w-full rounded-md border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full rounded-md bg-coc-gold/20 border border-coc-gold/50 px-4 py-2 text-sm font-semibold text-coc-gold hover:bg-coc-gold/30 transition-colors disabled:opacity-50"
          >
            {saving ? "追加中..." : "追加"}
          </button>
        </form>
      </div>
    </div>
  );
}
