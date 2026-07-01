export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, Character, SessionLog } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

type CharacterEntry = {
  id: string;
  name: string;
  san_max: number;
  hp_max: number;
  sessions: SessionLog[];
};

type ParticipantRow = {
  characters: Pick<Character, "id" | "name" | "san_max" | "hp_max">;
};

function LossCell({ san, hp }: { san: number; hp: number }) {
  const hasSan = san > 0;
  const hasHp = hp > 0;
  if (!hasSan && !hasHp) {
    return <span className="text-coc-muted">—</span>;
  }
  return (
    <span className="inline-flex flex-col items-center gap-0.5 text-xs tabular-nums">
      {hasSan && (
        <span className="text-purple-400">
          SAN -{san}
        </span>
      )}
      {hasHp && (
        <span className="text-red-400">
          HP -{hp}
        </span>
      )}
    </span>
  );
}

export default async function DamageSummaryPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: participants } = await supabase
    .from("scenario_participants")
    .select("*, characters(id, name, san_max, hp_max)")
    .eq("scenario_id", id)
    .order("created_at", { ascending: true });

  const participantList = (participants ?? []) as unknown as ParticipantRow[];

  const characterEntries: CharacterEntry[] = await Promise.all(
    participantList.map(async (p) => {
      const char = p.characters;
      const { data: sessions } = await supabase
        .from("sessions")
        .select("*")
        .eq("character_id", char.id)
        .order("session_number", { ascending: true });
      return {
        id: char.id,
        name: char.name,
        san_max: char.san_max,
        hp_max: char.hp_max,
        sessions: (sessions ?? []) as SessionLog[],
      };
    })
  );

  const allSessionNumbers = Array.from(
    new Set(
      characterEntries.flatMap((c) => c.sessions.map((s) => s.session_number))
    )
  ).sort((a, b) => a - b);

  const sessionMap = new Map<string, Map<number, SessionLog>>();
  for (const char of characterEntries) {
    const inner = new Map<number, SessionLog>();
    for (const session of char.sessions) {
      inner.set(session.session_number, session);
    }
    sessionMap.set(char.id, inner);
  }

  const charTotals = new Map<string, { san: number; hp: number }>();
  for (const char of characterEntries) {
    const san = char.sessions.reduce((sum, s) => sum + s.san_loss, 0);
    const hp = char.sessions.reduce((sum, s) => sum + s.hp_loss, 0);
    charTotals.set(char.id, { san, hp });
  }

  const sessionTotals = new Map<number, { san: number; hp: number }>();
  for (const sessionNum of allSessionNumbers) {
    let san = 0;
    let hp = 0;
    for (const char of characterEntries) {
      const s = sessionMap.get(char.id)?.get(sessionNum);
      if (s) { san += s.san_loss; hp += s.hp_loss; }
    }
    sessionTotals.set(sessionNum, { san, hp });
  }

  const grandSan = [...charTotals.values()].reduce((sum, t) => sum + t.san, 0);
  const grandHp = [...charTotals.values()].reduce((sum, t) => sum + t.hp, 0);

  return (
    <div className="coc-page-enter mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオ詳細
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs text-coc-muted mb-1">{scenario.title}</p>
        <h1 className="font-cinzel text-xl font-bold text-coc-text">SAN/HP喪失サマリー</h1>
        <p className="text-xs text-coc-muted mt-1">セッション別・参加者別のSAN/HP喪失量</p>
      </div>

      {characterEntries.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">参加キャラクターが登録されていません。</p>
          <Link
            href={`/scenarios/${id}/participants`}
            className="mt-3 inline-block text-xs text-coc-gold hover:underline"
          >
            参加キャラクターを追加 →
          </Link>
        </div>
      ) : allSessionNumbers.length === 0 ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-8 text-center">
          <p className="text-coc-muted text-sm">参加者のセッションログが登録されていません。</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-coc-border">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-coc-border bg-coc-raised">
                  <th className="px-4 py-3 text-left text-xs font-medium text-coc-muted whitespace-nowrap">
                    セッション
                  </th>
                  {characterEntries.map((char) => (
                    <th
                      key={char.id}
                      className="px-4 py-3 text-center text-xs font-medium text-coc-text whitespace-nowrap"
                    >
                      <Link
                        href={`/characters/${char.id}`}
                        className="hover:text-coc-gold transition-colors"
                      >
                        {char.name}
                      </Link>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-coc-gold whitespace-nowrap">
                    合計
                  </th>
                </tr>
              </thead>
              <tbody>
                {allSessionNumbers.map((sessionNum, rowIdx) => {
                  const sessionTotal = sessionTotals.get(sessionNum) ?? { san: 0, hp: 0 };
                  return (
                    <tr
                      key={sessionNum}
                      className={`border-b border-coc-border ${rowIdx % 2 === 0 ? "bg-coc-surface" : "bg-coc-bg"}`}
                    >
                      <td className="px-4 py-3 text-xs font-medium text-coc-muted whitespace-nowrap">
                        第{sessionNum}回
                      </td>
                      {characterEntries.map((char) => {
                        const s = sessionMap.get(char.id)?.get(sessionNum);
                        return (
                          <td key={char.id} className="px-4 py-3 text-center">
                            <LossCell san={s?.san_loss ?? 0} hp={s?.hp_loss ?? 0} />
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <LossCell san={sessionTotal.san} hp={sessionTotal.hp} />
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-coc-gold-dim bg-coc-raised font-medium">
                  <td className="px-4 py-3 text-xs font-bold text-coc-gold whitespace-nowrap">
                    累計
                  </td>
                  {characterEntries.map((char) => {
                    const t = charTotals.get(char.id) ?? { san: 0, hp: 0 };
                    return (
                      <td key={char.id} className="px-4 py-3 text-center">
                        <LossCell san={t.san} hp={t.hp} />
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    <LossCell san={grandSan} hp={grandHp} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 flex-1 min-w-36 text-center">
              <p className="text-2xl font-bold text-purple-400 tabular-nums">{grandSan}</p>
              <p className="text-xs text-coc-muted mt-1">総SAN喪失</p>
            </div>
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 flex-1 min-w-36 text-center">
              <p className="text-2xl font-bold text-red-400 tabular-nums">{grandHp}</p>
              <p className="text-xs text-coc-muted mt-1">総HP喪失</p>
            </div>
            <div className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 flex-1 min-w-36 text-center">
              <p className="text-2xl font-bold text-coc-text tabular-nums">{allSessionNumbers.length}</p>
              <p className="text-xs text-coc-muted mt-1">セッション数</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-coc-muted justify-center">
            <span className="flex items-center gap-1"><span className="text-purple-400 font-bold">SAN</span> 正気度喪失</span>
            <span className="flex items-center gap-1"><span className="text-red-400 font-bold">HP</span> 体力喪失</span>
          </div>
        </>
      )}
    </div>
  );
}
