"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { supabase, isSupabaseConfigured, AttendanceStatus } from "@/lib/supabase";
import AttendanceToggle from "@/app/_components/AttendanceToggle";

type CharacterSummary = {
  name: string;
  hp_current: number;
  hp_max: number;
  san_current: number;
  san_max: number;
};

type PlayerSummary = {
  display_name: string;
  contact_discord: string | null;
};

type Participant = {
  id: string;
  scenario_id: string;
  character_id: string;
  attendance_status: AttendanceStatus;
  hook_text: string | null;
  player_id: string | null;
  created_at: string;
  characters: CharacterSummary | null;
  players: PlayerSummary | null;
};

type Props = { params: Promise<{ id: string }> };

export default function SessionPrepPage({ params }: Props) {
  const { id } = use(params);

  const [scenarioTitle, setScenarioTitle] = useState<string>("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingHook, setEditingHook] = useState<string | null>(null);
  const [hookDraft, setHookDraft] = useState("");
  const [savingHook, setSavingHook] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function load() {
      const [{ data: scenario }, { data: rows }] = await Promise.all([
        supabase.from("scenarios").select("title").eq("id", id).single(),
        supabase
          .from("scenario_participants")
          .select(
            "*, characters(name, hp_current, hp_max, san_current, san_max), players(display_name, contact_discord)"
          )
          .eq("scenario_id", id)
          .order("created_at", { ascending: true }),
      ]);
      setScenarioTitle(scenario?.title ?? "");
      setParticipants((rows ?? []) as Participant[]);
      setLoading(false);
    }

    load();
  }, [id]);

  const attendingCount = participants.filter(
    (p) => p.attendance_status === "attending"
  ).length;
  const total = participants.length;

  function startEditHook(p: Participant) {
    setEditingHook(p.id);
    setHookDraft(p.hook_text ?? "");
  }

  async function saveHook(participantId: string) {
    if (!isSupabaseConfigured) return;
    setSavingHook(true);
    const { error } = await supabase
      .from("scenario_participants")
      .update({ hook_text: hookDraft || null })
      .eq("id", participantId);
    if (!error) {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId ? { ...p, hook_text: hookDraft || null } : p
        )
      );
    }
    setEditingHook(null);
    setSavingHook(false);
  }

  function cancelEditHook() {
    setEditingHook(null);
    setHookDraft("");
  }

  function hpColor(current: number, max: number) {
    const ratio = max > 0 ? current / max : 1;
    if (ratio <= 0.3) return "text-red-400 border-red-900 bg-red-950/30";
    if (ratio <= 0.6) return "text-yellow-400 border-yellow-800 bg-yellow-950/30";
    return "text-green-400 border-green-800 bg-green-950/30";
  }

  function sanColor(current: number, max: number) {
    const ratio = max > 0 ? current / max : 1;
    if (ratio <= 0.2) return "text-purple-400 border-purple-900 bg-purple-950/30";
    if (ratio <= 0.5) return "text-yellow-400 border-yellow-800 bg-yellow-950/30";
    return "text-cyan-400 border-cyan-800 bg-cyan-950/30";
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        {scenarioTitle && (
          <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>
        )}
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          セッション準備ハブ
        </h1>
      </div>

      {!loading && (
        <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl border border-coc-border bg-coc-surface">
          <Users size={16} className="text-coc-gold" />
          <span className="text-sm text-coc-text">
            参加確認:{" "}
            <span className="font-semibold text-coc-gold">
              出席 {attendingCount}
            </span>
            <span className="text-coc-muted"> / 全体 {total}</span>
          </span>
          {participants.filter((p) => p.attendance_status === "unconfirmed")
            .length > 0 && (
            <span className="ml-auto text-xs text-yellow-400">
              未定{" "}
              {
                participants.filter(
                  (p) => p.attendance_status === "unconfirmed"
                ).length
              }
              名
            </span>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-coc-muted text-center py-12">読み込み中...</p>
      ) : participants.length === 0 ? (
        <p className="text-sm text-coc-muted text-center py-12">
          参加キャラクターがいません
        </p>
      ) : (
        <div className="space-y-4">
          {participants.map((p) => {
            const char = p.characters;
            const player = p.players;
            return (
              <div
                key={p.id}
                className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-coc-text">
                      {char?.name ?? "（キャラクター未設定）"}
                    </p>
                    {player && (
                      <p className="text-xs text-coc-muted mt-0.5">
                        {player.display_name}
                        {player.contact_discord && (
                          <span className="ml-2 text-coc-faint">
                            Discord: {player.contact_discord}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  {char && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`rounded border px-2 py-0.5 text-xs font-mono ${hpColor(char.hp_current, char.hp_max)}`}
                      >
                        HP {char.hp_current}/{char.hp_max}
                      </span>
                      <span
                        className={`rounded border px-2 py-0.5 text-xs font-mono ${sanColor(char.san_current, char.san_max)}`}
                      >
                        SAN {char.san_current}/{char.san_max}
                      </span>
                    </div>
                  )}
                </div>

                <AttendanceToggle
                  participantId={p.id}
                  initialStatus={p.attendance_status}
                />

                <div>
                  {editingHook === p.id ? (
                    <div className="space-y-1.5">
                      <textarea
                        value={hookDraft}
                        onChange={(e) => setHookDraft(e.target.value)}
                        rows={3}
                        placeholder="フックテキストを入力..."
                        className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:border-coc-gold focus:outline-none resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveHook(p.id)}
                          disabled={savingHook}
                          className="rounded-lg bg-coc-gold/10 border border-coc-gold-dim px-3 py-1 text-xs font-medium text-coc-gold hover:bg-coc-gold/20 disabled:opacity-50 transition-colors"
                        >
                          保存
                        </button>
                        <button
                          onClick={cancelEditHook}
                          disabled={savingHook}
                          className="rounded-lg border border-coc-border px-3 py-1 text-xs text-coc-muted hover:border-coc-gold transition-colors"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditHook(p)}
                      className="w-full text-left"
                    >
                      {p.hook_text ? (
                        <p className="rounded-lg border border-coc-border/60 bg-coc-raised px-3 py-2 text-sm text-coc-text hover:border-coc-gold transition-colors whitespace-pre-wrap">
                          {p.hook_text}
                        </p>
                      ) : (
                        <p className="rounded-lg border border-dashed border-coc-border/60 px-3 py-2 text-xs text-coc-faint hover:border-coc-gold transition-colors">
                          フックを入力...
                        </p>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
