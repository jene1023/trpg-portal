"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, ShieldCheck, MessageSquare } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  SessionZeroQuestion,
  SessionZeroAnswer,
  ChecklistItem,
  ChecklistResponseStatus,
  SessionZeroChecklist,
  SessionZeroChecklistResponse,
} from "@/lib/supabase";

// ==================== Q&A Types ====================
type CharacterOption = { id: string; name: string; player_name: string | null };
type QuestionWithAnswers = SessionZeroQuestion & {
  answers: (SessionZeroAnswer & { character_name: string })[];
};
type ViewMode = "kp" | "pl";
type PageTab = "qa" | "safety";

// ==================== Safety Checklist Constants ====================
const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: "violence", label: "暴力・流血描写（激しい戦闘・肉体損傷）" },
  { id: "horror", label: "ホラー描写（怪物・恐怖演出）" },
  { id: "psychological", label: "心理的恐怖・精神攻撃描写" },
  { id: "death", label: "死亡・死体・遺体描写" },
  { id: "romance", label: "ロマンス・恋愛・性的描写" },
  { id: "religion", label: "宗教・信仰に関わる描写" },
  { id: "drugs", label: "薬物・アルコール描写" },
  { id: "body_horror", label: "ボディホラー（身体変異・異形）" },
];

const RESPONSE_LABELS: Record<ChecklistResponseStatus, string> = {
  ok: "OK",
  ng: "NG",
  consult: "要相談",
};

const RESPONSE_COLORS: Record<ChecklistResponseStatus, string> = {
  ok: "border-green-700 bg-green-950/30 text-green-400",
  ng: "border-red-700 bg-red-950/30 text-red-400",
  consult: "border-yellow-700 bg-yellow-950/20 text-yellow-400",
};

const RESPONSE_ORDER: ChecklistResponseStatus[] = ["ok", "consult", "ng"];

// ==================== Main Component ====================
export default function SessionZeroPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [activeTab, setActiveTab] = useState<PageTab>("qa");
  const [viewMode, setViewMode] = useState<ViewMode>("kp");
  const [loading, setLoading] = useState(true);

  // Q&A state
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [savingAnswers, setSavingAnswers] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState(false);

  // Safety Checklist state
  const [checklist, setChecklist] = useState<SessionZeroChecklist | null>(null);
  const [safetyResponses, setSafetyResponses] = useState<SessionZeroChecklistResponse[]>([]);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [draftResponses, setDraftResponses] = useState<Record<string, ChecklistResponseStatus>>({});
  const [savingSafety, setSavingSafety] = useState(false);
  const [savedSafety, setSavedSafety] = useState(false);
  const [initializingChecklist, setInitializingChecklist] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    const [
      { data: scenario },
      { data: participantRows },
      { data: questionRows },
      { data: answerRows },
      { data: checklistRow },
      { data: responseRows },
    ] = await Promise.all([
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
      supabase
        .from("session_zero_checklists")
        .select("*")
        .eq("scenario_id", scenarioId)
        .single(),
      supabase.from("session_zero_responses").select("*"),
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

    if (checklistRow) {
      setChecklist(checklistRow as unknown as SessionZeroChecklist);
      const filtered = (responseRows ?? []).filter(
        (r) => r.checklist_id === checklistRow.id
      );
      setSafetyResponses(filtered as unknown as SessionZeroChecklistResponse[]);
    } else {
      setChecklist(null);
      setSafetyResponses([]);
    }

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

  useEffect(() => {
    if (!playerName.trim() || !checklist) return;
    const existing = safetyResponses.find((r) => r.player_user_id === playerName.trim());
    if (existing) {
      setDraftResponses(existing.responses ?? {});
    } else {
      setDraftResponses({});
    }
  }, [playerName, checklist, safetyResponses]);

  // ==================== Q&A Handlers ====================
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

  // ==================== Safety Checklist Handlers ====================
  async function handleInitChecklist() {
    if (!isSupabaseConfigured) return;
    setInitializingChecklist(true);
    const { data } = await supabase
      .from("session_zero_checklists")
      .insert({
        scenario_id: scenarioId,
        kp_user_id: null,
        items: DEFAULT_ITEMS,
      })
      .select()
      .single();
    if (data) setChecklist(data as unknown as SessionZeroChecklist);
    setInitializingChecklist(false);
    await load();
  }

  async function handleAddItem() {
    if (!isSupabaseConfigured || !checklist || !newItemLabel.trim()) return;
    setAddingItem(true);
    const newItem: ChecklistItem = {
      id: `custom_${Date.now()}`,
      label: newItemLabel.trim(),
    };
    const updatedItems = [...checklist.items, newItem];
    await supabase
      .from("session_zero_checklists")
      .update({ items: updatedItems })
      .eq("id", checklist.id);
    setNewItemLabel("");
    await load();
    setAddingItem(false);
  }

  async function handleDeleteItem(itemId: string) {
    if (!isSupabaseConfigured || !checklist) return;
    const updatedItems = checklist.items.filter((i) => i.id !== itemId);
    await supabase
      .from("session_zero_checklists")
      .update({ items: updatedItems })
      .eq("id", checklist.id);
    await load();
  }

  async function handleSafetySave() {
    if (!isSupabaseConfigured || !checklist || !playerName.trim()) return;
    setSavingSafety(true);

    const existing = safetyResponses.find((r) => r.player_user_id === playerName.trim());
    if (existing) {
      await supabase
        .from("session_zero_responses")
        .update({ responses: draftResponses })
        .eq("id", existing.id);
    } else {
      await supabase.from("session_zero_responses").insert({
        checklist_id: checklist.id,
        player_user_id: playerName.trim(),
        responses: draftResponses,
      });
    }

    await load();
    setSavingSafety(false);
    setSavedSafety(true);
    setTimeout(() => setSavedSafety(false), 2000);
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
      {/* Back link */}
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
      <p className="text-sm text-coc-muted mb-6">PC間の関係構築・コンテンツ安全確認ツール</p>

      {/* Top tab: Q&A / Safety Checklist */}
      <div className="flex gap-2 mb-5 border-b border-coc-border pb-0">
        <button
          onClick={() => setActiveTab("qa")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === "qa"
              ? "border-coc-gold text-coc-gold"
              : "border-transparent text-coc-muted hover:text-coc-text"
          }`}
        >
          <MessageSquare size={14} />
          Q&amp;A
        </button>
        <button
          onClick={() => setActiveTab("safety")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === "safety"
              ? "border-coc-gold text-coc-gold"
              : "border-transparent text-coc-muted hover:text-coc-text"
          }`}
        >
          <ShieldCheck size={14} />
          安全確認チェックリスト
        </button>
      </div>

      {/* KP/PL view toggle */}
      <div className="flex gap-2 mb-6">
        {(["kp", "pl"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === mode
                ? "bg-coc-gold/20 border border-coc-gold text-coc-gold"
                : "border border-coc-border text-coc-muted hover:text-coc-text"
            }`}
          >
            {mode === "kp" ? "KPビュー" : "PLビュー"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-coc-muted text-sm">読み込み中...</p>
      ) : (
        <>
          {/* ==================== Q&A Tab ==================== */}
          {activeTab === "qa" && (
            <>
              {/* KP View */}
              {viewMode === "kp" && (
                <div className="flex flex-col gap-6">
                  <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4">
                    <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
                      質問を追加（KP）
                    </p>
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

                  {questions.length === 0 ? (
                    <p className="text-center text-coc-muted text-sm py-8">
                      まだ質問がありません。上のフォームから追加してください。
                    </p>
                  ) : (
                    questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
                      >
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
                              <div
                                key={a.id}
                                className="rounded-lg border border-coc-border bg-coc-bg px-3 py-2"
                              >
                                <p className="text-xs text-coc-gold mb-1">{a.character_name}</p>
                                <p className="text-sm text-coc-text whitespace-pre-wrap">
                                  {a.answer_text}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* PL View */}
              {viewMode === "pl" && (
                <div className="flex flex-col gap-6">
                  <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
                    <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
                      自分のキャラクターを選択
                    </p>
                    {characters.length === 0 ? (
                      <p className="text-sm text-coc-muted">
                        参加キャラクターが登録されていません。
                      </p>
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

                  {questions.length === 0 ? (
                    <p className="text-center text-coc-muted text-sm py-8">
                      KPがまだ質問を設定していません。
                    </p>
                  ) : selectedChar ? (
                    <>
                      <div className="flex flex-col gap-4">
                        {questions.map((q, idx) => (
                          <div
                            key={q.id}
                            className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
                          >
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

          {/* ==================== Safety Checklist Tab ==================== */}
          {activeTab === "safety" && (
            <>
              {/* KP View */}
              {viewMode === "kp" && (
                <div className="flex flex-col gap-6">
                  {!checklist ? (
                    <div className="rounded-xl border border-dashed border-coc-border px-5 py-10 text-center">
                      <ShieldCheck size={32} className="mx-auto mb-3 text-coc-muted/50" />
                      <p className="text-sm text-coc-muted mb-4">
                        安全確認チェックリストがまだ作成されていません。
                        <br />
                        KPがチェックリストを作成するとPLが回答できます。
                      </p>
                      <button
                        onClick={handleInitChecklist}
                        disabled={initializingChecklist}
                        className="rounded-lg border border-coc-gold bg-coc-gold/10 px-5 py-2.5 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50"
                      >
                        {initializingChecklist
                          ? "作成中..."
                          : "デフォルト項目でチェックリストを作成"}
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Add custom item */}
                      <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4">
                        <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
                          カスタム項目を追加
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newItemLabel}
                            onChange={(e) => setNewItemLabel(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleAddItem(); }}
                            placeholder="例：特定の恐怖症に関わる描写"
                            className="flex-1 rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
                          />
                          <button
                            onClick={handleAddItem}
                            disabled={addingItem || !newItemLabel.trim()}
                            className="flex items-center gap-1.5 rounded-lg border border-coc-gold bg-coc-gold/10 px-3 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50"
                          >
                            <Plus size={15} />
                            追加
                          </button>
                        </div>
                      </div>

                      {/* Checklist items with responses */}
                      <div className="flex flex-col gap-4">
                        {checklist.items.map((item) => {
                          const itemResponses = safetyResponses.map((r) => ({
                            player: r.player_user_id,
                            status: r.responses[item.id] as ChecklistResponseStatus | undefined,
                          })).filter((r) => r.status !== undefined);

                          const counts = {
                            ok: itemResponses.filter((r) => r.status === "ok").length,
                            ng: itemResponses.filter((r) => r.status === "ng").length,
                            consult: itemResponses.filter((r) => r.status === "consult").length,
                          };

                          return (
                            <div
                              key={item.id}
                              className={`rounded-xl border px-5 py-4 ${
                                counts.ng > 0
                                  ? "border-red-800 bg-red-950/10"
                                  : "border-coc-border bg-coc-surface"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <p className={`font-medium text-sm ${counts.ng > 0 ? "text-red-400" : "text-coc-text"}`}>
                                  {item.label}
                                  {counts.ng > 0 && (
                                    <span className="ml-2 text-xs font-normal text-red-500">
                                      NG あり
                                    </span>
                                  )}
                                </p>
                                {!DEFAULT_ITEMS.some((d) => d.id === item.id) && (
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="text-coc-muted hover:text-red-400 transition-colors flex-shrink-0"
                                    title="項目を削除"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>

                              {/* Response summary */}
                              <div className="flex gap-3 text-xs mb-3">
                                <span className="text-green-400">OK: {counts.ok}</span>
                                <span className="text-yellow-400">要相談: {counts.consult}</span>
                                <span className="text-red-400">NG: {counts.ng}</span>
                                {safetyResponses.length > 0 && itemResponses.length < safetyResponses.length && (
                                  <span className="text-coc-muted">
                                    未回答: {safetyResponses.length - itemResponses.length}
                                  </span>
                                )}
                              </div>

                              {/* Individual player responses */}
                              {itemResponses.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {itemResponses.map((r) => (
                                    <span
                                      key={r.player}
                                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                        r.status ? RESPONSE_COLORS[r.status] : ""
                                      }`}
                                    >
                                      {r.player}: {r.status ? RESPONSE_LABELS[r.status] : ""}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* All players response overview */}
                      {safetyResponses.length > 0 && (
                        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 overflow-x-auto">
                          <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
                            参加者別回答一覧
                          </p>
                          <table className="w-full text-xs min-w-max">
                            <thead>
                              <tr>
                                <th className="text-left pr-4 pb-2 text-coc-muted font-normal">
                                  プレイヤー
                                </th>
                                {checklist.items.map((item) => (
                                  <th
                                    key={item.id}
                                    className="text-center pb-2 px-2 text-coc-muted font-normal whitespace-nowrap max-w-[80px] overflow-hidden text-ellipsis"
                                    title={item.label}
                                  >
                                    {item.label.length > 8
                                      ? item.label.slice(0, 7) + "…"
                                      : item.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {safetyResponses.map((r) => (
                                <tr key={r.id} className="border-t border-coc-border/50">
                                  <td className="pr-4 py-2 text-coc-text font-medium whitespace-nowrap">
                                    {r.player_user_id}
                                  </td>
                                  {checklist.items.map((item) => {
                                    const st = r.responses[item.id] as ChecklistResponseStatus | undefined;
                                    return (
                                      <td key={item.id} className="text-center px-2 py-2">
                                        {st ? (
                                          <span
                                            className={`rounded px-1.5 py-0.5 text-xs font-medium border ${RESPONSE_COLORS[st]}`}
                                          >
                                            {RESPONSE_LABELS[st]}
                                          </span>
                                        ) : (
                                          <span className="text-coc-muted/40">—</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* PL View */}
              {viewMode === "pl" && (
                <div className="flex flex-col gap-6">
                  {!checklist ? (
                    <div className="rounded-xl border border-dashed border-coc-border px-5 py-10 text-center">
                      <p className="text-sm text-coc-muted">
                        KPがまだチェックリストを作成していません。
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Player name */}
                      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
                        <label className="block mb-2 text-xs font-medium text-coc-muted uppercase tracking-widest">
                          あなたの名前（プレイヤー名）
                        </label>
                        <input
                          type="text"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          placeholder="例：田中　/ TanakaPlayer"
                          className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
                        />
                        {safetyResponses.find((r) => r.player_user_id === playerName.trim()) && (
                          <p className="mt-1.5 text-xs text-coc-gold">
                            ✓ 既存の回答が読み込まれました。変更して再保存できます。
                          </p>
                        )}
                      </div>

                      {/* Checklist items */}
                      <div className="flex flex-col gap-4">
                        {checklist.items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
                          >
                            <p className="font-medium text-sm text-coc-text mb-3">{item.label}</p>
                            <div className="flex gap-2">
                              {RESPONSE_ORDER.map((status) => (
                                <button
                                  key={status}
                                  onClick={() =>
                                    setDraftResponses((prev) => ({
                                      ...prev,
                                      [item.id]:
                                        prev[item.id] === status ? undefined as unknown as ChecklistResponseStatus : status,
                                    }))
                                  }
                                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                                    draftResponses[item.id] === status
                                      ? RESPONSE_COLORS[status]
                                      : "border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-text"
                                  }`}
                                >
                                  {RESPONSE_LABELS[status]}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleSafetySave}
                        disabled={savingSafety || !playerName.trim()}
                        className="flex items-center gap-2 self-end rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50"
                      >
                        <Save size={15} />
                        {savedSafety ? "保存しました！" : savingSafety ? "保存中..." : "回答を保存"}
                      </button>

                      <p className="text-xs text-coc-muted leading-relaxed">
                        <strong className="text-coc-text">OK</strong> — 問題なし。描写があっても大丈夫です。
                        <br />
                        <strong className="text-coc-text">要相談</strong> — 状況によっては問題ないが、事前に相談したい。
                        <br />
                        <strong className="text-coc-text">NG</strong> — この描写はやめてほしい（理由を説明する必要はありません）。
                      </p>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
