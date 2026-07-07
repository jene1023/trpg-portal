"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

type Props = {
  scenarioId: string;
};

export default function RecruitShareButton({ scenarioId }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/scenarios/${scenarioId}/recruit`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-coc-border bg-coc-surface px-3 py-1.5 text-sm text-coc-text hover:border-coc-gold hover:text-coc-gold transition-colors"
    >
      <UserPlus size={15} />
      {copied ? "コピー済み！" : "募集ページを共有"}
    </button>
  );
}
