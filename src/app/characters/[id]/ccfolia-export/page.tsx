"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Download } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Character, CharacterSkill } from "@/lib/supabase";

type CcfoliaStatus = { label: string; value: number; max: number };
type CcfoliaParam = { label: string; value: string };

type CcfoliaCharacter = {
  kind: "character";
  data: {
    name: string;
    status: CcfoliaStatus[];
    params: CcfoliaParam[];
    commands: string;
    imageUrl: string;
  };
};

export default function CcfoliaExportPage() {
  const params = useParams();
  const id = params.id as string;

  const [char, setChar] = useState<Character | null>(null);
  const [skills, setSkills] = useState<CharacterSkill[]>([]);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const load = async () => {
      const { data: charData } = await supabase
        .from("characters")
        .select("*")
        .eq("id", id)
        .single();
      const { data: skillData } = await supabase
        .from("character_skills")
        .select("*")
        .eq("character_id", id)
        .order("skill_name");
      setChar(charData ?? null);
      setSkills(skillData ?? []);
      setLoading(false);
    };
    load();
  }, [id]);

  const generateCommands = useCallback(
    (c: Character, s: CharacterSkill[]): string => {
      const lines: string[] = [];
      const stats = [
        { label: "STR 筋力", value: c.str },
        { label: "CON 体力", value: c.con },
        { label: "POW 精神力", value: c.pow },
        { label: "DEX 敏捷性", value: c.dex },
        { label: "APP 外見", value: c.app },
        { label: "SIZ 体格", value: c.siz },
        { label: "INT 知性", value: c.int_stat },
        { label: "EDU 教育", value: c.edu },
      ];
      for (const stat of stats) {
        lines.push(`${stat.label} 1D100<=${stat.value}`);
      }
      for (const skill of s) {
        lines.push(`${skill.skill_name} 1D100<=${skill.current_value}`);
      }
      lines.push(`幸運 1D100<=${c.luck}`);
      lines.push("1D6 1D6");
      lines.push("1D8 1D8");
      lines.push("1D10 1D10");
      lines.push("1D20 1D20");
      lines.push("1D100 1D100");
      return lines.join("\n");
    },
    []
  );

  const buildJson = useCallback(
    (c: Character, s: CharacterSkill[]): CcfoliaCharacter => {
      return {
        kind: "character",
        data: {
          name: c.name,
          status: [
            { label: "HP", value: c.hp_current, max: c.hp_max },
            { label: "MP", value: c.mp_current, max: c.mp_max },
            { label: "SAN", value: c.san_current, max: c.san_max },
          ],
          params: [
            { label: "STR", value: String(c.str) },
            { label: "CON", value: String(c.con) },
            { label: "POW", value: String(c.pow) },
            { label: "DEX", value: String(c.dex) },
            { label: "APP", value: String(c.app) },
            { label: "SIZ", value: String(c.siz) },
            { label: "INT", value: String(c.int_stat) },
            { label: "EDU", value: String(c.edu) },
            { label: "幸運", value: String(c.luck) },
          ],
          commands: generateCommands(c, s),
          imageUrl: c.avatar_url ?? c.portrait_url ?? "",
        },
      };
    },
    [generateCommands]
  );

  const handleCopy = async () => {
    if (!char) return;
    const json = buildJson(char, skills);
    if (!navigator.clipboard) {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
      return;
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  const handleDownload = () => {
    if (!char) return;
    const json = buildJson(char, skills);
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${char.name}_ccfolia.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted">Supabase が設定されていません。</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted">読み込み中...</p>
      </div>
    );
  }

  if (!char) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted">キャラクターが見つかりません。</p>
      </div>
    );
  }

  const json = buildJson(char, skills);
  const jsonText = JSON.stringify(json, null, 2);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {char.name}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          CCFOLIAコマ出力
        </h1>
      </div>

      <p className="text-xs text-coc-muted mb-6">
        ここフォリア（Cocofolia）にインポートできるキャラクターコマJSONです。
        ルーム設定 → コマ・カード管理 → JSONからインポート でご利用ください。
      </p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-4 py-2 text-sm text-coc-gold hover:bg-coc-gold/20 hover:border-coc-gold transition-colors"
        >
          <Download size={14} />
          {char.name}_ccfolia.json
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-surface px-4 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-400" />
              <span className="text-green-400">コピー済み</span>
            </>
          ) : copyError ? (
            <>
              <Copy size={14} className="text-red-400" />
              <span className="text-red-400">コピー不可（HTTPS環境が必要です）</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              クリップボードにコピー
            </>
          )}
        </button>
      </div>

      <textarea
        readOnly
        value={jsonText}
        className="w-full h-[32rem] rounded-lg border border-coc-border bg-coc-raised px-4 py-3 font-mono text-xs text-coc-text resize-none focus:outline-none focus:border-coc-border-glow"
      />

      <div className="mt-4 rounded-lg border border-coc-border bg-coc-surface p-3 text-xs text-coc-muted space-y-1">
        <p>
          • <span className="text-coc-text">status</span>:
          HP/MP/SANの現在値と最大値（コマ上のゲージ表示に使用）
        </p>
        <p>
          • <span className="text-coc-text">params</span>:
          能力値（STR/CON/POW/DEX/APP/SIZ/INT/EDU/幸運）
        </p>
        <p>
          • <span className="text-coc-text">commands</span>:
          BCDice互換のチャットパレットコマンド（技能・能力値判定）
        </p>
        <p>• 技能値や能力値が変更された場合はページを再読み込みしてください。</p>
      </div>
    </div>
  );
}
