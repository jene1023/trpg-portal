"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check, RefreshCw, Share2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const DEFAULT_TEMPLATE = `【卓報告】
シナリオ：{scenario_name}
セッション：第{session_number}回「{title}」
日程：{played_at}
KP：{kp_name}
PL：{player_name}（{character_name} / {occupation}）

{summary}

#クトゥルフ神話TRPG #CoCRPG #TRPG`;

type SessionData = {
  id: string;
  character_id: string;
  session_number: number;
  title: string;
  summary: string | null;
  played_at: string | null;
  characters: {
    name: string;
    player_name: string | null;
    occupation: string | null;
    scenario_name: string | null;
  } | null;
};

function buildReport(template: string, session: SessionData, kpName: string): string {
  const char = session.characters;
  const playedAt = session.played_at
    ? new Date(session.played_at).toLocaleDateString("ja-JP")
    : "日程未定";
  return template
    .replace(/\{scenario_name\}/g, char?.scenario_name ?? "（シナリオ名未設定）")
    .replace(/\{session_number\}/g, String(session.session_number))
    .replace(/\{title\}/g, session.title)
    .replace(/\{played_at\}/g, playedAt)
    .replace(/\{kp_name\}/g, kpName || "（KP名を入力）")
    .replace(/\{player_name\}/g, char?.player_name ?? "（PL名未設定）")
    .replace(/\{character_name\}/g, char?.name ?? "（キャラ名未設定）")
    .replace(/\{occupation\}/g, char?.occupation ?? "（職業未設定）")
    .replace(/\{summary\}/g, session.summary ?? "");
}

export default function SessionSnsReportPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [kpName, setKpName] = useState("");
  const [reportText, setReportText] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !sessionId) {
      setLoading(false);
      return;
    }
    supabase
      .from("sessions")
      .select("id, character_id, session_number, title, summary, played_at, characters(name, player_name, occupation, scenario_name)")
      .eq("id", sessionId)
      .single()
      .then(({ data }) => {
        setSession(data as SessionData | null);
        setLoading(false);
      });
  }, [sessionId]);

  const regenerate = useCallback(() => {
    if (!session) return;
    setReportText(buildReport(template, session, kpName));
  }, [session, template, kpName]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  function handleCopy() {
    if (!reportText) return;
    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleTwitterShare() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(reportText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-coc-muted text-sm">
        読み込み中...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-64 text-coc-muted text-sm">
        セッションが見つかりません
      </div>
    );
  }

  const char = session.characters;
  const charLen = reportText.length;

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/sessions/${sessionId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          セッション詳細に戻る
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Share2 size={18} className="text-coc-gold" />
          <h1 className="font-cinzel text-xl font-bold text-coc-text">卓報告カード生成</h1>
        </div>
        <p className="text-xs text-coc-muted">
          SNS投稿用テキストを自動生成します。テンプレートを編集してカスタマイズできます。
        </p>
      </div>

      {/* Session info summary */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 mb-6 space-y-1">
        <p className="text-xs text-coc-muted uppercase tracking-widest font-medium mb-2">セッション情報</p>
        <p className="text-sm text-coc-text">
          <span className="text-coc-muted mr-2">シナリオ</span>
          {char?.scenario_name ?? "（未設定）"}
        </p>
        <p className="text-sm text-coc-text">
          <span className="text-coc-muted mr-2">セッション</span>
          第{session.session_number}回「{session.title}」
        </p>
        <p className="text-sm text-coc-text">
          <span className="text-coc-muted mr-2">日程</span>
          {session.played_at
            ? new Date(session.played_at).toLocaleDateString("ja-JP")
            : "未設定"}
        </p>
        <p className="text-sm text-coc-text">
          <span className="text-coc-muted mr-2">PL</span>
          {char?.player_name ?? "（未設定）"}（{char?.name ?? ""}）
        </p>
      </div>

      {/* KP name input */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 mb-4">
        <label className="block text-xs text-coc-muted uppercase tracking-widest font-medium mb-2">
          KP名（手動入力）
        </label>
        <input
          type="text"
          value={kpName}
          onChange={(e) => setKpName(e.target.value)}
          placeholder="KP名を入力してください"
          className="w-full rounded border border-coc-border bg-coc-bg text-coc-text text-sm px-3 py-2 focus:outline-none focus:border-coc-gold placeholder:text-coc-muted/50"
        />
      </div>

      {/* Template editor */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-coc-muted uppercase tracking-widest font-medium">
            テンプレート
          </label>
          <button
            type="button"
            onClick={() => setTemplate(DEFAULT_TEMPLATE)}
            className="flex items-center gap-1 text-xs text-coc-muted hover:text-coc-text transition-colors"
          >
            <RefreshCw size={11} />
            デフォルトに戻す
          </button>
        </div>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={10}
          className="w-full rounded border border-coc-border bg-coc-bg text-coc-text text-xs font-mono px-3 py-2 resize-y focus:outline-none focus:border-coc-gold"
        />
        <p className="text-xs text-coc-muted mt-2 leading-relaxed">
          使える変数：
          <code className="mx-0.5 px-1 rounded bg-coc-bg text-coc-gold text-xs">{"{scenario_name}"}</code>
          <code className="mx-0.5 px-1 rounded bg-coc-bg text-coc-gold text-xs">{"{session_number}"}</code>
          <code className="mx-0.5 px-1 rounded bg-coc-bg text-coc-gold text-xs">{"{title}"}</code>
          <code className="mx-0.5 px-1 rounded bg-coc-bg text-coc-gold text-xs">{"{played_at}"}</code>
          <code className="mx-0.5 px-1 rounded bg-coc-bg text-coc-gold text-xs">{"{kp_name}"}</code>
          <code className="mx-0.5 px-1 rounded bg-coc-bg text-coc-gold text-xs">{"{player_name}"}</code>
          <code className="mx-0.5 px-1 rounded bg-coc-bg text-coc-gold text-xs">{"{character_name}"}</code>
          <code className="mx-0.5 px-1 rounded bg-coc-bg text-coc-gold text-xs">{"{occupation}"}</code>
          <code className="mx-0.5 px-1 rounded bg-coc-bg text-coc-gold text-xs">{"{summary}"}</code>
        </p>
      </div>

      {/* Generated preview */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-coc-muted uppercase tracking-widest font-medium">
            プレビュー（編集可能）
          </label>
          <span className="text-xs text-coc-muted">{charLen}文字</span>
        </div>
        <textarea
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          rows={12}
          className="w-full rounded border border-coc-border bg-coc-bg text-coc-text text-sm px-3 py-2 resize-y focus:outline-none focus:border-coc-gold"
        />
        {charLen > 140 && (
          <p className="text-xs text-amber-400 mt-1">
            ※ Twitter/Xは140文字制限があります（現在{charLen}文字）。
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-coc-gold bg-coc-gold/10 px-5 py-3 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "コピーしました！" : "クリップボードにコピー"}
        </button>

        <button
          type="button"
          onClick={handleTwitterShare}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-coc-border bg-coc-surface px-5 py-3 text-sm font-medium text-coc-text hover:border-coc-gold-dim transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 fill-current"
            aria-hidden="true"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Twitter/Xでシェア
        </button>
      </div>
    </div>
  );
}
