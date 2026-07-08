import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function formatICalDate(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeICalText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  chunks.push(line.slice(0, 75));
  let pos = 75;
  while (pos < line.length) {
    chunks.push(" " + line.slice(pos, pos + 74));
    pos += 74;
  }
  return chunks.join("\r\n");
}

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase が設定されていません。" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const singleId = searchParams.get("id");

  let query = supabase
    .from("scenarios")
    .select("id, title, next_session_at, synopsis")
    .not("next_session_at", "is", null);

  if (singleId) {
    query = query.eq("id", singleId);
  }

  const { data: scenarios, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = formatICalDate(new Date().toISOString());

  const events = (scenarios ?? []).map((s: { id: string; title: string; next_session_at: string | null; synopsis: string | null }) => {
    const dtstart = formatICalDate(s.next_session_at!);
    const dtend = formatICalDate(
      new Date(new Date(s.next_session_at!).getTime() + 3 * 60 * 60 * 1000).toISOString()
    );
    const uid = `trpg-portal-scenario-${s.id}@trpg-portal`;
    const summary = escapeICalText(s.title ?? "TRPGセッション");
    const description = s.synopsis ? escapeICalText(s.synopsis) : "";

    const lines = [
      "BEGIN:VEVENT",
      foldLine(`UID:${uid}`),
      `DTSTAMP:${now}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      foldLine(`SUMMARY:${summary}`),
    ];
    if (description) lines.push(foldLine(`DESCRIPTION:${description}`));
    lines.push("END:VEVENT");
    return lines.join("\r\n");
  });

  const ical = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//trpg-portal//TRPG Session Calendar//JA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:TRPGセッション",
    "X-WR-TIMEZONE:Asia/Tokyo",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="trpg-sessions.ics"',
    },
  });
}
