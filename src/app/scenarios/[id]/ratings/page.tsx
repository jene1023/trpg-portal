"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioPlayerRating } from "@/lib/supabase";

function StarInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="text-xs text-coc-muted mb-2">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl transition-colors ${
              star <= value ? "text-coc-gold" : "text-coc-border hover:text-coc-gold-dim"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

function StarDisplay({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex gap-0.5 text-sm">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rounded ? "text-coc-gold" : "text-coc-border"}>
          ★
        </span>
      ))}
    </span>
  );
}

const AXES = [
  { label: "楽しさ", key: "fun_rating" as const },
  { label: "恐怖演出", key: "horror_rating" as const },
  { label: "謎解き", key: "mystery_rating" as const },
  { label: "キャラ活躍", key: "character_rating" as const },
];

export default function RatingsPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [ratings, setRatings] = useState<ScenarioPlayerRating[]>([]);
  const [voterName, setVoterName] = useState("");
  const [funRating, setFunRating] = useState(0);
  const [horrorRating, setHorrorRating] = useState(0);
  const [mysteryRating, setMysteryRating] = useState(0);
  const [characterRating, setCharacterRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    (async () => {
      const [{ data: scenario }, { data: ratingRows }] = await Promise.all([
        supabase.from("scenarios").select("title").eq("id", scenarioId).single(),
        supabase
          .from("scenario_player_ratings")
          .select("*")
          .eq("scenario_id", scenarioId)
          .order("created_at", { ascending: false }),
      ]);
      setScenarioTitle(scenario?.title ?? "");
      setRatings((ratingRows ?? []) as ScenarioPlayerRating[]);
      setLoading(false);
    })();
  }, [scenarioId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || !voterName.trim() || funRating === 0) return;
    setSaving(true);

    const payload = {
      scenario_id: scenarioId,
      voter_name: voterName.trim(),
      fun_rating: funRating,
      horror_rating: horrorRating,
      mystery_rating: mysteryRating,
      character_rating: characterRating,
      comment: comment.trim() || null,
    };

    const existing = ratings.find((r) => r.voter_name === voterName.trim());
    if (existing) {
      const { data } = await supabase
        .from("scenario_player_ratings")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single();
      if (data) {
        setRatings((prev) =>
          prev.map((r) => (r.id === existing.id ? (data as ScenarioPlayerRating) : r))
        );
      }
    } else {
      const { data } = await supabase
        .from("scenario_player_ratings")
        .insert(payload)
        .select("*")
        .single();
      if (data) {
        setRatings((prev) => [data as ScenarioPlayerRating, ...prev]);
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function avg(key: (typeof AXES)[number]["key"]) {
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r[key], 0) / ratings.length;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-coc-muted">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
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
        <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <Star size={20} className="text-coc-gold" />
          感想投票
        </h1>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">Supabaseが設定されていません。</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {ratings.length > 0 && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
                平均スコア（{ratings.length}件）
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {AXES.map(({ label, key }) => (
                  <div key={key} className="text-center">
                    <p className="text-xs text-coc-muted mb-1">{label}</p>
                    <StarDisplay value={avg(key)} />
                    <p className="text-xs text-coc-gold mt-1">{avg(key).toFixed(1)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
                感想を投票する
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-coc-muted mb-1 block">お名前 *</label>
                  <input
                    type="text"
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    placeholder="PL名を入力（同じ名前で再送すると上書きされます）"
                    required
                    className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StarInput label="楽しさ *" value={funRating} onChange={setFunRating} />
                  <StarInput label="恐怖演出" value={horrorRating} onChange={setHorrorRating} />
                  <StarInput label="謎解き" value={mysteryRating} onChange={setMysteryRating} />
                  <StarInput label="キャラ活躍" value={characterRating} onChange={setCharacterRating} />
                </div>
                <div>
                  <label className="text-xs text-coc-muted mb-1 block">コメント（任意）</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="感想・印象に残ったシーンなど..."
                    className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !voterName.trim() || funRating === 0}
              className="flex items-center justify-center gap-2 rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-3 text-sm font-medium text-coc-gold transition-colors hover:border-coc-gold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Star size={16} />
              {saving ? "送信中..." : saved ? "送信しました ✓" : "投票する"}
            </button>
          </form>

          {ratings.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest">
                みんなの感想
              </p>
              {ratings.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-coc-text">{r.voter_name}</p>
                    <p className="text-xs text-coc-muted">
                      {new Date(r.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-2">
                    {AXES.map(({ label, key }) => (
                      <div key={key}>
                        <p className="text-xs text-coc-muted mb-0.5">{label}</p>
                        <StarDisplay value={r[key]} />
                      </div>
                    ))}
                  </div>
                  {r.comment && (
                    <p className="text-xs text-coc-text whitespace-pre-wrap border-t border-coc-border pt-2 mt-2">
                      {r.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
