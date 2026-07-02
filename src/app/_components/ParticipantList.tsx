"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { supabase, isSupabaseConfigured, Character, ScenarioParticipant, AttendanceStatus, Player } from "@/lib/supabase";

type CharacterSummary = Pick<Character, "id" | "name" | "player_name" | "occupation">;

type ParticipantWithCharacter = ScenarioParticipant & {
  characters: CharacterSummary;
};

type Props = {
  scenarioId: string;
  initialParticipants: ParticipantWithCharacter[];
  allCharacters: CharacterSummary[];
  allPlayers: Player[];
};

const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  unconfirmed: "未定",
  attending: "参加",
  absent: "欠席",
};

const ATTENDANCE_COLORS: Record<AttendanceStatus, string> = {
  unconfirmed: "text-coc-muted border-coc-border",
  attending: "text-green-400 border-green-800",
  absent: "text-red-400 border-red-900",
};

export default function ParticipantList({ scenarioId, initialParticipants, allCharacters, allPlayers }: Props) {
  const [participants, setParticipants] = useState<ParticipantWithCharacter[]>(initialParticipants);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [adding, setAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  async function handleAttendanceChange(participantId: string, status: AttendanceStatus) {
    if (!isSupabaseConfigured) return;
    setUpdatingId(participantId);
    const { error } = await supabase
      .from("scenario_participants")
      .update({ attendance_status: status })
      .eq("id", participantId);
    if (!error) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, attendance_status: status } : p))
      );
    }
    setUpdatingId(null);
  }

  async function handlePlayerChange(participantId: string, playerId: string) {
    if (!isSupabaseConfigured) return;
    setUpdatingId(participantId);
    const value = playerId || null;
    const { error } = await supabase
      .from("scenario_participants")
      .update({ player_id: value })
      .eq("id", participantId);
    if (!error) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, player_id: value } : p))
      );
    }
    setUpdatingId(null);
  }

  const attendingCount = participants.filter((p) => p.attendance_status === "attending").length;
  const absentCount = participants.filter((p) => p.attendance_status === "absent").length;
  const unconfirmedCount = participants.filter((p) => p.attendance_status === "unconfirmed").length;

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
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-cinzel text-sm font-semibold text-coc-text">
            参加キャラクター{" "}
            <span className="text-coc-muted font-normal">({participants.length}名)</span>
          </h2>
          {participants.length > 0 && (
            <div className="flex gap-2 text-xs">
              <span className="text-green-400">参加 {attendingCount}</span>
              <span className="text-red-400">欠席 {absentCount}</span>
              <span className="text-coc-muted">未定 {unconfirmedCount}</span>
            </div>
          )}
        </div>
        {participants.length === 0 ? (
          <p className="text-center text-coc-muted text-sm py-8">
            参加キャラクターが登録されていません
          </p>
        ) : (
          <div className="space-y-2">
            {participants.map((p) => {
              const linkedPlayer = allPlayers.find((pl) => pl.id === p.player_id);
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-coc-border bg-coc-surface px-4 py-3 gap-3"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
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
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={p.attendance_status ?? "unconfirmed"}
                        onChange={(e) => handleAttendanceChange(p.id, e.target.value as AttendanceStatus)}
                        disabled={updatingId === p.id}
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium bg-transparent focus:outline-none focus:border-coc-gold transition-colors disabled:opacity-50 ${ATTENDANCE_COLORS[p.attendance_status ?? "unconfirmed"]}`}
                      >
                        {(Object.keys(ATTENDANCE_LABELS) as AttendanceStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {ATTENDANCE_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemove(p.id)}
                        className="text-coc-faint hover:text-red-400 transition-colors"
                        title="参加者から除外"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                  {/* プレイヤー紐付け */}
                  {allPlayers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-coc-muted shrink-0">PL:</span>
                      <select
                        value={p.player_id ?? ""}
                        onChange={(e) => handlePlayerChange(p.id, e.target.value)}
                        disabled={updatingId === p.id}
                        className="flex-1 rounded-md border border-coc-border bg-coc-raised px-2 py-0.5 text-xs text-coc-text focus:outline-none focus:border-coc-gold transition-colors disabled:opacity-50"
                      >
                        <option value="">プレイヤー未設定</option>
                        {allPlayers.map((pl) => (
                          <option key={pl.id} value={pl.id}>
                            {pl.display_name}
                          </option>
                        ))}
                      </select>
                      {linkedPlayer && (
                        <Link
                          href="/players"
                          className="text-xs text-coc-gold hover:underline shrink-0"
                        >
                          詳細
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {allPlayers.length === 0 && (
        <p className="text-xs text-coc-muted text-center">
          <Link href="/players/new" className="text-coc-gold hover:underline">
            プレイヤーを登録
          </Link>
          するとキャラクターに紐づけられます
        </p>
      )}
    </div>
  );
}
