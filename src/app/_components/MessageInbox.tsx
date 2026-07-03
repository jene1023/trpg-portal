"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, CharacterMessageWithSender } from "@/lib/supabase";

type CharacterEntry = { id: string; name: string };

type Props = {
  characterId: string;
  characterName: string;
  initialMessages: CharacterMessageWithSender[];
  allCharacters: CharacterEntry[];
};

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageInbox({
  characterId,
  characterName,
  initialMessages,
  allCharacters,
}: Props) {
  const [messages, setMessages] = useState<CharacterMessageWithSender[]>(initialMessages);
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  async function markRead(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase
      .from("character_messages")
      .update({ is_read: true })
      .eq("id", id);
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
    );
  }

  async function send() {
    if (!recipientId || !subject.trim()) return;
    if (!isSupabaseConfigured) return;
    setSending(true);
    const { data, error } = await supabase
      .from("character_messages")
      .insert({
        sender_character_id: characterId,
        recipient_character_id: recipientId,
        subject: subject.trim(),
        body: body.trim() || null,
        sent_at: new Date().toISOString(),
        is_read: false,
      })
      .select()
      .single();
    setSending(false);
    if (!error && data) {
      setSubject("");
      setBody("");
      setRecipientId("");
      setShowCompose(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";
  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-4">
      {/* 作成ボタン */}
      <button
        onClick={() => setShowCompose((v) => !v)}
        className="w-full rounded-lg bg-coc-gold text-black font-semibold text-sm py-2.5 hover:brightness-110 transition-all"
      >
        {showCompose ? "キャンセル" : "手紙を送る"}
      </button>

      {/* 送信フォーム */}
      {showCompose && (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
          <h3 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
            新しいメッセージ
          </h3>
          <div>
            <label className="text-xs text-coc-muted mb-1 block">差出人</label>
            <p className="text-sm text-coc-text">{characterName}</p>
          </div>
          <div>
            <label className="text-xs text-coc-muted mb-1 block">宛先キャラクター</label>
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className={inputClass}
            >
              <option value="">選択してください</option>
              {allCharacters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-coc-muted mb-1 block">件名</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="件名を入力"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-coc-muted mb-1 block">本文</label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="手紙の本文…"
              className={`${inputClass} resize-none`}
            />
          </div>
          <button
            onClick={send}
            disabled={sending || !recipientId || !subject.trim()}
            className="w-full rounded-lg bg-coc-gold text-black font-semibold text-sm py-2 disabled:opacity-40 hover:brightness-110 transition-all"
          >
            {sending ? "送信中…" : "送信"}
          </button>
        </div>
      )}

      {/* 受信箱 */}
      <div>
        <h2 className="font-cinzel text-sm font-semibold text-coc-muted tracking-widest mb-3 flex items-center gap-2">
          受信箱
          {unreadCount > 0 && (
            <span className="rounded bg-coc-gold/20 border border-coc-gold/50 px-1.5 py-0.5 text-xs font-semibold text-coc-gold">
              未読 {unreadCount}件
            </span>
          )}
        </h2>
        {messages.length === 0 ? (
          <p className="text-sm text-coc-muted text-center py-6">
            受信メッセージはありません。
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg border p-4 space-y-2 transition-colors ${
                  msg.is_read
                    ? "border-coc-border bg-coc-surface"
                    : "border-coc-gold/40 bg-coc-gold/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!msg.is_read && (
                        <span className="rounded bg-coc-gold/20 border border-coc-gold/50 px-1.5 py-0.5 text-xs font-semibold text-coc-gold">
                          未読
                        </span>
                      )}
                      <p className="text-sm font-semibold text-coc-text leading-tight">
                        {msg.subject}
                      </p>
                    </div>
                    <p className="text-xs text-coc-muted mt-0.5">
                      差出人:{" "}
                      <span className="text-coc-text">
                        {msg.sender?.name ?? "不明"}
                      </span>
                      {" "}·{" "}
                      {formatDatetime(msg.sent_at)}
                    </p>
                  </div>
                  {!msg.is_read && (
                    <button
                      onClick={() => markRead(msg.id)}
                      className="shrink-0 text-xs text-coc-muted hover:text-coc-gold transition-colors"
                    >
                      既読にする
                    </button>
                  )}
                </div>
                {msg.body && (
                  <p className="text-sm text-coc-text leading-relaxed whitespace-pre-wrap border-t border-coc-border pt-2 font-crimson">
                    {msg.body}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
