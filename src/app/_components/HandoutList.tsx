"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Eye, EyeOff, Link as LinkIcon, Plus, Square, Users, X } from "lucide-react";
import { supabase, isSupabaseConfigured, Handout } from "@/lib/supabase";
import QrCodeShare from "./QrCodeShare";

type ParticipantInfo = { characterId: string; characterName: string };
type ReadInfo = { handoutId: string; characterId: string };

type Props = {
  scenarioId: string;
  initialHandouts: Handout[];
  participants: ParticipantInfo[];
  initialReads: ReadInfo[];
};

export default function HandoutList({ scenarioId, initialHandouts, participants, initialReads }: Props) {
  const [handouts, setHandouts] = useState<Handout[]>(initialHandouts);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [shareUrls, setShareUrls] = useState<Record<string, string>>({});
  const [isUnreadMode, setIsUnreadMode] = useState(false);

  const [readMap, setReadMap] = useState<Map<string, Set<string>>>(() => {
    const map = new Map<string, Set<string>>();
    for (const r of initialReads) {
      if (!map.has(r.handoutId)) map.set(r.handoutId, new Set());
      map.get(r.handoutId)!.add(r.characterId);
    }
    return map;
  });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel(`handout-reads-${scenarioId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "handout_reads" },
        (payload) => {
          const row = payload.new as { handout_id: string; character_id: string };
          setReadMap((prev) => {
            const next = new Map(prev);
            const set = new Set(next.get(row.handout_id) ?? []);
            set.add(row.character_id);
            next.set(row.handout_id, set);
            return next;
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [scenarioId]);

  function getReadCount(handoutId: string): number {
    return readMap.get(handoutId)?.size ?? 0;
  }

  function getUnreadCharacters(handoutId: string): ParticipantInfo[] {
    const reads = readMap.get(handoutId) ?? new Set<string>();
    return participants.filter((p) => !reads.has(p.characterId));
  }

  async function handleMarkRead(handoutId: string, characterId: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("handout_reads").upsert(
      {
        handout_id: handoutId,
        character_id: characterId,
        read_at: new Date().toISOString(),
      },
      { onConflict: "handout_id,character_id" }
    );
    setReadMap((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(handoutId) ?? []);
      set.add(characterId);
      next.set(handoutId, set);
      return next;
    });
  }

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
        image_url: imageUrl.trim() || null,
      })
      .select()
      .single();

    if (!error && data) {
      setHandouts((prev) => [data as Handout, ...prev]);
      setTitle("");
      setContent("");
      setRecipientName("");
      setIsSecret(false);
      setImageUrl("");
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

  async function handleToggleDistributed(id: string, current: boolean) {
    if (!isSupabaseConfigured) return;
    const next = !current;
    await supabase.from("handouts").update({ is_distributed: next }).eq("id", id);
    setHandouts((prev) =>
      prev.map((h) => (h.id === id ? { ...h, is_distributed: next } : h))
    );
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
      {/* ツールバー */}
      <div className="flex items-center gap-2 flex-wrap">
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-raised px-3 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors"
          >
            <Plus size={16} />
            ハンドアウトを追加
          </button>
        )}
        {participants.length > 0 && (
          <button
            onClick={() => setIsUnreadMode((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
              isUnreadMode
                ? "border-amber-600 bg-amber-900/20 text-amber-400"
                : "border-coc-border bg-coc-raised text-coc-muted hover:text-coc-text"
            }`}
          >
            <Users size={16} />
            未読確認モード
          </button>
        )}
      </div>

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

          <div>
            <label className="block text-xs text-coc-muted mb-1">画像URL（オプション）</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
              placeholder="https://example.com/image.png"
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
            const readCount = getReadCount(h.id);
            const totalParticipants = participants.length;
            const unreadChars = isUnreadMode ? getUnreadCharacters(h.id) : [];

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
                    {h.is_distributed && (
                      <span className="rounded-full border border-green-700 bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
                        配布済み
                      </span>
                    )}
                    {totalParticipants > 0 && (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${
                          readCount >= totalParticipants
                            ? "border-green-700 bg-green-900/20 text-green-400"
                            : readCount > 0
                            ? "border-amber-700 bg-amber-900/20 text-amber-400"
                            : "border-coc-border text-coc-muted"
                        }`}
                      >
                        既読 {readCount}/{totalParticipants}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleDistributed(h.id, h.is_distributed)}
                      className={h.is_distributed ? "text-green-400 hover:text-green-300 transition-colors" : "text-coc-muted hover:text-green-400 transition-colors"}
                      title={h.is_distributed ? "配布済み（クリックで取消）" : "配布済みにする"}
                    >
                      {h.is_distributed ? <CheckSquare size={15} /> : <Square size={15} />}
                    </button>
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
                    {shareUrls[h.id] && (
                      <QrCodeShare url={shareUrls[h.id]} label={`handout-${h.id}`} />
                    )}
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

                {/* 未読確認モード: 未読キャラクター一覧 */}
                {isUnreadMode && participants.length > 0 && (
                  <div className="rounded-lg border border-amber-800/40 bg-amber-900/10 px-3 py-2 space-y-1">
                    {unreadChars.length === 0 ? (
                      <p className="text-xs text-green-400">✓ 全員既読済み</p>
                    ) : (
                      <>
                        <p className="text-xs text-amber-400 font-semibold mb-1">
                          未読 ({unreadChars.length}名)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {unreadChars.map((p) => (
                            <button
                              key={p.characterId}
                              onClick={() => handleMarkRead(h.id, p.characterId)}
                              className="flex items-center gap-1 rounded border border-amber-700/50 bg-amber-900/20 px-2 py-0.5 text-xs text-amber-300 hover:bg-amber-800/40 hover:text-amber-100 transition-colors"
                              title={`${p.characterName} を既読にする`}
                            >
                              ✓ {p.characterName}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 秘匿カードは非表示 / 通常は表示 */}
                {h.is_secret && !revealed ? (
                  <p className="text-xs text-coc-faint italic">
                    （秘匿内容 — 目のアイコンで表示）
                  </p>
                ) : (
                  <>
                    {h.content && (
                      <p className="font-crimson text-coc-text text-[15px] leading-relaxed whitespace-pre-wrap border-l-2 border-coc-border pl-3">
                        {h.content}
                      </p>
                    )}
                    {h.image_url && (
                      <img
                        src={h.image_url}
                        alt={h.title}
                        className="mt-2 max-h-48 w-full rounded-lg object-contain border border-coc-border"
                      />
                    )}
                  </>
                )}

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
