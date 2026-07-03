"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  initialUrl: string | null;
};

export default function ScenarioDiscordWebhookEditor({ scenarioId, initialUrl }: Props) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    await supabase
      .from("scenarios")
      .update({ discord_webhook_url: url.trim() || null })
      .eq("id", scenarioId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-coc-muted">
        SANチェック・セッションログ追加時にDiscordへ自動通知します
      </p>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
          className="flex-1 rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-3 py-2 focus:outline-none focus:border-coc-gold"
        />
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md border border-coc-gold text-coc-gold px-3 py-2 text-sm hover:bg-coc-gold/10 transition-colors disabled:opacity-40 shrink-0"
        >
          {saved ? "保存済み ✓" : saving ? "保存中…" : "保存"}
        </button>
      </div>
    </div>
  );
}
