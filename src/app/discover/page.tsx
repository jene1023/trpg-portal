"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Search, User, BookOpen, FileText, Shuffle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type PublicCharacter = {
  id: string;
  name: string;
  occupation: string | null;
  portrait_url: string | null;
  avatar_url: string | null;
  hp_max: number;
  san_max: number;
  public_slug: string | null;
  updated_at: string;
};

type PublicScenario = {
  id: string;
  title: string;
  synopsis: string | null;
  difficulty: string | null;
  teaser_text: string | null;
  recruit_token: string | null;
  updated_at: string;
};

type PublicHandout = {
  id: string;
  title: string;
  content: string | null;
  scenario_id: string;
  updated_at: string | null;
  created_at: string;
};

type PublicRandomTable = {
  id: string;
  name: string;
  dice_type: string;
  created_at: string;
};

type Tab = "characters" | "scenarios" | "handouts" | "tables";
type SortOrder = "updated" | "name";

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "初心者向け",
  intermediate: "中級",
  advanced: "上級",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-green-400 border-green-800",
  intermediate: "text-yellow-400 border-yellow-800",
  advanced: "text-red-400 border-red-800",
};

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<Tab>("characters");
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<SortOrder>("updated");
  const [loading, setLoading] = useState(false);

  const [characters, setCharacters] = useState<PublicCharacter[]>([]);
  const [scenarios, setScenarios] = useState<PublicScenario[]>([]);
  const [handouts, setHandouts] = useState<PublicHandout[]>([]);
  const [tables, setTables] = useState<PublicRandomTable[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    setLoading(true);

    async function fetchAll() {
      const [charsRes, scenariosRes, handoutsRes, tablesRes] = await Promise.all([
        supabase
          .from("characters")
          .select("id, name, occupation, portrait_url, avatar_url, hp_max, san_max, public_slug, updated_at")
          .eq("is_public", true)
          .order("updated_at", { ascending: false })
          .limit(48),
        supabase
          .from("scenarios")
          .select("id, title, synopsis, difficulty, teaser_text, recruit_token, updated_at")
          .eq("teaser_is_public", true)
          .order("updated_at", { ascending: false })
          .limit(48),
        supabase
          .from("handouts")
          .select("id, title, content, scenario_id, created_at")
          .eq("is_distributed", true)
          .order("created_at", { ascending: false })
          .limit(48),
        supabase
          .from("random_tables")
          .select("id, name, dice_type, created_at")
          .order("created_at", { ascending: false })
          .limit(48),
      ]);

      if (charsRes.data) setCharacters(charsRes.data as PublicCharacter[]);
      if (scenariosRes.data) setScenarios(scenariosRes.data as PublicScenario[]);
      if (handoutsRes.data) setHandouts(handoutsRes.data as PublicHandout[]);
      if (tablesRes.data) setTables(tablesRes.data as PublicRandomTable[]);
      setLoading(false);
    }

    fetchAll();
  }, []);

  const kw = keyword.toLowerCase();

  const filteredCharacters = characters
    .filter(
      (c) =>
        !kw ||
        c.name.toLowerCase().includes(kw) ||
        (c.occupation ?? "").toLowerCase().includes(kw)
    )
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ja");
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const filteredScenarios = scenarios
    .filter(
      (s) =>
        !kw ||
        s.title.toLowerCase().includes(kw) ||
        (s.synopsis ?? "").toLowerCase().includes(kw)
    )
    .sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title, "ja");
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const filteredHandouts = handouts
    .filter(
      (h) =>
        !kw ||
        h.title.toLowerCase().includes(kw) ||
        (h.content ?? "").toLowerCase().includes(kw)
    )
    .sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title, "ja");
      const dateA = new Date(a.updated_at ?? a.created_at).getTime();
      const dateB = new Date(b.updated_at ?? b.created_at).getTime();
      return dateB - dateA;
    });

  const filteredTables = tables
    .filter((t) => !kw || t.name.toLowerCase().includes(kw))
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ja");
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "characters", label: "キャラクター", icon: <User size={14} /> },
    { key: "scenarios", label: "シナリオ", icon: <BookOpen size={14} /> },
    { key: "handouts", label: "ハンドアウト", icon: <FileText size={14} /> },
    { key: "tables", label: "ランダム表", icon: <Shuffle size={14} /> },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Compass size={24} className="text-coc-gold" />
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">発見する</h1>
      </div>
      <p className="text-sm text-coc-muted mb-6">
        ポータル上で公開されたキャラクター・シナリオ・ハンドアウト・ランダム表をブラウズ。インスピレーションの源泉として活用してください。
      </p>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-coc-muted" />
          <input
            type="text"
            placeholder="キーワードで絞り込む…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full bg-coc-surface border border-coc-border rounded-lg pl-9 pr-4 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSort("updated")}
            className={`px-3 py-2 rounded-lg text-xs border transition-colors ${
              sort === "updated"
                ? "border-coc-gold text-coc-gold bg-coc-gold/10"
                : "border-coc-border text-coc-muted hover:text-coc-text"
            }`}
          >
            更新日順
          </button>
          <button
            onClick={() => setSort("name")}
            className={`px-3 py-2 rounded-lg text-xs border transition-colors ${
              sort === "name"
                ? "border-coc-gold text-coc-gold bg-coc-gold/10"
                : "border-coc-border text-coc-muted hover:text-coc-text"
            }`}
          >
            名前順
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-coc-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? "border-coc-gold text-coc-gold"
                : "border-transparent text-coc-muted hover:text-coc-text"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {!isSupabaseConfigured ? (
        <p className="text-coc-muted text-sm text-center py-12">Supabase が未設定です。</p>
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-coc-surface border border-coc-border rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Characters Tab */}
          {activeTab === "characters" && (
            filteredCharacters.length === 0 ? (
              <p className="text-center text-coc-muted text-sm py-12">公開キャラクターがありません。</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredCharacters.map((c) => {
                  const imgUrl = c.portrait_url ?? c.avatar_url;
                  const href = c.public_slug ? `/c/${c.public_slug}` : `/characters/${c.id}`;
                  return (
                    <Link
                      key={c.id}
                      href={href}
                      className="group bg-coc-surface border border-coc-border rounded-xl overflow-hidden hover:border-coc-gold transition-colors"
                    >
                      <div className="relative h-28 bg-coc-void flex items-center justify-center">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={c.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={32} className="text-coc-muted" />
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-sm font-semibold text-coc-text group-hover:text-coc-gold transition-colors truncate">
                          {c.name}
                        </p>
                        {c.occupation && (
                          <p className="text-xs text-coc-muted truncate mt-0.5">{c.occupation}</p>
                        )}
                        <div className="flex gap-2 mt-1.5 text-xs text-coc-faint">
                          <span>HP {c.hp_max}</span>
                          <span>SAN {c.san_max}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          )}

          {/* Scenarios Tab */}
          {activeTab === "scenarios" && (
            filteredScenarios.length === 0 ? (
              <p className="text-center text-coc-muted text-sm py-12">公開シナリオがありません。</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredScenarios.map((s) => {
                  const href = s.recruit_token ? `/s/${s.recruit_token}` : `/scenarios/${s.id}`;
                  return (
                    <Link
                      key={s.id}
                      href={href}
                      className="group bg-coc-surface border border-coc-border rounded-xl p-4 hover:border-coc-gold transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-semibold text-coc-text group-hover:text-coc-gold transition-colors line-clamp-2">
                          {s.title}
                        </p>
                        {s.difficulty && (
                          <span
                            className={`shrink-0 text-xs border rounded px-1.5 py-0.5 ${
                              DIFFICULTY_COLORS[s.difficulty] ?? "text-coc-muted border-coc-border"
                            }`}
                          >
                            {DIFFICULTY_LABELS[s.difficulty] ?? s.difficulty}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-coc-muted line-clamp-3">
                        {s.teaser_text ?? s.synopsis ?? "—"}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )
          )}

          {/* Handouts Tab */}
          {activeTab === "handouts" && (
            filteredHandouts.length === 0 ? (
              <p className="text-center text-coc-muted text-sm py-12">公開ハンドアウトがありません。</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredHandouts.map((h) => (
                  <Link
                    key={h.id}
                    href={`/scenarios/${h.scenario_id}`}
                    className="group bg-coc-surface border border-coc-border rounded-xl p-4 hover:border-coc-gold transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={14} className="text-coc-gold shrink-0" />
                      <p className="text-sm font-semibold text-coc-text group-hover:text-coc-gold transition-colors truncate">
                        {h.title}
                      </p>
                    </div>
                    {h.content && (
                      <p className="text-xs text-coc-muted line-clamp-4">{h.content}</p>
                    )}
                  </Link>
                ))}
              </div>
            )
          )}

          {/* Random Tables Tab */}
          {activeTab === "tables" && (
            filteredTables.length === 0 ? (
              <p className="text-center text-coc-muted text-sm py-12">ランダム表がありません。</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredTables.map((t) => (
                  <Link
                    key={t.id}
                    href={`/random-tables`}
                    className="group bg-coc-surface border border-coc-border rounded-xl p-4 hover:border-coc-gold transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-coc-text group-hover:text-coc-gold transition-colors truncate">
                        {t.name}
                      </p>
                      <span className="shrink-0 text-xs border border-coc-border text-coc-muted rounded px-1.5 py-0.5">
                        {t.dice_type}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
