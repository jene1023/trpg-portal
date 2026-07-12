"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BarChart2, Trophy, ToggleLeft, ToggleRight } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type SurveyRow = {
  id: string;
  mvp_character_id: string | null;
  memorable_scene: string | null;
  next_session_rating: number | null;
  created_at: string;
};

type CharacterVotes = { id: string; name: string; votes: number };

export default function SessionSurveyResultsPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [characterMap, setCharacterMap] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    (async () => {
      const [{ data: scenario }, { data: configRow }, { data: surveyRows }, { data: participantRows }] =
        await Promise.all([
          supabase.from("scenarios").select("title").eq("id", scenarioId).single(),
          supabase
            .from("session_survey_configs")
            .select("id, is_open")
            .eq("scenario_id", scenarioId)
            .single(),
          supabase
            .from("session_surveys")
            .select("id, mvp_character_id, memorable_scene, next_session_rating, created_at")
            .eq("scenario_id", scenarioId)
            .order("created_at", { ascending: false }),
          supabase
            .from("scenario_participants")
            .select("character_id, characters(id, name)")
            .eq("scenario_id", scenarioId),
        ]);

      setScenarioTitle(scenario?.title ?? "");
      setIsOpen(configRow?.is_open ?? false);
      setConfigId(configRow?.id ?? null);
      setSurveys((surveyRows ?? []) as SurveyRow[]);

      const map: Record<string, string> = {};
      for (const row of participantRows ?? []) {
        const c = (row as { characters: { id: string; name: string } | null }).characters;
        if (c) map[c.id] = c.name;
      }
      setCharacterMap(map);
      setLoading(false);
    })();
  }, [scenarioId]);

  async function toggleSurvey() {
    if (!isSupabaseConfigured) return;
    setToggling(true);

    if (configId) {
      const newOpen = !isOpen;
      await supabase
        .from("session_survey_configs")
        .update({ is_open: newOpen, opened_at: newOpen ? new Date().toISOString() : null })
        .eq("id", configId);
      setIsOpen(newOpen);
    } else {
      const { data } = await supabase
        .from("session_survey_configs")
        .insert({ scenario_id: scenarioId, is_open: true, opened_at: new Date().toISOString() })
        .select("id")
        .single();
      if (data) {
        setConfigId(data.id);
        setIsOpen(true);
      }
    }

    setToggling(false);
  }

  const count = surveys.length;
  const avgRating =
    count > 0
      ? surveys.filter((s) => s.next_session_rating !== null).reduce((acc, s) => acc + (s.next_session_rating ?? 0), 0) /
        surveys.filter((s) => s.next_session_rating !== null).length
      : null;
  const ratedCount = surveys.filter((s) => s.next_session_rating !== null).length;

  const mvpVoteCounts: Record<string, number> = {};
  for (const s of surveys) {
    if (s.mvp_character_id) {
      mvpVoteCounts[s.mvp_character_id] = (mvpVoteCounts[s.mvp_character_id] ?? 0) + 1;
    }
  }

  const mvpRanking: CharacterVotes[] = Object.entries(mvpVoteCounts)
    .map(([id, votes]) => ({ id, name: characterMap[id] ?? "不明", votes }))
    .sort((a, b) => b.votes - a.votes);

  const maxVotes = mvpRanking[0]?.votes ?? 1;

  const sceneComments = surveys.filter((s) => s.memorable_scene);

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

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>
          <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
            <BarChart2 size={20} className="text-coc-gold" />
            アンケート集計（KP専用）
          </h1>
          <p className="text-xs text-coc-muted mt-1">回答数: {count}件</p>
        </div>

        <button
          onClick={toggleSurvey}
          disabled={toggling}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
            isOpen
              ? "border-green-700 bg-green-950/20 text-green-400 hover:bg-green-950/40"
              : "border-coc-border bg-coc-surface text-coc-muted hover:text-coc-text hover:border-coc-gold"
          }`}
        >
          {isOpen ? (
            <>
              <ToggleRight size={14} />
              受付中
            </>
          ) : (
            <>
              <ToggleLeft size={14} />
              受付停止中
            </>
          )}
        </button>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">Supabaseが設定されていません。</p>
        </div>
      ) : count === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">まだ回答がありません。</p>
          {!isOpen && (
            <p className="text-xs text-coc-muted mt-2">
              上のボタンでアンケートを「受付中」にするとPLが回答できます。
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* 次回期待度 */}
          {ratedCount > 0 && avgRating !== null && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
                次回セッションへの期待度
              </p>
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-xl ${star <= Math.round(avgRating) ? "text-coc-gold" : "text-coc-border"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-lg font-bold text-coc-text">{avgRating.toFixed(1)}</p>
                <p className="text-xs text-coc-muted">（{ratedCount}件）</p>
              </div>
            </div>
          )}

          {/* MVP棒グラフ */}
          {mvpRanking.length > 0 && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Trophy size={13} />
                MVP投票結果
              </p>
              <div className="flex flex-col gap-3">
                {mvpRanking.map((item, i) => (
                  <div key={item.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-coc-text flex items-center gap-1.5">
                        {i === 0 && <span className="text-yellow-400">👑</span>}
                        {item.name}
                      </span>
                      <span className="text-xs text-coc-muted">{item.votes}票</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-coc-raised overflow-hidden">
                      <div
                        className="h-full rounded-full bg-coc-gold transition-all"
                        style={{ width: `${(item.votes / maxVotes) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 名場面コメント */}
          {sceneComments.length > 0 && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
                印象に残ったシーン
              </p>
              <div className="flex flex-col gap-3">
                {sceneComments.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-coc-border bg-coc-raised px-4 py-3"
                  >
                    <p className="text-sm text-coc-text whitespace-pre-wrap">{s.memorable_scene}</p>
                    <p className="text-xs text-coc-muted mt-2">
                      {new Date(s.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <Link
          href={`/scenarios/${scenarioId}/survey`}
          className="text-xs text-coc-muted hover:text-coc-gold transition-colors"
        >
          → PLの回答フォームを見る
        </Link>
      </div>
    </div>
  );
}
