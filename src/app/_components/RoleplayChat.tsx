"use client";

import React, { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  characterId: string;
  characterName: string;
};

export default function RoleplayChat({ characterId, characterName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [scenario, setScenario] = useState("");
  const [showScenario, setShowScenario] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, messages: next, scenario: scenario || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました。");
        return;
      }
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([]);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* シナリオ設定 */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-3">
        <button
          type="button"
          onClick={() => setShowScenario((v) => !v)}
          className="flex items-center gap-2 text-sm text-coc-muted hover:text-coc-text transition-colors w-full text-left"
        >
          <span className="text-coc-gold">{showScenario ? "▼" : "▶"}</span>
          シナリオ設定（任意）
        </button>
        {showScenario && (
          <div className="mt-2">
            <p className="text-xs text-coc-muted mb-1">
              練習する状況・場面設定をGMへ伝えます（例: 「古い屋敷を調査中。霧の中に不気味な影が見えた」）
            </p>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              rows={2}
              placeholder="状況設定を入力..."
              className="w-full resize-y rounded bg-coc-raised border border-coc-border px-3 py-2 text-sm text-coc-text placeholder-coc-muted/60 focus:outline-none focus:border-coc-gold/50 transition-colors"
            />
          </div>
        )}
      </div>

      {/* チャット */}
      <div className="rounded-lg border border-coc-border bg-coc-surface overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-coc-border">
          <p className="text-xs text-coc-muted">
            {characterName} としてGMと対話練習
          </p>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="text-xs text-coc-muted hover:text-coc-text transition-colors"
            >
              リセット
            </button>
          )}
        </div>

        {/* メッセージリスト */}
        <div className="h-80 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-xs text-coc-muted text-center py-8">
              探索者として話しかけてみましょう。<br />
              GMがシナリオの世界で応答します。
            </p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-coc-gold/10 border border-coc-gold/30 text-coc-text"
                      : "bg-coc-raised border border-coc-border text-coc-text"
                  }`}
                >
                  <p className={`text-xs mb-1 ${msg.role === "user" ? "text-coc-gold/70 text-right" : "text-coc-muted"}`}>
                    {msg.role === "user" ? characterName : "GM"}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-coc-raised border border-coc-border rounded-lg px-3 py-2 text-sm text-coc-muted">
                <span className="animate-pulse">GMが返答を考えています…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* エラー */}
        {error && (
          <div className="px-4 py-2 bg-red-950/30 border-t border-red-900/50 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* 入力 */}
        <div className="border-t border-coc-border p-3 flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={loading}
            placeholder={`${characterName} として話す… (Enterで送信、Shift+Enterで改行)`}
            className="flex-1 resize-none rounded bg-coc-raised border border-coc-border px-3 py-2 text-sm text-coc-text placeholder-coc-muted/60 focus:outline-none focus:border-coc-gold/50 transition-colors disabled:opacity-50"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="self-end rounded-lg bg-coc-gold/10 border border-coc-gold/40 px-4 py-2 text-sm text-coc-gold hover:bg-coc-gold/20 hover:border-coc-gold/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            送信
          </button>
        </div>
      </div>

      <p className="text-xs text-coc-muted text-center">
        会話履歴はページを離れるとリセットされます
      </p>
    </div>
  );
}
