"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Skull, Lightbulb, Globe, User, Sword, HelpCircle } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  CampaignEvent,
  CampaignEventType,
} from "@/lib/supabase";

const EVENT_TYPE_LABELS: Record<CampaignEventType, string> = {
  death: "死亡",
  revelation: "啓示",
  world_change: "世界の変化",
  npc_action: "NPCの行動",
  player_action: "PLの行動",
  other: "その他",
};

const EVENT_TYPE_BADGE_COLORS: Record<CampaignEventType, string> = {
  death: "bg-red-900/40 text-red-300 border-red-700",
  revelation: "bg-purple-900/40 text-purple-300 border-purple-700",
  world_change: "bg-blue-900/40 text-blue-300 border-blue-700",
  npc_action: "bg-orange-900/40 text-orange-300 border-orange-700",
  player_action: "bg-green-900/40 text-green-300 border-green-700",
  other: "bg-coc-raised text-coc-muted border-coc-border",
};

const EVENT_TYPE_BORDER_COLORS: Record<CampaignEventType, string> = {
  death: "border-l-red-500",
  revelation: "border-l-purple-500",
  world_change: "border-l-blue-500",
  npc_action: "border-l-orange-500",
  player_action: "border-l-green-500",
  other: "border-l-coc-border",
};

const EVENT_TYPE_DOT_COLORS: Record<CampaignEventType, string> = {
  death: "bg-red-500 border-red-500",
  revelation: "bg-purple-400 border-purple-400",
  world_change: "bg-blue-400 border-blue-400",
  npc_action: "bg-orange-400 border-orange-400",
  player_action: "bg-green-400 border-green-400",
  other: "bg-coc-muted border-coc-border",
};

function EventTypeIcon({ type, size = 14 }: { type: CampaignEventType; size?: number }) {
  const cls: Record<CampaignEventType, string> = {
    death: "text-red-400",
    revelation: "text-purple-400",
    world_change: "text-blue-400",
    npc_action: "text-orange-400",
    player_action: "text-green-400",
    other: "text-coc-muted",
  };
  const s = size;
  if (type === "death") return <Skull size={s} className={cls[type]} />;
  if (type === "revelation") return <Lightbulb size={s} className={cls[type]} />;
  if (type === "world_change") return <Globe size={s} className={cls[type]} />;
  if (type === "npc_action") return <User size={s} className={cls[type]} />;
  if (type === "player_action") return <Sword size={s} className={cls[type]} />;
  return <HelpCircle size={s} className={cls[type]} />;
}

type CampaignEventWithScenario = CampaignEvent & {
  scenarios: { title: string } | null;
};

type Props = { params: Promise<{ id: string }> };

export default function CampaignEventsPage({ params }: Props) {
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaignTitle, setCampaignTitle] = useState<string>("");
  const [events, setEvents] = useState<CampaignEventWithScenario[]>([]);
  const [scenarios, setScenarios] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<CampaignEventType>("other");
  const [newScenarioId, setNewScenarioId] = useState("");

  useEffect(() => {
    params.then(({ id }) => setCampaignId(id));
  }, [params]);

  const load = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const [{ data: campaign }, { data: evts }, { data: links }] = await Promise.all([
      supabase.from("campaigns").select("title").eq("id", id).single(),
      supabase
        .from("campaign_events")
        .select("*, scenarios(title)")
        .eq("campaign_id", id)
        .order("event_date", { ascending: true }),
      supabase
        .from("campaign_scenarios")
        .select("scenario_id, scenarios(id, title)")
        .eq("campaign_id", id)
        .order("order_index", { ascending: true }),
    ]);
    if (campaign) setCampaignTitle((campaign as { title: string }).title);
    if (evts) setEvents(evts as CampaignEventWithScenario[]);
    if (links) {
      const list = links
        .filter((l) => l.scenarios)
        .map((l) => (l.scenarios as unknown as { id: string; title: string }));
      setScenarios(list);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (campaignId) load(campaignId);
  }, [campaignId, load]);

  async function handleAdd() {
    if (!newTitle.trim() || !isSupabaseConfigured || !campaignId) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("campaign_events")
      .insert({
        campaign_id: campaignId,
        scenario_id: newScenarioId || null,
        event_date: newDate.trim() || null,
        event_title: newTitle.trim(),
        event_description: newDescription.trim() || null,
        event_type: newType,
      })
      .select("*, scenarios(title)")
      .single();
    if (!error && data) {
      const inserted = data as CampaignEventWithScenario;
      setEvents((prev) => {
        const next = [...prev, inserted];
        return next.sort((a, b) => {
          if (!a.event_date && !b.event_date) return 0;
          if (!a.event_date) return 1;
          if (!b.event_date) return -1;
          return a.event_date.localeCompare(b.event_date);
        });
      });
      setNewTitle("");
      setNewDate("");
      setNewDescription("");
      setNewType("other");
      setNewScenarioId("");
      setAdding(false);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("campaign_events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
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
          {campaignTitle || "キャンペーン詳細"}
        </Link>
        <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-1">キャンペーンイベント年代記</h1>
        <p className="text-sm text-coc-muted">キャンペーン全体を通じた重要出来事の時系列記録</p>
      </div>

      {/* 凡例バッジ */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(EVENT_TYPE_LABELS) as CampaignEventType[]).map((t) => (
          <span
            key={t}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${EVENT_TYPE_BADGE_COLORS[t]}`}
          >
            <EventTypeIcon type={t} size={11} />
            {EVENT_TYPE_LABELS[t]}
          </span>
        ))}
      </div>

      {/* タイムライン */}
      <div className="relative pl-6 mb-6">
        {events.length > 0 && (
          <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-coc-border" />
        )}
        <div className="space-y-4">
          {events.length === 0 && !adding && (
            <p className="text-center text-sm text-coc-muted py-8">
              まだ出来事が記録されていません
            </p>
          )}
          {events.map((event) => (
            <div key={event.id} className="relative">
              <div
                className={`absolute left-[-25px] top-3.5 h-3 w-3 rounded-full border-2 ${EVENT_TYPE_DOT_COLORS[event.event_type]}`}
              />
              <div
                className={`rounded-xl border border-coc-border border-l-4 bg-coc-surface overflow-hidden ${EVENT_TYPE_BORDER_COLORS[event.event_type]}`}
              >
                <div className="flex items-start justify-between px-4 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${EVENT_TYPE_BADGE_COLORS[event.event_type]}`}
                      >
                        <EventTypeIcon type={event.event_type} size={11} />
                        {EVENT_TYPE_LABELS[event.event_type]}
                      </span>
                      {event.event_date && (
                        <span className="text-xs text-coc-muted">{event.event_date}</span>
                      )}
                      {event.scenarios && (
                        <span className="text-xs text-coc-muted">
                          [{event.scenarios.title}]
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-coc-text">{event.event_title}</h3>
                    {event.event_description && (
                      <p className="mt-1 text-sm text-coc-muted whitespace-pre-wrap">
                        {event.event_description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="shrink-0 p-1 rounded hover:bg-coc-raised text-coc-muted hover:text-red-400 transition-colors"
                    aria-label="削除"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 追加フォーム */}
      <div>
        {adding ? (
          <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 space-y-3">
            <input
              type="text"
              placeholder="出来事タイトル（例: 老教授の死亡）"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="日付（例: 1920年3月15日）"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as CampaignEventType)}
                className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
              >
                {(Object.keys(EVENT_TYPE_LABELS) as CampaignEventType[]).map((t) => (
                  <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            {scenarios.length > 0 && (
              <select
                value={newScenarioId}
                onChange={(e) => setNewScenarioId(e.target.value)}
                className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
              >
                <option value="">シナリオ（任意）</option>
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            )}
            <textarea
              placeholder="詳細説明（任意）"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim() || saving}
                className="flex-1 rounded-lg bg-coc-gold py-2 text-sm font-medium text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {saving ? "保存中..." : "追加"}
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setNewTitle("");
                  setNewDate("");
                  setNewDescription("");
                  setNewType("other");
                  setNewScenarioId("");
                }}
                className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-coc-border py-3 text-sm text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
          >
            <Plus size={16} />
            出来事を追加
          </button>
        )}
      </div>
    </div>
  );
}
