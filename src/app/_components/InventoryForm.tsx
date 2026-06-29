"use client";

import { useState } from "react";
import { Dice6 } from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  InventoryItem,
  ItemType,
  CharacterSkill,
  SuccessLevel,
} from "@/lib/supabase";

type Props = {
  characterId: string;
  initialItems: InventoryItem[];
  skills: CharacterSkill[];
};

type FormState = {
  item_type: ItemType;
  name: string;
  damage: string;
  range: string;
  ammo_current: string;
  ammo_max: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  item_type: "weapon",
  name: "",
  damage: "",
  range: "",
  ammo_current: "",
  ammo_max: "",
  notes: "",
};

type SuccessDegree = "決定的成功" | "通常成功" | "失敗" | "致命的失敗";

function judge(roll: number, skillValue: number): SuccessDegree {
  const isFumble = skillValue < 50 ? roll >= 96 : roll === 100;
  if (isFumble) return "致命的失敗";
  if (roll <= Math.floor(skillValue / 5)) return "決定的成功";
  if (roll <= skillValue) return "通常成功";
  return "失敗";
}

const DEGREE_STYLE: Record<SuccessDegree, { border: string; text: string; bg: string }> = {
  "決定的成功": { border: "border-yellow-400", text: "text-yellow-400", bg: "bg-yellow-400/5" },
  "通常成功":   { border: "border-green-500",  text: "text-green-400",  bg: "bg-green-500/5" },
  "失敗":       { border: "border-coc-border",  text: "text-coc-muted",  bg: "bg-coc-raised"  },
  "致命的失敗": { border: "border-red-600",     text: "text-red-500",    bg: "bg-red-600/5"   },
};

const DEGREE_TO_LEVEL: Record<SuccessDegree, SuccessLevel> = {
  "決定的成功": "critical_success",
  "通常成功": "success",
  "失敗": "failure",
  "致命的失敗": "fumble",
};

const COMBAT_KEYWORDS = [
  "格闘", "拳銃", "ライフル", "散弾", "SMG", "回避",
  "射撃", "武道", "自動小銃", "重火器", "投擲",
];

function isCombatSkill(name: string): boolean {
  return COMBAT_KEYWORDS.some((k) => name.includes(k));
}

type RollResult = { roll: number; degree: SuccessDegree; skillName: string; skillValue: number };

export default function InventoryForm({ characterId, initialItems, skills }: Props) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [rollWeaponId, setRollWeaponId] = useState<string | null>(null);
  const [rollSkillId, setRollSkillId] = useState<string>("");
  const [rollResult, setRollResult] = useState<RollResult | null>(null);
  const [rolling, setRolling] = useState(false);

  const sortedSkills = [...skills].sort((a, b) => {
    const aC = isCombatSkill(a.skill_name) ? 0 : 1;
    const bC = isCombatSkill(b.skill_name) ? 0 : 1;
    if (aC !== bC) return aC - bC;
    return a.skill_name.localeCompare(b.skill_name, "ja");
  });

  function toggleRoll(weaponId: string) {
    if (rollWeaponId === weaponId) {
      setRollWeaponId(null);
      setRollResult(null);
    } else {
      setRollWeaponId(weaponId);
      setRollResult(null);
      setRollSkillId(sortedSkills[0]?.id ?? "");
    }
  }

  function rollForWeapon() {
    if (rolling || !rollSkillId) return;
    const skill = skills.find((s) => s.id === rollSkillId);
    if (!skill) return;

    setRolling(true);
    setRollResult(null);
    setTimeout(() => {
      const rolled = Math.floor(Math.random() * 100) + 1;
      const degree = judge(rolled, skill.current_value);
      setRollResult({
        roll: rolled,
        degree,
        skillName: skill.skill_name,
        skillValue: skill.current_value,
      });
      setRolling(false);

      if (isSupabaseConfigured) {
        supabase.from("dice_rolls").insert({
          character_id: characterId,
          skill_name: skill.skill_name,
          skill_value: skill.current_value,
          roll_value: rolled,
          success_level: DEGREE_TO_LEVEL[degree],
          rolled_at: new Date().toISOString(),
        });
      }
    }, 350);
  }

  function change(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!isSupabaseConfigured) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        character_id: characterId,
        item_type: form.item_type,
        name: form.name.trim(),
        damage: form.item_type === "weapon" && form.damage.trim() ? form.damage.trim() : null,
        range: form.item_type === "weapon" && form.range.trim() ? form.range.trim() : null,
        ammo_current: form.item_type === "weapon" && form.ammo_current !== "" ? parseInt(form.ammo_current) || null : null,
        ammo_max: form.item_type === "weapon" && form.ammo_max !== "" ? parseInt(form.ammo_max) || null : null,
        notes: form.notes.trim() || null,
      })
      .select()
      .single();
    setSaving(false);

    if (!error && data) {
      setItems((prev) => [...prev, data as InventoryItem]);
      setForm(EMPTY_FORM);
      setOpen(false);
    }
  }

  async function remove(id: string) {
    if (!isSupabaseConfigured) return;
    await supabase.from("inventory_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (rollWeaponId === id) {
      setRollWeaponId(null);
      setRollResult(null);
    }
  }

  const weapons = items.filter((i) => i.item_type === "weapon");
  const others = items.filter((i) => i.item_type === "item");

  const inputClass =
    "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-muted focus:outline-none focus:border-coc-gold";
  const labelClass = "block text-xs text-coc-muted mb-1";
  const sectionTitle = "font-cinzel text-xs font-semibold text-coc-muted uppercase tracking-widest mb-2";

  return (
    <div className="space-y-6">
      {/* 武器セクション */}
      <div>
        <h2 className={sectionTitle}>武器</h2>
        {weapons.length === 0 && (
          <p className="text-sm text-coc-muted text-center py-3">武器なし</p>
        )}
        <div className="space-y-2">
          {weapons.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-coc-border bg-coc-surface overflow-hidden"
            >
              <div className="p-3 flex gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-coc-text">{item.name}</p>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {item.damage && (
                      <span className="text-xs text-coc-muted">
                        ダメージ: <span className="text-coc-text">{item.damage}</span>
                      </span>
                    )}
                    {item.range && (
                      <span className="text-xs text-coc-muted">
                        射程: <span className="text-coc-text">{item.range}</span>
                      </span>
                    )}
                    {item.ammo_max != null && (
                      <span className="text-xs text-coc-muted">
                        弾薬: <span className="text-coc-text">{item.ammo_current ?? "?"}/{item.ammo_max}</span>
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-coc-muted mt-1 whitespace-pre-wrap">{item.notes}</p>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {skills.length > 0 && (
                    <button
                      onClick={() => toggleRoll(item.id)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${
                        rollWeaponId === item.id
                          ? "border-coc-gold text-coc-gold bg-coc-gold/10"
                          : "border-coc-border text-coc-muted hover:border-coc-gold hover:text-coc-gold"
                      }`}
                    >
                      <Dice6 size={12} />
                      ロール
                    </button>
                  )}
                  <button
                    onClick={() => remove(item.id)}
                    className="text-coc-muted hover:text-red-400 text-xs transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>

              {/* 戦闘ロールパネル */}
              {rollWeaponId === item.id && (
                <div className="border-t border-coc-border bg-coc-raised px-3 py-3 space-y-2">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-coc-muted block mb-1">技能を選んで判定</label>
                      <select
                        value={rollSkillId}
                        onChange={(e) => {
                          setRollSkillId(e.target.value);
                          setRollResult(null);
                        }}
                        className="w-full rounded-md border border-coc-border bg-coc-void text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
                      >
                        {sortedSkills.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.skill_name}（{s.current_value}%）
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={rollForWeapon}
                      disabled={rolling || !rollSkillId}
                      className="flex items-center gap-1.5 rounded-md border border-coc-gold text-coc-gold px-3 py-1.5 text-sm font-medium hover:bg-coc-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      <Dice6 size={14} className={rolling ? "animate-spin" : ""} />
                      判定
                    </button>
                  </div>

                  {rollResult && (
                    <div
                      className={`rounded-md border px-4 py-3 flex items-center justify-between ${DEGREE_STYLE[rollResult.degree].border} ${DEGREE_STYLE[rollResult.degree].bg}`}
                    >
                      <div>
                        <p className="text-xs text-coc-muted mb-0.5">
                          {rollResult.skillName}（{rollResult.skillValue}%）
                        </p>
                        <p className={`font-bold text-base ${DEGREE_STYLE[rollResult.degree].text}`}>
                          {rollResult.degree}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-coc-muted mb-0.5">ロール</p>
                        <p className={`font-cinzel text-2xl font-bold ${DEGREE_STYLE[rollResult.degree].text}`}>
                          {rollResult.roll}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 一般アイテムセクション */}
      <div>
        <h2 className={sectionTitle}>所持品・アイテム</h2>
        {others.length === 0 && (
          <p className="text-sm text-coc-muted text-center py-3">所持品なし</p>
        )}
        <div className="space-y-2">
          {others.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-coc-border bg-coc-surface p-3 flex gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-coc-text">{item.name}</p>
                {item.notes && (
                  <p className="text-xs text-coc-muted mt-1 whitespace-pre-wrap">{item.notes}</p>
                )}
              </div>
              <button
                onClick={() => remove(item.id)}
                className="shrink-0 text-coc-muted hover:text-red-400 text-xs transition-colors"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 追加フォーム */}
      {open ? (
        <form
          onSubmit={submit}
          className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3"
        >
          <h3 className="font-cinzel text-sm font-semibold text-coc-gold tracking-widest">
            アイテムを追加
          </h3>

          <div>
            <label className={labelClass}>種別</label>
            <div className="flex gap-2">
              {(["weapon", "item"] as ItemType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => change("item_type", t)}
                  className={`flex-1 rounded-md border py-1.5 text-sm transition-colors ${
                    form.item_type === t
                      ? "border-coc-gold text-coc-gold bg-coc-gold/10"
                      : "border-coc-border text-coc-muted hover:border-coc-border-glow"
                  }`}
                >
                  {t === "weapon" ? "武器" : "アイテム"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>名前 *</label>
            <input
              type="text"
              required
              placeholder={form.item_type === "weapon" ? "例: .45オート" : "例: 懐中電灯"}
              value={form.name}
              onChange={(e) => change("name", e.target.value)}
              className={inputClass}
            />
          </div>

          {form.item_type === "weapon" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>ダメージ</label>
                  <input
                    type="text"
                    placeholder="例: 1D10+2"
                    value={form.damage}
                    onChange={(e) => change("damage", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>射程</label>
                  <input
                    type="text"
                    placeholder="例: 15m"
                    value={form.range}
                    onChange={(e) => change("range", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>弾薬（現在）</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="例: 7"
                    value={form.ammo_current}
                    onChange={(e) => change("ammo_current", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>弾薬（最大）</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="例: 7"
                    value={form.ammo_max}
                    onChange={(e) => change("ammo_max", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>メモ</label>
            <input
              type="text"
              placeholder="例: 父の形見のリボルバー"
              value={form.notes}
              onChange={(e) => change("notes", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="flex-1 rounded-lg bg-coc-gold text-black font-semibold text-sm py-2 disabled:opacity-40 hover:brightness-110 transition-all"
            >
              {saving ? "保存中…" : "追加する"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 rounded-lg border border-coc-border text-coc-muted hover:text-coc-text text-sm transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-lg border border-dashed border-coc-border text-coc-muted hover:text-coc-text hover:border-coc-border-glow py-3 text-sm transition-colors"
        >
          ＋ アイテムを追加
        </button>
      )}
    </div>
  );
}
