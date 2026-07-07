"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

type GeneratedDraft = {
  synopsis: string;
  gm_notes: string;
};

type Props = {
  currentTitle?: string;
  onApplySynopsis: (synopsis: string) => void;
  onApplyGmNotes: (gm_notes: string) => void;
};

export default function AIScenarioDraftGenerator({ currentTitle, onApplySynopsis, onApplyGmNotes }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<GeneratedDraft | null>(null);
  const [appliedSynopsis, setAppliedSynopsis] = useState(false);
  const [appliedGmNotes, setAppliedGmNotes] = useState(false);

  const [inputs, setInputs] = useState({
    setting: "",
    era: "",
    keywords: "",
    num_players: "",
  });

  function handleInputChange(e: { target: { name: string; value: string } }) {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  }

  async function generate() {
    setError(null);
    setLoading(true);
    setDraft(null);
    setAppliedSynopsis(false);
    setAppliedGmNotes(false);

    try {
      const res = await fetch("/api/ai/scenario-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentTitle,
          setting: inputs.setting,
          era: inputs.era,
          keywords: inputs.keywords,
          num_players: inputs.num_players,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "生成に失敗しました。");
        return;
      }
      setDraft(data.result as GeneratedDraft);
    } catch {
      setError("ネットワークエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors";
  const labelClass = "block text-xs font-medium text-coc-muted mb-1";

  return (
    <div className="rounded-lg border border-coc-border bg-coc-surface overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-coc-raised transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-coc-gold" />
          <span className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
            AIでシノプシスを下書き
          </span>
        </div>
        {open ? <ChevronUp size={16} className="text-coc-muted" /> : <ChevronDown size={16} className="text-coc-muted" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-coc-border pt-4">
          <p className="text-xs text-coc-muted">
            舞台・時代・キーワードを入力するとAIがシノプシスとGMメモの下書きを生成します。
            生成後に「このシノプシスを使う」ボタンでフォームへ反映できます。
          </p>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelClass}>舞台・場所</label>
              <input
                name="setting"
                value={inputs.setting}
                onChange={handleInputChange}
                placeholder="例: マサチューセッツ州アーカム、海辺の漁村"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>時代設定</label>
              <select
                name="era"
                value={inputs.era}
                onChange={handleInputChange}
                className={fieldClass}
              >
                <option value="">-- 選択してください --</option>
                <option value="1920年代（クラシック）">1920年代（クラシック）</option>
                <option value="現代">現代</option>
                <option value="明治・大正時代">明治・大正時代</option>
                <option value="中世・ファンタジー">中世・ファンタジー</option>
                <option value="未来・SF">未来・SF</option>
                <option value="その他">その他</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>主要キーワード・テーマ</label>
              <input
                name="keywords"
                value={inputs.keywords}
                onChange={handleInputChange}
                placeholder="例: 行方不明の教授、怪しい儀式、古い洋館"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>プレイ人数</label>
              <input
                name="num_players"
                value={inputs.num_players}
                onChange={handleInputChange}
                placeholder="例: 3〜4人"
                className={fieldClass}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-coc-gold text-black font-semibold text-sm px-4 py-2 disabled:opacity-50 hover:brightness-110 transition-all"
          >
            <Sparkles size={14} />
            {loading ? "生成中…" : "生成する"}
          </button>

          {error && (
            <div className="rounded-lg border border-red-700 bg-red-900/20 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {draft && (
            <div className="space-y-3">
              {draft.synopsis && (
                <div className="rounded-md border border-coc-border bg-coc-void overflow-hidden">
                  <div className="px-3 py-1.5 border-b border-coc-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-coc-gold">シノプシス</span>
                    {appliedSynopsis ? (
                      <span className="text-xs text-green-400">✓ 反映済み</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onApplySynopsis(draft.synopsis);
                          setAppliedSynopsis(true);
                        }}
                        className="text-xs text-coc-gold hover:underline"
                      >
                        このシノプシスを使う
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={draft.synopsis}
                    onChange={(e) => setDraft((prev) => prev ? { ...prev, synopsis: e.target.value } : prev)}
                    className="w-full px-3 py-2 text-sm text-coc-text bg-transparent resize-none focus:outline-none"
                  />
                </div>
              )}

              {draft.gm_notes && (
                <div className="rounded-md border border-coc-border bg-coc-void overflow-hidden">
                  <div className="px-3 py-1.5 border-b border-coc-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-coc-gold">GMメモ（KP専用）</span>
                    {appliedGmNotes ? (
                      <span className="text-xs text-green-400">✓ 反映済み</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onApplyGmNotes(draft.gm_notes);
                          setAppliedGmNotes(true);
                        }}
                        className="text-xs text-coc-gold hover:underline"
                      >
                        このGMメモを使う
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={draft.gm_notes}
                    onChange={(e) => setDraft((prev) => prev ? { ...prev, gm_notes: e.target.value } : prev)}
                    className="w-full px-3 py-2 text-sm text-coc-text bg-transparent resize-none focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
