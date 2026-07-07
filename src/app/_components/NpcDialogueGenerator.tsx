"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  npcId: string;
  npcName: string;
};

export default function NpcDialogueGenerator({ npcId, npcName }: Props) {
  const [open, setOpen] = useState(false);
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogues, setDialogues] = useState<string[]>([]);

  async function generate() {
    if (!situation.trim()) {
      setError("シチュエーションを入力してください。");
      return;
    }
    setError(null);
    setLoading(true);
    setDialogues([]);

    try {
      const res = await fetch("/api/ai/npc-dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ npcId, situation }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "生成に失敗しました。");
        return;
      }
      setDialogues(data.dialogues as string[]);
    } catch {
      setError("ネットワークエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors";

  return (
    <div className="rounded-lg border border-coc-border bg-coc-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-coc-raised transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-coc-gold" />
          <span className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
            AI発話例を生成
          </span>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-coc-muted" />
        ) : (
          <ChevronDown size={16} className="text-coc-muted" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-coc-border pt-4">
          <p className="text-xs text-coc-muted">
            {npcName} の口調・目的をもとに、指定のシチュエーションでのセリフを3パターン生成します。
          </p>

          <div>
            <label className="block text-xs font-medium text-coc-muted mb-1">
              シチュエーション
            </label>
            <input
              type="text"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="例: 尋問される、緊急事態に遭遇、探索者に初めて会う"
              className={fieldClass}
              onKeyDown={(e) => {
                if (e.key === "Enter") generate();
              }}
            />
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-coc-gold text-black font-semibold text-sm px-4 py-2 disabled:opacity-50 hover:brightness-110 transition-all"
          >
            <Sparkles size={14} />
            {loading ? "生成中…" : "発話例を生成"}
          </button>

          {error && (
            <div className="rounded-lg border border-red-700 bg-red-900/20 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {dialogues.length > 0 && (
            <div className="space-y-2">
              {dialogues.map((line, i) => (
                <div
                  key={i}
                  className="rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text whitespace-pre-wrap"
                >
                  <span className="text-xs font-semibold text-coc-gold mr-2">
                    パターン {i + 1}
                  </span>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
