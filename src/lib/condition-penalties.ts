export type ConditionPenalty = {
  categories: string[] | "all";
  penalty: number;
  affectedSkillLabels: string[];
};

export const CONDITION_PENALTY_MAP: Record<string, ConditionPenalty> = {
  "負傷": { categories: ["戦闘", "移動"], penalty: -20, affectedSkillLabels: ["戦闘", "移動"] },
  "出血": { categories: "all", penalty: -10, affectedSkillLabels: ["全技能"] },
  "毒":   { categories: "all", penalty: -10, affectedSkillLabels: ["全技能"] },
  "疲弊": { categories: "all", penalty: -10, affectedSkillLabels: ["全技能"] },
  "拘束": { categories: ["戦闘", "移動"], penalty: -30, affectedSkillLabels: ["戦闘", "移動"] },
  "盲目": { categories: ["探索", "戦闘"], penalty: -30, affectedSkillLabels: ["探索", "戦闘"] },
  "硬直": { categories: ["戦闘", "移動"], penalty: -30, affectedSkillLabels: ["戦闘", "移動"] },
};

export function getSkillPenalty(skillCategory: string, activeConditionNames: string[]): number {
  let total = 0;
  for (const name of activeConditionNames) {
    const p = CONDITION_PENALTY_MAP[name];
    if (!p) continue;
    if (p.categories === "all" || (p.categories as string[]).includes(skillCategory)) {
      total += p.penalty;
    }
  }
  return total;
}

export function getConditionAffectedLabels(conditionName: string): string[] {
  return CONDITION_PENALTY_MAP[conditionName]?.affectedSkillLabels ?? [];
}
