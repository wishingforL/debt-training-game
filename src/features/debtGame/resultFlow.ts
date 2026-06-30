import type { CalculationResult } from "../../calculation";
import type { LevelData, LevelResult, StoredStats } from "../../types";
import { foxTierFor, repaymentPeriodFormulaText } from "../../appSupport";

type CreateLevelResultParams = {
  calculation: CalculationResult;
  level: LevelData;
  levelMistakes: number;
  levelScore: number;
  maxLevelScore: number;
};

export function createLevelResult({
  calculation,
  level,
  levelMistakes,
  levelScore,
  maxLevelScore,
}: CreateLevelResultParams): LevelResult {
  return {
    level: level.level,
    title: level.title,
    mistakes: levelMistakes,
    score: levelScore,
    maxScore: maxLevelScore,
    supportType: calculation.supportType,
    income: calculation.income,
    householdMembers: calculation.householdMembers,
    targetDebt: calculation.targetDebt,
    maxLivingExpense: calculation.maxLivingExpense,
    baseAdditionalLivingExpense: calculation.baseAdditionalLivingExpense,
    additionalLivingExpense: calculation.additionalLivingExpense,
    specialLivingExpense: calculation.specialLivingExpense,
    specialLivingExpenseLimit: calculation.specialLivingExpenseLimit,
    adjustedLivingExpense: calculation.adjustedLivingExpense,
    securedPayment: calculation.securedPayment,
    repaymentBaseIncome: calculation.repaymentBaseIncome,
    monthlyPayment: calculation.monthlyPayment,
    repaymentPeriod: calculation.repaymentPeriod,
    maxRepaymentMonths: calculation.maxRepaymentMonths,
    repaymentFormula: repaymentPeriodFormulaText(calculation),
  };
}

type CreateNextStatsParams = {
  destination: "next" | "result";
  isLastLevel: boolean;
  levelIndex: number;
  nextMaxScore: number;
  nextScore: number;
  practiceMode: boolean;
  stats: StoredStats;
};

export function createNextStats({
  destination,
  isLastLevel,
  levelIndex,
  nextMaxScore,
  nextScore,
  practiceMode,
  stats,
}: CreateNextStatsParams): StoredStats {
  const nextTier = foxTierFor(nextScore, nextMaxScore);
  const practiceUnlocked = Boolean(
    stats.practiceUnlocked ||
    (!practiceMode && destination === "result" && nextTier.minRatio >= 0.9),
  );

  return {
    bestScore: Math.max(stats.bestScore, nextScore),
    clearedLevel: Math.max(stats.clearedLevel, levelIndex + 1),
    practiceUnlocked,
    runs: stats.runs + (isLastLevel ? 1 : 0),
    lastScore: nextScore,
    updatedAt: new Date().toISOString(),
  };
}
