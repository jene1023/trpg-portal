"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart2, BookOpen, Trash2, Clock, BookMarked, Brain, TrendingUp, Gem, CalendarDays, Download, Monitor, Scroll } from "lucide-react";
import { supabase, isSupabaseConfigured, Campaign, CampaignStatus, Scenario, ScenarioStatus } from "@/lib/supabase";

const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  planning: "準備中",
  ongoing: "進行中",
  completed: "完了",
};

const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  planning: "text-coc-muted border-coc-border",
  ongoing: "text-coc-gold border-coc-gold-dim",
  completed: "text-green-400 border-green-800",
};

const SCENARIO_STATUS_LABELS: Record<ScenarioStatus, string> = {
  planning: "準備中",
  ongoing: "進行中",
  completed: "完了",
};

const SCENARIO_STATUS_COLORS: Record<ScenarioStatus, string> = {
  planning: "text-coc-muted border-coc-border",
  ongoing: "text-coc-gold border-coc-gold-dim",
  completed: "text-green-400 border-green-800",
};

type ScenarioWithLinkId = Scenario & { linkId: string; order_index: number };

type Props = { params: Promise<{ id: string }> };

export default function CampaignDetailPage({ params }: Props) {
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioWithLinkId[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<CampaignStatus>("planning");
  const [savingStatus, setSavingStatus] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [wikiCount, setWikiCount] = useState<number>(0);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    params.then(({ id }) => setCampaignId(id));
  }, [params]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const load = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const [{ data: c }, { data: links }, { count: wc }] = await Promise.all([
      supabase.from("campaigns").select("*").eq("id", id).single(),
      supabase
        .from("campaign_scenarios")
        .select("id, scenario_id, order_index, scenarios(*)")
        .eq("campaign_id", id)
        .order("order_index", { ascending: true }),
      supabase
        .from("campaign_wiki_pages")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", id),
    ]);
    setWikiCount(wc ?? 0);
    if (c) {
      setCampaign(c as Campaign);
      setNewStatus(c.status as CampaignStatus);
    }
    if (links) {
      const list: ScenarioWithLinkId[] = links
        .filter((l) => l.scenarios)
        .map((l) => ({
          ...(l.scenarios as unknown as Scenario),
          linkId: l.id as string,
          order_index: l.order_index as number,
        }));
      setScenarios(list);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (campaignId) load(campaignId);
  }, [campaignId, load]);

  async function handleSaveStatus() {
    if (!isSupabaseConfigured || !campaignId) return;
    setSavingStatus(true);
    await supabase.from("campaigns").update({ status: newStatus }).eq("id", campaignId);
    setCampaign((prev) => prev ? { ...prev, status: newStatus } : prev);
    setEditingStatus(false);
    setSavingStatus(false);
  }

  async function handleRemove(linkId: string) {
    if (!isSupabaseConfigured) return;
    setRemovingId(linkId);
    await supabase.from("campaign_scenarios").delete().eq("id", linkId);
    setScenarios((prev) => prev.filter((s) => s.linkId !== linkId));
    setRemovingId(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-coc-muted font-crimson text-lg italic animate-pulse">
        読み込んでいます...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center text-coc-muted">
        キャンペーンが見つかりません。
      </div>
    );
  }

  const completedCount = scenarios.filter((s) => s.status === "completed").length;
  const total = scenarios.length;

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/campaigns"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          キャンペーン一覧
        </Link>

        <div className="flex items-start gap-3 mb-2 flex-wrap">
          <BookOpen size={22} className="text-coc-gold mt-0.5 shrink-0" />
          <h1 className="font-cinzel text-2xl font-bold text-coc-text flex-1">
            {campaign.title}
          </h1>
          {editingStatus ? (
            <div className="flex items-center gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as CampaignStatus)}
                className="rounded-lg border border-coc-border bg-coc-raised px-2 py-1 text-xs text-coc-text focus:outline-none focus:border-coc-gold transition-colors"
              >
                <option value="planning">準備中</option>
                <option value="ongoing">進行中</option>
                <option value="completed">完了</option>
              </select>
              <button
                onClick={handleSaveStatus}
                disabled={savingStatus}
                className="rounded px-2 py-1 text-xs text-coc-gold border border-coc-gold-dim hover:bg-coc-gold/10 transition-colors disabled:opacity-50"
              >
                保存
              </button>
              <button
                onClick={() => setEditingStatus(false)}
                className="rounded px-2 py-1 text-xs text-coc-muted border border-coc-border hover:text-coc-text transition-colors"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingStatus(true)}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${CAMPAIGN_STATUS_COLORS[campaign.status as CampaignStatus]}`}
            >
              {CAMPAIGN_STATUS_LABELS[campaign.status as CampaignStatus]}
            </button>
          )}
        </div>

        {campaign.synopsis && (
          <p className="text-sm text-coc-muted whitespace-pre-wrap mt-3 pl-7">
            {campaign.synopsis}
          </p>
        )}
      </div>

      {/* 進捗サマリー */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-coc-text">{total}</p>
          <p className="text-xs text-coc-muted mt-1">シナリオ数</p>
        </div>
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-green-400">{completedCount}</p>
          <p className="text-xs text-coc-muted mt-1">完了</p>
        </div>
        <div className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 text-center">
          <p className="text-2xl font-bold text-coc-gold">
            {total > 0 ? Math.round((completedCount / total) * 100) : 0}%
          </p>
          <p className="text-xs text-coc-muted mt-1">達成率</p>
        </div>
      </div>

      {/* プログレスバー */}
      {total > 0 && (
        <div className="mb-6">
          <div className="w-full h-2 bg-coc-raised rounded-full overflow-hidden">
            <div
              className="h-full bg-coc-gold rounded-full transition-all"
              style={{ width: `${(completedCount / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* リンク */}
      <div className="mb-6 flex gap-3 flex-wrap">
        <Link
          href={`/campaigns/${campaignId}/board`}
          className="flex items-center gap-2 rounded-lg border border-coc-gold bg-coc-surface px-4 py-2 text-sm text-coc-gold hover:bg-coc-gold/10 transition-colors"
        >
          <Monitor size={15} />
          共有ボード
        </Link>
        <Link
          href={`/campaigns/${campaignId}/stats`}
          className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-surface px-4 py-2 text-sm text-coc-muted hover:text-coc-gold hover:border-coc-gold-dim transition-colors"
        >
          <BarChart2 size={15} />
          統計を見る
        </Link>
        <Link
          href={`/campaigns/${campaignId}/timeline`}
          className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-surface px-4 py-2 text-sm text-coc-muted hover:text-coc-gold hover:border-coc-gold-dim transition-colors"
        >
          <Clock size={15} />
          キャンペーン年表
        </Link>
        <Link
          href={`/campaigns/${campaignId}/wiki`}
          className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-surface px-4 py-2 text-sm text-coc-muted hover:text-coc-gold hover:border-coc-gold-dim transition-colors"
        >
          <BookMarked size={15} />
          設定Wiki
          {wikiCount > 0 && (
            <span className="rounded-full bg-coc-raised px-1.5 py-0.5 text-xs leading-none">
              {wikiCount}
            </span>
          )}
        </Link>
        <Link
          href={`/campaigns/${campaignId}/san-graph`}
          className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-surface px-4 py-2 text-sm text-coc-muted hover:text-coc-gold hover:border-coc-gold-dim transition-colors"
        >
          <Brain size={15} />
          SAN推移グラフ
        </Link>
        <Link
          href={`/campaigns/${campaignId}/feedback-stats`}
          className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-surface px-4 py-2 text-sm text-coc-muted hover:text-coc-gold hover:border-coc-gold-dim transition-colors"
        >
          <TrendingUp size={15} />
          フィードバック統計
        </Link>
        <Link
          href={`/campaigns/${campaignId}/artifacts`}
          className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-surface px-4 py-2 text-sm text-coc-muted hover:text-coc-gold hover:border-coc-gold-dim transition-colors"
        >
          <Gem size={15} />
          アーティファクト
        </Link>
        <Link
          href={`/campaigns/${campaignId}/events`}
          className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-surface px-4 py-2 text-sm text-coc-muted hover:text-coc-gold hover:border-coc-gold-dim transition-colors"
        >
          <Scroll size={15} />
          年代記
        </Link>
        <a
          href={`/api/calendar/campaign/${campaignId}`}
          download="campaign-sessions.ics"
          className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-surface px-4 py-2 text-sm text-coc-muted hover:text-coc-gold hover:border-coc-gold-dim transition-colors"
        >
          <Download size={15} />
          カレンダー(.ics)
        </a>
        {origin && (
          <a
            href={`${origin.replace(/^https?/, "webcal")}/api/calendar/campaign/${campaignId}`}
            className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-surface px-4 py-2 text-sm text-coc-muted hover:text-coc-gold hover:border-coc-gold-dim transition-colors"
          >
            <CalendarDays size={15} />
            カレンダー購読
          </a>
        )}
      </div>

      {/* シナリオ一覧 */}
      <div className="mb-4">
        <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
          収録シナリオ
        </p>
        {scenarios.length === 0 ? (
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center text-coc-muted text-sm">
            シナリオがまだ登録されていません。
            <br />
            各シナリオの詳細ページから「キャンペーンに追加」できます。
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {scenarios.map((scenario) => (
              <div
                key={scenario.linkId}
                className="flex items-center justify-between gap-3 rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/scenarios/${scenario.id}`}
                      className="font-medium text-coc-text hover:text-coc-gold transition-colors truncate"
                    >
                      {scenario.title}
                    </Link>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 ${SCENARIO_STATUS_COLORS[scenario.status as ScenarioStatus]}`}
                    >
                      {SCENARIO_STATUS_LABELS[scenario.status as ScenarioStatus]}
                    </span>
                  </div>
                  {scenario.synopsis && (
                    <p className="text-xs text-coc-muted mt-1 line-clamp-1">{scenario.synopsis}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {scenario.played_at && (
                      <span className="flex items-center gap-1 text-xs text-coc-muted">
                        <Clock size={11} />
                        {new Date(scenario.played_at).toLocaleDateString("ja-JP")}
                      </span>
                    )}
                    {scenario.next_session_at && scenario.status !== "completed" && (
                      <span className="flex items-center gap-1 text-xs text-coc-gold">
                        <CalendarDays size={11} />
                        次回: {new Date(scenario.next_session_at).toLocaleDateString("ja-JP")}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(scenario.linkId)}
                  disabled={removingId === scenario.linkId}
                  className="shrink-0 text-coc-muted hover:text-red-400 transition-colors disabled:opacity-50"
                  title="キャンペーンから削除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
