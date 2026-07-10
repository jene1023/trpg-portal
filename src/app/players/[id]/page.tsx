export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Phone, BookOpen, StickyNote, Gamepad2, User, Calendar, BarChart2 } from "lucide-react";
import { supabase, isSupabaseConfigured, Player, ScenarioStatus } from "@/lib/supabase";

type ParticipantRow = {
  id: string;
  character_id: string;
  created_at: string;
  scenarios: { title: string; status: ScenarioStatus } | null;
  characters: { name: string; occupation: string | null } | null;
};

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

type Props = { params: Promise<{ id: string }> };

export default async function PlayerDetailPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single();

  if (!player) notFound();

  const p = player as Player;

  const { data: participations } = await supabase
    .from("scenario_participants")
    .select("id, character_id, created_at, scenarios(title, status), characters(name, occupation)")
    .eq("player_id", id)
    .order("created_at", { ascending: false });

  const history = (participations ?? []) as unknown as ParticipantRow[];

  return (
    <div className="coc-page-enter mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/players"
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          プレイヤー一覧
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cinzel text-2xl font-bold text-coc-text flex items-center gap-2">
          <User size={22} className="text-coc-gold" />
          {p.display_name}
        </h1>
        <Link
          href={`/players/${p.id}/dashboard`}
          className="flex items-center gap-1.5 rounded-lg border border-coc-border bg-coc-surface px-3 py-2 text-sm text-coc-muted hover:text-coc-text hover:border-coc-gold-dim transition-colors"
        >
          <BarChart2 size={14} />
          個人統計
        </Link>
      </div>

      {/* 連絡先情報 */}
      <section className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 mb-4">
        <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-wider mb-3">
          連絡先・プロフィール
        </h2>
        <div className="flex flex-col gap-2">
          {p.contact_discord && (
            <div className="flex items-center gap-2">
              <MessageCircle size={15} className="text-coc-muted shrink-0" />
              <span className="text-xs text-coc-muted">Discord</span>
              <span className="text-sm text-coc-text">{p.contact_discord}</span>
            </div>
          )}
          {p.contact_other && (
            <div className="flex items-center gap-2">
              <Phone size={15} className="text-coc-muted shrink-0" />
              <span className="text-xs text-coc-muted">その他</span>
              <span className="text-sm text-coc-text">{p.contact_other}</span>
            </div>
          )}
          {p.preferred_genre && (
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-coc-muted shrink-0" />
              <span className="text-xs text-coc-muted">好みのシナリオ</span>
              <span className="text-sm text-coc-text">{p.preferred_genre}</span>
            </div>
          )}
          {!p.contact_discord && !p.contact_other && !p.preferred_genre && (
            <p className="text-sm text-coc-muted italic">連絡先情報が登録されていません。</p>
          )}
        </div>
      </section>

      {/* メモ */}
      {p.notes && (
        <section className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4 mb-4">
          <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <StickyNote size={14} />
            メモ
          </h2>
          <p className="text-sm text-coc-text whitespace-pre-wrap">{p.notes}</p>
        </section>
      )}

      {/* 参加履歴 */}
      <section className="rounded-xl border border-coc-border bg-coc-surface px-5 py-4">
        <h2 className="font-cinzel text-sm font-semibold text-coc-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Gamepad2 size={14} />
          参加シナリオ履歴
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-coc-muted italic">参加履歴がありません。</p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((row) => (
              <div
                key={row.id}
                className="rounded-lg border border-coc-border bg-coc-raised px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {row.scenarios && (
                      <span className="font-medium text-coc-text text-sm">
                        {row.scenarios.title}
                      </span>
                    )}
                    {row.scenarios && (
                      <span
                        className={`text-xs border rounded px-1.5 py-0.5 ${STATUS_COLORS[row.scenarios.status]}`}
                      >
                        {STATUS_LABELS[row.scenarios.status]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-coc-faint shrink-0">
                    <Calendar size={11} />
                    {new Date(row.created_at).toLocaleDateString("ja-JP")}
                  </div>
                </div>
                {row.characters && (
                  <div className="flex items-center gap-1.5 text-xs text-coc-muted">
                    <User size={12} />
                    <span>{row.characters.name}</span>
                    {row.characters.occupation && (
                      <span className="text-coc-faint">— {row.characters.occupation}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
