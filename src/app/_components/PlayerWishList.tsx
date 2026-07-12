"use client";

import { useState } from "react";
import { Plus, X, CheckCircle2, Circle } from "lucide-react";
import { supabase, isSupabaseConfigured, PlayerWish } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  initialWishes: PlayerWish[];
};

export default function PlayerWishList({ scenarioId, initialWishes }: Props) {
  const [wishes, setWishes] = useState<PlayerWish[]>(initialWishes);
  const [wishText, setWishText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    if (!wishText.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("player_wishes")
      .insert({
        scenario_id: scenarioId,
        wish_text: wishText.trim(),
        author_name: authorName.trim() || null,
        character_id: null,
        user_id: null,
        is_fulfilled: false,
      })
      .select()
      .single();

    if (!error && data) {
      setWishes((prev) => [data as PlayerWish, ...prev]);
      setWishText("");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("player_wishes").delete().eq("id", id);
    setWishes((prev) => prev.filter((w) => w.id !== id));
  }

  async function handleToggleFulfilled(wish: PlayerWish) {
    if (!isSupabaseConfigured) return;
    const newValue = !wish.is_fulfilled;
    const { error } = await supabase
      .from("player_wishes")
      .update({
        is_fulfilled: newValue,
        fulfilled_at: newValue ? new Date().toISOString() : null,
      })
      .eq("id", wish.id);

    if (!error) {
      setWishes((prev) =>
        prev.map((w) =>
          w.id === wish.id
            ? { ...w, is_fulfilled: newValue, fulfilled_at: newValue ? new Date().toISOString() : null }
            : w
        )
      );
    }
  }

  const pendingWishes = wishes.filter((w) => !w.is_fulfilled);
  const fulfilledWishes = wishes.filter((w) => w.is_fulfilled);

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-coc-border bg-coc-surface p-4 space-y-3"
      >
        <p className="text-xs font-medium text-coc-muted uppercase tracking-widest">
          次セッションへの期待を投稿
        </p>

        <div>
          <label className="block text-xs text-coc-muted mb-1">投稿者名（任意）</label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors"
            placeholder="例: PL田中"
          />
        </div>

        <div>
          <label className="block text-xs text-coc-muted mb-1">期待メモ *</label>
          <textarea
            value={wishText}
            onChange={(e) => setWishText(e.target.value)}
            rows={3}
            required
            className="w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold transition-colors resize-none"
            placeholder="例: あのNPCと再会したい / 海辺のシーンに行きたい / 謎の失踪事件を追いたい"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-coc-gold px-4 py-2 text-sm font-semibold text-coc-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Plus size={16} />
          {saving ? "投稿中..." : "期待を投稿"}
        </button>
      </form>

      {wishes.length === 0 ? (
        <p className="text-center text-coc-muted text-sm py-8">
          まだ期待メモがありません。セッションへの期待を投稿しましょう。
        </p>
      ) : (
        <div className="space-y-6">
          {pendingWishes.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest">
                未達成の期待 ({pendingWishes.length})
              </p>
              {pendingWishes.map((w) => (
                <WishCard
                  key={w.id}
                  wish={w}
                  onToggleFulfilled={handleToggleFulfilled}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {fulfilledWishes.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-coc-muted uppercase tracking-widest">
                叶った期待 ({fulfilledWishes.length})
              </p>
              {fulfilledWishes.map((w) => (
                <WishCard
                  key={w.id}
                  wish={w}
                  onToggleFulfilled={handleToggleFulfilled}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WishCard({
  wish,
  onToggleFulfilled,
  onDelete,
}: {
  wish: PlayerWish;
  onToggleFulfilled: (w: PlayerWish) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-xl border p-4 space-y-2 transition-colors ${
        wish.is_fulfilled
          ? "border-green-900 bg-green-950/20 opacity-70"
          : "border-coc-border bg-coc-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap text-xs text-coc-muted">
          {wish.author_name && (
            <span className="text-coc-gold">{wish.author_name}</span>
          )}
          <span>{new Date(wish.created_at).toLocaleString("ja-JP")}</span>
          {wish.is_fulfilled && wish.fulfilled_at && (
            <span className="text-green-400">
              叶った: {new Date(wish.fulfilled_at).toLocaleDateString("ja-JP")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggleFulfilled(wish)}
            title={wish.is_fulfilled ? "未達成に戻す" : "叶った！"}
            className={`transition-colors ${
              wish.is_fulfilled
                ? "text-green-400 hover:text-coc-muted"
                : "text-coc-faint hover:text-green-400"
            }`}
          >
            {wish.is_fulfilled ? (
              <CheckCircle2 size={17} />
            ) : (
              <Circle size={17} />
            )}
          </button>
          <button
            onClick={() => onDelete(wish.id)}
            className="text-coc-faint hover:text-red-400 transition-colors"
            title="削除"
          >
            <X size={15} />
          </button>
        </div>
      </div>
      <p
        className={`text-[15px] leading-relaxed whitespace-pre-wrap border-l-2 pl-3 ${
          wish.is_fulfilled
            ? "text-coc-muted border-green-900 line-through"
            : "text-coc-text border-coc-border font-crimson"
        }`}
      >
        {wish.wish_text}
      </p>
    </div>
  );
}
