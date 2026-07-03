"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, CharacterReaction, ReactionType } from "@/lib/supabase";

const REACTION_EMOJIS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "heart", emoji: "❤️", label: "いいね" },
  { type: "dice", emoji: "🎲", label: "ロール" },
  { type: "skull", emoji: "💀", label: "合掌" },
  { type: "scream", emoji: "😱", label: "恐怖" },
];

type Props = {
  characterId: string;
  initialReactions: CharacterReaction[];
};

export default function ReactionForm({ characterId, initialReactions }: Props) {
  const [reactions, setReactions] = useState<CharacterReaction[]>(initialReactions);
  const [reactorName, setReactorName] = useState("");
  const [message, setMessage] = useState("");
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reactionCounts = REACTION_EMOJIS.map(({ type, emoji, label }) => ({
    type,
    emoji,
    label,
    count: reactions.filter((r) => r.reaction_type === type).length,
  }));

  async function sendReaction(type: ReactionType) {
    if (!isSupabaseConfigured) return;

    const now = Date.now();
    if (lastSentAt && now - lastSentAt < 30000) {
      setError("30秒待ってから再送信してください");
      return;
    }

    setSending(true);
    setError(null);

    const name = reactorName.trim() || null;
    const msg = message.trim() || null;

    const { data, error: err } = await supabase
      .from("character_reactions")
      .insert({
        character_id: characterId,
        reactor_name: name,
        reaction_type: type,
        message: msg,
      })
      .select()
      .single();

    setSending(false);

    if (err) {
      setError("送信に失敗しました");
      return;
    }

    setReactions((prev) => [data as CharacterReaction, ...prev]);
    setMessage("");
    setLastSentAt(now);
  }

  return (
    <div className="space-y-4">
      {/* スタンプカウント表示 */}
      <div className="flex gap-3 flex-wrap">
        {reactionCounts.map(({ type, emoji, count }) => (
          <div
            key={type}
            className="flex items-center gap-1 rounded-full border border-coc-border bg-coc-surface px-3 py-1 text-sm"
          >
            <span>{emoji}</span>
            <span className="text-coc-text font-bold">{count}</span>
          </div>
        ))}
      </div>

      {/* 送信フォーム */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
        <p className="text-xs text-coc-muted font-semibold">リアクションを送る</p>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="名前（省略で匿名）"
            value={reactorName}
            onChange={(e) => setReactorName(e.target.value)}
            className="flex-1 rounded border border-coc-border bg-coc-bg px-3 py-1.5 text-sm text-coc-text placeholder:text-coc-faint outline-none focus:border-coc-gold/50"
            maxLength={30}
          />
        </div>

        <textarea
          placeholder="一言メッセージ（省略可）"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="w-full rounded border border-coc-border bg-coc-bg px-3 py-1.5 text-sm text-coc-text placeholder:text-coc-faint outline-none focus:border-coc-gold/50 resize-none"
          maxLength={200}
        />

        <div className="flex gap-2 flex-wrap">
          {REACTION_EMOJIS.map(({ type, emoji, label }) => (
            <button
              key={type}
              onClick={() => sendReaction(type)}
              disabled={sending}
              className="flex items-center gap-1.5 rounded-full border border-coc-border bg-coc-bg px-3 py-1.5 text-sm text-coc-text hover:border-coc-gold/50 hover:bg-coc-gold/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* リアクション一覧 */}
      {reactions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-coc-muted font-semibold">リアクション一覧</p>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {reactions.map((r) => {
              const found = REACTION_EMOJIS.find((e) => e.type === r.reaction_type);
              return (
                <div
                  key={r.id}
                  className="flex items-start gap-2 rounded border border-coc-border bg-coc-surface px-3 py-2 text-sm"
                >
                  <span className="text-base leading-tight">{found?.emoji ?? "❓"}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-coc-text">
                      {r.reactor_name ?? "匿名"}
                    </span>
                    {r.message && (
                      <p className="text-coc-muted text-xs mt-0.5 break-words">{r.message}</p>
                    )}
                  </div>
                  <span className="text-xs text-coc-faint shrink-0">
                    {new Date(r.created_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
