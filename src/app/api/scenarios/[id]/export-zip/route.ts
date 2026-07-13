import { NextRequest, NextResponse } from "next/server";
import type { Archiver } from "archiver";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const createArchiver = require("archiver") as (format: string, opts?: object) => Archiver;
import { Writable } from "stream";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function archiverToBuffer(archive: Archiver): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const writable = new Writable({
      write(chunk: Buffer, _enc: string, cb: () => void) {
        chunks.push(chunk);
        cb();
      },
    });
    writable.on("finish", () => resolve(Buffer.concat(chunks)));
    writable.on("error", reject);
    archive.on("error", reject);
    archive.pipe(writable);
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, "_").slice(0, 60);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase が設定されていません。" }, { status: 503 });
  }

  const { id } = await params;

  const { data: scenario, error: scenarioError } = await supabase
    .from("scenarios")
    .select("*")
    .eq("id", id)
    .single();

  if (scenarioError || !scenario) {
    return NextResponse.json({ error: "シナリオが見つかりません。" }, { status: 404 });
  }

  const [
    { data: handouts },
    { data: scenarioNotes },
    { data: creatures },
    { data: kpMemo },
  ] = await Promise.all([
    supabase
      .from("handouts")
      .select("*")
      .eq("scenario_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("scenario_notes")
      .select("*")
      .eq("scenario_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("creatures")
      .select("*")
      .eq("scenario_id", id)
      .order("name", { ascending: true }),
    supabase
      .from("kp_memos")
      .select("content")
      .eq("entity_type", "scenario")
      .eq("entity_id", id)
      .maybeSingle(),
  ]);

  const archive = createArchiver("zip", { zlib: { level: 6 } });
  const bufferPromise = archiverToBuffer(archive);

  // scenario-overview.md
  const overviewLines = [
    `# ${scenario.title}`,
    "",
    `ステータス: ${scenario.status}`,
    scenario.played_at ? `プレイ日: ${scenario.played_at}` : null,
    scenario.next_session_at ? `次回予定: ${scenario.next_session_at}` : null,
    "",
  ];
  if (scenario.synopsis) {
    overviewLines.push("## あらすじ", "", scenario.synopsis, "");
  }
  if (scenario.gm_notes) {
    overviewLines.push("## GMメモ", "", scenario.gm_notes, "");
  }
  archive.append(overviewLines.filter((l) => l !== null).join("\n"), {
    name: "scenario-overview.md",
  });

  // kp-memo.md
  if (kpMemo?.content) {
    archive.append(`# KPメモ\n\n${kpMemo.content}\n`, { name: "kp-memo.md" });
  }

  // scenario-notes.md
  if ((scenarioNotes ?? []).length > 0) {
    const notesContent = (scenarioNotes ?? [])
      .map((n) => {
        const header = n.author_name ? `### ${n.author_name}` : "### メモ";
        return `${header}\n\n${n.content}`;
      })
      .join("\n\n---\n\n");
    archive.append(`# シナリオノート\n\n${notesContent}\n`, {
      name: "scenario-notes.md",
    });
  }

  // handouts/
  for (let i = 0; i < (handouts ?? []).length; i++) {
    const h = handouts![i];
    const index = String(i + 1).padStart(2, "0");
    const filename = `${index}-${sanitizeFilename(h.title)}.md`;
    const lines = [
      `# ${h.title}`,
      "",
      h.recipient_name ? `宛先: ${h.recipient_name}` : null,
      h.is_secret ? "秘匿: はい" : null,
      h.is_distributed ? "配布済み: はい" : null,
      "",
    ];
    if (h.content) {
      lines.push(h.content, "");
    }
    if (h.image_url) {
      lines.push(`画像URL: ${h.image_url}`, "");

      // Supabase Storage からバイナリを取得して ZIP に追加
      try {
        const storageMatch = h.image_url.match(/\/storage\/v1\/object\/(?:public|authenticated)\/([^/]+)\/(.+)$/);
        if (storageMatch) {
          const bucket = storageMatch[1];
          const path = storageMatch[2];
          const { data: blob } = await supabase.storage.from(bucket).download(path);
          if (blob) {
            const ext = path.split(".").pop() ?? "bin";
            const imgFilename = `${index}-${sanitizeFilename(h.title)}.${ext}`;
            const arrayBuf = await blob.arrayBuffer();
            archive.append(Buffer.from(arrayBuf), {
              name: `handouts/images/${imgFilename}`,
            });
          }
        }
      } catch {
        // 画像取得失敗は無視して続行
      }
    }
    archive.append(lines.filter((l) => l !== null).join("\n"), {
      name: `handouts/${filename}`,
    });
  }

  // creatures/
  for (const c of creatures ?? []) {
    const filename = `${sanitizeFilename(c.name)}.json`;
    archive.append(JSON.stringify(c, null, 2), {
      name: `creatures/${filename}`,
    });
  }

  archive.finalize();
  const buf = await bufferPromise;

  const safeTitle = sanitizeFilename(scenario.title);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="scenario-${safeTitle}.zip"`,
    },
  });
}
