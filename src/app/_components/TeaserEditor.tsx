"use client";

import { useState } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  initialTeaserText: string | null;
  initialPlayersMin: number | null;
  initialPlayersMax: number | null;
  initialEstimatedHours: number | null;
  initialIsPublic: boolean;
};

export default function TeaserEditor({
  scenarioId,
  initialTeaserText,
  initialPlayersMin,
  initialPlayersMax,
  initialEstimatedHours,
  initialIsPublic,
}: Props) {
  const [teaserText, setTeaserText] = useState(initialTeaserText ?? "");
  const [playersMin, setPlayersMin] = useState(initialPlayersMin?.toString() ?? "");
  const [playersMax, setPlayersMax] = useState(initialPlayersMax?.toString() ?? "");
  const [estimatedHours, setEstimatedHours] = useState(initialEstimatedHours?.toString() ?? "");
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSave() {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    await supabase.from("scenarios").update({
      teaser_text: teaserText || null,
      recommended_players_min: playersMin ? parseInt(playersMin, 10) : null,
      recommended_players_max: playersMax ? parseInt(playersMax, 10) : null,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
      teaser_is_public: isPublic,
    }).eq("id", scenarioId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleCopy() {
    const url = `${window.location.origin}/s/${scenarioId}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-xs text-coc-muted mb-1">雰囲気・あらすじ（ネタバレなし）</label>
        <textarea
          value={teaserText}
          onChange={(e) => setTeaserText(e.target.value)}
          rows={4}
          placeholder="参加者を惹き付けるネタバレなしの紹介文を書いてください..."
          className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none resize-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-coc-muted mb-1">推奨人数（最小）</label>
          <input
            type="number"
            min={1}
            value={playersMin}
            onChange={(e) => setPlayersMin(e.target.value)}
            placeholder="2"
            className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-coc-muted mb-1">推奨人数（最大）</label>
          <input
            type="number"
            min={1}
            value={playersMax}
            onChange={(e) => setPlayersMax(e.target.value)}
            placeholder="4"
            className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-coc-muted mb-1">目安時間（時間）</label>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            placeholder="3"
            className="w-full rounded-lg border border-coc-border bg-coc-bg px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:border-coc-gold focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          onClick={() => setIsPublic((v) => !v)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
            isPublic
              ? "border-coc-gold bg-coc-gold/10 text-coc-gold"
              : "border-coc-border text-coc-muted hover:text-coc-text hover:border-coc-border-glow"
          }`}
        >
          {isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
          {isPublic ? "公開中" : "非公開"}
        </button>

        <div className="flex items-center gap-2">
          {isPublic && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-coc-border px-3 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? "コピー済み" : "URLをコピー"}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg border border-coc-gold bg-coc-gold/10 px-4 py-2 text-sm font-medium text-coc-gold hover:bg-coc-gold/20 transition-colors disabled:opacity-50"
          >
            {saving ? "保存中..." : saved ? "保存済み" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
