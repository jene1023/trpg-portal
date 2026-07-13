"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { Plus, X, Users, Pencil, Trash2 } from "lucide-react";
import { supabase, isSupabaseConfigured, KpPlayerNote } from "@/lib/supabase";

const EXPERIENCE_LEVELS = ["初心者", "中級者", "上級者", "ベテラン"];

const EXPERIENCE_COLORS: Record<string, string> = {
  "初心者": "bg-green-900/50 text-green-300 border-green-700",
  "中級者": "bg-blue-900/50 text-blue-300 border-blue-700",
  "上級者": "bg-purple-900/50 text-purple-300 border-purple-700",
  "ベテラン": "bg-yellow-900/50 text-yellow-300 border-yellow-700",
};

const fieldClass =
  "w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors";
const labelClass = "block text-xs font-medium text-coc-muted mb-1";

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      const trimmed = input.trim();
      if (!value.includes(trimmed)) {
        onChange([...value, trimmed]);
      }
      setInput("");
    }
  }

  return (
    <div className="rounded-lg border border-coc-border bg-coc-raised px-3 py-2 space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[1.5rem]">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-md border border-coc-border bg-coc-surface px-2 py-0.5 text-xs text-coc-text"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="text-coc-faint hover:text-red-400 transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-coc-text placeholder-coc-faint focus:outline-none"
      />
    </div>
  );
}

type FormData = Omit<KpPlayerNote, "id" | "kp_id" | "created_at">;

function emptyForm(): FormData {
  return {
    player_name: "",
    discord_handle: null,
    experience_level: null,
    content_ok: [],
    content_ng: [],
    memo: null,
  };
}

export default function KpPlayerNotesPage() {
  const [notes, setNotes] = useState<KpPlayerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<KpPlayerNote | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    loadNotes();
  }, []);

  async function loadNotes() {
    setLoading(true);
    const { data } = await supabase
      .from("kp_player_notes")
      .select("*")
      .order("created_at", { ascending: false });
    setNotes((data ?? []) as KpPlayerNote[]);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setError(null);
    setModalOpen(true);
  }

  function openEdit(note: KpPlayerNote) {
    setEditing(note);
    setForm({
      player_name: note.player_name,
      discord_handle: note.discord_handle,
      experience_level: note.experience_level,
      content_ok: note.content_ok ?? [],
      content_ng: note.content_ng ?? [],
      memo: note.memo,
    });
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setError(null);
  }

  async function handleSave() {
    if (!isSupabaseConfigured || !form.player_name.trim()) return;
    setSaving(true);
    setError(null);

    const payload = {
      player_name: form.player_name.trim(),
      discord_handle: form.discord_handle?.trim() || null,
      experience_level: form.experience_level || null,
      content_ok: form.content_ok,
      content_ng: form.content_ng,
      memo: form.memo?.trim() || null,
    };

    let err: { message: string } | null = null;
    if (editing) {
      ({ error: err } = await supabase
        .from("kp_player_notes")
        .update(payload)
        .eq("id", editing.id));
    } else {
      ({ error: err } = await supabase.from("kp_player_notes").insert(payload));
    }

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    closeModal();
    loadNotes();
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("kp_player_notes").delete().eq("id", id);
    setDeleteConfirmId(null);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="min-h-screen coc-bg px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <nav className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-coc-muted">
          <a href="/kp/party-templates" className="hover:text-coc-gold transition-colors">
            パーティーテンプレート
          </a>
          <span>·</span>
          <a href="/kp/narration" className="hover:text-coc-gold transition-colors">
            ナレーション生成
          </a>
          <span>·</span>
          <span className="text-coc-gold">常連プレイヤー台帳</span>
          <span>·</span>
          <a href="/kp/encounters" className="hover:text-coc-gold transition-colors">
            エンカウンター
          </a>
        </nav>

        <div>
          <h1 className="font-cinzel text-2xl font-bold text-coc-gold tracking-widest mb-1">
            常連プレイヤー台帳
          </h1>
          <p className="text-sm text-coc-muted">
            一緒に遊ぶプレイヤーの嗜好・NG項目・メモを管理します。
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl border border-dashed border-coc-border bg-coc-surface px-5 py-4 w-full text-sm text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
        >
          <Plus size={16} />
          新しいプレイヤーを追加
        </button>

        {loading ? (
          <div className="text-center py-10 text-sm text-coc-muted">読み込み中…</div>
        ) : notes.length === 0 ? (
          <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-10 text-center">
            <Users size={32} className="mx-auto mb-3 text-coc-faint" />
            <p className="text-sm text-coc-muted">プレイヤー情報がまだありません</p>
            <p className="text-xs text-coc-faint mt-1">上のボタンから追加してください</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
              登録プレイヤー ({notes.length}名)
            </p>
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-cinzel font-semibold text-coc-text text-sm">
                        {note.player_name}
                      </p>
                      {note.experience_level && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                            EXPERIENCE_COLORS[note.experience_level] ??
                            "bg-coc-raised text-coc-muted border-coc-border"
                          }`}
                        >
                          {note.experience_level}
                        </span>
                      )}
                    </div>
                    {note.discord_handle && (
                      <p className="text-xs text-coc-muted mt-0.5">
                        Discord: {note.discord_handle}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(note)}
                      className="rounded-lg border border-coc-border p-1.5 text-coc-faint hover:text-coc-gold hover:border-coc-gold transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    {deleteConfirmId === note.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(note.id)}
                          className="text-xs rounded px-2 py-1 bg-red-900/50 text-red-300 border border-red-700 hover:bg-red-800/50 transition-colors"
                        >
                          削除確定
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs rounded px-2 py-1 text-coc-muted border border-coc-border hover:text-coc-text transition-colors"
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(note.id)}
                        className="rounded-lg border border-coc-border p-1.5 text-coc-faint hover:text-red-400 hover:border-red-700 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {((note.content_ok?.length ?? 0) > 0 ||
                  (note.content_ng?.length ?? 0) > 0) && (
                  <div className="flex flex-wrap gap-4 pt-1">
                    {(note.content_ok?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-green-400 mb-1 uppercase tracking-wider">
                          OK
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {note.content_ok.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-1.5 py-0.5 rounded border border-green-700/50 bg-green-900/20 text-green-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(note.content_ng?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-red-400 mb-1 uppercase tracking-wider">
                          NG
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {note.content_ng.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-1.5 py-0.5 rounded border border-red-700/50 bg-red-900/20 text-red-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {note.memo && (
                  <p className="text-xs text-coc-muted border-t border-coc-border pt-2 leading-relaxed whitespace-pre-wrap">
                    {note.memo}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-coc-border bg-coc-surface p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-cinzel text-base font-semibold text-coc-text">
                {editing ? "プレイヤー情報を編集" : "プレイヤーを追加"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-coc-faint hover:text-coc-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className={labelClass}>プレイヤー名 *</label>
              <input
                value={form.player_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, player_name: e.target.value }))
                }
                placeholder="例: 田中さん"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>Discord ID（任意）</label>
              <input
                value={form.discord_handle ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    discord_handle: e.target.value || null,
                  }))
                }
                placeholder="例: tanaka#1234"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>TRPG経験レベル</label>
              <select
                value={form.experience_level ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    experience_level: e.target.value || null,
                  }))
                }
                className={fieldClass}
              >
                <option value="">-- 選択してください --</option>
                {EXPERIENCE_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                コンテンツOK（Enterで追加・×で削除）
              </label>
              <TagInput
                value={form.content_ok}
                onChange={(tags) => setForm((f) => ({ ...f, content_ok: tags }))}
                placeholder="例: ゴア表現、ホラー…"
              />
            </div>

            <div>
              <label className={labelClass}>
                コンテンツNG（Enterで追加・×で削除）
              </label>
              <TagInput
                value={form.content_ng}
                onChange={(tags) => setForm((f) => ({ ...f, content_ng: tags }))}
                placeholder="例: 虫、刃物、廃墟…"
              />
            </div>

            <div>
              <label className={labelClass}>個人メモ（任意）</label>
              <textarea
                value={form.memo ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, memo: e.target.value || null }))
                }
                placeholder="例: 水曜夜のみ参加可。ロールプレイ重視。"
                rows={3}
                className={`${fieldClass} resize-none`}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-700 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !form.player_name.trim()}
                className="rounded-lg bg-coc-gold text-black font-semibold text-sm px-5 py-2 disabled:opacity-50 hover:brightness-110 transition-all"
              >
                {saving ? "保存中…" : editing ? "更新する" : "追加する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
