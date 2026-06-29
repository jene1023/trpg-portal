"use client";

import { FileText } from "lucide-react";

type Props = { characterId: string };

export default function PdfExportButton({ characterId }: Props) {
  function handlePrint() {
    window.open(`/characters/${characterId}/print`, "_blank");
  }

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
    >
      <FileText size={14} />
      PDF出力
    </button>
  );
}
