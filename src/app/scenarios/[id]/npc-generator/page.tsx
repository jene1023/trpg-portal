"use client";

import { useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Save, User, CheckCircle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { OCCUPATIONS } from "@/lib/occupationData";

type Props = { params: Promise<{ id: string }> };

// ---- データテーブル ----

const LAST_NAMES: { kanji: string; kana: string }[] = [
  { kanji: "佐藤", kana: "さとう" }, { kanji: "鈴木", kana: "すずき" },
  { kanji: "高橋", kana: "たかはし" }, { kanji: "田中", kana: "たなか" },
  { kanji: "伊藤", kana: "いとう" }, { kanji: "渡辺", kana: "わたなべ" },
  { kanji: "山本", kana: "やまもと" }, { kanji: "中村", kana: "なかむら" },
  { kanji: "小林", kana: "こばやし" }, { kanji: "加藤", kana: "かとう" },
  { kanji: "吉田", kana: "よしだ" }, { kanji: "山田", kana: "やまだ" },
  { kanji: "佐々木", kana: "ささき" }, { kanji: "松本", kana: "まつもと" },
  { kanji: "井上", kana: "いのうえ" }, { kanji: "木村", kana: "きむら" },
  { kanji: "林", kana: "はやし" }, { kanji: "斎藤", kana: "さいとう" },
  { kanji: "清水", kana: "しみず" }, { kanji: "山口", kana: "やまぐち" },
  { kanji: "阿部", kana: "あべ" }, { kanji: "池田", kana: "いけだ" },
  { kanji: "橋本", kana: "はしもと" }, { kanji: "山崎", kana: "やまざき" },
  { kanji: "石川", kana: "いしかわ" }, { kanji: "前田", kana: "まえだ" },
  { kanji: "藤田", kana: "ふじた" }, { kanji: "後藤", kana: "ごとう" },
  { kanji: "小川", kana: "おがわ" }, { kanji: "岡田", kana: "おかだ" },
  { kanji: "長谷川", kana: "はせがわ" }, { kanji: "村上", kana: "むらかみ" },
  { kanji: "近藤", kana: "こんどう" }, { kanji: "石井", kana: "いしい" },
  { kanji: "坂本", kana: "さかもと" }, { kanji: "遠藤", kana: "えんどう" },
  { kanji: "青木", kana: "あおき" }, { kanji: "藤井", kana: "ふじい" },
  { kanji: "西村", kana: "にしむら" }, { kanji: "福田", kana: "ふくだ" },
  { kanji: "太田", kana: "おおた" }, { kanji: "三浦", kana: "みうら" },
  { kanji: "岡本", kana: "おかもと" }, { kanji: "松田", kana: "まつだ" },
  { kanji: "中島", kana: "なかじま" }, { kanji: "原田", kana: "はらだ" },
  { kanji: "和田", kana: "わだ" }, { kanji: "中野", kana: "なかの" },
  { kanji: "原", kana: "はら" }, { kanji: "川口", kana: "かわぐち" },
];

const FIRST_NAMES_MALE: { kanji: string; kana: string }[] = [
  { kanji: "太郎", kana: "たろう" }, { kanji: "次郎", kana: "じろう" },
  { kanji: "健一", kana: "けんいち" }, { kanji: "誠", kana: "まこと" },
  { kanji: "浩二", kana: "こうじ" }, { kanji: "勇", kana: "いさむ" },
  { kanji: "守", kana: "まもる" }, { kanji: "明", kana: "あきら" },
  { kanji: "博", kana: "ひろし" }, { kanji: "隆", kana: "たかし" },
  { kanji: "翔", kana: "しょう" }, { kanji: "大輝", kana: "だいき" },
  { kanji: "優斗", kana: "ゆうと" }, { kanji: "蓮", kana: "れん" },
  { kanji: "陸", kana: "りく" }, { kanji: "颯", kana: "はやて" },
  { kanji: "拓也", kana: "たくや" }, { kanji: "慎吾", kana: "しんご" },
  { kanji: "雄太", kana: "ゆうた" }, { kanji: "祐介", kana: "ゆうすけ" },
  { kanji: "修", kana: "おさむ" }, { kanji: "剛", kana: "つよし" },
  { kanji: "和彦", kana: "かずひこ" }, { kanji: "純一", kana: "じゅんいち" },
  { kanji: "竜也", kana: "たつや" },
];

const FIRST_NAMES_FEMALE: { kanji: string; kana: string }[] = [
  { kanji: "花子", kana: "はなこ" }, { kanji: "美咲", kana: "みさき" },
  { kanji: "愛", kana: "あい" }, { kanji: "恵", kana: "めぐみ" },
  { kanji: "幸子", kana: "さちこ" }, { kanji: "裕子", kana: "ゆうこ" },
  { kanji: "智子", kana: "ともこ" }, { kanji: "由美", kana: "ゆみ" },
  { kanji: "陽子", kana: "ようこ" }, { kanji: "奈美", kana: "なみ" },
  { kanji: "葵", kana: "あおい" }, { kanji: "凛", kana: "りん" },
  { kanji: "桜", kana: "さくら" }, { kanji: "彩", kana: "あや" },
  { kanji: "瑠璃", kana: "るり" }, { kanji: "詩織", kana: "しおり" },
  { kanji: "千夏", kana: "ちなつ" }, { kanji: "菜々子", kana: "ななこ" },
  { kanji: "真由美", kana: "まゆみ" }, { kanji: "悠里", kana: "ゆうり" },
  { kanji: "明日香", kana: "あすか" }, { kanji: "麻衣", kana: "まい" },
  { kanji: "涼子", kana: "りょうこ" }, { kanji: "絵里", kana: "えり" },
  { kanji: "紗也香", kana: "さやか" },
];

const HAIR_COLORS = [
  "黒髪", "茶色の髪", "濃い茶色の髪", "灰色の髪", "白髪交じりの黒髪", "白髪",
  "明るい茶色の髪", "赤みがかった茶色の髪",
];

const EYE_COLORS = [
  "黒い目", "茶色の目", "深い茶色の目", "灰色の目", "緑がかった茶色の目", "濃い褐色の目",
];

const BUILDS = [
  "細身", "標準的な体格", "がっしりとした体格", "小柄", "大柄", "肥満気味", "筋肉質",
];

const SKILL_POOL = [
  "目星", "聞き耳", "図書館", "心理学", "説得", "回避", "隠密", "追跡",
  "鑑定", "交渉", "威圧", "変装", "運転（自動車）", "鍵開け", "機械修理",
  "電気修理", "応急手当", "医学", "法律", "歴史", "地理", "自然",
  "人類学", "オカルト", "クトゥルフ神話", "射撃（拳銃）", "格闘（こぶし）",
  "水泳", "跳躍", "登攀", "写真術", "芸術（演奏）", "芸術（絵画）",
  "外国語（英語）", "コンピューター", "経理", "農業",
];

// ---- ユーティリティ ----

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function roll3d6(): number {
  return (
    Math.floor(Math.random() * 6 + 1) +
    Math.floor(Math.random() * 6 + 1) +
    Math.floor(Math.random() * 6 + 1)
  );
}

function pickUnique<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

type GeneratedNpc = {
  lastName: { kanji: string; kana: string };
  firstName: { kanji: string; kana: string };
  gender: string;
  age: number;
  occupation: string;
  hairColor: string;
  eyeColor: string;
  build: string;
  skills: string[];
  str: number;
  con: number;
  pow: number;
  dex: number;
  app: number;
  siz: number;
  int_stat: number;
  edu: number;
  hp: number;
  mp: number;
};

function generateNpc(): GeneratedNpc {
  const gender = Math.random() < 0.5 ? "男性" : "女性";
  const firstName = pick(gender === "男性" ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE);
  const lastName = pick(LAST_NAMES);
  const age = Math.floor(Math.random() * 43) + 18; // 18–60

  const occupation = pick(OCCUPATIONS).name;
  const hairColor = pick(HAIR_COLORS);
  const eyeColor = pick(EYE_COLORS);
  const build = pick(BUILDS);
  const skills = pickUnique(SKILL_POOL, 3);

  const str = roll3d6() * 5;
  const con = roll3d6() * 5;
  const pow = roll3d6() * 5;
  const dex = roll3d6() * 5;
  const app = roll3d6() * 5;
  const siz = (Math.floor(Math.random() * 6 + 1) + Math.floor(Math.random() * 6 + 1) + 6) * 5;
  const int_stat = (Math.floor(Math.random() * 6 + 1) + Math.floor(Math.random() * 6 + 1) + 6) * 5;
  const edu = (Math.floor(Math.random() * 6 + 1) + Math.floor(Math.random() * 6 + 1) + 6) * 5;

  const hp = Math.floor((con + siz) / 10);
  const mp = Math.floor(pow / 5);

  return {
    lastName, firstName, gender, age, occupation,
    hairColor, eyeColor, build, skills,
    str, con, pow, dex, app, siz, int_stat, edu, hp, mp,
  };
}

// ---- コンポーネント ----

export default function NpcGeneratorPage({ params }: Props) {
  const { id: scenarioId } = use(params);

  const [npc, setNpc] = useState<GeneratedNpc>(() => generateNpc());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regenerate = useCallback(() => {
    setNpc(generateNpc());
    setSaved(false);
    setError(null);
  }, []);

  async function saveNpc() {
    if (!isSupabaseConfigured || saving) return;
    setSaving(true);
    setError(null);

    const fullName = `${npc.lastName.kanji}${npc.firstName.kanji}`;
    const appearance = `${npc.hairColor}、${npc.eyeColor}、${npc.build}`;
    const notes = `${npc.gender}、${npc.age}歳\n代表技能: ${npc.skills.join("、")}`;

    const { error: err } = await supabase.from("npcs").insert({
      scenario_name: scenarioId,
      name: fullName,
      appearance,
      notes,
      str: npc.str,
      con: npc.con,
      pow: npc.pow,
      dex: npc.dex,
      app: npc.app,
      siz: npc.siz,
      int_stat: npc.int_stat,
      edu: npc.edu,
      hp: npc.hp,
      mp: npc.mp,
    });

    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  const statEntries: { label: string; value: number }[] = [
    { label: "STR", value: npc.str },
    { label: "CON", value: npc.con },
    { label: "POW", value: npc.pow },
    { label: "DEX", value: npc.dex },
    { label: "APP", value: npc.app },
    { label: "SIZ", value: npc.siz },
    { label: "INT", value: npc.int_stat },
    { label: "EDU", value: npc.edu },
    { label: "HP", value: npc.hp },
    { label: "MP", value: npc.mp },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          シナリオに戻る
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <User size={22} className="text-coc-gold" />
        <div>
          <h1 className="font-cinzel text-xl font-bold text-coc-text">
            ランダムNPC生成
          </h1>
          <p className="text-xs text-coc-muted mt-0.5">
            即席のモブNPCをワンボタンで生成できます
          </p>
        </div>
      </div>

      {/* NPC カード */}
      <div className="rounded-xl border border-coc-border bg-coc-surface px-6 py-5 mb-5 space-y-5">
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-coc-muted mb-0.5">
              {npc.lastName.kana}　{npc.firstName.kana}
            </p>
            <p className="font-cinzel text-2xl font-bold text-coc-text">
              {npc.lastName.kanji}{npc.firstName.kanji}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block rounded-full border border-coc-gold-dim px-3 py-0.5 text-xs font-medium text-coc-gold">
              {npc.occupation}
            </span>
          </div>
        </div>

        {/* 基本情報 */}
        <div className="grid grid-cols-2 gap-3">
          <InfoRow label="性別" value={npc.gender} />
          <InfoRow label="年齢" value={`${npc.age}歳`} />
          <InfoRow label="髪" value={npc.hairColor} />
          <InfoRow label="目" value={npc.eyeColor} />
          <div className="col-span-2">
            <InfoRow label="体格" value={npc.build} />
          </div>
        </div>

        {/* 代表技能 */}
        <div>
          <p className="text-xs font-medium text-coc-muted mb-2">代表技能</p>
          <div className="flex flex-wrap gap-2">
            {npc.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-lg border border-coc-border bg-coc-raised px-3 py-1 text-xs text-coc-text"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* 能力値 */}
        <div>
          <p className="text-xs font-medium text-coc-muted mb-2">能力値（3D6×5）</p>
          <div className="grid grid-cols-5 gap-2">
            {statEntries.map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-lg border border-coc-border bg-coc-raised py-2"
              >
                <span className="text-xs font-cinzel font-bold text-coc-gold">{label}</span>
                <span className="text-base font-bold text-coc-text mt-0.5">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* エラー */}
      {error && (
        <p className="mb-4 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* アクションボタン */}
      <div className="flex gap-3">
        <button
          onClick={regenerate}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-coc-border py-3 text-sm font-medium text-coc-muted hover:border-coc-gold hover:text-coc-gold transition-colors"
        >
          <RefreshCw size={16} />
          再生成
        </button>

        {saved ? (
          <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-700 bg-green-900/20 py-3 text-sm font-medium text-green-400">
            <CheckCircle size={16} />
            保存済み
          </div>
        ) : (
          <button
            onClick={saveNpc}
            disabled={saving || !isSupabaseConfigured}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-coc-gold py-3 text-sm font-medium text-black hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {saving ? "保存中..." : "このNPCを保存"}
          </button>
        )}
      </div>

      {saved && (
        <p className="mt-3 text-center text-xs text-coc-muted">
          NPCを保存しました。
          <Link href={`/scenarios/${scenarioId}/npcs`} className="text-coc-gold hover:underline ml-1">
            NPCリストへ
          </Link>
        </p>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-xs text-coc-muted w-10">{label}</span>
      <span className="text-sm text-coc-text">{value}</span>
    </div>
  );
}
