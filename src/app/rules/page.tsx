"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

type Skill = {
  name: string;
  base: string;
  category: string;
};

// CoC 7版技能一覧
const SKILLS: Skill[] = [
  // 戦闘
  { name: "回避", base: "DEX×2", category: "戦闘" },
  { name: "キック", base: "25%", category: "戦闘" },
  { name: "組みつき", base: "25%", category: "戦闘" },
  { name: "こぶし", base: "25%", category: "戦闘" },
  { name: "頭突き", base: "10%", category: "戦闘" },
  { name: "ナイフ", base: "25%", category: "戦闘" },
  { name: "斧", base: "15%", category: "戦闘" },
  { name: "投擲", base: "20%", category: "戦闘" },
  { name: "射撃（ハンドガン）", base: "20%", category: "戦闘" },
  { name: "射撃（ライフル）", base: "25%", category: "戦闘" },
  { name: "射撃（散弾銃）", base: "25%", category: "戦闘" },
  { name: "射撃（サブマシンガン）", base: "15%", category: "戦闘" },
  // 対人
  { name: "言いくるめ", base: "5%", category: "対人" },
  { name: "信用", base: "15%", category: "対人" },
  { name: "説得", base: "10%", category: "対人" },
  { name: "心理学", base: "10%", category: "対人" },
  { name: "威圧", base: "15%", category: "対人" },
  { name: "変装", base: "5%", category: "対人" },
  { name: "魅惑", base: "APP×2", category: "対人" },
  // 探索
  { name: "目星", base: "25%", category: "探索" },
  { name: "聞き耳", base: "20%", category: "探索" },
  { name: "図書館", base: "20%", category: "探索" },
  { name: "追跡", base: "10%", category: "探索" },
  { name: "ナビゲート", base: "10%", category: "探索" },
  { name: "隠れる", base: "20%", category: "探索" },
  { name: "忍び歩き", base: "20%", category: "探索" },
  { name: "写真術", base: "5%", category: "探索" },
  // 身体
  { name: "水泳", base: "20%", category: "身体" },
  { name: "跳躍", base: "20%", category: "身体" },
  { name: "登攀", base: "20%", category: "身体" },
  { name: "乗馬", base: "5%", category: "身体" },
  // 運転
  { name: "運転（自動車）", base: "20%", category: "運転" },
  { name: "運転（船）", base: "1%", category: "運転" },
  { name: "運転（飛行機）", base: "1%", category: "運転" },
  { name: "操縦（重機械）", base: "1%", category: "運転" },
  // 知識
  { name: "応急手当", base: "30%", category: "知識" },
  { name: "医学", base: "1%", category: "知識" },
  { name: "精神分析", base: "1%", category: "知識" },
  { name: "薬学", base: "1%", category: "知識" },
  { name: "法律", base: "5%", category: "知識" },
  { name: "会計", base: "5%", category: "知識" },
  { name: "考古学", base: "1%", category: "知識" },
  { name: "歴史", base: "5%", category: "知識" },
  { name: "オカルト", base: "5%", category: "知識" },
  { name: "クトゥルフ神話", base: "0%", category: "知識" },
  { name: "人類学", base: "1%", category: "知識" },
  { name: "自然", base: "10%", category: "知識" },
  { name: "数学", base: "10%", category: "知識" },
  { name: "生物学", base: "1%", category: "知識" },
  { name: "地質学", base: "1%", category: "知識" },
  { name: "天文学", base: "1%", category: "知識" },
  { name: "物理学", base: "1%", category: "知識" },
  { name: "化学", base: "1%", category: "知識" },
  // 技術
  { name: "コンピューター", base: "5%", category: "技術" },
  { name: "電子工学", base: "1%", category: "技術" },
  { name: "機械修理", base: "10%", category: "技術" },
  { name: "電気修理", base: "10%", category: "技術" },
  { name: "爆発物", base: "1%", category: "技術" },
  { name: "手さばき", base: "10%", category: "技術" },
  { name: "鍵開け", base: "1%", category: "技術" },
  // 芸術・言語
  { name: "アート（特定分野）", base: "5%", category: "芸術・言語" },
  { name: "母国語", base: "EDU×5", category: "芸術・言語" },
  { name: "言語（他の言語）", base: "1%", category: "芸術・言語" },
];

const CATEGORIES = Array.from(new Set(SKILLS.map((s) => s.category)));

// CoC 6版技能一覧（技能基本値が7版と異なる）
const SKILLS_6TH: Skill[] = [
  // 戦闘
  { name: "回避",                   base: "DEX×2",  category: "戦闘" },
  { name: "こぶし（パンチ）",         base: "50%",    category: "戦闘" },
  { name: "キック",                   base: "25%",    category: "戦闘" },
  { name: "組みつき",                  base: "25%",    category: "戦闘" },
  { name: "頭突き",                   base: "10%",    category: "戦闘" },
  { name: "ナイフ",                   base: "25%",    category: "戦闘" },
  { name: "斧",                      base: "15%",    category: "戦闘" },
  { name: "投擲",                    base: "25%",    category: "戦闘" },
  { name: "拳銃",                    base: "20%",    category: "戦闘" },
  { name: "ライフル",                 base: "25%",    category: "戦闘" },
  { name: "散弾銃",                   base: "25%",    category: "戦闘" },
  { name: "サブマシンガン",            base: "15%",    category: "戦闘" },
  // 対人
  { name: "話術（言いくるめ）",        base: "5%",     category: "対人" },
  { name: "信用",                    base: "15%",    category: "対人" },
  { name: "説得",                    base: "15%",    category: "対人" },
  { name: "心理学",                   base: "5%",     category: "対人" },
  { name: "威圧",                    base: "15%",    category: "対人" },
  { name: "変装",                    base: "1%",     category: "対人" },
  { name: "魅惑",                    base: "15%",    category: "対人" },
  // 探索
  { name: "目星",                    base: "25%",    category: "探索" },
  { name: "聞き耳",                   base: "25%",    category: "探索" },
  { name: "図書館",                   base: "25%",    category: "探索" },
  { name: "追跡",                    base: "10%",    category: "探索" },
  { name: "ナビゲート",               base: "10%",    category: "探索" },
  { name: "隠れる",                   base: "10%",    category: "探索" },
  { name: "忍び歩き",                 base: "10%",    category: "探索" },
  { name: "写真術",                   base: "10%",    category: "探索" },
  // 身体
  { name: "水泳",                    base: "25%",    category: "身体" },
  { name: "跳躍",                    base: "25%",    category: "身体" },
  { name: "登攀",                    base: "40%",    category: "身体" },
  { name: "乗馬",                    base: "5%",     category: "身体" },
  // 運転
  { name: "運転（自動車）",           base: "20%",    category: "運転" },
  { name: "運転（船）",              base: "1%",     category: "運転" },
  { name: "運転（飛行機）",           base: "1%",     category: "運転" },
  { name: "操縦（重機械）",           base: "1%",     category: "運転" },
  // 知識
  { name: "応急手当",                 base: "30%",    category: "知識" },
  { name: "医学",                    base: "5%",     category: "知識" },
  { name: "精神分析",                 base: "1%",     category: "知識" },
  { name: "薬学",                    base: "1%",     category: "知識" },
  { name: "法律",                    base: "5%",     category: "知識" },
  { name: "会計",                    base: "10%",    category: "知識" },
  { name: "考古学",                   base: "1%",     category: "知識" },
  { name: "歴史",                    base: "20%",    category: "知識" },
  { name: "オカルト",                 base: "5%",     category: "知識" },
  { name: "クトゥルフ神話",           base: "0%",     category: "知識" },
  { name: "人類学",                   base: "1%",     category: "知識" },
  { name: "自然",                    base: "10%",    category: "知識" },
  { name: "数学",                    base: "10%",    category: "知識" },
  { name: "生物学",                   base: "1%",     category: "知識" },
  { name: "地質学",                   base: "1%",     category: "知識" },
  { name: "天文学",                   base: "1%",     category: "知識" },
  { name: "物理学",                   base: "1%",     category: "知識" },
  { name: "化学",                    base: "1%",     category: "知識" },
  // 技術
  { name: "電子工学",                 base: "1%",     category: "技術" },
  { name: "機械修理",                 base: "20%",    category: "技術" },
  { name: "電気修理",                 base: "10%",    category: "技術" },
  { name: "爆発物",                   base: "1%",     category: "技術" },
  { name: "手さばき",                 base: "10%",    category: "技術" },
  { name: "鍵開け",                   base: "1%",     category: "技術" },
  // 芸術・言語
  { name: "アート（特定分野）",        base: "5%",     category: "芸術・言語" },
  { name: "母国語",                   base: "EDU×5",  category: "芸術・言語" },
  { name: "言語（他の言語）",         base: "1%",     category: "芸術・言語" },
];

const CATEGORIES_6TH = Array.from(new Set(SKILLS_6TH.map((s) => s.category)));

type RuleSection = {
  title: string;
  content: ReactNode;
};

const RULES: RuleSection[] = [
  {
    title: "通常判定",
    content: (
      <div className="space-y-3 text-sm text-coc-muted font-crimson leading-relaxed">
        <p>
          技能値（または能力値×倍数）を目標値として1d100を振る。
          出た目が<span className="text-coc-text font-semibold">目標値以下</span>なら成功。
        </p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-coc-border">
              <th className="text-left py-1.5 pr-4 text-coc-muted font-medium">成功度</th>
              <th className="text-left py-1.5 text-coc-muted font-medium">条件</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coc-border/50">
            <tr>
              <td className="py-1.5 pr-4 text-yellow-400 font-semibold">決定的成功</td>
              <td className="py-1.5 text-coc-muted">出目 ≦ 技能値 ÷ 5（端数切り捨て）</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 text-green-400 font-semibold">通常成功</td>
              <td className="py-1.5 text-coc-muted">出目 ≦ 技能値</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 text-coc-muted font-semibold">失敗</td>
              <td className="py-1.5 text-coc-muted">通常成功・決定的成功・致命的失敗のいずれでもない</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 text-red-400 font-semibold">致命的失敗</td>
              <td className="py-1.5 text-coc-muted">
                技能値 &lt; 50 のとき: 出目 96〜100<br />
                技能値 ≧ 50 のとき: 出目 = 100
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    title: "プッシュ判定",
    content: (
      <div className="space-y-3 text-sm text-coc-muted font-crimson leading-relaxed">
        <p>
          通常判定に失敗したとき、KPの許可を得て<span className="text-coc-text font-semibold">もう一度だけ</span>同じ判定を行える。
          ただし失敗した場合は元の失敗より深刻な結果（負傷・物の損壊・状況悪化など）が発生する。
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>致命的失敗が出た場合はプッシュ不可</li>
          <li>すでに失敗が確定している技能（クトゥルフ神話など）はプッシュ不可</li>
          <li>プッシュで致命的失敗が出た場合、最悪の結果をもたらす</li>
        </ul>
      </div>
    ),
  },
  {
    title: "対抗判定",
    content: (
      <div className="space-y-3 text-sm text-coc-muted font-crimson leading-relaxed">
        <p>
          2人以上のキャラクターが競い合う場面で使う。両者が同じ技能（または対応する技能）を判定し、
          成功度が高い方が勝利する。
        </p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-coc-border">
              <th className="text-left py-1.5 pr-4 text-coc-muted font-medium">優先度（高→低）</th>
              <th className="text-left py-1.5 text-coc-muted font-medium">成功度</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coc-border/50">
            {["決定的成功", "通常成功", "失敗", "致命的失敗"].map((d, i) => (
              <tr key={d}>
                <td className="py-1.5 pr-4 text-coc-text font-semibold">{i + 1}</td>
                <td className={`py-1.5 font-semibold ${
                  d === "決定的成功" ? "text-yellow-400" :
                  d === "通常成功" ? "text-green-400" :
                  d === "失敗" ? "text-coc-muted" : "text-red-400"
                }`}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs">
          同じ成功度の場合は引き分けとなり、KPが状況を判断する。
          または互いに高い技能値を持つ者が有利とする変形ルールも使われる。
        </p>
      </div>
    ),
  },
  {
    title: "SANチェック",
    content: (
      <div className="space-y-3 text-sm text-coc-muted font-crimson leading-relaxed">
        <p>
          恐ろしいものや禁断の知識に触れたとき、KPは<span className="text-coc-text font-semibold">SANチェック</span>を要求する。
          現在SAN値を目標値として1d100を振る。
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>成功: 最小のSAN喪失（例：0または1）</li>
          <li>失敗: より大きなSAN喪失（例：1d6 や 1d10）</li>
          <li>SAN値が0になると永久狂気に陥る</li>
          <li>1セッションで5以上のSANを失うと一時的狂気（1d10×10分）</li>
          <li>1セッションで20%以上のSANを失うと不定狂気（1d10週間）</li>
        </ul>
        <p className="text-xs">
          SAN値の上限は「99 - クトゥルフ神話技能値」となる。
          クトゥルフ神話の知識を深めるほど正気の上限が下がる。
        </p>
      </div>
    ),
  },
];

const RULES_6TH: RuleSection[] = [
  {
    title: "通常判定",
    content: (
      <div className="space-y-3 text-sm text-coc-muted font-crimson leading-relaxed">
        <p>
          技能値（または能力値×倍数）を目標値として1d100を振る。
          出た目が<span className="text-coc-text font-semibold">目標値以下</span>なら成功。
        </p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-coc-border">
              <th className="text-left py-1.5 pr-4 text-coc-muted font-medium">成功度</th>
              <th className="text-left py-1.5 text-coc-muted font-medium">条件</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coc-border/50">
            <tr>
              <td className="py-1.5 pr-4 text-green-400 font-semibold">通常成功</td>
              <td className="py-1.5 text-coc-muted">出目 ≦ 技能値</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 text-coc-muted font-semibold">失敗</td>
              <td className="py-1.5 text-coc-muted">出目 ＞ 技能値（ファンブルを除く）</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 text-red-400 font-semibold">ファンブル</td>
              <td className="py-1.5 text-coc-muted">出目 96〜100（技能値に関わらず）</td>
            </tr>
          </tbody>
        </table>
        <p className="text-xs">
          ※ 6版には「決定的成功（クリティカル）」の概念はなく、成功度は「成功／失敗／ファンブル」の3種。
        </p>
      </div>
    ),
  },
  {
    title: "プッシュ判定",
    content: (
      <div className="space-y-3 text-sm text-coc-muted font-crimson leading-relaxed">
        <p>
          通常判定に失敗したとき、KPの許可を得て<span className="text-coc-text font-semibold">もう一度だけ</span>同じ判定を行える。
          ただし失敗した場合は元の失敗より深刻な結果（負傷・物の損壊・状況悪化など）が発生する。
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>ファンブルが出た場合はプッシュ不可</li>
          <li>プッシュでファンブルが出た場合、最悪の結果をもたらす</li>
        </ul>
      </div>
    ),
  },
  {
    title: "対抗判定",
    content: (
      <div className="space-y-3 text-sm text-coc-muted font-crimson leading-relaxed">
        <p>
          2人以上のキャラクターが競い合う場面で使う。両者が同じ技能（または対応する技能）を判定し、
          成功した側が勝利する。双方が成功した場合は技能値が高い方が勝利。
        </p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-coc-border">
              <th className="text-left py-1.5 pr-4 text-coc-muted font-medium">優先度</th>
              <th className="text-left py-1.5 text-coc-muted font-medium">成功度</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coc-border/50">
            {["通常成功", "失敗", "ファンブル"].map((d, i) => (
              <tr key={d}>
                <td className="py-1.5 pr-4 text-coc-text font-semibold">{i + 1}</td>
                <td className={`py-1.5 font-semibold ${
                  d === "通常成功" ? "text-green-400" :
                  d === "失敗" ? "text-coc-muted" : "text-red-400"
                }`}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    title: "SANチェック",
    content: (
      <div className="space-y-3 text-sm text-coc-muted font-crimson leading-relaxed">
        <p>
          恐ろしいものや禁断の知識に触れたとき、KPは<span className="text-coc-text font-semibold">SANチェック</span>を要求する。
          現在SAN値を目標値として1d100を振る。
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>成功: 最小のSAN喪失（例：0または1）</li>
          <li>失敗: より大きなSAN喪失（例：1d6 や 1d10）</li>
          <li>SAN値が0になると永久狂気に陥る</li>
          <li>1回で5以上のSANを失うと一時的狂気</li>
        </ul>
        <p className="text-xs">
          SAN値の上限は「99 - クトゥルフ神話技能値」となる。
        </p>
      </div>
    ),
  },
  {
    title: "技能ポイント（6版）",
    content: (
      <div className="space-y-3 text-sm text-coc-muted font-crimson leading-relaxed">
        <p>キャラクター作成時に以下のポイントを技能に割り振る。</p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-coc-border">
              <th className="text-left py-1.5 pr-4 text-coc-muted font-medium">種別</th>
              <th className="text-left py-1.5 text-coc-muted font-medium">計算式</th>
              <th className="text-left py-1.5 text-coc-muted font-medium">例（EDU/INT=50）</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coc-border/50">
            <tr>
              <td className="py-1.5 pr-4 text-coc-text font-semibold">職業技能ポイント</td>
              <td className="py-1.5 text-coc-muted">EDU × 20</td>
              <td className="py-1.5 text-coc-muted">50 × 20 = 1000</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 text-coc-text font-semibold">趣味技能ポイント</td>
              <td className="py-1.5 text-coc-muted">INT × 10</td>
              <td className="py-1.5 text-coc-muted">50 × 10 = 500</td>
            </tr>
          </tbody>
        </table>
        <p className="text-xs">
          職業技能ポイントは選んだ職業に定められた技能に、趣味ポイントは任意の技能に振れる。
          1つの技能の最大値は通常90%まで（特殊技能を除く）。
        </p>
      </div>
    ),
  },
];

function Accordion({ section }: { section: RuleSection }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-coc-border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-coc-surface hover:bg-coc-raised transition-colors text-left"
      >
        <span className="font-cinzel text-sm font-semibold text-coc-text">{section.title}</span>
        {open ? (
          <ChevronUp size={16} className="text-coc-muted shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-coc-muted shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 py-4 bg-coc-raised border-t border-coc-border">
          {section.content}
        </div>
      )}
    </div>
  );
}

export default function RulesPage() {
  const [edition, setEdition] = useState<"7th" | "6th">("7th");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("すべて");

  const activeSkills = edition === "7th" ? SKILLS : SKILLS_6TH;
  const activeCategories = edition === "7th" ? CATEGORIES : CATEGORIES_6TH;
  const activeRules = edition === "7th" ? RULES : RULES_6TH;

  const filtered = activeSkills.filter((s) => {
    const matchesQuery = s.name.includes(query);
    const matchesCategory =
      selectedCategory === "すべて" || s.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  // カテゴリが切り替わったときにフィルタをリセット
  function handleEditionChange(ed: "7th" | "6th") {
    setEdition(ed);
    setSelectedCategory("すべて");
    setQuery("");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">
      <div>
        <h1 className="font-cinzel text-2xl font-bold text-coc-text mb-1">
          ルールリファレンス
        </h1>
        <p className="font-crimson text-coc-muted italic text-sm">
          技能一覧と判定ルール早見表
        </p>
      </div>

      {/* エディションタブ */}
      <div className="flex gap-1 rounded-lg border border-coc-border bg-coc-surface p-1 w-fit">
        {(["7th", "6th"] as const).map((ed) => (
          <button
            key={ed}
            onClick={() => handleEditionChange(ed)}
            className={`px-4 py-1.5 rounded-md text-sm font-cinzel font-semibold transition-colors ${
              edition === ed
                ? "bg-coc-gold-dim border border-coc-gold text-coc-gold"
                : "text-coc-muted hover:text-coc-text"
            }`}
          >
            CoC {ed}
          </button>
        ))}
      </div>

      {/* 判定ルール */}
      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          判定ルール
        </h2>
        <div className="space-y-2">
          {activeRules.map((rule) => (
            <Accordion key={rule.title} section={rule} />
          ))}
        </div>
      </section>

      {/* 技能一覧 */}
      <section className="space-y-4">
        <h2 className="font-cinzel text-sm font-bold text-coc-gold uppercase tracking-widest">
          技能一覧（CoC {edition}）
        </h2>

        {/* 検索・フィルタ */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-coc-muted pointer-events-none" />
            <input
              type="text"
              placeholder="技能名で検索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm focus:outline-none focus:border-coc-gold placeholder:text-coc-faint"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border border-coc-border bg-coc-raised text-coc-text text-sm px-2 py-1.5 focus:outline-none focus:border-coc-gold"
          >
            <option value="すべて">すべてのカテゴリ</option>
            {activeCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* テーブル */}
        <div className="rounded-lg border border-coc-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-coc-surface border-b border-coc-border">
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">技能名</th>
                <th className="text-left px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">カテゴリ</th>
                <th className="text-right px-4 py-2.5 font-cinzel text-xs text-coc-muted uppercase tracking-wider">基本値</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coc-border/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-coc-faint font-crimson italic text-sm">
                    該当する技能が見つかりません
                  </td>
                </tr>
              ) : (
                filtered.map((skill) => (
                  <tr key={skill.name} className="bg-coc-raised hover:bg-coc-surface transition-colors">
                    <td className="px-4 py-2.5 text-coc-text font-medium">{skill.name}</td>
                    <td className="px-4 py-2.5 text-coc-muted text-xs">{skill.category}</td>
                    <td className="px-4 py-2.5 text-right font-cinzel text-coc-gold text-xs font-semibold">{skill.base}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-coc-faint font-crimson text-right">
          全 {activeSkills.length} 技能 — フィルタ中: {filtered.length}件
        </p>
      </section>
    </div>
  );
}
