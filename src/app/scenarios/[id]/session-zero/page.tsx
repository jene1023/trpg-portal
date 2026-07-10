"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionZeroQuestion, SessionZeroAnswer } from "@/lib/supabase";

type CharacterOption = { id: string; name: string; player_name: string | null };

type QuestionWithAnswers = SessionZeroQuestion & {
  answers: (SessionZeroAnswer & { character_name: string })[];
};

type ViewMode = "kp" | "pl";

export default function SessionZeroPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("kp");
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [loading, setLoading] = useState(true);

  const [newQuestion, setNewQuestion] = useState("");
  const [addingQuestion, setAddingQuestion] = useState(false);

  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [savingAnswers, setSavingAnswers] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    const [{ data: scenario }, { data: participantRows }, { data: questionRows }, { data: answerRows }] =
      await Promise.all([
        supabase.from("scenarios").select("title").eq("id", scenarioId).single(),
        supabase
          .from("scenario_participants")
          .select("character_id, characters(id, name, player_name)")
          .eq("scenario_id", scenarioId),
        supabase
          .from("session_zero_questions")
          .select("*")
          .eq("scenario_id", scenarioId)
          .order("order_index"),
        supabase.from("session_zero_answers").select("*"),
      ]);

    if (scenario) setScenarioTitle(scenario.title);

    const chars: CharacterOption[] = (participantRows ?? []).flatMap((p) => {
      const c = p.characters as CharacterOption | null;
      return c ? [c] : [];
    });
    setCharacters(chars);
    if (chars.length > 0 && !selectedCharacterId) {
      setSelectedCharacterId(chars[0].id);
    }

    const charMap: Record<string, string> = {};
    chars.forEach((c) => { charMap[c.id] = c.name; });

    const qs: QuestionWithAnswers[] = (questionRows ?? []).map((q) => ({
      ...q,
      answers: (answerRows ?? [])
        .filter((a) => a.question_id === q.id)
        .map((a) => ({ ...a, character_name: charMap[a.character_id] ?? "不明" })),
    }));
    setQuestions(qs);
    setLoading(false);
  }, [scenarioId, selectedCharacterId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedCharacterId || questions.length === 0) return;
    const draft: Record<string, string> = {};
    questions.forEach((q) => {
      const existing = q.answers.find((a) => a.character_id === selectedCharacterId);
      draft[q.id] = existing?.answer_text ?? "";
    });
    setDraftAnswers(draft);
  }, [selectedCharacterId, questions]);

  async function handleAddQuestion() {
    if (!isSupabaseConfigured || !newQuestion.trim()) return;
    setAddingQuestion(true);
    const nextIndex = questions.length;
    await supabase.from("session_zero_questions").insert({
      scenario_id: scenarioId,
      question_text: newQuestion.trim(),
      order_index: nextIndex,
    });
    setNewQuestion("");
    await load();
    setAddingQuestion(false);
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("session_zero_answers").delete().eq("question_id", questionId);
    await supabase.from("session_zero_questions").delete().eq("id", questionId);
    await load();
  }

  async function handleSaveAnswers() {
    if (!isSupabaseConfigured || !selectedCharacterId) return;
    setSavingAnswers(true);

    for (const [questionId, text] of Object.entries(draftAnswers)) {
      const existing = questions
        .find((q) => q.id === questionId)
        ?.answers.find((a) => a.character_id === selectedCharacterId);

      if (existing) {
        await supabase
          .from("session_zero_answers")
          .update({ answer_text: text })
          .eq("id", existing.id);
      } else if (text.trim()) {
        await supabase.from("session_zero_answers").insert({
          question_id: questionId,
          character_id: selectedCharacterId,
          answer_text: text,
        });
      }
    }

    await load();
    setSavingAnswers(false);
    setSavedAnswers(true);
    setTimeout(() => setSavedAnswers(false), 2000);
  }

  const selectedChar = characters.find((c) => c.id === selectedCharacterId);

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="text-coc-muted text-sm">Supabase が設定されていません。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {scenarioTitle || "シナリオ詳細"}
        </Link>
      </div>

      <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-1">Session 0</h1>
      <p className="text-sm text-coc-muted mb-6">PC間の関係構築と世界観合意フォーム</p>

      {/* ビュー切替 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode("kp")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === "kp"
              ? "bg-coc-gold/20 border border-coc-gold text-coc-gold"
              : "border border-coc-border text-coc-muted hover:text-coc-text"
          }`}
        >
          KPビュー
        </button>
        <button
          onClick={() => setViewMode("pl")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            viewMode === "pl"
              ? "bg-coc-gold/20 border border-coc-gold text-coc-gold"
              : "border border-coc-border text-coc-muted hover:text-coc-text"
          }`}
        >
          PLビュー
        </button>
      </div>

      {loading ? (
        <p className="text-coc-muted text-sm">読み込み中...</p>
      ) : (
        <>
          {/* KPビュー */}
          {viewMode === "kp" && (
            <div className="flex flex-col gap-6">
              {/* 質問追加フォーム */}
              <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4">
                <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">質問を追加（KP）</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddQuestion(); }}
                    placeholder="例：どこで知り合いましたか？"
                    className="flex-1 rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
                  />
                  <button
                    onClick={handleAddQuestion}
                    disabled={addingQuestion || !newQuestion.trim()}
                    className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50"
                  >
                    <Plus size={15} />
                    追加
                  </button>
                </div>
              </div>

              {/* 質問一覧と回答 */}
              {questions.length === 0 ? (
                <p className="text-center text-coc-muted text-sm py-8">まだ質問がありません。上のフォームから追加してください。</p>
              ) : (
                questions.map((q, idx) => (
                  <div key={q.id} className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-xs text-coc-muted mr-2">Q{idx + 1}</span>
                        <span className="font-medium text-coc-text">{q.question_text}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-coc-muted hover:text-red-400 transition-colors flex-shrink-0"
                        title="質問を削除"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {q.answers.length === 0 ? (
                      <p className="text-xs text-coc-muted italic">回答なし</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {q.answers.map((a) => (
                          <div key={a.id} className="rounded-lg border border-coc-border bg-coc-bg px-3 py-2">
                            <p className="text-xs text-coc-gold mb-1">{a.character_name}</p>
                            <p className="text-sm text-coc-text whitespace-pre-wrap">{a.answer_text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* PLビュー */}
          {viewMode === "pl" && (
            <div className="flex flex-col gap-6">
              {/* キャラクター選択 */}
              <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
                <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">自分のキャラクターを選択</p>
                {characters.length === 0 ? (
                  <p className="text-sm text-coc-muted">参加キャラクターが登録されていません。</p>
                ) : (
                  <select
                    value={selectedCharacterId}
                    onChange={(e) => setSelectedCharacterId(e.target.value)}
                    className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
                  >
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.player_name ? ` (${c.player_name})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 質問フォーム */}
              {questions.length === 0 ? (
                <p className="text-center text-coc-muted text-sm py-8">KPがまだ質問を設定していません。</p>
              ) : selectedChar ? (
                <>
                  <div className="flex flex-col gap-4">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
                        <label className="block mb-2">
                          <span className="text-xs text-coc-muted mr-2">Q{idx + 1}</span>
                          <span className="font-medium text-coc-text">{q.question_text}</span>
                        </label>
                        <textarea
                          value={draftAnswers[q.id] ?? ""}
                          onChange={(e) =>
                            setDraftAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          rows={3}
                          placeholder={`${selectedChar.name} としての回答を入力...`}
                          className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-y"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSaveAnswers}
                    disabled={savingAnswers}
                    className="flex items-center gap-2 self-end rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50"
                  >
                    <Save size={15} />
                    {savedAnswers ? "保存しました！" : savingAnswers ? "保存中..." : "回答を保存"}
                  </button>
                </>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}
