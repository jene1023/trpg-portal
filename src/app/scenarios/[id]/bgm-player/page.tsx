"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Music, Radio } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type NowPlaying = {
  label: string;
  bgm_url: string | null;
};

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v");
    }
  } catch {
    // ignore
  }
  return null;
}

type Props = { params: Promise<{ id: string }> };

export default function BgmPlayerPage({ params }: Props) {
  const { id } = use(params);
  const [connected, setConnected] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const ch = supabase
      .channel(`bgm-${id}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("broadcast", { event: "bgm_change" }, ({ payload }: { payload: any }) => {
        setNowPlaying({
          label: payload.label ?? "不明",
          bgm_url: payload.bgm_url ?? null,
        });
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .subscribe((status: any) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(ch);
      setConnected(false);
    };
  }, [id]);

  const youtubeId = nowPlaying?.bgm_url ? extractYoutubeId(nowPlaying.bgm_url) : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
        <span
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
            connected
              ? "border-green-700 bg-green-900/20 text-green-400"
              : "border-coc-border text-coc-muted"
          }`}
        >
          <Radio size={11} className={connected ? "animate-pulse" : ""} />
          {connected ? "受信中" : "接続中…"}
        </span>
      </div>

      <div className="mb-6">
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <Music size={20} className="text-coc-gold" />
          BGMプレイヤー
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          KPがBGMキューの「再生」ボタンを押すと、ここにリアルタイムで表示されます。
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 text-sm text-coc-muted text-center">
          Supabase が設定されていないため、リアルタイム機能は利用できません。
        </div>
      )}

      {nowPlaying ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-coc-gold bg-coc-gold/10 px-5 py-4">
            <p className="text-xs font-medium text-coc-gold mb-1">♪ Now Playing</p>
            <p className="text-lg font-bold text-coc-text">{nowPlaying.label}</p>
            {nowPlaying.bgm_url && !youtubeId && (
              <a
                href={nowPlaying.bgm_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-coc-gold hover:underline"
              >
                <Music size={12} />
                BGMを開く
              </a>
            )}
          </div>

          {youtubeId && (
            <div className="rounded-xl overflow-hidden border border-coc-border aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}
        </div>
      ) : (
        isSupabaseConfigured && (
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-12 text-center">
            <Music size={36} className="text-coc-muted mx-auto mb-3 opacity-30" />
            <p className="text-sm text-coc-muted">BGM待機中</p>
            <p className="text-xs text-coc-muted mt-1">
              KPが BGM・演出ページで「再生」を押すと表示されます
            </p>
          </div>
        )
      )}
    </div>
  );
}
