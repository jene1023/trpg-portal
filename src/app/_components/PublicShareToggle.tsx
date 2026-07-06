"use client";

import { useState } from "react";
import { Globe, GlobeLock, Copy, Check } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import QrCodeShare from "./QrCodeShare";

type Props = {
  characterId: string;
  isPublic: boolean;
  publicSlug: string | null;
};

export default function PublicShareToggle({ characterId, isPublic: initialIsPublic, publicSlug: initialSlug }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [slug, setSlug] = useState(initialSlug);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/public/${slug}` : "";

  async function handleToggle() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      if (!isPublic) {
        const newSlug = slug ?? crypto.randomUUID().slice(0, 8);
        const { error } = await supabase
          .from("characters")
          .update({ is_public: true, public_slug: newSlug })
          .eq("id", characterId);
        if (!error) {
          setIsPublic(true);
          setSlug(newSlug);
        }
      } else {
        const { error } = await supabase
          .from("characters")
          .update({ is_public: false })
          .eq("id", characterId);
        if (!error) {
          setIsPublic(false);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
          isPublic
            ? "border-green-700 text-green-400 hover:border-green-600 hover:text-green-300"
            : "border-coc-border text-coc-muted hover:text-coc-text hover:border-coc-border-glow"
        }`}
      >
        {isPublic ? <Globe size={14} /> : <GlobeLock size={14} />}
        {loading ? "処理中…" : isPublic ? "公開中" : "公開設定"}
      </button>
      {isPublic && publicUrl && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copied ? "コピー完了" : "URLをコピー"}
          </button>
          <QrCodeShare url={publicUrl} label="character-profile" />
        </div>
      )}
    </div>
  );
}
