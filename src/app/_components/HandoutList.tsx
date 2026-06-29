"use client";

import { useState } from "react";
import { Eye, EyeOff, Link as LinkIcon, Plus, X } from "lucide-react";
import { supabase, isSupabaseConfigured, Handout } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  initialHandouts: Handout[];
};

export default function HandoutList({ scenarioId, initialHandouts }: Props) {
  const [handouts, setHandouts] = useState<Handout[]>(initialHandouts);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [shareUrls, setShareUrls] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    if (!title.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("handouts")
      .insert({
        scenario_id: scenarioId,
        title: title.trim(),
        content: content.trim() || null,
        recipient_name: recipientName.trim() || null,
        is_secret: isSecret,
      })
      .select()
      .single();

    if (!error && data) {
      setHandouts((prev) => [data as Handout, ...prev]);
      setTitle("");
      setContent("");
      setRecipientName("");
      setIsSecret(false);
      setShowForm(false);
    }
    setSaving(false);
  }

  function toggleReveal(id: string) {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("handouts").delete().eq("id", id);
    setHandouts((prev) => prev.filter((h) => h.id !== id));
  }

  async function handleGenerateShareLink(handoutId: string) {
    if (!isSupabaseConfigured) return;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("share_tokens")
      .insert({ handout_id: handoutId, expires_at: expiresAt })
      .select()
      .single();
    if (!error && data) {
      const url = `${window.location.origin}/share/${data.token}`;
      setShareUrls((prev) => ({ ...prev, [handoutId]: url }));
      await navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  return (
    <div className="space-y-4">
      {/* 追加ボタン */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-raised px-3 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors"
        >
          <Plus size={16} />
          ハンドアウトを追加
        </button>
      )}

      {/* インライン作成フォーム */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-coc-border bg-coc-surface p-4 space-y-3"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-cinzel text-sm font-semibold text-coc-text">
              ハンドアウトを追加
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-coc-muted hover:text-coc-text"
            >
              <X size={16} />
            </button>
          </div>

          <div>
            <label className="block text-xs text-coc-muted mb-1">タイトル *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
              placeholder="ハンドアウトのタイトル"
            />
          </div>

          <div>
            <label className="block text-xs text-coc-muted mb-1">本文</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors resize-none"
              placeholder="配布する情報・テキスト"
            />
          </div>

          <div>
            <label className="block text-xs text-coc-muted mb-1">受け取りPC名</label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
              placeholder="例: 田中太郎（全員の場合は空欄）"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isSecret}
              onChange={(e) => setIsSecret(e.target.checked)}
              className="rounded border-coc-border accent-coc-gold"
            />
            <span className="text-sm text-coc-text">秘匿ハンドアウト（他PLには内容を隠す）</span>
          </label>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-coc-gold px-4 py-2 text-sm font-semibold text-coc-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? "保存中..." : "追加"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* ハンドアウト一覧 */}
      {handouts.length === 0 ? (
        <p className="text-center text-coc-muted text-sm py-8">
          ハンドアウトが登録されていません
        </p>
      ) : (
        <div className="space-y-3">
          {handouts.map((h) => {
            const revealed = revealedIds.has(h.id);
            return (
              <div
                key={h.id}
                className="rounded-xl border border-coc-border bg-coc-surface p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-cinzel font-semibold text-coc-text text-sm">
                      {h.title}
                    </h3>
                    {h.is_secret && (
                      <span className="rounded-full border border-amber-700 px-2 py-0.5 text-xs text-amber-500">
                        秘匿
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {h.is_secret && (
                      <button
                        onClick={() => toggleReveal(h.id)}
                        className="text-coc-muted hover:text-coc-text transition-colors"
                        title={revealed ? "隠す" : "内容を表示"}
                      >
                        {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    )}
                    <button
                      onClick={() => handleGenerateShareLink(h.id)}
                      className="text-coc-muted hover:text-coc-gold transition-colors"
                      title="共有リンクを生成（24時間有効）"
                    >
                      <LinkIcon size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="text-coc-faint hover:text-red-400 transition-colors"
                      title="削除"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {h.recipient_name && (
                  <p className="text-xs text-coc-muted">
                    受け取り: <span className="text-coc-text">{h.recipient_name}</span>
                  </p>
                )}

                {/* 秘匿カードは非表示 / 通常は表示 */}
                {h.is_secret && !revealed ? (
                  <p className="text-xs text-coc-faint italic">
                    （秘匿内容 — 目のアイコンで表示）
                  </p>
                ) : h.content ? (
                  <p className="font-crimson text-coc-text text-[15px] leading-relaxed whitespace-pre-wrap border-l-2 border-coc-border pl-3">
                    {h.content}
                  </p>
                ) : null}

                {shareUrls[h.id] && (
                  <div className="mt-2 rounded-md border border-coc-gold-dim bg-coc-raised px-3 py-2">
                    <p className="text-xs text-coc-muted mb-1">共有リンク（24時間有効・クリップボードにコピー済み）</p>
                    <p className="text-xs text-coc-gold break-all select-all">{shareUrls[h.id]}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
