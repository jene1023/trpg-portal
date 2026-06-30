export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import SessionLogList from "@/app/_components/SessionLogList";

type Props = { params: Promise<{ id: string }> };

export default async function SessionsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: logs } = await supabase
    .from("sessions")
    .select("*")
    .eq("character_id", id)
    .order("session_number", { ascending: false });

  const sessionIds = (logs ?? []).map((l) => l.id);

  const [{ data: npcs }, { data: encounters }] = await Promise.all([
    supabase.from("npcs").select("id, name").order("name"),
    sessionIds.length > 0
      ? supabase
          .from("session_npc_encounters")
          .select("id, session_id, npc_id, npcs(name)")
          .in("session_id", sessionIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const encountersBySession: Record<
    string,
    { id: string; npc_id: string; npc_name: string }[]
  > = {};
  for (const e of (encounters ?? []) as unknown as {
    id: string;
    session_id: string;
    npc_id: string;
    npcs: { name: string } | null;
  }[]) {
    const entry = { id: e.id, npc_id: e.npc_id, npc_name: e.npcs?.name ?? "（不明なNPC）" };
    (encountersBySession[e.session_id] ??= []).push(entry);
  }

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

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-6">
        セッションログ
      </h1>

      <SessionLogList
        characterId={id}
        initialLogs={logs ?? []}
        allNpcs={npcs ?? []}
        encountersBySession={encountersBySession}
      />
    </div>
  );
}
