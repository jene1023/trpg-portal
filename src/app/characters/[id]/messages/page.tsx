export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";
import { supabase, isSupabaseConfigured, CharacterMessageWithSender, ScenarioBroadcastWithRead } from "@/lib/supabase";
import MessageInbox from "@/app/_components/MessageInbox";
import BroadcastInbox from "@/app/_components/BroadcastInbox";

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

  const [
    { data: messages },
    { data: allChars },
    { data: participantRows },
  ] = await Promise.all([
    supabase
      .from("character_messages")
      .select("*, sender:characters!sender_character_id(id, name)")
      .eq("recipient_character_id", id)
      .order("sent_at", { ascending: false }),
    supabase
      .from("characters")
      .select("id, name")
      .neq("id", id)
      .order("name"),
    supabase
      .from("scenario_participants")
      .select("scenario_id")
      .eq("character_id", id),
  ]);

  const scenarioIds = (participantRows ?? []).map((p) => p.scenario_id as string);

  const [{ data: broadcasts }, { data: readRows }] = await Promise.all([
    scenarioIds.length > 0
      ? supabase
          .from("scenario_broadcasts")
          .select("*")
          .in("scenario_id", scenarioIds)
          .order("created_at", { ascending: false })
      : { data: [] as Record<string, unknown>[] },
    supabase
      .from("scenario_broadcast_reads")
      .select("broadcast_id")
      .eq("character_id", id),
  ]);

  const readBroadcastIds = new Set((readRows ?? []).map((r) => r.broadcast_id as string));
  const broadcastsWithRead: ScenarioBroadcastWithRead[] = (broadcasts ?? []).map((b) => ({
    id: b.id as string,
    scenario_id: b.scenario_id as string,
    sender_character_id: (b.sender_character_id as string | null) ?? null,
    title: b.title as string,
    body: (b.body as string | null) ?? null,
    created_at: b.created_at as string,
    is_read: readBroadcastIds.has(b.id as string),
  }));

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

      {/* KPブロードキャスト通知 */}
      <div className="mt-10">
        <h2 className="font-cinzel text-sm font-semibold text-coc-muted tracking-widest mb-3 flex items-center gap-2">
          <Megaphone size={15} className="text-coc-gold" />
          KPからの通知
          {broadcastsWithRead.filter((b) => !b.is_read).length > 0 && (
            <span className="rounded bg-coc-gold/20 border border-coc-gold/50 px-1.5 py-0.5 text-xs font-semibold text-coc-gold">
              未読 {broadcastsWithRead.filter((b) => !b.is_read).length}件
            </span>
          )}
        </h2>
        <BroadcastInbox characterId={id} initialBroadcasts={broadcastsWithRead} />
      </div>
    </div>
  );
}
