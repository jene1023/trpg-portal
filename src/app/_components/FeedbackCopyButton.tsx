"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

type Props = { path: string };

export default function FeedbackCopyButton({ path }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-gold-dim transition-colors"
    >
      {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
      {copied ? "コピー済み" : "URLをコピー"}
    </button>
  );
}
