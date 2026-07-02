export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileText,
  User,
  CalendarClock,
  ShieldCheck,
  Shield,
  ExternalLink,
  Package,
} from "lucide-react";
import {
  supabase,
  isSupabaseConfigured,
  ScenarioStatus,
} from "@/lib/supabase";

const STATUS_LABELS: Record<ScenarioStatus, string> = {
  planning: "準備中",
  ongoing: "進行中",
  completed: "完了",
};

type Props = { params: Promise<{ id: string }> };

export default async function ScenarioPreflightPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("*, scenario_participants(*, characters(*)), handouts(*)")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const { data: npcs } = await supabase
    .from("npcs")
    .select("id, name, purpose")
    .eq("scenario_name", scenario.title)
    .order("name", { ascending: true });

  const { data: propsData } = await supabase
    .from("scenario_props")
    .select("id, name, is_distributed")
    .eq("scenario_id", id)
    .order("created_at", { ascending: true });

  const participants: Array<{ id: string; attendance_status: string; characters: { id: string; name: string; player_name: string | null } }> =
    scenario.scenario_participants ?? [];
  const handouts: Array<{ id: string; title: string; is_secret: boolean; recipient_name: string | null; is_distributed: boolean }> =
    scenario.handouts ?? [];
  const npcList: Array<{ id: string; name: string; purpose: string | null }> = npcs ?? [];
  const propList: Array<{ id: string; name: string; is_distributed: boolean }> = propsData ?? [];

  const attendingCount = participants.filter((p) => p.attendance_status === "attending").length;
  const absentCount = participants.filter((p) => p.attendance_status === "absent").length;
  const unconfirmedCount = participants.filter((p) => p.attendance_status === "unconfirmed").length;

  const secretCount = handouts.filter((h) => h.is_secret).length;
  const noRecipientCount = handouts.filter((h) => !h.recipient_name).length;
  const undistributedCount = handouts.filter((h) => !h.is_distributed).length;
  const undistributedPropCount = propList.filter((p) => !p.is_distributed).length;

  const sectionClass = "rounded-lg border bg-coc-surface p-4";

  const checks = [
    {
      ok: participants.length > 0 && unconfirmedCount === 0,
      label: "全参加者の出欠確定",
      warn:
        participants.length === 0
          ? "参加者未登録"
          : unconfirmedCount > 0
          ? `${unconfirmedCount}名未確定`
          : undefined,
    },
    {
      ok: handouts.length > 0 && noRecipientCount === 0,
      label: "ハンドアウト配布先設定",
      warn:
        handouts.length === 0
          ? "ハンドアウトなし"
          : noRecipientCount > 0
          ? `${noRecipientCount}件未設定`
          : undefined,
    },
    {
      ok: handouts.length === 0 || undistributedCount === 0,
      label: "ハンドアウト配布済み確認",
      warn:
        handouts.length === 0
          ? "ハンドアウトなし"
          : undistributedCount > 0
          ? `未配布 ${undistributedCount}件`
          : undefined,
    },
    {
      ok: npcList.length > 0,
      label: "NPCの登録",
      warn: npcList.length === 0 ? "NPCなし" : undefined,
    },
    {
      ok: !!scenario.next_session_at,
      label: "次回セッション予定日の設定",
      warn: !scenario.next_session_at ? "未設定" : undefined,
    },
    {
      ok: !!scenario.vtt_url,
      label: "卓URL（VTT / 通話ツール）の設定",
      warn: !scenario.vtt_url ? "未設定" : undefined,
    },
    {
      ok: propList.length === 0 || undistributedPropCount === 0,
      label: "物証・道具の配布",
      warn:
        propList.length === 0
          ? "プロップなし"
          : undistributedPropCount > 0
          ? `未配布 ${undistributedPropCount}件`
          : undefined,
    },
  ];

  const allGreen = checks.every((c) => c.ok);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {scenario.title}
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={20} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          セッション準備確認
        </h1>
      </div>
      <p className="text-sm text-coc-muted mb-1">
        セッション当日の準備漏れをまとめて確認できます。
      </p>
      <p className="text-xs text-coc-muted mb-6">
        ステータス: {STATUS_LABELS[scenario.status as ScenarioStatus]}
      </p>

      {/* 次回セッション予定 */}
      {scenario.next_session_at ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-coc-gold-dim bg-coc-raised px-4 py-3">
          <CalendarClock size={16} className="text-coc-gold" />
          <div>
            <p className="text-xs text-coc-muted">次回セッション予定</p>
            <p className="text-sm font-semibold text-coc-gold">
              {new Date(scenario.next_session_at).toLocaleString("ja-JP", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-800 bg-yellow-950/20 px-4 py-3">
          <AlertTriangle size={16} className="text-yellow-400" />
          <p className="text-sm text-yellow-300">次回セッション予定日が未設定です</p>
        </div>
      )}

      {/* 卓URL */}
      {scenario.vtt_url ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-coc-border bg-coc-surface px-4 py-3">
          <ExternalLink size={16} className="text-coc-gold flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-coc-muted">卓URL{scenario.vtt_type ? ` (${scenario.vtt_type})` : ""}</p>
            <a
              href={scenario.vtt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-coc-gold hover:underline break-all"
            >
              {scenario.vtt_url}
            </a>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-800 bg-yellow-950/20 px-4 py-3">
          <AlertTriangle size={16} className="text-yellow-400" />
          <p className="text-sm text-yellow-300">卓URL（VTT / 通話ツール）が未設定です</p>
        </div>
      )}

      {/* 準備チェックリスト */}
      <div className={`${sectionClass} border-coc-border mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2
            size={16}
            className={allGreen ? "text-green-400" : "text-yellow-400"}
          />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            準備チェックリスト
          </h2>
          {allGreen && (
            <span className="ml-auto rounded-full bg-green-900/60 border border-green-700 px-2 py-0.5 text-xs text-green-300 font-semibold">
              準備完了
            </span>
          )}
        </div>
        <ul className="space-y-2">
          {checks.map(({ ok, label, warn }) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={
                  ok ? "text-green-400 font-bold" : "text-yellow-400"
                }
              >
                {ok ? "✓" : "!"}
              </span>
              <span className="text-sm text-coc-text flex-1">{label}</span>
              {!ok && warn && (
                <span className="text-xs text-yellow-400">{warn}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* 参加者確認 */}
      <div className={`${sectionClass} border-coc-border mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Users
            size={16}
            className={
              unconfirmedCount > 0 ? "text-yellow-400" : "text-coc-muted"
            }
          />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            参加者出欠
          </h2>
          <span className="ml-auto text-xs text-coc-muted">
            {participants.length}名
          </span>
        </div>
        {participants.length === 0 ? (
          <p className="text-sm text-coc-muted mb-3">
            参加者が登録されていません
          </p>
        ) : (
          <div className="mb-3">
            <div className="flex gap-4 text-sm mb-2">
              <span className="text-green-400 font-semibold">
                参加 {attendingCount}名
              </span>
              <span className="text-red-400 font-semibold">
                欠席 {absentCount}名
              </span>
              {unconfirmedCount > 0 && (
                <span className="text-yellow-400 font-semibold">
                  未定 {unconfirmedCount}名
                </span>
              )}
            </div>
            {unconfirmedCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-md border border-yellow-800 bg-yellow-950/20 px-3 py-2">
                <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />
                <p className="text-xs text-yellow-300">
                  {unconfirmedCount}名の出欠が未確定です
                </p>
              </div>
            )}
          </div>
        )}
        {participants.length > 0 && (
          <ul className="space-y-1 mb-3">
            {participants.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-md border border-coc-border bg-coc-raised px-3 py-1.5"
              >
                <Link
                  href={`/characters/${p.characters.id}`}
                  className="text-sm text-coc-text hover:text-coc-gold transition-colors"
                >
                  {p.characters.name}
                  {p.characters.player_name && (
                    <span className="ml-1.5 text-xs text-coc-muted">
                      ({p.characters.player_name})
                    </span>
                  )}
                </Link>
                <span
                  className={`text-xs font-semibold ${
                    p.attendance_status === "attending"
                      ? "text-green-400"
                      : p.attendance_status === "absent"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {p.attendance_status === "attending"
                    ? "参加"
                    : p.attendance_status === "absent"
                    ? "欠席"
                    : "未定"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/scenarios/${id}/participants`}
          className="inline-block text-xs text-coc-muted hover:text-coc-text transition-colors"
        >
          参加者管理を開く →
        </Link>
      </div>

      {/* ハンドアウト確認 */}
      <div className={`${sectionClass} border-coc-border mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <FileText
            size={16}
            className={noRecipientCount > 0 ? "text-yellow-400" : "text-coc-muted"}
          />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            ハンドアウト
          </h2>
          <span className="ml-auto text-xs text-coc-muted">{handouts.length}件</span>
        </div>
        {handouts.length === 0 ? (
          <p className="text-sm text-coc-muted mb-3">
            ハンドアウトがありません
          </p>
        ) : (
          <div className="mb-3 space-y-2">
            <div className="flex gap-3 text-sm flex-wrap">
              <span className="text-coc-text">{handouts.length}件作成済み</span>
              <span className="text-green-400 text-xs self-end">
                配布済み {handouts.length - undistributedCount}件
              </span>
              {undistributedCount > 0 && (
                <span className="text-yellow-400 text-xs self-end">
                  未配布 {undistributedCount}件
                </span>
              )}
              {secretCount > 0 && (
                <span className="text-coc-muted text-xs self-end">
                  （秘匿 {secretCount}件）
                </span>
              )}
            </div>
            {undistributedCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-md border border-yellow-800 bg-yellow-950/20 px-3 py-2">
                <AlertTriangle
                  size={14}
                  className="text-yellow-400 flex-shrink-0"
                />
                <p className="text-xs text-yellow-300">
                  未配布のハンドアウトが {undistributedCount}件あります
                </p>
              </div>
            )}
            {noRecipientCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-md border border-yellow-800 bg-yellow-950/20 px-3 py-2">
                <AlertTriangle
                  size={14}
                  className="text-yellow-400 flex-shrink-0"
                />
                <p className="text-xs text-yellow-300">
                  配布先が未設定のハンドアウトが {noRecipientCount}件あります
                </p>
              </div>
            )}
          </div>
        )}
        <Link
          href={`/scenarios/${id}/handouts`}
          className="inline-block text-xs text-coc-muted hover:text-coc-text transition-colors"
        >
          ハンドアウトを管理 →
        </Link>
      </div>

      {/* NPC一覧 */}
      <div className={`${sectionClass} border-coc-border mb-6`}>
        <div className="flex items-center gap-2 mb-3">
          <User size={16} className="text-coc-muted" />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            登録NPC
          </h2>
          <span className="ml-auto text-xs text-coc-muted">{npcList.length}件</span>
        </div>
        {npcList.length === 0 ? (
          <p className="text-sm text-coc-muted mb-3">NPCが登録されていません</p>
        ) : (
          <ul className="space-y-2 mb-3">
            {npcList.map((npc) => (
              <li
                key={npc.id}
                className="rounded-md border border-coc-border bg-coc-raised px-3 py-2"
              >
                <Link
                  href={`/npcs/${npc.id}`}
                  className="text-sm font-semibold text-coc-text hover:text-coc-gold transition-colors"
                >
                  {npc.name}
                </Link>
                {npc.purpose && (
                  <p className="text-xs text-coc-muted mt-0.5 line-clamp-1">
                    {npc.purpose}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/npcs?scenario=${encodeURIComponent(scenario.title)}`}
          className="inline-block text-xs text-coc-muted hover:text-coc-text transition-colors"
        >
          NPC一覧を開く →
        </Link>
      </div>

      {/* 物証・道具 */}
      {propList.length > 0 && (
        <div className={`${sectionClass} border-coc-border mb-4`}>
          <div className="flex items-center gap-2 mb-3">
            <Package
              size={16}
              className={undistributedPropCount > 0 ? "text-yellow-400" : "text-coc-muted"}
            />
            <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
              物証・道具
            </h2>
            <span className="ml-auto text-xs text-coc-muted">{propList.length}件</span>
          </div>
          {undistributedPropCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-md border border-yellow-800 bg-yellow-950/20 px-3 py-2 mb-3">
              <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />
              <p className="text-xs text-yellow-300">
                未配布のプロップが {undistributedPropCount}件あります
              </p>
            </div>
          )}
          <ul className="space-y-1 mb-3">
            {propList.map((prop) => (
              <li
                key={prop.id}
                className="flex items-center justify-between rounded-md border border-coc-border bg-coc-raised px-3 py-1.5"
              >
                <span
                  className={`text-sm ${
                    prop.is_distributed ? "line-through text-coc-muted" : "text-coc-text"
                  }`}
                >
                  {prop.name}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    prop.is_distributed ? "text-green-400" : "text-yellow-400"
                  }`}
                >
                  {prop.is_distributed ? "配布済み" : "未配布"}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href={`/scenarios/${id}/props`}
            className="inline-block text-xs text-coc-muted hover:text-coc-text transition-colors"
          >
            物証・道具を管理 →
          </Link>
        </div>
      )}

      {/* クイックリンク */}
      <div className="flex flex-col gap-2">
        <Link
          href={`/scenarios/${id}/party`}
          className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-coc-gold" />
            <span>パーティービューを開く</span>
          </div>
          <span className="text-coc-gold">→</span>
        </Link>
        <Link
          href={`/scenarios/${id}/notes`}
          className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-coc-gold" />
            <span>共有メモを開く</span>
          </div>
          <span className="text-coc-gold">→</span>
        </Link>
      </div>
    </div>
  );
}
