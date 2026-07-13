"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, CalendarClock, CheckCircle, Lock } from "lucide-react";
import { supabase, isSupabaseConfigured, SchedulePoll, SchedulePollVote, SchedulePollCandidateDate, SchedulePollVoteEntry } from "@/lib/supabase";

type Availability = "ok" | "maybe" | "ng";

type PollWithVotes = SchedulePoll & { schedule_poll_votes: SchedulePollVote[] };

const AVAIL_LABELS: Record<Availability, string> = { ok: "○", maybe: "△", ng: "×" };
const AVAIL_COLORS: Record<Availability, string> = {
  ok: "border-green-600 bg-green-900/30 text-green-400",
  maybe: "border-yellow-600 bg-yellow-900/30 text-yellow-400",
  ng: "border-red-700 bg-red-900/20 text-red-400",
};
const AVAIL_SELECTED: Record<Availability, string> = {
  ok: "border-green-400 bg-green-700/50 text-green-200 ring-1 ring-green-400",
  maybe: "border-yellow-400 bg-yellow-700/50 text-yellow-200 ring-1 ring-yellow-400",
  ng: "border-red-500 bg-red-700/40 text-red-200 ring-1 ring-red-500",
};

type Props = { params: Promise<{ id: string }> };

export default function SchedulePollPage({ params }: Props) {
  const { id } = use(params);

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [poll, setPoll] = useState<PollWithVotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [voterName, setVoterName] = useState("");
  const [myVotes, setMyVotes] = useState<Record<string, Availability>>({});
  const [submitting, setSubmitting] = useState(false);

  // KP create-poll state
  const [creating, setCreating] = useState(false);
  const [candidates, setCandidates] = useState<SchedulePollCandidateDate[]>([{ date: "", label: "" }]);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }

    const { data: scenario } = await supabase
      .from("scenarios")
      .select("title")
      .eq("id", id)
      .single();
    if (scenario) setScenarioTitle(scenario.title);

    const { data: pollRow } = await supabase
      .from("schedule_polls")
      .select("*, schedule_poll_votes(*)")
      .eq("scenario_id", id)
      .eq("is_closed", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setPoll(pollRow as PollWithVotes | null);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const savedName = typeof window !== "undefined" ? localStorage.getItem("schedule_poll_voter_name") ?? "" : "";
  useEffect(() => { if (savedName) setVoterName(savedName); }, [savedName]);

  function saveName(name: string) {
    setVoterName(name);
    if (typeof window !== "undefined") localStorage.setItem("schedule_poll_voter_name", name);
  }

  function addCandidate() {
    if (candidates.length >= 10) return;
    setCandidates((prev) => [...prev, { date: "", label: "" }]);
  }

  function removeCandidate(i: number) {
    setCandidates((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateCandidate(i: number, field: keyof SchedulePollCandidateDate, value: string) {
    setCandidates((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  }

  async function createPoll() {
    if (!isSupabaseConfigured) return;
    const valid = candidates.filter((c) => c.date.trim());
    if (valid.length === 0) return;
    setCreating(true);
    await supabase.from("schedule_polls").insert({
      scenario_id: id,
      candidate_dates: valid,
      is_closed: false,
    });
    setCandidates([{ date: "", label: "" }]);
    await load();
    setCreating(false);
  }

  function toggleVote(date: string, avail: Availability) {
    setMyVotes((prev) => ({ ...prev, [date]: prev[date] === avail ? "ng" : avail }));
  }

  async function submitVotes() {
    if (!poll || !voterName.trim() || !isSupabaseConfigured) return;
    setSubmitting(true);

    const voteEntries: SchedulePollVoteEntry[] = poll.candidate_dates.map((c) => ({
      date: c.date,
      availability: myVotes[c.date] ?? "ng",
    }));

    const existingVote = poll.schedule_poll_votes.find(
      (v) => v.voter_user_id === voterName.trim()
    );

    if (existingVote) {
      await supabase
        .from("schedule_poll_votes")
        .update({ votes: voteEntries })
        .eq("id", existingVote.id);
    } else {
      await supabase.from("schedule_poll_votes").insert({
        poll_id: poll.id,
        voter_user_id: voterName.trim(),
        votes: voteEntries,
      });
    }

    await load();
    setSubmitting(false);
  }

  async function decideDate(date: string) {
    if (!poll || !isSupabaseConfigured) return;
    await supabase
      .from("scenarios")
      .update({ next_session_at: date })
      .eq("id", id);
    await supabase
      .from("schedule_polls")
      .update({ is_closed: true })
      .eq("id", poll.id);
    await load();
  }

  function getAggregate(date: string): Record<Availability, number> {
    const counts: Record<Availability, number> = { ok: 0, maybe: 0, ng: 0 };
    if (!poll) return counts;
    for (const vote of poll.schedule_poll_votes) {
      const entry = (vote.votes as SchedulePollVoteEntry[]).find((v) => v.date === date);
      if (entry) counts[entry.availability]++;
    }
    return counts;
  }

  const voterNames = poll
    ? Array.from(new Set(poll.schedule_poll_votes.map((v) => v.voter_user_id)))
    : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {scenarioTitle || "シナリオ"}
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <CalendarClock size={22} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">日程調整（投票）</h1>
      </div>

      {!isSupabaseConfigured && (
        <p className="text-coc-muted text-sm">Supabase が設定されていません。</p>
      )}

      {isSupabaseConfigured && loading && (
        <p className="text-coc-muted text-sm">読み込み中...</p>
      )}

      {isSupabaseConfigured && !loading && !poll && (
        <div className="rounded-xl border border-coc-border bg-coc-surface p-6">
          <p className="text-sm text-coc-muted mb-4">現在アクティブな日程調整ポールがありません。KPとして候補日程を作成してください。</p>

          <div className="flex flex-col gap-2 mb-4">
            {candidates.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="datetime-local"
                  value={c.date}
                  onChange={(e) => updateCandidate(i, "date", e.target.value)}
                  className="rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none flex-1"
                />
                <input
                  type="text"
                  placeholder="ラベル（任意）"
                  value={c.label}
                  onChange={(e) => updateCandidate(i, "label", e.target.value)}
                  className="rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none w-32"
                />
                {candidates.length > 1 && (
                  <button
                    onClick={() => removeCandidate(i)}
                    className="text-coc-muted hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            {candidates.length < 10 && (
              <button
                onClick={addCandidate}
                className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
              >
                <Plus size={15} />
                候補日を追加
              </button>
            )}
            <button
              onClick={createPoll}
              disabled={creating || candidates.every((c) => !c.date.trim())}
              className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50"
            >
              {creating ? "作成中..." : "ポールを作成"}
            </button>
          </div>
        </div>
      )}

      {isSupabaseConfigured && !loading && poll && (
        <div className="flex flex-col gap-6">
          {/* 投票フォーム */}
          <div className="rounded-xl border border-coc-border bg-coc-surface p-5">
            <h2 className="text-sm font-semibold text-coc-text mb-3">あなたの回答</h2>
            <div className="mb-3">
              <input
                type="text"
                placeholder="名前を入力（PLハンドル等）"
                value={voterName}
                onChange={(e) => saveName(e.target.value)}
                className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-3">
              {poll.candidate_dates.map((c) => {
                const dateStr = c.date
                  ? new Date(c.date).toLocaleString("ja-JP", {
                      year: "numeric", month: "numeric", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })
                  : c.date;
                const current = myVotes[c.date] ?? null;

                return (
                  <div key={c.date} className="rounded-lg border border-coc-border bg-coc-bg/50 px-4 py-3">
                    <p className="text-sm font-medium text-coc-text mb-2">
                      {dateStr}
                      {c.label && <span className="ml-2 text-xs text-coc-muted">({c.label})</span>}
                    </p>
                    <div className="flex gap-2">
                      {(["ok", "maybe", "ng"] as Availability[]).map((avail) => (
                        <button
                          key={avail}
                          onClick={() => toggleVote(c.date, avail)}
                          className={`rounded-lg border px-4 py-1.5 text-sm font-bold transition-all ${
                            current === avail ? AVAIL_SELECTED[avail] : AVAIL_COLORS[avail]
                          }`}
                        >
                          {AVAIL_LABELS[avail]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={submitVotes}
              disabled={submitting || !voterName.trim()}
              className="mt-4 flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-5 py-2.5 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50"
            >
              <CheckCircle size={15} />
              {submitting ? "送信中..." : "回答を送信"}
            </button>
          </div>

          {/* 集計ビュー */}
          <div className="rounded-xl border border-coc-border bg-coc-surface p-5">
            <h2 className="text-sm font-semibold text-coc-text mb-1">集計結果</h2>
            {voterNames.length > 0 && (
              <p className="text-xs text-coc-muted mb-4">回答者: {voterNames.join("、")}</p>
            )}

            <div className="flex flex-col gap-4">
              {poll.candidate_dates.map((c) => {
                const agg = getAggregate(c.date);
                const total = agg.ok + agg.maybe + agg.ng;
                const dateStr = c.date
                  ? new Date(c.date).toLocaleString("ja-JP", {
                      year: "numeric", month: "numeric", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })
                  : c.date;

                return (
                  <div key={c.date} className="rounded-lg border border-coc-border bg-coc-bg/50 px-4 py-3">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <p className="text-sm font-medium text-coc-text">
                        {dateStr}
                        {c.label && <span className="ml-2 text-xs text-coc-muted">({c.label})</span>}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-green-400 font-bold">○ {agg.ok}</span>
                        <span className="text-yellow-400 font-bold">△ {agg.maybe}</span>
                        <span className="text-red-400 font-bold">× {agg.ng}</span>
                      </div>
                    </div>

                    {/* 横棒グラフ */}
                    {total > 0 && (
                      <div className="flex h-3 rounded-full overflow-hidden gap-px bg-coc-border">
                        {agg.ok > 0 && (
                          <div
                            className="bg-green-600 transition-all"
                            style={{ width: `${(agg.ok / total) * 100}%` }}
                          />
                        )}
                        {agg.maybe > 0 && (
                          <div
                            className="bg-yellow-500 transition-all"
                            style={{ width: `${(agg.maybe / total) * 100}%` }}
                          />
                        )}
                        {agg.ng > 0 && (
                          <div
                            className="bg-red-700 transition-all"
                            style={{ width: `${(agg.ng / total) * 100}%` }}
                          />
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => decideDate(c.date)}
                      className="mt-3 flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-1.5 text-xs font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors"
                    >
                      <Lock size={12} />
                      この日に決定
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
