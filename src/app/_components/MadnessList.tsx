"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, MadnessRecord, MadnessType } from "@/lib/supabase";

const TYPE_LABELS: Record<MadnessType, string> = {
  temporary: "一時的狂気",
  indefinite: "不定の狂気",
};

const TYPE_COLORS: Record<MadnessType, string> = {
  temporary: "text-yellow-400 border-yellow-700",
  indefinite: "text-red-400 border-red-700",
};

type Props = {
  characterId: string;
  initialRecords: MadnessRecord[];
};

export default function MadnessList({ characterId, initialRecords }: Props) {
  const [records, setRecords] = useState<MadnessRecord[]>(initialRecords);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    madness_type: "temporary" as MadnessType,
    symptom: "",
    started_at: "",
  });

  function change(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.symptom.trim()) return;
    if (!isSupabaseConfigured) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("madness_records")
      .insert({
        character_id: characterId,
        madness_type: form.madness_type,
        symptom: form.symptom.trim(),
        is_active: true,
        started_at: form.started_at || null,
      })
      .select()
      .single();
    setSaving(false);

    if (!error && data) {
      setRecords((prev) => [data as MadnessRecord, ...prev]);
      setForm({ madness_type: "temporary", symptom: "", started_at: "" });
      setOpen(false);
    }
  }

  async function toggleActive(record: MadnessRecord) {
    if (!isSupabaseConfigured) return;
    const nowIso = new Date().toISOString().slice(0, 10);
    const updates = record.is_active
      ? { is_active: false, recovered_at: nowIso }
      : { is_active: true, recovered_at: null };

    const { error } = await supabase
      .from("madness_records")
      .update(updates)
      .eq("id", record.id);

    if (!error) {
      setRecords((prev) =>
        prev.map((r) => (r.id === record.id ? { ...r, ...updates } : r))
      );
    }
  }

  async function remove(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("madness_records").delete().eq("id", id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  const active = records.filter((r) => r.is_active);
  const recovered = records.filter((r) => !r.is_active);

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";
  const labelClass = "block text-xs text-coc-muted mb-1";

  function RecordCard({ record }: { record: MadnessRecord }) {
    return (
      <div
        className={`rounded-lg border p-4 space-y-2 ${
          record.is_active
            ? "border-red-800 bg-red-950/20"
            : "border-coc-border bg-coc-surface opacity-60"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-block rounded border px-1.5 py-0.5 text-xs font-medium ${TYPE_COLORS[record.madness_type]}`}
            >
              {TYPE_LABELS[record.madness_type]}
            </span>
            {record.is_active && (
              <span className="inline-block rounded bg-red-900/50 px-1.5 py-0.5 text-xs text-red-300 font-medium">
                発症中
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => toggleActive(record)}
              className={`text-xs transition-colors ${
                record.is_active
                  ? "text-green-400 hover:text-green-300"
                  : "text-coc-muted hover:text-coc-text"
              }`}
            >
              {record.is_active ? "回復済みにする" : "再発症"}
            </button>
            <button
              onClick={() => remove(record.id)}
              className="text-coc-muted hover:text-red-400 text-xs transition-colors"
            >
              削除
            </button>
          </div>
        </div>

        <p className="text-sm text-coc-text leading-relaxed whitespace-pre-wrap">
          {record.symptom}
        </p>

        <div className="flex gap-4 text-xs text-coc-muted">
          {record.started_at && <span>発症: {record.started_at}</span>}
          {record.recovered_at && <span>回復: {record.recovered_at}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 追加フォーム */}
      {open ? (
        <form
          onSubmit={submit}
          className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3"
        >
          <h3 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
            狂気症状を追加
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>狂気タイプ</label>
              <select
                value={form.madness_type}
                onChange={(e) => change("madness_type", e.target.value)}
                className={inputClass}
              >
                <option value="temporary">一時的狂気</option>
                <option value="indefinite">不定の狂気</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>発症日</label>
              <input
                type="date"
                value={form.started_at}
                onChange={(e) => change("started_at", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>症状の詳細 *</label>
            <textarea
              required
              rows={3}
              placeholder="例: 暗闇に対する恐怖症。光のない場所では行動不能になる。"
              value={form.symptom}
              onChange={(e) => change("symptom", e.target.value)}
              className={inputClass + " resize-none"}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || !form.symptom.trim()}
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
          ＋ 狂気症状を追加
        </button>
      )}

      {/* 発症中 */}
      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-cinzel text-xs font-semibold text-red-400 uppercase tracking-widest">
            発症中
          </h2>
          {active.map((r) => (
            <RecordCard key={r.id} record={r} />
          ))}
        </div>
      )}

      {/* 回復済み */}
      {recovered.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-cinzel text-xs font-semibold text-coc-muted uppercase tracking-widest">
            回復済み
          </h2>
          {recovered.map((r) => (
            <RecordCard key={r.id} record={r} />
          ))}
        </div>
      )}

      {records.length === 0 && !open && (
        <p className="text-sm text-coc-muted text-center py-4">
          狂気の記録はまだありません。
        </p>
      )}
    </div>
  );
}
