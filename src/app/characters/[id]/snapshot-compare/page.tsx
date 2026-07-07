"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, GitCompare } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type SnapshotData = {
  hp_current?: number;
  hp_max?: number;
  mp_current?: number;
  mp_max?: number;
  san_current?: number;
  san_max?: number;
  san_start?: number;
  luck?: number;
  str?: number;
  con?: number;
  pow?: number;
  dex?: number;
  app?: number;
  siz?: number;
  int_stat?: number;
  edu?: number;
  character_skills?: Array<{
    id: string;
    skill_name: string;
    current_value: number;
    base_value: number;
  }>;
};

type Snapshot = {
  id: string;
  label: string;
  taken_at: string;
  snapshot_data: SnapshotData;
};

type DiffEntry = {
  label: string;
  before: number | null;
  after: number | null;
};

type Props = { params: Promise<{ id: string }> };

const ABILITY_KEYS: Array<{ key: keyof SnapshotData; label: string }> = [
  { key: "str", label: "STR" },
  { key: "con", label: "CON" },
  { key: "pow", label: "POW" },
  { key: "dex", label: "DEX" },
  { key: "app", label: "APP" },
  { key: "siz", label: "SIZ" },
  { key: "int_stat", label: "INT" },
  { key: "edu", label: "EDU" },
  { key: "hp_current", label: "HP現在" },
  { key: "hp_max", label: "HP最大" },
  { key: "mp_current", label: "MP現在" },
  { key: "mp_max", label: "MP最大" },
  { key: "san_current", label: "SAN現在" },
  { key: "san_max", label: "SAN最大" },
  { key: "luck", label: "幸運" },
];

function DiffRow({ label, before, after }: DiffEntry) {
  const diff = (after ?? 0) - (before ?? 0);
  const changed = diff !== 0;
  const increased = diff > 0;

  return (
    <tr className="border-b border-coc-border last:border-0">
      <td className="py-2 pr-4 text-xs text-coc-muted w-24">{label}</td>
      <td className="py-2 pr-4 text-xs text-coc-text text-right w-16">{before ?? "—"}</td>
      <td className="py-2 pr-4 text-xs text-coc-text text-right w-16">{after ?? "—"}</td>
      <td className="py-2 text-xs font-semibold text-right w-20">
        {changed ? (
          <span className={increased ? "text-green-400" : "text-red-400"}>
            {increased ? "+" : ""}{diff}
          </span>
        ) : (
          <span className="text-coc-muted">—</span>
        )}
      </td>
    </tr>
  );
}

export default function SnapshotComparePage({ params }: Props) {
  const [characterId, setCharacterId] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => {
      setCharacterId(id);
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      Promise.all([
        supabase.from("characters").select("id, name").eq("id", id).single(),
        supabase
          .from("character_snapshots")
          .select("id, label, taken_at, snapshot_data")
          .eq("character_id", id)
          .order("taken_at", { ascending: false }),
      ]).then(([charRes, snapRes]) => {
        if (charRes.data) setCharacterName(charRes.data.name);
        const snaps = (snapRes.data ?? []) as Snapshot[];
        setSnapshots(snaps);
        if (snaps.length >= 2) {
          setBeforeId(snaps[1].id);
          setAfterId(snaps[0].id);
        } else if (snaps.length === 1) {
          setBeforeId(snaps[0].id);
          setAfterId(snaps[0].id);
        }
        setLoading(false);
      });
    });
  }, [params]);

  const beforeSnap = snapshots.find((s) => s.id === beforeId);
  const afterSnap = snapshots.find((s) => s.id === afterId);

  const abilityDiffs: DiffEntry[] = ABILITY_KEYS.map(({ key, label }) => ({
    label,
    before: (beforeSnap?.snapshot_data[key] as number | undefined) ?? null,
    after: (afterSnap?.snapshot_data[key] as number | undefined) ?? null,
  }));

  const changedAbilities = abilityDiffs.filter(
    (d) => d.before !== d.after || d.before !== null
  );

  const beforeSkills = beforeSnap?.snapshot_data.character_skills ?? [];
  const afterSkills = afterSnap?.snapshot_data.character_skills ?? [];

  const allSkillNames = Array.from(
    new Set([
      ...beforeSkills.map((s) => s.skill_name),
      ...afterSkills.map((s) => s.skill_name),
    ])
  ).sort();

  const skillDiffs: DiffEntry[] = allSkillNames.map((name) => {
    const b = beforeSkills.find((s) => s.skill_name === name);
    const a = afterSkills.find((s) => s.skill_name === name);
    return {
      label: name,
      before: b?.current_value ?? null,
      after: a?.current_value ?? null,
    };
  });

  const changedSkills = skillDiffs.filter((d) => d.before !== d.after);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted text-sm">読み込み中…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/characters/${characterId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {characterName}
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <GitCompare size={20} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">スナップショット比較</h1>
      </div>
      <p className="text-sm text-coc-muted mb-6">
        2つのスナップショットを比較し、能力値・技能値の変化を確認できます。
      </p>

      {snapshots.length === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-6 text-center">
          <GitCompare size={32} className="mx-auto text-coc-muted mb-3" />
          <p className="text-coc-muted text-sm">スナップショットがまだありません。</p>
          <Link
            href={`/characters/${characterId}/snapshots`}
            className="mt-4 inline-block text-xs text-coc-gold hover:underline"
          >
            スナップショット一覧へ →
          </Link>
        </div>
      ) : (
        <>
          {/* セレクタ */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-coc-muted font-semibold">比較元（Before）</label>
              <select
                value={beforeId}
                onChange={(e) => setBeforeId(e.target.value)}
                className="rounded-md border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold/50"
              >
                {snapshots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({new Date(s.taken_at).toLocaleDateString("ja-JP")})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-coc-muted font-semibold">比較先（After）</label>
              <select
                value={afterId}
                onChange={(e) => setAfterId(e.target.value)}
                className="rounded-md border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-text focus:outline-none focus:border-coc-gold/50"
              >
                {snapshots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({new Date(s.taken_at).toLocaleDateString("ja-JP")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {beforeId === afterId && (
            <div className="mb-4 rounded-lg border border-yellow-800 bg-yellow-950/20 px-4 py-2.5 text-xs text-yellow-300">
              同じスナップショットを選択しています。異なるスナップショットを選んでください。
            </div>
          )}

          {/* 能力値・HP/SAN */}
          <div className="rounded-lg border border-coc-border bg-coc-surface p-4 mb-4">
            <h2 className="text-sm font-semibold text-coc-text mb-3">能力値 / HP / SAN / 幸運</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-coc-border">
                  <th className="pb-1.5 text-left text-xs text-coc-muted font-normal w-24">項目</th>
                  <th className="pb-1.5 text-right text-xs text-coc-muted font-normal w-16">Before</th>
                  <th className="pb-1.5 text-right text-xs text-coc-muted font-normal w-16">After</th>
                  <th className="pb-1.5 text-right text-xs text-coc-muted font-normal w-20">差分</th>
                </tr>
              </thead>
              <tbody>
                {changedAbilities.map((d) => (
                  <DiffRow key={d.label} {...d} />
                ))}
              </tbody>
            </table>
          </div>

          {/* 技能 */}
          <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
            <h2 className="text-sm font-semibold text-coc-text mb-1">技能値</h2>
            {changedSkills.length === 0 ? (
              <p className="text-xs text-coc-muted mt-2">変化のある技能はありません。</p>
            ) : (
              <>
                <p className="text-xs text-coc-muted mb-3">変化のあった技能のみ表示</p>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-coc-border">
                      <th className="pb-1.5 text-left text-xs text-coc-muted font-normal">技能名</th>
                      <th className="pb-1.5 text-right text-xs text-coc-muted font-normal w-16">Before</th>
                      <th className="pb-1.5 text-right text-xs text-coc-muted font-normal w-16">After</th>
                      <th className="pb-1.5 text-right text-xs text-coc-muted font-normal w-20">差分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changedSkills.map((d) => (
                      <DiffRow key={d.label} {...d} />
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {allSkillNames.length > 0 && changedSkills.length < allSkillNames.length && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-coc-muted hover:text-coc-text">
                  全技能を表示（{allSkillNames.length}件）
                </summary>
                <table className="w-full mt-2">
                  <thead>
                    <tr className="border-b border-coc-border">
                      <th className="pb-1.5 text-left text-xs text-coc-muted font-normal">技能名</th>
                      <th className="pb-1.5 text-right text-xs text-coc-muted font-normal w-16">Before</th>
                      <th className="pb-1.5 text-right text-xs text-coc-muted font-normal w-16">After</th>
                      <th className="pb-1.5 text-right text-xs text-coc-muted font-normal w-20">差分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillDiffs.map((d) => (
                      <DiffRow key={d.label} {...d} />
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </div>
        </>
      )}
    </div>
  );
}
