"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { ArrowLeft, Radio, Plus, X, CheckCircle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type PollCreatedMsg = {
  type: "poll_created";
  pollId: string;
  question: string;
  options: string[];
};

type VoteMsg = {
  type: "vote";
  pollId: string;
  optionIndex: number;
  voterName: string;
};

type PollClosedMsg = {
  type: "poll_closed";
  pollId: string;
};

type PollMessage = PollCreatedMsg | VoteMsg | PollClosedMsg;

type ActivePoll = {
  pollId: string;
  question: string;
  options: string[];
  votes: Record<number, string[]>;
  isClosed: boolean;
};

type Props = { params: Promise<{ id: string }> };

export default function ScenarioPollPage({ params }: Props) {
  const { id } = use(params);
  const [connected, setConnected] = useState(false);
  const [name, setName] = useState("");
  const [poll, setPoll] = useState<ActivePoll | null>(null);
  const [myVote, setMyVote] = useState<number | null>(null);

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [creating, setCreating] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const ch = supabase
      .channel(`poll-${id}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("broadcast", { event: "poll" }, ({ payload }: { payload: any }) => {
        const msg = payload as PollMessage;
        if (msg.type === "poll_created") {
          setPoll({
            pollId: msg.pollId,
            question: msg.question,
            options: msg.options,
            votes: {},
            isClosed: false,
          });
          setMyVote(null);
        } else if (msg.type === "vote") {
          setPoll((prev) => {
            if (!prev || prev.pollId !== msg.pollId) return prev;
            const updatedVotes: Record<number, string[]> = {};
            for (const k in prev.votes) {
              updatedVotes[Number(k)] = prev.votes[Number(k)].filter(
                (v) => v !== msg.voterName
              );
            }
            updatedVotes[msg.optionIndex] = [
              ...(updatedVotes[msg.optionIndex] ?? []),
              msg.voterName,
            ];
            return { ...prev, votes: updatedVotes };
          });
        } else if (msg.type === "poll_closed") {
          setPoll((prev) =>
            prev && prev.pollId === msg.pollId
              ? { ...prev, isClosed: true }
              : prev
          );
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .subscribe((status: any) => {
        setConnected(status === "SUBSCRIBED");
      });

    channelRef.current = ch;

    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
      setConnected(false);
    };
  }, [id]);

  async function createPoll() {
    if (!channelRef.current || !question.trim()) return;
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) return;
    setCreating(true);
    const pollId = `${Date.now()}`;
    const msg: PollCreatedMsg = {
      type: "poll_created",
      pollId,
      question: question.trim(),
      options: validOptions,
    };
    await channelRef.current.send({
      type: "broadcast",
      event: "poll",
      payload: msg,
    });
    setPoll({
      pollId,
      question: question.trim(),
      options: validOptions,
      votes: {},
      isClosed: false,
    });
    setMyVote(null);
    setQuestion("");
    setOptions(["", ""]);
    setCreating(false);
  }

  async function vote(optionIndex: number) {
    if (!channelRef.current || !poll || !name.trim() || poll.isClosed) return;
    setMyVote(optionIndex);
    const msg: VoteMsg = {
      type: "vote",
      pollId: poll.pollId,
      optionIndex,
      voterName: name.trim(),
    };
    await channelRef.current.send({
      type: "broadcast",
      event: "poll",
      payload: msg,
    });
  }

  async function closePoll() {
    if (!channelRef.current || !poll) return;
    const msg: PollClosedMsg = {
      type: "poll_closed",
      pollId: poll.pollId,
    };
    await channelRef.current.send({
      type: "broadcast",
      event: "poll",
      payload: msg,
    });
    setPoll((prev) => (prev ? { ...prev, isClosed: true } : prev));
  }

  const totalVotes = poll
    ? Object.values(poll.votes).reduce((s, v) => s + v.length, 0)
    : 0;

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
              ? "border-green-800 text-green-400"
              : "border-coc-border text-coc-muted"
          }`}
        >
          <Radio size={11} />
          {connected ? "接続中" : "接続待機中"}
        </span>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-6">
        行動投票
      </h1>

      {!isSupabaseConfigured && (
        <p className="text-coc-muted text-sm">Supabase が未設定です。</p>
      )}

      {isSupabaseConfigured && (
        <>
          <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-4 py-4">
            <label className="block text-xs text-coc-muted mb-1.5">
              あなたの名前（PL / KP）
            </label>
            <input
              type="text"
              placeholder="探索者名 or KP"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold"
            />
          </div>

          <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-4 py-4">
            <p className="text-sm font-medium text-coc-text mb-3">
              KP: 投票を作成
            </p>
            <div className="mb-3">
              <input
                type="text"
                placeholder="議題（例: 次の行動を選んでください）"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold"
              />
            </div>
            <div className="flex flex-col gap-2 mb-3">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`選択肢 ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const updated = [...options];
                      updated[i] = e.target.value;
                      setOptions(updated);
                    }}
                    className="flex-1 rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() =>
                        setOptions(options.filter((_, j) => j !== i))
                      }
                      className="text-coc-muted hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {options.length < 6 && (
                <button
                  onClick={() => setOptions([...options, ""])}
                  className="flex items-center gap-1 text-xs text-coc-muted hover:text-coc-gold transition-colors"
                >
                  <Plus size={13} />
                  選択肢を追加
                </button>
              )}
              <button
                onClick={createPoll}
                disabled={
                  creating ||
                  !question.trim() ||
                  options.filter((o) => o.trim()).length < 2
                }
                className="ml-auto rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-1.5 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40"
              >
                {creating ? "作成中…" : "投票を開始"}
              </button>
            </div>
          </div>

          {poll ? (
            <div className="rounded-xl border border-coc-gold-dim bg-coc-surface px-4 py-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-coc-muted mb-1">
                    {poll.isClosed ? "締め切り済み" : "投票受付中"}
                  </p>
                  <p className="font-medium text-coc-text">{poll.question}</p>
                </div>
                {!poll.isClosed && (
                  <button
                    onClick={closePoll}
                    className="ml-4 flex-shrink-0 text-xs text-coc-muted hover:text-red-400 transition-colors"
                  >
                    締め切る
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {poll.options.map((opt, i) => {
                  const count = poll.votes[i]?.length ?? 0;
                  const pct =
                    totalVotes > 0
                      ? Math.round((count / totalVotes) * 100)
                      : 0;
                  const isMyVote = myVote === i;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {isMyVote && (
                            <CheckCircle
                              size={13}
                              className="text-coc-gold flex-shrink-0"
                            />
                          )}
                          <span className="text-sm text-coc-text">{opt}</span>
                        </div>
                        <span className="text-xs text-coc-muted">
                          {count}票 ({pct}%)
                        </span>
                      </div>
                      <div className="relative mb-2 h-2 w-full overflow-hidden rounded-full bg-coc-bg">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-coc-gold transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {!poll.isClosed && name.trim() && (
                        <button
                          onClick={() => vote(i)}
                          disabled={isMyVote}
                          className={`w-full rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            isMyVote
                              ? "cursor-default border-coc-gold bg-coc-gold/20 text-coc-gold"
                              : "border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-gold"
                          }`}
                        >
                          {isMyVote ? "選択済み" : "選択する"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 text-right text-xs text-coc-muted">
                合計 {totalVotes}票
              </p>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-coc-muted">
              KPが投票を作成すると、ここに表示されます
            </p>
          )}
        </>
      )}
    </div>
  );
}
