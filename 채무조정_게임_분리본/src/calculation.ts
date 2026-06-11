import type { FieldValue, LevelData, MissionAnswer } from "./types";

const MEDIAN_INCOME_2026_WON: Record<number, number> = {
  1: 2564238,
  2: 4199292,
  3: 5359036,
  4: 6494738,
  5: 7556719,
  6: 8555952,
};

const MAX_REPAYMENT_MONTHS: Record<string, number> = {
  신속채무조정: 120,
  사전채무조정: 120,
  개인워크아웃: 96,
};

const ANNUAL_INTEREST_RATE: Record<string, number> = {
  신속채무조정: 0.11,
  사전채무조정: 0.06,
  개인워크아웃: 0,
};

export type CalculationResult = {
  income: number;
  householdMembers: number;
  medianIncome: number;
  minimumLivingExpense: number;
  maxLivingExpense: number;
  adjustedLivingExpense: number;
  rentExpense: number;
  targetDebt: number;
  supportType: string;
  annualInterestRate: number;
  monthlyInterestRate: number;
  repaymentMethod: string;
  maxRepaymentMonths: number;
  rawDisposableIncome: number;
  rawRepaymentMonths: number | null;
  disposableIncome: number;
  repaymentPeriod: number;
  monthlyPayment: number;
  cappedByMaxPeriod: boolean;
  mission: MissionAnswer;
};

const round1 = (value: number) => Math.round(value * 10) / 10;
const ceil1 = (value: number) => Math.ceil(value * 10) / 10;

function numberField(fields: LevelData["fields"], key: string) {
  const value = fields.find((field) => field.key === key)?.answer;
  return typeof value === "number" ? value : 0;
}

function supportTypeFor(overdueDays: number) {
  if (overdueDays <= 30) return "신속채무조정";
  if (overdueDays <= 89) return "사전채무조정";
  return "개인워크아웃";
}

export function repaymentMonthsForPayment(debt: number, monthlyPayment: number, monthlyRate: number) {
  if (monthlyPayment <= 0) return null;
  if (monthlyRate <= 0) return Math.ceil(debt / monthlyPayment);
  if (monthlyPayment <= debt * monthlyRate) return null;
  return Math.ceil(-Math.log(1 - (debt * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate));
}

export function paymentForMonths(debt: number, months: number, monthlyRate: number) {
  if (monthlyRate <= 0) return debt / months;
  return (debt * monthlyRate) / (1 - (1 + monthlyRate) ** -months);
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 1,
  }).format(value);
}

export function calculateLevel(level: LevelData): CalculationResult {
  const income = numberField(level.fields, "income");
  const dependents = numberField(level.fields, "dependents");
  const householdMembers = Math.max(1, Math.min(6, dependents + 1));
  const medianIncomeWon = MEDIAN_INCOME_2026_WON[householdMembers] ?? MEDIAN_INCOME_2026_WON[6];
  const medianIncome = round1(medianIncomeWon / 10000);
  const minimumLivingExpense = round1(medianIncome * 0.4);
  const maxLivingExpense = round1(minimumLivingExpense * 1.5);
  const rentExpense = numberField(level.fields, "monthlyRent");
  const targetDebt = numberField(level.fields, "unsecuredDebt") || numberField(level.fields, "debt");
  const overdueDays = numberField(level.fields, "overdueDays");
  const supportType = supportTypeFor(overdueDays);
  const annualInterestRate = ANNUAL_INTEREST_RATE[supportType] ?? 0;
  const monthlyInterestRate = annualInterestRate / 12;
  const repaymentMethod = annualInterestRate > 0 ? "원리금균등" : "원금균등";
  const maxRepaymentMonths = MAX_REPAYMENT_MONTHS[supportType];
  const rawDisposableIncome = Math.max(0, round1(income - maxLivingExpense));
  const rawRepaymentMonths = repaymentMonthsForPayment(targetDebt, rawDisposableIncome, monthlyInterestRate);
  const cappedByMaxPeriod = !rawRepaymentMonths || rawRepaymentMonths > maxRepaymentMonths;

  if (!cappedByMaxPeriod) {
    return {
      income,
      householdMembers,
      medianIncome,
      minimumLivingExpense,
      maxLivingExpense,
      adjustedLivingExpense: maxLivingExpense,
      rentExpense,
      targetDebt,
      supportType,
      annualInterestRate,
      monthlyInterestRate,
      repaymentMethod,
      maxRepaymentMonths,
      rawDisposableIncome,
      rawRepaymentMonths,
      disposableIncome: rawDisposableIncome,
      repaymentPeriod: rawRepaymentMonths,
      monthlyPayment: rawDisposableIncome,
      cappedByMaxPeriod,
      mission: {
        supportType,
        monthlyPayment: rawDisposableIncome,
        repaymentPeriod: rawRepaymentMonths,
      },
    };
  }

  const monthlyPayment = ceil1(paymentForMonths(targetDebt, maxRepaymentMonths, monthlyInterestRate));
  const adjustedLivingExpense = round1(Math.max(0, Math.min(maxLivingExpense, income - monthlyPayment)));
  const disposableIncome = round1(Math.max(0, income - adjustedLivingExpense));
  const repaymentPeriod = Math.min(
    maxRepaymentMonths,
    repaymentMonthsForPayment(targetDebt, Math.max(disposableIncome, 0.1), monthlyInterestRate) ?? maxRepaymentMonths,
  );

  return {
    income,
    householdMembers,
    medianIncome,
    minimumLivingExpense,
    maxLivingExpense,
    adjustedLivingExpense,
    rentExpense,
    targetDebt,
    supportType,
    annualInterestRate,
    monthlyInterestRate,
    repaymentMethod,
    maxRepaymentMonths,
    rawDisposableIncome,
    rawRepaymentMonths,
    disposableIncome,
    repaymentPeriod,
    monthlyPayment: disposableIncome,
    cappedByMaxPeriod,
    mission: {
      supportType,
      monthlyPayment: disposableIncome,
      repaymentPeriod,
    },
  };
}
