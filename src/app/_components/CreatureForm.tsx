"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import { supabase, isSupabaseConfigured, Scenario } from "@/lib/supabase";

type StatKey = "str" | "con" | "pow" | "dex" | "siz" | "hp" | "mp";

const STAT_LABELS: { key: StatKey; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "con", label: "CON" },
  { key: "pow", label: "POW" },
  { key: "dex", label: "DEX" },
  { key: "siz", label: "SIZ" },
  { key: "hp", label: "HP" },
  { key: "mp", label: "MP" },
];

type Props = {
  scenarioId?: string;
  redirectTo?: string;
  onSuccess?: () => void;
};

export default function CreatureForm({ scenarioId, redirectTo, onSuccess }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const [form, setForm] = useState({
    scenario_id: scenarioId ?? "",
    name: "",
    mythos_background: "",
    san_loss_success: "",
    san_loss_failure: "",
    armor: "",
    attacks: "",
    notes: "",
    can_use_spells: false,
    fear_rating: 0,
    secret_notes: "",
  });

  const [stats, setStats] = useState<Record<StatKey, string>>({
    str: "",
    con: "",
    pow: "",
    dex: "",
    siz: "",
    hp: "",
    mp: "",
  });

  useEffect(() => {
    if (scenarioId) return;
    if (!isSupabaseConfigured) return;
    supabase
      .from("scenarios")
      .select("id, title")
      .order("title")
      .then(({ data: scenarioData }) => {
        if (scenarioData) setScenarios(scenarioData as Scenario[]);
      });
  }, [scenarioId]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCheckbox(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, can_use_spells: e.target.checked }));
  }

  function handleFearRating(value: number) {
    setForm((prev) => ({ ...prev, fear_rating: value }));
  }

  function handleStatChange(e: React.ChangeEvent<HTMLInputElement>) {
    const key = e.target.name as StatKey;
    setStats((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("クリーチャー名は必須です。");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("Supabase が設定されていません。");
      return;
    }
    setSaving(true);
    setError(null);

    const statPayload: Record<string, number | null> = {};
    for (const { key } of STAT_LABELS) {
      const v = stats[key].trim();
      statPayload[key] = v !== "" ? parseInt(v, 10) : null;
    }

    const { error: err } = await supabase.from("creatures").insert({
      scenario_id: form.scenario_id || null,
      name: form.name.trim(),
      mythos_background: form.mythos_background.trim() || null,
      san_loss_success: form.san_loss_success.trim() || null,
      san_loss_failure: form.san_loss_failure.trim() || null,
      armor: form.armor.trim() || null,
      attacks: form.attacks.trim() || null,
      notes: form.notes.trim() || null,
      can_use_spells: form.can_use_spells,
      fear_rating: form.fear_rating || null,
      secret_notes: form.secret_notes.trim() || null,
      ...statPayload,
    });

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    if (onSuccess) {
      onSuccess();
      return;
    }
    router.push(redirectTo ?? "/creatures");
    router.refresh();
  }

  const fieldClass =
    "w-full rounded-lg border border-coc-border bg-coc-raised px-3 py-2 text-sm text-coc-text placeholder-coc-faint focus:outline-none focus:border-coc-gold transition-colors";
  const labelClass = "block text-xs font-medium text-coc-muted mb-1";
  const statFieldClass =
    "w-full rounded-lg border border-coc-border bg-coc-raised px-2 py-1.5 text-sm text-coc-text text-center focus:outline-none focus:border-coc-gold transition-colors";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {!scenarioId && (
        <div>
          <label htmlFor="scenario_id" className={labelClass}>
            シナリオ（任意）
          </label>
          <select
            id="scenario_id"
            name="scenario_id"
            value={form.scenario_id}
            onChange={handleChange}
            className={fieldClass}
          >
            <option value="">シナリオ未設定</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="name" className={labelClass}>
          クリーチャー名 <span className="text-coc-gold">*</span>
        </label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="例: 深きものども、クトゥルフ"
          required
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="mythos_background" className={labelClass}>
          神話的背景
        </label>
        <textarea
          id="mythos_background"
          name="mythos_background"
          value={form.mythos_background}
          onChange={handleChange}
          placeholder="クリーチャーの神話的出自・概要"
          rows={3}
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="san_loss_success" className={labelClass}>
            SAN喪失（成功時）
          </label>
          <input
            id="san_loss_success"
            name="san_loss_success"
            value={form.san_loss_success}
            onChange={handleChange}
            placeholder="例: 0/1d6"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="san_loss_failure" className={labelClass}>
            SAN喪失（失敗時）
          </label>
          <input
            id="san_loss_failure"
            name="san_loss_failure"
            value={form.san_loss_failure}
            onChange={handleChange}
            placeholder="例: 1d6/1d20"
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="attacks" className={labelClass}>
          攻撃
        </label>
        <textarea
          id="attacks"
          name="attacks"
          value={form.attacks}
          onChange={handleChange}
          placeholder="例: 爪×2 1d6+db、噛みつき 1d10"
          rows={3}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="armor" className={labelClass}>
          装甲
        </label>
        <input
          id="armor"
          name="armor"
          value={form.armor}
          onChange={handleChange}
          placeholder="例: 2点の皮膚"
          className={fieldClass}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="can_use_spells"
          type="checkbox"
          checked={form.can_use_spells}
          onChange={handleCheckbox}
          className="rounded border-coc-border accent-coc-gold"
        />
        <label htmlFor="can_use_spells" className="text-sm text-coc-text cursor-pointer">
          呪文を使用できる
        </label>
      </div>

      <div>
        <label className={labelClass}>恐怖度（Fear Rating）</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleFearRating(form.fear_rating === n ? 0 : n)}
              className="p-0.5 transition-colors"
            >
              <Star
                size={20}
                className={n <= form.fear_rating ? "text-coc-gold fill-coc-gold" : "text-coc-muted"}
              />
            </button>
          ))}
          {form.fear_rating > 0 && (
            <span className="ml-2 text-xs text-coc-muted">{form.fear_rating}/5</span>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          KP メモ
        </label>
        <textarea
          id="notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="運用上の注意・特殊能力・弱点など"
          rows={4}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="secret_notes" className={labelClass}>
          秘匿情報（KP専用）
        </label>
        <textarea
          id="secret_notes"
          name="secret_notes"
          value={form.secret_notes}
          onChange={handleChange}
          placeholder="PLには見せない秘密設定・攻略法・弱点など"
          rows={3}
          className={fieldClass}
        />
      </div>

      {/* 能力値セクション（任意） */}
      <div className="rounded-lg border border-coc-border bg-coc-surface overflow-hidden">
        <button
          type="button"
          onClick={() => setShowStats((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-coc-text hover:bg-coc-raised transition-colors"
        >
          <span>能力値を入力する（任意）</span>
          {showStats ? <ChevronUp size={16} className="text-coc-muted" /> : <ChevronDown size={16} className="text-coc-muted" />}
        </button>

        {showStats && (
          <div className="px-4 pb-4 pt-2 border-t border-coc-border">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {STAT_LABELS.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-center text-coc-muted mb-1">{label}</label>
                  <input
                    type="number"
                    name={key}
                    value={stats[key]}
                    onChange={handleStatChange}
                    placeholder="—"
                    min={1}
                    max={9999}
                    className={statFieldClass}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => onSuccess ? onSuccess() : router.push(redirectTo ?? "/creatures")}
          className="rounded-lg border border-coc-border px-4 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-muted transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors disabled:opacity-50"
        >
          {saving ? "登録中..." : "クリーチャーを登録"}
        </button>
      </div>
    </form>
  );
}
