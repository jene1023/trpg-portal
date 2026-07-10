"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, CharacterKeepsake } from "@/lib/supabase";

type Props = {
  characterId: string;
  initialKeepsakes: CharacterKeepsake[];
};

export default function KeepsakesClient({ characterId, initialKeepsakes }: Props) {
  const [keepsakes, setKeepsakes] = useState<CharacterKeepsake[]>(initialKeepsakes);
  const [name, setName] = useState("");
  const [obtainedFrom, setObtainedFrom] = useState("");
  const [sessionLabel, setSessionLabel] = useState("");
  const [storyNotes, setStoryNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeKeepsakes = keepsakes.filter((k) => !k.is_lost);
  const lostKeepsakes = keepsakes.filter((k) => k.is_lost);

  async function addKeepsake() {
    if (!name.trim()) return;
    if (!isSupabaseConfigured) return;
    setSaving(true);
    setError("");
    const { data, error: err } = await supabase
      .from("character_keepsakes")
      .insert({
        character_id: characterId,
        name: name.trim(),
        obtained_from: obtainedFrom.trim() || null,
        session_label: sessionLabel.trim() || null,
        story_notes: storyNotes.trim() || null,
        is_lost: false,
      })
      .select()
      .single();
    setSaving(false);
    if (err || !data) {
      setError("追加に失敗しました");
      return;
    }
    setKeepsakes((prev) => [...prev, data as CharacterKeepsake]);
    setName("");
    setObtainedFrom("");
    setSessionLabel("");
    setStoryNotes("");
  }

  async function toggleLost(keepsakeId: string, isLost: boolean) {
    if (!isSupabaseConfigured) return;
    const { data, error: err } = await supabase
      .from("character_keepsakes")
      .update({ is_lost: isLost })
      .eq("id", keepsakeId)
      .select()
      .single();
    if (err || !data) return;
    setKeepsakes((prev) =>
      prev.map((k) => (k.id === keepsakeId ? (data as CharacterKeepsake) : k))
    );
  }

  async function deleteKeepsake(keepsakeId: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("character_keepsakes").delete().eq("id", keepsakeId);
    setKeepsakes((prev) => prev.filter((k) => k.id !== keepsakeId));
  }

  return (
    <div className="space-y-6">
      {/* 追加フォーム */}
      <div className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">記念品を追加</h2>
        <input
          type="text"
          placeholder="アイテム名（例: 山田刑事の懐中時計）"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60"
        />
        <input
          type="text"
          placeholder="入手元NPC・シナリオ（任意）"
          value={obtainedFrom}
          onChange={(e) => setObtainedFrom(e.target.value)}
          className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60"
        />
        <input
          type="text"
          placeholder="セッション名（任意）"
          value={sessionLabel}
          onChange={(e) => setSessionLabel(e.target.value)}
          className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60"
        />
        <textarea
          placeholder="入手時の経緯・感情的な意味（任意）"
          value={storyNotes}
          onChange={(e) => setStoryNotes(e.target.value)}
          rows={3}
          className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60 resize-none"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={addKeepsake}
          disabled={saving || !name.trim()}
          className="rounded bg-coc-gold/20 border border-coc-gold/50 px-4 py-1.5 text-sm text-coc-gold hover:bg-coc-gold/30 transition-colors disabled:opacity-50"
        >
          {saving ? "追加中..." : "追加"}
        </button>
      </div>

      {/* 所持している記念品 */}
      {activeKeepsakes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">
            記念品リスト ({activeKeepsakes.length}件)
          </h2>
          {activeKeepsakes.map((k) => (
            <KeepsakeCard
              key={k.id}
              keepsake={k}
              onToggleLost={toggleLost}
              onDelete={deleteKeepsake}
            />
          ))}
        </div>
      )}

      {activeKeepsakes.length === 0 && lostKeepsakes.length === 0 && (
        <p className="text-center text-sm text-coc-muted py-8">
          記念品が登録されていません
        </p>
      )}

      {/* 失った記念品 */}
      {lostKeepsakes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">
            失った記念品
          </h2>
          {lostKeepsakes.map((k) => (
            <KeepsakeCard
              key={k.id}
              keepsake={k}
              onToggleLost={toggleLost}
              onDelete={deleteKeepsake}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KeepsakeCard({
  keepsake,
  onToggleLost,
  onDelete,
}: {
  keepsake: CharacterKeepsake;
  onToggleLost: (id: string, isLost: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div
      className={`rounded-lg border p-4 space-y-2 ${
        keepsake.is_lost
          ? "border-coc-border/40 bg-coc-void/40 opacity-70"
          : "border-coc-border bg-coc-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className={`font-semibold text-sm leading-snug ${
              keepsake.is_lost ? "line-through text-coc-muted" : "text-coc-text"
            }`}
          >
            {keepsake.name}
          </p>
          {keepsake.obtained_from && (
            <p className="text-xs text-coc-muted mt-0.5">
              入手元: {keepsake.obtained_from}
            </p>
          )}
          {keepsake.session_label && (
            <p className="text-xs text-coc-muted/70 mt-0.5">
              セッション: {keepsake.session_label}
            </p>
          )}
        </div>
        {keepsake.is_lost && (
          <span className="shrink-0 rounded border border-red-800/60 bg-red-950/20 px-2 py-0.5 text-xs text-red-400 font-semibold">
            失った
          </span>
        )}
      </div>

      {keepsake.story_notes && (
        <p className="font-crimson text-sm text-coc-text/80 leading-relaxed whitespace-pre-wrap border-l-2 border-coc-gold/30 pl-3">
          {keepsake.story_notes}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        {keepsake.is_lost ? (
          <button
            onClick={() => onToggleLost(keepsake.id, false)}
            className="rounded border border-coc-border px-2.5 py-1 text-xs text-coc-muted hover:text-coc-text transition-colors"
          >
            手元に戻す
          </button>
        ) : (
          <button
            onClick={() => onToggleLost(keepsake.id, true)}
            className="rounded border border-coc-border px-2.5 py-1 text-xs text-coc-muted hover:text-red-300 hover:border-red-800/60 transition-colors"
          >
            失った
          </button>
        )}
        <button
          onClick={() => onDelete(keepsake.id)}
          className="ml-auto text-xs text-red-500/50 hover:text-red-400 transition-colors"
        >
          削除
        </button>
      </div>
    </div>
  );
}
