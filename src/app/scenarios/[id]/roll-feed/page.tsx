"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Dice6, Radio } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type SuccessDegree = "決定的成功" | "通常成功" | "失敗" | "致命的失敗";

type RollEntry = {
  id: string;
  characterName: string;
  skillName: string;
  skillValue: number;
  rollValue: number;
  degree: SuccessDegree;
  receivedAt: string;
};

const DEGREE_STYLE: Record<SuccessDegree, { border: string; text: string; bg: string }> = {
  "決定的成功": { border: "border-yellow-400", text: "text-yellow-400", bg: "bg-yellow-400/5" },
  "通常成功":   { border: "border-green-500",  text: "text-green-400",  bg: "bg-green-500/5"  },
  "失敗":       { border: "border-coc-border",  text: "text-coc-muted",  bg: "bg-coc-raised"   },
  "致命的失敗": { border: "border-red-600",     text: "text-red-500",    bg: "bg-red-600/5"    },
};

type Props = { params: Promise<{ id: string }> };

export default function RollFeedPage({ params }: Props) {
  const { id } = use(params);
  const [feed, setFeed] = useState<RollEntry[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("coc_active_scenario", id);
    }
  }, [id]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ch = supabase
      .channel(`dice-broadcast-${id}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("broadcast", { event: "dice_roll" }, ({ payload }: { payload: any }) => {
        const entry: RollEntry = {
          id: `${Date.now()}-${Math.random()}`,
          characterName: payload.characterName ?? "探索者",
          skillName: payload.skillName ?? "不明",
          skillValue: payload.skillValue ?? 0,
          rollValue: payload.rollValue ?? 0,
          degree: payload.degree ?? "失敗",
          receivedAt: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setFeed((prev: any[]) => [entry, ...prev].slice(0, 10));
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

  function clearActiveScenario() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("coc_active_scenario");
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/scenarios/${id}`}
          onClick={clearActiveScenario}
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
          <Dice6 size={20} className="text-coc-gold" />
          ロールフィード
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          このシナリオの参加者がダイスを振ると、ここにリアルタイムで表示されます。
        </p>
        <p className="text-xs text-coc-muted mt-0.5">
          ※ このページを開くと参加者のブロードキャストが自動的に有効になります。
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 text-sm text-coc-muted text-center">
          Supabase が設定されていないため、リアルタイム機能は利用できません。
        </div>
      )}

      {isSupabaseConfigured && feed.length === 0 && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <Dice6 size={32} className="text-coc-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm text-coc-muted">まだロールはありません</p>
          <p className="text-xs text-coc-muted mt-1">参加者がダイスを振ると表示されます</p>
        </div>
      )}

      <div className="space-y-2">
        {feed.map((entry) => {
          const style = DEGREE_STYLE[entry.degree] ?? DEGREE_STYLE["失敗"];
          return (
            <div
              key={entry.id}
              className={`rounded-xl border px-4 py-3 flex items-center justify-between ${style.border} ${style.bg} transition-all`}
            >
              <div className="min-w-0">
                <p className="text-xs text-coc-muted mb-0.5 truncate">
                  <span className="font-medium text-coc-text">{entry.characterName}</span>
                  {" — "}
                  {entry.skillName}（{entry.skillValue}%）
                </p>
                <p className={`font-bold text-sm ${style.text}`}>{entry.degree}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className={`font-cinzel text-2xl font-bold ${style.text}`}>{entry.rollValue}</p>
                <p className="text-xs text-coc-muted">{entry.receivedAt}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
