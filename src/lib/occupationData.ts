export type OccupationStats = {
  str: number;
  con: number;
  pow: number;
  dex: number;
  app: number;
  siz: number;
  int_stat: number;
  edu: number;
};

export type OccupationEntry = {
  name: string;
  formulaLabel: string;
  calcPoints: (s: OccupationStats) => number;
};

export const OCCUPATIONS: OccupationEntry[] = [
  {
    name: "探偵",
    formulaLabel: "EDU×2+INT×2",
    calcPoints: (s) => s.edu * 2 + s.int_stat * 2,
  },
  {
    name: "医師",
    formulaLabel: "EDU×4",
    calcPoints: (s) => s.edu * 4,
  },
  {
    name: "聖職者",
    formulaLabel: "EDU×4",
    calcPoints: (s) => s.edu * 4,
  },
  {
    name: "弁護士",
    formulaLabel: "EDU×4",
    calcPoints: (s) => s.edu * 4,
  },
  {
    name: "ジャーナリスト",
    formulaLabel: "EDU×4",
    calcPoints: (s) => s.edu * 4,
  },
  {
    name: "考古学者",
    formulaLabel: "EDU×4",
    calcPoints: (s) => s.edu * 4,
  },
  {
    name: "作家",
    formulaLabel: "EDU×4",
    calcPoints: (s) => s.edu * 4,
  },
  {
    name: "教授",
    formulaLabel: "EDU×4",
    calcPoints: (s) => s.edu * 4,
  },
  {
    name: "警察官",
    formulaLabel: "EDU×2+DEX×2",
    calcPoints: (s) => s.edu * 2 + s.dex * 2,
  },
  {
    name: "軍人",
    formulaLabel: "EDU×2+STR×2",
    calcPoints: (s) => s.edu * 2 + s.str * 2,
  },
  {
    name: "秘密工作員",
    formulaLabel: "EDU×2+APP×2",
    calcPoints: (s) => s.edu * 2 + s.app * 2,
  },
  {
    name: "アーティスト",
    formulaLabel: "EDU×2+POW×2",
    calcPoints: (s) => s.edu * 2 + s.pow * 2,
  },
  {
    name: "農夫",
    formulaLabel: "EDU×2+STR×2",
    calcPoints: (s) => s.edu * 2 + s.str * 2,
  },
  {
    name: "船乗り",
    formulaLabel: "EDU×2+STR×2",
    calcPoints: (s) => s.edu * 2 + s.str * 2,
  },
  {
    name: "パイロット",
    formulaLabel: "EDU×4",
    calcPoints: (s) => s.edu * 4,
  },
  {
    name: "実業家",
    formulaLabel: "EDU×2+APP×2",
    calcPoints: (s) => s.edu * 2 + s.app * 2,
  },
  {
    name: "技術者",
    formulaLabel: "EDU×4",
    calcPoints: (s) => s.edu * 4,
  },
  {
    name: "運転手",
    formulaLabel: "EDU×2+DEX×2",
    calcPoints: (s) => s.edu * 2 + s.dex * 2,
  },
  {
    name: "詐欺師",
    formulaLabel: "EDU×2+APP×2",
    calcPoints: (s) => s.edu * 2 + s.app * 2,
  },
  {
    name: "旅行者",
    formulaLabel: "EDU×2+INT×2",
    calcPoints: (s) => s.edu * 2 + s.int_stat * 2,
  },
];
