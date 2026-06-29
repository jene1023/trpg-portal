export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  calcDamageBonus,
  calcBuild,
  calcMov,
  half,
  fifth,
} from "@/lib/coc-calc";
import PrintTrigger from "./PrintTrigger";

type Props = { params: Promise<{ id: string }> };

const STATS = [
  { key: "str" as const, label: "STR 筋力" },
  { key: "con" as const, label: "CON 体力" },
  { key: "pow" as const, label: "POW 精神力" },
  { key: "dex" as const, label: "DEX 敏捷性" },
  { key: "app" as const, label: "APP 外見" },
  { key: "siz" as const, label: "SIZ 体格" },
  { key: "int_stat" as const, label: "INT 知性" },
  { key: "edu" as const, label: "EDU 教育" },
];

const STATUS_LABEL: Record<string, string> = {
  alive: "生存",
  dead: "死亡",
  insane: "狂気",
  retired: "引退",
};

export default async function PrintPage({ params }: Props) {
  const { id } = await params;

  if (!isSupabaseConfigured) notFound();

  const { data: char } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .single();

  if (!char) notFound();

  const { data: skills } = await supabase
    .from("character_skills")
    .select("*")
    .eq("character_id", id)
    .order("skill_name", { ascending: true });

  const { data: items } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("character_id", id)
    .order("item_type", { ascending: true });

  const db = calcDamageBonus(char.str, char.siz);
  const build = calcBuild(char.str, char.siz);
  const mov = calcMov(char.str, char.dex, char.siz);

  const weapons = (items ?? []).filter((i) => i.item_type === "weapon");
  const otherItems = (items ?? []).filter((i) => i.item_type === "item");
  const occupationSkills = (skills ?? []).filter((s) => s.is_occupation);
  const otherSkills = (skills ?? []).filter((s) => !s.is_occupation);

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
        <span className="text-sm text-gray-600">印刷プレビュー — {char.name}</span>
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
            <h1 className="text-2xl font-bold">{char.name}</h1>
            <span className="text-base font-semibold border border-gray-600 px-2 py-0.5 rounded">
              {STATUS_LABEL[char.status] ?? char.status}
            </span>
          </div>
          <div className="flex gap-6 mt-1 text-xs text-gray-600">
            {char.occupation && <span>職業: {char.occupation}</span>}
            {char.age && <span>年齢: {char.age}歳</span>}
            {char.gender && <span>性別: {char.gender}</span>}
            {char.player_name && <span>PL: {char.player_name}</span>}
            {char.scenario_name && <span>シナリオ: {char.scenario_name}</span>}
          </div>
          {char.catchphrase && (
            <p className="mt-1 italic text-gray-500 text-xs">「{char.catchphrase}」</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* 能力値 */}
          <div>
            <h2 className="font-bold text-xs uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">
              能力値
            </h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">能力値</th>
                  <th className="border border-gray-300 px-2 py-1">値</th>
                  <th className="border border-gray-300 px-2 py-1">1/2</th>
                  <th className="border border-gray-300 px-2 py-1">1/5</th>
                </tr>
              </thead>
              <tbody>
                {STATS.map(({ key, label }) => {
                  const val = char[key] as number;
                  return (
                    <tr key={key}>
                      <td className="border border-gray-300 px-2 py-1">{label}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center font-bold">{val}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center text-gray-600">{half(val)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center text-gray-600">{fifth(val)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 派生ステータス */}
          <div>
            <h2 className="font-bold text-xs uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">
              派生ステータス
            </h2>
            <table className="w-full text-xs border-collapse mb-3">
              <tbody>
                {[
                  { label: "HP 耐久力", value: `${char.hp_current} / ${char.hp_max}` },
                  { label: "MP マジックポイント", value: `${char.mp_current} / ${char.mp_max}` },
                  { label: `SAN 正気度（初期 ${char.san_start}）`, value: `${char.san_current} / ${char.san_max}` },
                  { label: "幸運", value: char.luck },
                  { label: "ダメージボーナス", value: db },
                  { label: "ビルド", value: build },
                  { label: "移動力", value: mov },
                ].map(({ label, value }) => (
                  <tr key={label}>
                    <td className="border border-gray-300 px-2 py-1 text-gray-700">{label}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center font-bold">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 技能 */}
        {(skills ?? []).length > 0 && (
          <div className="mb-4">
            <h2 className="font-bold text-xs uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">
              技能
            </h2>
            <div className="grid grid-cols-2 gap-x-4">
              {/* 職業技能 */}
              {occupationSkills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">▶ 職業技能</p>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-1 text-left">技能名</th>
                        <th className="border border-gray-300 px-2 py-1">値</th>
                        <th className="border border-gray-300 px-2 py-1">1/2</th>
                        <th className="border border-gray-300 px-2 py-1">1/5</th>
                      </tr>
                    </thead>
                    <tbody>
                      {occupationSkills.map((s) => (
                        <tr key={s.id}>
                          <td className="border border-gray-300 px-2 py-1">{s.skill_name}</td>
                          <td className="border border-gray-300 px-2 py-1 text-center font-bold">{s.current_value}</td>
                          <td className="border border-gray-300 px-2 py-1 text-center text-gray-600">{half(s.current_value)}</td>
                          <td className="border border-gray-300 px-2 py-1 text-center text-gray-600">{fifth(s.current_value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* その他技能 */}
              {otherSkills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">▶ その他技能</p>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-1 text-left">技能名</th>
                        <th className="border border-gray-300 px-2 py-1">値</th>
                        <th className="border border-gray-300 px-2 py-1">1/2</th>
                        <th className="border border-gray-300 px-2 py-1">1/5</th>
                      </tr>
                    </thead>
                    <tbody>
                      {otherSkills.map((s) => (
                        <tr key={s.id}>
                          <td className="border border-gray-300 px-2 py-1">{s.skill_name}</td>
                          <td className="border border-gray-300 px-2 py-1 text-center font-bold">{s.current_value}</td>
                          <td className="border border-gray-300 px-2 py-1 text-center text-gray-600">{half(s.current_value)}</td>
                          <td className="border border-gray-300 px-2 py-1 text-center text-gray-600">{fifth(s.current_value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 武器 */}
        {weapons.length > 0 && (
          <div className="mb-4">
            <h2 className="font-bold text-xs uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">
              武器
            </h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">名前</th>
                  <th className="border border-gray-300 px-2 py-1">ダメージ</th>
                  <th className="border border-gray-300 px-2 py-1">射程</th>
                  <th className="border border-gray-300 px-2 py-1">装弾数</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">備考</th>
                </tr>
              </thead>
              <tbody>
                {weapons.map((w) => (
                  <tr key={w.id}>
                    <td className="border border-gray-300 px-2 py-1 font-semibold">{w.name}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{w.damage ?? "—"}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">{w.range ?? "—"}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      {w.ammo_current != null ? `${w.ammo_current}/${w.ammo_max ?? "?"}` : "—"}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">{w.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 所持品 */}
        {otherItems.length > 0 && (
          <div className="mb-4">
            <h2 className="font-bold text-xs uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">
              所持品
            </h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">アイテム名</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">備考</th>
                </tr>
              </thead>
              <tbody>
                {otherItems.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 px-2 py-1 font-semibold">{item.name}</td>
                    <td className="border border-gray-300 px-2 py-1">{item.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 背景・メモ */}
        {(char.background || char.notes) && (
          <div className="mb-2">
            <h2 className="font-bold text-xs uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">
              背景・メモ
            </h2>
            {char.background && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-600 mb-0.5">背景・経歴</p>
                <p className="text-xs whitespace-pre-wrap leading-relaxed">{char.background}</p>
              </div>
            )}
            {char.notes && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-0.5">メモ</p>
                <p className="text-xs whitespace-pre-wrap leading-relaxed">{char.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* フッター */}
        <div className="border-t border-gray-300 pt-2 mt-4 text-xs text-gray-400 text-right">
          CoC Portal — {char.name}
        </div>
      </div>
    </>
  );
}
