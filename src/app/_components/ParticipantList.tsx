"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { supabase, isSupabaseConfigured, Character, ScenarioParticipant } from "@/lib/supabase";

type CharacterSummary = Pick<Character, "id" | "name" | "player_name" | "occupation">;

type ParticipantWithCharacter = ScenarioParticipant & {
  characters: CharacterSummary;
};

type Props = {
  scenarioId: string;
  initialParticipants: ParticipantWithCharacter[];
  allCharacters: CharacterSummary[];
};

export default function ParticipantList({ scenarioId, initialParticipants, allCharacters }: Props) {
  const [participants, setParticipants] = useState<ParticipantWithCharacter[]>(initialParticipants);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [adding, setAdding] = useState(false);

  const participantIds = new Set(participants.map((p) => p.character_id));
  const available = allCharacters.filter((c) => !participantIds.has(c.id));

  async function handleAdd() {
    if (!isSupabaseConfigured || !selectedCharacterId) return;
    setAdding(true);

    const { data, error } = await supabase
      .from("scenario_participants")
      .insert({ scenario_id: scenarioId, character_id: selectedCharacterId })
      .select("*, characters(id, name, player_name, occupation)")
      .single();

    if (!error && data) {
      setParticipants((prev) => [...prev, data as ParticipantWithCharacter]);
      setSelectedCharacterId("");
    }
    setAdding(false);
  }

  async function handleRemove(participantId: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("scenario_participants").delete().eq("id", participantId);
    setParticipants((prev) => prev.filter((p) => p.id !== participantId));
  }

  return (
    <div className="space-y-6">
      {/* 追加フォーム */}
      <div className="rounded-xl border border-coc-border bg-coc-surface p-4">
        <h2 className="font-cinzel text-sm font-semibold text-coc-text mb-3">
          キャラクターを追加
        </h2>
        {available.length === 0 ? (
          <p className="text-sm text-coc-muted">追加できるキャラクターがいません</p>
        ) : (
          <div className="flex gap-2">
            <select
              value={selectedCharacterId}
              onChange={(e) => setSelectedCharacterId(e.target.value)}
              className="flex-1 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold transition-colors"
            >
              <option value="">キャラクターを選択...</option>
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.player_name ? ` (${c.player_name})` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!selectedCharacterId || adding}
              className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-raised px-3 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors disabled:opacity-50"
            >
              <Plus size={16} />
              追加
            </button>
          </div>
        )}
      </div>

      {/* 参加者一覧 */}
      <div>
        <h2 className="font-cinzel text-sm font-semibold text-coc-text mb-3">
          参加キャラクター{" "}
          <span className="text-coc-muted font-normal">({participants.length}名)</span>
        </h2>
        {participants.length === 0 ? (
          <p className="text-center text-coc-muted text-sm py-8">
            参加キャラクターが登録されていません
          </p>
        ) : (
          <div className="space-y-2">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-coc-border bg-coc-surface px-4 py-3"
              >
                <div>
                  <Link
                    href={`/characters/${p.character_id}`}
                    className="font-cinzel font-semibold text-coc-text text-sm hover:text-coc-gold transition-colors"
                  >
                    {p.characters.name}
                  </Link>
                  {(p.characters.player_name || p.characters.occupation) && (
                    <p className="text-xs text-coc-muted mt-0.5">
                      {[p.characters.player_name, p.characters.occupation]
                        .filter(Boolean)
                        .join(" / ")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(p.id)}
                  className="text-coc-faint hover:text-red-400 transition-colors"
                  title="参加者から除外"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
