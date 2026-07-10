"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Radio, Send } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type ChatMessage = {
  author: string;
  text: string;
  timestamp: string;
};

type Props = { params: Promise<{ id: string }> };

export default function ScenarioChatPage({ params }: Props) {
  const { id } = use(params);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const ch = supabase
      .channel(`chat-${id}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("broadcast", { event: "message" }, ({ payload }: { payload: any }) => {
        setMessages((prev) =>
          [...prev, payload as ChatMessage].slice(-100)
        );
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!author.trim() || !text.trim() || sending || !channelRef.current) return;
    setSending(true);
    await channelRef.current.send({
      type: "broadcast",
      event: "message",
      payload: {
        author: author.trim(),
        text: text.trim(),
        timestamp: new Date().toISOString(),
      },
    });
    setText("");
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(iso: string) {
    try {
      return new Date(iso).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 flex flex-col min-h-dvh">
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
          {connected ? "接続中" : "接続待機中…"}
        </span>
      </div>

      <div className="mb-4">
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <MessageCircle size={20} className="text-coc-gold" />
          セッションチャット
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          参加者間のリアルタイムテキストチャット（揮発性・再読み込みで消去）
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 text-sm text-coc-muted text-center">
          Supabase が設定されていないため、リアルタイム機能は利用できません。
        </div>
      )}

      {isSupabaseConfigured && (
        <>
          <div className="flex-1 rounded-xl border border-coc-border bg-coc-surface overflow-y-auto max-h-[55vh] px-4 py-4 flex flex-col gap-3 mb-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <MessageCircle size={32} className="text-coc-muted opacity-30 mb-3" />
                <p className="text-sm text-coc-muted">まだメッセージはありません</p>
                <p className="text-xs text-coc-muted mt-1">
                  名前を入力してチャットを始めましょう
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-coc-border bg-coc-raised px-4 py-3"
                >
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-coc-gold">
                      {msg.author}
                    </span>
                    <span className="text-xs text-coc-muted flex-shrink-0">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-coc-text whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-4 flex flex-col gap-3">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="名前（例: KP / 探索者名）"
              maxLength={30}
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
            />
            <div className="flex gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力… (Enter で送信 / Shift+Enter で改行)"
                rows={2}
                className="flex-1 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none resize-none"
              />
              <button
                onClick={handleSend}
                disabled={!author.trim() || !text.trim() || sending || !connected}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-end"
              >
                <Send size={15} />
                送信
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
