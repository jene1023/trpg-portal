"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Character, CharacterSkill } from "@/lib/supabase";
import VttExportButton from "@/app/_components/VttExportButton";

export default function ChatPalettePage() {
  const params = useParams();
  const id = params.id as string;

  const [char, setChar] = useState<Character | null>(null);
  const [skills, setSkills] = useState<CharacterSkill[]>([]);
  const [copied, setCopied] = useState(false);
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

  const generatePalette = useCallback(() => {
    if (!char) return "";
    const lines: string[] = [];

    lines.push(`// ${char.name} チャットパレット`);
    lines.push("");

    // 能力値ロール
    lines.push("// 能力値");
    const stats = [
      { label: "STR 筋力", value: char.str },
      { label: "CON 体力", value: char.con },
      { label: "POW 精神力", value: char.pow },
      { label: "DEX 敏捷性", value: char.dex },
      { label: "APP 外見", value: char.app },
      { label: "SIZ 体格", value: char.siz },
      { label: "INT 知性", value: char.int_stat },
      { label: "EDU 教育", value: char.edu },
    ];
    for (const stat of stats) {
      lines.push(`${stat.label} 1D100<=${stat.value}`);
    }

    lines.push("");
    lines.push("// 技能");
    for (const skill of skills) {
      lines.push(`${skill.skill_name} 1D100<=${skill.current_value}`);
    }

    lines.push("");
    lines.push("// その他");
    lines.push(`幸運 1D100<=${char.luck}`);
    lines.push("1D6 1D6");
    lines.push("1D8 1D8");
    lines.push("1D10 1D10");
    lines.push("1D20 1D20");
    lines.push("1D100 1D100");

    return lines.join("\n");
  }, [char, skills]);

  const handleCopy = async () => {
    const text = generatePalette();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const palette = generatePalette();

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

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          チャットパレット
        </h1>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-surface px-4 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-400" />
              <span className="text-green-400">コピー済み</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              クリップボードにコピー
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-coc-muted mb-4">
        ユドナリウム・ここフォリア等のVTTツールにそのままコピーして使用できるBCDice互換チャットパレットです。
      </p>

      <textarea
        readOnly
        value={palette}
        className="w-full h-[32rem] rounded-lg border border-coc-border bg-coc-raised px-4 py-3 font-mono text-xs text-coc-text resize-none focus:outline-none focus:border-coc-border-glow"
      />

      <div className="mt-4 rounded-lg border border-coc-border bg-coc-surface p-3 text-xs text-coc-muted space-y-1">
        <p>• <span className="text-coc-text">1D100&lt;=値</span> 形式はBCDice（ユドナリウム・ここフォリア）に対応しています。</p>
        <p>• コメント行（// で始まる行）はVTTツールでセパレータとして表示されます。</p>
        <p>• 技能値が変更された場合はページを再読み込みしてください。</p>
      </div>

      <div className="mt-8">
        <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-widest mb-3">
          VTTエクスポート
        </h2>
        <p className="text-xs text-coc-muted mb-4">
          チャットパレットコマンドを統合したVTTコマデータをダウンロードできます。
        </p>
        <VttExportButton char={char} skills={skills} />
      </div>
    </div>
  );
}
