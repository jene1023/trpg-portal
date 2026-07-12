"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, Lock, ShieldAlert } from "lucide-react";
import { createSupabaseBrowserClient, isSupabaseConfigured, CharacterKpNote } from "@/lib/supabase";

type Props = { params: Promise<{ id: string; charId: string }> };

export default function KpNotePage({ params }: Props) {
  const [scenarioId, setScenarioId] = useState("");
  const [charId, setCharId] = useState("");
  const [scenarioTitle, setScenarioTitle] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [notes, setNotes] = useState<CharacterKpNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then(async ({ id, charId: cId }) => {
      setScenarioId(id);
      setCharId(cId);
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      const client = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      setUserId(user?.id ?? null);

      const [scenarioRes, charRes, notesRes] = await Promise.all([
        client.from("scenarios").select("title").eq("id", id).single(),
        client.from("characters").select("name").eq("id", cId).single(),
        user
          ? client
              .from("character_kp_notes")
              .select("*")
              .eq("character_id", cId)
              .eq("scenario_id", id)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as CharacterKpNote[] }),
      ]);

      if (scenarioRes.data) setScenarioTitle(scenarioRes.data.title);
      if (charRes.data) setCharacterName(charRes.data.name);
      setNotes((notesRes.data ?? []) as CharacterKpNote[]);
      setLoading(false);
    });
  }, [params]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || !userId || !content.trim()) return;
    setSaving(true);
    const client = createSupabaseBrowserClient();
    const { data, error } = await client
      .from("character_kp_notes")
      .insert({
        character_id: charId,
        scenario_id: scenarioId,
        kp_user_id: userId,
        content: content.trim(),
      })
      .select()
      .single();
    if (!error && data) {
      setNotes((prev) => [data as CharacterKpNote, ...prev]);
      setContent("");
    }
    setSaving(false);
  }

  async function handleDelete(noteId: string) {
    if (!isSupabaseConfigured) return;
    const client = createSupabaseBrowserClient();
    await client.from("character_kp_notes").delete().eq("id", noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted text-sm">読み込み中...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/scenarios/${scenarioId}`}
            className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
          >
            <ArrowLeft size={16} />
            {scenarioTitle || "シナリオ詳細"}
          </Link>
        </div>
        <div className="rounded-lg border border-yellow-800 bg-yellow-950/20 p-6 text-center">
          <ShieldAlert size={24} className="text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-yellow-300">KP秘匿メモの閲覧にはログインが必要です。</p>
          <Link
            href="/login"
            className="mt-3 inline-block text-sm text-coc-gold hover:underline"
          >
            ログインする →
          </Link>
        </div>
      </div>
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
          {scenarioTitle || "シナリオ詳細"}
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <Lock size={18} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">KP秘匿メモ</h1>
      </div>
      {characterName && (
        <p className="text-sm text-coc-muted mb-4">対象: {characterName}</p>
      )}
      <div className="mb-6 rounded-lg border border-coc-border bg-coc-surface/50 px-4 py-2">
        <p className="text-xs text-coc-muted">
          このメモはKP専用です。PLには表示されません。
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="rounded-xl border border-coc-border bg-coc-surface p-4 space-y-3 mb-6"
      >
        <label className="block text-xs text-coc-muted">秘匿メモ *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          required
          className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors resize-none"
          placeholder="例: 実は黒幕。セッション後半で正体を明かす予定。"
        />
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-coc-gold px-4 py-2 text-sm font-semibold text-coc-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Plus size={16} />
          {saving ? "保存中..." : "メモを追加"}
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="text-center text-coc-muted text-sm py-8">
          秘匿メモはまだありません
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-xl border border-coc-border bg-coc-surface p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs text-coc-muted">
                  {new Date(note.created_at).toLocaleString("ja-JP")}
                </span>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-coc-faint hover:text-red-400 transition-colors shrink-0"
                  title="削除"
                >
                  <X size={15} />
                </button>
              </div>
              <p className="font-crimson text-coc-text text-[15px] leading-relaxed whitespace-pre-wrap border-l-2 border-coc-gold/40 pl-3">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
