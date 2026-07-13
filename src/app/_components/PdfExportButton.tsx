"use client";

import { FileText, Printer } from "lucide-react";

type Props = { characterId: string };

export default function PdfExportButton({ characterId }: Props) {
  function handlePrint() {
    window.open(`/characters/${characterId}/print`, "_blank");
  }

  function handleDownload() {
    window.location.href = `/api/characters/${characterId}/export-pdf`;
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handlePrint}
        title="印刷プレビューを開く"
        className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
      >
        <Printer size={14} />
        印刷
      </button>
      <button
        onClick={handleDownload}
        title="キャラクターシートをHTMLファイルとしてダウンロード（ブラウザで開いてPDF保存可）"
        className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
      >
        <FileText size={14} />
        PDFでダウンロード
      </button>
    </div>
  );
}
