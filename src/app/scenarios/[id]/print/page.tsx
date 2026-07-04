export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { supabase, isSupabaseConfigured, ScenarioStatus } from "@/lib/supabase";
import PrintTrigger from "./PrintTrigger";

type Props = { params: Promise<{ id: string }> };

const STATUS_LABELS: Record<ScenarioStatus, string> = {
  planning: "準備中",
  ongoing: "進行中",
  completed: "完了",
};

const PLOT_STATUS_LABELS: Record<string, string> = {
  pending: "未解明",
  revealed: "解明済み",
  abandoned: "放棄",
};

export default async function ScenarioPrintPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("*")
    .eq("id", id)
    .single();

  if (!scenario) notFound();

  const [
    { data: participants },
    { data: handouts },
    { data: areas },
    { data: plotThreads },
    { data: npcs },
  ] = await Promise.all([
    supabase
      .from("scenario_participants")
      .select("*, characters(id, name, occupation, hp_current, hp_max, san_current, san_max)")
      .eq("scenario_id", id),
    supabase
      .from("handouts")
      .select("*")
      .eq("scenario_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("scenario_areas")
      .select("*")
      .eq("scenario_id", id)
      .order("order_index", { ascending: true }),
    supabase
      .from("plot_threads")
      .select("*")
      .eq("scenario_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("npcs")
      .select("*")
      .eq("scenario_name", scenario.title)
      .order("name", { ascending: true }),
  ]);

  return (
    <>
      <PrintTrigger />
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          @page { size: A4; margin: 15mm; }
        }
      `}</style>

      {/* 画面表示用コントロール */}
      <div className="no-print flex items-center justify-between px-6 py-3 bg-gray-100 border-b border-gray-300">
        <span className="text-sm text-gray-600">印刷プレビュー — {scenario.title}</span>
        <button
          onClick={() => window.print()}
          className="rounded bg-gray-800 px-4 py-1.5 text-sm text-white hover:bg-gray-700 transition-colors"
        >
          印刷 / PDF保存
        </button>
      </div>

      {/* 印刷コンテンツ */}
      <div
        className="mx-auto p-8 text-sm"
        style={{ maxWidth: "210mm", fontFamily: "serif", color: "#111", background: "#fff" }}
      >
        {/* ヘッダー */}
        <div className="border-b-2 border-gray-800 pb-3 mb-4">
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-bold">{scenario.title}</h1>
            <span className="text-base font-semibold border border-gray-600 px-2 py-0.5 rounded">
              {STATUS_LABELS[scenario.status as ScenarioStatus] ?? scenario.status}
            </span>
          </div>
          <div className="flex gap-6 mt-1 text-xs text-gray-600">
            {scenario.played_at && <span>プレイ日: {scenario.played_at}</span>}
            {scenario.next_session_at && (
              <span>次回予定: {new Date(scenario.next_session_at).toLocaleString("ja-JP", {
                year: "numeric", month: "numeric", day: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}</span>
            )}
          </div>
        </div>

        {/* 概要 */}
        {scenario.synopsis && (
          <div className="mb-4" style={{ breakInside: "avoid" }}>
            <h2 className="font-bold text-xs uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">
              概要
            </h2>
            <p className="text-xs whitespace-pre-wrap leading-relaxed">{scenario.synopsis}</p>
          </div>
        )}

        {/* GMメモ */}
        {scenario.gm_notes && (
          <div className="mb-4" style={{ breakInside: "avoid" }}>
            <h2 className="font-bold text-xs uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">
              GM メモ
            </h2>
            <p className="text-xs whitespace-pre-wrap leading-relaxed">{scenario.gm_notes}</p>
          </div>
        )}

        {/* 参加キャラクター */}
        {(participants ?? []).length > 0 && (
          <div className="mb-4" style={{ breakInside: "avoid" }}>
            <h2 className="font-bold text-xs uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">
              参加キャラクター
            </h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">名前</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">職業</th>
                  <th className="border border-gray-300 px-2 py-1">HP</th>
                  <th className="border border-gray-300 px-2 py-1">SAN</th>
                </tr>
              </thead>
              <tbody>
                {(participants ?? []).map((p) => {
                  const char = (p as { characters: { id: string; name: string; occupation: string | null; hp_current: number; hp_max: number; san_current: number; san_max: number } | null }).characters;
                  if (!char) return null;
                  return (
                    <tr key={p.id}>
                      <td className="border border-gray-300 px-2 py-1 font-semibold">{char.name}</td>
                      <td className="border border-gray-300 px-2 py-1">{char.occupation ?? "—"}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        {char.hp_current}/{char.hp_max}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        {char.san_current}/{char.san_max}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* NPC一覧 */}
        {(npcs ?? []).length > 0 && (
          <div className="mb-4" style={{ breakInside: "avoid" }}>
            <h2 className="font-bold text-xs uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">
              NPC一覧
            </h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">名前</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">外見</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">目的・役割</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">メモ</th>
                </tr>
              </thead>
              <tbody>
                {(npcs ?? []).map((npc) => (
                  <tr key={npc.id}>
                    <td className="border border-gray-300 px-2 py-1 font-semibold">{npc.name}</td>
                    <td className="border border-gray-300 px-2 py-1">{npc.appearance ?? "—"}</td>
                    <td className="border border-gray-300 px-2 py-1">{npc.purpose ?? "—"}</td>
                    <td className="border border-gray-300 px-2 py-1">{npc.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ハンドアウト一覧 */}
        {(handouts ?? []).length > 0 && (
          <div className="mb-4">
            <h2 className="font-bold text-xs uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">
              ハンドアウト
            </h2>
            {(handouts ?? []).map((h) => (
              <div key={h.id} className="mb-3 pl-2 border-l-2 border-gray-300" style={{ breakInside: "avoid" }}>
                <p className="font-semibold text-xs">
                  {h.title}
                  {h.is_secret && <span className="ml-2 text-gray-500">（秘匿）</span>}
                  {h.recipient_name && <span className="ml-2 text-gray-500">→ {h.recipient_name}</span>}
                  {h.is_distributed && <span className="ml-2 text-gray-500">（配布済み）</span>}
                </p>
                {h.content && (
                  <p className="text-xs mt-1 whitespace-pre-wrap leading-relaxed text-gray-700">{h.content}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* エリアメモ */}
        {(areas ?? []).length > 0 && (
          <div className="mb-4">
            <h2 className="font-bold text-xs uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">
              エリアメモ
            </h2>
            {(areas ?? []).map((area) => (
              <div key={area.id} className="mb-3 pl-2 border-l-2 border-gray-300" style={{ breakInside: "avoid" }}>
                <p className="font-semibold text-xs">{area.name}</p>
                {area.description && (
                  <p className="text-xs mt-0.5 whitespace-pre-wrap leading-relaxed text-gray-700">{area.description}</p>
                )}
                {area.gm_notes && (
                  <p className="text-xs mt-0.5 whitespace-pre-wrap leading-relaxed text-gray-500">
                    <span className="font-semibold">GMメモ: </span>{area.gm_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 謎・伏線 */}
        {(plotThreads ?? []).length > 0 && (
          <div className="mb-4" style={{ breakInside: "avoid" }}>
            <h2 className="font-bold text-xs uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">
              謎・伏線
            </h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">タイトル</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">説明</th>
                  <th className="border border-gray-300 px-2 py-1">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {(plotThreads ?? []).map((pt) => (
                  <tr key={pt.id}>
                    <td className="border border-gray-300 px-2 py-1 font-semibold">{pt.title}</td>
                    <td className="border border-gray-300 px-2 py-1">{pt.description ?? "—"}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      {PLOT_STATUS_LABELS[pt.status] ?? pt.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* フッター */}
        <div className="border-t border-gray-300 pt-2 mt-4 text-xs text-gray-400 text-right">
          CoC Portal — {scenario.title}
        </div>
      </div>
    </>
  );
}
