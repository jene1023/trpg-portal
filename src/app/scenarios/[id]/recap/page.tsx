export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import RecapCopyButton from "@/app/_components/RecapCopyButton";

type Props = { params: Promise<{ id: string }> };

export default async function ScenarioRecapPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("*")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: participantRows } = await supabase
    .from("scenario_participants")
    .select("character_id, characters(id, name, hp_max, san_max)")
    .eq("scenario_id", id);

  const participants = (participantRows ?? []) as unknown as {
    character_id: string;
    characters: { id: string; name: string; hp_max: number; san_max: number } | null;
  }[];

  const characterIds = participants
    .map((p) => p.characters?.id)
    .filter(Boolean) as string[];

  const [{ data: allSessions }, { data: scenarioNotes }, { data: allEncounters }] =
    await Promise.all([
      characterIds.length > 0
        ? supabase
            .from("sessions")
            .select("*")
            .in("character_id", characterIds)
            .order("session_number", { ascending: true })
        : Promise.resolve({ data: [] }),
      supabase
        .from("scenario_notes")
        .select("*")
        .eq("scenario_id", id)
        .order("created_at", { ascending: true }),
      Promise.resolve({ data: [] as never[] }),
    ]);

  const sessions = allSessions ?? [];
  const notes = scenarioNotes ?? [];

  const sessionIds = sessions.map((s) => s.id);
  const { data: encounterRows } = sessionIds.length > 0
    ? await supabase
        .from("session_npc_encounters")
        .select("session_id, npc_id, npcs(name)")
        .in("session_id", sessionIds)
    : { data: [] as never[] };

  const seenNpcIds = new Set<string>();
  const uniqueNpcs: string[] = [];
  for (const e of (encounterRows ?? []) as unknown as {
    session_id: string;
    npc_id: string;
    npcs: { name: string } | null;
  }[]) {
    if (!seenNpcIds.has(e.npc_id)) {
      seenNpcIds.add(e.npc_id);
      uniqueNpcs.push(e.npcs?.name ?? "（不明なNPC）");
    }
  }

  const charNameMap: Record<string, string> = {};
  for (const p of participants) {
    if (p.characters) {
      charNameMap[p.characters.id] = p.characters.name;
    }
  }

  const sessionsByNumber: Record<number, typeof sessions> = {};
  for (const s of sessions) {
    (sessionsByNumber[s.session_number] ??= []).push(s);
  }
  const sessionNumbers = Object.keys(sessionsByNumber)
    .map(Number)
    .sort((a, b) => a - b);

  const totalSanLoss = sessions.reduce((sum, s) => sum + (s.san_loss ?? 0), 0);
  const totalHpLoss = sessions.reduce((sum, s) => sum + (s.hp_loss ?? 0), 0);

  const sanLossByChar: Record<string, number> = {};
  const hpLossByChar: Record<string, number> = {};
  for (const s of sessions) {
    sanLossByChar[s.character_id] = (sanLossByChar[s.character_id] ?? 0) + (s.san_loss ?? 0);
    hpLossByChar[s.character_id] = (hpLossByChar[s.character_id] ?? 0) + (s.hp_loss ?? 0);
  }

  // Build markdown text
  const lines: string[] = [];
  lines.push(`# ${scenario.title} — セッションリプレイ`);
  lines.push("");

  if (scenario.synopsis) {
    lines.push("## シナリオ概要");
    lines.push(scenario.synopsis);
    lines.push("");
  }

  if (sessionNumbers.length > 0) {
    lines.push("## セッション概要");
    for (const num of sessionNumbers) {
      const group = sessionsByNumber[num];
      const titles = [...new Set(group.map((s) => s.title))].join(" / ");
      lines.push(`### セッション ${num}：${titles}`);
      for (const s of group) {
        if (s.summary) {
          const name = charNameMap[s.character_id] ?? "（不明）";
          lines.push(`**[${name}]** ${s.summary}`);
        }
      }
      lines.push("");
    }
  }

  if (uniqueNpcs.length > 0) {
    lines.push("## 登場NPC");
    for (const name of uniqueNpcs) {
      lines.push(`- ${name}`);
    }
    lines.push("");
  }

  if (notes.length > 0) {
    lines.push("## 共有メモ");
    for (const note of notes) {
      const author = note.author_name ? `**${note.author_name}**: ` : "";
      lines.push(`${author}${note.content}`);
    }
    lines.push("");
  }

  lines.push("## SAN/HP損害サマリー");
  if (participants.length > 0) {
    for (const p of participants) {
      if (!p.characters) continue;
      const char = p.characters;
      const san = sanLossByChar[char.id] ?? 0;
      const hp = hpLossByChar[char.id] ?? 0;
      lines.push(`- **${char.name}**: SAN喪失 ${san} / HP喪失 ${hp}`);
    }
  } else {
    lines.push("（参加者なし）");
  }
  lines.push("");
  lines.push(`合計 SAN喪失: ${totalSanLoss} / HP喪失: ${totalHpLoss}`);

  const markdownText = lines.join("\n");

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {scenario.title}
        </Link>
        <RecapCopyButton text={markdownText} />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <FileText size={20} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          リプレイ記事生成
        </h1>
      </div>

      {scenario.synopsis && (
        <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-2">
            シナリオ概要
          </p>
          <p className="text-sm text-coc-text whitespace-pre-wrap">{scenario.synopsis}</p>
        </div>
      )}

      {sessionNumbers.length > 0 ? (
        <div className="mb-6">
          <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
            セッション概要
          </p>
          <div className="flex flex-col gap-4">
            {sessionNumbers.map((num) => {
              const group = sessionsByNumber[num];
              const titles = [...new Set(group.map((s) => s.title))].join(" / ");
              return (
                <div
                  key={num}
                  className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4"
                >
                  <p className="font-medium text-coc-text mb-2">
                    セッション {num}：{titles}
                  </p>
                  {group.map((s) =>
                    s.summary ? (
                      <div key={s.id} className="mt-1">
                        <span className="text-xs font-semibold text-coc-gold mr-1">
                          [{charNameMap[s.character_id] ?? "不明"}]
                        </span>
                        <span className="text-sm text-coc-text whitespace-pre-wrap">
                          {s.summary}
                        </span>
                      </div>
                    ) : null
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mb-6 text-sm text-coc-muted">セッションログがまだありません。</p>
      )}

      {uniqueNpcs.length > 0 && (
        <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
            登場NPC
          </p>
          <ul className="flex flex-wrap gap-2">
            {uniqueNpcs.map((name) => (
              <li
                key={name}
                className="rounded-full border border-coc-gold-dim bg-coc-raised px-3 py-1 text-sm text-coc-text"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {notes.length > 0 && (
        <div className="mb-6 rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
          <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
            共有メモ
          </p>
          <div className="flex flex-col gap-2">
            {notes.map((note) => (
              <div key={note.id} className="text-sm text-coc-text">
                {note.author_name && (
                  <span className="font-semibold text-coc-gold mr-1">{note.author_name}:</span>
                )}
                <span className="whitespace-pre-wrap">{note.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
          SAN/HP損害サマリー
        </p>
        {participants.length > 0 ? (
          <>
            <div className="flex flex-col gap-2 mb-3">
              {participants.map((p) => {
                if (!p.characters) return null;
                const char = p.characters;
                const san = sanLossByChar[char.id] ?? 0;
                const hp = hpLossByChar[char.id] ?? 0;
                return (
                  <div key={char.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-coc-text">{char.name}</span>
                    <span className="text-coc-muted">
                      SAN喪失{" "}
                      <span className={san >= 5 ? "text-red-400 font-bold" : "text-coc-text"}>
                        {san}
                      </span>
                      {" / "}HP喪失{" "}
                      <span className={hp >= 5 ? "text-orange-400 font-bold" : "text-coc-text"}>
                        {hp}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-coc-border pt-3 flex justify-between text-sm font-medium">
              <span className="text-coc-muted">合計</span>
              <span className="text-coc-text">
                SAN喪失 {totalSanLoss} / HP喪失 {totalHpLoss}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-coc-muted">参加者が登録されていません。</p>
        )}
      </div>
    </div>
  );
}
