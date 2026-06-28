export function calcHpMax(con: number, siz: number): number {
  return Math.floor((con + siz) / 10);
}

export function calcMpMax(pow: number): number {
  return Math.floor(pow / 5);
}

export function calcSanStart(pow: number): number {
  return pow * 5;
}

export function calcDamageBonus(str: number, siz: number): string {
  const sum = str + siz;
  if (sum <= 64) return "-2";
  if (sum <= 84) return "-1";
  if (sum <= 124) return "なし";
  if (sum <= 164) return "+1D4";
  if (sum <= 204) return "+1D6";
  return "+2D6";
}

export function calcBuild(str: number, siz: number): number {
  const sum = str + siz;
  if (sum <= 64) return -2;
  if (sum <= 84) return -1;
  if (sum <= 124) return 0;
  if (sum <= 164) return 1;
  if (sum <= 204) return 2;
  return 3;
}

export function calcMov(str: number, dex: number, siz: number): number {
  if (str < siz && dex < siz) return 7;
  if (str > siz && dex > siz) return 9;
  return 8;
}

export function half(value: number): number {
  return Math.floor(value / 2);
}

export function fifth(value: number): number {
  return Math.floor(value / 5);
}
