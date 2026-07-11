"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured, Character } from "@/lib/supabase";
import { Download, FileText, ArrowLeft, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import { zipSync, strToU8 } from "fflate";
import Papa from "papaparse";

const STAT_COLUMNS = [
  "name", "occupation", "age", "status",
  "str", "con", "pow", "dex", "app", "siz", "int_stat", "edu",
  "hp_max", "hp_current", "mp_max", "mp_current",
  "san_start", "san_current", "san_max", "luck",
];

export default function ExportBulkPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    async function load() {
      const { data } = await supabase
        .from("characters")
        .select("*")
        .order("updated_at", { ascending: false });
      if (data) setCharacters(data as Character[]);
      setLoading(false);
    }
    load();
  }, []);

  function toggleAll() {
    if (selected.size === characters.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(characters.map((c) => c.id)));
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function downloadZip() {
    if (selected.size === 0) return;
    setExporting(true);
    const files: Record<string, Uint8Array> = {};
    for (const char of characters) {
      if (!selected.has(char.id)) continue;
      const safeName = char.name.replace(/[^\w぀-鿿゠-ヿ]/g, "_");
      files[`${safeName}_${char.id.slice(0, 8)}.json`] = strToU8(
        JSON.stringify(char, null, 2)
      );
    }
    const zipped = zipSync(files);
    const blob = new Blob([zipped], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "characters-backup.zip";
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  function downloadCsv() {
    if (selected.size === 0) return;
    const rows = characters
      .filter((c) => selected.has(c.id))
      .map((c) => {
        const row: Record<string, unknown> = {};
        for (const col of STAT_COLUMNS) {
          row[col] = (c as unknown as Record<string, unknown>)[col] ?? "";
        }
        return row;
      });
    const csv = Papa.unparse(rows, { columns: STAT_COLUMNS });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "characters-stats.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const allSelected = characters.length > 0 && selected.size === characters.length;

  return (
    <div className="coc-page-enter mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/characters"
          className="flex items-center gap-1 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          一覧へ戻る
        </Link>
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          キャラクター一括エクスポート
        </h1>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-6 text-center text-coc-muted text-sm">
          Supabase が未設定のため、キャラクターを読み込めません。
        </div>
      )}

      {isSupabaseConfigured && loading && (
        <p className="text-center text-coc-muted text-sm italic font-crimson">
          読み込み中...
        </p>
      )}

      {isSupabaseConfigured && !loading && (
        <>
          {/* 全選択 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 text-sm text-coc-muted hover:text-coc-text transition-colors"
            >
              {allSelected ? (
                <CheckSquare size={16} className="text-coc-gold" />
              ) : (
                <Square size={16} />
              )}
              すべて選択 ({characters.length}件)
            </button>
            <span className="text-xs text-coc-muted">
              {selected.size}件 選択中
            </span>
          </div>

          {/* キャラクター一覧 */}
          <div className="rounded-lg border border-coc-border bg-coc-surface divide-y divide-coc-border mb-6">
            {characters.length === 0 && (
              <p className="p-6 text-center text-coc-muted text-sm">
                キャラクターがありません
              </p>
            )}
            {characters.map((char) => (
              <label
                key={char.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-coc-raised transition-colors"
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selected.has(char.id)}
                  onChange={() => toggle(char.id)}
                />
                {selected.has(char.id) ? (
                  <CheckSquare size={16} className="text-coc-gold flex-shrink-0" />
                ) : (
                  <Square size={16} className="text-coc-muted flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-coc-text font-medium truncate">
                    {char.name}
                  </p>
                  <p className="text-xs text-coc-muted truncate">
                    {char.occupation ?? "職業不明"} ／{" "}
                    <span
                      className={
                        char.status === "alive"
                          ? "text-emerald-400"
                          : char.status === "dead"
                          ? "text-red-400"
                          : char.status === "insane"
                          ? "text-purple-400"
                          : "text-coc-muted"
                      }
                    >
                      {char.status === "alive"
                        ? "生存"
                        : char.status === "dead"
                        ? "死亡"
                        : char.status === "insane"
                        ? "狂気"
                        : "引退"}
                    </span>
                  </p>
                </div>
                <span className="text-xs text-coc-faint tabular-nums">
                  HP {char.hp_current}/{char.hp_max} · SAN {char.san_current}
                </span>
              </label>
            ))}
          </div>

          {/* エクスポートボタン */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadZip}
              disabled={selected.size === 0 || exporting}
              className="flex items-center justify-center gap-2 rounded-lg border border-coc-gold bg-coc-gold/20 px-4 py-3 text-sm text-coc-gold hover:bg-coc-gold/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              選択したキャラを ZIP でダウンロード
              {selected.size > 0 && (
                <span className="rounded-full bg-coc-gold/30 px-1.5 py-0.5 text-xs">
                  {selected.size}
                </span>
              )}
            </button>
            <button
              onClick={downloadCsv}
              disabled={selected.size === 0}
              className="flex items-center justify-center gap-2 rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-border-glow transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileText size={16} />
              能力値サマリーを CSV で出力 (KP用)
            </button>
          </div>

          <p className="mt-4 text-xs text-coc-faint">
            ZIP: キャラクターごとの JSON ファイルをまとめてダウンロードします。<br />
            CSV: 選択したキャラクターの能力値一覧（STR/DEX/INT 等）を書き出します。
          </p>
        </>
      )}
    </div>
  );
}
