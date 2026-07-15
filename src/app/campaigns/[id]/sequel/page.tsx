"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight, ChevronLeft, Save, Sparkles, CheckSquare, Square, ToggleLeft, ToggleRight } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type CharacterStatus = "alive" | "dead" | "insane" | "retired";

type CharacterRow = {
  id: string;
  name: string;
  status: CharacterStatus;
};

type PlotThreadRow = {
  id: string;
  title: string;
  status: string;
};

type Props = { params: Promise<{ id: string }> };

const STEP_TITLES = [
  "生存キャラクター選択",
  "世界変化メモ",
  "未解決プロット引き継ぎ",
  "設計書を生成・保存",
];

const STATUS_LABELS: Record<CharacterStatus, string> = {
  alive: "生存",
  dead: "死亡",
  insane: "発狂",
  retired: "引退",
};

const STATUS_COLORS: Record<CharacterStatus, string> = {
  alive: "text-green-400",
  dead: "text-red-400",
  insane: "text-purple-400",
  retired: "text-coc-muted",
};

export default function CampaignSequelPage({ params }: Props) {
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  const [selectedCharIds, setSelectedCharIds] = useState<Set<string>>(new Set());
  const [plotThreads, setPlotThreads] = useState<PlotThreadRow[]>([]);
  const [carriedThreadIds, setCarriedThreadIds] = useState<Set<string>>(new Set());

  const [worldChanges, setWorldChanges] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    params.then(({ id }) => setCampaignId(id));
  }, [params]);

  const load = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) { setLoading(false); return; }

    const { data: links } = await supabase
      .from("campaign_scenarios")
      .select("scenario_id")
      .eq("campaign_id", id);

    const scenarioIds = (links ?? []).map((l) => l.scenario_id as string);

    const [charRows, threadRows] = await Promise.all([
      scenarioIds.length > 0
        ? supabase
            .from("scenario_participants")
            .select("character_id, characters(id, name, status)")
            .in("scenario_id", scenarioIds)
        : Promise.resolve({ data: [] }),
      scenarioIds.length > 0
        ? supabase
            .from("plot_threads")
            .select("id, title, status")
            .in("scenario_id", scenarioIds)
        : Promise.resolve({ data: [] }),
    ]);

    const seenIds = new Set<string>();
    const chars: CharacterRow[] = [];
    for (const row of (charRows.data ?? [])) {
      const c = (row as { character_id: string; characters: CharacterRow | null }).characters;
      if (c && !seenIds.has(c.id)) {
        seenIds.add(c.id);
        chars.push(c);
      }
    }
    chars.sort((a, b) => {
      const order: Record<CharacterStatus, number> = { alive: 0, insane: 1, retired: 2, dead: 3 };
      return order[a.status] - order[b.status];
    });
    setCharacters(chars);

    const aliveIds = new Set(chars.filter((c) => c.status === "alive").map((c) => c.id));
    setSelectedCharIds(aliveIds);

    const threads: PlotThreadRow[] = (threadRows.data ?? []) as PlotThreadRow[];
    setPlotThreads(threads);
    const pendingIds = new Set(threads.filter((t) => t.status === "pending").map((t) => t.id));
    setCarriedThreadIds(pendingIds);

    setLoading(false);
  }, []);

  useEffect(() => {
    if (campaignId) load(campaignId);
  }, [campaignId, load]);

  function toggleChar(id: string) {
    setSelectedCharIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleThread(id: string) {
    setCarriedThreadIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    setErrorMsg("");
    try {
      const survivingCharacters = characters
        .filter((c) => selectedCharIds.has(c.id))
        .map((c) => c.name);
      const carriedOverThreads = plotThreads
        .filter((t) => carriedThreadIds.has(t.id))
        .map((t) => t.title)
        .join("\n");

      const res = await fetch("/api/ai/campaign-sequel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ survivingCharacters, worldChanges, carriedOverThreads }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "生成に失敗しました");
      }
      const { suggestion } = await res.json() as { suggestion: string };
      setAiSuggestion(suggestion);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!isSupabaseConfigured || !campaignId) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const carriedOverThreads = plotThreads
        .filter((t) => carriedThreadIds.has(t.id))
        .map((t) => t.title)
        .join("\n");

      const { error } = await supabase.from("campaign_sequel_designs").insert({
        campaign_id: campaignId,
        surviving_character_ids: [...selectedCharIds],
        world_changes: worldChanges,
        carried_over_threads: carriedOverThreads,
        ai_suggestion: aiSuggestion || null,
      });
      if (error) throw error;
      setSaved(true);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-coc-muted font-crimson text-lg italic animate-pulse">
        読み込んでいます...
      </div>
    );
  }

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/campaigns/${campaignId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          キャンペーン詳細
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={22} className="text-coc-gold shrink-0" />
          <h1 className="font-cinzel text-2xl font-bold text-coc-text">
            シーズン2設計ウィザード
          </h1>
        </div>
        <p className="text-sm text-coc-muted pl-8">
          前キャンペーンの引き継ぎ情報を整理して、次の冒険の設計書を作成します。
        </p>
      </div>

      {/* ステップインジケーター */}
      <div className="mb-8 flex items-center gap-0">
        {STEP_TITLES.map((title, i) => (
          <div key={i} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 transition-colors ${
                  i < step
                    ? "bg-coc-gold border-coc-gold text-coc-bg"
                    : i === step
                    ? "border-coc-gold text-coc-gold bg-transparent"
                    : "border-coc-border text-coc-muted bg-transparent"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs mt-1 text-center leading-tight px-1 hidden sm:block ${i === step ? "text-coc-gold" : "text-coc-muted"}`}>
                {title}
              </span>
            </div>
            {i < STEP_TITLES.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-5 ${i < step ? "bg-coc-gold" : "bg-coc-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: 生存キャラクター選択 */}
      {step === 0 && (
        <div className="rounded-xl border border-coc-border bg-coc-surface p-6">
          <h2 className="font-cinzel text-lg font-semibold text-coc-text mb-1">
            生存キャラクター選択
          </h2>
          <p className="text-xs text-coc-muted mb-5">
            シーズン2に引き継ぐキャラクターにチェックを入れてください。
          </p>

          {characters.length === 0 ? (
            <p className="text-sm text-coc-muted text-center py-6">
              このキャンペーンに参加キャラクターがありません。
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {characters.map((c) => {
                const selected = selectedCharIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleChar(c.id)}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                      selected
                        ? "border-coc-gold bg-coc-gold/10"
                        : "border-coc-border bg-coc-raised hover:border-coc-gold-dim"
                    }`}
                  >
                    {selected ? (
                      <CheckSquare size={18} className="text-coc-gold shrink-0" />
                    ) : (
                      <Square size={18} className="text-coc-muted shrink-0" />
                    )}
                    <span className="flex-1 font-medium text-coc-text">{c.name}</span>
                    <span className={`text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 2: 世界変化メモ */}
      {step === 1 && (
        <div className="rounded-xl border border-coc-border bg-coc-surface p-6">
          <h2 className="font-cinzel text-lg font-semibold text-coc-text mb-1">
            世界変化メモ
          </h2>
          <p className="text-xs text-coc-muted mb-5">
            プレイヤーの行動によって前キャンペーンでどう世界が変わったか記述してください。
          </p>
          <textarea
            value={worldChanges}
            onChange={(e) => setWorldChanges(e.target.value)}
            rows={10}
            placeholder="例：PLたちはダゴンの封印を壊した。イニスマスは海に沈んだが、深きものどもの一部は生き延びており、別の沿岸都市に移動を始めている……"
            className="w-full rounded-lg border border-coc-border bg-coc-bg px-4 py-3 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold transition-colors resize-none"
          />
        </div>
      )}

      {/* Step 3: 未解決プロット引き継ぎ */}
      {step === 2 && (
        <div className="rounded-xl border border-coc-border bg-coc-surface p-6">
          <h2 className="font-cinzel text-lg font-semibold text-coc-text mb-1">
            未解決プロット引き継ぎ
          </h2>
          <p className="text-xs text-coc-muted mb-5">
            次作に持ち越すプロットスレッドをトグルで選んでください。
          </p>

          {plotThreads.length === 0 ? (
            <p className="text-sm text-coc-muted text-center py-6">
              登録されているプロットスレッドがありません。
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {plotThreads.map((t) => {
                const carried = carriedThreadIds.has(t.id);
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                      carried
                        ? "border-coc-gold bg-coc-gold/10"
                        : "border-coc-border bg-coc-raised"
                    }`}
                  >
                    <span className="flex-1 text-sm text-coc-text">{t.title}</span>
                    <span className={`text-xs mr-3 ${carried ? "text-coc-gold" : "text-coc-muted"}`}>
                      {carried ? "次作に持ち越し" : "消化済み"}
                    </span>
                    <button
                      onClick={() => toggleThread(t.id)}
                      className="shrink-0 transition-colors"
                    >
                      {carried ? (
                        <ToggleRight size={24} className="text-coc-gold" />
                      ) : (
                        <ToggleLeft size={24} className="text-coc-muted" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 4: 生成・保存 */}
      {step === 3 && (
        <div className="rounded-xl border border-coc-border bg-coc-surface p-6 flex flex-col gap-6">
          <div>
            <h2 className="font-cinzel text-lg font-semibold text-coc-text mb-1">
              シーズン2設計書を生成・保存
            </h2>
            <p className="text-xs text-coc-muted">
              引き継ぎ情報をもとにAIがシーズン2のオープニングシーン案と導入フックを提案します。
            </p>
          </div>

          {/* サマリー */}
          <div className="rounded-lg border border-coc-border bg-coc-raised px-4 py-3 flex flex-col gap-2">
            <p className="text-xs font-semibold text-coc-muted uppercase tracking-widest">引き継ぎ概要</p>
            <p className="text-sm text-coc-text">
              <span className="text-coc-muted">生存キャラクター:</span>{" "}
              {characters.filter((c) => selectedCharIds.has(c.id)).map((c) => c.name).join("、") || "（なし）"}
            </p>
            <p className="text-sm text-coc-text">
              <span className="text-coc-muted">持ち越しスレッド:</span>{" "}
              {plotThreads.filter((t) => carriedThreadIds.has(t.id)).map((t) => t.title).join("、") || "（なし）"}
            </p>
            {worldChanges && (
              <p className="text-sm text-coc-text line-clamp-2">
                <span className="text-coc-muted">世界変化:</span>{" "}
                {worldChanges}
              </p>
            )}
          </div>

          {/* AI生成ボタン */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center justify-center gap-2 rounded-lg border border-coc-gold bg-coc-gold/10 px-5 py-3 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50"
          >
            <Sparkles size={16} />
            {generating ? "AIが設計書を生成中..." : "AIでシーズン2設計書を生成"}
          </button>

          {/* AI提案テキストエリア */}
          <div>
            <label className="block text-xs font-semibold text-coc-muted uppercase tracking-widest mb-2">
              AI提案（編集可能）
            </label>
            <textarea
              value={aiSuggestion}
              onChange={(e) => setAiSuggestion(e.target.value)}
              rows={12}
              placeholder="「AIでシーズン2設計書を生成」ボタンを押すとここに提案が表示されます。手動でメモを書くこともできます。"
              className="w-full rounded-lg border border-coc-border bg-coc-bg px-4 py-3 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold transition-colors resize-none"
            />
          </div>

          {errorMsg && (
            <p className="text-sm text-red-400">{errorMsg}</p>
          )}

          {saved ? (
            <div className="rounded-lg border border-green-700 bg-green-900/20 px-4 py-3 text-sm text-green-300 text-center">
              設計書を保存しました。
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-lg border border-coc-border bg-coc-raised px-5 py-3 text-sm font-semibold text-coc-text hover:border-coc-gold hover:text-coc-gold transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "保存中..." : "設計書を保存"}
            </button>
          )}
        </div>
      )}

      {/* ナビゲーションボタン */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="flex items-center gap-1.5 rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
          前へ
        </button>
        {step < STEP_TITLES.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-5 py-2 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 transition-colors"
          >
            次へ
            <ChevronRight size={16} />
          </button>
        ) : (
          <Link
            href={`/campaigns/${campaignId}`}
            className="flex items-center gap-1.5 rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            完了してキャンペーンへ
          </Link>
        )}
      </div>
    </div>
  );
}
