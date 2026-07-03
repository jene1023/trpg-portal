export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, CharacterMessageWithSender } from "@/lib/supabase";
import MessageInbox from "@/app/_components/MessageInbox";

type Props = { params: Promise<{ id: string }> };

export default async function MessagesPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: messages } = await supabase
    .from("character_messages")
    .select("*, sender:characters!sender_character_id(id, name)")
    .eq("recipient_character_id", id)
    .order("sent_at", { ascending: false });

  const { data: allChars } = await supabase
    .from("characters")
    .select("id, name")
    .neq("id", id)
    .order("name");

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

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-2">
        In-characterメッセージ
      </h1>
      <p className="text-xs text-coc-muted mb-6">
        キャラクター同士の手紙・伝言メモ
      </p>

      <MessageInbox
        characterId={id}
        characterName={char.name}
        initialMessages={(messages ?? []) as CharacterMessageWithSender[]}
        allCharacters={allChars ?? []}
      />
    </div>
  );
}
