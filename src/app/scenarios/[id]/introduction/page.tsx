"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Radio, Send, BookOpen, X, AlertTriangle, Music } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type IntroPayload = {
  narration_text: string;
  content_warnings: string;
  world_setting_note: string;
  bgm_suggestion: string;
};

type Props = { params: Promise<{ id: string }> };

export default function SessionIntroductionPage({ params }: Props) {
  const { id } = use(params);

  // KP editor state
  const [narration, setNarration] = useState("");
  const [worldNote, setWorldNote] = useState("");
  const [contentWarnings, setContentWarnings] = useState("");
  const [bgmSuggestion, setBgmSuggestion] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);

  // PL receive state
  const [connected, setConnected] = useState(false);
  const [received, setReceived] = useState<IntroPayload | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const ch = supabase
      .channel(`intro-${id}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("broadcast", { event: "intro_started" }, ({ payload }: { payload: any }) => {
        setReceived({
          narration_text: payload.narration_text ?? "",
          content_warnings: payload.content_warnings ?? "",
          world_setting_note: payload.world_setting_note ?? "",
          bgm_suggestion: payload.bgm_suggestion ?? "",
        });
        setModalOpen(true);
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .subscribe((status: any) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(ch);
      setConnected(false);
    };
  }, [id]);

  async function handleBroadcast() {
    if (!isSupabaseConfigured || broadcasting) return;
    if (!narration.trim()) return;
    setBroadcasting(true);
    setBroadcastDone(false);
    await supabase.channel(`intro-${id}`).send({
      type: "broadcast",
      event: "intro_started",
      payload: {
        narration_text: narration.trim(),
        content_warnings: contentWarnings.trim(),
        world_setting_note: worldNote.trim(),
        bgm_suggestion: bgmSuggestion.trim(),
      },
    });
    setBroadcasting(false);
    setBroadcastDone(true);
    setTimeout(() => setBroadcastDone(false), 4000);
  }

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold resize-none";

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {/* Header */}
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
          {connected ? "チャンネル接続中" : "接続中…"}
        </span>
      </div>

      <div className="mb-6">
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <BookOpen size={20} className="text-coc-gold" />
          セッション開幕イントロ配信
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          KPが事前にナレーション・世界観説明・コンテンツ警告を作成し、開幕時にPL全員へ一斉配信します。
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 text-sm text-coc-muted text-center">
          Supabase が設定されていないため、この機能は利用できません。
        </div>
      )}

      {isSupabaseConfigured && (
        <div className="space-y-4">
          {/* KP Editor */}
          <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 space-y-3">
            <h2 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest flex items-center gap-2">
              KP — イントロ作成
            </h2>

            {/* Content Warnings */}
            <div>
              <label className="text-xs font-medium text-red-400 mb-1 flex items-center gap-1">
                <AlertTriangle size={11} />
                コンテンツ警告（先に表示されます）
              </label>
              <textarea
                rows={2}
                value={contentWarnings}
                onChange={(e) => setContentWarnings(e.target.value)}
                placeholder="例: 暴力描写・心理的ホラー・虫・病院など"
                className={inputClass}
              />
            </div>

            {/* Narration */}
            <div>
              <label className="text-xs text-coc-muted mb-1 block">
                オープニングナレーション <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={6}
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="セッション冒頭で読み上げるナレーション本文を書いてください…"
                className={inputClass}
              />
            </div>

            {/* World Setting */}
            <div>
              <label className="text-xs text-coc-muted mb-1 block">世界観補足メモ</label>
              <textarea
                rows={3}
                value={worldNote}
                onChange={(e) => setWorldNote(e.target.value)}
                placeholder="舞台設定・時代背景・特別なルールなど（任意）"
                className={inputClass}
              />
            </div>

            {/* BGM */}
            <div>
              <label className="text-xs text-coc-muted mb-1 flex items-center gap-1">
                <Music size={11} />
                BGM推薦曲（任意）
              </label>
              <input
                type="text"
                value={bgmSuggestion}
                onChange={(e) => setBgmSuggestion(e.target.value)}
                placeholder="曲名 / URLなど"
                className={inputClass.replace("resize-none", "")}
              />
            </div>

            {/* Broadcast Button */}
            <button
              onClick={handleBroadcast}
              disabled={broadcasting || !narration.trim()}
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-coc-gold text-black font-semibold text-sm py-2.5 disabled:opacity-40 hover:brightness-110 transition-all"
            >
              <Send size={14} />
              {broadcasting ? "配信中…" : "📢 配信開始 — PL全員へ送信"}
            </button>

            {broadcastDone && (
              <p className="text-xs text-green-400 text-center">
                ✓ PL全員へ送信しました
              </p>
            )}
          </div>

          {/* PL Receive Info */}
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
            <h2 className="font-cinzel text-sm font-semibold text-coc-muted tracking-widest mb-2 flex items-center gap-2">
              <Radio size={14} />
              PL受信モード
            </h2>
            <p className="text-xs text-coc-muted">
              このページを開いているPL全員は、KPが「配信開始」ボタンを押した瞬間にナレーションが画面全体に表示されます。
            </p>
            {received && (
              <button
                onClick={() => setModalOpen(true)}
                className="mt-3 text-xs text-coc-gold hover:underline"
              >
                最後に受信したイントロを再表示 →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Modal for PL */}
      {modalOpen && received && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 px-6 py-8 overflow-y-auto">
          {/* Close */}
          <button
            onClick={() => setModalOpen(false)}
            className="self-end mb-6 flex items-center gap-1.5 rounded-full border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text transition-colors"
          >
            <X size={13} />
            閉じる
          </button>

          <div className="mx-auto w-full max-w-2xl space-y-6">
            {/* Content Warnings */}
            {received.content_warnings && (
              <div className="rounded-xl border border-red-800 bg-red-950/40 px-5 py-4">
                <p className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1 uppercase tracking-widest">
                  <AlertTriangle size={13} />
                  コンテンツ警告
                </p>
                <p className="text-sm font-bold text-red-300 leading-relaxed whitespace-pre-wrap">
                  {received.content_warnings}
                </p>
              </div>
            )}

            {/* Narration */}
            <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-6 py-6">
              <p className="font-cinzel text-xs font-medium text-coc-gold uppercase tracking-widest mb-4">
                Opening Narration
              </p>
              <p className="text-base text-coc-text leading-relaxed whitespace-pre-wrap">
                {received.narration_text}
              </p>
            </div>

            {/* World Setting */}
            {received.world_setting_note && (
              <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
                <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-2">
                  世界観補足
                </p>
                <p className="text-sm text-coc-text leading-relaxed whitespace-pre-wrap">
                  {received.world_setting_note}
                </p>
              </div>
            )}

            {/* BGM */}
            {received.bgm_suggestion && (
              <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 flex items-center gap-2">
                <Music size={16} className="text-coc-gold flex-shrink-0" />
                <div>
                  <p className="text-xs text-coc-muted">BGM推薦</p>
                  <p className="text-sm text-coc-text">{received.bgm_suggestion}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
