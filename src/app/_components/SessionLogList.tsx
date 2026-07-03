"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { SessionLog } from "@/lib/supabase";
import SessionLogForm from "./SessionLogForm";
import SessionNpcEncounters from "./SessionNpcEncounters";

type EncounterEntry = {
  id: string;
  npc_id: string;
  npc_name: string;
};

type Props = {
  characterId: string;
  initialLogs: SessionLog[];
  allNpcs: { id: string; name: string }[];
  encountersBySession: Record<string, EncounterEntry[]>;
};

export default function SessionLogList({
  characterId,
  initialLogs,
  allNpcs,
  encountersBySession,
}: Props) {
  const [logs, setLogs] = useState<SessionLog[]>(initialLogs);

  const nextSessionNumber =
    logs.length > 0 ? Math.max(...logs.map((l) => l.session_number)) + 1 : 1;

  function handleAdded(log: SessionLog) {
    setLogs((prev) =>
      [log, ...prev].sort((a, b) => b.session_number - a.session_number)
    );
  }

  return (
    <div className="space-y-4">
      <SessionLogForm
        characterId={characterId}
        nextSessionNumber={nextSessionNumber}
        onAdded={handleAdded}
      />

      {logs.length === 0 ? (
        <p className="text-center text-coc-muted text-sm py-8">
          記録されたセッションはありません
        </p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs text-coc-muted font-semibold mr-2">
                    Session {log.session_number}
                  </span>
                  <h3 className="inline font-cinzel text-coc-text font-semibold text-sm">
                    {log.title}
                  </h3>
                </div>
                {log.played_at && (
                  <span className="text-xs text-coc-muted whitespace-nowrap shrink-0">
                    {log.played_at}
                  </span>
                )}
              </div>

              {(log.san_loss > 0 || log.hp_loss > 0) && (
                <div className="flex gap-3 text-xs">
                  {log.san_loss > 0 && (
                    <span className="text-[var(--color-coc-san)]">
                      SAN -{log.san_loss}
                    </span>
                  )}
                  {log.hp_loss > 0 && (
                    <span className="text-[var(--color-coc-hp)]">
                      HP -{log.hp_loss}
                    </span>
                  )}
                </div>
              )}

              {log.summary && (
                <p className="font-crimson text-coc-text text-[15px] leading-relaxed whitespace-pre-wrap border-l-2 border-coc-border pl-3">
                  {log.summary}
                </p>
              )}

              {log.recording_url && (
                <a
                  href={log.recording_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-coc-gold hover:brightness-125 transition-all"
                >
                  <ExternalLink size={12} />
                  録音を聞く
                </a>
              )}

              <SessionNpcEncounters
                sessionId={log.id}
                allNpcs={allNpcs}
                initialEncounters={encountersBySession[log.id] ?? []}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
