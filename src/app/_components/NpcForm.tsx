"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type StatKey = "str" | "con" | "pow" | "dex" | "app" | "siz" | "int_stat" | "edu" | "hp" | "mp";

const STAT_LABELS: { key: StatKey; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "con", label: "CON" },
  { key: "pow", label: "POW" },
  { key: "dex", label: "DEX" },
  { key: "app", label: "APP" },
  { key: "siz", label: "SIZ" },
  { key: "int_stat", label: "INT" },
  { key: "edu", label: "EDU" },
  { key: "hp", label: "HP" },
  { key: "mp", label: "MP" },
];

export default function NpcForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

  const [form, setForm] = useState({
    scenario_name: "",
    name: "",
    faction: "",
    appearance: "",
    purpose: "",
    notes: "",
  });

  const [stats, setStats] = useState<Record<StatKey, string>>({
    str: "",
    con: "",
    pow: "",
    dex: "",
    app: "",
    siz: "",
    int_stat: "",
    edu: "",
    hp: "",
    mp: "",
  });

  const [db, setDb] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleStatChange(e: React.ChangeEvent<HTMLInputElement>) {
    const key = e.target.name as StatKey;
    setStats((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("NPC名は必須です。");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("Supabase が設定されていません。");
      return;
    }
    setSaving(true);
    setError(null);

    const statPayload: Record<string, number | string | null> = {};
    for (const { key } of STAT_LABELS) {
      const v = stats[key].trim();
      statPayload[key] = v !== "" ? parseInt(v, 10) : null;
    }
    statPayload.db = db.trim() || null;

    const { error: err } = await supabase.from("npcs").insert({
      scenario_name: form.scenario_name.trim() || null,
      name: form.name.trim(),
      faction: form.faction.trim() || null,
      appearance: form.appearance.trim() || null,
      purpose: form.purpose.trim() || null,
      notes: form.notes.trim() || null,
      ...statPayload,
    });
    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    router.push("/npcs");
    router.refresh();
  }

  const fieldClass =
    "w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors";
  const labelClass = "block text-xs font-medium text-coc-muted mb-1";
  const statFieldClass =
    "w-full rounded-lg border border-coc-border bg-coc-raised px-2 py-1.5 text-sm text-coc-text text-center focus:outline-none focus:border-coc-gold transition-colors";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="scenario_name" className={labelClass}>
          シナリオ名
        </label>
        <input
          id="scenario_name"
          name="scenario_name"
          value={form.scenario_name}
          onChange={handleChange}
          placeholder="例: インスマスを覆う影"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="faction" className={labelClass}>
          陣営 / 組織
        </label>
        <input
          id="faction"
          name="faction"
          value={form.faction}
          onChange={handleChange}
          placeholder="例: アーカムPD, カルト教団, 一般市民"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="name" className={labelClass}>
          NPC名 <span className="text-coc-gold">*</span>
        </label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="例: ザドック・アレン"
          required
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="appearance" className={labelClass}>
          外見
        </label>
        <textarea
          id="appearance"
          name="appearance"
          value={form.appearance}
          onChange={handleChange}
          placeholder="容姿・服装・特徴など"
          rows={3}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="purpose" className={labelClass}>
          目的・役割
        </label>
        <textarea
          id="purpose"
          name="purpose"
          value={form.purpose}
          onChange={handleChange}
          placeholder="シナリオ内での目的や役割"
          rows={3}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          メモ
        </label>
        <textarea
          id="notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="KP用の秘密メモ"
          rows={4}
          className={fieldClass}
        />
      </div>

      {/* 能力値セクション（任意） */}
      <div className="rounded-lg border border-coc-border bg-coc-surface overflow-hidden">
        <button
          type="button"
          onClick={() => setShowStats((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-coc-text hover:bg-coc-raised transition-colors"
        >
          <span>能力値を入力する（任意・戦闘NPCなど）</span>
          {showStats ? <ChevronUp size={16} className="text-coc-muted" /> : <ChevronDown size={16} className="text-coc-muted" />}
        </button>

        {showStats && (
          <div className="px-4 pb-4 pt-2 border-t border-coc-border">
            <div className="grid grid-cols-5 gap-2 mb-3">
              {STAT_LABELS.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-center text-coc-muted mb-1">{label}</label>
                  <input
                    type="number"
                    name={key}
                    value={stats[key]}
                    onChange={handleStatChange}
                    placeholder="—"
                    min={1}
                    max={999}
                    className={statFieldClass}
                  />
                </div>
              ))}
            </div>
            <div className="max-w-[120px]">
              <label className="block text-xs text-coc-muted mb-1">DB（ダメージボーナス）</label>
              <input
                type="text"
                value={db}
                onChange={(e) => setDb(e.target.value)}
                placeholder="例: +1d4"
                className={fieldClass}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.push("/npcs")}
          className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-muted transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors disabled:opacity-50"
        >
          {saving ? "登録中..." : "NPC を登録"}
        </button>
      </div>
    </form>
  );
}
