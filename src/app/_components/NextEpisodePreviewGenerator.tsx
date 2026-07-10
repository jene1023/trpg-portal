"use client";

import { useState } from "react";
import { Film, Copy, Check, Send, Loader2 } from "lucide-react";

type Props = {
  scenarioId: string;
  discordWebhookUrl: string | null;
};

export default function NextEpisodePreviewGenerator({ scenarioId: _scenarioId, discordWebhookUrl }: Props) {
  const [unresolvedThreads, setUnresolvedThreads] = useState("");
  const [cliffhanger, setCliffhanger] = useState("");
  const [npcThreat, setNpcThreat] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [discordSending, setDiscordSending] = useState(false);
  const [discordSent, setDiscordSent] = useState(false);

  async function generate() {
    if (!unresolvedThreads && !cliffhanger && !npcThreat) {
      setError("少なくとも1つのフィールドを入力してください。");
      return;
    }
    setError("");
    setLoading(true);
    setPreview("");
    try {
      const res = await fetch("/api/ai/next-episode-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unresolved_threads: unresolvedThreads,
          cliffhanger,
          npc_threat: npcThreat,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "生成に失敗しました。");
      } else {
        setPreview(data.preview);
      }
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!preview) return;
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendToDiscord() {
    if (!preview || !discordWebhookUrl) return;
    setDiscordSending(true);
    try {
      await fetch(discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `**【次回予告】**\n${preview}` }),
      });
      setDiscordSent(true);
      setTimeout(() => setDiscordSent(false), 3000);
    } catch {
      // Discord送信失敗は無視
    } finally {
      setDiscordSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Film size={16} className="text-coc-gold" />
        <p className="text-sm font-medium text-coc-text">次回予告を生成</p>
      </div>
      <p className="text-xs text-coc-muted">
        未解決の伏線・クリフハンガー・NPCの動きを入力すると、次回セッションへの期待を煽るドラマティックな予告テキストをAIが生成します。
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-coc-muted mb-1">未解決の伏線・プロットスレッド</label>
          <textarea
            value={unresolvedThreads}
            onChange={(e) => setUnresolvedThreads(e.target.value)}
            placeholder="例: 図書館の謎の書物の在処が不明、行方不明の助手の消息が掴めない"
            rows={2}
            className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-3 py-2 focus:outline-none focus:border-coc-gold resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-coc-muted mb-1">崖っぷち描写（クリフハンガー）</label>
          <textarea
            value={cliffhanger}
            onChange={(e) => setCliffhanger(e.target.value)}
            placeholder="例: 扉が開いた瞬間、探索者たちは絶句した——闇の中に蠢く無数の影"
            rows={2}
            className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-3 py-2 focus:outline-none focus:border-coc-gold resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-coc-muted mb-1">次回のNPCの動き・脅威</label>
          <textarea
            value={npcThreat}
            onChange={(e) => setNpcThreat(e.target.value)}
            placeholder="例: カルト教団のリーダーが儀式の準備を完了、次回は生贄を求めて動き出す"
            rows={2}
            className="w-full rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-3 py-2 focus:outline-none focus:border-coc-gold resize-none"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-2 rounded-md border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-40"
      >
        {loading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            生成中…
          </>
        ) : (
          <>
            <Film size={15} />
            次回予告を生成
          </>
        )}
      </button>

      {preview && (
        <div className="rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-3 space-y-3">
          <p className="text-sm font-cinzel text-coc-gold text-xs uppercase tracking-widest">次回予告</p>
          <p className="text-sm text-coc-text leading-relaxed whitespace-pre-wrap">{preview}</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={copy}
              className="flex items-center gap-1.5 rounded-md border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
            >
              {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              {copied ? "コピー済み" : "コピー"}
            </button>
            {discordWebhookUrl && (
              <button
                onClick={sendToDiscord}
                disabled={discordSending}
                className="flex items-center gap-1.5 rounded-md border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors disabled:opacity-40"
              >
                {discordSent ? <Check size={13} className="text-green-400" /> : <Send size={13} />}
                {discordSent ? "送信済み" : discordSending ? "送信中…" : "Discordへ送信"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
