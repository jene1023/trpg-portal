"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { ArrowLeft, Dice6, Activity } from "lucide-react";
import { supabase, isSupabaseConfigured, SuccessLevel } from "@/lib/supabase";

type FeedEntry = {
  id: string;
  characterName: string;
  skillName: string;
  skillValue: number;
  rollValue: number;
  successLevel: SuccessLevel;
  rolledAt: string;
};

const LEVEL_LABEL: Record<SuccessLevel, string> = {
  critical_success: "決定的成功",
  success: "通常成功",
  failure: "失敗",
  fumble: "致命的失敗",
};

const LEVEL_STYLE: Record<SuccessLevel, { border: string; text: string; bg: string }> = {
  critical_success: { border: "border-yellow-400", text: "text-yellow-400", bg: "bg-yellow-400/5" },
  success: { border: "border-green-500", text: "text-green-400", bg: "bg-green-500/5" },
  failure: { border: "border-coc-border", text: "text-coc-muted", bg: "bg-coc-raised" },
  fumble: { border: "border-red-600", text: "text-red-500", bg: "bg-red-600/5" },
};

type Props = { params: Promise<{ id: string }> };

export default function DiceFeedPage({ params }: Props) {
  const { id } = use(params);
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [noParticipants, setNoParticipants] = useState(false);
  const characterMapRef = useRef<Map<string, string>>(new Map());
  const participantIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setup() {
      const { data: participantRows } = await supabase
        .from("scenario_participants")
        .select("character_id")
        .eq("scenario_id", id);

      const ids = (participantRows ?? []).map((p: { character_id: string }) => p.character_id);
      participantIdsRef.current = ids;

      if (ids.length === 0) {
        setNoParticipants(true);
        return;
      }

      const { data: characterRows } = await supabase
        .from("characters")
        .select("id, name")
        .in("id", ids);

      const map = new Map<string, string>(
        (characterRows ?? []).map((c: { id: string; name: string }) => [c.id, c.name])
      );
      characterMapRef.current = map;

      channel = supabase
        .channel(`dice-feed-${id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "dice_rolls",
            filter: `character_id=in.(${ids.join(",")})`,
          },
          (payload: { new: Record<string, unknown> }) => {
            const row = payload.new;
            const characterId = row.character_id as string;
            if (!participantIdsRef.current.includes(characterId)) return;

            const entry: FeedEntry = {
              id: row.id as string,
              characterName: characterMapRef.current.get(characterId) ?? "探索者",
              skillName: row.skill_name as string,
              skillValue: row.skill_value as number,
              rollValue: row.roll_value as number,
              successLevel: row.success_level as SuccessLevel,
              rolledAt: new Date(row.rolled_at as string).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
            };

            setFeed((prev) => [entry, ...prev].slice(0, 50));
          }
        )
        .subscribe((status: string) => {
          setConnected(status === "SUBSCRIBED");
        });
    }

    setup();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      setConnected(false);
    };
  }, [id]);

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
          <Activity size={11} className={connected ? "animate-pulse" : ""} />
          {connected ? "受信中" : "接続中…"}
        </span>
      </div>

      <div className="mb-6">
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <Dice6 size={20} className="text-coc-gold" />
          ダイスフィード
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          シナリオ参加者のダイスロールをリアルタイムで受信・表示します。
        </p>
        <p className="text-xs text-coc-muted mt-0.5">
          ※ `dice_rolls` テーブルへの INSERT を Supabase Realtime で監視しています。
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 text-sm text-coc-muted text-center">
          Supabase が設定されていないため、リアルタイム機能は利用できません。
        </div>
      )}

      {isSupabaseConfigured && noParticipants && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-6 text-center">
          <p className="text-sm text-coc-muted">参加キャラクターが登録されていません。</p>
          <Link
            href={`/scenarios/${id}/participants`}
            className="mt-2 inline-block text-xs text-coc-gold hover:underline"
          >
            参加キャラクターを追加 →
          </Link>
        </div>
      )}

      {isSupabaseConfigured && !noParticipants && feed.length === 0 && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <Dice6 size={32} className="text-coc-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm text-coc-muted">まだロールはありません</p>
          <p className="text-xs text-coc-muted mt-1">参加者がダイスを振ると表示されます</p>
        </div>
      )}

      <div className="space-y-2">
        {feed.map((entry) => {
          const style = LEVEL_STYLE[entry.successLevel] ?? LEVEL_STYLE.failure;
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
                <p className={`font-bold text-sm ${style.text}`}>
                  {LEVEL_LABEL[entry.successLevel]}
                </p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className={`font-cinzel text-2xl font-bold ${style.text}`}>
                  {entry.rollValue}
                </p>
                <p className="text-xs text-coc-muted">{entry.rolledAt}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
