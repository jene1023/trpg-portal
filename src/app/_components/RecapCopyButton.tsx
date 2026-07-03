"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

type Props = {
  text: string;
};

export default function RecapCopyButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors"
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? "コピー済み" : "マークダウン形式でコピー"}
    </button>
  );
}
