export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import SnapshotRestoreButton from "@/app/_components/SnapshotRestoreButton";

type Props = { params: Promise<{ id: string }> };

export default async function SnapshotsPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: snapshots } = await supabase
    .from("character_snapshots")
    .select("id, label, taken_at, snapshot_data")
    .eq("character_id", id)
    .order("taken_at", { ascending: false });

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

      <div className="flex items-center gap-2 mb-1">
        <Camera size={20} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">スナップショット</h1>
      </div>
      <p className="text-sm text-coc-muted mb-6">
        保存されたスナップショット一覧です。復元するとHP・MP・SAN・技能値が当時の状態に戻ります。
      </p>

      {(snapshots ?? []).length === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-6 text-center">
          <Camera size={32} className="mx-auto text-coc-muted mb-3" />
          <p className="text-coc-muted text-sm">スナップショットがまだありません。</p>
          <p className="text-coc-muted text-xs mt-1">
            セッション前確認ページから「スナップショットを保存」してください。
          </p>
          <Link
            href={`/characters/${id}/preflight`}
            className="mt-4 inline-block text-xs text-coc-gold hover:underline"
          >
            セッション前確認へ →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {(snapshots ?? []).map(
            (snap: { id: string; label: string; taken_at: string; snapshot_data: Record<string, unknown> }) => {
              const data = snap.snapshot_data as {
                hp_current?: number;
                hp_max?: number;
                mp_current?: number;
                mp_max?: number;
                san_current?: number;
                san_max?: number;
                character_skills?: unknown[];
              };
              return (
                <li
                  key={snap.id}
                  className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-coc-text">{snap.label}</p>
                      <p className="text-xs text-coc-muted mt-0.5">
                        {new Date(snap.taken_at).toLocaleString("ja-JP")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs text-coc-muted">
                    {data.hp_current != null && (
                      <span>HP {data.hp_current}/{data.hp_max}</span>
                    )}
                    {data.mp_current != null && (
                      <span>MP {data.mp_current}/{data.mp_max}</span>
                    )}
                    {data.san_current != null && (
                      <span>SAN {data.san_current}/{data.san_max}</span>
                    )}
                    {data.character_skills != null && (
                      <span>技能 {data.character_skills.length}件</span>
                    )}
                  </div>

                  <SnapshotRestoreButton
                    snapshotId={snap.id}
                    characterId={id}
                    label={snap.label}
                    snapshotData={snap.snapshot_data}
                  />
                </li>
              );
            }
          )}
        </ul>
      )}
    </div>
  );
}
