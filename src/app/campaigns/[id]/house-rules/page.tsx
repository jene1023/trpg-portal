"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Pencil, Check, X, ScrollText } from "lucide-react";
import { supabase, isSupabaseConfigured, CampaignHouseRule } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

export default function CampaignHouseRulesPage({ params }: Props) {
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaignTitle, setCampaignTitle] = useState<string>("");
  const [rules, setRules] = useState<CampaignHouseRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    params.then(({ id }) => setCampaignId(id));
  }, [params]);

  const load = useCallback(async (id: string) => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const [{ data: campaign }, { data: ruleRows }] = await Promise.all([
      supabase.from("campaigns").select("title").eq("id", id).single(),
      supabase
        .from("campaign_house_rules")
        .select("*")
        .eq("campaign_id", id)
        .order("order_index", { ascending: true }),
    ]);
    if (campaign) setCampaignTitle((campaign as { title: string }).title);
    if (ruleRows) setRules(ruleRows as CampaignHouseRule[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (campaignId) load(campaignId);
  }, [campaignId, load]);

  async function handleAdd() {
    if (!newTitle.trim() || !isSupabaseConfigured || !campaignId) return;
    setSaving(true);
    const nextIndex = rules.length > 0 ? Math.max(...rules.map((r) => r.order_index)) + 1 : 0;
    const { data, error } = await supabase
      .from("campaign_house_rules")
      .insert({
        campaign_id: campaignId,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        order_index: nextIndex,
      })
      .select("*")
      .single();
    if (!error && data) {
      setRules((prev) => [...prev, data as CampaignHouseRule]);
      setNewTitle("");
      setNewDescription("");
      setAdding(false);
    }
    setSaving(false);
  }

  function startEdit(rule: CampaignHouseRule) {
    setEditingId(rule.id);
    setEditTitle(rule.title);
    setEditDescription(rule.description ?? "");
  }

  async function handleSaveEdit(id: string) {
    if (!editTitle.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("campaign_house_rules")
      .update({ title: editTitle.trim(), description: editDescription.trim() || null })
      .eq("id", id)
      .select("*")
      .single();
    if (!error && data) {
      setRules((prev) => prev.map((r) => (r.id === id ? (data as CampaignHouseRule) : r)));
    }
    setEditingId(null);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("campaign_house_rules").delete().eq("id", id);
    setRules((prev) => prev.filter((r) => r.id !== id));
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
        <div className="flex items-center gap-2 mb-1">
          <ScrollText size={22} className="text-coc-gold" />
          <h1 className="font-cinzel text-2xl font-bold text-coc-text">ハウスルール</h1>
        </div>
        <p className="text-sm text-coc-muted pl-7">
          このキャンペーンで採用するハウスルール一覧
        </p>
      </div>

      {/* ルール一覧 */}
      <div className="space-y-3 mb-6">
        {rules.length === 0 && !adding && (
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center text-sm text-coc-muted">
            ハウスルールがまだ登録されていません
          </div>
        )}
        {rules.map((rule, index) => (
          <div
            key={rule.id}
            className="rounded-xl border border-coc-border bg-coc-surface overflow-hidden"
          >
            {editingId === rule.id ? (
              <div className="px-5 py-4 space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
                  autoFocus
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                  placeholder="説明（任意）"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(rule.id)}
                    disabled={!editTitle.trim() || saving}
                    className="flex items-center gap-1.5 rounded-lg bg-coc-gold px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    <Check size={13} />
                    保存
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text transition-colors"
                  >
                    <X size={13} />
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4 px-5 py-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coc-raised text-xs font-bold text-coc-gold border border-coc-gold-dim">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-coc-text">{rule.title}</p>
                  {rule.description && (
                    <p className="mt-1 text-sm text-coc-muted whitespace-pre-wrap">
                      {rule.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => startEdit(rule)}
                    className="p-1.5 rounded hover:bg-coc-raised text-coc-muted hover:text-coc-gold transition-colors"
                    aria-label="編集"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-1.5 rounded hover:bg-coc-raised text-coc-muted hover:text-red-400 transition-colors"
                    aria-label="削除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 追加フォーム */}
      {adding ? (
        <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 space-y-3">
          <input
            type="text"
            placeholder="ルールタイトル（例: 幸運の使い方）"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
            autoFocus
          />
          <textarea
            placeholder="説明（例: 幸運ポイントはロール前に宣言して使用。1シナリオ最大3回まで。）"
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
                setNewDescription("");
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
          ルールを追加
        </button>
      )}
    </div>
  );
}
