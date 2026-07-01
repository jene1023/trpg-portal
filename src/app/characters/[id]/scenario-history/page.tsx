export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase, isSupabaseConfigured, ScenarioStatus } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

const STATUS_LABELS: Record<ScenarioStatus, string> = {
  planning: "準備中",
  ongoing: "進行中",
  completed: "完了",
};

const STATUS_COLORS: Record<ScenarioStatus, string> = {
  planning: "text-coc-muted border-coc-border",
  ongoing: "text-coc-gold border-coc-gold-dim",
  completed: "text-green-400 border-green-800",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ScenarioHistoryPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: participants } = await supabase
    .from("scenario_participants")
    .select("*, scenarios(*)")
    .eq("character_id", id)
    .order("created_at", { ascending: false });

  const rows = (participants ?? []) as Array<{
    id: string;
    scenario_id: string;
    character_id: string;
    attendance_status: string;
    created_at: string;
    scenarios: {
      id: string;
      title: string;
      status: ScenarioStatus;
      synopsis: string | null;
      next_session_at: string | null;
      played_at: string | null;
    } | null;
  }>;

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
        参加シナリオ履歴
      </h1>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-8 text-center text-coc-muted text-sm">
          参加シナリオがまだ登録されていません。
          <br />
          <Link
            href="/scenarios"
            className="mt-3 inline-block text-coc-gold hover:underline"
          >
            シナリオ一覧を見る →
          </Link>
        </div>
      ) : (
        <ol className="space-y-3">
          {rows.map((row) => {
            const scenario = row.scenarios;
            if (!scenario) return null;
            return (
              <li key={row.id}>
                <Link
                  href={`/scenarios/${scenario.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-coc-border bg-coc-surface px-4 py-3 hover:border-coc-border-glow hover:bg-coc-raised transition-colors motion-safe:active:scale-[0.98]"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold text-coc-text text-sm leading-tight truncate">
                      {scenario.title}
                    </p>
                    {scenario.synopsis && (
                      <p className="text-xs text-coc-muted line-clamp-2 leading-relaxed">
                        {scenario.synopsis}
                      </p>
                    )}
                    {scenario.next_session_at && (
                      <p className="text-xs text-coc-muted">
                        次回予定: {formatDate(scenario.next_session_at)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`rounded border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[scenario.status]}`}
                    >
                      {STATUS_LABELS[scenario.status]}
                    </span>
                    <span className="text-coc-gold text-sm">→</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
