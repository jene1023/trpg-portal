"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Send, Megaphone } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioBroadcast } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BroadcastPage({ params }: Props) {
  const { id } = use(params);
  const [broadcasts, setBroadcasts] = useState<ScenarioBroadcast[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase
      .from("scenario_broadcasts")
      .select("*")
      .eq("scenario_id", id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBroadcasts(data ?? []);
        setLoading(false);
      });
  }, [id]);

  async function handleSend() {
    if (!title.trim() || sending) return;
    if (!isSupabaseConfigured) return;
    setSending(true);
    const { data, error } = await supabase
      .from("scenario_broadcasts")
      .insert({
        scenario_id: id,
        sender_character_id: null,
        title: title.trim(),
        body: body.trim() || null,
      })
      .select()
      .single();
    setSending(false);
    if (!error && data) {
      setBroadcasts((prev) => [data as ScenarioBroadcast, ...prev]);
      setTitle("");
      setBody("");
    }
  }

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";

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
      </div>

      <div className="mb-6">
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <Megaphone size={20} className="text-coc-gold" />
          KPブロードキャスト通知
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          シナリオ参加者全員へOOC通知を一斉送信（既読管理付き・永続保存）
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 text-sm text-coc-muted text-center">
          Supabase が設定されていないため、この機能は利用できません。
        </div>
      )}

      {isSupabaseConfigured && (
        <>
          {/* 送信フォーム */}
          <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 mb-6 space-y-3">
            <h2 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest flex items-center gap-2">
              <Bell size={15} />
              新規通知を送信
            </h2>
            <div>
              <label className="text-xs text-coc-muted mb-1 block">タイトル <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 次回セッションは来週日曜20時です"
                maxLength={200}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-coc-muted mb-1 block">本文（任意）</label>
              <textarea
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="詳細情報があれば記入してください…"
                className={`${inputClass} resize-none`}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !title.trim()}
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-coc-gold text-black font-semibold text-sm py-2.5 disabled:opacity-40 hover:brightness-110 transition-all"
            >
              <Send size={14} />
              {sending ? "送信中…" : "全参加者へ送信"}
            </button>
          </div>

          {/* 送信済み一覧 */}
          <div>
            <h2 className="font-cinzel text-sm font-semibold text-coc-muted tracking-widest mb-3">
              送信済み通知
            </h2>
            {loading ? (
              <p className="text-sm text-coc-muted text-center py-6">読み込み中…</p>
            ) : broadcasts.length === 0 ? (
              <p className="text-sm text-coc-muted text-center py-6">
                送信済みの通知はありません。
              </p>
            ) : (
              <div className="space-y-3">
                {broadcasts.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-coc-text leading-tight">
                        {b.title}
                      </p>
                      <span className="text-xs text-coc-muted flex-shrink-0">
                        {formatDatetime(b.created_at)}
                      </span>
                    </div>
                    {b.body && (
                      <p className="text-sm text-coc-text whitespace-pre-wrap leading-relaxed border-t border-coc-border pt-2">
                        {b.body}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
