"use client";

import { useState } from "react";
import { BookMarked, X } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioTemplateData } from "@/lib/supabase";

type Props = {
  scenarioId: string;
  scenarioTitle: string;
};

const fieldClass =
  "w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors";
const labelClass = "block text-xs font-medium text-coc-muted mb-1";

export default function SaveAsTemplateButton({ scenarioId, scenarioTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`${scenarioTitle} テンプレート`);
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!isSupabaseConfigured || !title.trim()) return;
    setSaving(true);
    setError(null);

    const [{ data: scenes }, { data: handouts }, { count: creatureCount }, { data: npcs }] =
      await Promise.all([
        supabase
          .from("scenario_scenes")
          .select("title, scene_order")
          .eq("scenario_id", scenarioId)
          .order("scene_order"),
        supabase.from("handouts").select("id").eq("scenario_id", scenarioId),
        supabase.from("creatures").select("*", { count: "exact", head: true }).eq("scenario_id", scenarioId),
        supabase.from("npcs").select("name, purpose").eq("scenario_name", scenarioTitle),
      ]);

    const templateData: ScenarioTemplateData = {
      scenes: (scenes ?? []).map((s) => ({ title: s.title, order: s.scene_order as number })),
      npc_slots: (npcs ?? []).map((n) => ({ role: n.purpose ?? n.name })),
      handout_count: (handouts ?? []).length,
      creature_slots: Array.from({ length: creatureCount ?? 0 }, () => ({ role: "クリーチャー" })),
    };

    const { error: err } = await supabase.from("scenario_templates").insert({
      title: title.trim(),
      description: description.trim() || null,
      template_data: templateData,
      is_public: isPublic,
    });

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    setTimeout(() => {
      setOpen(false);
      setSaved(false);
    }, 2000);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setTitle(`${scenarioTitle} テンプレート`);
          setOpen(true);
        }}
        className="flex items-center gap-1.5 rounded-lg border border-coc-border bg-coc-raised px-3 py-1.5 text-xs text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
      >
        <BookMarked size={13} />
        テンプレートとして保存
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-coc-border bg-coc-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-sm font-semibold text-coc-text">シナリオ構造をテンプレートとして保存</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-coc-faint hover:text-coc-text transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <p className="text-xs text-coc-muted">
        このシナリオのシーン・ハンドアウト枠・NPC・クリーチャー枠を自動抽出してテンプレートとして保存します。
      </p>

      <div>
        <label className={labelClass}>テンプレート名 *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="テンプレート名"
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass}>説明（任意）</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例: 3シーン構成・ハンドアウト2枚・NPC2体"
          className={fieldClass}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is-public-template"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="rounded border-coc-border"
        />
        <label htmlFor="is-public-template" className="text-xs text-coc-muted cursor-pointer">
          コミュニティに公開する（他のKPも閲覧可能になります）
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-red-700 bg-red-900/20 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {saved && (
        <div className="rounded-lg border border-green-700 bg-green-900/20 px-3 py-2 text-sm text-green-400">
          テンプレートとして保存しました！
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !title.trim() || saved}
          className="rounded-lg bg-coc-gold text-black font-semibold text-sm px-5 py-2.5 disabled:opacity-50 hover:brightness-110 transition-all"
        >
          {saving ? "保存中…" : saved ? "保存完了" : "テンプレートとして保存"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-coc-border px-4 py-2.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
