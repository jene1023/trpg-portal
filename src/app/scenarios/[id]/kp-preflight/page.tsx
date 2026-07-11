export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileText,
  Music,
  ListChecks,
  CalendarClock,
  ExternalLink,
  Shield,
  ClipboardList,
  Gauge,
} from "lucide-react";
import { supabase, isSupabaseConfigured, AttendanceStatus } from "@/lib/supabase";
import HandoutDistributeToggle from "@/app/_components/HandoutDistributeToggle";
import AttendanceToggle from "@/app/_components/AttendanceToggle";

type Props = { params: Promise<{ id: string }> };

export default async function KpPreflightPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("*, handouts(*), bgm_cues(*), scenario_scenes(*), scenario_participants(*, characters(*))")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  type ParticipantRow = {
    id: string;
    attendance_status: string;
    characters: { id: string; name: string; player_name: string | null };
  };
  type HandoutRow = {
    id: string;
    title: string;
    recipient_name: string | null;
    is_secret: boolean;
    is_distributed: boolean;
  };
  type BgmCueRow = {
    id: string;
    order_index: number;
    label: string;
    bgm_url: string | null;
    mood: string | null;
  };
  type SceneRow = {
    id: string;
    scene_order: number;
    title: string;
    is_done: boolean;
  };

  const participants: ParticipantRow[] = (scenario.scenario_participants ?? []).sort(
    (a: ParticipantRow, b: ParticipantRow) => a.characters.name.localeCompare(b.characters.name, "ja")
  );
  const handouts: HandoutRow[] = (scenario.handouts ?? []).sort(
    (a: HandoutRow, b: HandoutRow) => a.title.localeCompare(b.title, "ja")
  );
  const bgmCues: BgmCueRow[] = (scenario.bgm_cues ?? []).sort(
    (a: BgmCueRow, b: BgmCueRow) => a.order_index - b.order_index
  );
  const scenes: SceneRow[] = (scenario.scenario_scenes ?? []).sort(
    (a: SceneRow, b: SceneRow) => a.scene_order - b.scene_order
  );

  const attendingCount = participants.filter((p) => (p.attendance_status as AttendanceStatus) === "attending").length;
  const absentCount = participants.filter((p) => (p.attendance_status as AttendanceStatus) === "absent").length;
  const unconfirmedCount = participants.filter((p) => (p.attendance_status as AttendanceStatus) === "unconfirmed").length;

  const undistributedCount = handouts.filter((h) => !h.is_distributed).length;
  const noRecipientCount = handouts.filter((h) => !h.recipient_name).length;
  const doneSceneCount = scenes.filter((s) => s.is_done).length;

  const checks = [
    {
      ok: participants.length > 0 && unconfirmedCount === 0,
      label: "全参加者の出欠確定",
      warn: participants.length === 0 ? "参加者未登録" : unconfirmedCount > 0 ? `${unconfirmedCount}名未確定` : undefined,
    },
    {
      ok: handouts.length === 0 || undistributedCount === 0,
      label: "ハンドアウト全配布",
      warn: undistributedCount > 0 ? `未配布 ${undistributedCount}件` : handouts.length === 0 ? "ハンドアウトなし" : undefined,
    },
    {
      ok: handouts.length === 0 || noRecipientCount === 0,
      label: "ハンドアウト配布先設定",
      warn: noRecipientCount > 0 ? `配布先未設定 ${noRecipientCount}件` : undefined,
    },
    {
      ok: bgmCues.length > 0,
      label: "BGMキューの登録",
      warn: bgmCues.length === 0 ? "BGMキューなし" : undefined,
    },
    {
      ok: scenes.length > 0,
      label: "シーンリストの登録",
      warn: scenes.length === 0 ? "シーンなし" : undefined,
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
  ];

  const allGreen = checks.every((c) => c.ok);
  const sectionClass = "rounded-lg border bg-coc-surface p-4";

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
        <ClipboardList size={20} className="text-coc-gold" />
        <h1 className="font-cinzel text-xl font-bold text-coc-text">KP準備確認</h1>
      </div>
      <p className="text-sm text-coc-muted mb-6">
        セッション当日にハンドアウト配布・BGMキュー・シーンリスト・参加者出欠をまとめて点検できます。
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
            <p className="text-xs text-coc-muted">
              卓URL{scenario.vtt_type ? ` (${scenario.vtt_type})` : ""}
            </p>
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
          <CheckCircle2 size={16} className={allGreen ? "text-green-400" : "text-yellow-400"} />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">準備チェックリスト</h2>
          {allGreen && (
            <span className="ml-auto rounded-full bg-green-900/60 border border-green-700 px-2 py-0.5 text-xs text-green-300 font-semibold">
              準備完了
            </span>
          )}
        </div>
        <ul className="space-y-2">
          {checks.map(({ ok, label, warn }) => (
            <li key={label} className="flex items-center gap-2">
              <span className={ok ? "text-green-400 font-bold" : "text-yellow-400"}>
                {ok ? "✓" : "!"}
              </span>
              <span className="text-sm text-coc-text flex-1">{label}</span>
              {!ok && warn && <span className="text-xs text-yellow-400">{warn}</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* 参加者出欠 */}
      <div className={`${sectionClass} border-coc-border mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className={unconfirmedCount > 0 ? "text-yellow-400" : "text-coc-muted"} />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">参加者出欠</h2>
          <span className="ml-auto text-xs text-coc-muted">{participants.length}名</span>
        </div>
        {participants.length === 0 ? (
          <p className="text-sm text-coc-muted mb-3">参加者が登録されていません</p>
        ) : (
          <>
            <div className="flex gap-4 text-sm mb-3">
              <span className="text-green-400 font-semibold">参加 {attendingCount}名</span>
              <span className="text-red-400 font-semibold">欠席 {absentCount}名</span>
              {unconfirmedCount > 0 && (
                <span className="text-yellow-400 font-semibold">未定 {unconfirmedCount}名</span>
              )}
            </div>
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
                      <span className="ml-1.5 text-xs text-coc-muted">({p.characters.player_name})</span>
                    )}
                  </Link>
                  <AttendanceToggle
                    participantId={p.id}
                    initialStatus={(p.attendance_status as AttendanceStatus) ?? "unconfirmed"}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
        <Link
          href={`/scenarios/${id}/participants`}
          className="inline-block text-xs text-coc-muted hover:text-coc-text transition-colors"
        >
          参加者管理を開く →
        </Link>
      </div>

      {/* ハンドアウト配布 */}
      <div className={`${sectionClass} border-coc-border mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className={undistributedCount > 0 ? "text-yellow-400" : "text-coc-muted"} />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">ハンドアウト配布</h2>
          <span className="ml-auto text-xs text-coc-muted">{handouts.length}件</span>
        </div>
        {handouts.length === 0 ? (
          <p className="text-sm text-coc-muted mb-3">ハンドアウトがありません</p>
        ) : (
          <>
            {undistributedCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-md border border-yellow-800 bg-yellow-950/20 px-3 py-2 mb-3">
                <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />
                <p className="text-xs text-yellow-300">未配布 {undistributedCount}件あります</p>
              </div>
            )}
            <ul className="space-y-2 mb-3">
              {handouts.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-coc-border bg-coc-raised px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${h.is_distributed ? "line-through text-coc-muted" : "text-coc-text"}`}>
                      {h.title}
                    </span>
                    <div className="flex gap-2 mt-0.5">
                      {h.recipient_name && (
                        <span className="text-xs text-coc-muted">宛先: {h.recipient_name}</span>
                      )}
                      {h.is_secret && (
                        <span className="text-xs text-red-400">秘匿</span>
                      )}
                      {!h.recipient_name && (
                        <span className="text-xs text-yellow-400">配布先未設定</span>
                      )}
                    </div>
                  </div>
                  <HandoutDistributeToggle handoutId={h.id} initialDistributed={h.is_distributed} />
                </li>
              ))}
            </ul>
          </>
        )}
        <Link
          href={`/scenarios/${id}/handouts`}
          className="inline-block text-xs text-coc-muted hover:text-coc-text transition-colors"
        >
          ハンドアウトを管理 →
        </Link>
      </div>

      {/* BGMキュー */}
      <div className={`${sectionClass} border-coc-border mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Music size={16} className="text-coc-muted" />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">BGMキュー</h2>
          <span className="ml-auto text-xs text-coc-muted">{bgmCues.length}件</span>
        </div>
        {bgmCues.length === 0 ? (
          <p className="text-sm text-coc-muted mb-3">BGMキューが登録されていません</p>
        ) : (
          <ul className="space-y-2 mb-3">
            {bgmCues.map((cue, idx) => (
              <li
                key={cue.id}
                className="rounded-md border border-coc-border bg-coc-raised px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-coc-muted tabular-nums">{idx + 1}.</span>
                  <span className="text-sm font-medium text-coc-text flex-1">{cue.label}</span>
                  {cue.mood && (
                    <span className="text-xs text-coc-muted">{cue.mood}</span>
                  )}
                  {cue.bgm_url && (
                    <a
                      href={cue.bgm_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-coc-gold hover:underline"
                    >
                      ▶ 再生
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/scenarios/${id}/bgm`}
          className="inline-block text-xs text-coc-muted hover:text-coc-text transition-colors"
        >
          BGM・演出を管理 →
        </Link>
      </div>

      {/* シーンリスト */}
      <div className={`${sectionClass} border-coc-border mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <ListChecks size={16} className="text-coc-muted" />
          <h2 className="text-xs font-semibold text-coc-muted uppercase tracking-widest">シーンリスト</h2>
          <span className="ml-auto text-xs text-coc-muted">
            {doneSceneCount}/{scenes.length}件完了
          </span>
        </div>
        {scenes.length === 0 ? (
          <p className="text-sm text-coc-muted mb-3">シーンが登録されていません</p>
        ) : (
          <ul className="space-y-1 mb-3">
            {scenes.map((scene, idx) => (
              <li
                key={scene.id}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
                  scene.is_done
                    ? "border-coc-border bg-coc-raised opacity-60"
                    : "border-coc-border bg-coc-raised"
                }`}
              >
                <span className="text-xs text-coc-muted tabular-nums w-5">{idx + 1}.</span>
                <span
                  className={`text-sm flex-1 ${
                    scene.is_done ? "line-through text-coc-muted" : "text-coc-text"
                  }`}
                >
                  {scene.title}
                </span>
                {scene.is_done && (
                  <span className="text-xs text-green-400 font-semibold">完了</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/scenarios/${id}/agenda`}
          className="inline-block text-xs text-coc-muted hover:text-coc-text transition-colors"
        >
          セッションアジェンダを管理 →
        </Link>
      </div>

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
          href={`/scenarios/${id}/gm-screen`}
          className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-2">
            <ListChecks size={16} className="text-coc-gold" />
            <span>GMスクリーンを開く</span>
          </div>
          <span className="text-coc-gold">→</span>
        </Link>
        <Link
          href={`/scenarios/${id}/difficulty`}
          className="flex items-center justify-between rounded-lg border border-coc-border bg-coc-surface px-4 py-3 text-sm text-coc-muted hover:text-coc-text hover:border-coc-gold transition-colors"
        >
          <div className="flex items-center gap-2">
            <Gauge size={16} className="text-coc-gold" />
            <span>難易度試算を開く</span>
          </div>
          <span className="text-coc-gold">→</span>
        </Link>
      </div>
    </div>
  );
}
