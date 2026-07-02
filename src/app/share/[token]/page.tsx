export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = { params: Promise<{ token: string }> };

const STATUS_LABELS: Record<string, string> = {
  planning: "準備中",
  ongoing: "進行中",
  completed: "完了",
};

export default async function SharePage({ params }: Props) {
  const { token } = await params;

  if (!isSupabaseConfigured) notFound();

  const now = new Date().toISOString();

  const { data: tokenRow } = await supabase
    .from("share_tokens")
    .select("*")
    .eq("token", token)
    .gt("expires_at", now)
    .single();

  if (!tokenRow) notFound();

  const targetType = ((tokenRow as { target_type?: string }).target_type ?? "handout") as
    | "handout"
    | "session_pack";

  const expiresAt = new Date(tokenRow.expires_at as string).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  /* ── ハンドアウト ───────────────────────────── */
  if (targetType === "handout") {
    const handoutId = (tokenRow as { handout_id?: string | null }).handout_id;
    if (!handoutId) notFound();

    const { data: handout } = await supabase
      .from("handouts")
      .select("title, content, recipient_name, is_secret")
      .eq("id", handoutId)
      .single();

    if (!handout || (handout as { is_secret: boolean }).is_secret) notFound();

    const h = handout as {
      title: string;
      content: string | null;
      recipient_name: string | null;
      is_secret: boolean;
    };

    return (
      <div className="min-h-screen coc-bg flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-6 text-center">
            <p className="font-cinzel text-xs tracking-widest text-coc-muted uppercase">
              Handout
            </p>
          </div>
          <div className="rounded-xl border border-coc-border bg-coc-surface p-6 space-y-4">
            <h1 className="font-cinzel text-xl font-bold text-coc-text">{h.title}</h1>
            {h.recipient_name && (
              <p className="text-sm text-coc-muted">
                宛先:{" "}
                <span className="text-coc-text font-medium">{h.recipient_name}</span>
              </p>
            )}
            {h.content ? (
              <div className="border-l-2 border-coc-gold pl-4">
                <p className="font-crimson text-coc-text text-base leading-relaxed whitespace-pre-wrap">
                  {h.content}
                </p>
              </div>
            ) : (
              <p className="text-coc-muted text-sm italic">（本文なし）</p>
            )}
            <p className="text-xs text-coc-faint pt-2">
              このリンクの有効期限: {expiresAt}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── セッション情報パック ──────────────────────── */
  const scenarioId = (tokenRow as { scenario_id?: string | null }).scenario_id;
  if (!scenarioId) notFound();

  const { data: scenarioRaw } = await supabase
    .from("scenarios")
    .select("*, scenario_participants(*, characters(*)), handouts(*)")
    .eq("id", scenarioId)
    .single();

  if (!scenarioRaw) notFound();

  type CharRow = {
    id: string;
    name: string;
    player_name: string | null;
    occupation: string | null;
    hp_current: number;
    hp_max: number;
    mp_current: number;
    mp_max: number;
    san_current: number;
    san_max: number;
  };
  type ParticipantRow = { id: string; character_id: string; characters: CharRow | null };
  type HandoutRow = {
    id: string;
    title: string;
    content: string | null;
    recipient_name: string | null;
    is_secret: boolean;
    is_distributed: boolean;
  };

  const scenario = scenarioRaw as {
    title: string;
    status: string;
    synopsis: string | null;
    next_session_at: string | null;
    scenario_participants: ParticipantRow[];
    handouts: HandoutRow[];
  };

  const participants = scenario.scenario_participants ?? [];
  const publicHandouts = (scenario.handouts ?? []).filter(
    (h) => !h.is_secret && h.is_distributed
  );

  const characterIds = participants
    .map((p) => p.characters?.id)
    .filter((id): id is string => Boolean(id));

  const latestSessions: Record<
    string,
    { title: string; summary: string | null; session_number: number }
  > = {};

  if (characterIds.length > 0) {
    const { data: sessionRows } = await supabase
      .from("sessions")
      .select("character_id, title, summary, session_number")
      .in("character_id", characterIds)
      .order("session_number", { ascending: false });

    for (const s of sessionRows ?? []) {
      const row = s as {
        character_id: string;
        title: string;
        summary: string | null;
        session_number: number;
      };
      if (!latestSessions[row.character_id]) {
        latestSessions[row.character_id] = row;
      }
    }
  }

  return (
    <div className="min-h-screen coc-bg px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <p className="font-cinzel text-xs tracking-widest text-coc-muted uppercase mb-1">
            Session Info Pack
          </p>
          <h1 className="font-cinzel text-2xl font-bold text-coc-text">
            {scenario.title}
          </h1>
          <span className="text-xs text-coc-muted">
            {STATUS_LABELS[scenario.status] ?? scenario.status}
          </span>
        </div>

        {scenario.next_session_at && (
          <div className="mb-4 rounded-xl border border-coc-gold-dim bg-coc-raised px-4 py-3 text-center">
            <p className="text-xs text-coc-muted mb-1">次回セッション予定</p>
            <p className="text-coc-gold font-semibold">
              {new Date(scenario.next_session_at).toLocaleString("ja-JP", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}

        {scenario.synopsis && (
          <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface p-4">
            <p className="font-cinzel text-xs text-coc-muted uppercase tracking-widest mb-2">
              概要
            </p>
            <p className="text-sm text-coc-text whitespace-pre-wrap">{scenario.synopsis}</p>
          </div>
        )}

        {participants.length > 0 && (
          <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface p-4">
            <p className="font-cinzel text-xs text-coc-muted uppercase tracking-widest mb-3">
              参加者
            </p>
            <div className="space-y-4">
              {participants.map((p) => {
                const ch = p.characters;
                if (!ch) return null;
                const latest = latestSessions[ch.id];
                return (
                  <div
                    key={p.id}
                    className="border-b border-coc-border pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-baseline gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-coc-text">{ch.name}</span>
                      {ch.occupation && (
                        <span className="text-xs text-coc-muted">{ch.occupation}</span>
                      )}
                      {ch.player_name && (
                        <span className="text-xs text-coc-faint">/ {ch.player_name}</span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs mb-1">
                      <span className="text-coc-muted">
                        HP{" "}
                        <span
                          className={
                            ch.hp_current / ch.hp_max <= 0.25
                              ? "text-red-400 font-bold"
                              : ch.hp_current / ch.hp_max <= 0.5
                              ? "text-yellow-400 font-medium"
                              : "text-coc-text"
                          }
                        >
                          {ch.hp_current}/{ch.hp_max}
                        </span>
                      </span>
                      <span className="text-coc-muted">
                        MP <span className="text-coc-text">{ch.mp_current}/{ch.mp_max}</span>
                      </span>
                      <span className="text-coc-muted">
                        SAN{" "}
                        <span
                          className={
                            ch.san_current / ch.san_max <= 0.25
                              ? "text-red-400 font-bold"
                              : ch.san_current / ch.san_max <= 0.5
                              ? "text-yellow-400 font-medium"
                              : "text-coc-text"
                          }
                        >
                          {ch.san_current}/{ch.san_max}
                        </span>
                      </span>
                    </div>
                    {latest && (
                      <div className="text-xs text-coc-muted">
                        <span className="text-coc-faint">前回: </span>
                        セッション{latest.session_number}「{latest.title}」
                        {latest.summary && (
                          <p className="mt-0.5 text-coc-faint line-clamp-2 leading-relaxed">
                            {latest.summary}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {publicHandouts.length > 0 && (
          <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface p-4">
            <p className="font-cinzel text-xs text-coc-muted uppercase tracking-widest mb-3">
              配布済みハンドアウト
            </p>
            <div className="space-y-4">
              {publicHandouts.map((h) => (
                <div
                  key={h.id}
                  className="border-b border-coc-border pb-3 last:border-0 last:pb-0"
                >
                  <p className="font-cinzel font-semibold text-coc-text text-sm mb-1">
                    {h.title}
                  </p>
                  {h.recipient_name && (
                    <p className="text-xs text-coc-muted mb-1">
                      受け取り: {h.recipient_name}
                    </p>
                  )}
                  {h.content && (
                    <p className="text-sm text-coc-text whitespace-pre-wrap border-l-2 border-coc-border pl-3 leading-relaxed">
                      {h.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {participants.length === 0 && publicHandouts.length === 0 && !scenario.synopsis && (
          <div className="rounded-xl border border-coc-border bg-coc-surface p-6 text-center">
            <p className="text-coc-muted text-sm">
              情報パックにはまだ共有できるコンテンツがありません
            </p>
          </div>
        )}

        <p className="text-xs text-coc-faint text-center mt-6">
          このリンクの有効期限: {expiresAt}
        </p>
      </div>
    </div>
  );
}
