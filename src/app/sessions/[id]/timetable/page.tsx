"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, ChevronUp, ChevronDown, Plus, Trash2, CalendarClock } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionTimetableItem } from "@/lib/supabase";

export default function TimetablePage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const [sessionTitle, setSessionTitle] = useState("");
  const [items, setItems] = useState<SessionTimetableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [newMinutes, setNewMinutes] = useState(30);
  const [newNotes, setNewNotes] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    (async () => {
      const [{ data: session }, { data: rows }] = await Promise.all([
        supabase
          .from("sessions")
          .select("title, session_number, characters(name)")
          .eq("id", sessionId)
          .single(),
        supabase
          .from("session_timetable_items")
          .select("*")
          .eq("session_id", sessionId)
          .order("order_index", { ascending: true }),
      ]);

      if (session) {
        const char = session.characters as unknown as { name: string } | null;
        setSessionTitle(
          `${char?.name ?? ""} — セッション #${session.session_number} ${session.title}`
        );
      }

      setItems((rows ?? []) as SessionTimetableItem[]);
      setLoading(false);
    })();
  }, [sessionId]);

  const totalMinutes = items.reduce((sum, item) => sum + item.estimated_minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalRemaining = totalMinutes % 60;

  async function addItem() {
    if (!isSupabaseConfigured || !newLabel.trim()) return;
    setSaving(true);

    const nextIndex = items.length > 0 ? Math.max(...items.map((i) => i.order_index)) + 1 : 0;

    const { data, error } = await supabase
      .from("session_timetable_items")
      .insert({
        session_id: sessionId,
        label: newLabel.trim(),
        estimated_minutes: newMinutes,
        order_index: nextIndex,
        notes: newNotes.trim() || null,
      })
      .select("*")
      .single();

    if (!error && data) {
      setItems((prev) => [...prev, data as SessionTimetableItem]);
      setNewLabel("");
      setNewMinutes(30);
      setNewNotes("");
      setAdding(false);
    }
    setSaving(false);
  }

  async function deleteItem(id: string) {
    if (!isSupabaseConfigured) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("session_timetable_items").delete().eq("id", id);
  }

  async function moveItem(index: number, direction: "up" | "down") {
    if (!isSupabaseConfigured) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const tmp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = tmp;

    const updatedItems = newItems.map((item, i) => ({ ...item, order_index: i }));
    setItems(updatedItems);

    setSaving(true);
    await Promise.all([
      supabase
        .from("session_timetable_items")
        .update({ order_index: updatedItems[index].order_index })
        .eq("id", updatedItems[index].id),
      supabase
        .from("session_timetable_items")
        .update({ order_index: updatedItems[targetIndex].order_index })
        .eq("id", updatedItems[targetIndex].id),
    ]);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-coc-muted">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/sessions/${sessionId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          セッション詳細
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="font-cinzel text-xl font-bold text-coc-text flex items-center gap-2">
          <CalendarClock size={20} className="text-coc-gold" />
          タイムスケジュール
        </h1>
        {sessionTitle && (
          <p className="text-xs text-coc-muted mt-1">{sessionTitle}</p>
        )}
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">Supabaseが設定されていません。</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 flex items-center gap-3">
            <Clock size={18} className="text-coc-gold flex-shrink-0" />
            <div>
              <p className="text-xs text-coc-muted">合計予定時間</p>
              <p className="text-base font-bold text-coc-text">
                {totalHours > 0 ? `${totalHours}時間` : ""}
                {totalRemaining > 0 || totalHours === 0 ? `${totalRemaining}分` : ""}
                {items.length === 0 && "0分"}
              </p>
            </div>
            {saving && (
              <span className="ml-auto text-xs text-coc-muted">保存中...</span>
            )}
          </div>

          {items.length > 0 && (
            <div className="rounded-xl border border-coc-border bg-coc-surface overflow-hidden">
              <div className="px-5 py-3 border-b border-coc-border">
                <p className="text-xs font-medium text-coc-muted uppercase tracking-widest">
                  スケジュール一覧
                </p>
              </div>
              <div className="flex flex-col divide-y divide-coc-border">
                {items.map((item, index) => (
                  <div key={item.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-0.5 flex-shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={() => moveItem(index, "up")}
                          disabled={index === 0}
                          className="rounded p-0.5 text-coc-muted hover:text-coc-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="上へ移動"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(index, "down")}
                          disabled={index === items.length - 1}
                          className="rounded p-0.5 text-coc-muted hover:text-coc-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="下へ移動"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-coc-text">{item.label}</span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-coc-gold-dim bg-coc-gold/10 px-2 py-0.5 text-xs text-coc-gold">
                            <Clock size={10} />
                            {item.estimated_minutes}分
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-coc-muted mt-1 whitespace-pre-wrap">{item.notes}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        className="flex-shrink-0 rounded p-1 text-coc-muted hover:text-red-400 transition-colors"
                        aria-label="削除"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adding ? (
            <div className="rounded-xl border border-coc-gold-dim bg-coc-surface px-5 py-4">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest mb-4">
                新しいアイテムを追加
              </p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs text-coc-muted mb-1">ラベル</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="例: オープニング・探索フェーズ・休憩"
                    className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-coc-muted mb-1">予定時間（分）</label>
                  <input
                    type="number"
                    min={1}
                    max={480}
                    value={newMinutes}
                    onChange={(e) => setNewMinutes(Number(e.target.value))}
                    className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text focus:border-coc-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-coc-muted mb-1">メモ（任意）</label>
                  <textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="KP向け補足メモ"
                    rows={2}
                    className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={saving || !newLabel.trim()}
                    className="flex-1 rounded-lg bg-coc-gold px-4 py-2 text-sm font-medium text-coc-bg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    追加
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAdding(false); setNewLabel(""); setNewMinutes(30); setNewNotes(""); }}
                    className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-coc-border px-5 py-4 text-sm text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
            >
              <Plus size={16} />
              アイテムを追加
            </button>
          )}
        </div>
      )}
    </div>
  );
}
