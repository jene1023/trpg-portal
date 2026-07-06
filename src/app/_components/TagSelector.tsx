"use client";

import { useEffect, useState, useRef } from "react";
import { supabase, isSupabaseConfigured, Tag, EntityTagEntityType } from "@/lib/supabase";
import { X, Tag as TagIcon } from "lucide-react";

type EntityTagRow = {
  tags: Tag | null;
};

type Props = {
  entityType: EntityTagEntityType;
  entityId: string;
};

export default function TagSelector({ entityType, entityId }: Props) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !entityId) return;
    async function load() {
      const [{ data: entityTagsData }, { data: allTagsData }] = await Promise.all([
        supabase
          .from("entity_tags")
          .select("tags(id, name, created_at)")
          .eq("entity_type", entityType)
          .eq("entity_id", entityId),
        supabase.from("tags").select("*").order("name"),
      ]);
      if (entityTagsData) {
        const fetched = (entityTagsData as unknown as EntityTagRow[])
          .map((r) => r.tags)
          .filter((t): t is Tag => t !== null);
        setTags(fetched);
      }
      if (allTagsData) setAllTags(allTagsData as Tag[]);
    }
    load();
  }, [entityType, entityId]);

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }
    const existingIds = new Set(tags.map((t) => t.id));
    setSuggestions(
      allTags
        .filter(
          (t) =>
            !existingIds.has(t.id) &&
            t.name.toLowerCase().includes(input.toLowerCase())
        )
        .slice(0, 5)
    );
  }, [input, allTags, tags]);

  async function addTag(tagName: string) {
    const name = tagName.trim();
    if (!name || !isSupabaseConfigured) return;
    if (tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      setInput("");
      setSuggestions([]);
      return;
    }
    let tag: Tag | undefined = allTags.find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );
    if (!tag) {
      const { data } = await supabase
        .from("tags")
        .insert({ name })
        .select()
        .single();
      if (data) {
        tag = data as Tag;
        setAllTags((prev) =>
          [...prev, tag!].sort((a, b) => a.name.localeCompare(b.name))
        );
      }
    }
    if (!tag) return;
    await supabase.from("entity_tags").insert({
      entity_type: entityType,
      entity_id: entityId,
      tag_id: tag.id,
    });
    setTags((prev) => [...prev, tag!]);
    setInput("");
    setSuggestions([]);
  }

  async function removeTag(tagId: string) {
    if (!isSupabaseConfigured) return;
    await supabase
      .from("entity_tags")
      .delete()
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("tag_id", tagId);
    setTags((prev) => prev.filter((t) => t.id !== tagId));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[1.5rem]">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-1 rounded-full border border-coc-gold-dim bg-coc-gold/10 px-2 py-0.5 text-xs text-coc-gold"
          >
            <TagIcon size={10} />
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              className="text-coc-gold/60 hover:text-coc-text transition-colors"
              aria-label={`タグ「${tag.name}」を削除`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-xs text-coc-faint italic">タグなし</span>
        )}
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="タグを追加 (Enterで確定)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (suggestions.length > 0) {
                addTag(suggestions[0].name);
              } else {
                addTag(input);
              }
            }
          }}
          className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-1.5 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold transition-colors"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 top-full left-0 right-0 mt-1 rounded-lg border border-coc-border bg-coc-void shadow-lg overflow-hidden">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => addTag(s.name)}
                  className="w-full text-left px-3 py-2 text-sm text-coc-text hover:bg-coc-raised transition-colors"
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
