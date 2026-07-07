"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, ThumbsUp } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionHighlight, HighlightCategory } from "@/lib/supabase";

const CATEGORY_LABELS: Record<HighlightCategory, string> = {
  roll: "ダイス判定",
  rp: "ロールプレイ",
  story: "ストーリー",
  comedy: "コメディ",
  tragedy: "悲劇",
  other: "その他",
};

const CATEGORY_COLORS: Record<HighlightCategory, string> = {
  roll: "text-coc-gold bg-coc-gold/10 border-coc-gold-dim",
  rp: "text-blue-400 bg-blue-400/10 border-blue-800",
  story: "text-purple-400 bg-purple-400/10 border-purple-800",
  comedy: "text-yellow-400 bg-yellow-400/10 border-yellow-800",
  tragedy: "text-red-400 bg-red-400/10 border-red-800",
  other: "text-coc-muted bg-coc-raised border-coc-border",
};

export default function HighlightsPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [highlights, setHighlights] = useState<SessionHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  const [authorName, setAuthorName] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [category, setCategory] = useState<HighlightCategory>("rp");
  const [sceneDescription, setSceneDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function load() {
      const { data: scenario } = await supabase
        .from("scenarios")
        .select("title")
        .eq("id", scenarioId)
        .single();
      setScenarioTitle(scenario?.title ?? "");

      const { data: rows } = await supabase
        .from("session_highlights")
        .select("*")
        .eq("scenario_id", scenarioId)
        .order("liked_count", { ascending: false });
      setHighlights((rows ?? []) as SessionHighlight[]);

      setLoading(false);
    }

    load();
  }, [scenarioId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || !sceneDescription.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("session_highlights")
      .insert({
        scenario_id: scenarioId,
        author_name: authorName.trim() || null,
        character_name: characterName.trim() || null,
        scene_description: sceneDescription.trim(),
        category,
        liked_count: 0,
      })
      .select()
      .single();

    if (!error && data) {
      setHighlights((prev) => [data as SessionHighlight, ...prev]);
      setSceneDescription("");
      setAuthorName("");
      setCharacterName("");
    }
    setSaving(false);
  }

  async function handleLike(highlight: SessionHighlight) {
    if (!isSupabaseConfigured) return;
    const newCount = highlight.liked_count + 1;
    setHighlights((prev) =>
      prev.map((h) => (h.id === highlight.id ? { ...h, liked_count: newCount } : h))
    );
    await supabase
      .from("session_highlights")
      .update({ liked_count: newCount })
      .eq("id", highlight.id);
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("session_highlights").delete().eq("id", id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        {scenarioTitle && (
          <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>
        )}
        <h1 className="font-cinzel text-xl font-bold text-coc-text">ハイライト投票</h1>
        <p className="text-xs text-coc-muted mt-1">
          印象に残ったシーンをカテゴリ別に投稿していいねで盛り上がろう
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-coc-border bg-coc-surface p-4 space-y-3 mb-6"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-coc-muted mb-1">投稿者名（省略可）</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
              placeholder="例: 田中"
            />
          </div>
          <div>
            <label className="block text-xs text-coc-muted mb-1">キャラクター名（省略可）</label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
              placeholder="例: 山田太郎"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-coc-muted mb-1">カテゴリ</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as HighlightCategory)}
            className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold transition-colors"
          >
            {(Object.keys(CATEGORY_LABELS) as HighlightCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-coc-muted mb-1">シーン説明 *</label>
          <textarea
            value={sceneDescription}
            onChange={(e) => setSceneDescription(e.target.value)}
            rows={4}
            required
            className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors resize-none"
            placeholder="印象に残ったシーンを自由に記述してください"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-coc-gold px-4 py-2 text-sm font-semibold text-coc-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Plus size={16} />
          {saving ? "投稿中..." : "ハイライトを投稿"}
        </button>
      </form>

      {loading ? (
        <p className="text-center text-coc-muted text-sm py-8">読み込み中...</p>
      ) : highlights.length === 0 ? (
        <p className="text-center text-coc-muted text-sm py-8">
          ハイライトはまだありません
        </p>
      ) : (
        <div className="space-y-3">
          {highlights.map((h) => (
            <div
              key={h.id}
              className="rounded-xl border border-coc-border bg-coc-surface p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[h.category as HighlightCategory]}`}
                  >
                    {CATEGORY_LABELS[h.category as HighlightCategory]}
                  </span>
                  {h.author_name && (
                    <span className="text-sm font-medium text-coc-text">{h.author_name}</span>
                  )}
                  {h.character_name && (
                    <span className="text-xs text-coc-muted">（{h.character_name}）</span>
                  )}
                  <span className="text-xs text-coc-muted">
                    {new Date(h.created_at).toLocaleString("ja-JP")}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(h.id)}
                  className="text-coc-faint hover:text-red-400 transition-colors shrink-0"
                  title="削除"
                >
                  <X size={15} />
                </button>
              </div>
              <p className="font-crimson text-coc-text text-[15px] leading-relaxed whitespace-pre-wrap border-l-2 border-coc-border pl-3">
                {h.scene_description}
              </p>
              <div className="flex items-center">
                <button
                  onClick={() => handleLike(h)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-coc-muted border border-coc-border hover:border-coc-gold hover:text-coc-gold transition-colors"
                >
                  <ThumbsUp size={13} />
                  <span>{h.liked_count}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
