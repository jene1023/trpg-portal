"use client";

import { useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";

type Narration = { label: string; text: string };

const WEATHER_OPTIONS = [
  "晴れ・昼間",
  "晴れ・夜",
  "曇り・昼間",
  "曇り・夜",
  "霧・朝方",
  "雨・昼間",
  "雨・夜",
  "嵐・夜",
  "雪・夜",
  "その他",
];

const MOOD_OPTIONS = [
  "静寂と不安",
  "差し迫る恐怖",
  "謎めいた緊張感",
  "廃墟の孤独感",
  "古代の禁忌",
  "混乱と絶望",
  "奇妙な静けさ",
  "悪夢的な幻惑",
  "その他",
];

const fieldClass =
  "w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors";
const labelClass = "block text-xs font-medium text-coc-muted mb-1";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-coc-gold hover:underline"
    >
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      {copied ? "コピー済み" : "コピー"}
    </button>
  );
}

export default function KpNarrationPage() {
  const [location, setLocation] = useState("");
  const [weather, setWeather] = useState("");
  const [mood, setMood] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [narrations, setNarrations] = useState<Narration[] | null>(null);

  async function generate() {
    setError(null);
    setLoading(true);
    setNarrations(null);

    try {
      const res = await fetch("/api/ai/scene-narration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          weather,
          mood,
          playerCount: playerCount ? Number(playerCount) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "生成に失敗しました。");
        return;
      }
      setNarrations(data.narrations as Narration[]);
    } catch {
      setError("ネットワークエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen coc-bg px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-coc-gold tracking-widest mb-1">
            シーン雰囲気ナレーション生成
          </h1>
          <p className="text-sm text-coc-muted">
            シーンのキーワードを入力すると、即興ナレーション文章を3パターン生成します。
          </p>
        </div>

        <div className="rounded-xl border border-coc-border bg-coc-surface p-5 space-y-4">
          <div>
            <label className={labelClass}>場所・舞台 *</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例: 廃墟となった洋館の地下室、霧深い港町の路地裏"
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>天候・時間帯 *</label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className={fieldClass}
              >
                <option value="">-- 選択してください --</option>
                {WEATHER_OPTIONS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>感情トーン・雰囲気 *</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className={fieldClass}
              >
                <option value="">-- 選択してください --</option>
                {MOOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>プレイヤー人数（任意）</label>
            <input
              type="number"
              min={1}
              max={10}
              value={playerCount}
              onChange={(e) => setPlayerCount(e.target.value)}
              placeholder="例: 4"
              className={fieldClass}
            />
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={loading || !location || !weather || !mood}
            className="flex items-center gap-2 rounded-lg bg-coc-gold text-black font-semibold text-sm px-5 py-2.5 disabled:opacity-50 hover:brightness-110 transition-all"
          >
            <Sparkles size={14} />
            {loading ? "生成中…" : "ナレーションを生成"}
          </button>

          {error && (
            <div className="rounded-lg border border-red-700 bg-red-900/20 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {narrations && narrations.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-coc-muted tracking-wider uppercase">生成結果</h2>
            {narrations.map((n) => (
              <div
                key={n.label}
                className="rounded-xl border border-coc-border bg-coc-surface overflow-hidden"
              >
                <div className="px-4 py-2 border-b border-coc-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-coc-gold">{n.label}</span>
                  <CopyButton text={n.text} />
                </div>
                <p className="px-4 py-3 text-sm text-coc-text leading-relaxed whitespace-pre-wrap">
                  {n.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
