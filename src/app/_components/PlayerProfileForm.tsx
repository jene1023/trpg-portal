"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured, PlayerProfile } from "@/lib/supabase";

type Props = {
  userId: string;
  profile: PlayerProfile | null;
};

const PLAY_STYLE_OPTIONS = [
  "謎解き重視",
  "ロールプレイ重視",
  "アクション重視",
  "ホラー好き",
  "初心者歓迎",
  "長時間OK",
  "短期シナリオ派",
  "キャンペーン好き",
];

export default function PlayerProfileForm({ userId, profile }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [playStyle, setPlayStyle] = useState<string[]>(profile?.play_style ?? []);
  const [isPublic, setIsPublic] = useState(profile?.is_public ?? false);
  const [saving, setSaving] = useState(false);

  function toggleStyle(style: string) {
    setPlayStyle((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || !displayName.trim()) return;
    setSaving(true);
    const payload = {
      user_id: userId,
      display_name: displayName.trim(),
      bio: bio.trim() || null,
      play_style: playStyle.length > 0 ? playStyle : null,
      is_public: isPublic,
    };
    if (profile) {
      await supabase.from("player_profiles").update(payload).eq("id", profile.id);
    } else {
      await supabase.from("player_profiles").insert(payload);
    }
    setSaving(false);
    router.push(`/profile/${userId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
          自己紹介
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors resize-none"
          placeholder="ひとことメモや卓募集時の自己紹介など"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-coc-muted mb-2">
          プレイスタイル
        </label>
        <div className="flex flex-wrap gap-2">
          {PLAY_STYLE_OPTIONS.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => toggleStyle(style)}
              className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                playStyle.includes(style)
                  ? "border-coc-gold bg-coc-gold/10 text-coc-gold"
                  : "border-coc-border text-coc-muted hover:border-coc-gold-dim hover:text-coc-text"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={() => setIsPublic((v) => !v)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
            isPublic ? "border-coc-gold bg-coc-gold/20" : "border-coc-border bg-coc-surface"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full transition-transform ${
              isPublic ? "translate-x-4 bg-coc-gold" : "translate-x-0.5 bg-coc-muted"
            }`}
          />
        </button>
        <span className="text-sm text-coc-muted">プロフィールを公開する</span>
      </div>

      <button
        type="submit"
        disabled={saving || !displayName.trim()}
        className="w-full rounded-lg border border-coc-gold-dim bg-coc-raised py-2.5 text-sm font-medium text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors disabled:opacity-50"
      >
        {saving ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
