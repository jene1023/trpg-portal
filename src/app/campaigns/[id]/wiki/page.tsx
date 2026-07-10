export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, BookMarked, Plus } from "lucide-react";
import { supabase, isSupabaseConfigured, CampaignWikiPage, WikiPageType } from "@/lib/supabase";

const PAGE_TYPE_LABELS: Record<WikiPageType, string> = {
  lore: "世界観",
  faction: "勢力・組織",
  glossary: "用語集",
  timeline: "年表",
  other: "その他",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function CampaignWikiListPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab } = await searchParams;

  const activeTab = (tab && Object.keys(PAGE_TYPE_LABELS).includes(tab)
    ? tab
    : "lore") as WikiPageType;

  let campaignTitle = "";
  let pages: CampaignWikiPage[] = [];

  if (isSupabaseConfigured) {
    const [{ data: campaign }, { data: wikiPages }] = await Promise.all([
      supabase.from("campaigns").select("title").eq("id", id).single(),
      supabase
        .from("campaign_wiki_pages")
        .select("*")
        .eq("campaign_id", id)
        .order("order_index", { ascending: true }),
    ]);
    if (campaign) campaignTitle = (campaign as { title: string }).title;
    if (wikiPages) pages = wikiPages as CampaignWikiPage[];
  }

  const filteredPages = pages.filter((p) => p.page_type === activeTab);

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/campaigns/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          {campaignTitle || "キャンペーン詳細"}
        </Link>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <BookMarked size={22} className="text-coc-gold" />
            <h1 className="font-cinzel text-2xl font-bold text-coc-text">設定Wiki</h1>
          </div>
          <Link
            href={`/campaigns/${id}/wiki/new`}
            className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-gold/10 px-3 py-1.5 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors"
          >
            <Plus size={15} />
            新規ページ
          </Link>
        </div>
        <p className="text-sm text-coc-muted pl-7">
          世界観・用語・勢力など設定をWiki形式で管理
        </p>
      </div>

      {/* Type tabs */}
      <div className="mb-5 flex gap-0 border-b border-coc-border overflow-x-auto">
        {(Object.keys(PAGE_TYPE_LABELS) as WikiPageType[]).map((t) => {
          const count = pages.filter((p) => p.page_type === t).length;
          return (
            <Link
              key={t}
              href={`/campaigns/${id}/wiki?tab=${t}`}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                activeTab === t
                  ? "border-coc-gold text-coc-gold"
                  : "border-transparent text-coc-muted hover:text-coc-text"
              }`}
            >
              {PAGE_TYPE_LABELS[t]}
              {count > 0 && (
                <span className="rounded-full bg-coc-raised px-1.5 py-0.5 text-xs leading-none">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Pages list */}
      <div className="space-y-2">
        {filteredPages.length === 0 ? (
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center">
            <p className="text-sm text-coc-muted mb-3">
              「{PAGE_TYPE_LABELS[activeTab]}」のページはまだありません
            </p>
            <Link
              href={`/campaigns/${id}/wiki/new?type=${activeTab}`}
              className="inline-flex items-center gap-1.5 text-sm text-coc-gold hover:underline"
            >
              <Plus size={14} />
              ページを作成する
            </Link>
          </div>
        ) : (
          filteredPages.map((page) => (
            <Link
              key={page.id}
              href={`/campaigns/${id}/wiki/${page.id}`}
              className="flex items-start rounded-xl border border-coc-border bg-coc-surface px-5 py-4 hover:border-coc-gold-dim transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-coc-text group-hover:text-coc-gold transition-colors">
                  {page.title}
                </h3>
                {page.content && (
                  <p className="mt-1 text-xs text-coc-muted line-clamp-2">
                    {page.content}
                  </p>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
