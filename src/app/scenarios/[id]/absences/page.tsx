"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Save, Trash2 } from "lucide-react";
import { supabase, isSupabaseConfigured, CharacterAbsence } from "@/lib/supabase";

type Participant = {
  character_id: string;
  characters: { name: string } | null;
};

type AbsenceFormData = {
  session_number: string;
  reason: string;
  action_taken: string;
  return_condition: string;
};

const EMPTY_FORM: AbsenceFormData = {
  session_number: "",
  reason: "",
  action_taken: "",
  return_condition: "",
};

export default function AbsencesPage() {
  const { id: scenarioId } = useParams<{ id: string }>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [absencesByChar, setAbsencesByChar] = useState<Record<string, CharacterAbsence[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingForChar, setAddingForChar] = useState<string | null>(null);
  const [formData, setFormData] = useState<AbsenceFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    async function load() {
      const [{ data: parts }, { data: abs }] = await Promise.all([
        supabase
          .from("scenario_participants")
          .select("character_id, characters(name)")
          .eq("scenario_id", scenarioId),
        supabase
          .from("character_absences")
          .select("*")
          .eq("scenario_id", scenarioId)
          .order("created_at", { ascending: true }),
      ]);
      setParticipants((parts as Participant[]) ?? []);
      const grouped: Record<string, CharacterAbsence[]> = {};
      for (const a of (abs as CharacterAbsence[]) ?? []) {
        if (!grouped[a.character_id]) grouped[a.character_id] = [];
        grouped[a.character_id].push(a);
      }
      setAbsencesByChar(grouped);
      setLoading(false);
    }
    load();
  }, [scenarioId]);

  async function handleAdd(characterId: string) {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    const payload = {
      scenario_id: scenarioId,
      character_id: characterId,
      session_number: formData.session_number ? parseInt(formData.session_number, 10) : null,
      reason: formData.reason || null,
      action_taken: formData.action_taken || null,
      return_condition: formData.return_condition || null,
    };
    const { data, error } = await supabase
      .from("character_absences")
      .insert(payload)
      .select("*")
      .single();
    if (!error && data) {
      setAbsencesByChar((prev) => ({
        ...prev,
        [characterId]: [...(prev[characterId] ?? []), data as CharacterAbsence],
      }));
      setFormData(EMPTY_FORM);
      setAddingForChar(null);
    }
    setSaving(false);
  }

  async function handleDelete(absenceId: string, characterId: string) {
    if (!isSupabaseConfigured) return;
    setDeletingId(absenceId);
    const { error } = await supabase
      .from("character_absences")
      .delete()
      .eq("id", absenceId);
    if (!error) {
      setAbsencesByChar((prev) => ({
        ...prev,
        [characterId]: (prev[characterId] ?? []).filter((a) => a.id !== absenceId),
      }));
    }
    setDeletingId(null);
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted text-sm">Supabase が設定されていません。</p>
      </div>
    );
  }

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/scenarios/${scenarioId}`}
        className="mb-6 flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
      >
        <ArrowLeft size={16} />
        シナリオ詳細
      </Link>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">欠席探索者行動記録</h1>
      <p className="text-xs text-coc-muted mb-6">
        PLが欠席したセッションでキャラクターの在処・代理行動・復帰条件を記録します
      </p>

      {loading ? (
        <p className="text-coc-muted text-sm text-center py-12">読み込み中...</p>
      ) : participants.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">参加キャラクターが登録されていません。</p>
          <Link
            href={`/scenarios/${scenarioId}/participants`}
            className="mt-2 inline-block text-xs text-coc-gold hover:underline"
          >
            参加者を登録する →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {participants.map((p) => {
            const charName = p.characters?.name ?? "不明なキャラクター";
            const charAbsences = absencesByChar[p.character_id] ?? [];
            const isExpanded = expandedId === p.character_id;
            const isAdding = addingForChar === p.character_id;

            return (
              <div
                key={p.character_id}
                className="rounded-xl border border-coc-border bg-coc-surface overflow-hidden"
              >
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : p.character_id);
                    if (addingForChar === p.character_id) setAddingForChar(null);
                  }}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-coc-raised transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-cinzel font-semibold text-coc-text">{charName}</span>
                    {charAbsences.length > 0 && (
                      <span className="rounded-full border border-red-900 bg-red-950/40 px-2 py-0.5 text-xs text-red-400">
                        欠席記録 {charAbsences.length}件
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-coc-muted shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-coc-muted shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-coc-border px-5 py-4 space-y-4">
                    {charAbsences.length === 0 && !isAdding && (
                      <p className="text-sm text-coc-muted">欠席記録がありません</p>
                    )}

                    {charAbsences.length > 0 && (
                      <div className="space-y-3">
                        {charAbsences.map((a) => (
                          <div
                            key={a.id}
                            className="relative rounded-lg border border-coc-border bg-coc-raised px-4 py-3 space-y-1.5"
                          >
                            {a.session_number != null && (
                              <p className="text-xs font-semibold text-coc-gold">
                                第{a.session_number}セッション
                              </p>
                            )}
                            {a.reason && (
                              <div>
                                <p className="text-xs text-coc-muted">欠席理由（劇中）</p>
                                <p className="text-sm text-coc-text whitespace-pre-wrap">{a.reason}</p>
                              </div>
                            )}
                            {a.action_taken && (
                              <div>
                                <p className="text-xs text-coc-muted">代理行動</p>
                                <p className="text-sm text-coc-text whitespace-pre-wrap">{a.action_taken}</p>
                              </div>
                            )}
                            {a.return_condition && (
                              <div>
                                <p className="text-xs text-coc-muted">復帰条件</p>
                                <p className="text-sm text-coc-text whitespace-pre-wrap">{a.return_condition}</p>
                              </div>
                            )}
                            <button
                              onClick={() => handleDelete(a.id, p.character_id)}
                              disabled={deletingId === a.id}
                              className="absolute right-3 top-3 text-coc-faint hover:text-red-400 transition-colors disabled:opacity-50"
                              title="削除"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {isAdding ? (
                      <div className="rounded-lg border border-coc-border bg-coc-raised px-4 py-4 space-y-3">
                        <p className="text-xs font-semibold text-coc-gold">新しい欠席記録</p>
                        <div>
                          <label className="mb-1 block text-xs text-coc-muted">
                            セッション番号（任意）
                          </label>
                          <input
                            type="number"
                            value={formData.session_number}
                            onChange={(e) =>
                              setFormData((f) => ({ ...f, session_number: e.target.value }))
                            }
                            placeholder="例: 3"
                            className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-1.5 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-coc-muted">
                            欠席理由（劇中）
                          </label>
                          <textarea
                            value={formData.reason}
                            onChange={(e) =>
                              setFormData((f) => ({ ...f, reason: e.target.value }))
                            }
                            placeholder="例: 急病で入院中のため隊を離れた"
                            rows={2}
                            className="w-full resize-none rounded-lg border border-coc-border bg-coc-bg px-3 py-1.5 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-coc-muted">代理行動</label>
                          <textarea
                            value={formData.action_taken}
                            onChange={(e) =>
                              setFormData((f) => ({ ...f, action_taken: e.target.value }))
                            }
                            placeholder="例: 図書館で資料を調査していた（KP処理）"
                            rows={2}
                            className="w-full resize-none rounded-lg border border-coc-border bg-coc-bg px-3 py-1.5 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-coc-muted">復帰条件</label>
                          <textarea
                            value={formData.return_condition}
                            onChange={(e) =>
                              setFormData((f) => ({ ...f, return_condition: e.target.value }))
                            }
                            placeholder="例: 次回セッションから復帰予定"
                            rows={2}
                            className="w-full resize-none rounded-lg border border-coc-border bg-coc-bg px-3 py-1.5 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAdd(p.character_id)}
                            disabled={saving}
                            className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-surface px-3 py-1.5 text-xs text-coc-gold hover:border-coc-gold transition-colors disabled:opacity-50"
                          >
                            <Save size={13} />
                            {saving ? "保存中..." : "保存"}
                          </button>
                          <button
                            onClick={() => {
                              setAddingForChar(null);
                              setFormData(EMPTY_FORM);
                            }}
                            className="rounded-lg border border-coc-border px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text transition-colors"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingForChar(p.character_id);
                          setFormData(EMPTY_FORM);
                        }}
                        className="flex items-center gap-1.5 text-xs text-coc-gold hover:underline transition-colors"
                      >
                        <Plus size={13} />
                        欠席記録を追加
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
