"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Trophy } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type CharacterOption = { id: string; name: string };

export default function SessionSurveyPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [mvpCharacterId, setMvpCharacterId] = useState<string>("");
  const [memorableScene, setMemorableScene] = useState("");
  const [nextSessionRating, setNextSessionRating] = useState(0);

  useEffect(() => {
    const key = `session_survey_submitted_${scenarioId}`;
    if (typeof window !== "undefined" && localStorage.getItem(key)) {
      setSubmitted(true);
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    (async () => {
      const [{ data: scenario }, { data: configRow }, { data: participantRows }] =
        await Promise.all([
          supabase.from("scenarios").select("title").eq("id", scenarioId).single(),
          supabase
            .from("session_survey_configs")
            .select("is_open")
            .eq("scenario_id", scenarioId)
            .single(),
          supabase
            .from("scenario_participants")
            .select("character_id, characters(id, name)")
            .eq("scenario_id", scenarioId),
        ]);

      setScenarioTitle(scenario?.title ?? "");
      setIsOpen(configRow?.is_open ?? false);

      const chars: CharacterOption[] = [];
      for (const row of participantRows ?? []) {
        const c = (row as { characters: CharacterOption | null }).characters;
        if (c) chars.push(c);
      }
      setCharacters(chars);
      setLoading(false);
    })();
  }, [scenarioId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    setSaving(true);

    const payload = {
      scenario_id: scenarioId,
      submitted_by_user_id: "anonymous",
      mvp_character_id: mvpCharacterId || null,
      memorable_scene: memorableScene.trim() || null,
      next_session_rating: nextSessionRating || null,
    };

    const { data } = await supabase.from("session_surveys").insert(payload).select("id").single();

    if (data) {
      if (typeof window !== "undefined") {
        localStorage.setItem(`session_survey_submitted_${scenarioId}`, "1");
      }
      setSubmitted(true);
    }

    setSaving(false);
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
          <Trophy size={20} className="text-coc-gold" />
          事後アンケート
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          セッションお疲れ様でした！MVP投票と印象的なシーンをぜひ教えてください。
        </p>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">Supabaseが設定されていません。</p>
        </div>
      ) : !isOpen ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">アンケートはまだ開始されていません。</p>
          <p className="text-xs text-coc-muted mt-2">KPがアンケートを開始するまでお待ちください。</p>
        </div>
      ) : submitted ? (
        <div className="rounded-xl border border-green-800 bg-green-950/20 px-5 py-8 text-center">
          <p className="text-green-400 font-medium mb-2">アンケートを送信済みです</p>
          <p className="text-xs text-coc-muted">ご回答ありがとうございました！</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs text-coc-muted mb-2 block">
                  今回のMVP（最も活躍したキャラクター）
                </label>
                <select
                  value={mvpCharacterId}
                  onChange={(e) => setMvpCharacterId(e.target.value)}
                  className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
                >
                  <option value="">選択しない</option>
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-coc-muted mb-2 block">
                  印象に残ったシーン（自由記述）
                </label>
                <textarea
                  value={memorableScene}
                  onChange={(e) => setMemorableScene(e.target.value)}
                  rows={4}
                  placeholder="心に残った場面や発言、ドラマチックな展開など..."
                  className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                />
              </div>

              <div>
                <p className="text-xs text-coc-muted mb-2">次回セッションへの期待度</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNextSessionRating(star)}
                      className={`text-2xl transition-colors ${
                        star <= nextSessionRating
                          ? "text-coc-gold"
                          : "text-coc-border hover:text-coc-gold-dim"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {nextSessionRating > 0 && (
                  <p className="text-xs text-coc-muted mt-1">{nextSessionRating} / 5</p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-3 text-sm font-medium text-coc-gold transition-colors hover:border-coc-gold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            {saving ? "送信中..." : "アンケートを送信"}
          </button>
        </form>
      )}
    </div>
  );
}
