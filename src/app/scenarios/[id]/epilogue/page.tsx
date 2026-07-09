"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Save } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioEpilogue, CharacterEnding } from "@/lib/supabase";

type ParticipantInfo = {
  character_id: string;
  character_name: string;
};

export default function EpiloguePage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [mainEpilogue, setMainEpilogue] = useState("");
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [endings, setEndings] = useState<Record<string, string>>({});

  async function fetchData() {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const [
      { data: scenario },
      { data: participantRows },
      { data: epilogueRow },
      { data: endingRows },
    ] = await Promise.all([
      supabase.from("scenarios").select("title").eq("id", scenarioId).single(),
      supabase
        .from("scenario_participants")
        .select("character_id, characters(id, name)")
        .eq("scenario_id", scenarioId),
      supabase
        .from("scenario_epilogues")
        .select("*")
        .eq("scenario_id", scenarioId)
        .single(),
      supabase
        .from("character_endings")
        .select("*")
        .eq("scenario_id", scenarioId),
    ]);

    setScenarioTitle(scenario?.title ?? "");

    const infos: ParticipantInfo[] = (participantRows ?? [])
      .filter((p: { character_id: string; characters: { id: string; name: string } | null }) => p.characters)
      .map((p: { character_id: string; characters: { id: string; name: string } | null }) => ({
        character_id: p.character_id,
        character_name: (p.characters as { id: string; name: string }).name,
      }));
    setParticipants(infos);

    if (epilogueRow) {
      setMainEpilogue((epilogueRow as ScenarioEpilogue).main_epilogue ?? "");
    }

    const endingMap: Record<string, string> = {};
    for (const row of (endingRows as CharacterEnding[]) ?? []) {
      endingMap[row.character_id] = row.ending_text ?? "";
    }
    setEndings(endingMap);

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  async function handleSave() {
    if (!isSupabaseConfigured) return;
    setSaving(true);

    await supabase.from("scenario_epilogues").upsert(
      {
        scenario_id: scenarioId,
        main_epilogue: mainEpilogue.trim() || null,
      },
      { onConflict: "scenario_id" }
    );

    for (const [charId, text] of Object.entries(endings) as [string, string][]) {
      if (text.trim()) {
        await supabase.from("character_endings").upsert(
          {
            scenario_id: scenarioId,
            character_id: charId,
            ending_text: text.trim(),
          },
          { onConflict: "scenario_id,character_id" }
        );
      }
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
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-1.5 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={15} />
          {saving ? "保存中..." : saved ? "保存しました" : "保存する"}
        </button>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <BookOpen size={20} className="text-coc-gold" />
          エピローグ記録
        </h1>
        <p className="text-xs text-coc-muted mt-1">シナリオの物語的結末と各探索者のエンディングを記録します。</p>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">Supabaseが設定されていません。</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
            <label className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-2 block">
              シナリオエピローグ
            </label>
            <p className="text-xs text-coc-muted mb-3">物語全体の結末・締めくくりのナレーションを記録してください。</p>
            <textarea
              value={mainEpilogue}
              onChange={(e) => setMainEpilogue(e.target.value)}
              rows={6}
              placeholder="こうして探索者たちは闇に立ち向かい..."
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
            />
          </div>

          {participants.length > 0 && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
                各探索者のエンディング
              </p>
              <div className="flex flex-col gap-4">
                {participants.map((p) => (
                  <div key={p.character_id}>
                    <label className="text-sm font-medium text-coc-gold mb-1.5 block">
                      {p.character_name}
                    </label>
                    <textarea
                      value={endings[p.character_id] ?? ""}
                      onChange={(e) =>
                        setEndings((prev) => ({
                          ...prev,
                          [p.character_id]: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder={`${p.character_name}の物語的結末...`}
                      className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {participants.length === 0 && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-6 text-center">
              <p className="text-sm text-coc-muted">参加キャラクターが登録されていません。</p>
              <p className="text-xs text-coc-muted mt-1">
                <Link href={`/scenarios/${scenarioId}/participants`} className="text-coc-gold hover:underline">
                  参加キャラクターを登録
                </Link>
                してからエンディングを記録できます。
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-5 py-2.5 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={15} />
              {saving ? "保存中..." : saved ? "保存しました" : "保存する"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
