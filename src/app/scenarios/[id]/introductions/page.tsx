"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Check, X } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionIntroduction } from "@/lib/supabase";

type ParticipantCard = {
  character_id: string;
  character_name: string;
  occupation: string | null;
  catchphrase: string | null;
  speech_style: string | null;
  introduction: SessionIntroduction | null;
};

export default function IntroductionsPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [cards, setCards] = useState<ParticipantCard[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [motivation, setMotivation] = useState("");
  const [secretGoal, setSecretGoal] = useState("");
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

      const { data: participants } = await supabase
        .from("scenario_participants")
        .select("character_id, characters(id, name, occupation, catchphrase, speech_style)")
        .eq("scenario_id", scenarioId);

      if (!participants || participants.length === 0) {
        setLoading(false);
        return;
      }

      const characterIds = participants.map((p) => p.character_id);

      const { data: introRows } = await supabase
        .from("session_introductions")
        .select("*")
        .eq("scenario_id", scenarioId)
        .in("character_id", characterIds);

      const introMap: Record<string, SessionIntroduction> = {};
      for (const row of introRows ?? []) {
        introMap[row.character_id] = row as SessionIntroduction;
      }

      const newCards: ParticipantCard[] = participants.map((p) => {
        const char = (p.characters as unknown) as {
          id: string;
          name: string;
          occupation: string | null;
          catchphrase: string | null;
          speech_style: string | null;
        } | null;
        return {
          character_id: p.character_id,
          character_name: char?.name ?? "",
          occupation: char?.occupation ?? null,
          catchphrase: char?.catchphrase ?? null,
          speech_style: char?.speech_style ?? null,
          introduction: introMap[p.character_id] ?? null,
        };
      });

      setCards(newCards);
      setLoading(false);
    }

    load();
  }, [scenarioId]);

  function startEdit(card: ParticipantCard) {
    setEditingId(card.character_id);
    setMotivation(card.introduction?.motivation ?? "");
    setSecretGoal(card.introduction?.secret_goal ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setMotivation("");
    setSecretGoal("");
  }

  async function handleSave(characterId: string) {
    if (!isSupabaseConfigured) return;
    setSaving(true);

    const existing = cards.find((c) => c.character_id === characterId)?.introduction;

    let saved: SessionIntroduction | null = null;

    if (existing) {
      const { data } = await supabase
        .from("session_introductions")
        .update({
          motivation: motivation.trim() || null,
          secret_goal: secretGoal.trim() || null,
        })
        .eq("id", existing.id)
        .select()
        .single();
      saved = data as SessionIntroduction | null;
    } else {
      const { data } = await supabase
        .from("session_introductions")
        .insert({
          scenario_id: scenarioId,
          character_id: characterId,
          motivation: motivation.trim() || null,
          secret_goal: secretGoal.trim() || null,
        })
        .select()
        .single();
      saved = data as SessionIntroduction | null;
    }

    if (saved) {
      setCards((prev) =>
        prev.map((c) =>
          c.character_id === characterId ? { ...c, introduction: saved } : c
        )
      );
    }

    setEditingId(null);
    setMotivation("");
    setSecretGoal("");
    setSaving(false);
  }

  async function handleDelete(characterId: string) {
    if (!isSupabaseConfigured) return;
    const intro = cards.find((c) => c.character_id === characterId)?.introduction;
    if (!intro) return;
    await supabase.from("session_introductions").delete().eq("id", intro.id);
    setCards((prev) =>
      prev.map((c) =>
        c.character_id === characterId ? { ...c, introduction: null } : c
      )
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
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        {scenarioTitle && (
          <p className="text-xs text-coc-muted mb-1">{scenarioTitle}</p>
        )}
        <h1 className="font-cinzel text-xl font-bold text-coc-text">キャラクター自己紹介</h1>
        <p className="text-xs text-coc-muted mt-1">
          セッション前にキャラクターの動機・秘密の目標を入力して参加者全員で共有できます
        </p>
      </div>

      {loading ? (
        <p className="text-center text-coc-muted text-sm py-8">読み込み中...</p>
      ) : cards.length === 0 ? (
        <p className="text-center text-coc-muted text-sm py-8">
          参加キャラクターがまだ登録されていません
        </p>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => {
            const isEditing = editingId === card.character_id;
            return (
              <div
                key={card.character_id}
                className="rounded-xl border border-coc-border bg-coc-surface p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-coc-text">{card.character_name}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {card.occupation && (
                        <span className="text-xs text-coc-muted">{card.occupation}</span>
                      )}
                      {card.catchphrase && (
                        <span className="text-xs text-coc-gold italic">「{card.catchphrase}」</span>
                      )}
                    </div>
                    {card.speech_style && (
                      <p className="text-xs text-coc-muted mt-0.5">口調: {card.speech_style}</p>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(card)}
                        className="flex items-center gap-1 rounded-lg border border-coc-border bg-coc-raised px-2.5 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
                      >
                        {card.introduction ? (
                          <>
                            <Pencil size={12} />
                            編集
                          </>
                        ) : (
                          <>
                            <Plus size={12} />
                            入力
                          </>
                        )}
                      </button>
                      {card.introduction && (
                        <button
                          onClick={() => handleDelete(card.character_id)}
                          className="rounded-lg border border-coc-border bg-coc-raised p-1.5 text-coc-faint hover:text-red-400 hover:border-red-800 transition-colors"
                          title="削除"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2 pt-1 border-t border-coc-border">
                    <div>
                      <label className="block text-xs text-coc-muted mb-1">動機</label>
                      <textarea
                        value={motivation}
                        onChange={(e) => setMotivation(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors resize-none"
                        placeholder="このシナリオに参加する動機・目的"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-coc-muted mb-1">秘密の目標</label>
                      <textarea
                        value={secretGoal}
                        onChange={(e) => setSecretGoal(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors resize-none"
                        placeholder="他のPLには内緒の個人目標（任意）"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSave(card.character_id)}
                        disabled={saving}
                        className="flex items-center gap-1 rounded-lg bg-coc-gold px-3 py-1.5 text-xs font-semibold text-coc-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        <Check size={12} />
                        {saving ? "保存中..." : "保存"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-xs text-coc-muted hover:text-coc-text transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : card.introduction ? (
                  <div className="space-y-2 pt-1 border-t border-coc-border">
                    {card.introduction.motivation && (
                      <div>
                        <p className="text-xs text-coc-muted mb-0.5">動機</p>
                        <p className="font-crimson text-coc-text text-[15px] leading-relaxed whitespace-pre-wrap border-l-2 border-coc-gold-dim pl-3">
                          {card.introduction.motivation}
                        </p>
                      </div>
                    )}
                    {card.introduction.secret_goal && (
                      <div>
                        <p className="text-xs text-coc-muted mb-0.5">秘密の目標</p>
                        <p className="font-crimson text-coc-text text-[15px] leading-relaxed whitespace-pre-wrap border-l-2 border-red-800 pl-3">
                          {card.introduction.secret_goal}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-coc-faint pt-1 border-t border-coc-border">
                    未入力 — 「入力」ボタンから動機・目標を追加できます
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
