"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured, CharacterSecret, SecretSeverity } from "@/lib/supabase";

type Props = {
  characterId: string;
  initialSecrets: CharacterSecret[];
};

const SEVERITY_LABELS: Record<SecretSeverity, string> = {
  minor: "軽微",
  major: "重要",
  critical: "極秘",
};

const SEVERITY_CLASSES: Record<SecretSeverity, string> = {
  minor: "bg-coc-raised border-coc-border text-coc-muted",
  major: "bg-yellow-900/30 border-yellow-700/60 text-yellow-300",
  critical: "bg-red-900/30 border-red-700/60 text-red-300",
};

export default function SecretsClient({ characterId, initialSecrets }: Props) {
  const [secrets, setSecrets] = useState<CharacterSecret[]>(initialSecrets);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [severity, setSeverity] = useState<SecretSeverity>("minor");
  const [shareWithKp, setShareWithKp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function addSecret() {
    if (!title.trim() || !content.trim()) return;
    if (!isSupabaseConfigured) return;
    setSaving(true);
    setError("");
    const { data, error: err } = await supabase
      .from("character_secrets")
      .insert({
        character_id: characterId,
        title: title.trim(),
        content: content.trim(),
        severity,
        share_with_kp: shareWithKp,
      })
      .select()
      .single();
    setSaving(false);
    if (err || !data) {
      setError("追加に失敗しました");
      return;
    }
    setSecrets((prev) => [data as CharacterSecret, ...prev]);
    setTitle("");
    setContent("");
    setSeverity("minor");
    setShareWithKp(false);
  }

  async function toggleShareWithKp(id: string, current: boolean) {
    if (!isSupabaseConfigured) return;
    const { error: err } = await supabase
      .from("character_secrets")
      .update({ share_with_kp: !current })
      .eq("id", id);
    if (!err) {
      setSecrets((prev) =>
        prev.map((s) => (s.id === id ? { ...s, share_with_kp: !current } : s))
      );
    }
  }

  async function deleteSecret(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("character_secrets").delete().eq("id", id);
    setSecrets((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* 追加フォーム */}
      <div className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">秘密を追加</h2>
        <input
          type="text"
          placeholder="タイトル（例: 兄の死の真相）"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60"
        />
        <textarea
          placeholder="秘密の詳細内容"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full rounded border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted/50 focus:outline-none focus:border-coc-gold/60 resize-none"
        />
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-coc-muted">重要度</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as SecretSeverity)}
              className="rounded border border-coc-border bg-coc-void px-2 py-1.5 text-sm text-coc-text focus:outline-none focus:border-coc-gold/60"
            >
              <option value="minor">軽微</option>
              <option value="major">重要</option>
              <option value="critical">極秘</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-coc-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={shareWithKp}
              onChange={(e) => setShareWithKp(e.target.checked)}
              className="rounded border-coc-border"
            />
            KPと共有
          </label>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={addSecret}
          disabled={saving || !title.trim() || !content.trim()}
          className="rounded bg-coc-gold/20 border border-coc-gold/50 px-4 py-1.5 text-sm text-coc-gold hover:bg-coc-gold/30 transition-colors disabled:opacity-50"
        >
          {saving ? "追加中..." : "追加"}
        </button>
      </div>

      {/* 一覧 */}
      {secrets.length === 0 ? (
        <p className="text-center text-sm text-coc-muted py-8">秘密メモがまだ登録されていません</p>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-coc-muted uppercase tracking-widest">
            秘密一覧（{secrets.length}件）
          </h2>
          {secrets.map((secret) => (
            <SecretCard
              key={secret.id}
              secret={secret}
              onToggleShare={toggleShareWithKp}
              onDelete={deleteSecret}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SecretCard({
  secret,
  onToggleShare,
  onDelete,
}: {
  secret: CharacterSecret;
  onToggleShare: (id: string, current: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div className="rounded-lg border border-coc-border coc-card-bg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-coc-text leading-tight">{secret.title}</h3>
        <span
          className={`shrink-0 rounded border px-2 py-0.5 text-xs font-semibold ${SEVERITY_CLASSES[secret.severity]}`}
        >
          {SEVERITY_LABELS[secret.severity]}
        </span>
      </div>
      <p className="text-sm text-coc-text/90 leading-relaxed whitespace-pre-wrap font-crimson">
        {secret.content}
      </p>
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 text-xs text-coc-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={secret.share_with_kp}
            onChange={() => onToggleShare(secret.id, secret.share_with_kp)}
            className="rounded border-coc-border"
          />
          KPと共有
          {secret.share_with_kp && (
            <span className="rounded bg-coc-gold/20 border border-coc-gold/40 px-1.5 py-0.5 text-coc-gold">
              共有中
            </span>
          )}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-coc-muted">
            {new Date(secret.created_at).toLocaleDateString("ja-JP")}
          </span>
          <button
            onClick={() => onDelete(secret.id)}
            className="rounded border border-red-900/40 px-2.5 py-1 text-xs text-red-500/60 hover:text-red-400 hover:border-red-800/60 transition-colors"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
