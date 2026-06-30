"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase, isSupabaseConfigured, SkillTemplate } from "@/lib/supabase";

const inputClass =
  "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold-dim transition-colors";

export default function SkillTemplatesPage() {
  const [templates, setTemplates] = useState<SkillTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [occupationName, setOccupationName] = useState("");
  const [skillName, setSkillName] = useState("");
  const [isOccupation, setIsOccupation] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("skill_templates")
      .select("*")
      .order("occupation_name", { ascending: true })
      .order("skill_name", { ascending: true });
    if (data) setTemplates(data as SkillTemplate[]);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!occupationName.trim() || !skillName.trim()) {
      setErrorMsg("職業名と技能名を入力してください");
      return;
    }
    if (!isSupabaseConfigured) return;
    setSaving(true);
    setErrorMsg("");
    const { error } = await supabase.from("skill_templates").insert({
      occupation_name: occupationName.trim(),
      skill_name: skillName.trim(),
      is_occupation: isOccupation,
    });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setSkillName("");
      await load();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) return;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("skill_templates").delete().eq("id", id);
  }

  const grouped = templates.reduce<Record<string, SkillTemplate[]>>((acc, t) => {
    (acc[t.occupation_name] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-2">
        職業技能テンプレート
      </h1>
      <p className="text-sm text-coc-muted mb-6">
        よく使う職業の初期技能セットを登録しておくと、キャラクター作成時に一括で読み込めます。
      </p>

      {errorMsg && (
        <div className="rounded-md border border-red-800 bg-red-950/50 p-3 text-sm text-red-300 mb-4">
          {errorMsg}
        </div>
      )}

      {/* 追加フォーム */}
      <form
        onSubmit={handleAdd}
        className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3 mb-8"
      >
        <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest">
          技能を追加
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
          <div>
            <label className="block text-xs text-coc-muted mb-1">職業名</label>
            <input
              value={occupationName}
              onChange={(e) => setOccupationName(e.target.value)}
              placeholder="探偵"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-coc-muted mb-1">技能名</label>
            <input
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="目星"
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-1.5 pb-2">
            <input
              type="checkbox"
              checked={isOccupation}
              onChange={(e) => setIsOccupation(e.target.checked)}
              className="w-4 h-4 accent-coc-gold"
              id="is-occupation"
            />
            <label htmlFor="is-occupation" className="text-xs text-coc-muted">
              職業技能
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-coc-gold-dim bg-coc-raised px-3 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors disabled:opacity-50"
          >
            <Plus size={16} />
            追加
          </button>
        </div>
      </form>

      {loading && (
        <div className="flex justify-center items-center py-16 text-coc-muted font-crimson text-lg italic animate-pulse">
          読み込み中...
        </div>
      )}

      {!loading && Object.keys(grouped).length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-5xl text-coc-faint select-none">✦</span>
          <p className="text-coc-muted font-crimson text-lg italic text-center">
            まだテンプレートが登録されていません。
          </p>
        </div>
      )}

      {!loading && Object.keys(grouped).length > 0 && (
        <div className="space-y-5">
          {Object.entries(grouped).map(([occupation, rows]) => (
            <div
              key={occupation}
              className="rounded-lg border border-coc-border bg-coc-surface p-4"
            >
              <h3 className="font-cinzel text-base font-semibold text-coc-gold mb-3">
                {occupation}
              </h3>
              <div className="space-y-1.5">
                {rows.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-coc-border bg-coc-raised px-3 py-1.5"
                  >
                    <span className="text-sm text-coc-text">
                      {t.skill_name}
                      {t.is_occupation && (
                        <span className="ml-2 text-xs text-coc-gold">職業技能</span>
                      )}
                    </span>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-coc-faint hover:text-red-400 transition-colors p-1"
                      aria-label="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
