"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag as TagIcon } from "lucide-react";
import { supabase, isSupabaseConfigured, Tag } from "@/lib/supabase";

type TagWithCount = Tag & { count: number };

export default function TagsPage() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    async function load() {
      const [{ data: tagsData }, { data: entityTagsData }] = await Promise.all([
        supabase.from("tags").select("*").order("name"),
        supabase.from("entity_tags").select("tag_id"),
      ]);
      if (tagsData) {
        const counts: Record<string, number> = {};
        (entityTagsData ?? []).forEach((r: { tag_id: string }) => {
          counts[r.tag_id] = (counts[r.tag_id] ?? 0) + 1;
        });
        const withCount = (tagsData as Tag[]).map((t) => ({
          ...t,
          count: counts[t.id] ?? 0,
        }));
        // sort by usage count desc, then name asc
        withCount.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
        setTags(withCount);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text flex items-center gap-2">
          <TagIcon className="text-coc-gold" size={24} />
          タグブラウザ
        </h1>
        <p className="mt-1 text-sm text-coc-muted">
          タグをクリックするとキャラクター・シナリオ・NPC を横断表示します
        </p>
      </div>

      {loading ? (
        <p className="text-coc-muted text-sm">読み込み中…</p>
      ) : tags.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface p-8 text-center">
          <p className="text-coc-muted text-sm">タグがありません。キャラクター・シナリオ・NPC の詳細画面でタグを追加してください。</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.id}`}
              className="group flex items-center gap-1.5 rounded-full border border-coc-border bg-coc-surface px-4 py-2 text-sm text-coc-text transition-colors hover:border-coc-gold hover:text-coc-gold"
            >
              <TagIcon size={12} className="text-coc-muted group-hover:text-coc-gold transition-colors" />
              <span>{tag.name}</span>
              <span className="ml-1 rounded-full bg-coc-raised px-1.5 py-0.5 text-xs text-coc-muted">
                {tag.count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
