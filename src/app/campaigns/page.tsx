"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { supabase, isSupabaseConfigured, Campaign, CampaignStatus } from "@/lib/supabase";

const STATUS_LABELS: Record<CampaignStatus, string> = {
  planning: "準備中",
  ongoing: "進行中",
  completed: "完了",
};

const STATUS_COLORS: Record<CampaignStatus, string> = {
  planning: "text-coc-muted border-coc-border",
  ongoing: "text-coc-gold border-coc-gold-dim",
  completed: "text-green-400 border-green-800",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [scenarioCounts, setScenarioCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [status, setStatus] = useState<CampaignStatus>("planning");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const [{ data: cs }, { data: links }] = await Promise.all([
      supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("campaign_scenarios").select("campaign_id"),
    ]);
    if (cs) setCampaigns(cs as Campaign[]);
    if (links) {
      const counts: Record<string, number> = {};
      for (const row of links) {
        counts[row.campaign_id] = (counts[row.campaign_id] ?? 0) + 1;
      }
      setScenarioCounts(counts);
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || !title.trim()) return;
    setSaving(true);
    const { data } = await supabase
      .from("campaigns")
      .insert({ title: title.trim(), synopsis: synopsis.trim() || null, status })
      .select()
      .single();
    if (data) {
      setCampaigns((prev) => [data as Campaign, ...prev]);
      setScenarioCounts((prev) => ({ ...prev, [data.id]: 0 }));
      setTitle("");
      setSynopsis("");
      setStatus("planning");
      setShowForm(false);
    }
    setSaving(false);
  }

  return (
    <div className="coc-page-enter mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">キャンペーン</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-raised px-3 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors"
        >
          <Plus size={16} />
          キャンペーンを追加
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-5 py-4 flex flex-col gap-3"
        >
          <h2 className="font-cinzel text-sm font-medium text-coc-gold">新規キャンペーン</h2>
          <div>
            <label className="block text-xs text-coc-muted mb-1">タイトル *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold transition-colors"
              placeholder="キャンペーン名を入力"
            />
          </div>
          <div>
            <label className="block text-xs text-coc-muted mb-1">概要</label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold transition-colors resize-none"
              placeholder="キャンペーンの概要（任意）"
            />
          </div>
          <div>
            <label className="block text-xs text-coc-muted mb-1">進行状態</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CampaignStatus)}
              className="rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold transition-colors"
            >
              <option value="planning">準備中</option>
              <option value="ongoing">進行中</option>
              <option value="completed">完了</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50"
            >
              {saving ? "作成中…" : "作成"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div className="flex justify-center items-center py-24 text-coc-muted font-crimson text-lg italic animate-pulse">
          読み込んでいます...
        </div>
      )}

      {!loading && campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <span className="text-5xl text-coc-faint select-none">✦</span>
          <p className="text-coc-muted font-crimson text-lg italic text-center">
            キャンペーンが登録されていません。
          </p>
        </div>
      )}

      {!loading && campaigns.length > 0 && (
        <div className="flex flex-col gap-4">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="block rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-coc-gold shrink-0" />
                  <h2 className="font-cinzel font-semibold text-coc-text text-lg leading-tight">
                    {campaign.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {(scenarioCounts[campaign.id] ?? 0) > 0 && (
                    <span className="text-xs text-coc-muted border border-coc-border rounded-full px-2 py-0.5">
                      {scenarioCounts[campaign.id]}シナリオ
                    </span>
                  )}
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[campaign.status as CampaignStatus]}`}
                  >
                    {STATUS_LABELS[campaign.status as CampaignStatus]}
                  </span>
                </div>
              </div>
              {campaign.synopsis && (
                <p className="text-sm text-coc-muted line-clamp-2">{campaign.synopsis}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
