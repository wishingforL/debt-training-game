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
  options?: FieldOption[];
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
  runs: number;
  lastScore: number;
  updatedAt?: string;
};

export type LevelResult = {
  level: number;
  title: string;
  mistakes: number;
  score: number;
};
