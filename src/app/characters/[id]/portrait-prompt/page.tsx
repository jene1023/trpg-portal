"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Character, CharacterTrait } from "@/lib/supabase";
import { buildPortraitPrompt } from "@/lib/portraitPrompt";

export default function PortraitPromptPage() {
  const params = useParams();
  const id = params.id as string;

  const [char, setChar] = useState<Character | null>(null);
  const [traits, setTraits] = useState<CharacterTrait[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const load = async () => {
      const [{ data: charData }, { data: traitData }] = await Promise.all([
        supabase.from("characters").select("*").eq("id", id).single(),
        supabase.from("character_traits").select("*").eq("character_id", id),
      ]);
      setChar(charData ?? null);
      setTraits(traitData ?? []);
      setLoading(false);
    };
    load();
  }, [id]);

  const prompt = char ? buildPortraitPrompt(char, traits) : "";

  const handleCopy = useCallback(async () => {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [prompt]);

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

  const personalityTraits = traits.filter((t) => t.trait_type === "personality");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {char.name}
        </Link>
      </div>

      <div>
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          肖像画プロンプト生成
        </h1>
        <p className="mt-1 text-sm text-coc-muted">
          Midjourney・Stable Diffusion 等のAI画像生成ツールで使える英語プロンプトを自動生成します。
        </p>
      </div>

      <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-4">
        <div>
          <p className="text-xs text-coc-muted font-semibold mb-2 uppercase tracking-widest">
            生成されたプロンプト
          </p>
          <textarea
            readOnly
            value={prompt}
            rows={6}
            className="w-full rounded-md bg-coc-raised border border-coc-border px-3 py-2 text-sm text-coc-text font-mono resize-none focus:outline-none focus:border-coc-border-glow"
          />
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-lg border border-coc-border bg-coc-raised px-4 py-2 text-sm text-coc-text hover:border-coc-border-glow transition-colors motion-safe:active:scale-[0.97]"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? "コピー済み！" : "クリップボードにコピー"}
        </button>
      </div>

      <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3">
        <p className="text-xs text-coc-muted font-semibold uppercase tracking-widest">
          使用した情報
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          {char.occupation && (
            <>
              <dt className="text-coc-muted">職業</dt>
              <dd className="text-coc-text">{char.occupation}</dd>
            </>
          )}
          {char.gender && (
            <>
              <dt className="text-coc-muted">性別</dt>
              <dd className="text-coc-text">{char.gender}</dd>
            </>
          )}
          {char.age && (
            <>
              <dt className="text-coc-muted">年齢</dt>
              <dd className="text-coc-text">{char.age}歳</dd>
            </>
          )}
          {char.hair_color && (
            <>
              <dt className="text-coc-muted">髪の色</dt>
              <dd className="text-coc-text">{char.hair_color}</dd>
            </>
          )}
          {char.eye_color && (
            <>
              <dt className="text-coc-muted">目の色</dt>
              <dd className="text-coc-text">{char.eye_color}</dd>
            </>
          )}
          {char.height_cm && (
            <>
              <dt className="text-coc-muted">身長</dt>
              <dd className="text-coc-text">{char.height_cm}cm</dd>
            </>
          )}
        </dl>
        {personalityTraits.length > 0 && (
          <div>
            <p className="text-xs text-coc-muted">性格特質</p>
            <ul className="mt-1 space-y-0.5">
              {personalityTraits.map((t) => (
                <li key={t.id} className="text-sm text-coc-text">
                  ・{t.content}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-xs text-coc-muted pt-1">
          外見・性格の情報が少ない場合、
          <Link href={`/characters/${id}/traits`} className="text-coc-gold hover:underline mx-0.5">
            特質・重要情報
          </Link>
          や
          <Link href={`/characters/${id}/edit`} className="text-coc-gold hover:underline mx-0.5">
            キャラクター編集
          </Link>
          で詳細を追加するとより精度の高いプロンプトになります。
        </p>
      </div>
    </div>
  );
}
