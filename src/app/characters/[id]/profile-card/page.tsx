"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Character, CharacterSkill } from "@/lib/supabase";
import ProfileCard from "@/app/_components/ProfileCard";

export default function ProfileCardPage() {
  const params = useParams();
  const id = params.id as string;

  const [char, setChar] = useState<Character | null>(null);
  const [skills, setSkills] = useState<CharacterSkill[]>([]);
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
        .eq("character_id", id);
      setChar(charData ?? null);
      setSkills(skillData ?? []);
      setLoading(false);
    };
    load();
  }, [id]);

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <p className="text-coc-muted">Supabase が設定されていません。</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <p className="text-coc-muted">読み込み中...</p>
      </div>
    );
  }

  if (!char) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <p className="text-coc-muted">キャラクターが見つかりません。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {char.name}
        </Link>
      </div>

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-2">
        キャラクター紹介カード
      </h1>
      <p className="text-xs text-coc-muted mb-6">
        SNS共有やセッション自己紹介用のプロフィールカードです。PNG画像としてダウンロードできます。
      </p>

      <ProfileCard character={char} skills={skills} />
    </div>
  );
}
