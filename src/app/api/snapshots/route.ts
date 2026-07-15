import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.character_id) {
    return NextResponse.json({ error: "character_id is required" }, { status: 400 });
  }

  const { character_id, session_label } = body as {
    character_id: string;
    session_label?: string | null;
  };

  const { data: char, error: charErr } = await supabase
    .from("characters")
    .select("hp_current, san_current, luck")
    .eq("id", character_id)
    .single();

  if (charErr || !char) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("character_stat_snapshots")
    .insert({
      character_id,
      session_label: session_label ?? null,
      hp_current: char.hp_current,
      san_current: char.san_current,
      luck: char.luck,
      snapshot_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ snapshot: data }, { status: 201 });
}
