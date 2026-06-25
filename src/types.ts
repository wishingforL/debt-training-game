export type ScreenName =
  | "가족"
  | "주거"
  | "소득"
  | "재산"
  | "채무현황"
  | "급여가압류"
  | "특이사항";

export type FieldValue = string | number | boolean;

export type FieldOption = {
  label: string;
  value: string | boolean;
};

export type IntakeField = {
  key: string;
  label: string;
  screen: ScreenName;
  type: "number" | "choice" | "boolean";
  unit?: string;
  answer: FieldValue;
  clue?: string;
  options?: FieldOption[];
};

export type DecoyClue = {
  clue: string;
  label: string;
  reason: string;
  screen: ScreenName;
};

export type MissionAnswer = {
  supportType: string;
  monthlyPayment: number;
  repaymentPeriod: number;
};

export type LevelData = {
  id: string;
  level: number;
  title: string;
  badge: string;
  goal: string;
  narrative?: string;
  decoys?: DecoyClue[];
  scenario: string[];
  fields: IntakeField[];
  systemScreens: ScreenName[];
  result: {
    disposableIncome: number;
    formula: string;
  };
  mission: MissionAnswer;
};

export type StoredStats = {
  bestScore: number;
  clearedLevel: number;
  practiceUnlocked?: boolean;
  runs: number;
  lastScore: number;
  updatedAt?: string;
};

export type LevelResult = {
  level: number;
  title: string;
  mistakes: number;
  score: number;
  maxScore: number;
  supportType: string;
  income: number;
  householdMembers: number;
  targetDebt: number;
  maxLivingExpense: number;
  baseAdditionalLivingExpense: number;
  additionalLivingExpense: number;
  specialLivingExpense: number;
  specialLivingExpenseLimit: number;
  adjustedLivingExpense: number;
  securedPayment: number;
  repaymentBaseIncome: number;
  monthlyPayment: number;
  repaymentPeriod: number;
  maxRepaymentMonths: number;
  repaymentFormula: string;
};
