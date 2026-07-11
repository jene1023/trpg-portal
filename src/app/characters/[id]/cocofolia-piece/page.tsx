"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Copy, Check } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Character, CharacterSkill } from "@/lib/supabase";

export default function CocofollaPiecePage() {
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

  const generateCommands = useCallback((): string[] => {
    if (!char) return [];
    const commands: string[] = [];

    // 能力値ロール
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
      commands.push(`${stat.label} 1D100<=${stat.value}`);
    }

    // 技能ロール
    for (const skill of skills) {
      commands.push(`${skill.skill_name} 1D100<=${skill.current_value}`);
    }

    // その他
    commands.push(`幸運 1D100<=${char.luck}`);
    commands.push("1D6 1D6");
    commands.push("1D8 1D8");
    commands.push("1D10 1D10");
    commands.push("1D20 1D20");
    commands.push("1D100 1D100");

    return commands;
  }, [char, skills]);

  const generatePieceJson = useCallback(() => {
    if (!char) return null;
    return {
      name: char.name,
      initiative: char.dex,
      width: 1,
      height: 1,
      color: "#7a7a7a",
      text: `HP ${char.hp_current}/${char.hp_max}\nMP ${char.mp_current}/${char.mp_max}\nSAN ${char.san_current}/${char.san_max}`,
      commands: generateCommands(),
    };
  }, [char, generateCommands]);

  const handleDownload = () => {
    const piece = generatePieceJson();
    if (!piece || !char) return;
    const blob = new Blob([JSON.stringify(piece, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${char.name}_piece.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const piece = generatePieceJson();
    if (!piece) return;
    if (!navigator.clipboard) {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
      return;
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(piece, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
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

  const piece = generatePieceJson();

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
          ここフォリア コマ出力
        </h1>
      </div>

      <p className="text-xs text-coc-muted mb-6">
        ここフォリア（Cocofolia）にインポートできるキャラクターコマJSONを生成します。
        チャットパレット（BCDiceコマンド）がコマデータに統合されています。
      </p>

      {/* プレビュー */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-4 mb-4 space-y-3">
        <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">プレビュー</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-coc-muted">コマ名</p>
            <p className="text-coc-text font-semibold">{char.name}</p>
          </div>
          <div>
            <p className="text-xs text-coc-muted">イニシアチブ（DEX）</p>
            <p className="text-coc-text font-semibold">{char.dex}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-coc-muted mb-1">ステータス表示文字列</p>
            <pre className="text-coc-text text-xs font-mono bg-coc-raised rounded px-3 py-2 whitespace-pre">{`HP ${char.hp_current}/${char.hp_max}\nMP ${char.mp_current}/${char.mp_max}\nSAN ${char.san_current}/${char.san_max}`}</pre>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-coc-muted">登録コマンド数</p>
            <p className="text-coc-text">{generateCommands().length} 件</p>
          </div>
        </div>
      </div>

      {/* JSON プレビュー */}
      <textarea
        readOnly
        value={piece ? JSON.stringify(piece, null, 2) : ""}
        className="w-full h-64 rounded-lg border border-coc-border bg-coc-raised px-4 py-3 font-mono text-xs text-coc-text resize-none focus:outline-none focus:border-coc-border-glow mb-4"
      />

      {/* ボタン */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-4 py-2 text-sm text-coc-gold hover:bg-coc-gold/20 hover:border-coc-gold transition-colors"
        >
          <Download size={14} />
          {char.name}_piece.json をダウンロード
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

      <div className="mt-6 rounded-lg border border-coc-border bg-coc-surface p-3 text-xs text-coc-muted space-y-1">
        <p>• ここフォリアのルーム設定 → 「コマ・カード管理」→「JSONからインポート」でこのファイルを読み込めます。</p>
        <p>• チャットパレットコマンドはBCDice（<span className="text-coc-text">1D100&lt;=値</span>）形式です。</p>
        <p>• コマ色はデフォルトのグレー（#7a7a7a）に設定されています。インポート後に変更できます。</p>
        <p>• HP/MP/SANの値が変わった場合はページを再読み込みして再ダウンロードしてください。</p>
      </div>
    </div>
  );
}
