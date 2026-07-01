"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, BookOpen } from "lucide-react";
import { supabase, isSupabaseConfigured, Character } from "@/lib/supabase";

export default function FarewellPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [char, setChar] = useState<Character | null>(null);
  const [scene, setScene] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    async function load() {
      const { data } = await supabase
        .from("characters")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setChar(data as Character);
        setScene(data.farewell_scene ?? "");
        setMessage(data.farewell_message ?? "");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSave() {
    if (!isSupabaseConfigured || !char) return;
    setSaving(true);
    await supabase
      .from("characters")
      .update({ farewell_scene: scene || null, farewell_message: message || null })
      .eq("id", id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-coc-muted font-crimson italic">記録を呼び起こしています...</p>
      </div>
    );
  }

  if (!char) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-coc-muted font-crimson italic">キャラクターが見つかりません。</p>
      </div>
    );
  }

  const statusLabel =
    char.status === "dead" ? "死亡" : char.status === "retired" ? "引退" : char.status;

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          キャラクター詳細へ
        </Link>
      </div>

      {/* ヘッダー */}
      <div className="mb-8 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-coc-muted text-sm mb-1">
          <BookOpen size={16} />
          <span className="uppercase tracking-widest font-cinzel text-xs">最終章</span>
        </div>
        <h1 className="font-cinzel text-2xl font-bold text-coc-text">{char.name}</h1>
        <div className="flex items-center justify-center gap-2">
          {char.occupation && (
            <span className="text-sm text-coc-muted">{char.occupation}</span>
          )}
          <span className="rounded border border-coc-border px-2 py-0.5 text-xs text-coc-muted">
            {statusLabel}
          </span>
        </div>
        <p className="font-crimson italic text-coc-muted text-sm mt-2">
          その探索者の物語は、ここに幕を閉じた。
        </p>
      </div>

      <div className="space-y-6">
        {/* 最後のシーン */}
        <div className="rounded-lg border border-coc-border coc-card-bg p-5 space-y-3">
          <label className="block text-xs font-semibold text-coc-muted uppercase tracking-widest">
            最後のシーン
          </label>
          <p className="text-xs text-coc-muted/70">
            最終セッション・死因・退場の状況を記録してください。
          </p>
          <textarea
            value={scene}
            onChange={(e) => setScene(e.target.value)}
            rows={6}
            placeholder="例: 深きものどもの祭壇に一人立ち向かい、仲間を逃がすために自らを犠牲にした..."
            className="w-full rounded-md border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted/50 focus:outline-none focus:border-coc-gold transition-colors resize-none font-crimson leading-relaxed"
          />
        </div>

        {/* PLからのひとこと */}
        <div className="rounded-lg border border-coc-border coc-card-bg p-5 space-y-3">
          <label className="block text-xs font-semibold text-coc-muted uppercase tracking-widest">
            PLからのひとこと
          </label>
          <p className="text-xs text-coc-muted/70">
            このキャラクターへの思い出・感謝・メッセージを残してください。
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="例: 短い命だったけど、最高の探索者だった。ありがとう。"
            className="w-full rounded-md border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text placeholder-coc-muted/50 focus:outline-none focus:border-coc-gold transition-colors resize-none font-crimson leading-relaxed"
          />
        </div>

        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 w-full justify-center rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-3 text-sm font-semibold text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors disabled:opacity-50"
        >
          <Save size={15} />
          {saving ? "保存中..." : saved ? "保存しました" : "最終章を保存する"}
        </button>

        {/* 既存の記録プレビュー */}
        {(char.farewell_scene || char.farewell_message) && (
          <div className="rounded-lg border border-coc-border/50 bg-coc-void/40 p-5 space-y-4">
            <p className="text-xs font-semibold text-coc-muted uppercase tracking-widest">保存済みの記録</p>
            {char.farewell_scene && (
              <div>
                <p className="text-xs text-coc-muted mb-1">最後のシーン</p>
                <p className="font-crimson text-coc-text/80 leading-relaxed whitespace-pre-wrap text-sm">
                  {char.farewell_scene}
                </p>
              </div>
            )}
            {char.farewell_message && (
              <div>
                <p className="text-xs text-coc-muted mb-1">PLからのひとこと</p>
                <p className="font-crimson text-coc-text/80 leading-relaxed whitespace-pre-wrap text-sm italic">
                  &ldquo;{char.farewell_message}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
