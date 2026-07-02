"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { supabase, isSupabaseConfigured, Player } from "@/lib/supabase";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    async function load() {
      const { data } = await supabase
        .from("players")
        .select("*")
        .order("display_name", { ascending: true });
      if (data) setPlayers(data as Player[]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">プレイヤー一覧</h1>
        <Link
          href="/players/new"
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-raised px-3 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors"
        >
          <Plus size={16} />
          プレイヤーを追加
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-24 text-coc-muted font-crimson text-lg italic animate-pulse">
          プレイヤー情報を読み込んでいます...
        </div>
      )}

      {!loading && players.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="text-5xl text-coc-faint select-none">✦</span>
          <p className="text-coc-muted font-crimson text-lg italic text-center">
            プレイヤーが登録されていません。
          </p>
          <Link href="/players/new" className="mt-2 text-sm text-coc-gold hover:underline">
            + プレイヤーを追加する
          </Link>
        </div>
      )}

      {!loading && players.length > 0 && (
        <div className="flex flex-col gap-4">
          {players.map((player) => (
            <div
              key={player.id}
              className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
            >
              <h2 className="font-cinzel font-semibold text-coc-text text-lg leading-tight mb-2">
                {player.display_name}
              </h2>
              <div className="flex flex-col gap-1.5">
                {player.contact_discord && (
                  <div>
                    <span className="text-xs font-medium text-coc-muted">Discord: </span>
                    <span className="text-sm text-coc-text">{player.contact_discord}</span>
                  </div>
                )}
                {player.contact_other && (
                  <div>
                    <span className="text-xs font-medium text-coc-muted">連絡先: </span>
                    <span className="text-sm text-coc-text">{player.contact_other}</span>
                  </div>
                )}
                {player.preferred_genre && (
                  <div>
                    <span className="text-xs font-medium text-coc-muted">好みのシナリオ: </span>
                    <span className="text-sm text-coc-text">{player.preferred_genre}</span>
                  </div>
                )}
                {player.notes && (
                  <div className="mt-2 rounded-lg border border-coc-border bg-coc-raised px-3 py-2">
                    <p className="text-xs font-medium text-coc-muted mb-1">メモ</p>
                    <p className="text-sm text-coc-text whitespace-pre-wrap">{player.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
