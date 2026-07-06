"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  initialEnabled: boolean;
  initialEmail: string | null;
};

export default function ScenarioReminderEditor({
  scenarioId,
  initialEnabled,
  initialEmail,
}: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    setSaved(false);
    await supabase
      .from("scenarios")
      .update({ remind_enabled: enabled, remind_email: email.trim() || null })
      .eq("id", scenarioId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-coc-muted">
        次回セッション予定の前日 JST 9:00 にリマインドメールを送信します（Supabase Edge Function + pg_cron が必要）
      </p>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            setSaved(false);
          }}
          className="rounded border-coc-border accent-coc-gold"
        />
        <span className="text-sm text-coc-text">前日リマインドメールを有効にする</span>
      </label>
      {enabled && (
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSaved(false);
          }}
          placeholder="kp@example.com"
          className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-3 py-2 focus:outline-none focus:border-coc-gold"
        />
      )}
      <button
        onClick={save}
        disabled={saving}
        className="rounded-md border border-coc-gold text-coc-gold px-3 py-2 text-sm hover:bg-coc-gold/10 transition-colors disabled:opacity-40"
      >
        {saved ? "保存済み ✓" : saving ? "保存中…" : "保存"}
      </button>
    </div>
  );
}
