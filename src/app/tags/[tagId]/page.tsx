"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Tag as TagIcon, User, Map, Users, ChevronLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, Tag, Character, Scenario, Npc } from "@/lib/supabase";

type EntityTagRow = { entity_type: string; entity_id: string };

export default function TagDetailPage() {
  const { tagId } = useParams<{ tagId: string }>();
  const [tag, setTag] = useState<Tag | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !tagId) {
      setLoading(false);
      return;
    }
    async function load() {
      const [{ data: tagData }, { data: entityTagsData }] = await Promise.all([
        supabase.from("tags").select("*").eq("id", tagId).single(),
        supabase.from("entity_tags").select("entity_type, entity_id").eq("tag_id", tagId),
      ]);

      if (tagData) setTag(tagData as Tag);

      const rows = (entityTagsData ?? []) as EntityTagRow[];
      const charIds = rows.filter((r) => r.entity_type === "character").map((r) => r.entity_id);
      const scenarioIds = rows.filter((r) => r.entity_type === "scenario").map((r) => r.entity_id);
      const npcIds = rows.filter((r) => r.entity_type === "npc").map((r) => r.entity_id);

      const [charRes, scenarioRes, npcRes] = await Promise.all([
        charIds.length > 0
          ? supabase.from("characters").select("*").in("id", charIds).order("name")
          : Promise.resolve({ data: [] }),
        scenarioIds.length > 0
          ? supabase.from("scenarios").select("*").in("id", scenarioIds).order("title")
          : Promise.resolve({ data: [] }),
        npcIds.length > 0
          ? supabase.from("npcs").select("*").in("id", npcIds).order("name")
          : Promise.resolve({ data: [] }),
      ]);

      if (charRes.data) setCharacters(charRes.data as Character[]);
      if (scenarioRes.data) setScenarios(scenarioRes.data as Scenario[]);
      if (npcRes.data) setNpcs(npcRes.data as Npc[]);

      setLoading(false);
    }
    load();
  }, [tagId]);

  const totalCount = characters.length + scenarios.length + npcs.length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <Link
          href="/tags"
          className="inline-flex items-center gap-1 text-sm text-coc-muted hover:text-coc-text transition-colors mb-4"
        >
          <ChevronLeft size={14} />
          タグ一覧へ
        </Link>

        {loading ? (
          <p className="text-coc-muted text-sm">読み込み中…</p>
        ) : !tag ? (
          <p className="text-red-400 text-sm">タグが見つかりません。</p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <TagIcon className="text-coc-gold" size={22} />
              <h1 className="font-cinzel text-2xl font-bold text-coc-text">{tag.name}</h1>
            </div>
            <p className="text-sm text-coc-muted">{totalCount} 件のデータが紐づいています</p>
          </>
        )}
      </div>

      {!loading && tag && totalCount === 0 && (
        <div className="rounded-xl border border-coc-border bg-coc-surface p-8 text-center">
          <p className="text-coc-muted text-sm">このタグに紐づくデータがありません。</p>
        </div>
      )}

      {/* キャラクター */}
      {characters.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-coc-text border-b border-coc-border pb-2">
            <User size={16} className="text-coc-gold" />
            キャラクター
            <span className="ml-auto text-xs text-coc-muted">{characters.length} 件</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {characters.map((char) => (
              <Link
                key={char.id}
                href={`/characters/${char.id}`}
                className="flex items-center gap-3 rounded-lg border border-coc-border bg-coc-surface px-4 py-3 hover:border-coc-gold transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-coc-text truncate">{char.name}</p>
                  <p className="text-xs text-coc-muted truncate">
                    {char.occupation ?? "職業未設定"} / {char.status}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* シナリオ */}
      {scenarios.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-coc-text border-b border-coc-border pb-2">
            <Map size={16} className="text-coc-gold" />
            シナリオ
            <span className="ml-auto text-xs text-coc-muted">{scenarios.length} 件</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scenarios.map((scenario) => (
              <Link
                key={scenario.id}
                href={`/scenarios/${scenario.id}`}
                className="flex items-center gap-3 rounded-lg border border-coc-border bg-coc-surface px-4 py-3 hover:border-coc-gold transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-coc-text truncate">{scenario.title}</p>
                  <p className="text-xs text-coc-muted truncate">{scenario.status}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* NPC */}
      {npcs.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-coc-text border-b border-coc-border pb-2">
            <Users size={16} className="text-coc-gold" />
            NPC
            <span className="ml-auto text-xs text-coc-muted">{npcs.length} 件</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {npcs.map((npc) => (
              <Link
                key={npc.id}
                href={`/npcs/${npc.id}`}
                className="flex items-center gap-3 rounded-lg border border-coc-border bg-coc-surface px-4 py-3 hover:border-coc-gold transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-coc-text truncate">{npc.name}</p>
                  <p className="text-xs text-coc-muted truncate">
                    {npc.scenario_name ?? "シナリオ未設定"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
