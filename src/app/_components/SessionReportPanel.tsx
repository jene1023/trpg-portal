"use client";

import { useState } from "react";
import { Download, Sparkles, FileText } from "lucide-react";
import { SessionLog, DiceRoll, GrowthHistory, ScenarioClue, SuccessLevel } from "@/lib/supabase";

type Props = {
  characterId: string;
  sessionId: string;
  characterName: string;
  occupation: string | null;
  session: SessionLog;
  diceRolls: DiceRoll[];
  growthHistory: GrowthHistory[];
  clues: ScenarioClue[];
};

const SUCCESS_LABELS: Record<SuccessLevel, string> = {
  critical_success: "決定的成功",
  success: "成功",
  failure: "失敗",
  fumble: "致命的失敗",
};

const CLUE_STATUS_LABELS: Record<string, string> = {
  found: "発見済み",
  investigating: "調査中",
  resolved: "解決済み",
};

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildReportHtml(
  characterName: string,
  occupation: string | null,
  session: SessionLog,
  diceRolls: DiceRoll[],
  growthHistory: GrowthHistory[],
  clues: ScenarioClue[],
  aiSummary: string,
  generatedAt: string,
): string {
  const highlights = diceRolls.filter(
    (r) => r.success_level === "critical_success" || r.success_level === "fumble"
  );
  const sessionTitle = `セッション${session.session_number}：${session.title}`;

  const statsSection =
    session.san_loss > 0 || session.hp_loss > 0
      ? `<h2>セッション統計</h2>
<div class="stat-row">
  ${session.san_loss > 0 ? `<span class="stat-san">SAN喪失: -${session.san_loss}</span>` : ""}
  ${session.hp_loss > 0 ? `<span class="stat-hp">HP喪失: -${session.hp_loss}</span>` : ""}
</div>`
      : "";

  const summarySection = session.summary
    ? `<h2>セッションサマリー</h2>
<p class="summary-text">${escHtml(session.summary)}</p>`
    : "";

  const aiSection = aiSummary
    ? `<h2>AIサマリー</h2>
<p class="ai-summary-text">${escHtml(aiSummary)}</p>`
    : "";

  const diceSection =
    highlights.length > 0
      ? `<h2>ダイスハイライト</h2>
${highlights
  .map(
    (r) =>
      `<div class="dice-item">
  <span>${escHtml(r.skill_name)}</span>
  <span class="${r.success_level === "critical_success" ? "dice-cs" : "dice-fumble"}">${r.roll_value} — ${SUCCESS_LABELS[r.success_level]}</span>
</div>`
  )
  .join("\n")}`
      : "";

  const growthSection =
    growthHistory.length > 0
      ? `<h2>技能成長チェック</h2>
${growthHistory
  .map(
    (g) =>
      `<div class="growth-item">
  ${escHtml(g.skill_name)}: <span class="growth-up">${g.old_value} → ${g.new_value}</span>${g.session_label ? ` <span class="growth-label">${escHtml(g.session_label)}</span>` : ""}
</div>`
  )
  .join("\n")}`
      : "";

  const clueSection =
    clues.length > 0
      ? `<h2>取得クルー</h2>
${clues
  .map((c) => {
    const statusClass =
      c.status === "found"
        ? "status-found"
        : c.status === "investigating"
        ? "status-investigating"
        : "status-resolved";
    const statusLabel = CLUE_STATUS_LABELS[c.status] ?? c.status;
    return `<div class="clue-item">
  <strong>${escHtml(c.title)}</strong><span class="status-badge ${statusClass}">${statusLabel}</span>
  ${c.content ? `<div class="clue-content">${escHtml(c.content)}</div>` : ""}
</div>`;
  })
  .join("\n")}`
      : "";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(sessionTitle)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', 'Times New Roman', serif; background: #1a1410; color: #d4c5a0; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.7; }
  h1 { font-size: 1.6rem; color: #c9a84c; margin-bottom: 0.25rem; letter-spacing: 0.05em; }
  h2 { font-size: 0.85rem; color: #9a8060; text-transform: uppercase; letter-spacing: 0.12em; border-bottom: 1px solid #3a2e20; padding-bottom: 0.3rem; margin-bottom: 1rem; margin-top: 2rem; }
  .char-info { color: #b8a880; font-size: 0.9rem; margin-bottom: 0.2rem; }
  .date { color: #7a6a50; font-size: 0.8rem; margin-bottom: 2rem; }
  .stat-row { display: flex; gap: 2rem; }
  .stat-san { color: #8080d0; font-size: 0.95rem; }
  .stat-hp { color: #d05050; font-size: 0.95rem; }
  .summary-text { font-size: 0.95rem; white-space: pre-wrap; color: #c8b890; }
  .ai-summary-text { font-size: 0.95rem; white-space: pre-wrap; color: #c0d0c0; font-style: italic; }
  .dice-item { padding: 0.4rem 0; border-bottom: 1px solid #2a2010; display: flex; justify-content: space-between; font-size: 0.9rem; }
  .dice-item:last-child { border-bottom: none; }
  .dice-cs { color: #c9a84c; }
  .dice-fumble { color: #d05050; }
  .growth-item { padding: 0.4rem 0; border-bottom: 1px solid #2a2010; font-size: 0.9rem; }
  .growth-item:last-child { border-bottom: none; }
  .growth-up { color: #50c050; }
  .growth-label { color: #7a6a50; font-size: 0.8rem; margin-left: 0.5rem; }
  .clue-item { padding: 0.5rem 0; border-bottom: 1px solid #2a2010; font-size: 0.9rem; }
  .clue-item:last-child { border-bottom: none; }
  .clue-content { color: #9a8a70; font-size: 0.8rem; margin-top: 0.2rem; }
  .status-badge { display: inline-block; padding: 0.1rem 0.4rem; border-radius: 3px; font-size: 0.75rem; border: 1px solid; margin-left: 0.5rem; vertical-align: middle; }
  .status-found { color: #6080c0; border-color: #3050a0; }
  .status-investigating { color: #c0a040; border-color: #a08020; }
  .status-resolved { color: #50a050; border-color: #308030; }
  footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #3a2e20; font-size: 0.75rem; color: #5a4a30; text-align: center; }
</style>
</head>
<body>
<h1>${escHtml(sessionTitle)}</h1>
<div class="char-info">${escHtml(characterName)}${occupation ? `（${escHtml(occupation)}）` : ""}</div>
${session.played_at ? `<div class="date">${escHtml(session.played_at)}</div>` : ""}
${statsSection}
${summarySection}
${aiSection}
${diceSection}
${growthSection}
${clueSection}
<footer>Generated by CoC Portal — ${escHtml(generatedAt)}</footer>
</body>
</html>`;
}

export default function SessionReportPanel({
  characterId,
  sessionId,
  characterName,
  occupation,
  session,
  diceRolls,
  growthHistory,
  clues,
}: Props) {
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const highlights = diceRolls.filter(
    (r) => r.success_level === "critical_success" || r.success_level === "fumble"
  );

  async function generateAiSummary() {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/session-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, characterId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成に失敗しました");
      setAiSummary(data.summary ?? "");
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setAiLoading(false);
    }
  }

  function downloadHtml() {
    const generatedAt = new Date().toISOString().slice(0, 10);
    const html = buildReportHtml(
      characterName,
      occupation,
      session,
      diceRolls,
      growthHistory,
      clues,
      aiSummary,
      generatedAt,
    );
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-${session.session_number}-report.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Preview summary card */}
      <div className="rounded-xl border border-coc-border bg-coc-surface p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-coc-text">
            セッション{session.session_number}：{session.title}
          </h2>
          <p className="text-sm text-coc-muted mt-0.5">
            {characterName}
            {occupation ? `（${occupation}）` : ""}
          </p>
          {session.played_at && (
            <p className="text-xs text-coc-muted mt-0.5">{session.played_at}</p>
          )}
        </div>

        <div className="flex gap-4 text-sm">
          {session.san_loss > 0 && (
            <span className="text-[var(--color-coc-san)]">SAN -{session.san_loss}</span>
          )}
          {session.hp_loss > 0 && (
            <span className="text-[var(--color-coc-hp)]">HP -{session.hp_loss}</span>
          )}
          {session.san_loss === 0 && session.hp_loss === 0 && (
            <span className="text-xs text-coc-muted">ダメージ記録なし</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border border-coc-border bg-coc-bg p-3">
            <p className="text-xs text-coc-muted mb-1">ダイスハイライト</p>
            <p className="text-2xl font-bold text-coc-gold">{highlights.length}</p>
          </div>
          <div className="rounded-lg border border-coc-border bg-coc-bg p-3">
            <p className="text-xs text-coc-muted mb-1">技能成長</p>
            <p className="text-2xl font-bold text-coc-gold">{growthHistory.length}</p>
          </div>
          <div className="rounded-lg border border-coc-border bg-coc-bg p-3">
            <p className="text-xs text-coc-muted mb-1">クルー</p>
            <p className="text-2xl font-bold text-coc-gold">{clues.length}</p>
          </div>
        </div>
      </div>

      {/* AI summary section */}
      <div className="rounded-xl border border-coc-border bg-coc-surface p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-coc-text flex items-center gap-1.5">
            <Sparkles size={14} className="text-coc-gold" />
            AIサマリー（オプション）
          </h3>
          <button
            onClick={generateAiSummary}
            disabled={aiLoading}
            className="text-xs text-coc-gold hover:brightness-125 disabled:opacity-50 transition-all"
          >
            {aiLoading ? "生成中..." : aiSummary ? "再生成" : "生成する"}
          </button>
        </div>
        {aiError && <p className="text-xs text-red-400 mb-2">{aiError}</p>}
        {aiSummary ? (
          <textarea
            value={aiSummary}
            onChange={(e) => setAiSummary(e.target.value)}
            rows={5}
            className="w-full rounded border border-coc-border bg-coc-bg text-coc-text text-sm p-2 resize-y focus:outline-none focus:border-coc-gold"
          />
        ) : (
          <p className="text-xs text-coc-muted">
            「生成する」をクリックするとAIがリプレイ風サマリーを生成します。HTMLレポートに追記されます。
          </p>
        )}
      </div>

      {/* Download button */}
      <button
        onClick={downloadHtml}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-coc-gold bg-coc-gold/10 px-6 py-3 font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors"
      >
        <Download size={18} />
        HTMLレポートをダウンロード
      </button>

      <p className="flex items-center justify-center gap-1 text-xs text-coc-muted">
        <FileText size={12} />
        DiscordやSNSへのセッションレポート投稿にご活用ください。
      </p>
    </div>
  );
}
