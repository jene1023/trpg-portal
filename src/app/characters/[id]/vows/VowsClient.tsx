"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, CharacterVow, VowStatus } from "@/lib/supabase";

type Props = {
  characterId: string;
  initialVows: CharacterVow[];
};

const STATUS_LABEL: Record<VowStatus, string> = {
  active: "追跡中",
  fulfilled: "達成",
  failed: "失敗",
  abandoned: "放棄",
};

const STATUS_COLOR: Record<VowStatus, string> = {
  active: "border-coc-gold/60 bg-coc-gold/5 text-coc-gold",
  fulfilled: "border-green-700/60 bg-green-950/20 text-green-400",
  failed: "border-red-800/60 bg-red-950/20 text-red-400",
  abandoned: "border-coc-border bg-coc-surface text-coc-muted",
};

export default function VowsClient({ characterId, initialVows }: Props) {
  const [vows, setVows] = useState<CharacterVow[]>(initialVows);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeVows = vows.filter((v) => v.status === "active");
  const resolvedVows = vows.filter((v) => v.status !== "active");

  async function addVow() {
    if (!title.trim()) return;
    if (!isSupabaseConfigured) return;
    setSaving(true);
    setError("");
    const { data, error: err } = await supabase
      .from("character_vows")
      .insert({
        character_id: characterId,
        title: title.trim(),
        description: description.trim() || null,
        status: "active",
        resolved_at: null,
      })
      .select()
      .single();
    setSaving(false);
    if (err || !data) {
      setError("追加に失敗しました");
      return;
    }
    setVows((prev) => [data as CharacterVow, ...prev]);
    setTitle("");
    setDescription("");
  }

  async function resolveVow(vowId: string, status: "fulfilled" | "failed" | "abandoned") {
    if (!isSupabaseConfigured) return;
    const resolved_at = new Date().toISOString();
    const { data, error: err } = await supabase
      .from("character_vows")
      .update({ status, resolved_at })
      .eq("id", vowId)
      .select()
      .single();
    if (err || !data) return;
    setVows((prev) => prev.map((v) => (v.id === vowId ? (data as CharacterVow) : v)));
  }

  async function reactivateVow(vowId: string) {
    if (!isSupabaseConfigured) return;
    const { data, error: err } = await supabase
      .from("character_vows")
      .update({ status: "active", resolved_at: null })
      .eq("id", vowId)
      .select()
      .single();
    if (err || !data) return;
    setVows((prev) => prev.map((v) => (v.id === vowId ? (data as CharacterVow) : v)));
  }

  async function deleteVow(vowId: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("character_vows").delete().eq("id", vowId);
    setVows((prev) => prev.filter((v) => v.id !== vowId));
  }

  return (
    <div className="space-y-6">
      {/* 追加フォーム */}
      <div className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">新しい誓約を追加</h2>
        <input
          type="text"
          placeholder="目標タイトル（例: カルトの壊滅）"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60"
        />
        <textarea
          placeholder="詳細・背景（任意）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60 resize-none"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={addVow}
          disabled={saving || !title.trim()}
          className="rounded bg-coc-gold/20 border border-coc-gold/50 px-4 py-1.5 text-sm text-coc-gold hover:bg-coc-gold/30 transition-colors disabled:opacity-50"
        >
          {saving ? "追加中..." : "追加"}
        </button>
      </div>

      {/* アクティブな誓約 */}
      {activeVows.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">追跡中</h2>
          {activeVows.map((vow) => (
            <VowCard
              key={vow.id}
              vow={vow}
              onResolve={resolveVow}
              onReactivate={reactivateVow}
              onDelete={deleteVow}
            />
          ))}
        </div>
      )}

      {activeVows.length === 0 && resolvedVows.length === 0 && (
        <p className="text-center text-sm text-coc-muted py-8">誓約が登録されていません</p>
      )}

      {/* 解決済み */}
      {resolvedVows.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">アーカイブ</h2>
          {resolvedVows.map((vow) => (
            <VowCard
              key={vow.id}
              vow={vow}
              onResolve={resolveVow}
              onReactivate={reactivateVow}
              onDelete={deleteVow}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VowCard({
  vow,
  onResolve,
  onReactivate,
  onDelete,
}: {
  vow: CharacterVow;
  onResolve: (id: string, status: "fulfilled" | "failed" | "abandoned") => Promise<void>;
  onReactivate: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const STATUS_LABEL: Record<VowStatus, string> = {
    active: "追跡中",
    fulfilled: "達成",
    failed: "失敗",
    abandoned: "放棄",
  };

  const STATUS_COLOR: Record<VowStatus, string> = {
    active: "border-coc-gold/60 text-coc-gold bg-coc-gold/10",
    fulfilled: "border-green-700/60 text-green-400 bg-green-950/20",
    failed: "border-red-800/60 text-red-400 bg-red-950/20",
    abandoned: "border-coc-border text-coc-muted bg-coc-surface",
  };

  return (
    <div className={`rounded-lg border p-4 space-y-2 ${STATUS_COLOR[vow.status]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug">{vow.title}</p>
          {vow.description && (
            <p className="text-xs text-coc-muted mt-1 leading-relaxed whitespace-pre-wrap">
              {vow.description}
            </p>
          )}
          {vow.resolved_at && (
            <p className="text-xs text-coc-muted mt-1">
              {new Date(vow.resolved_at).toLocaleDateString("ja-JP")} に決着
            </p>
          )}
        </div>
        <span className={`shrink-0 rounded border px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[vow.status]}`}>
          {STATUS_LABEL[vow.status]}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {vow.status === "active" ? (
          <>
            <button
              onClick={() => onResolve(vow.id, "fulfilled")}
              className="rounded border border-green-700/60 px-2.5 py-1 text-xs text-green-400 hover:bg-green-950/30 transition-colors"
            >
              達成
            </button>
            <button
              onClick={() => onResolve(vow.id, "failed")}
              className="rounded border border-red-800/60 px-2.5 py-1 text-xs text-red-400 hover:bg-red-950/30 transition-colors"
            >
              失敗
            </button>
            <button
              onClick={() => onResolve(vow.id, "abandoned")}
              className="rounded border border-coc-border px-2.5 py-1 text-xs text-coc-muted hover:text-coc-text transition-colors"
            >
              放棄
            </button>
          </>
        ) : (
          <button
            onClick={() => onReactivate(vow.id)}
            className="rounded border border-coc-border px-2.5 py-1 text-xs text-coc-muted hover:text-coc-text transition-colors"
          >
            再開
          </button>
        )}
        <button
          onClick={() => onDelete(vow.id)}
          className="ml-auto rounded border border-red-900/40 px-2.5 py-1 text-xs text-red-500/60 hover:text-red-400 hover:border-red-800/60 transition-colors"
        >
          削除
        </button>
      </div>
    </div>
  );
}
