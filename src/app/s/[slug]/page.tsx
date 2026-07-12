export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Clock, Users } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Props = { params: Promise<{ slug: string }> };

export default async function ScenarioTeaserPage({ params }: Props) {
  const { slug } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title, teaser_text, teaser_is_public, recommended_players_min, recommended_players_max, estimated_hours, next_session_at")
    .eq("id", slug)
    .single();

  if (!scenario || !scenario.teaser_is_public) notFound();

  const { recommended_players_min: pMin, recommended_players_max: pMax, estimated_hours: hours } = scenario;

  return (
    <div className="min-h-screen coc-bg flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-4 text-center">
          Call of Cthulhu
        </p>

        <div className="rounded-2xl border border-coc-gold-dim bg-coc-surface px-6 py-7 shadow-lg">
          <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-3">
            シナリオ紹介
          </p>

          <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-5 leading-tight">
            {scenario.title}
          </h1>

          {/* メタ情報バッジ */}
          {(pMin != null || pMax != null || hours != null) && (
            <div className="flex flex-wrap gap-2 mb-5">
              {(pMin != null || pMax != null) && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-coc-border px-3 py-1 text-xs text-coc-muted">
                  <Users size={11} />
                  {pMin != null && pMax != null
                    ? `推奨 ${pMin}〜${pMax}人`
                    : pMin != null
                    ? `推奨 ${pMin}人〜`
                    : `推奨 〜${pMax}人`}
                </span>
              )}
              {hours != null && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-coc-border px-3 py-1 text-xs text-coc-muted">
                  <Clock size={11} />
                  目安 {hours}時間
                </span>
              )}
            </div>
          )}

          {/* 次回セッション予定 */}
          {scenario.next_session_at && (
            <div className="flex items-center gap-2 rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-2.5 mb-5 w-fit">
              <Clock size={14} className="text-coc-gold flex-shrink-0" />
              <span className="text-sm text-coc-gold font-medium">
                {new Date(scenario.next_session_at).toLocaleString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          {/* ティザーテキスト */}
          {scenario.teaser_text && (
            <div>
              <p className="font-cinzel text-xs font-medium text-coc-muted uppercase tracking-widest mb-2">
                雰囲気・あらすじ
              </p>
              <p className="text-sm text-coc-text whitespace-pre-wrap leading-relaxed">
                {scenario.teaser_text}
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-coc-muted mt-6">
          Powered by CoC Portal
        </p>
      </div>
    </div>
  );
}
