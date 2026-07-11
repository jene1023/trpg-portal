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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase が設定されていません。" }, { status: 503 });
  }

  const { scenarioId } = await params;

  const { data: scenario, error } = await supabase
    .from("scenarios")
    .select("id, title, next_session_at, synopsis")
    .eq("id", scenarioId)
    .single();

  if (error || !scenario) {
    return NextResponse.json({ error: "シナリオが見つかりません。" }, { status: 404 });
  }

  if (!scenario.next_session_at) {
    return NextResponse.json({ error: "次回セッション予定が設定されていません。" }, { status: 404 });
  }

  const now = formatICalDate(new Date().toISOString());
  const dtstart = formatICalDate(scenario.next_session_at);
  const dtend = formatICalDate(
    new Date(new Date(scenario.next_session_at).getTime() + 3 * 60 * 60 * 1000).toISOString()
  );
  const uid = `trpg-portal-scenario-${scenario.id}@trpg-portal`;
  const summary = escapeICalText(scenario.title ?? "TRPGセッション");
  const description = scenario.synopsis ? escapeICalText(scenario.synopsis) : "";

  const eventLines = [
    "BEGIN:VEVENT",
    foldLine(`UID:${uid}`),
    `DTSTAMP:${now}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    foldLine(`SUMMARY:${summary}`),
  ];
  if (description) eventLines.push(foldLine(`DESCRIPTION:${description}`));
  eventLines.push("END:VEVENT");

  const ical = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//trpg-portal//TRPG Session Calendar//JA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:TRPGセッション",
    "X-WR-TIMEZONE:Asia/Tokyo",
    eventLines.join("\r\n"),
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="trpg-session.ics"`,
    },
  });
}
