"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import { supabase, isSupabaseConfigured, Character, CharacterSkill } from "@/lib/supabase";

type ImportData = {
  character: Character;
  skills: CharacterSkill[];
};

export default function ImportCharacterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Partial<ImportData>;
        await importCharacter(parsed);
      } catch {
        setError("ファイルの読み込みに失敗しました。エクスポートしたJSONファイルを選択してください。");
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("ファイルの読み込みに失敗しました。");
      setLoading(false);
    };
    reader.readAsText(file);
  }

  async function importCharacter(parsed: Partial<ImportData>) {
    if (!isSupabaseConfigured) {
      setError("Supabaseが設定されていません。");
      setLoading(false);
      return;
    }

    const char = parsed.character;
    if (!char || !char.name) {
      setError("不正なファイル形式です。「character」フィールドが見つかりません。");
      setLoading(false);
      return;
    }

    const {
      id: _id,
      created_at: _ca,
      updated_at: _ua,
      ...charFields
    } = char;

    const { data: newChar, error: charErr } = await supabase
      .from("characters")
      .insert({ ...charFields, name: `${char.name}（インポート）`, is_pinned: false })
      .select()
      .single();

    if (charErr || !newChar) {
      setError(`キャラクターの作成に失敗しました: ${charErr?.message ?? "不明なエラー"}`);
      setLoading(false);
      return;
    }

    const skills = parsed.skills ?? [];
    if (skills.length > 0) {
      const newSkills = skills.map(({ id: _sid, character_id: _cid, ...s }) => ({
        ...s,
        character_id: newChar.id,
        growth_checked: false,
      }));
      await supabase.from("character_skills").insert(newSkills);
    }

    router.push(`/characters/${newChar.id}`);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/characters"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          キャラクター一覧
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-2">
        JSONからインポート
      </h1>
      <p className="text-sm text-coc-muted mb-6">
        エクスポート機能で出力したJSONファイルを選択して、キャラクターと技能を復元します。
      </p>

      <div className="rounded-lg border border-dashed border-coc-border bg-coc-surface p-8 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          disabled={loading}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2 mx-auto rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-2 text-sm text-coc-gold hover:bg-coc-surface hover:border-coc-gold transition-colors disabled:opacity-50"
        >
          <Upload size={16} />
          {loading ? "インポート中…" : "JSONファイルを選択"}
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
