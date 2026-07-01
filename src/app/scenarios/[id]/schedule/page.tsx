"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Check, X, CalendarClock, Trash2 } from "lucide-react";
import { supabase, isSupabaseConfigured, ScheduleProposal, ScheduleVote } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";

type ProposalWithVotes = ScheduleProposal & { votes: ScheduleVote[] };

export default function SchedulePage() {
  const params = useParams();
  const router = useRouter();
  const scenarioId = params.id as string;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [proposals, setProposals] = useState<ProposalWithVotes[]>([]);
  const [voterName, setVoterName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    const { data: scenario } = await supabase
      .from("scenarios")
      .select("title")
      .eq("id", scenarioId)
      .single();

    if (scenario) setScenarioTitle(scenario.title);

    const { data: propRows } = await supabase
      .from("schedule_proposals")
      .select("*")
      .eq("scenario_id", scenarioId)
      .order("proposed_at", { ascending: true });

    if (!propRows) { setLoading(false); return; }

    const proposalIds = propRows.map((p) => p.id);
    const { data: voteRows } = proposalIds.length > 0
      ? await supabase.from("schedule_votes").select("*").in("proposal_id", proposalIds)
      : { data: [] };

    const merged: ProposalWithVotes[] = propRows.map((p) => ({
      ...p,
      votes: (voteRows ?? []).filter((v) => v.proposal_id === p.id),
    }));

    setProposals(merged);
    setLoading(false);
  }, [scenarioId]);

  useEffect(() => { load(); }, [load]);

  async function addProposal() {
    if (!isSupabaseConfigured || !newDate) return;
    setSubmitting(true);
    await supabase.from("schedule_proposals").insert({
      scenario_id: scenarioId,
      proposed_at: new Date(newDate).toISOString(),
    });
    setNewDate("");
    await load();
    setSubmitting(false);
  }

  async function vote(proposalId: string, isAvailable: boolean) {
    if (!isSupabaseConfigured || !voterName.trim()) return;
    await supabase.from("schedule_votes").upsert(
      { proposal_id: proposalId, voter_name: voterName.trim(), is_available: isAvailable },
      { onConflict: "proposal_id,voter_name" }
    );
    await load();
  }

  async function deleteProposal(proposalId: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("schedule_votes").delete().eq("proposal_id", proposalId);
    await supabase.from("schedule_proposals").delete().eq("id", proposalId);
    await load();
  }

  async function confirm(proposedAt: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scenarios").update({ next_session_at: proposedAt }).eq("id", scenarioId);
    router.push(`/scenarios/${scenarioId}`);
  }

  const bestProposalId = proposals.reduce<string | null>((best, p) => {
    const okCount = p.votes.filter((v) => v.is_available).length;
    const bestCount = best
      ? proposals.find((q) => q.id === best)?.votes.filter((v) => v.is_available).length ?? 0
      : -1;
    return okCount > bestCount ? p.id : best;
  }, null);

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8 text-coc-muted text-sm">
        Supabase が設定されていません。
      </div>
    );
  }

  return (
    <div className="coc-page-enter mx-auto max-w-xl px-4 py-8">
      <Link
        href={`/scenarios/${scenarioId}`}
        className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        {scenarioTitle || "シナリオ詳細"}
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <CalendarClock size={22} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">日程調整</h1>
      </div>

      {/* 投票者名入力 */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 mb-5">
        <p className="text-xs text-coc-muted mb-2">あなたの名前（投票に使用）</p>
        <input
          type="text"
          value={voterName}
          onChange={(e) => setVoterName(e.target.value)}
          placeholder="PLの名前を入力"
          className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold"
        />
      </div>

      {/* 候補日程追加 */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 mb-6">
        <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">候補日程を追加（KP）</p>
        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="flex-1 rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold"
          />
          <button
            onClick={addProposal}
            disabled={!newDate || submitting}
            className="flex items-center gap-1.5 rounded-lg bg-coc-gold px-4 py-2 text-sm font-medium text-coc-bg hover:bg-coc-gold-dim disabled:opacity-50 transition-colors"
          >
            <Plus size={16} />
            追加
          </button>
        </div>
      </div>

      {/* 候補日程一覧 */}
      {loading ? (
        <p className="text-sm text-coc-muted text-center py-8">読み込み中…</p>
      ) : proposals.length === 0 ? (
        <p className="text-sm text-coc-muted text-center py-8">候補日程がまだありません。KPが追加してください。</p>
      ) : (
        <div className="flex flex-col gap-4">
          {proposals.map((p) => {
            const okCount = p.votes.filter((v) => v.is_available).length;
            const ngCount = p.votes.filter((v) => !v.is_available).length;
            const myVote = voterName.trim()
              ? p.votes.find((v) => v.voter_name === voterName.trim())
              : null;
            const isBest = p.id === bestProposalId && okCount > 0;

            return (
              <div
                key={p.id}
                className={`rounded-xl border px-5 py-4 ${
                  isBest
                    ? "border-coc-gold bg-coc-raised"
                    : "border-coc-border bg-coc-surface"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-base font-semibold text-coc-text">
                      {new Date(p.proposed_at).toLocaleString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {isBest && (
                      <span className="text-xs font-medium text-coc-gold">★ 最多回答</span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteProposal(p.id)}
                    className="text-coc-muted hover:text-red-400 transition-colors"
                    title="候補を削除"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* 集計 */}
                <div className="flex items-center gap-4 mb-3">
                  <span className="flex items-center gap-1 text-sm text-green-400">
                    <Check size={15} />
                    {okCount}人
                  </span>
                  <span className="flex items-center gap-1 text-sm text-red-400">
                    <X size={15} />
                    {ngCount}人
                  </span>
                </div>

                {/* 投票者一覧 */}
                {p.votes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.votes.map((v) => (
                      <span
                        key={v.id}
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          v.is_available
                            ? "bg-green-900/30 text-green-400"
                            : "bg-red-900/30 text-red-400"
                        }`}
                      >
                        {v.voter_name}
                        {v.is_available ? " ○" : " ×"}
                      </span>
                    ))}
                  </div>
                )}

                {/* 投票ボタン */}
                {voterName.trim() && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => vote(p.id, true)}
                      className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        myVote?.is_available
                          ? "border-green-600 bg-green-900/30 text-green-400"
                          : "border-coc-border text-coc-muted hover:border-green-600 hover:text-green-400"
                      }`}
                    >
                      <Check size={13} />
                      参加できる
                    </button>
                    <button
                      onClick={() => vote(p.id, false)}
                      className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        myVote && !myVote.is_available
                          ? "border-red-600 bg-red-900/30 text-red-400"
                          : "border-coc-border text-coc-muted hover:border-red-600 hover:text-red-400"
                      }`}
                    >
                      <X size={13} />
                      参加できない
                    </button>
                    {isBest && (
                      <button
                        onClick={() => confirm(p.proposed_at)}
                        className="ml-auto flex items-center gap-1 rounded-lg bg-coc-gold px-3 py-1.5 text-xs font-medium text-coc-bg hover:bg-coc-gold-dim transition-colors"
                      >
                        <CalendarClock size={13} />
                        この日に確定
                      </button>
                    )}
                  </div>
                )}

                {/* 名前未入力時の確定ボタン */}
                {!voterName.trim() && isBest && (
                  <button
                    onClick={() => confirm(p.proposed_at)}
                    className="flex items-center gap-1 rounded-lg bg-coc-gold px-3 py-1.5 text-xs font-medium text-coc-bg hover:bg-coc-gold-dim transition-colors"
                  >
                    <CalendarClock size={13} />
                    この日に確定
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
