"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, CharacterDowntime, DowntimeActivityType } from "@/lib/supabase";

type Props = {
  characterId: string;
  initialDowntimes: CharacterDowntime[];
};

const ACTIVITY_LABELS: Record<DowntimeActivityType, string> = {
  research: "図書館調査",
  training: "技能訓練",
  rest: "休養",
  social: "情報収集・交流",
  other: "その他",
};

const ACTIVITY_COLORS: Record<DowntimeActivityType, string> = {
  research: "border-blue-800 bg-blue-950/30 text-blue-300",
  training: "border-green-800 bg-green-950/30 text-green-300",
  rest: "border-coc-border bg-coc-raised text-coc-muted",
  social: "border-purple-800 bg-purple-950/30 text-purple-300",
  other: "border-coc-border bg-coc-raised text-coc-muted",
};

type FormState = {
  activity_type: DowntimeActivityType;
  title: string;
  description: string;
  duration_days: string;
  result: string;
};

const EMPTY_FORM: FormState = {
  activity_type: "research",
  title: "",
  description: "",
  duration_days: "",
  result: "",
};

export default function DowntimeForm({ characterId, initialDowntimes }: Props) {
  const [downtimes, setDowntimes] = useState<CharacterDowntime[]>(initialDowntimes);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function change(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!isSupabaseConfigured) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("character_downtime")
      .insert({
        character_id: characterId,
        activity_type: form.activity_type,
        title: form.title.trim(),
        description: form.description.trim() || null,
        duration_days: form.duration_days !== "" ? parseInt(form.duration_days) || null : null,
        result: form.result.trim() || null,
      })
      .select()
      .single();
    setSaving(false);

    if (!error && data) {
      setDowntimes((prev) => [data as CharacterDowntime, ...prev]);
      setForm(EMPTY_FORM);
      setOpen(false);
    }
  }

  async function remove(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("character_downtime").delete().eq("id", id);
    setDowntimes((prev) => prev.filter((d) => d.id !== id));
  }

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";
  const labelClass = "block text-xs text-coc-muted mb-1";

  return (
    <div className="space-y-4">
      {downtimes.length === 0 && !open && (
        <p className="text-sm text-coc-muted text-center py-4">ダウンタイム活動の記録なし</p>
      )}

      <div className="space-y-3">
        {downtimes.map((dt) => (
          <div
            key={dt.id}
            className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${ACTIVITY_COLORS[dt.activity_type]}`}>
                  {ACTIVITY_LABELS[dt.activity_type]}
                </span>
                {dt.duration_days != null && (
                  <span className="text-xs text-coc-muted">{dt.duration_days}日間</span>
                )}
              </div>
              <button
                onClick={() => remove(dt.id)}
                className="shrink-0 text-coc-muted hover:text-red-400 text-xs transition-colors"
              >
                削除
              </button>
            </div>

            <h3 className="text-sm font-semibold text-coc-text leading-tight">{dt.title}</h3>

            {dt.description && (
              <p className="text-sm text-coc-muted leading-relaxed whitespace-pre-wrap">
                {dt.description}
              </p>
            )}

            {dt.result && (
              <div className="rounded-md border border-coc-gold/30 bg-coc-gold/5 px-3 py-2">
                <p className="text-xs text-coc-gold font-semibold mb-0.5">結果</p>
                <p className="text-sm text-coc-text leading-relaxed whitespace-pre-wrap">{dt.result}</p>
              </div>
            )}

            <p className="text-xs text-coc-muted">
              {new Date(dt.created_at).toLocaleDateString("ja-JP")}
            </p>
          </div>
        ))}
      </div>

      {open ? (
        <form
          onSubmit={submit}
          className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3"
        >
          <h3 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
            ダウンタイム活動を追加
          </h3>

          <div>
            <label className={labelClass}>活動種別 *</label>
            <select
              value={form.activity_type}
              onChange={(e) => change("activity_type", e.target.value)}
              className={inputClass}
            >
              {(Object.keys(ACTIVITY_LABELS) as DowntimeActivityType[]).map((type) => (
                <option key={type} value={type}>
                  {ACTIVITY_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>タイトル *</label>
            <input
              type="text"
              required
              placeholder="例: アーカム図書館で神話書を調査"
              value={form.title}
              onChange={(e) => change("title", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>活動期間（日数）</label>
            <input
              type="number"
              min={1}
              placeholder="例: 3"
              value={form.duration_days}
              onChange={(e) => change("duration_days", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>内容・詳細</label>
            <textarea
              rows={3}
              placeholder="例: 禁断の書「ネクロノミコン」の写本を読み解こうとした"
              value={form.description}
              onChange={(e) => change("description", e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className={labelClass}>結果・成果</label>
            <textarea
              rows={2}
              placeholder="例: クトゥルフ神話技能+2、SAN-1"
              value={form.result}
              onChange={(e) => change("result", e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="flex-1 rounded-lg bg-coc-gold text-black font-semibold text-sm py-2 disabled:opacity-40 hover:brightness-110 transition-all"
            >
              {saving ? "保存中…" : "追加する"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 rounded-lg border border-coc-border text-coc-muted hover:text-coc-text text-sm transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-lg border border-dashed border-coc-border text-coc-muted hover:text-coc-text hover:border-coc-border-glow py-3 text-sm transition-colors"
        >
          ＋ ダウンタイム活動を追加
        </button>
      )}
    </div>
  );
}
