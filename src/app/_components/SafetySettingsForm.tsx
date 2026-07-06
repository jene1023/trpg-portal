"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, ScenarioSafetySettings } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  initial: ScenarioSafetySettings | null;
};

export default function SafetySettingsForm({ scenarioId, initial }: Props) {
  const [xCardEnabled, setXCardEnabled] = useState(initial?.x_card_enabled ?? true);
  const [lines, setLines] = useState(initial?.lines ?? "");
  const [veils, setVeils] = useState(initial?.veils ?? "");
  const [sessionZeroNotes, setSessionZeroNotes] = useState(initial?.session_zero_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    setSaved(false);

    await supabase.from("scenario_safety_settings").upsert(
      {
        scenario_id: scenarioId,
        x_card_enabled: xCardEnabled,
        lines: lines || null,
        veils: veils || null,
        session_zero_notes: sessionZeroNotes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "scenario_id" }
    );

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* X-Card */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-medium text-coc-text">X-Card（中断シグナル）</p>
            <p className="text-xs text-coc-muted mt-0.5">
              セッション中に不快な場面を即座に止めるシグナル。有効にするとパーティービューに中断ボタンが表示されます。
            </p>
          </div>
          <button
            onClick={() => setXCardEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
              xCardEnabled ? "bg-coc-gold" : "bg-coc-border"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                xCardEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        {xCardEnabled && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-900 bg-red-950/20 px-3 py-2 text-xs text-red-300">
            <span className="font-bold text-red-400">X</span>
            パーティービューにXカードボタンが表示されます
          </div>
        )}
      </div>

      {/* Lines（絶対NG）*/}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <label className="block">
          <p className="font-medium text-coc-text mb-1">ライン（絶対NG）</p>
          <p className="text-xs text-coc-muted mb-2">
            セッション中に絶対に登場させない内容・テーマを記録します。
          </p>
          <textarea
            value={lines}
            onChange={(e) => setLines(e.target.value)}
            rows={4}
            placeholder={"例:\n・過激な暴力描写\n・特定の恐怖症に関わる描写"}
            className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
          />
        </label>
      </div>

      {/* Veils（フェードアウト可）*/}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <label className="block">
          <p className="font-medium text-coc-text mb-1">ヴェール（フェードアウト可）</p>
          <p className="text-xs text-coc-muted mb-2">
            描写はできるが詳細は省略する（フェードアウト）内容を記録します。
          </p>
          <textarea
            value={veils}
            onChange={(e) => setVeils(e.target.value)}
            rows={4}
            placeholder={"例:\n・性的描写（示唆まではOK）\n・過度なグロ描写"}
            className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
          />
        </label>
      </div>

      {/* Session Zero ノート */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <label className="block">
          <p className="font-medium text-coc-text mb-1">セッションゼロメモ</p>
          <p className="text-xs text-coc-muted mb-2">
            セッション前の安全確認で合意した事項を自由に記録します。
          </p>
          <textarea
            value={sessionZeroNotes}
            onChange={(e) => setSessionZeroNotes(e.target.value)}
            rows={4}
            placeholder="セッションゼロで話し合った内容、KPとPL間の取り決めなど"
            className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
          />
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg border border-coc-gold bg-coc-gold/10 px-5 py-2.5 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 disabled:opacity-50 transition-colors"
      >
        {saving ? "保存中…" : saved ? "保存しました ✓" : "設定を保存"}
      </button>
    </div>
  );
}
