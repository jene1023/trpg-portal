"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { SKILLS_7TH, Skill } from "@/lib/rules-data";
import { calcHpMax, calcMpMax, calcSanStart } from "@/lib/coc-calc";

type Stats = {
  str: number;
  con: number;
  pow: number;
  dex: number;
  app: number;
  siz: number;
  int: number;
  edu: number;
};

type OccupationDef = {
  name: string;
  formula: (s: Stats) => number;
  label: string;
};

const OCCUPATIONS: OccupationDef[] = [
  { name: "探偵",        label: "EDU×2+DEX×2",  formula: (s) => s.edu * 2 + s.dex * 2 },
  { name: "医師",        label: "EDU×4",         formula: (s) => s.edu * 4 },
  { name: "学者",        label: "EDU×4",         formula: (s) => s.edu * 4 },
  { name: "弁護士",      label: "EDU×4",         formula: (s) => s.edu * 4 },
  { name: "作家",        label: "EDU×2+DEX×2",  formula: (s) => s.edu * 2 + s.dex * 2 },
  { name: "警察官",      label: "EDU×2+STR×2",  formula: (s) => s.edu * 2 + s.str * 2 },
  { name: "軍人",        label: "EDU×2+DEX×2",  formula: (s) => s.edu * 2 + s.dex * 2 },
  { name: "神父/牧師",   label: "EDU×4",         formula: (s) => s.edu * 4 },
  { name: "芸術家",      label: "EDU×2+APP×2",  formula: (s) => s.edu * 2 + s.app * 2 },
  { name: "エンジニア",  label: "EDU×4",         formula: (s) => s.edu * 4 },
];

const ABILITY_DEFS = [
  { key: "str" as const, label: "STR（筋力）" },
  { key: "con" as const, label: "CON（体力）" },
  { key: "pow" as const, label: "POW（精神力）" },
  { key: "dex" as const, label: "DEX（敏捷性）" },
  { key: "app" as const, label: "APP（外見）" },
  { key: "siz" as const, label: "SIZ（体格）" },
  { key: "int" as const, label: "INT（知性）" },
  { key: "edu" as const, label: "EDU（教育）" },
];

function computeBase(base: string, stats: Stats): number {
  if (base === "DEX×2") return stats.dex * 2;
  if (base === "APP×2") return stats.app * 2;
  if (base === "EDU×5") return stats.edu * 5;
  return parseInt(base) || 0;
}

const CATEGORIES = ["戦闘", "探索", "対人", "知識", "技術", "身体", "運転", "芸術・言語"];

const inputClass =
  "w-full rounded-md border border-coc-border bg-coc-void px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold-dim transition-colors";
const labelClass = "block text-xs text-coc-muted mb-1";
const sectionClass = "rounded-lg border border-coc-border bg-coc-surface p-4";

export default function BuildSimulatorPage() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    str: 50, con: 50, pow: 50, dex: 50,
    app: 50, siz: 50, int: 50, edu: 50,
  });

  const [occupationName, setOccupationName] = useState(OCCUPATIONS[0].name);

  const [occAlloc, setOccAlloc] = useState<Record<string, number>>({});
  const [intAlloc, setIntAlloc] = useState<Record<string, number>>({});

  const selectedOcc = OCCUPATIONS.find((o) => o.name === occupationName) ?? OCCUPATIONS[0];

  const derived = useMemo(() => {
    const hpMax = calcHpMax(stats.con, stats.siz);
    const mpMax = calcMpMax(stats.pow);
    const sanStart = calcSanStart(stats.pow);
    const occPoints = selectedOcc.formula(stats);
    const intPoints = stats.int * 2;
    return { hpMax, mpMax, sanStart, occPoints, intPoints };
  }, [stats, selectedOcc]);

  const usedOcc = useMemo(() => {
    let sum = 0;
    for (const v of Object.values(occAlloc)) sum += v as number;
    return sum;
  }, [occAlloc]);
  const usedInt = useMemo(() => {
    let sum = 0;
    for (const v of Object.values(intAlloc)) sum += v as number;
    return sum;
  }, [intAlloc]);
  const remainOcc = derived.occPoints - usedOcc;
  const remainInt = derived.intPoints - usedInt;

  function setStat(key: keyof Stats, val: number) {
    const clamped = Math.max(1, Math.min(100, val));
    setStats((prev: Stats) => ({ ...prev, [key]: clamped }));
  }

  function setOcc(skillName: string, val: number) {
    const current = occAlloc[skillName] ?? 0;
    const delta = val - current;
    if (delta > 0 && delta > remainOcc) return;
    setOccAlloc((prev: Record<string, number>) => ({ ...prev, [skillName]: Math.max(0, val) }));
  }

  function setInt(skillName: string, val: number) {
    const current = intAlloc[skillName] ?? 0;
    const delta = val - current;
    if (delta > 0 && delta > remainInt) return;
    setIntAlloc((prev: Record<string, number>) => ({ ...prev, [skillName]: Math.max(0, val) }));
  }

  function handleCreate() {
    const params = new URLSearchParams({
      str: String(stats.str),
      con: String(stats.con),
      pow: String(stats.pow),
      dex: String(stats.dex),
      app: String(stats.app),
      siz: String(stats.siz),
      int_stat: String(stats.int),
      edu: String(stats.edu),
      occupation: occupationName,
    });
    router.push(`/characters/new?${params.toString()}`);
  }

  const groupedSkills = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      category: cat,
      skills: SKILLS_7TH.filter((s) => s.category === cat),
    })).filter((g) => g.skills.length > 0);
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/characters"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          キャラクター一覧
        </Link>
      </div>

      <div>
        <h1 className="font-cinzel text-2xl font-bold text-coc-gold mb-1">
          ビルドシミュレーター
        </h1>
        <p className="text-sm text-coc-muted">
          CoC 7版のキャラクター作成を事前にシミュレーションできます。ログイン不要。
        </p>
      </div>

      {/* ポイント残量バナー */}
      <div className="flex gap-4 flex-wrap">
        <div className={`flex-1 min-w-[160px] rounded-lg border p-3 text-center ${remainOcc < 0 ? "border-red-500 bg-red-900/20" : "border-coc-gold bg-coc-gold-dim/20"}`}>
          <div className="text-xs text-coc-muted mb-0.5">職業ポイント残り</div>
          <div className={`text-2xl font-bold ${remainOcc < 0 ? "text-red-400" : "text-coc-gold"}`}>
            {remainOcc}
            <span className="text-sm font-normal text-coc-muted ml-1">/ {derived.occPoints}</span>
          </div>
        </div>
        <div className={`flex-1 min-w-[160px] rounded-lg border p-3 text-center ${remainInt < 0 ? "border-red-500 bg-red-900/20" : "border-coc-border bg-coc-surface"}`}>
          <div className="text-xs text-coc-muted mb-0.5">趣味ポイント残り</div>
          <div className={`text-2xl font-bold ${remainInt < 0 ? "text-red-400" : "text-coc-text"}`}>
            {remainInt}
            <span className="text-sm font-normal text-coc-muted ml-1">/ {derived.intPoints}</span>
          </div>
        </div>
        <div className="flex-1 min-w-[160px] rounded-lg border border-coc-border bg-coc-surface p-3 text-center">
          <div className="text-xs text-coc-muted mb-0.5">HP最大 / MP最大 / 初期SAN</div>
          <div className="text-lg font-bold text-coc-text">
            {derived.hpMax} / {derived.mpMax} / {derived.sanStart}
          </div>
        </div>
      </div>

      {/* Step 1: 能力値 */}
      <div className={sectionClass}>
        <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest mb-4">
          Step 1 — 能力値入力
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ABILITY_DEFS.map(({ key, label }) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-coc-muted">{label}</label>
                <span className="text-sm font-bold text-coc-gold w-8 text-right">{stats[key]}</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={stats[key]}
                onChange={(e: { target: { value: string } }) => setStat(key, Number(e.target.value))}
                className="w-full accent-coc-gold"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: 職業選択 */}
      <div className={sectionClass}>
        <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest mb-4">
          Step 2 — 職業選択
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>職業</label>
            <select
              value={occupationName}
              onChange={(e: { target: { value: string } }) => setOccupationName(e.target.value)}
              className={inputClass}
            >
              {OCCUPATIONS.map((occ) => (
                <option key={occ.name} value={occ.name}>
                  {occ.name}（{occ.label} = {occ.formula(stats)}pt）
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end gap-1">
            <div className="text-xs text-coc-muted">職業ポイント計算式</div>
            <div className="text-lg font-bold text-coc-gold">
              {selectedOcc.label} = {derived.occPoints}pt
            </div>
            <div className="text-xs text-coc-muted">
              趣味ポイント: INT({stats.int}) × 2 = {derived.intPoints}pt
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: 技能配分 */}
      <div className={sectionClass}>
        <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest mb-2">
          Step 3 — 技能ポイント配分
        </h2>
        <p className="text-xs text-coc-muted mb-4">
          職業Pt・趣味Ptをそれぞれ入力欄に配分してください。残量を超えると入力が止まります。
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-coc-border">
                <th className="text-left py-2 px-2 text-xs text-coc-muted font-normal">技能</th>
                <th className="text-center py-2 px-2 text-xs text-coc-muted font-normal w-20">基本値</th>
                <th className="text-center py-2 px-2 text-xs text-coc-muted font-normal w-24">
                  職業Pt
                  <br />
                  <span className="text-coc-gold">残{remainOcc}</span>
                </th>
                <th className="text-center py-2 px-2 text-xs text-coc-muted font-normal w-24">
                  趣味Pt
                  <br />
                  <span className="text-coc-text">残{remainInt}</span>
                </th>
                <th className="text-center py-2 px-2 text-xs text-coc-muted font-normal w-20">合計値</th>
              </tr>
            </thead>
            <tbody>
              {groupedSkills.map(({ category, skills }: { category: string; skills: Skill[] }) => (
                <>
                  <tr key={`cat-${category}`} className="bg-coc-void/50">
                    <td colSpan={5} className="py-1 px-2 text-xs text-coc-gold font-semibold border-b border-coc-border/50">
                      {category}
                    </td>
                  </tr>
                  {skills.map((skill: Skill) => {
                    const base = computeBase(skill.base, stats);
                    const occ = occAlloc[skill.name] ?? 0;
                    const int_ = intAlloc[skill.name] ?? 0;
                    const total = Math.min(99, base + occ + int_);
                    return (
                      <tr key={skill.name} className="border-b border-coc-border/30 hover:bg-coc-raised/30">
                        <td className="py-1.5 px-2 text-coc-text">{skill.name}</td>
                        <td className="py-1.5 px-2 text-center text-coc-muted">{base}%</td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            min={0}
                            max={remainOcc + occ}
                            value={occ || ""}
                            placeholder="0"
                            onChange={(e: { target: { value: string } }) => setOcc(skill.name, Number(e.target.value) || 0)}
                            className="w-full rounded border border-coc-border bg-coc-void px-2 py-0.5 text-center text-xs text-coc-gold focus:outline-none focus:border-coc-gold-dim"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            min={0}
                            max={remainInt + int_}
                            value={int_ || ""}
                            placeholder="0"
                            onChange={(e: { target: { value: string } }) => setInt(skill.name, Number(e.target.value) || 0)}
                            className="w-full rounded border border-coc-border bg-coc-void px-2 py-0.5 text-center text-xs text-coc-text focus:outline-none focus:border-coc-gold-dim"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold text-coc-text">
                          {total}%
                        </td>
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* キャラ作成へ */}
      <div className="flex flex-col sm:flex-row gap-3 pb-6">
        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 rounded-lg bg-coc-gold px-6 py-3 text-sm font-bold text-coc-void hover:bg-amber-400 transition-colors"
        >
          <Zap size={16} />
          このビルドでキャラ作成へ
        </button>
        <button
          onClick={() => {
            setOccAlloc({});
            setIntAlloc({});
            setStats({ str: 50, con: 50, pow: 50, dex: 50, app: 50, siz: 50, int: 50, edu: 50 });
          }}
          className="rounded-lg border border-coc-border px-6 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-gold-dim transition-colors"
        >
          リセット
        </button>
      </div>
    </div>
  );
}
