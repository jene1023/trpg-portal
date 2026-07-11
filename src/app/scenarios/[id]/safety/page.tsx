"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Radio } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  SafetySetting,
  SafetyCategory,
  SafetyLevel,
} from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

const CATEGORY_LABELS: Record<SafetyCategory, string> = {
  gore: "ゴア描写（過激な流血・暴力）",
  body_horror: "ボディホラー（身体的恐怖表現）",
  romance: "ロマンス・恋愛描写",
  psychological: "心理的暗示・精神攻撃",
  other: "その他",
};

const LEVEL_LABELS: Record<SafetyLevel, string> = {
  line: "ライン（禁止）",
  veil: "ヴェール（省略可）",
  ok: "OK（問題なし）",
};

const LEVEL_COLORS: Record<SafetyLevel, string> = {
  line: "border-red-600 bg-red-950/30 text-red-400",
  veil: "border-yellow-700 bg-yellow-950/20 text-yellow-400",
  ok: "border-green-800 bg-green-950/20 text-green-400",
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as SafetyCategory[];
const LEVELS = ["ok", "veil", "line"] as SafetyLevel[];

type Props = { params: Promise<{ id: string }> };

export default function ScenarioSafetyPage({ params }: Props) {
  const { id } = use(params);

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [voterName, setVoterName] = useState("");
  const [votes, setVotes] = useState<Partial<Record<SafetyCategory, SafetyLevel>>>({});
  const [allVotes, setAllVotes] = useState<SafetySetting[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [xCardEnabled, setXCardEnabled] = useState(true);
  const [lines, setLines] = useState("");
  const [veils, setVeils] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [xCardActive, setXCardActive] = useState(false);
  const [xCardConnected, setXCardConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.from("scenarios").select("title").eq("id", id).single()
      .then(({ data }) => { if (data) setScenarioTitle(data.title); });

    supabase.from("scenario_safety_settings").select("*").eq("scenario_id", id).single()
      .then(({ data }) => {
        if (data) {
          setXCardEnabled(data.x_card_enabled ?? true);
          setLines(data.lines ?? "");
          setVeils(data.veils ?? "");
        }
      });

    supabase.from("safety_settings").select("*").eq("scenario_id", id)
      .then(({ data }) => { if (data) setAllVotes(data as SafetySetting[]); });

    const ch = supabase
      .channel(`xcard-${id}`, { config: { broadcast: { self: true } } })
      .on("broadcast", { event: "xcard" }, () => setXCardActive(true))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .subscribe((status: any) => setXCardConnected(status === "SUBSCRIBED"));

    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  async function sendXCard() {
    if (!isSupabaseConfigured || !channelRef.current) return;
    await channelRef.current.send({ type: "broadcast", event: "xcard", payload: {} });
  }

  async function handleVoteSubmit() {
    if (!isSupabaseConfigured || !voterName.trim()) return;
    setSaving(true);

    const records = CATEGORIES
      .filter((cat) => votes[cat] !== undefined)
      .map((cat) => ({
        scenario_id: id,
        category: cat,
        level: votes[cat]!,
        user_id: voterName.trim(),
      }));

    if (records.length > 0) {
      await supabase
        .from("safety_settings")
        .upsert(records, { onConflict: "scenario_id,category,user_id" });
    }

    const { data } = await supabase.from("safety_settings").select("*").eq("scenario_id", id);
    if (data) setAllVotes(data as SafetySetting[]);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleSettingsSave() {
    if (!isSupabaseConfigured) return;
    setSettingsSaving(true);
    await supabase.from("scenario_safety_settings").upsert(
      {
        scenario_id: id,
        x_card_enabled: xCardEnabled,
        lines: lines || null,
        veils: veils || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "scenario_id" }
    );
    setSettingsSaving(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  }

  const voters = Array.from(new Set(allVotes.map((v) => v.user_id)));
  const voterCount = voters.length;
  const categoryResults = CATEGORIES.map((cat) => {
    const catVotes = allVotes.filter((v) => v.category === cat);
    const lineCount = catVotes.filter((v) => v.level === "line").length;
    const veilCount = catVotes.filter((v) => v.level === "veil").length;
    const okCount = catVotes.filter((v) => v.level === "ok").length;
    const allLine = voterCount > 0 && catVotes.length === voterCount && lineCount === voterCount;
    return { cat, lineCount, veilCount, okCount, allLine };
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* X-Card Modal */}
      {xCardActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-red-600 bg-red-950 px-8 py-10 text-center max-w-sm mx-4 shadow-2xl">
            <p className="text-5xl mb-4">⚠️</p>
            <h2 className="font-cinzel text-2xl font-bold text-red-300 mb-2">Xカード</h2>
            <p className="text-lg font-semibold text-red-200 mb-4">一時停止してください</p>
            <p className="text-sm text-red-300 mb-6">
              誰かが不快を感じています。内容を変更するか、この場面をスキップしてください。理由の確認は不要です。
            </p>
            <button
              onClick={() => setXCardActive(false)}
              className="rounded-lg border border-red-400 bg-red-900/50 px-6 py-2.5 text-sm font-medium text-red-200 hover:bg-red-800/50 transition-colors"
            >
              確認しました
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        {scenarioTitle && <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>}
        <div className="flex items-center gap-2">
          <ShieldAlert size={20} className="text-coc-gold" />
          <h1 className="font-cinzel text-xl font-bold text-coc-text">安全ツール</h1>
        </div>
        <p className="text-xs text-coc-muted mt-1">
          X-Card・ライン＆ヴェールでセッションの心理的安全を守ります
        </p>
      </div>

      {/* X-Card Broadcast */}
      {xCardEnabled && (
        <div className="mb-6 rounded-xl border border-red-800 bg-red-950/30 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-red-300">⚠ X-Card（緊急中断シグナル）</p>
            <span
              className={`flex items-center gap-1 text-xs ${
                xCardConnected ? "text-green-400" : "text-coc-muted"
              }`}
            >
              <Radio size={10} className={xCardConnected ? "animate-pulse" : ""} />
              {xCardConnected ? "接続中" : "接続中..."}
            </span>
          </div>
          <p className="text-xs text-red-400 mb-4">
            不快に感じた瞬間にこのボタンを押してください。全参加者の画面に警告が全画面表示されます。理由を説明する必要はありません。
          </p>
          <button
            onClick={sendXCard}
            className="w-full rounded-lg border-2 border-red-600 bg-red-900/40 py-3 text-base font-bold text-red-200 hover:bg-red-800/50 transition-colors"
          >
            X カード — 中断リクエスト
          </button>
        </div>
      )}

      {/* Anonymous Consent Voting */}
      <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <p className="font-medium text-coc-text mb-1">コンテンツ同意投票（匿名集計）</p>
        <p className="text-xs text-coc-muted mb-4">
          各カテゴリについて自分の希望を選んでください。全員の回答は匿名で集計されます。
        </p>

        <div className="mb-4">
          <label className="text-xs text-coc-muted">投票者ID（あなたの名前）</label>
          <input
            type="text"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            placeholder="例: 探索者A"
            className="mt-1 w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
          />
        </div>

        <div className="space-y-4 mb-5">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <p className="text-sm text-coc-text mb-2">{CATEGORY_LABELS[cat]}</p>
              <div className="flex gap-2 flex-wrap">
                {LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      setVotes((prev) => ({
                        ...prev,
                        [cat]: prev[cat] === level ? undefined : level,
                      }))
                    }
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      votes[cat] === level
                        ? LEVEL_COLORS[level]
                        : "border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-text"
                    }`}
                  >
                    {LEVEL_LABELS[level]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleVoteSubmit}
          disabled={saving || !voterName.trim() || Object.keys(votes).length === 0}
          className="rounded-lg border border-coc-gold bg-coc-gold/10 px-5 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 disabled:opacity-50 transition-colors"
        >
          {saving ? "送信中…" : saved ? "送信しました ✓" : "投票を送信"}
        </button>
      </div>

      {/* Aggregated Results */}
      {allVotes.length > 0 && (
        <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <p className="font-medium text-coc-text mb-1">集計結果</p>
          <p className="text-xs text-coc-muted mb-4">
            {voterCount}名が投票。全員が「ライン（禁止）」とした項目を赤でハイライトしています。
          </p>
          <div className="space-y-3">
            {categoryResults.map(({ cat, lineCount, veilCount, okCount, allLine }) => (
              <div
                key={cat}
                className={`rounded-lg border px-4 py-3 ${
                  allLine ? "border-red-700 bg-red-950/20" : "border-coc-border"
                }`}
              >
                <p className={`text-sm font-medium ${allLine ? "text-red-400" : "text-coc-text"}`}>
                  {CATEGORY_LABELS[cat]}
                  {allLine && <span className="ml-2 text-xs font-normal">⛔ 全員禁止</span>}
                </p>
                <div className="mt-1.5 flex gap-3 text-xs">
                  <span className="text-red-400">ライン: {lineCount}</span>
                  <span className="text-yellow-400">ヴェール: {veilCount}</span>
                  <span className="text-green-400">OK: {okCount}</span>
                  {lineCount + veilCount + okCount < voterCount && (
                    <span className="text-coc-muted">未回答: {voterCount - lineCount - veilCount - okCount}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KP Settings */}
      <div className="mb-4 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <p className="font-medium text-coc-text mb-4">KP設定</p>

        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-coc-text">X-Cardを有効にする</p>
            <p className="text-xs text-coc-muted mt-0.5">このページに中断ボタンを表示します</p>
          </div>
          <button
            onClick={() => setXCardEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
              xCardEnabled ? "bg-coc-gold" : "bg-coc-border"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                xCardEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <label className="block mb-4">
          <p className="text-sm text-coc-text mb-1">ライン（絶対NG）</p>
          <p className="text-xs text-coc-muted mb-2">絶対にシナリオに登場させない内容</p>
          <textarea
            value={lines}
            onChange={(e) => setLines(e.target.value)}
            rows={3}
            placeholder={"例:\n・過激な暴力描写\n・特定の恐怖症に関わる描写"}
            className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
          />
        </label>

        <label className="block mb-5">
          <p className="text-sm text-coc-text mb-1">ヴェール（フェードアウト可）</p>
          <p className="text-xs text-coc-muted mb-2">描写できるが詳細は省略する内容</p>
          <textarea
            value={veils}
            onChange={(e) => setVeils(e.target.value)}
            rows={3}
            placeholder={"例:\n・性的描写（示唆まではOK）\n・過度なグロ描写"}
            className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
          />
        </label>

        <button
          onClick={handleSettingsSave}
          disabled={settingsSaving}
          className="rounded-lg border border-coc-gold bg-coc-gold/10 px-5 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 disabled:opacity-50 transition-colors"
        >
          {settingsSaving ? "保存中…" : settingsSaved ? "保存しました ✓" : "設定を保存"}
        </button>
      </div>

      {/* About */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <p className="text-xs text-coc-muted leading-relaxed">
          <strong className="text-coc-text">安全ツールとは</strong>
          <br />
          TRPGセッションで参加者全員が安心して楽しめるよう、国際的に普及している仕組みです。
          <br /><br />
          <strong className="text-coc-text">X-Card</strong>: セッション中にいつでも使える「中断シグナル」。不快に感じた内容を止めるためのカードで、理由を説明する必要はありません。
          <br /><br />
          <strong className="text-coc-text">ライン</strong>: 絶対にシナリオに登場させないコンテンツ。
          <br />
          <strong className="text-coc-text">ヴェール</strong>: 描写できるが詳細は省略するコンテンツ（フェードアウト）。
        </p>
      </div>
    </div>
  );
}
