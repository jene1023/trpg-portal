"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, PlayerCheckin } from "@/lib/supabase";

type CharacterOption = { id: string; name: string; player_name: string | null };

type CheckinWithCharacter = PlayerCheckin & {
  characters: { name: string; player_name: string | null } | null;
};

function EnergyInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const labels = ["", "かなりしんどい", "少し疲れ気味", "普通", "やる気あり", "絶好調！"];
  return (
    <div>
      <p className="text-xs text-coc-muted mb-2">今日のコンディション（1〜5）</p>
      <div className="flex gap-2 items-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-10 h-10 rounded-full border text-sm font-bold transition-colors ${
              n <= value
                ? "border-coc-gold bg-coc-gold/20 text-coc-gold"
                : "border-coc-border text-coc-muted hover:border-coc-gold-dim"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="mt-1.5 text-xs text-coc-gold">{labels[value]}</p>
      )}
    </div>
  );
}

function EnergyBadge({ level }: { level: number }) {
  const colors = [
    "",
    "bg-red-900/30 text-red-400 border-red-800",
    "bg-orange-900/30 text-orange-400 border-orange-800",
    "bg-yellow-900/30 text-yellow-400 border-yellow-800",
    "bg-green-900/30 text-green-400 border-green-800",
    "bg-coc-gold/20 text-coc-gold border-coc-gold-dim",
  ];
  const labels = ["", "1 かなりしんどい", "2 少し疲れ気味", "3 普通", "4 やる気あり", "5 絶好調！"];
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[level]}`}>
      {labels[level]}
    </span>
  );
}

export default function CheckinPage() {
  const params = useParams<{ id: string }>();
  const scenarioId = params.id;

  const [scenarioTitle, setScenarioTitle] = useState("");
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [checkins, setCheckins] = useState<CheckinWithCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [energyLevel, setEnergyLevel] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    async function load() {
      const [{ data: scenario }, { data: participants }, { data: checkinRows }] =
        await Promise.all([
          supabase.from("scenarios").select("title").eq("id", scenarioId).single(),
          supabase
            .from("scenario_participants")
            .select("character_id, characters(id, name, player_name)")
            .eq("scenario_id", scenarioId),
          supabase
            .from("player_checkins")
            .select("*, characters(name, player_name)")
            .eq("scenario_id", scenarioId)
            .order("checked_in_at", { ascending: false }),
        ]);

      setScenarioTitle(scenario?.title ?? "");

      const chars: CharacterOption[] = [];
      for (const p of participants ?? []) {
        const c = p.characters as unknown as CharacterOption | null;
        if (c) chars.push(c);
      }
      setCharacters(chars);
      setCheckins((checkinRows ?? []) as unknown as CheckinWithCharacter[]);
      setLoading(false);
    }

    load();
  }, [scenarioId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || !selectedCharacterId || energyLevel === 0) return;

    setSaving(true);
    await supabase.from("player_checkins").upsert(
      {
        scenario_id: scenarioId,
        character_id: selectedCharacterId,
        energy_level: energyLevel,
        comment: comment.trim() || null,
        checked_in_at: new Date().toISOString(),
      },
      { onConflict: "scenario_id,character_id" }
    );

    const { data: updated } = await supabase
      .from("player_checkins")
      .select("*, characters(name, player_name)")
      .eq("scenario_id", scenarioId)
      .order("checked_in_at", { ascending: false });

    setCheckins((updated ?? []) as unknown as CheckinWithCharacter[]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {scenarioTitle || "シナリオ詳細"}
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">
        セッション前チェックイン
      </h1>
      <p className="text-xs text-coc-muted mb-6">
        今日のコンディションと一言をセッション前に共有しましょう
      </p>

      {loading ? (
        <p className="text-sm text-coc-muted">読み込み中...</p>
      ) : !isSupabaseConfigured ? (
        <p className="text-sm text-coc-muted">Supabase が設定されていません</p>
      ) : (
        <>
          {/* チェックインフォーム */}
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5 mb-6 flex flex-col gap-4"
          >
            <div>
              <label className="text-xs text-coc-muted block mb-1.5">キャラクター</label>
              <select
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold"
                required
              >
                <option value="">キャラクターを選択</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.player_name ? ` (${c.player_name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <EnergyInput value={energyLevel} onChange={setEnergyLevel} />

            <div>
              <label className="text-xs text-coc-muted block mb-1.5">
                一言コメント（期待・懸念など）
                <span className="ml-1 text-coc-muted/60">任意</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="今日のひとこと..."
                className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving || energyLevel === 0 || !selectedCharacterId}
              className="rounded-lg bg-coc-gold px-4 py-2.5 text-sm font-semibold text-coc-bg hover:bg-coc-gold/90 disabled:opacity-40 transition-colors"
            >
              {saving ? "送信中..." : saved ? "送信しました！" : "チェックインする"}
            </button>
          </form>

          {/* KP向け全参加者チェックイン一覧 */}
          {checkins.length > 0 && (
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-5">
              <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
                参加者チェックイン状況
              </p>
              <div className="flex flex-col gap-3">
                {checkins.map((ci) => {
                  const charName = ci.characters?.name ?? "不明";
                  const playerName = ci.characters?.player_name;
                  return (
                    <div
                      key={ci.id}
                      className="rounded-lg border border-coc-border bg-coc-bg px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-coc-text">
                          {charName}
                          {playerName && (
                            <span className="ml-1.5 text-xs text-coc-muted font-normal">
                              ({playerName})
                            </span>
                          )}
                        </p>
                        <EnergyBadge level={ci.energy_level} />
                      </div>
                      {ci.comment && (
                        <p className="text-xs text-coc-muted mt-1 leading-relaxed">
                          {ci.comment}
                        </p>
                      )}
                      <p className="text-xs text-coc-muted/50 mt-1">
                        {new Date(ci.checked_in_at).toLocaleString("ja-JP", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {checkins.length === 0 && (
            <div className="rounded-xl border border-dashed border-coc-border px-5 py-8 text-center">
              <p className="text-sm text-coc-muted">まだ誰もチェックインしていません</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
