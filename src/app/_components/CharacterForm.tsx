"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Trash2, Plus, Upload } from "lucide-react";
import Image from "next/image";
import { supabase, isSupabaseConfigured, Character, CharacterSkill, CharacterStatus } from "@/lib/supabase";
import {
  calcHpMax,
  calcMpMax,
  calcSanStart,
  calcDamageBonus,
  calcBuild,
  calcMov,
} from "@/lib/coc-calc";

type SkillRow = Omit<CharacterSkill, "id" | "character_id"> & { tempId: string };

type Props = {
  initialData?: Character;
  initialSkills?: CharacterSkill[];
};

const STATUS_OPTIONS: { value: CharacterStatus; label: string }[] = [
  { value: "alive",   label: "生存" },
  { value: "dead",    label: "死亡" },
  { value: "insane",  label: "狂気" },
  { value: "retired", label: "引退" },
];

const DEFAULT_SKILLS: SkillRow[] = [
  { tempId: uuidv4(), skill_name: "目星",   base_value: 25, current_value: 25, is_occupation: false },
  { tempId: uuidv4(), skill_name: "聞き耳", base_value: 20, current_value: 20, is_occupation: false },
  { tempId: uuidv4(), skill_name: "図書館", base_value: 25, current_value: 25, is_occupation: false },
  { tempId: uuidv4(), skill_name: "回避",   base_value: 0,  current_value: 0,  is_occupation: false },
  { tempId: uuidv4(), skill_name: "心理学", base_value: 10, current_value: 10, is_occupation: false },
  { tempId: uuidv4(), skill_name: "説得",   base_value: 10, current_value: 10, is_occupation: false },
];

const inputClass =
  "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text placeholder:text-coc-faint focus:outline-none focus:border-coc-gold-dim transition-colors";
const labelClass = "block text-xs text-coc-muted mb-1";
const sectionClass = "rounded-lg border border-coc-border bg-coc-surface p-4 space-y-4";
const sectionTitle = "font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest";

export default function CharacterForm({ initialData, initialSkills }: Props) {
  const router = useRouter();
  const isEdit = !!initialData;
  const charId = initialData?.id ?? uuidv4();

  // --- 基本情報 ---
  const [name, setName] = useState(initialData?.name ?? "");
  const [playerName, setPlayerName] = useState(initialData?.player_name ?? "");
  const [occupation, setOccupation] = useState(initialData?.occupation ?? "");
  const [catchphrase, setCatchphrase] = useState(initialData?.catchphrase ?? "");
  const [age, setAge] = useState(initialData?.age?.toString() ?? "");
  const [gender, setGender] = useState(initialData?.gender ?? "");
  const [scenarioName, setScenarioName] = useState(initialData?.scenario_name ?? "");
  const [status, setStatus] = useState<CharacterStatus>(initialData?.status ?? "alive");

  // --- 能力値 ---
  const [str, setStr] = useState(initialData?.str ?? 50);
  const [con, setCon] = useState(initialData?.con ?? 50);
  const [pow, setPow] = useState(initialData?.pow ?? 50);
  const [dex, setDex] = useState(initialData?.dex ?? 50);
  const [app, setApp] = useState(initialData?.app ?? 50);
  const [siz, setSiz] = useState(initialData?.siz ?? 50);
  const [intStat, setIntStat] = useState(initialData?.int_stat ?? 50);
  const [edu, setEdu] = useState(initialData?.edu ?? 50);

  // --- 派生ステータス ---
  const [hpMax, setHpMax] = useState(initialData?.hp_max ?? 10);
  const [hpCurrent, setHpCurrent] = useState(initialData?.hp_current ?? 10);
  const [mpMax, setMpMax] = useState(initialData?.mp_max ?? 10);
  const [mpCurrent, setMpCurrent] = useState(initialData?.mp_current ?? 10);
  const [sanStart, setSanStart] = useState(initialData?.san_start ?? 50);
  const [sanCurrent, setSanCurrent] = useState(initialData?.san_current ?? 50);
  const [sanMax, setSanMax] = useState(initialData?.san_max ?? 99);
  const [luck, setLuck] = useState(initialData?.luck ?? 50);

  // --- 技能 ---
  const [skills, setSkills] = useState<SkillRow[]>(() =>
    initialSkills
      ? initialSkills.map((s) => ({ ...s, tempId: s.id }))
      : DEFAULT_SKILLS
  );

  // --- 背景 ---
  const [background, setBackground] = useState(initialData?.background ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  // --- ポートレート ---
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(
    initialData?.portrait_url ?? null
  );

  // --- 送信状態 ---
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 能力値変更時に派生ステータスを自動計算
  useEffect(() => {
    const newHpMax = calcHpMax(con, siz);
    const newMpMax = calcMpMax(pow);
    const newSanStart = calcSanStart(pow);
    setHpMax(newHpMax);
    setMpMax(newMpMax);
    setSanStart(newSanStart);
    // 新規作成時のみ現在値も同期
    if (!isEdit) {
      setHpCurrent(newHpMax);
      setMpCurrent(newMpMax);
      setSanCurrent(newSanStart);
    }
  }, [con, pow, siz, isEdit]);

  // ポートレートファイル選択
  const handlePortraitChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("画像は5MB以下にしてください");
      return;
    }
    setPortraitFile(file);
    setPortraitPreview(URL.createObjectURL(file));
  }, []);

  // 技能行操作
  function addSkill() {
    setSkills((prev) => [
      ...prev,
      { tempId: uuidv4(), skill_name: "", base_value: 0, current_value: 0, is_occupation: false },
    ]);
  }

  function updateSkill(tempId: string, field: Partial<Omit<SkillRow, "tempId">>) {
    setSkills((prev) => prev.map((s) => (s.tempId === tempId ? { ...s, ...field } : s)));
  }

  function removeSkill(tempId: string) {
    setSkills((prev) => prev.filter((s) => s.tempId !== tempId));
  }

  // 保存
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setErrorMsg("キャラクター名を入力してください"); return; }
    if (!isSupabaseConfigured) {
      setErrorMsg("Supabase が設定されていません。.env.local に URL と ANON KEY を設定してください。");
      return;
    }
    setSaving(true);
    setErrorMsg("");

    try {
      // ポートレートアップロード
      let portraitUrl = initialData?.portrait_url ?? null;
      if (portraitFile) {
        const ext = portraitFile.name.split(".").pop();
        const path = `portraits/${charId}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("character-portraits")
          .upload(path, portraitFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage
          .from("character-portraits")
          .getPublicUrl(path);
        portraitUrl = urlData.publicUrl;
      }

      const payload = {
        id: charId,
        name: name.trim(),
        player_name: playerName.trim() || null,
        portrait_url: portraitUrl,
        occupation: occupation.trim() || null,
        catchphrase: catchphrase.trim() || null,
        age: age ? parseInt(age) : null,
        gender: gender.trim() || null,
        scenario_name: scenarioName.trim() || null,
        status,
        str, con, pow, dex, app, siz, int_stat: intStat, edu,
        hp_max: hpMax, hp_current: hpCurrent,
        mp_max: mpMax, mp_current: mpCurrent,
        san_start: sanStart, san_current: sanCurrent, san_max: sanMax,
        luck,
        background: background.trim() || null,
        notes: notes.trim() || null,
      };

      if (isEdit) {
        const { error } = await supabase.from("characters").update(payload).eq("id", charId);
        if (error) throw error;
        // 技能: 既存を全削除して再挿入
        await supabase.from("character_skills").delete().eq("character_id", charId);
      } else {
        const { error } = await supabase.from("characters").insert(payload);
        if (error) throw error;
      }

      // 技能を挿入
      const validSkills = skills.filter((s) => s.skill_name.trim());
      if (validSkills.length > 0) {
        const { error: skillErr } = await supabase.from("character_skills").insert(
          validSkills.map((s) => ({
            character_id: charId,
            skill_name: s.skill_name.trim(),
            base_value: s.base_value,
            current_value: s.current_value,
            is_occupation: s.is_occupation,
          }))
        );
        if (skillErr) throw skillErr;
      }

      router.push(`/characters/${charId}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  // 削除
  async function handleDelete() {
    if (!isSupabaseConfigured) return;
    setSaving(true);
    await supabase.from("characters").delete().eq("id", charId);
    router.push("/characters");
  }

  const statField = (
    label: string,
    value: number,
    setter: (v: number) => void
  ) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type="number"
        min={1}
        max={99}
        value={value}
        onChange={(e) => setter(parseInt(e.target.value) || 0)}
        className={`${inputClass} text-center`}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4 py-8 space-y-5">
      <h1 className="font-cinzel text-2xl font-bold text-coc-text">
        {isEdit ? "キャラクター編集" : "新しいキャラクター"}
      </h1>

      {/* エラー */}
      {errorMsg && (
        <div className="rounded-md border border-red-800 bg-red-950/50 p-3 text-sm text-red-300">
          {errorMsg}
        </div>
      )}

      {/* === 基本情報 === */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>基本情報</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>キャラクター名 *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="田中一郎" required />
          </div>
          <div>
            <label className={labelClass}>職業</label>
            <input value={occupation} onChange={(e) => setOccupation(e.target.value)} className={inputClass} placeholder="探偵" />
          </div>
          <div>
            <label className={labelClass}>年齢</label>
            <input type="number" min={1} max={120} value={age} onChange={(e) => setAge(e.target.value)} className={inputClass} placeholder="28" />
          </div>
          <div>
            <label className={labelClass}>性別</label>
            <input value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass} placeholder="男性" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>キャッチフレーズ</label>
            <input value={catchphrase} onChange={(e) => setCatchphrase(e.target.value)} className={inputClass} placeholder="真実だけが俺の武器" />
          </div>
          <div>
            <label className={labelClass}>プレイヤー名</label>
            <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className={inputClass} placeholder="Yusei" />
          </div>
          <div>
            <label className={labelClass}>シナリオ名</label>
            <input value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} className={inputClass} placeholder="深海の呼声" />
          </div>
          <div>
            <label className={labelClass}>ステータス</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as CharacterStatus)} className={inputClass}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ポートレートアップロード */}
        <div>
          <label className={labelClass}>ポートレート画像（5MB以下）</label>
          <div className="flex items-start gap-4">
            {portraitPreview && (
              <div className="relative w-20 h-28 rounded-md overflow-hidden border border-coc-border shrink-0">
                <Image src={portraitPreview} alt="プレビュー" fill className="object-cover" />
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-coc-border px-4 py-3 text-sm text-coc-muted hover:border-coc-border-glow hover:text-coc-text transition-colors">
              <Upload size={16} />
              画像を選択
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePortraitChange} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* === 能力値 === */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>能力値</h2>
        <div className="grid grid-cols-4 gap-3">
          {statField("STR", str, setStr)}
          {statField("CON", con, setCon)}
          {statField("POW", pow, setPow)}
          {statField("DEX", dex, setDex)}
          {statField("APP", app, setApp)}
          {statField("SIZ", siz, setSiz)}
          {statField("INT", intStat, setIntStat)}
          {statField("EDU", edu, setEdu)}
        </div>
        {/* 自動計算表示 */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-xs text-coc-muted border-t border-coc-border">
          <div>HP最大値（自動）: <span className="text-coc-text font-bold">{hpMax}</span></div>
          <div>MP最大値（自動）: <span className="text-coc-text font-bold">{mpMax}</span></div>
          <div>初期SAN（自動）: <span className="text-coc-text font-bold">{sanStart}</span></div>
          <div>ダメージボーナス: <span className="text-coc-text font-bold">{calcDamageBonus(str, siz)}</span></div>
          <div>ビルド: <span className="text-coc-text font-bold">{calcBuild(str, siz)}</span></div>
          <div>移動力: <span className="text-coc-text font-bold">{calcMov(str, dex, siz)}</span></div>
        </div>
      </div>

      {/* === 現在ステータス === */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>現在ステータス</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>HP現在値 / 最大{hpMax}</label>
            <input type="number" min={0} max={hpMax} value={hpCurrent} onChange={(e) => setHpCurrent(parseInt(e.target.value) || 0)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>MP現在値 / 最大{mpMax}</label>
            <input type="number" min={0} max={mpMax} value={mpCurrent} onChange={(e) => setMpCurrent(parseInt(e.target.value) || 0)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>幸運</label>
            <input type="number" min={0} max={99} value={luck} onChange={(e) => setLuck(parseInt(e.target.value) || 0)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>SAN現在値</label>
            <input type="number" min={0} max={99} value={sanCurrent} onChange={(e) => setSanCurrent(parseInt(e.target.value) || 0)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>SAN最大値</label>
            <input type="number" min={0} max={99} value={sanMax} onChange={(e) => setSanMax(parseInt(e.target.value) || 0)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>SAN初期値</label>
            <input type="number" min={0} max={99} value={sanStart} readOnly className={`${inputClass} opacity-50 cursor-not-allowed`} />
          </div>
        </div>
      </div>

      {/* === 技能 === */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between">
          <h2 className={sectionTitle}>技能</h2>
          <button
            type="button"
            onClick={addSkill}
            className="flex items-center gap-1 text-xs text-coc-gold hover:text-coc-text transition-colors"
          >
            <Plus size={14} /> 技能追加
          </button>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_60px_60px_auto_auto] gap-2 text-xs text-coc-muted px-1">
            <span>技能名</span>
            <span className="text-center">基本値</span>
            <span className="text-center">現在値</span>
            <span className="text-center">職業</span>
            <span />
          </div>
          {skills.map((skill) => (
            <div key={skill.tempId} className="grid grid-cols-[1fr_60px_60px_auto_auto] gap-2 items-center">
              <input
                value={skill.skill_name}
                onChange={(e) => updateSkill(skill.tempId, { skill_name: e.target.value })}
                placeholder="技能名"
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                max={99}
                value={skill.base_value}
                onChange={(e) => updateSkill(skill.tempId, { base_value: parseInt(e.target.value) || 0 })}
                className={`${inputClass} text-center px-1`}
              />
              <input
                type="number"
                min={0}
                max={99}
                value={skill.current_value}
                onChange={(e) => updateSkill(skill.tempId, { current_value: parseInt(e.target.value) || 0 })}
                className={`${inputClass} text-center px-1`}
              />
              <input
                type="checkbox"
                checked={skill.is_occupation}
                onChange={(e) => updateSkill(skill.tempId, { is_occupation: e.target.checked })}
                className="w-4 h-4 accent-coc-gold"
                title="職業技能"
              />
              <button
                type="button"
                onClick={() => removeSkill(skill.tempId)}
                className="text-coc-faint hover:text-red-400 transition-colors p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* === 背景・メモ === */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>背景・メモ</h2>
        <div>
          <label className={labelClass}>背景・経歴</label>
          <textarea
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            rows={5}
            className={`${inputClass} resize-y font-crimson text-[15px] leading-relaxed`}
            placeholder="キャラクターの来歴、外見、性格などを記述..."
          />
        </div>
        <div>
          <label className={labelClass}>セッションメモ</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={`${inputClass} resize-y font-crimson text-[15px] leading-relaxed`}
            placeholder="セッション中のメモ、発見したアイテム、出会ったNPCなど..."
          />
        </div>
      </div>

      {/* === ボタン === */}
      <div className="flex items-center justify-between pt-2">
        {isEdit ? (
          deleteConfirm ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-400">本当に削除しますか？</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="rounded-md bg-red-900 border border-red-700 px-3 py-1.5 text-sm text-red-200 hover:bg-red-800 transition-colors"
              >
                削除する
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="text-sm text-coc-muted hover:text-coc-text transition-colors"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
              削除
            </button>
          )
        ) : (
          <span />
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-coc-gold-dim border border-coc-gold px-5 py-2 text-sm font-medium text-coc-gold hover:bg-coc-raised transition-colors disabled:opacity-50"
        >
          {saving ? "保存中..." : isEdit ? "変更を保存" : "キャラクターを作成"}
        </button>
      </div>
    </form>
  );
}
