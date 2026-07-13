"use client";

import { useState } from "react";
import { Archive } from "lucide-react";

type Props = {
  scenarioId: string;
  scenarioTitle: string;
};

export default function ScenarioZipDownloadButton({ scenarioId, scenarioTitle }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/scenarios/${scenarioId}/export-zip`);
      if (!res.ok) throw new Error("ダウンロードに失敗しました。");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = scenarioTitle.replace(/[/\\:*?"<>|]/g, "_").slice(0, 40);
      a.download = `scenario-${safeTitle}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-1.5 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors disabled:opacity-50"
    >
      <Archive size={14} />
      {loading ? "生成中…" : "資料をZIPで保存"}
    </button>
  );
}
