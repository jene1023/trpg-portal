"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Copy, Check } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Character, CharacterSkill } from "@/lib/supabase";

export default function UdonariumPiecePage() {
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

  const generateCommands = useCallback((): string[] => {
    if (!char) return [];
    const commands: string[] = [];

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

    for (const skill of skills) {
      commands.push(`${skill.skill_name} 1D100<=${skill.current_value}`);
    }

    commands.push(`幸運 1D100<=${char.luck}`);
    commands.push("1D6 1D6");
    commands.push("1D8 1D8");
    commands.push("1D10 1D10");
    commands.push("1D20 1D20");
    commands.push("1D100 1D100");

    return commands;
  }, [char, skills]);

  const generateXml = useCallback((): string => {
    if (!char) return "";
    const escape = (s: string | number) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const commandText = generateCommands().join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<character location.name="" location.x="0" location.y="0" location.z="0">
  <data name="character">
    <data name="name">${escape(char.name)}</data>
    <data name="size">1</data>
    <data type="url" name="imageIdentifier"></data>
    <data name="resourceList">
      <data name="HP" type="numberResource" currentValue="${escape(char.hp_current)}">${escape(char.hp_max)}</data>
      <data name="MP" type="numberResource" currentValue="${escape(char.mp_current)}">${escape(char.mp_max)}</data>
      <data name="SAN" type="numberResource" currentValue="${escape(char.san_current)}">${escape(char.san_max)}</data>
    </data>
    <data name="statusList">
      <data name="STR">${escape(char.str)}</data>
      <data name="CON">${escape(char.con)}</data>
      <data name="POW">${escape(char.pow)}</data>
      <data name="DEX">${escape(char.dex)}</data>
      <data name="APP">${escape(char.app)}</data>
      <data name="SIZ">${escape(char.siz)}</data>
      <data name="INT">${escape(char.int_stat)}</data>
      <data name="EDU">${escape(char.edu)}</data>
      <data name="幸運">${escape(char.luck)}</data>
    </data>
    <data name="chatPalette">
      <data name="テキスト">${escape(commandText)}</data>
    </data>
  </data>
</character>`;
  }, [char, generateCommands]);

  const handleDownload = () => {
    const xml = generateXml();
    if (!xml || !char) return;
    const blob = new Blob([xml], { type: "text/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${char.name}_udonarium.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const xml = generateXml();
    if (!xml) return;
    await navigator.clipboard.writeText(xml);
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

  const xml = generateXml();

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
          ユドナリウム コマ出力
        </h1>
      </div>

      <p className="text-xs text-coc-muted mb-6">
        ユドナリウム（Udonarium）にインポートできるキャラクターコマXMLを生成します。
        BCDiceチャットパレットコマンドがコマデータに統合されています。
      </p>

      <div className="rounded-lg border border-coc-border bg-coc-surface p-4 mb-4 space-y-3">
        <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">プレビュー</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-coc-muted">コマ名</p>
            <p className="text-coc-text font-semibold">{char.name}</p>
          </div>
          <div>
            <p className="text-xs text-coc-muted">DEX（イニシアチブ参考）</p>
            <p className="text-coc-text font-semibold">{char.dex}</p>
          </div>
          <div>
            <p className="text-xs text-coc-muted">HP</p>
            <p className="text-coc-text">{char.hp_current}/{char.hp_max}</p>
          </div>
          <div>
            <p className="text-xs text-coc-muted">SAN</p>
            <p className="text-coc-text">{char.san_current}/{char.san_max}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-coc-muted">登録コマンド数</p>
            <p className="text-coc-text">{generateCommands().length} 件</p>
          </div>
        </div>
      </div>

      <textarea
        readOnly
        value={xml}
        className="w-full h-64 rounded-lg border border-coc-border bg-coc-raised px-4 py-3 font-mono text-xs text-coc-text resize-none focus:outline-none focus:border-coc-border-glow mb-4"
      />

      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-4 py-2 text-sm text-coc-gold hover:bg-coc-gold/20 hover:border-coc-gold transition-colors"
        >
          <Download size={14} />
          {char.name}_udonarium.xml をダウンロード
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
          ) : (
            <>
              <Copy size={14} />
              クリップボードにコピー
            </>
          )}
        </button>
      </div>

      <div className="mt-6 rounded-lg border border-coc-border bg-coc-surface p-3 text-xs text-coc-muted space-y-1">
        <p>• ユドナリウムのルーム画面でXMLファイルをドラッグ&amp;ドロップするとコマを追加できます。</p>
        <p>• チャットパレットコマンドはBCDice（<span className="text-coc-text">1D100&lt;=値</span>）形式です。</p>
        <p>• HP/MP/SANのリソースバーが自動で設定されます。</p>
        <p>• HP/MP/SANの値が変わった場合はページを再読み込みして再ダウンロードしてください。</p>
      </div>
    </div>
  );
}
