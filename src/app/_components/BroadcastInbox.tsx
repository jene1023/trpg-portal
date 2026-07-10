"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, ScenarioBroadcastWithRead } from "@/lib/supabase";

type Props = {
  characterId: string;
  initialBroadcasts: ScenarioBroadcastWithRead[];
};

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BroadcastInbox({ characterId, initialBroadcasts }: Props) {
  const [broadcasts, setBroadcasts] = useState<ScenarioBroadcastWithRead[]>(initialBroadcasts);

  async function markRead(broadcastId: string) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from("scenario_broadcast_reads")
      .insert({
        broadcast_id: broadcastId,
        character_id: characterId,
        read_at: new Date().toISOString(),
      });
    if (!error) {
      setBroadcasts((prev) =>
        prev.map((b) => (b.id === broadcastId ? { ...b, is_read: true } : b))
      );
    }
  }

  const unreadCount = broadcasts.filter((b) => !b.is_read).length;

  if (broadcasts.length === 0) {
    return (
      <p className="text-sm text-coc-muted text-center py-6">
        KPからの通知はありません。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <p className="text-xs text-coc-muted">
          未読:{" "}
          <span className="font-semibold text-coc-gold">{unreadCount}件</span>
        </p>
      )}
      {broadcasts.map((b) => (
        <div
          key={b.id}
          className={`rounded-xl border px-5 py-4 space-y-2 transition-colors ${
            b.is_read
              ? "border-coc-border bg-coc-surface"
              : "border-coc-gold/40 bg-coc-gold/5"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {!b.is_read && (
                  <span className="rounded bg-coc-gold/20 border border-coc-gold/50 px-1.5 py-0.5 text-xs font-semibold text-coc-gold">
                    未読
                  </span>
                )}
                <p className="text-sm font-semibold text-coc-text leading-tight">
                  {b.title}
                </p>
              </div>
              <p className="text-xs text-coc-muted mt-0.5">
                KP通知 · {formatDatetime(b.created_at)}
              </p>
            </div>
            {!b.is_read && (
              <button
                onClick={() => markRead(b.id)}
                className="shrink-0 text-xs text-coc-muted hover:text-coc-gold transition-colors"
              >
                既読にする
              </button>
            )}
          </div>
          {b.body && (
            <p className="text-sm text-coc-text whitespace-pre-wrap leading-relaxed border-t border-coc-border pt-2">
              {b.body}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
