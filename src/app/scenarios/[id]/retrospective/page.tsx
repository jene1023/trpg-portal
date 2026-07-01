"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Save } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioRetrospective } from "@/lib/supabase";

function StarRating({
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

export default function RetrospectivePage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;
  const router = useRouter();

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [retroId, setRetroId] = useState<string | null>(null);

  const [whatWorked, setWhatWorked] = useState("");
  const [whatToImprove, setWhatToImprove] = useState("");
  const [playerReactions, setPlayerReactions] = useState("");
  const [difficultyRating, setDifficultyRating] = useState(0);
  const [horrorRating, setHorrorRating] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data: scenario } = await supabase
        .from("scenarios")
        .select("title")
        .eq("id", scenarioId)
        .single();
      setScenarioTitle(scenario?.title ?? "");

      const { data: retro } = await supabase
        .from("scenario_retrospectives")
        .select("*")
        .eq("scenario_id", scenarioId)
        .maybeSingle();

      if (retro) {
        const r = retro as ScenarioRetrospective;
        setRetroId(r.id);
        setWhatWorked(r.what_worked ?? "");
        setWhatToImprove(r.what_to_improve ?? "");
        setPlayerReactions(r.player_reactions ?? "");
        setDifficultyRating(r.difficulty_rating ?? 0);
        setHorrorRating(r.horror_rating ?? 0);
      }

      setLoading(false);
    })();
  }, [scenarioId]);

  async function handleSave() {
    if (!isSupabaseConfigured) return;
    setSaving(true);

    const payload = {
      scenario_id: scenarioId,
      what_worked: whatWorked || null,
      what_to_improve: whatToImprove || null,
      player_reactions: playerReactions || null,
      difficulty_rating: difficultyRating || null,
      horror_rating: horrorRating || null,
    };

    if (retroId) {
      await supabase
        .from("scenario_retrospectives")
        .update(payload)
        .eq("id", retroId);
    } else {
      const { data } = await supabase
        .from("scenario_retrospectives")
        .insert(payload)
        .select("id")
        .single();
      if (data) setRetroId(data.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
          <ClipboardList size={20} className="text-coc-gold" />
          振り返りノート
        </h1>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">Supabaseが設定されていません。</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <label className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-2 block">
              うまくいったこと
            </label>
            <textarea
              value={whatWorked}
              onChange={(e) => setWhatWorked(e.target.value)}
              rows={4}
              placeholder="演出・展開・判定タイミングなど、うまく機能した点を記録..."
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
            />
          </div>

          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <label className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-2 block">
              改善したいこと
            </label>
            <textarea
              value={whatToImprove}
              onChange={(e) => setWhatToImprove(e.target.value)}
              rows={4}
              placeholder="次回に向けて改善したい点・修正したいシーン・バランス調整など..."
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
            />
          </div>

          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <label className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-2 block">
              PLの反応・印象
            </label>
            <textarea
              value={playerReactions}
              onChange={(e) => setPlayerReactions(e.target.value)}
              rows={4}
              placeholder="PLが盛り上がったシーン・驚いた反応・感想コメントなど..."
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
            />
          </div>

          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:gap-10">
              <StarRating
                label="難易度評価"
                value={difficultyRating}
                onChange={setDifficultyRating}
              />
              <StarRating
                label="恐怖演出評価"
                value={horrorRating}
                onChange={setHorrorRating}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-3 text-sm font-medium text-coc-gold transition-colors hover:border-coc-gold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {saving ? "保存中..." : saved ? "保存しました ✓" : "振り返りを保存"}
          </button>
        </div>
      )}
    </div>
  );
}
