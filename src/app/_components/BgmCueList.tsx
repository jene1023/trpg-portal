"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, ExternalLink, Play } from "lucide-react";
import { supabase, isSupabaseConfigured, BgmCue } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  initialCues: BgmCue[];
};

export default function BgmCueList({ scenarioId, initialCues }: Props) {
  const [cues, setCues] = useState<BgmCue[]>(initialCues);
  const [label, setLabel] = useState("");
  const [bgmUrl, setBgmUrl] = useState("");
  const [mood, setMood] = useState("");
  const [directionNotes, setDirectionNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);

  async function broadcastCue(cue: BgmCue) {
    if (!isSupabaseConfigured || broadcasting) return;
    setBroadcasting(true);
    setPlayingId(cue.id);
    await supabase.channel(`bgm-${scenarioId}`).send({
      type: "broadcast",
      event: "bgm_change",
      payload: { label: cue.label, bgm_url: cue.bgm_url },
    });
    setBroadcasting(false);
  }

  async function addCue() {
    if (!label.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const maxIndex = cues.length > 0 ? Math.max(...cues.map((c) => c.order_index)) : -1;
    const { data, error } = await supabase
      .from("bgm_cues")
      .insert({
        scenario_id: scenarioId,
        label: label.trim(),
        bgm_url: bgmUrl.trim() || null,
        mood: mood.trim() || null,
        direction_notes: directionNotes.trim() || null,
        order_index: maxIndex + 1,
      })
      .select()
      .single();
    if (!error && data) {
      setCues((prev) => [...prev, data as BgmCue]);
      setLabel("");
      setBgmUrl("");
      setMood("");
      setDirectionNotes("");
      setAdding(false);
    }
    setSaving(false);
  }

  async function deleteCue(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("bgm_cues").delete().eq("id", id);
    setCues((prev) => prev.filter((c) => c.id !== id));
  }

  async function moveCue(index: number, direction: -1 | 1) {
    if (!isSupabaseConfigured) return;
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= cues.length) return;

    const updated = [...cues];
    const aIdx = updated[index].order_index;
    const bIdx = updated[swapIndex].order_index;

    await Promise.all([
      supabase.from("bgm_cues").update({ order_index: bIdx }).eq("id", updated[index].id),
      supabase.from("bgm_cues").update({ order_index: aIdx }).eq("id", updated[swapIndex].id),
    ]);

    updated[index] = { ...updated[index], order_index: bIdx };
    updated[swapIndex] = { ...updated[swapIndex], order_index: aIdx };
    updated.sort((a, b) => a.order_index - b.order_index);
    setCues(updated);
  }

  return (
    <div className="space-y-3">
      {cues.map((cue, i) => (
        <div key={cue.id} className="rounded-xl border border-coc-border bg-coc-surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs text-coc-muted shrink-0">#{i + 1}</span>
              <h3 className="font-medium text-coc-text truncate">{cue.label}</h3>
              {cue.mood && (
                <span className="shrink-0 rounded-full border border-coc-border px-2 py-0.5 text-xs text-coc-muted">
                  {cue.mood}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => broadcastCue(cue)}
                disabled={broadcasting}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  playingId === cue.id
                    ? "bg-coc-gold/20 text-coc-gold border border-coc-gold-dim"
                    : "border border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-gold"
                }`}
                aria-label="再生通知"
              >
                <Play size={11} />
                再生
              </button>
              <button
                onClick={() => moveCue(i, -1)}
                disabled={i === 0}
                className="p-1 rounded hover:bg-coc-raised text-coc-muted disabled:opacity-30 transition-colors"
                aria-label="上へ"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => moveCue(i, 1)}
                disabled={i === cues.length - 1}
                className="p-1 rounded hover:bg-coc-raised text-coc-muted disabled:opacity-30 transition-colors"
                aria-label="下へ"
              >
                <ChevronDown size={16} />
              </button>
              <button
                onClick={() => deleteCue(cue.id)}
                className="p-1 rounded hover:bg-coc-raised text-red-400 transition-colors"
                aria-label="削除"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          {cue.bgm_url && (
            <div className="px-4 pb-2">
              <a
                href={cue.bgm_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-coc-gold hover:underline"
              >
                <ExternalLink size={12} />
                BGMを開く
              </a>
            </div>
          )}
          {cue.direction_notes && (
            <details className="px-4 pb-3">
              <summary className="cursor-pointer text-xs text-coc-muted hover:text-coc-text select-none">
                演出メモを表示
              </summary>
              <p className="mt-2 text-sm text-coc-text whitespace-pre-wrap border-t border-coc-border pt-2">
                {cue.direction_notes}
              </p>
            </details>
          )}
        </div>
      ))}

      {cues.length === 0 && !adding && (
        <p className="text-center text-sm text-coc-muted py-8">BGMキューがまだ登録されていません</p>
      )}

      {adding ? (
        <div className="rounded-xl border border-coc-gold-dim bg-coc-raised px-5 py-4 space-y-3">
          <input
            type="text"
            placeholder="場面ラベル（例: 導入シーン、クライマックス）"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
          />
          <input
            type="url"
            placeholder="BGM URL（YouTube・Spotify等、任意）"
            value={bgmUrl}
            onChange={(e) => setBgmUrl(e.target.value)}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
          />
          <input
            type="text"
            placeholder="ムード（例: 緊張、恐怖、穏やか）"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none"
          />
          <textarea
            placeholder="演出メモ（照明・SE・タイミング指示等）"
            value={directionNotes}
            onChange={(e) => setDirectionNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:border-coc-gold focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={addCue}
              disabled={!label.trim() || saving}
              className="flex-1 rounded-lg bg-coc-gold py-2 text-sm font-medium text-black disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? "保存中..." : "追加"}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setLabel("");
                setBgmUrl("");
                setMood("");
                setDirectionNotes("");
              }}
              className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-coc-border py-3 text-sm text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
        >
          <Plus size={16} />
          BGMキューを追加
        </button>
      )}
    </div>
  );
}
