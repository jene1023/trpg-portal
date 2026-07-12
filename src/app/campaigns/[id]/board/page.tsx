"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Monitor, RefreshCw } from "lucide-react";
import { supabase, isSupabaseConfigured, Character } from "@/lib/supabase";

type CharStat = Pick<
  Character,
  | "id"
  | "name"
  | "player_name"
  | "hp_current"
  | "hp_max"
  | "mp_current"
  | "mp_max"
  | "san_current"
  | "san_max"
  | "status"
  | "portrait_url"
>;

type Props = { params: Promise<{ id: string }> };

function statColor(current: number, max: number): string {
  if (max === 0) return "text-coc-muted";
  const pct = current / max;
  if (pct <= 0) return "text-red-400";
  if (pct <= 0.25) return "text-red-400";
  if (pct <= 0.5) return "text-yellow-400";
  return "text-coc-text";
}

function barBg(key: "hp" | "mp" | "san"): string {
  const map = {
    hp: "var(--color-coc-hp)",
    mp: "var(--color-coc-mp)",
    san: "var(--color-coc-san)",
  };
  return map[key];
}

function StatBar({
  label,
  current,
  max,
  statKey,
}: {
  label: string;
  current: number;
  max: number;
  statKey: "hp" | "mp" | "san";
}) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-coc-muted uppercase tracking-wider">{label}</span>
        <span className={`text-xl font-bold tabular-nums font-cinzel ${statColor(current, max)}`}>
          {current}
          <span className="text-sm font-normal text-coc-muted">/{max}</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden bg-coc-void">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: barBg(statKey) }}
        />
      </div>
    </div>
  );
}

function CharacterCard({ char }: { char: CharStat }) {
  const isDead = char.status === "dead" || char.status === "insane" || char.status === "retired";
  return (
    <div
      className={`rounded-2xl border bg-coc-surface px-5 py-5 flex flex-col gap-4 transition-all ${
        isDead
          ? "border-coc-border opacity-60"
          : char.hp_current === 0
          ? "border-red-700 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
          : char.san_current === 0
          ? "border-purple-700 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
          : "border-coc-border hover:border-coc-gold-dim"
      }`}
    >
      <div className="flex items-center gap-3">
        {char.portrait_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={char.portrait_url}
            alt={char.name}
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-coc-border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-coc-raised border border-coc-border shrink-0 flex items-center justify-center text-coc-muted text-sm font-cinzel">
            {char.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-cinzel font-bold text-coc-text truncate leading-tight">{char.name}</p>
          {char.player_name && (
            <p className="text-xs text-coc-muted truncate">PL: {char.player_name}</p>
          )}
        </div>
        {isDead && (
          <span className="shrink-0 rounded-full border border-coc-border px-2 py-0.5 text-xs text-coc-muted">
            {char.status === "dead" ? "死亡" : char.status === "insane" ? "狂気" : "引退"}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <StatBar label="HP" current={char.hp_current} max={char.hp_max} statKey="hp" />
        <StatBar label="MP" current={char.mp_current} max={char.mp_max} statKey="mp" />
        <StatBar label="SAN" current={char.san_current} max={char.san_max} statKey="san" />
      </div>

      {char.hp_current === 0 && (
        <p className="text-xs text-red-400 font-medium text-center">⚠ HP 0 — 瀕死状態</p>
      )}
      {char.san_current === 0 && char.hp_current > 0 && (
        <p className="text-xs text-purple-400 font-medium text-center">⚠ SAN 0 — 永久狂気</p>
      )}
    </div>
  );
}

export default function PartyBoardPage({ params }: Props) {
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaignTitle, setCampaignTitle] = useState<string>("");
  const [characters, setCharacters] = useState<CharStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    params.then(({ id }) => setCampaignId(id));
  }, [params]);

  const load = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) { setLoading(false); return; }

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("title")
      .eq("id", id)
      .single();

    if (campaign) setCampaignTitle((campaign as { title: string }).title);

    const { data: links } = await supabase
      .from("campaign_scenarios")
      .select("scenario_id")
      .eq("campaign_id", id);

    const scenarioIds = (links ?? []).map((l) => (l as { scenario_id: string }).scenario_id);
    if (scenarioIds.length === 0) { setLoading(false); return; }

    const { data: participantRows } = await supabase
      .from("scenario_participants")
      .select("character_id")
      .in("scenario_id", scenarioIds);

    const charIds = [...new Set((participantRows ?? []).map((p) => (p as { character_id: string }).character_id))];
    if (charIds.length === 0) { setLoading(false); return; }

    const { data: chars } = await supabase
      .from("characters")
      .select("id, name, player_name, hp_current, hp_max, mp_current, mp_max, san_current, san_max, status, portrait_url")
      .in("id", charIds)
      .order("name");

    if (chars) {
      setCharacters(chars as CharStat[]);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (campaignId) load(campaignId);
  }, [campaignId, load]);

  useEffect(() => {
    if (!isSupabaseConfigured || characters.length === 0) return;
    const charIdSet = new Set(characters.map((c) => c.id));
    const channel = supabase
      .channel("party-board-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "characters" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const p = payload.new as CharStat;
          if (!charIdSet.has(p.id)) return;
          setCharacters((prev) =>
            prev.map((c) =>
              c.id === p.id
                ? {
                    ...c,
                    hp_current: p.hp_current,
                    hp_max: p.hp_max,
                    mp_current: p.mp_current,
                    mp_max: p.mp_max,
                    san_current: p.san_current,
                    san_max: p.san_max,
                    status: p.status,
                  }
                : c
            )
          );
          setLastUpdated(new Date());
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [characters]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-coc-muted font-crimson text-lg italic animate-pulse">
        読み込んでいます...
      </div>
    );
  }

  return (
    <div className="coc-page-enter mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={campaignId ? `/campaigns/${campaignId}` : "/campaigns"}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          キャンペーン詳細に戻る
        </Link>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Monitor size={22} className="text-coc-gold shrink-0" />
            <div>
              <h1 className="font-cinzel text-2xl font-bold text-coc-text">
                パーティステータスボード
              </h1>
              {campaignTitle && (
                <p className="text-xs text-coc-muted mt-0.5">{campaignTitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-coc-muted">
            <RefreshCw size={12} className="text-green-400 animate-pulse" />
            <span className="text-green-400">リアルタイム同期中</span>
            {lastUpdated && (
              <span>
                — 最終更新:{" "}
                {lastUpdated.toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center text-coc-muted">
          Supabase が未設定のためデータを読み込めません。
        </div>
      ) : characters.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center text-coc-muted">
          <p className="font-medium mb-1">参加キャラクターが登録されていません</p>
          <p className="text-xs">シナリオに参加者を追加してください。</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((char) => (
              <CharacterCard key={char.id} char={char} />
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-coc-muted">
            このページは全員がリンクを開くだけで自動同期されます。KPスクリーン・GM画面としてお使いください。
          </p>
        </>
      )}
    </div>
  );
}
