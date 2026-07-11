"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type CharacterRow = {
  id: string;
  name: string;
  hp_current: number;
  hp_max: number;
  san_current: number;
  san_max: number;
  luck: number;
};

type ParticipantRow = {
  id: string;
  character_id: string;
  characters: CharacterRow | null;
};

type StatDraft = {
  hp_current: number;
  san_current: number;
  luck: number;
};

type Props = { params: Promise<{ id: string }> };

export default function EndSyncPage({ params }: Props) {
  const { id } = use(params);

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, StatDraft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function load() {
      const [{ data: scenario }, { data: rows }] = await Promise.all([
        supabase.from("scenarios").select("title").eq("id", id).single(),
        supabase
          .from("scenario_participants")
          .select("id, character_id, characters(id, name, hp_current, hp_max, san_current, san_max, luck)")
          .eq("scenario_id", id)
          .order("created_at", { ascending: true }),
      ]);

      setScenarioTitle(scenario?.title ?? "");
      const list = (rows ?? []) as ParticipantRow[];
      setParticipants(list);

      const initial: Record<string, StatDraft> = {};
      for (const p of list) {
        if (p.characters) {
          initial[p.character_id] = {
            hp_current: p.characters.hp_current,
            san_current: p.characters.san_current,
            luck: p.characters.luck,
          };
        }
      }
      setDrafts(initial);
      setLoading(false);
    }

    load();
  }, [id]);

  function setDraft(charId: string, field: keyof StatDraft, value: number) {
    setDrafts((prev) => ({
      ...prev,
      [charId]: { ...prev[charId], [field]: value },
    }));
  }

  async function handleBulkSync() {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    setSavedCount(null);

    const updates = participants
      .filter((p) => {
        if (!p.characters) return false;
        const d = drafts[p.character_id];
        if (!d) return false;
        const c = p.characters;
        return (
          d.hp_current !== c.hp_current ||
          d.san_current !== c.san_current ||
          d.luck !== c.luck
        );
      })
      .map((p) => {
        const d = drafts[p.character_id];
        return supabase
          .from("characters")
          .update({ hp_current: d.hp_current, san_current: d.san_current, luck: d.luck })
          .eq("id", p.character_id);
      });

    await Promise.all(updates);

    // Update local state to reflect saved values
    setParticipants((prev) =>
      prev.map((p) => {
        if (!p.characters) return p;
        const d = drafts[p.character_id];
        if (!d) return p;
        return {
          ...p,
          characters: {
            ...p.characters,
            hp_current: d.hp_current,
            san_current: d.san_current,
            luck: d.luck,
          },
        };
      })
    );

    setSavedCount(updates.length);
    setSaving(false);
  }

  const changedCount = participants.filter((p) => {
    if (!p.characters) return false;
    const d = drafts[p.character_id];
    if (!d) return false;
    const c = p.characters;
    return d.hp_current !== c.hp_current || d.san_current !== c.san_current || d.luck !== c.luck;
  }).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
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
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          セッション終了・値を確定
        </h1>
        <p className="text-xs text-coc-muted mt-1">
          VTT上で変動したHP・SAN・幸運を入力し、ポータルへ一括反映します。
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-coc-muted text-center py-12">読み込み中...</p>
      ) : participants.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">参加キャラクターが登録されていません。</p>
          <Link
            href={`/scenarios/${id}/participants`}
            className="mt-3 inline-block text-xs text-coc-gold hover:underline"
          >
            参加キャラクターを追加 →
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {participants.map((p) => {
              const char = p.characters;
              if (!char) return null;
              const d = drafts[p.character_id] ?? {
                hp_current: char.hp_current,
                san_current: char.san_current,
                luck: char.luck,
              };
              const changed =
                d.hp_current !== char.hp_current ||
                d.san_current !== char.san_current ||
                d.luck !== char.luck;

              return (
                <div
                  key={p.id}
                  className={`rounded-xl border px-5 py-4 ${changed ? "border-coc-gold-dim bg-coc-raised" : "border-coc-border bg-coc-surface"}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-coc-text">{char.name}</p>
                    {changed && (
                      <span className="text-xs text-coc-gold">変更あり</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-coc-muted mb-1">
                        HP
                        <span className="ml-1 text-coc-faint">/ {char.hp_max}</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={char.hp_max}
                        value={d.hp_current}
                        onChange={(e) =>
                          setDraft(p.character_id, "hp_current", Number(e.target.value))
                        }
                        className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-1.5 text-sm text-coc-text focus:border-coc-gold focus:outline-none tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-coc-muted mb-1">
                        SAN
                        <span className="ml-1 text-coc-faint">/ {char.san_max}</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={char.san_max}
                        value={d.san_current}
                        onChange={(e) =>
                          setDraft(p.character_id, "san_current", Number(e.target.value))
                        }
                        className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-1.5 text-sm text-coc-text focus:border-coc-gold focus:outline-none tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-coc-muted mb-1">
                        幸運
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={d.luck}
                        onChange={(e) =>
                          setDraft(p.character_id, "luck", Number(e.target.value))
                        }
                        className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-1.5 text-sm text-coc-text focus:border-coc-gold focus:outline-none tabular-nums"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {savedCount !== null && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-800 bg-green-950/20 px-4 py-3">
              <CheckCircle2 size={15} className="text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-300">
                {savedCount === 0
                  ? "変更はありませんでした。"
                  : `${savedCount}件のキャラクターを更新しました。`}
              </p>
            </div>
          )}

          <button
            onClick={handleBulkSync}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-coc-gold bg-coc-gold/10 px-5 py-3 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={15} className={saving ? "animate-spin" : ""} />
            {saving
              ? "反映中..."
              : changedCount > 0
              ? `一括反映（${changedCount}件を更新）`
              : "一括反映"}
          </button>

          <p className="mt-3 text-xs text-coc-muted text-center">
            変更のないキャラクターはスキップされます。
          </p>
        </>
      )}
    </div>
  );
}
