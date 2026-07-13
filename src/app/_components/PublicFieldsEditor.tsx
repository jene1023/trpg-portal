"use client";

import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const FIELD_DEFS = [
  { key: "portrait_url", label: "立ち絵" },
  { key: "occupation", label: "職業" },
  { key: "age", label: "年齢" },
  { key: "gender", label: "性別" },
  { key: "birthday", label: "誕生日" },
  { key: "furigana", label: "ふりがな" },
  { key: "appearance", label: "外見（体格・髪色・瞳色）" },
  { key: "player_name", label: "PL名" },
  { key: "catchphrase", label: "キャッチフレーズ" },
  { key: "mythos_books_read", label: "神話書読了数" },
  { key: "stats", label: "能力値" },
  { key: "derived_stats", label: "派生ステータス（HP/MP/SAN）" },
  { key: "skills", label: "技能" },
  { key: "traits", label: "特質" },
  { key: "spells", label: "呪文" },
  { key: "background", label: "背景・経歴" },
  { key: "quotes", label: "名言録" },
] as const;

const DEFAULT_FIELDS = ["portrait_url", "occupation", "age", "background"];

type Props = {
  characterId: string;
  initialFields: string[] | null;
};

export default function PublicFieldsEditor({ characterId, initialFields }: Props) {
  const effective = initialFields ?? DEFAULT_FIELDS;
  const [selected, setSelected] = useState<Set<string>>(new Set(effective));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = async (key: string) => {
    const next = new Set<string>(selected);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelected(next);
    await persist([...next]);
  };

  const persist = async (keys: string[]) => {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    await supabase.from("characters").update({ public_fields: keys }).eq("id", characterId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-coc-muted">
        チェックした項目が公開プロフィールページ（/c/…）に表示されます。名前とステータスは常に表示されます。
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {FIELD_DEFS.map(({ key, label }) => (
          <label
            key={key}
            className="flex items-center gap-2 rounded border border-coc-border bg-coc-surface px-3 py-2 text-sm cursor-pointer hover:border-coc-gold/50 transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.has(key)}
              onChange={() => toggle(key)}
              className="accent-coc-gold"
            />
            <span className="text-coc-text">{label}</span>
          </label>
        ))}
      </div>
      <div className="h-4 text-xs">
        {saving && <span className="text-coc-muted">保存中…</span>}
        {!saving && saved && <span className="text-green-400">保存しました</span>}
      </div>
    </div>
  );
}
