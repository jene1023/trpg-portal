"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function PlayerForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [contactDiscord, setContactDiscord] = useState("");
  const [contactOther, setContactOther] = useState("");
  const [preferredGenre, setPreferredGenre] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || !displayName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("players").insert({
      display_name: displayName.trim(),
      contact_discord: contactDiscord.trim() || null,
      contact_other: contactOther.trim() || null,
      preferred_genre: preferredGenre.trim() || null,
      notes: notes.trim() || null,
    });
    if (!error) {
      router.push("/players");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-coc-muted mb-1.5">
          表示名 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
          placeholder="プレイヤー名"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-coc-muted mb-1.5">
          Discord ID
        </label>
        <input
          type="text"
          value={contactDiscord}
          onChange={(e) => setContactDiscord(e.target.value)}
          className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
          placeholder="username#1234"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-coc-muted mb-1.5">
          その他連絡先
        </label>
        <input
          type="text"
          value={contactOther}
          onChange={(e) => setContactOther(e.target.value)}
          className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
          placeholder="Twitter: @xxx / LINE: xxx"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-coc-muted mb-1.5">
          好みのシナリオ傾向
        </label>
        <input
          type="text"
          value={preferredGenre}
          onChange={(e) => setPreferredGenre(e.target.value)}
          className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
          placeholder="謎解き・ホラー・アクション など"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-coc-muted mb-1.5">
          特記事項
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors resize-none"
          placeholder="プレイスタイル・苦手な表現・スケジュール傾向など"
        />
      </div>

      <button
        type="submit"
        disabled={saving || !displayName.trim()}
        className="w-full rounded-lg border border-coc-gold-dim bg-coc-raised py-2.5 text-sm font-medium text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors disabled:opacity-50"
      >
        {saving ? "登録中..." : "登録する"}
      </button>
    </form>
  );
}
