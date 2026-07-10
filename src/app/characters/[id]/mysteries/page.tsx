"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, CheckCircle, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { supabase, isSupabaseConfigured, CharacterMystery } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

export default function MysteriesPage({ params }: Props) {
  const [characterId, setCharacterId] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [mysteries, setMysteries] = useState<CharacterMystery[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newContextNotes, setNewContextNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [resolvedOpen, setResolvedOpen] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setCharacterId(id);
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      Promise.all([
        supabase.from("characters").select("id, name").eq("id", id).single(),
        supabase
          .from("character_mysteries")
          .select("*")
          .eq("character_id", id)
          .order("created_at", { ascending: false }),
      ]).then(([charRes, mysteriesRes]) => {
        if (charRes.data) setCharacterName(charRes.data.name);
        setMysteries(mysteriesRes.data ?? []);
        setLoading(false);
      });
    });
  }, [params]);

  const unresolved = mysteries.filter((m) => !m.is_resolved);
  const resolved = mysteries.filter((m) => m.is_resolved);

  async function addMystery() {
    if (!newQuestion.trim() || !isSupabaseConfigured) return;
    setSaving(true);
    const { data } = await supabase
      .from("character_mysteries")
      .insert({
        character_id: characterId,
        question: newQuestion.trim(),
        context_notes: newContextNotes.trim() || null,
        is_resolved: false,
        resolved_at: null,
      })
      .select()
      .single();
    if (data) {
      setMysteries((prev) => [data, ...prev]);
    }
    setNewQuestion("");
    setNewContextNotes("");
    setAdding(false);
    setSaving(false);
  }

  async function resolveMystery(m: CharacterMystery) {
    if (!isSupabaseConfigured) return;
    const now = new Date().toISOString();
    await supabase
      .from("character_mysteries")
      .update({ is_resolved: true, resolved_at: now })
      .eq("id", m.id);
    setMysteries((prev) =>
      prev.map((item) =>
        item.id === m.id ? { ...item, is_resolved: true, resolved_at: now } : item
      )
    );
  }

  async function unresolve(m: CharacterMystery) {
    if (!isSupabaseConfigured) return;
    await supabase
      .from("character_mysteries")
      .update({ is_resolved: false, resolved_at: null })
      .eq("id", m.id);
    setMysteries((prev) =>
      prev.map((item) =>
        item.id === m.id ? { ...item, is_resolved: false, resolved_at: null } : item
      )
    );
  }

  async function deleteMystery(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("character_mysteries").delete().eq("id", id);
    setMysteries((prev) => prev.filter((m) => m.id !== id));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/characters/${characterId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {characterName || "キャラクター詳細"}
        </Link>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-3 py-1.5 text-sm text-coc-gold hover:bg-coc-gold/20 transition-colors motion-safe:active:scale-[0.97]"
        >
          <Plus size={14} />
          疑問を追加
        </button>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-1">謎リスト</h1>
      <p className="text-xs text-coc-muted mb-6">
        セッション中に感じた謎・疑問を記録します。解決したらチェックを入れましょう。
      </p>

      {/* 追加フォーム */}
      {adding && (
        <div className="mb-6 rounded-lg border border-coc-gold/40 bg-coc-gold/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-coc-gold">疑問を追加</h2>
            <button
              onClick={() => { setAdding(false); setNewQuestion(""); setNewContextNotes(""); }}
              className="text-coc-muted hover:text-coc-text transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="疑問・謎（例：なぜあのNPCは嘘をついたのか？） *"
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold/60"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addMystery()}
            autoFocus
          />
          <textarea
            value={newContextNotes}
            onChange={(e) => setNewContextNotes(e.target.value)}
            placeholder="状況メモ・背景（任意）"
            rows={2}
            className="w-full rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted focus:outline-none focus:border-coc-gold/60 resize-none"
          />
          <button
            onClick={addMystery}
            disabled={saving || !newQuestion.trim()}
            className="rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-4 py-2 text-sm font-semibold text-coc-gold hover:bg-coc-gold/20 disabled:opacity-50 transition-colors"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      )}

      {/* 未解決リスト */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded border border-yellow-700 bg-yellow-950/40 px-2 py-0.5 text-xs font-semibold text-yellow-300">
            未解決
          </span>
          <span className="text-xs text-coc-muted">{unresolved.length}件</span>
        </div>

        {unresolved.length === 0 ? (
          <div className="rounded-lg border border-dashed border-coc-border bg-yellow-950/5 p-6 text-center">
            <p className="text-xs text-coc-muted/60">未解決の謎はありません。</p>
          </div>
        ) : (
          unresolved.map((m) => (
            <div
              key={m.id}
              className="rounded-lg border border-coc-border coc-card-bg p-3 space-y-2"
            >
              <div className="flex items-start gap-2">
                <button
                  onClick={() => resolveMystery(m)}
                  className="flex-shrink-0 mt-0.5 text-coc-muted hover:text-green-400 transition-colors"
                  title="解決済みにする"
                >
                  <Circle size={16} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-coc-text leading-snug">{m.question}</p>
                  {m.context_notes && (
                    <p className="text-xs text-coc-muted mt-1 leading-relaxed whitespace-pre-wrap">
                      {m.context_notes}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteMystery(m.id)}
                  className="flex-shrink-0 text-coc-muted hover:text-red-400 transition-colors mt-0.5"
                  title="削除"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 解決済みリスト（アコーディオン） */}
      {resolved.length > 0 && (
        <div>
          <button
            onClick={() => setResolvedOpen((v) => !v)}
            className="flex items-center gap-2 mb-3 group"
          >
            <span className="rounded border border-green-800 bg-green-950/40 px-2 py-0.5 text-xs font-semibold text-green-400">
              解決済み
            </span>
            <span className="text-xs text-coc-muted">{resolved.length}件</span>
            {resolvedOpen ? (
              <ChevronUp size={14} className="text-coc-muted group-hover:text-coc-text transition-colors" />
            ) : (
              <ChevronDown size={14} className="text-coc-muted group-hover:text-coc-text transition-colors" />
            )}
          </button>

          {resolvedOpen && (
            <div className="space-y-2">
              {resolved.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-coc-border/50 bg-coc-surface/40 p-3 space-y-1.5 opacity-60"
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => unresolve(m)}
                      className="flex-shrink-0 mt-0.5 text-green-600 hover:text-green-400 transition-colors"
                      title="未解決に戻す"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-coc-muted line-through leading-snug">{m.question}</p>
                      {m.context_notes && (
                        <p className="text-xs text-coc-muted/60 mt-1 leading-relaxed whitespace-pre-wrap line-through">
                          {m.context_notes}
                        </p>
                      )}
                      {m.resolved_at && (
                        <p className="text-xs text-coc-muted/40 mt-1">
                          解決: {new Date(m.resolved_at).toLocaleDateString("ja-JP")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteMystery(m.id)}
                      className="flex-shrink-0 text-coc-muted/50 hover:text-red-400 transition-colors mt-0.5"
                      title="削除"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mysteries.length === 0 && !adding && (
        <div className="rounded-lg border border-coc-border coc-card-bg p-8 text-center mt-4">
          <p className="text-coc-muted text-sm">まだ謎が記録されていません。</p>
          <p className="text-xs text-coc-muted mt-1">右上の「疑問を追加」から登録できます。</p>
        </div>
      )}
    </div>
  );
}
