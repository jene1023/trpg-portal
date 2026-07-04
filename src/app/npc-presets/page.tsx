"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase, isSupabaseConfigured, NpcPreset } from "@/lib/supabase";

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

const inputClass =
  "w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors";
const labelClass = "block text-xs font-medium text-coc-muted mb-1";

export default function NpcPresetsPage() {
  const [presets, setPresets] = useState<NpcPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const [form, setForm] = useState({
    name: "",
    occupation_name: "",
    appearance: "",
    purpose: "",
    notes: "",
  });

  const [stats, setStats] = useState<Record<StatKey, string>>({
    str: "", con: "", pow: "", dex: "", app: "",
    siz: "", int_stat: "", edu: "", hp: "", mp: "",
  });
  const [db, setDb] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("npc_presets")
      .select("*")
      .order("name", { ascending: true });
    if (data) setPresets(data as NpcPreset[]);
    setLoading(false);
  }

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
      setErrorMsg("プリセット名は必須です。");
      return;
    }
    if (!isSupabaseConfigured) return;
    setSaving(true);
    setErrorMsg("");

    const statPayload: Record<string, number | string | null> = {};
    for (const { key } of STAT_LABELS) {
      const v = stats[key].trim();
      statPayload[key] = v !== "" ? parseInt(v, 10) : null;
    }
    statPayload.db = db.trim() || null;

    const { error } = await supabase.from("npc_presets").insert({
      name: form.name.trim(),
      occupation_name: form.occupation_name.trim() || null,
      appearance: form.appearance.trim() || null,
      purpose: form.purpose.trim() || null,
      notes: form.notes.trim() || null,
      ...statPayload,
    });

    if (error) {
      setErrorMsg(error.message);
      setSaving(false);
      return;
    }

    setForm({ name: "", occupation_name: "", appearance: "", purpose: "", notes: "" });
    setStats({ str: "", con: "", pow: "", dex: "", app: "", siz: "", int_stat: "", edu: "", hp: "", mp: "" });
    setDb("");
    setShowForm(false);
    setShowStats(false);
    await load();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    setPresets((prev) => prev.filter((p) => p.id !== id));
    await supabase.from("npc_presets").delete().eq("id", id);
  }

  const grouped = presets.reduce<Record<string, NpcPreset[]>>((acc, p) => {
    const key = p.occupation_name ?? "（未分類）";
    (acc[key] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">
          NPCプリセットライブラリ
        </h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-raised px-3 py-1.5 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors"
        >
          <Plus size={15} />
          プリセットを追加
        </button>
      </div>
      <p className="text-sm text-coc-muted mb-6">
        よく使う汎用NPC（医師・警察官・教授等）を登録しておくと、NPC作成時に一括で読み込めます。
      </p>

      {errorMsg && (
        <div className="rounded-md border border-red-800 bg-red-950/50 p-3 text-sm text-red-300 mb-4">
          {errorMsg}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-coc-border bg-coc-surface p-5 space-y-4 mb-8"
        >
          <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
            新規プリセット
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                プリセット名 <span className="text-coc-gold">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="例: 標準警察官"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>職業名（グループ分け用）</label>
              <input
                name="occupation_name"
                value={form.occupation_name}
                onChange={handleChange}
                placeholder="例: 警察官"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>外見</label>
            <textarea
              name="appearance"
              value={form.appearance}
              onChange={handleChange}
              placeholder="容姿・服装・特徴など"
              rows={2}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>目的・役割</label>
            <textarea
              name="purpose"
              value={form.purpose}
              onChange={handleChange}
              placeholder="シナリオ内での目的や役割"
              rows={2}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>メモ</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="KP用メモ"
              rows={2}
              className={inputClass}
            />
          </div>

          <div className="rounded-lg border border-coc-border overflow-hidden">
            <button
              type="button"
              onClick={() => setShowStats((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-coc-text hover:bg-coc-raised transition-colors"
            >
              <span>能力値を入力する（任意）</span>
              {showStats
                ? <ChevronUp size={16} className="text-coc-muted" />
                : <ChevronDown size={16} className="text-coc-muted" />}
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
                        className="w-full rounded-lg border border-coc-border bg-coc-raised px-2 py-1.5 text-sm text-coc-text text-center focus:outline-none focus:border-coc-gold transition-colors"
                      />
                    </div>
                  ))}
                </div>
                <div className="max-w-[120px]">
                  <label className="block text-xs text-coc-muted mb-1">DB</label>
                  <input
                    type="text"
                    value={db}
                    onChange={(e) => setDb(e.target.value)}
                    placeholder="例: +1d4"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-muted transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors disabled:opacity-50"
            >
              {saving ? "保存中..." : "プリセットを保存"}
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div className="flex justify-center items-center py-16 text-coc-muted font-crimson text-lg italic animate-pulse">
          読み込み中...
        </div>
      )}

      {!loading && presets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-5xl text-coc-faint select-none">✦</span>
          <p className="text-coc-muted font-crimson text-lg italic text-center">
            まだプリセットが登録されていません。
          </p>
          <p className="text-xs text-coc-faint text-center">
            「プリセットを追加」ボタンから汎用NPCを登録できます。
          </p>
        </div>
      )}

      {!loading && presets.length > 0 && (
        <div className="space-y-5">
          {Object.entries(grouped).map(([occupation, rows]) => (
            <div key={occupation} className="rounded-lg border border-coc-border bg-coc-surface p-4">
              <h3 className="font-cinzel text-sm font-semibold text-coc-gold mb-3 uppercase tracking-wider">
                {occupation}
              </h3>
              <div className="space-y-2">
                {rows.map((preset) => (
                  <div
                    key={preset.id}
                    className="rounded-md border border-coc-border bg-coc-raised px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-coc-text">{preset.name}</p>
                        {preset.appearance && (
                          <p className="text-xs text-coc-muted mt-0.5 line-clamp-1">{preset.appearance}</p>
                        )}
                        {(preset.str || preset.hp) && (
                          <div className="flex gap-3 mt-1.5 flex-wrap">
                            {preset.str && <span className="text-xs text-coc-faint">STR {preset.str}</span>}
                            {preset.con && <span className="text-xs text-coc-faint">CON {preset.con}</span>}
                            {preset.dex && <span className="text-xs text-coc-faint">DEX {preset.dex}</span>}
                            {preset.hp && <span className="text-xs text-coc-faint">HP {preset.hp}</span>}
                            {preset.mp && <span className="text-xs text-coc-faint">MP {preset.mp}</span>}
                            {preset.db && <span className="text-xs text-coc-faint">DB {preset.db}</span>}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(preset.id)}
                        className="text-coc-faint hover:text-red-400 transition-colors p-1 shrink-0"
                        aria-label="削除"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
