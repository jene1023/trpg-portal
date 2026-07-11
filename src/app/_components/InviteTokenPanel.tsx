"use client";

import { useState } from "react";
import { Copy, RefreshCw, Check, Link as LinkIcon } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import QrCodeShare from "@/app/_components/QrCodeShare";

type Props = {
  scenarioId: string;
  scenarioTitle: string;
  initialToken: string | null;
};

function generateToken(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function InviteTokenPanel({ scenarioId, scenarioTitle, initialToken }: Props) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const joinUrl = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${token}`
    : null;

  async function handleGenerate() {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    const newToken = generateToken();
    const { error } = await supabase
      .from("scenarios")
      .update({ recruit_token: newToken })
      .eq("id", scenarioId);
    if (!error) setToken(newToken);
    setSaving(false);
  }

  async function handleRevoke() {
    if (!isSupabaseConfigured) return;
    if (!confirm("招待コードを無効化しますか？既存のURLは使用できなくなります。")) return;
    setSaving(true);
    const { error } = await supabase
      .from("scenarios")
      .update({ recruit_token: null })
      .eq("id", scenarioId);
    if (!error) setToken(null);
    setSaving(false);
  }

  async function handleCopy() {
    if (!joinUrl) return;
    await navigator.clipboard.writeText(joinUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-coc-border bg-coc-surface px-6 py-6 flex flex-col gap-5">
      {token ? (
        <>
          {/* Join URL display */}
          <div>
            <p className="text-xs text-coc-muted mb-2 flex items-center gap-1.5">
              <LinkIcon size={12} />
              招待URL
            </p>
            <div className="flex items-center gap-2">
              <p className="flex-1 rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-xs text-coc-text break-all select-all font-mono">
                {joinUrl}
              </p>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-xs text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
              >
                {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                {copied ? "コピー済み" : "コピー"}
              </button>
            </div>
          </div>

          {/* QR code */}
          <div className="flex items-center gap-3">
            {joinUrl && (
              <QrCodeShare
                url={joinUrl}
                label={`invite-${scenarioTitle}`}
              />
            )}
            <p className="text-xs text-coc-muted">
              QRコードをPLに見せて参加申請させることもできます
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1 border-t border-coc-border">
            <button
              onClick={handleGenerate}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border border-coc-border bg-coc-raised px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={saving ? "animate-spin" : ""} />
              再発行（旧URLを無効化）
            </button>
            <button
              onClick={handleRevoke}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border border-red-900 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/30 transition-colors disabled:opacity-50"
            >
              無効化
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-dashed border-coc-border px-5 py-8 text-center">
            <p className="text-sm text-coc-muted mb-1">招待コードが発行されていません</p>
            <p className="text-xs text-coc-muted/60">
              発行するとPLが自分でキャラクターを選んで参加申請できます
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={saving}
            className="w-full rounded-lg bg-coc-gold px-4 py-2.5 text-sm font-semibold text-coc-bg hover:bg-coc-gold/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "発行中..." : "招待コードを発行する"}
          </button>
        </>
      )}
    </div>
  );
}
