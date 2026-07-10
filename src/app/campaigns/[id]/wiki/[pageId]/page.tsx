"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured, CampaignWikiPage, WikiPageType } from "@/lib/supabase";

const PAGE_TYPE_LABELS: Record<WikiPageType, string> = {
  lore: "世界観",
  faction: "勢力・組織",
  glossary: "用語集",
  timeline: "年表",
  other: "その他",
};

type Props = { params: Promise<{ id: string; pageId: string }> };

export default function CampaignWikiPageEditor({ params }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [pageId, setPageId] = useState<string | null>(null);
  const [campaignTitle, setCampaignTitle] = useState<string>("");
  const [wikiPage, setWikiPage] = useState<CampaignWikiPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNew, setIsNew] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pageType, setPageType] = useState<WikiPageType>("lore");

  useEffect(() => {
    params.then(({ id, pageId: pid }) => {
      setCampaignId(id);
      setPageId(pid);
      if (pid === "new") {
        setIsNew(true);
        const typeParam = searchParams.get("type") as WikiPageType | null;
        if (typeParam && Object.keys(PAGE_TYPE_LABELS).includes(typeParam)) {
          setPageType(typeParam);
        }
      }
    });
  }, [params, searchParams]);

  const load = useCallback(async (cid: string, pid: string) => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("title")
      .eq("id", cid)
      .single();
    if (campaign) setCampaignTitle((campaign as { title: string }).title);

    if (pid === "new") {
      setEditing(true);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("campaign_wiki_pages")
      .select("*")
      .eq("id", pid)
      .single();
    if (data) {
      const p = data as CampaignWikiPage;
      setWikiPage(p);
      setTitle(p.title);
      setContent(p.content ?? "");
      setPageType(p.page_type);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (campaignId && pageId) load(campaignId, pageId);
  }, [campaignId, pageId, load]);

  async function handleSave() {
    if (!isSupabaseConfigured || !campaignId || !title.trim()) return;
    setSaving(true);
    if (isNew) {
      const { data, error } = await supabase
        .from("campaign_wiki_pages")
        .insert({
          campaign_id: campaignId,
          title: title.trim(),
          content: content.trim() || null,
          page_type: pageType,
          order_index: 0,
        })
        .select("*")
        .single();
      if (!error && data) {
        const created = data as CampaignWikiPage;
        setWikiPage(created);
        setIsNew(false);
        setEditing(false);
        router.replace(`/campaigns/${campaignId}/wiki/${created.id}`);
      }
    } else if (wikiPage) {
      const { data, error } = await supabase
        .from("campaign_wiki_pages")
        .update({
          title: title.trim(),
          content: content.trim() || null,
          page_type: pageType,
        })
        .eq("id", wikiPage.id)
        .select("*")
        .single();
      if (!error && data) {
        setWikiPage(data as CampaignWikiPage);
        setEditing(false);
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!isSupabaseConfigured || !wikiPage) return;
    setDeleting(true);
    await supabase.from("campaign_wiki_pages").delete().eq("id", wikiPage.id);
    router.push(`/campaigns/${campaignId}/wiki`);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-coc-muted font-crimson text-lg italic animate-pulse">
        読み込んでいます...
      </div>
    );
  }

  if (!isNew && !wikiPage) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center text-coc-muted">
        <p>ページが見つかりません。</p>
        <Link
          href={`/campaigns/${campaignId}/wiki`}
          className="text-coc-gold hover:underline mt-2 inline-block"
        >
          Wikiに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/campaigns/${campaignId}/wiki`}
        className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        {campaignTitle ? `${campaignTitle} Wiki` : "設定Wiki"}
      </Link>

      {editing || isNew ? (
        <div className="space-y-4">
          <h1 className="font-cinzel text-xl font-bold text-coc-text mb-4">
            {isNew ? "新規ページ作成" : "ページ編集"}
          </h1>
          <div>
            <label className="block text-xs text-coc-muted mb-1">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ページタイトル"
              className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-coc-muted mb-1">種別</label>
            <select
              value={pageType}
              onChange={(e) => setPageType(e.target.value as WikiPageType)}
              className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
            >
              {(Object.keys(PAGE_TYPE_LABELS) as WikiPageType[]).map((t) => (
                <option key={t} value={t}>{PAGE_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-coc-muted mb-1">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="設定内容を記述してください..."
              rows={16}
              className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none resize-y"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="flex items-center gap-2 rounded-lg bg-coc-gold px-4 py-2 text-sm font-medium text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Save size={15} />
              {saving ? "保存中..." : "保存"}
            </button>
            {!isNew && (
              <button
                onClick={() => {
                  setTitle(wikiPage!.title);
                  setContent(wikiPage!.content ?? "");
                  setPageType(wikiPage!.page_type);
                  setEditing(false);
                }}
                className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
              >
                キャンセル
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <span className="text-xs text-coc-muted mb-1 block">
                {PAGE_TYPE_LABELS[wikiPage!.page_type]}
              </span>
              <h1 className="font-cinzel text-2xl font-bold text-coc-text">{wikiPage!.title}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold-dim transition-colors"
              >
                編集
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 rounded text-coc-muted hover:text-red-400 transition-colors disabled:opacity-50"
                title="ページを削除"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          {wikiPage!.content ? (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-6 py-5">
              <p className="text-sm text-coc-text whitespace-pre-wrap leading-relaxed">
                {wikiPage!.content}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-coc-border px-6 py-10 text-center">
              <p className="text-sm text-coc-muted mb-2">まだ内容がありません</p>
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-coc-gold hover:underline"
              >
                内容を追加する
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
