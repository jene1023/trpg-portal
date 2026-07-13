// CoC 7th/6th edition rule reference data

export type Edition = "7th" | "6th";

// ─── 能力値 ───────────────────────────────────────────────
export type AbilityInfo = {
  key: string;
  name: string;
  desc: string;
  roll: string;
  derived?: string;
};

export const ABILITIES: AbilityInfo[] = [
  { key: "STR", name: "筋力 (STR)", desc: "肉体的な強さ。近接攻撃ダメージに影響する。", roll: "3D6×5", derived: "ダメージボーナス表を参照" },
  { key: "CON", name: "体力 (CON)", desc: "肉体的な耐久力。HP・MPの算出に使う。", roll: "3D6×5", derived: "HP = (CON+SIZ)÷10（端数切上）" },
  { key: "POW", name: "精神力 (POW)", desc: "意志力と魔力。MP・SAN初期値に影響する。", roll: "3D6×5", derived: "MP = POW÷5、SAN初期値 = POW×5" },
  { key: "DEX", name: "敏捷性 (DEX)", desc: "素早さと手先の器用さ。行動順・回避基本値に影響。", roll: "3D6×5", derived: "回避基本値 = DEX×2" },
  { key: "APP", name: "外見 (APP)", desc: "見た目の印象。魅惑技能基本値に影響する。", roll: "3D6×5", derived: "魅惑基本値 = APP×2" },
  { key: "SIZ", name: "体格 (SIZ)", desc: "身体の大きさと体重。HP・ダメージボーナスに影響。", roll: "(2D6+6)×5", derived: "HP = (CON+SIZ)÷10（端数切上）" },
  { key: "INT", name: "知性 (INT)", desc: "思考力と記憶力。アイデアロールに使う。", roll: "(2D6+6)×5", derived: "アイデアロール = INT×5、趣味技能P = INT×2(7th)" },
  { key: "EDU", name: "教育 (EDU)", desc: "学歴と知識量。知識ロールと職業技能ポイントに使う。", roll: "(2D6+6)×5", derived: "知識ロール = EDU×5、職業技能P = EDU×4(7th)" },
];

// ─── ダメージボーナス表 ──────────────────────────────────
export type DamageBonusRow = {
  range: string;
  db: string;
  build: string;
};

export const DAMAGE_BONUS_TABLE_7TH: DamageBonusRow[] = [
  { range: "2〜64", db: "-2", build: "-2" },
  { range: "65〜84", db: "-1", build: "-1" },
  { range: "85〜124", db: "なし", build: "0" },
  { range: "125〜164", db: "+1D4", build: "+1" },
  { range: "165〜204", db: "+1D6", build: "+2" },
  { range: "205〜284", db: "+2D6", build: "+3" },
  { range: "285〜364", db: "+3D6", build: "+4" },
  { range: "365〜444", db: "+4D6", build: "+5" },
  { range: "445〜524", db: "+5D6", build: "+6" },
];

export const DAMAGE_BONUS_TABLE_6TH: DamageBonusRow[] = [
  { range: "2〜12", db: "-1D6", build: "—" },
  { range: "13〜16", db: "-1D4", build: "—" },
  { range: "17〜24", db: "なし", build: "—" },
  { range: "25〜32", db: "+1D4", build: "—" },
  { range: "33〜40", db: "+1D6", build: "—" },
  { range: "41〜56", db: "+2D6", build: "—" },
  { range: "57〜72", db: "+3D6", build: "—" },
  { range: "73〜88", db: "+4D6", build: "—" },
  { range: "89〜104", db: "+5D6", build: "—" },
];

// ─── 技能 ────────────────────────────────────────────────
export type Skill = {
  name: string;
  base: string;
  category: string;
};

export const SKILLS_7TH: Skill[] = [
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
  { name: "言いくるめ", base: "5%", category: "対人" },
  { name: "信用", base: "15%", category: "対人" },
  { name: "説得", base: "10%", category: "対人" },
  { name: "心理学", base: "10%", category: "対人" },
  { name: "威圧", base: "15%", category: "対人" },
  { name: "変装", base: "5%", category: "対人" },
  { name: "魅惑", base: "APP×2", category: "対人" },
  { name: "目星", base: "25%", category: "探索" },
  { name: "聞き耳", base: "20%", category: "探索" },
  { name: "図書館", base: "20%", category: "探索" },
  { name: "追跡", base: "10%", category: "探索" },
  { name: "ナビゲート", base: "10%", category: "探索" },
  { name: "隠れる", base: "20%", category: "探索" },
  { name: "忍び歩き", base: "20%", category: "探索" },
  { name: "写真術", base: "5%", category: "探索" },
  { name: "水泳", base: "20%", category: "身体" },
  { name: "跳躍", base: "20%", category: "身体" },
  { name: "登攀", base: "20%", category: "身体" },
  { name: "乗馬", base: "5%", category: "身体" },
  { name: "運転（自動車）", base: "20%", category: "運転" },
  { name: "運転（船）", base: "1%", category: "運転" },
  { name: "運転（飛行機）", base: "1%", category: "運転" },
  { name: "操縦（重機械）", base: "1%", category: "運転" },
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
  { name: "コンピューター", base: "5%", category: "技術" },
  { name: "電子工学", base: "1%", category: "技術" },
  { name: "機械修理", base: "10%", category: "技術" },
  { name: "電気修理", base: "10%", category: "技術" },
  { name: "爆発物", base: "1%", category: "技術" },
  { name: "手さばき", base: "10%", category: "技術" },
  { name: "鍵開け", base: "1%", category: "技術" },
  { name: "アート（特定分野）", base: "5%", category: "芸術・言語" },
  { name: "母国語", base: "EDU×5", category: "芸術・言語" },
  { name: "言語（他の言語）", base: "1%", category: "芸術・言語" },
];

export const SKILLS_6TH: Skill[] = [
  { name: "回避", base: "DEX×2", category: "戦闘" },
  { name: "こぶし（パンチ）", base: "50%", category: "戦闘" },
  { name: "キック", base: "25%", category: "戦闘" },
  { name: "組みつき", base: "25%", category: "戦闘" },
  { name: "頭突き", base: "10%", category: "戦闘" },
  { name: "ナイフ", base: "25%", category: "戦闘" },
  { name: "斧", base: "15%", category: "戦闘" },
  { name: "投擲", base: "25%", category: "戦闘" },
  { name: "拳銃", base: "20%", category: "戦闘" },
  { name: "ライフル", base: "25%", category: "戦闘" },
  { name: "散弾銃", base: "25%", category: "戦闘" },
  { name: "サブマシンガン", base: "15%", category: "戦闘" },
  { name: "話術（言いくるめ）", base: "5%", category: "対人" },
  { name: "信用", base: "15%", category: "対人" },
  { name: "説得", base: "15%", category: "対人" },
  { name: "心理学", base: "5%", category: "対人" },
  { name: "威圧", base: "15%", category: "対人" },
  { name: "変装", base: "1%", category: "対人" },
  { name: "魅惑", base: "15%", category: "対人" },
  { name: "目星", base: "25%", category: "探索" },
  { name: "聞き耳", base: "25%", category: "探索" },
  { name: "図書館", base: "25%", category: "探索" },
  { name: "追跡", base: "10%", category: "探索" },
  { name: "ナビゲート", base: "10%", category: "探索" },
  { name: "隠れる", base: "10%", category: "探索" },
  { name: "忍び歩き", base: "10%", category: "探索" },
  { name: "写真術", base: "10%", category: "探索" },
  { name: "水泳", base: "25%", category: "身体" },
  { name: "跳躍", base: "25%", category: "身体" },
  { name: "登攀", base: "40%", category: "身体" },
  { name: "乗馬", base: "5%", category: "身体" },
  { name: "運転（自動車）", base: "20%", category: "運転" },
  { name: "運転（船）", base: "1%", category: "運転" },
  { name: "運転（飛行機）", base: "1%", category: "運転" },
  { name: "操縦（重機械）", base: "1%", category: "運転" },
  { name: "応急手当", base: "30%", category: "知識" },
  { name: "医学", base: "5%", category: "知識" },
  { name: "精神分析", base: "1%", category: "知識" },
  { name: "薬学", base: "1%", category: "知識" },
  { name: "法律", base: "5%", category: "知識" },
  { name: "会計", base: "10%", category: "知識" },
  { name: "考古学", base: "1%", category: "知識" },
  { name: "歴史", base: "20%", category: "知識" },
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
  { name: "電子工学", base: "1%", category: "技術" },
  { name: "機械修理", base: "20%", category: "技術" },
  { name: "電気修理", base: "10%", category: "技術" },
  { name: "爆発物", base: "1%", category: "技術" },
  { name: "手さばき", base: "10%", category: "技術" },
  { name: "鍵開け", base: "1%", category: "技術" },
  { name: "アート（特定分野）", base: "5%", category: "芸術・言語" },
  { name: "母国語", base: "EDU×5", category: "芸術・言語" },
  { name: "言語（他の言語）", base: "1%", category: "芸術・言語" },
];

// ─── 戦闘アクション ──────────────────────────────────────
export type CombatAction = {
  name: string;
  desc: string;
  notes?: string;
};

export const COMBAT_ACTIONS: CombatAction[] = [
  {
    name: "通常攻撃",
    desc: "武器または格闘技能でロールし、成功すれば相手にダメージを与える。",
    notes: "決定的成功でダメージが最大値になる（7版）",
  },
  {
    name: "回避",
    desc: "攻撃を受けたとき、回避技能でロールして攻撃を無効化する。",
    notes: "成功しても次の自分のターンの行動は消費される",
  },
  {
    name: "受け流し",
    desc: "武器・盾などで攻撃を受け止め、ダメージを軽減または無効化する。",
    notes: "近接攻撃のみ有効。使用武器の強度以下のダメージを無効化。",
  },
  {
    name: "組みつき",
    desc: "相手をつかまえ、動きを封じる。成功すれば相手は行動に制限がかかる。",
    notes: "対抗判定（双方STR+SIZ）で勝った方が優位",
  },
  {
    name: "武装解除",
    desc: "相手の武器を奪うか叩き落とす。格闘技能で判定。",
    notes: "決定的成功が必要な場合もある（KP裁量）",
  },
  {
    name: "連射（7版）",
    desc: "自動火器で1ターンに複数回攻撃する。弾薬を多く消費し、過熱に注意。",
    notes: "ロールが必要、消費弾薬によってペナルティあり",
  },
  {
    name: "追い詰め",
    desc: "相手に近づき、次ターンの攻撃にボーナスダイスを得る。",
    notes: "KP裁量による",
  },
  {
    name: "逃走",
    desc: "戦闘から離脱する。追手がいる場合はDEX対抗判定になる場合がある。",
    notes: "7版では走る（Run）として扱うことが多い",
  },
];

// ─── 近接攻撃の順番 ─────────────────────────────────────
export type CombatOrder = {
  label: string;
  desc: string;
};

export const COMBAT_ORDER: CombatOrder[] = [
  { label: "先制判定", desc: "DEX値が高い側が先に行動する。同値の場合はDEXロール（DEX×5）で先制を決める。" },
  { label: "宣言フェーズ", desc: "ラウンド開始時に全員が行動を宣言する。KPが適宜管理。" },
  { label: "行動フェーズ", desc: "DEX順に行動を解決する。攻撃・回避・その他を実行。" },
  { label: "ラウンド終了", desc: "一時的状態（スタンなど）を更新し、次ラウンドへ。" },
];

// ─── 正気度喪失 ──────────────────────────────────────────
export type SanLossEntry = {
  trigger: string;
  success: string;
  failure: string;
  category: string;
};

export const SAN_LOSS_TABLE: SanLossEntry[] = [
  // 怪物・存在
  { category: "怪物・存在", trigger: "深きものの眷属を初めて見る", success: "0", failure: "1D6" },
  { category: "怪物・存在", trigger: "ショゴスを見る", success: "1D6", failure: "1D20" },
  { category: "怪物・存在", trigger: "クトゥルフの姿を見る", success: "1D10", failure: "1D100" },
  { category: "怪物・存在", trigger: "ミ＝ゴを見る", success: "0/1D6", failure: "1D6/2D6" },
  { category: "怪物・存在", trigger: "無形の存在に触れる", success: "1", failure: "1D6" },
  { category: "怪物・存在", trigger: "死体（人間）を見る", success: "0", failure: "1" },
  { category: "怪物・存在", trigger: "損壊した死体を見る", success: "0/1", failure: "1D6" },
  // 呪文・魔法
  { category: "呪文・魔法", trigger: "はじめて魔法を目撃する", success: "0", failure: "1D6" },
  { category: "呪文・魔法", trigger: "異次元の光景を垣間見る", success: "1D3", failure: "1D10" },
  { category: "呪文・魔法", trigger: "クトゥルフ神話の呪文を唱える", success: "0", failure: "1D6" },
  // 状況・環境
  { category: "状況・環境", trigger: "仲間が目の前で死ぬ", success: "0", failure: "1D6" },
  { category: "状況・環境", trigger: "人を殺す（はじめて）", success: "0", failure: "1D4" },
  { category: "状況・環境", trigger: "人を殺す（以降）", success: "0", failure: "1" },
  { category: "状況・環境", trigger: "拷問を受ける", success: "0", failure: "1D6" },
  { category: "状況・環境", trigger: "禁断の書物を読む", success: "1D3", failure: "2D6" },
];

// ─── 狂気の種類 ──────────────────────────────────────────
export type MadnessType = {
  type: string;
  trigger: string;
  duration: string;
  effect: string;
};

export const MADNESS_TYPES: MadnessType[] = [
  {
    type: "一時的狂気",
    trigger: "1セッション中に5点以上のSANを喪失",
    duration: "1D10×10分（7版） / 1D10分（6版）",
    effect: "KPが症状を決定。フォビア・マニア・解離など。",
  },
  {
    type: "不定狂気",
    trigger: "1セッション中に最大SAN値の20%以上を喪失",
    duration: "1D10週間（7版）",
    effect: "KPが症状を決定。長期的なペナルティが発生する可能性。",
  },
  {
    type: "永久狂気",
    trigger: "SAN値が0になる",
    duration: "永続",
    effect: "キャラクターはNPC化し、KPの管理下に移る。",
  },
];

// ─── プッシュロール ──────────────────────────────────────
export type PushCondition = {
  category: string;
  skill: string;
  allowed: string;
  notAllowed: string;
};

export const PUSH_CONDITIONS: PushCondition[] = [
  {
    category: "探索",
    skill: "目星",
    allowed: "より念入りに調べる、別の角度から観察する",
    notAllowed: "すでに燃えた証拠を再確認する",
  },
  {
    category: "探索",
    skill: "聞き耳",
    allowed: "もっと近づく、息を殺して再度聞く",
    notAllowed: "すでに扉が閉まってしまった後",
  },
  {
    category: "探索",
    skill: "図書館",
    allowed: "別の棚も調べる、司書に聞く",
    notAllowed: "すでに図書館が閉館している",
  },
  {
    category: "対人",
    skill: "説得",
    allowed: "別の角度から説得する、証拠を提示する",
    notAllowed: "相手がすでに去ってしまった",
  },
  {
    category: "対人",
    skill: "心理学",
    allowed: "じっくり観察し直す",
    notAllowed: "対象がすでにいない",
  },
  {
    category: "戦闘",
    skill: "格闘・射撃",
    allowed: "通常はプッシュを認めない（危険が大きいため）",
    notAllowed: "ほぼ全ての戦闘状況",
  },
  {
    category: "知識",
    skill: "医学・応急手当",
    allowed: "もう一度処置を試みる（患者の状態が許す場合）",
    notAllowed: "患者が死亡している",
  },
  {
    category: "技術",
    skill: "機械修理・電気修理",
    allowed: "工具を替える、別の手順で試す",
    notAllowed: "部品が完全に失われた",
  },
];

// ─── プッシュ失敗結果例 ──────────────────────────────────
export type PushFailureExample = {
  skill: string;
  consequence: string;
};

export const PUSH_FAILURE_EXAMPLES: PushFailureExample[] = [
  { skill: "目星", consequence: "証拠を破損させてしまう、またはNPCに気づかれる" },
  { skill: "聞き耳", consequence: "物音を立てて敵に気づかれる" },
  { skill: "図書館", consequence: "貴重な文書を破損、または要注意人物として記録される" },
  { skill: "説得", consequence: "相手が敵対的になる、警察/組織を呼ぶ" },
  { skill: "心理学", consequence: "誤った判断を下し、NPCとの関係が悪化" },
  { skill: "応急手当", consequence: "患者の状態が悪化、最悪の場合は死亡" },
  { skill: "機械修理", consequence: "装置が完全に壊れる、または爆発・感電" },
  { skill: "運転", consequence: "事故を起こし、乗員がダメージを受ける" },
];
