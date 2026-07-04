"use client";

import { useState, useCallback } from "react";
import { Download, Check } from "lucide-react";
import type { Character, CharacterSkill } from "@/lib/supabase";

type Props = {
  char: Character;
  skills: CharacterSkill[];
};

type VttTab = "udonarium" | "cocofolia";

export default function VttExportButton({ char, skills }: Props) {
  const [activeTab, setActiveTab] = useState<VttTab>("udonarium");
  const [copiedUdo, setCopiedUdo] = useState(false);
  const [copiedCoco, setCopiedCoco] = useState(false);

  const generateCommands = useCallback((): string[] => {
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

  const generateUdonariumJson = useCallback(() => {
    return {
      name: char.name,
      initiative: char.dex,
      currentStatus: [
        { label: "HP", value: char.hp_current, max: char.hp_max },
        { label: "MP", value: char.mp_current, max: char.mp_max },
        { label: "SAN", value: char.san_current, max: char.san_max },
      ],
      statusList: {
        STR: char.str,
        CON: char.con,
        POW: char.pow,
        DEX: char.dex,
        APP: char.app,
        SIZ: char.siz,
        INT: char.int_stat,
        EDU: char.edu,
        幸運: char.luck,
      },
      chatPalette: generateCommands().join("\n"),
    };
  }, [char, generateCommands]);

  const generateCocofoliaJson = useCallback(() => {
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

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadUdo = () => {
    const json = generateUdonariumJson();
    downloadFile(
      JSON.stringify(json, null, 2),
      `${char.name}_udonarium.json`,
      "application/json"
    );
  };

  const handleCopyUdo = async () => {
    const json = generateUdonariumJson();
    await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopiedUdo(true);
    setTimeout(() => setCopiedUdo(false), 2000);
  };

  const handleDownloadCoco = () => {
    const json = generateCocofoliaJson();
    downloadFile(
      JSON.stringify(json, null, 2),
      `${char.name}_piece.json`,
      "application/json"
    );
  };

  const handleCopyCoco = async () => {
    const json = generateCocofoliaJson();
    await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopiedCoco(true);
    setTimeout(() => setCopiedCoco(false), 2000);
  };

  const tabClass = (tab: VttTab) =>
    `px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
      activeTab === tab
        ? "bg-coc-surface border border-coc-border border-b-coc-surface text-coc-text"
        : "text-coc-muted hover:text-coc-text"
    }`;

  return (
    <div>
      <div className="flex gap-1 mb-0">
        <button className={tabClass("udonarium")} onClick={() => setActiveTab("udonarium")}>
          ユドナリウム (JSON)
        </button>
        <button className={tabClass("cocofolia")} onClick={() => setActiveTab("cocofolia")}>
          ここフォリア (JSON)
        </button>
      </div>

      <div className="rounded-b-lg rounded-tr-lg border border-coc-border bg-coc-surface p-4 space-y-3">
        {activeTab === "udonarium" && (
          <>
            <p className="text-xs text-coc-muted">
              ユドナリウム互換のコマJSONを生成します。
              <code className="text-coc-text mx-1">currentStatus</code>にHP/MP/SANが含まれ、チャットパレットも統合されています。
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadUdo}
                className="flex items-center gap-2 rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-3 py-1.5 text-xs text-coc-gold hover:bg-coc-gold/20 hover:border-coc-gold transition-colors"
              >
                <Download size={12} />
                {char.name}_udonarium.json
              </button>
              <button
                onClick={handleCopyUdo}
                className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-raised px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
              >
                {copiedUdo ? (
                  <><Check size={12} className="text-green-400" /><span className="text-green-400">コピー済み</span></>
                ) : (
                  "クリップボードにコピー"
                )}
              </button>
            </div>
            <p className="text-xs text-coc-muted/70">
              ※ XMLファイルによる詳細インポートは「コマ出力（ユドナリウム）」ページをご利用ください。
            </p>
          </>
        )}

        {activeTab === "cocofolia" && (
          <>
            <p className="text-xs text-coc-muted">
              ここフォリア（Cocofolia）にインポートできるコマJSONを生成します。
              ルーム設定 → コマ・カード管理 → JSONからインポートでご利用ください。
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadCoco}
                className="flex items-center gap-2 rounded-lg border border-coc-gold/60 bg-coc-gold/10 px-3 py-1.5 text-xs text-coc-gold hover:bg-coc-gold/20 hover:border-coc-gold transition-colors"
              >
                <Download size={12} />
                {char.name}_piece.json
              </button>
              <button
                onClick={handleCopyCoco}
                className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-raised px-3 py-1.5 text-xs text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors"
              >
                {copiedCoco ? (
                  <><Check size={12} className="text-green-400" /><span className="text-green-400">コピー済み</span></>
                ) : (
                  "クリップボードにコピー"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
