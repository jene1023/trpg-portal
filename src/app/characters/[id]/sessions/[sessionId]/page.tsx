export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, ExternalLink } from "lucide-react";
import { supabase, isSupabaseConfigured, SessionLog } from "@/lib/supabase";

type Props = { params: Promise<{ id: string; sessionId: string }> };

function extractEmbedUrl(url: string): string | null {
  // YouTube: youtube.com/watch?v= or youtu.be/
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Niconico: nicovideo.jp/watch/smXXXXXX
  const nicoMatch = url.match(/nicovideo\.jp\/watch\/(sm\d+)/);
  if (nicoMatch) return `https://embed.nicovideo.jp/watch/${nicoMatch[1]}`;

  return null;
}

export default async function SessionDetailPage({ params }: Props) {
  const { id, sessionId } = await params;

  if (!isSupabaseConfigured) notFound();

  const [{ data: char }, { data: session }] = await Promise.all([
    supabase.from("characters").select("id, name").eq("id", id).single(),
    supabase.from("sessions").select("*").eq("id", sessionId).single(),
  ]);

  if (!char || !session) notFound();

  const log = session as unknown as SessionLog;
  const embedUrl = log.recording_url ? extractEmbedUrl(log.recording_url) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/characters/${id}/sessions`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {char.name} — セッションログ
        </Link>
      </div>

      <div className="mb-1 flex items-center gap-2">
        <Play size={18} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          Session {log.session_number}
        </h1>
      </div>
      <p className="text-coc-text font-medium mb-1">{log.title}</p>
      {log.played_at && (
        <p className="text-xs text-coc-muted mb-6">{log.played_at}</p>
      )}

      {embedUrl ? (
        <div className="rounded-xl overflow-hidden border border-coc-border mb-6 bg-black aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      ) : log.recording_url ? (
        <div className="rounded-xl border border-coc-border bg-coc-surface p-4 mb-6 text-sm text-coc-muted flex items-center justify-between">
          <span>録画URLが登録されていますが、埋め込み再生に対応していない形式です。</span>
          <a
            href={log.recording_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-coc-gold hover:brightness-125 transition-all ml-4 whitespace-nowrap"
          >
            <ExternalLink size={14} />
            外部で開く
          </a>
        </div>
      ) : (
        <div className="rounded-xl border border-coc-border bg-coc-surface p-6 mb-6 text-center text-sm text-coc-muted">
          録画URLが登録されていません。
        </div>
      )}

      <div className="space-y-4">
        {(log.san_loss > 0 || log.hp_loss > 0) && (
          <div className="flex gap-4 text-sm">
            {log.san_loss > 0 && (
              <span className="text-[var(--color-coc-san)]">SAN -{log.san_loss}</span>
            )}
            {log.hp_loss > 0 && (
              <span className="text-[var(--color-coc-hp)]">HP -{log.hp_loss}</span>
            )}
          </div>
        )}

        {log.summary && (
          <div className="rounded-lg border border-coc-border bg-coc-surface p-4">
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-2">セッションサマリー</h2>
            <p className="font-crimson text-coc-text text-[15px] leading-relaxed whitespace-pre-wrap">
              {log.summary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
