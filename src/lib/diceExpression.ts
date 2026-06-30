export type DiceEvaluation = { total: number; detail: string };

/**
 * Evaluates a dice expression like "1d6+1D4-2" by rolling each NdM term
 * and summing it with any flat modifiers.
 */
export function evaluateDiceExpression(expression: string): DiceEvaluation {
  const normalized = expression.replace(/\s+/g, "").toUpperCase();
  if (!normalized) return { total: 0, detail: "0" };

  const rawTerms = normalized.match(/[+-]?[^+-]+/g) ?? [];

  let total = 0;
  const parts: string[] = [];

  for (const rawTerm of rawTerms) {
    const negative = rawTerm.startsWith("-");
    const term = rawTerm.replace(/^[+-]/, "");
    if (!term) continue;

    const diceMatch = term.match(/^(\d*)D(\d+)$/);
    if (diceMatch) {
      const count = diceMatch[1] ? parseInt(diceMatch[1], 10) : 1;
      const sides = parseInt(diceMatch[2], 10);
      const rolls: number[] = [];
      let sum = 0;
      for (let i = 0; i < count; i++) {
        const value = Math.floor(Math.random() * sides) + 1;
        rolls.push(value);
        sum += value;
      }
      total += negative ? -sum : sum;
      parts.push(`${negative ? "-" : parts.length > 0 ? "+" : ""}${count}D${sides}[${rolls.join(",")}]`);
      continue;
    }

    const flat = parseInt(term, 10);
    if (!Number.isNaN(flat)) {
      total += negative ? -flat : flat;
      parts.push(`${negative ? "-" : parts.length > 0 ? "+" : ""}${flat}`);
    }
  }

  return { total, detail: parts.join("") || "0" };
}

/**
 * CoC 7版のダメージボーナス/ビルド表（STR+SIZ）からダメージボーナスのダイス式を求める。
 */
export function computeDamageBonus(str: number, siz: number): string {
  const sum = str + siz;
  if (sum <= 64) return "-2";
  if (sum <= 84) return "-1";
  if (sum <= 124) return "0";
  if (sum <= 164) return "1D4";
  if (sum <= 204) return "1D6";
  if (sum <= 284) return "2D6";
  if (sum <= 364) return "3D6";
  if (sum <= 444) return "4D6";
  if (sum <= 524) return "5D6";
  const extraDice = 5 + Math.ceil((sum - 524) / 80);
  return `${extraDice}D6`;
}

/**
 * 武器のダメージ式にダメージボーナスを連結した式を返す（db=0なら素のダメージ式のまま）。
 */
export function combineDamageExpression(damage: string, damageBonus: string): string {
  const db = damageBonus.trim();
  if (!db || db === "0") return damage;
  return db.startsWith("-") ? `${damage}${db}` : `${damage}+${db}`;
}
