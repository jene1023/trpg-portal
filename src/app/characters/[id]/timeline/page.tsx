export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionLog } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

function nodeColor(sanLoss: number): string {
  if (sanLoss >= 5) return "bg-red-600 border-red-500";
  if (sanLoss >= 1) return "bg-yellow-600 border-yellow-500";
  return "bg-coc-gold border-coc-gold";
}

function lineLabelColor(sanLoss: number): string {
  if (sanLoss >= 5) return "text-red-400";
  if (sanLoss >= 1) return "text-yellow-400";
  return "text-coc-muted";
}

export default async function TimelinePage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("character_id", id)
    .order("session_number", { ascending: true });

  const logs: SessionLog[] = sessions ?? [];

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

      <h1 className="font-cinzel text-xl font-bold text-coc-text mb-8">
        セッション年表
      </h1>

      {logs.length === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center text-coc-muted text-sm">
          セッションログがまだありません。
          <br />
          <Link
            href={`/characters/${id}/sessions`}
            className="mt-3 inline-block text-coc-gold hover:underline"
          >
            セッションログを追加する →
          </Link>
        </div>
      ) : (
        <div className="relative">
          {/* 縦線 */}
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-coc-border" />

          <ol className="space-y-8">
            {logs.map((log) => (
              <li key={log.id} className="relative pl-12">
                {/* ノード */}
                <div
                  className={`absolute left-2 top-2 w-5 h-5 -translate-x-1/2 rounded-full border-2 ${nodeColor(log.san_loss)}`}
                />

                <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-cinzel text-xs text-coc-muted uppercase tracking-widest">
                        #{log.session_number}
                      </span>
                      <h2 className="font-semibold text-coc-text text-sm">
                        {log.title}
                      </h2>
                    </div>
                    {log.played_at && (
                      <time className="text-xs text-coc-muted shrink-0">
                        {new Date(log.played_at).toLocaleDateString("ja-JP")}
                      </time>
                    )}
                  </div>

                  {(log.san_loss > 0 || log.hp_loss > 0) && (
                    <div className="flex gap-3 text-xs">
                      {log.san_loss > 0 && (
                        <span className={`font-semibold ${lineLabelColor(log.san_loss)}`}>
                          SAN -{log.san_loss}
                        </span>
                      )}
                      {log.hp_loss > 0 && (
                        <span className="text-orange-400 font-semibold">
                          HP -{log.hp_loss}
                        </span>
                      )}
                    </div>
                  )}

                  {log.summary && (
                    <p className="font-crimson text-coc-muted text-sm leading-relaxed whitespace-pre-wrap">
                      {log.summary}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
