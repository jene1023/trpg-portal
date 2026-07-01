export type SpellEntry = {
  spell_name: string;
  mp_cost: number | null;
  san_cost: string | null;
  casting_time: string | null;
  effect: string;
  category: string;
};

export const SPELL_CATALOG: SpellEntry[] = [
  // コンタクト系
  {
    spell_name: "コンタクト・グール",
    mp_cost: 1,
    san_cost: "1/1D3",
    casting_time: "5分",
    effect: "グールと精神的なコンタクトを取る。グールは最も近い死体の場所を教えたり、夢の中での通路を案内したりする。",
    category: "コンタクト",
  },
  {
    spell_name: "コンタクト・ディープワン",
    mp_cost: 1,
    san_cost: "1/1D6",
    casting_time: "5分",
    effect: "水中か海岸線でディープワンと精神的コンタクトを取る。ディープワンは通常、互いの目的のために交渉しようとする。",
    category: "コンタクト",
  },
  {
    spell_name: "コンタクト・ミ=ゴ",
    mp_cost: 1,
    san_cost: "1/1D6",
    casting_time: "5分",
    effect: "ミ=ゴと精神的コンタクトを取る。ミ=ゴは科学的知識や奇妙な技術に関して交渉することが多い。",
    category: "コンタクト",
  },
  {
    spell_name: "コンタクト・ナイトゴーント",
    mp_cost: 1,
    san_cost: "0/1D3",
    casting_time: "5分",
    effect: "ナイトゴーントを呼び出して精神的コンタクトを取る。夢の国を旅する助力を求めることができる。",
    category: "コンタクト",
  },
  {
    spell_name: "コンタクト・ショゴス",
    mp_cost: 1,
    san_cost: "1D6/2D20",
    casting_time: "5分",
    effect: "ショゴスとの精神的接触を試みる。ショゴスは制御が難しく、サーヴィタよりも危険な存在。",
    category: "コンタクト",
  },
  // サモン/バインド系
  {
    spell_name: "サモン/バインド・バイアクヒー",
    mp_cost: 5,
    san_cost: "1/1D6",
    casting_time: "10分",
    effect: "バイアクヒー（ハウンド・オブ・ティンダロス）を召喚・拘束する。召喚には生け贄が必要な場合がある。",
    category: "召喚/拘束",
  },
  {
    spell_name: "サモン/バインド・ダーク・ヤング",
    mp_cost: 3,
    san_cost: "1D3/1D10",
    casting_time: "1時間",
    effect: "シュブ＝ニグラスのダーク・ヤングを召喚し拘束する。強力な従者だが制御は難しい。",
    category: "召喚/拘束",
  },
  {
    spell_name: "サモン/バインド・ショゴス",
    mp_cost: 50,
    san_cost: "1D20/1D100",
    casting_time: "1時間以上",
    effect: "ショゴスを召喚して拘束する。非常に強力だが極めて危険。多くの場合、術者は精神を失う。",
    category: "召喚/拘束",
  },
  {
    spell_name: "サモン/バインド・ファイアー・ヴァンパイア",
    mp_cost: 3,
    san_cost: "1/1D6",
    casting_time: "10分",
    effect: "炎の精であるファイアー・ヴァンパイアを召喚し拘束する。燃焼攻撃を行わせることができる。",
    category: "召喚/拘束",
  },
  // 攻撃/制御系
  {
    spell_name: "マインド・ブラスト",
    mp_cost: 10,
    san_cost: "1D6/1D10",
    casting_time: "1ラウンド",
    effect: "対象の精神に直接攻撃を加える。対象はINT対抗ロールに失敗すると一時的に精神崩壊する。",
    category: "攻撃/制御",
  },
  {
    spell_name: "ドミネイト",
    mp_cost: null,
    san_cost: "0/1",
    casting_time: "1ラウンド",
    effect: "対象に命令を下す。対象はPOWの対抗ロールに失敗すると術者の命令に従う。MP消費は術者と対象のPOW差による。",
    category: "攻撃/制御",
  },
  {
    spell_name: "ヴォイス・オブ・ラ＝リイェー",
    mp_cost: 1,
    san_cost: "0/1",
    casting_time: "1ラウンド",
    effect: "クトゥルフの声を模倣する。聞いた者はSANロールを行い、失敗した者は恐怖で麻痺する。",
    category: "攻撃/制御",
  },
  {
    spell_name: "デフ",
    mp_cost: 1,
    san_cost: null,
    casting_time: "1ラウンド/継続",
    effect: "対象を一時的に聴覚喪失状態にする。1MP/ラウンドを消費し続ける間、効果が持続する。",
    category: "攻撃/制御",
  },
  {
    spell_name: "イグの炎",
    mp_cost: 5,
    san_cost: "0/1",
    casting_time: "1ラウンド",
    effect: "イグの力を借りた炎の攻撃。1d6のダメージを与える。イグの信者に対しては効果が弱まる場合がある。",
    category: "攻撃/制御",
  },
  // 防護/補助系
  {
    spell_name: "フレッシュ・ウォード",
    mp_cost: 3,
    san_cost: null,
    casting_time: "1ラウンド",
    effect: "自身の肉体に魔術的な防護を施す。次のターンに受けるダメージを1D6軽減する。",
    category: "防護/補助",
  },
  {
    spell_name: "シールド",
    mp_cost: 5,
    san_cost: null,
    casting_time: "1ラウンド",
    effect: "魔術的なシールドを展開し、物理・魔術両方のダメージを軽減する。効果は1シーンの間持続する。",
    category: "防護/補助",
  },
  {
    spell_name: "ウィザード・アイ",
    mp_cost: 3,
    san_cost: "0/1",
    casting_time: "1ラウンド",
    effect: "魔術的な目を召喚し、術者の視点で遠方を偵察させる。目はMPを消費し続ける間活動できる。",
    category: "防護/補助",
  },
  {
    spell_name: "ドリーム",
    mp_cost: 1,
    san_cost: null,
    casting_time: "睡眠中",
    effect: "意図的に夢の国へ意識を向ける呪文。夢の国の存在や場所に関する情報を得られる可能性がある。",
    category: "防護/補助",
  },
  // 死体/変成系
  {
    spell_name: "クリエイト・ゾンビ",
    mp_cost: 10,
    san_cost: "1D6/2D6",
    casting_time: "1時間",
    effect: "死体をゾンビとして蘇らせる。ゾンビは術者の命令に従い、疲労も感じない。ただし腐敗は進む。",
    category: "死体/変成",
  },
  {
    spell_name: "クリエイト・サーヴィタ",
    mp_cost: 1,
    san_cost: "1D3/1D10",
    casting_time: "1時間",
    effect: "小動物や人間の体の一部を使い、旧支配者に仕えるサーヴィタを作り出す。",
    category: "死体/変成",
  },
  // 異次元/召喚系
  {
    spell_name: "ファインド・ゲート",
    mp_cost: 3,
    san_cost: "1/1D6",
    casting_time: "10分",
    effect: "最も近くにある異次元へのゲートを感知する。ゲートの方向と大まかな距離を感知できる。",
    category: "異次元/ゲート",
  },
  {
    spell_name: "クリエイト・ゲート",
    mp_cost: 10,
    san_cost: "1D8/1D20",
    casting_time: "1時間",
    effect: "異次元への恒久的なゲートを作成する。ゲートは術者が意図した場所か旧支配者の在処につながる。",
    category: "異次元/ゲート",
  },
  {
    spell_name: "スター・スポーン招来",
    mp_cost: 25,
    san_cost: "1D10/1D100",
    casting_time: "1時間",
    effect: "クトゥルフのスター・スポーンを招来する。極めて危険で制御は不可能に近く、多大なSANを消費する。",
    category: "異次元/ゲート",
  },
  // 知識/感知系
  {
    spell_name: "アクエイント",
    mp_cost: 1,
    san_cost: null,
    casting_time: "1分",
    effect: "物体や場所に残留した思念を感知する。その物体や場所の過去の出来事を断片的に知ることができる。",
    category: "知識/感知",
  },
  {
    spell_name: "クレアボイアンス",
    mp_cost: 2,
    san_cost: "0/1",
    casting_time: "1ラウンド",
    effect: "遠隔地の光景を視覚的に感知する。術者は目を閉じた状態で遠方を「見る」ことができる。",
    category: "知識/感知",
  },
  {
    spell_name: "テレパシー",
    mp_cost: 2,
    san_cost: null,
    casting_time: "1ラウンド",
    effect: "対象の心を読む。対象がPOW対抗ロールに失敗すると、術者は表面上の思考を読み取れる。",
    category: "知識/感知",
  },
];

export const SPELL_CATEGORIES = [
  "すべて",
  "コンタクト",
  "召喚/拘束",
  "攻撃/制御",
  "防護/補助",
  "死体/変成",
  "異次元/ゲート",
  "知識/感知",
] as const;
