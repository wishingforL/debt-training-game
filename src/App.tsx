import {
  Calculator,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  HelpCircle,
  ClipboardList,
  Home,
  Play,
  RotateCcw,
  Smartphone,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  calculateLevel,
  formatMoney,
  livingExpenseBasisForDependents,
  paymentForMonths,
  repaymentMonthsForPayment,
  type CalculationResult,
} from "./calculation";
import { LEVELS, PRACTICE_LEVELS, SUPPORT_OPTIONS } from "./data/levels";
import type { DecoyClue, FieldValue, IntakeField, LevelData, LevelResult, ScreenName, StoredStats } from "./types";
import startHero from "../assets/start-hero.jpg";

const STORAGE_KEY = "rookie-debt-adjustment-game-v1";
const PAYMENT_SNAP_TOLERANCE = 0.25;
const MONEY_INPUT_SCALE = 10;
const PAYMENT_SLIDER_MAX = 100;
const PAYMENT_FOCUS_RULES = [
  { minIncome: 400, rangeRatio: 0.07, sliderShare: 20 },
  { minIncome: 300, rangeRatio: 0.08, sliderShare: 15 },
  { minIncome: 200, rangeRatio: 0.09, sliderShare: 12 },
  { minIncome: 0, rangeRatio: 0.1, sliderShare: 10 },
];
const LOW_PAYMENT_COMPACT_LIMIT = 10;
const LOW_LIVING_EXPENSE_RATIO = 0.3;
const LOW_PAYMENT_SLIDER_WEIGHT = 1.5;
const BEFORE_FOCUS_SLIDER_WEIGHT = 44;
const AFTER_FOCUS_SLIDER_WEIGHT = 42.5;
const HIGH_PAYMENT_SLIDER_WEIGHT = 2;
const MIN_LIVING_EXPENSE_RATIO = 0.9;
const WRONG_GROUP_CLUE_KEY = "__wrongClue";
const MONEY_FIELD_KEYS = new Set([
  "income",
  "debt",
  "deposit",
  "monthlyRent",
  "jeonseDeposit",
  "homeValue",
  "medicalExpense",
  "unsecuredDebt",
  "securedDebt",
  "securedPayment",
  "vehicleValue",
  "depositAsset",
]);
const TUTORIAL_PAGES = [
  {
    badge: "게임 소개",
    title: "신입 상담원이 되어 접수 단서를 찾습니다.",
    visual: "flow",
    lines: [
      "표지를 누른 뒤 레벨과 문항을 선택합니다.",
      "고객의 말을 읽고 접수에 필요한 단서를 찾아 정리하는 게임입니다.",
      "단서 찾기, 지원구분 선택, 최종미션 순서로 진행합니다.",
    ],
    chips: ["문항 선택", "단서 찾기", "지원구분", "최종미션"],
  },
  {
    badge: "단서 찾기",
    title: "문장 안의 단서를 찾아 누릅니다.",
    visual: "scenario",
    lines: [
      "안내 문구가 나오면 시나리오 문장 안에서 해당 단서 텍스트를 직접 누릅니다.",
      "맞는 단서를 누르면 그 부분이 동그라미로 표시되고, 아래에 값이 정리됩니다.",
      "단서를 모두 찾은 뒤 지원구분 선택하기로 넘어갈 수 있습니다.",
    ],
    chips: ["텍스트 터치", "동그라미 표시", "값 정리", "접수하기"],
  },
  {
    badge: "다시보기",
    title: "헷갈리면 단서와 시나리오를 다시 봅니다.",
    visual: "review",
    lines: [
      "힌트는 기준을 알려주고, 두 번 이상 틀리면 정답 보기가 열립니다.",
    ],
    chips: ["찾은 단서", "시나리오", "힌트", "정답 보기"],
  },
  {
    badge: "지원구분",
    title: "연체일수로 지원구분을 판단합니다.",
    visual: "support",
    lines: [
      "시나리오에서 찾은 연체일수로 지원구분을 선택합니다.",
      "단서를 모두 찾지 않았거나 지원구분이 틀리면 최종미션으로 넘어갈 수 없습니다.",
    ],
    chips: ["30일 이하", "31~89일", "90일 이상"],
  },
  {
    badge: "최종미션",
    title: "생활비와 월납부액을 찾습니다.",
    visual: "balance",
    lines: [
      "소득에서 생활비를 남기면 남은 금액이 월납부액이 됩니다.",
      "금액은 10천원 단위로 표시됩니다.",
      "레벨 5부터는 주거비, 교육비, 의료비, 기타 추가인정 생활비도 반영합니다.",
    ],
    chips: ["생활비", "월납부액", "상환기간", "추가인정"],
  },
  {
    badge: "점수",
    title: "제출하면 이번 문항 점수를 확인합니다.",
    visual: "score",
    lines: [
      "최종미션을 제출하면 점수 팝업이 뜹니다.",
      "기본 500점에서 단서 보너스와 오답 감점이 반영됩니다.",
      "결과 보기 전 문항 점수와 만점, 단서 수, 오답 수를 확인하세요.",
    ],
    chips: ["문항 점수", "단서", "오답", "결과 보기"],
  },
];
const TUTORIAL_GROUPS = [
  {
    badge: "게임 안내",
    title: "문항을 고르고 단서를 찾습니다.",
    sections: TUTORIAL_PAGES.slice(0, 3),
  },
  {
    badge: "접수 완료",
    title: "지원구분과 최종미션을 제출합니다.",
    sections: TUTORIAL_PAGES.slice(3),
  },
];
const TUTORIAL_CHIP_EXAMPLES: Record<string, Record<string, string>> = {
  "게임 소개": {
    "문항 선택": "표지를 누른 뒤 레벨과 문항을 선택합니다.",
    "단서 찾기": "고객의 말을 읽고 접수에 필요한 소득, 가족, 채무 같은 단서를 직접 누릅니다.",
    "지원구분": "찾은 연체일수를 기준으로 지원구분을 선택합니다.",
    "최종미션": "지원구분 선택 뒤 생활비와 월납부액, 상환기간을 제출합니다.",
  },
  "단서 찾기": {
    "텍스트 터치": "예: 월 소득 단서라면 문장 안의 '월 2,500천원'을 누릅니다.",
    "동그라미 표시": "맞는 단서를 누르면 해당 문구가 동그라미로 표시됩니다.",
    "값 정리": "찾은 단서는 아래 목록에 항목별로 자동 정리됩니다.",
    "접수하기": "필요한 단서를 모두 찾으면 지원구분 선택하기로 넘어갑니다.",
  },
  "다시보기": {
    "찾은 단서": "내가 찾은 값을 다시 모아 확인합니다.",
    "시나리오": "고객이 말한 원문을 다시 봅니다.",
    "힌트": "판단 기준과 계산 기준을 확인합니다.",
    "정답 보기": "두 번 이상 틀리면 정답을 확인할 수 있습니다.",
  },
  지원구분: {
    "30일 이하": "연체 30일 이하는 신속채무조정입니다.",
    "31~89일": "연체 31~89일은 사전채무조정입니다.",
    "90일 이상": "연체 90일 이상은 개인워크아웃입니다.",
  },
  최종미션: {
    생활비: "소득에서 보호할 생활비를 먼저 남깁니다.",
    월납부액: "남은소득을 10천원 단위로 반올림해 월납부액으로 봅니다.",
    상환기간: "채무 금액과 지원구분별 계산 기준으로 상환기간을 확인합니다.",
    추가인정: "레벨 5부터는 주거비, 교육비, 의료비, 기타 추가인정 생활비를 반영합니다.",
  },
  점수: {
    "문항 점수": "제출하면 이번 문항 점수가 팝업으로 표시됩니다.",
    단서: "단서를 많이 찾을수록 점수에 유리합니다.",
    오답: "오답이 많으면 점수가 깎입니다.",
    "결과 보기": "점수 팝업에서 결과 보기로 계산 결과 화면을 확인합니다.",
  },
};
const emptyStats: StoredStats = {
  bestScore: 0,
  clearedLevel: 0,
  runs: 0,
  lastScore: 0,
};

const FOX_TIERS = [
  {
    icon: "🌱",
    minRatio: 0,
    name: "새싹여우",
    description: "채무조정의 첫걸음을 내딛은 여우",
  },
  {
    icon: "🎒",
    minRatio: 0.4,
    name: "여행여우",
    description: "기본적인 접수 단서를 찾을 수 있는 여우",
  },
  {
    icon: "🧭",
    minRatio: 0.6,
    name: "탐험여우",
    description: "다양한 상황과 조건을 분석할 수 있는 여우",
  },
  {
    icon: "🔍",
    minRatio: 0.75,
    name: "탐정여우",
    description: "복잡한 사례 속 숨겨진 단서를 찾아내는 여우",
  },
  {
    icon: "👑",
    minRatio: 0.9,
    name: "마스터여우",
    description: "어떤 사례도 해결할 수 있는 최고",
  },
];

type Screen = "start" | "tutorial" | "levelSelect" | "game" | "result";
type Phase = "scenario" | "intake" | "calculation" | "mission";

type MissionDraft = {
  supportType: string;
  monthlyPayment: string;
  repaymentPeriod: string;
};

type AssistState = {
  title: string;
  body: string;
  answer?: string;
  onFill?: () => void;
};

type CalculatorDraft = {
  principal: string;
  annualRate: string;
  months: string;
};

type AdditionalLivingExpenseItem = {
  active: boolean;
  amount: number;
  label: string;
  value: string;
};

const formatNumber = (value: number) => new Intl.NumberFormat("ko-KR").format(value);
const normalizeNumber = (value: string) => Number(value.replace(/,/g, "").trim());
const round1 = (value: number) => Math.round(value * 10) / 10;

function isMoneyField(field: IntakeField) {
  return field.unit === "천원" || MONEY_FIELD_KEYS.has(field.key);
}

function formatAmount(valueInManwon: number) {
  return `${formatMoney(Math.round(valueInManwon) * MONEY_INPUT_SCALE)}천원`;
}

function formatAmountNumber(valueInManwon: number) {
  return formatMoney(Math.round(valueInManwon) * MONEY_INPUT_SCALE);
}

function comparisonSign(value: number) {
  if (value > 0) return ">";
  if (value < 0) return "<";
  return "=";
}

function livingExpenseIncomeComparison(maxLivingExpense: number, income: number) {
  return `${formatAmount(maxLivingExpense)} - ${formatAmount(income)} ${comparisonSign(maxLivingExpense - income)} 0`;
}

function canUseMaxRepaymentPeriod(maxLivingExpense: number, income: number) {
  return maxLivingExpense - income >= 0;
}

function maxRepaymentAvailabilityText(maxLivingExpense: number, income: number, maxRepaymentMonths: number) {
  const status = canUseMaxRepaymentPeriod(maxLivingExpense, income) ? "가능" : "추가 검증 필요";
  return `최대 상환기간(${maxRepaymentMonths}개월) ${status}`;
}

type MaxRepaymentReviewData = {
  additionalLivingExpense: number;
  annualInterestRate?: number;
  maxLivingExpense: number;
  maxRepaymentMonths: number;
  repaymentBaseIncome: number;
  supportType: string;
  targetDebt: number;
};

function annualInterestRateForSupport(supportType: string, fallback = 0) {
  const annualInterestRateBySupportType: Record<string, number> = {
    신속채무조정: 0.11,
    사전채무조정: 0.06,
    개인워크아웃: 0,
  };

  return annualInterestRateBySupportType[supportType] ?? fallback;
}

function maxPeriodMonthlyPaymentFor(data: MaxRepaymentReviewData) {
  const annualInterestRate = data.annualInterestRate ?? annualInterestRateForSupport(data.supportType);
  return Math.round(paymentForMonths(data.targetDebt, data.maxRepaymentMonths, annualInterestRate / 12));
}

function maxPeriodPaymentFormulaText(data: MaxRepaymentReviewData) {
  const methodLabel = (data.annualInterestRate ?? annualInterestRateForSupport(data.supportType)) > 0 ? "원리금" : "원금";

  return `${formatAmount(data.targetDebt)} ${data.maxRepaymentMonths}개월 ${methodLabel} 분할\n= ${formatAmount(maxPeriodMonthlyPaymentFor(data))}`;
}

function recognizedMaxLivingExpenseFor(data: MaxRepaymentReviewData) {
  return round1(data.maxLivingExpense + data.additionalLivingExpense);
}

function needsMaxRepaymentVerification(data: MaxRepaymentReviewData) {
  return !canUseMaxRepaymentPeriod(data.maxLivingExpense, data.repaymentBaseIncome);
}

function maxRepaymentVerificationValue(data: MaxRepaymentReviewData) {
  return round1(
    data.repaymentBaseIncome -
      recognizedMaxLivingExpenseFor(data) -
      maxPeriodMonthlyPaymentFor(data),
  );
}

function maxRepaymentVerificationLabel(data: MaxRepaymentReviewData) {
  return data.additionalLivingExpense > 0
    ? "소득 - (최대생활비 + 추가인정 생활비) - 최장기간 월납부액"
    : "소득 - 최대생활비 - 최장기간 월납부액";
}

function maxRepaymentVerificationFormulaText(data: MaxRepaymentReviewData) {
  const value = maxRepaymentVerificationValue(data);

  return `${formatAmount(data.repaymentBaseIncome)} - ${formatAmount(recognizedMaxLivingExpenseFor(data))} - ${formatAmount(maxPeriodMonthlyPaymentFor(data))} ${comparisonSign(value)} 0`;
}

function isMaxRepaymentVerifiedPossible(data: MaxRepaymentReviewData) {
  return maxRepaymentVerificationValue(data) <= 0;
}

function maxRepaymentVerificationStatusText(data: MaxRepaymentReviewData) {
  return `최대 상환기간(${data.maxRepaymentMonths}개월) ${
    isMaxRepaymentVerifiedPossible(data) ? "가능" : "불가"
  }`;
}

function livingExpenseFormulaText(baseIncome: number, monthlyPayment: number, livingExpense: number) {
  return `${formatAmount(baseIncome)} - ${formatAmount(monthlyPayment)} = ${formatAmount(livingExpense)}`;
}

function recognizedLivingExpenseFormulaText(maxLivingExpense: number, additionalLivingExpense: number, livingExpense: number) {
  return `${formatAmount(maxLivingExpense)} + ${formatAmount(additionalLivingExpense)} = ${formatAmount(livingExpense)}`;
}

function monthlyPaymentFormulaText(baseIncome: number, livingExpense: number, monthlyPayment: number) {
  return `${formatAmount(baseIncome)} - ${formatAmount(livingExpense)} = ${formatAmount(monthlyPayment)}`;
}

function maxLivingExpenseIncomeLabel(hasSecuredPayment: boolean) {
  return (
    <>
      <span>최대생활비</span>
      <span>
        - {hasSecuredPayment ? <><strong>남은</strong>소득</> : "소득"}
      </span>
    </>
  );
}

type CalculationReasonData = MaxRepaymentReviewData & {
  adjustedLivingExpense: number;
  income: number;
  monthlyPayment: number;
  repaymentPeriod: number;
  securedPayment: number;
};

function calculationReasonSteps(data: CalculationReasonData, overdueDays: number) {
  const hasSecuredDeduction = hasSecuredIncomeDeduction(data);
  const baseIncomeLabel = hasSecuredDeduction ? "남은소득" : "소득";
  const maxPayment = maxPeriodMonthlyPaymentFor(data);
  const usesMaxPeriodPayment =
    canUseMaxRepaymentPeriod(data.maxLivingExpense, data.repaymentBaseIncome) ||
    (needsMaxRepaymentVerification(data) && isMaxRepaymentVerifiedPossible(data));
  const appliedMonthlyPayment = usesMaxPeriodPayment ? maxPayment : data.monthlyPayment;

  return [
    `연체 ${formatNumber(overdueDays)}일 기준으로 ${data.supportType}을 선택합니다.`,
    hasSecuredDeduction
      ? `담보 원리금 ${formatAmount(data.securedPayment)}을 먼저 차감해 ${baseIncomeLabel} ${formatAmount(data.repaymentBaseIncome)}을 기준으로 봅니다.`
      : `${baseIncomeLabel} ${formatAmount(data.repaymentBaseIncome)}에서 생활비와 월납부액을 확인합니다.`,
    data.additionalLivingExpense > 0
      ? `최대생활비 ${formatAmount(data.maxLivingExpense)}에 추가인정 생활비 ${formatAmount(data.additionalLivingExpense)}을 반영합니다.`
      : "가구수 기준 최대생활비와 소득을 비교해 최대 상환기간 가능 여부를 확인합니다.",
    usesMaxPeriodPayment
      ? `최대 상환기간 기준 월납부액 ${formatAmount(appliedMonthlyPayment)}을 적용하고 생활비 ${formatAmount(data.adjustedLivingExpense)}가 남는지 확인합니다.`
      : `생활비 ${formatAmount(data.adjustedLivingExpense)}를 남긴 뒤 월납부액 ${formatAmount(data.monthlyPayment)}과 상환기간 ${data.repaymentPeriod}개월을 계산합니다.`,
  ];
}

function renderCalculationAnswerCard(data: CalculationReasonData) {
  return (
    <section className="calc-answer-card" aria-label="최종 정답 요약">
      <span>최종 정답</span>
      <div>
        <small>지원구분</small>
        <strong>{resultSupportTypeLabel(data.supportType)}</strong>
      </div>
      <div>
        <small>월납부액</small>
        <strong>{formatAmount(data.monthlyPayment)}</strong>
      </div>
      <div>
        <small>상환기간</small>
        <strong>{data.repaymentPeriod}개월</strong>
      </div>
    </section>
  );
}

function renderCalculationReasonCard(data: CalculationReasonData, overdueDays: number) {
  return (
    <section className="calc-reason-card" aria-label="정답 판단 요약">
      <div>
        <span>정답 판단</span>
        <strong>왜 이 답인가요?</strong>
      </div>
      <ol>
        {calculationReasonSteps(data, overdueDays).map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}

function hasSecuredIncomeDeduction({
  income,
  repaymentBaseIncome,
  securedPayment,
}: {
  income: number;
  repaymentBaseIncome: number;
  securedPayment: number;
}) {
  return securedPayment > 0 && repaymentBaseIncome < income;
}

function fieldUnitLabel(field: IntakeField) {
  return isMoneyField(field) ? "천원" : field.unit ?? "";
}

function toInputFieldValue(field: IntakeField, value: FieldValue | undefined) {
  if (value === undefined || value === "") return "";
  if (field.type === "number" && isMoneyField(field) && typeof value === "number") {
    return round1(value * MONEY_INPUT_SCALE);
  }
  return value;
}

function toInternalFieldValue(field: IntakeField, value: number) {
  return isMoneyField(field) ? round1(value / MONEY_INPUT_SCALE) : value;
}

type PaymentSliderSegment = {
  paymentEnd: number;
  paymentStart: number;
  sliderEnd: number;
  sliderStart: number;
};

const SCORE_BASE = 500;
const SCORE_CLUE_BONUS = 20;
const SCORE_MISTAKE_PENALTY = 50;
const SCORE_MINIMUM = 100;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function levelMaxScoreFor(level: Pick<LevelData, "fields">) {
  return SCORE_BASE + level.fields.length * SCORE_CLUE_BONUS;
}

function levelScoreFor(level: Pick<LevelData, "fields">, foundClues: number, mistakes: number) {
  const boundedClues = clamp(foundClues, 0, level.fields.length);
  return Math.max(SCORE_MINIMUM, SCORE_BASE + boundedClues * SCORE_CLUE_BONUS - mistakes * SCORE_MISTAKE_PENALTY);
}

function scoreWithMax(score: number, maxScore: number) {
  return `${formatNumber(score)}/${formatNumber(maxScore)}점`;
}

function foxTierFor(score: number, maxScore: number) {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  return [...FOX_TIERS].reverse().find((tier) => ratio >= tier.minRatio) ?? FOX_TIERS[0];
}

function paymentFocusRuleForIncome(income: number) {
  return PAYMENT_FOCUS_RULES.find((rule) => income >= rule.minIncome) ?? PAYMENT_FOCUS_RULES[PAYMENT_FOCUS_RULES.length - 1];
}

function buildPaymentSliderSegments(income: number, targetPayment: number) {
  const safeIncome = Math.max(0, income);
  if (safeIncome <= 0) {
    return [{ paymentStart: 0, paymentEnd: 0, sliderStart: 0, sliderEnd: PAYMENT_SLIDER_MAX }];
  }

  const safeTarget = clamp(targetPayment, 0, safeIncome);
  const focusRule = paymentFocusRuleForIncome(safeIncome);
  const focusRangeRatio = focusRule.rangeRatio;
  const focusSliderShare = focusRule.sliderShare;
  const focusStart = clamp(safeTarget * (1 - focusRangeRatio), 0, safeIncome);
  const focusEnd = Math.max(focusStart, clamp(safeTarget * (1 + focusRangeRatio), 0, safeIncome));
  const lowPaymentEnd = Math.min(LOW_PAYMENT_COMPACT_LIMIT, focusStart);
  const targetLivingExpense = Math.max(0, safeIncome - safeTarget);
  const highPaymentStart = Math.max(
    focusEnd,
    clamp(safeIncome - targetLivingExpense * LOW_LIVING_EXPENSE_RATIO, 0, safeIncome),
  );
  const rawSegments = [
    { paymentStart: 0, paymentEnd: lowPaymentEnd, sliderWeight: LOW_PAYMENT_SLIDER_WEIGHT, isFocus: false },
    { paymentStart: lowPaymentEnd, paymentEnd: focusStart, sliderWeight: BEFORE_FOCUS_SLIDER_WEIGHT, isFocus: false },
    { paymentStart: focusStart, paymentEnd: focusEnd, sliderWeight: focusSliderShare, isFocus: true },
    { paymentStart: focusEnd, paymentEnd: highPaymentStart, sliderWeight: AFTER_FOCUS_SLIDER_WEIGHT, isFocus: false },
    { paymentStart: highPaymentStart, paymentEnd: safeIncome, sliderWeight: HIGH_PAYMENT_SLIDER_WEIGHT, isFocus: false },
  ].filter((segment) => segment.paymentEnd - segment.paymentStart > 0.001);
  const hasFocus = rawSegments.some((segment) => segment.isFocus);
  const otherWeightTotal = rawSegments
    .filter((segment) => !segment.isFocus)
    .reduce((sum, segment) => sum + segment.sliderWeight, 0);
  const totalWeight = rawSegments.reduce((sum, segment) => sum + segment.sliderWeight, 0);
  let sliderCursor = 0;

  return rawSegments.map<PaymentSliderSegment>((segment) => {
    const sliderWeight =
      hasFocus && otherWeightTotal > 0
        ? segment.isFocus
          ? focusSliderShare
          : (segment.sliderWeight / otherWeightTotal) * (PAYMENT_SLIDER_MAX - focusSliderShare)
        : (segment.sliderWeight / totalWeight) * PAYMENT_SLIDER_MAX;
    const sliderStart = sliderCursor;
    const sliderEnd = sliderCursor + sliderWeight;
    sliderCursor = sliderEnd;

    return {
      paymentStart: segment.paymentStart,
      paymentEnd: segment.paymentEnd,
      sliderStart,
      sliderEnd,
    };
  });
}

function sliderMaxForIncome() {
  return PAYMENT_SLIDER_MAX;
}

function paymentToSlider(monthlyPayment: number, income: number, targetPayment: number) {
  const safePayment = clamp(monthlyPayment, 0, Math.max(0, income));
  const segments = buildPaymentSliderSegments(income, targetPayment);
  const segment = segments.find((item) => safePayment <= item.paymentEnd) ?? segments[segments.length - 1];
  if (!segment || segment.paymentEnd === segment.paymentStart) return 0;

  const ratio = (safePayment - segment.paymentStart) / (segment.paymentEnd - segment.paymentStart);
  return clamp(segment.sliderStart + ratio * (segment.sliderEnd - segment.sliderStart), 0, PAYMENT_SLIDER_MAX);
}

function sliderToPayment(sliderValue: number, income: number, targetPayment: number) {
  const safeSliderValue = clamp(sliderValue, 0, PAYMENT_SLIDER_MAX);
  const segments = buildPaymentSliderSegments(income, targetPayment);
  const segment = segments.find((item) => safeSliderValue <= item.sliderEnd) ?? segments[segments.length - 1];
  if (!segment || segment.sliderEnd === segment.sliderStart) return 0;

  const ratio = (safeSliderValue - segment.sliderStart) / (segment.sliderEnd - segment.sliderStart);
  return round1(segment.paymentStart + ratio * (segment.paymentEnd - segment.paymentStart));
}

function loadStats(): StoredStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats;
    return { ...emptyStats, ...JSON.parse(raw) };
  } catch {
    return emptyStats;
  }
}

function saveStats(stats: StoredStats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function isCorrectValue(field: IntakeField, value: FieldValue | undefined) {
  if (field.type === "number") return Math.abs(Number(value) - Number(field.answer)) < 0.001;
  return value === field.answer;
}

function fieldsInScenarioOrder(level: LevelData) {
  if (level.narrative) {
    const screenOrder: ScreenName[] = ["소득", "가족", "주거", "채무현황", "재산", "특이사항", "급여가압류"];

    return [...level.fields].sort((first, second) => {
      const firstScreenOrder = screenOrder.indexOf(first.screen);
      const secondScreenOrder = screenOrder.indexOf(second.screen);
      const normalizedFirst = firstScreenOrder >= 0 ? firstScreenOrder : screenOrder.length;
      const normalizedSecond = secondScreenOrder >= 0 ? secondScreenOrder : screenOrder.length;

      if (normalizedFirst !== normalizedSecond) return normalizedFirst - normalizedSecond;
      return level.fields.findIndex((field) => field.key === first.key) - level.fields.findIndex((field) => field.key === second.key);
    });
  }

  const ordered: IntakeField[] = [];

  level.scenario.forEach((line) => {
    level.fields
      .filter((field) => fieldClue(field) === line)
      .forEach((field) => {
        if (!ordered.some((item) => item.key === field.key)) ordered.push(field);
      });
  });

  level.fields.forEach((field) => {
    if (!ordered.some((item) => item.key === field.key)) ordered.push(field);
  });

  return ordered;
}

function nextOpenFieldInOrder(level: LevelData, solved: Record<string, boolean>, orderedFields: IntakeField[], fallback: number) {
  const nextField = orderedFields.find((field) => !solved[field.key]);
  if (!nextField) return Math.min(fallback, level.fields.length - 1);

  const nextIndex = level.fields.findIndex((field) => field.key === nextField.key);
  return nextIndex >= 0 ? nextIndex : Math.min(fallback, level.fields.length - 1);
}

function fieldValueLabel(field: IntakeField, value: FieldValue = field.answer) {
  if (typeof value === "boolean") return value ? "있음" : "없음";
  if (field.key === "dependents" && typeof value === "number") {
    return `${formatNumber(value)}명 (${formatNumber(value + 1)}인 가구)`;
  }
  if (typeof value === "number") return isMoneyField(field) ? formatAmount(value) : `${formatNumber(value)}${fieldUnitLabel(field)}`;
  return value;
}

function numericAnswer(level: LevelData, key: string) {
  const value = level.fields.find((field) => field.key === key)?.answer;
  return typeof value === "number" ? value : 0;
}

function numericAnswers(level: LevelData, key: string) {
  return round1(
    level.fields
      .filter((field) => field.key === key || field.key.startsWith(`${key}.`))
      .reduce((sum, field) => sum + (typeof field.answer === "number" ? field.answer : 0), 0),
  );
}

function stringAnswer(level: LevelData, key: string) {
  const value = level.fields.find((field) => field.key === key)?.answer;
  return typeof value === "string" ? value : "";
}

function additionalLivingExpenseItems(level: LevelData): AdditionalLivingExpenseItem[] {
  if (level.level < 5) return [];

  const scenarioText = level.scenario.join(" ");
  const isPracticeCase = Boolean(level.narrative);
  const isSeoul = isPracticeCase
    ? stringAnswer(level, "residenceArea") === "서울"
    : stringAnswer(level, "residenceArea") === "서울" || scenarioText.includes("서울");
  const hasCollegeChild = isPracticeCase
    ? level.fields.some((field) => field.key.includes("collegeChild") && typeof field.answer === "number" && field.answer > 0)
    : scenarioText.includes("대학생");
  const medicalExpense = numericAnswer(level, "medicalExpense");
  const dependents = numericAnswer(level, "dependents") || numericAnswers(level, "dependent");
  const isSingleHousehold = dependents === 0 && scenarioText.includes("미혼");

  return [
    {
      amount: 60,
      active: isSeoul,
      label: "주거비",
      value: `서울 최대 ${formatAmount(60)}`,
    },
    {
      amount: 30,
      active: hasCollegeChild,
      label: "교육비",
      value: `대학생 자녀 최대 ${formatAmount(30)}`,
    },
    {
      amount: medicalExpense,
      active: medicalExpense > 0,
      label: "의료비",
      value: `정기 지출 ${formatAmount(medicalExpense)}`,
    },
    {
      amount: 20,
      active: isSingleHousehold,
      label: "기타",
      value: `비혼 1인 가구 최대 ${formatAmount(20)}`,
    },
  ].filter((item) => item.active);
}

function fieldClue(field: IntakeField) {
  return field.clue ?? fieldValueLabel(field);
}

function clueMarkerLabel(field: IntakeField) {
  if (field.type === "choice") return String(field.answer);
  return fieldValueLabel(field);
}

function scenarioMarkerLabel(field: IntakeField, line: string) {
  const answerLabel = clueMarkerLabel(field);
  const prefixedMoneyLabels: Record<string, string[]> = {
    deposit: ["보증금"],
    income: ["월"],
    jeonseDeposit: ["전세보증금"],
    medicalExpense: ["모친 병원비로 매월"],
    monthlyRent: ["월세"],
    securedDebt: ["주택담보대출은", "차량담보대출은", "전세담보대출은", "담보채무는"],
    securedPayment: ["매월"],
    unsecuredDebt: ["신용채무는"],
    vehicleValue: ["차량 추정 시세는"],
    homeValue: ["집 추정 시세는"],
  };

  const prefixedLabel = prefixedMoneyLabels[field.key]
    ?.map((prefix) => `${prefix} ${answerLabel}`)
    .find((label) => line.includes(label));
  if (prefixedLabel) return prefixedLabel;

  if ((field.key === "unsecuredDebt" || field.key === "securedDebt") && line.includes(fieldClue(field))) {
    return fieldClue(field).replace(/\.$/, "");
  }

  if (field.key === "dependents" || field.key.startsWith("dependent.")) {
    if (Number(field.answer) === 0 && line.includes("미혼")) return "미혼";
    const dependentPhrase = line.split("을 부양")[0]?.split("를 부양")[0]?.trim();
    if (dependentPhrase && dependentPhrase !== line) return dependentPhrase;
    if (line.includes(field.label)) return field.label;
  }

  if (field.key === "housingType") {
    const rentMatch = line.match(/월세\s[\d,]+천원/);
    if (rentMatch) return rentMatch[0];
    const jeonseMatch = line.match(/전세보증금\s[\d,]+천원/);
    if (jeonseMatch) return jeonseMatch[0];
    if (line.includes("보증금")) return "보증금";
  }

  if (field.key === "hasVehicle" && line.includes("차량")) {
    if (line.includes("본인 명의 차량")) return "본인 명의 차량";
    if (line.includes("차량 한 대")) return "차량 한 대";
    return "차량";
  }

  if (field.key === "homeOwned" && line.includes("본인 명의 집")) {
    return "본인 명의 집";
  }

  if (field.key === "homeOwned" && line.includes("공동명의 집")) {
    return "공동명의 집";
  }

  if (field.key === "debtReason") {
    const reasonMarkers = [
      "배우자 퇴직 이후 생활비",
      "생활비와 모친 병원비 부담",
      "폐업 이후 운영자금 대출",
      "급여가 줄어든 뒤",
      "대학생 자녀 등록금",
    ];
    const reasonMarker = reasonMarkers.find((marker) => line.includes(marker));
    if (reasonMarker) return reasonMarker;
  }

  if (field.key === "wageGarnishment" && line.includes("급여")) {
    if (line.includes("급여가 압류")) return "급여가 압류";
    return "급여";
  }

  if (field.key === "securedDebt" && Number(field.answer) === 0 && line.includes("담보채무")) {
    return "담보채무";
  }

  if (line.includes(answerLabel)) return answerLabel;

  const clue = fieldClue(field);
  if (clue === line) return line.replace(/\.$/, "");
  if (line.includes(clue)) return clue.replace(/\.$/, "");
  return answerLabel;
}

function allIndexesOf(text: string, query: string) {
  const indexes: number[] = [];
  if (!query) return indexes;

  let index = text.indexOf(query);
  while (index >= 0) {
    indexes.push(index);
    index = text.indexOf(query, index + query.length);
  }

  return indexes;
}

function markerIndexInContext(text: string, label: string, context?: string) {
  if (!label) return -1;

  if (context) {
    const contextIndex = text.indexOf(context);
    const labelIndexInContext = context.indexOf(label);
    if (contextIndex >= 0 && labelIndexInContext >= 0) {
      return contextIndex + labelIndexInContext;
    }

    const labelIndexes = allIndexesOf(text, label);
    const contextEnd = contextIndex >= 0 ? contextIndex + context.length : -1;
    const labelInsideContext = labelIndexes.find((index) => index >= contextIndex && index < contextEnd);
    if (labelInsideContext !== undefined) return labelInsideContext;
  }

  return text.indexOf(label);
}

function scenarioMarkerIndex(field: IntakeField, line: string, label: string) {
  return markerIndexInContext(line, label, fieldClue(field));
}

function scenarioDecoyMarkerIndex(decoy: DecoyClue, line: string) {
  return markerIndexInContext(line, decoy.label, decoy.clue);
}

function isCorrectClue(field: IntakeField, selectedClue: FieldValue | undefined) {
  return String(selectedClue ?? "") === fieldClue(field);
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

function levelSelectClueCount(item: LevelData) {
  return item.fields.filter((field) => field.key !== "housingType").length;
}

function fieldHint(field: IntakeField) {
  if (field.key.startsWith("dependent.")) {
    return [
      `${field.screen} 화면의 ${field.label} 항목입니다.`,
      "부양가족으로 인정되는 사람의 단서만 터치하세요. 소득이 있거나 별도 산정 대상이 아닌 가족은 선택하지 않습니다.",
    ].join("\n");
  }

  if (field.key.startsWith("unsecuredDebt.")) {
    return [
      `${field.screen} 화면의 ${field.label} 항목입니다.`,
      "신용채무에 해당하는 개별 채무 금액 단서를 터치하세요. 여러 채무는 각각 찾아 합산합니다.",
    ].join("\n");
  }

  if (field.key.startsWith("securedDebt.")) {
    return [
      `${field.screen} 화면의 ${field.label} 항목입니다.`,
      "담보채무에 해당하는 개별 채무 금액 단서를 터치하세요. 신용채무와 구분해서 확인합니다.",
    ].join("\n");
  }

  if (field.key.startsWith("securedPayment.")) {
    return [
      `${field.screen} 화면의 ${field.label} 항목입니다.`,
      "담보대출 원리금이나 이자처럼 월 소득에서 먼저 차감되는 금액 단서를 터치하세요.",
    ].join("\n");
  }

  const hints: Record<string, string> = {
    income: "월 소득을 말한 단서 텍스트를 직접 터치하세요.",
    dependents: "부양하고 있는 가족을 설명한 단서 텍스트를 터치하세요. 본인은 부양가족 수에 넣지 않습니다.",
    debt: "빚 또는 채무 총액을 말한 금액 단서를 터치하세요.",
    overdueDays: "며칠째 연체 중인지 말한 일수 단서를 터치하세요.",
    housingType: "보증금, 월세, 전세보증금처럼 주거형태를 알 수 있는 단서를 터치하세요.",
    deposit: "보증금 금액 단서를 터치하세요.",
    monthlyRent: "월세 금액 단서를 터치하세요.",
    jeonseDeposit: "전세보증금 금액 단서를 터치하세요.",
    medicalExpense: "병원비처럼 매월 추가로 지출되는 특이사항 금액 단서를 터치하세요.",
    unsecuredDebt: "신용채무 금액 단서를 터치하세요.",
    securedDebt: "담보채무 금액 또는 담보채무 없음 단서를 터치하세요.",
    securedPayment: "담보대출 원리금 또는 차량 할부금 단서를 터치하세요.",
    hasVehicle: "차량 보유 여부를 알 수 있는 단서를 터치하세요.",
    vehicleValue: "차량 추정 시세 단서를 터치하세요.",
    homeOwned: "본인 명의 집에 거주한다는 단서를 터치하세요.",
    homeValue: "집 추정 시세 단서를 터치하세요.",
    residenceArea: "거주지역을 말한 단서 텍스트를 터치하세요.",
    depositAsset: "예금 보유액 단서를 터치하세요.",
    wageGarnishment: "급여압류 여부를 알 수 있는 단서를 터치하세요.",
  };

  return [
    `${field.screen} 화면의 ${field.label} 항목입니다.`,
    hints[field.key] ?? "시나리오 문장 안에서 같은 항목의 단서 텍스트를 터치하세요.",
  ].join("\n");
}

function practiceFieldHint(field: IntakeField, level: LevelData) {
  if (!level.narrative) return fieldHint(field);

  const notes: string[] = [];

  if (field.screen === "가족") {
    notes.push("인정 부양가족만 선택합니다. 소득으로 생활하는 가족, 이혼한 배우자처럼 제외 사유가 있는 사람은 누르지 않습니다.");
  }

  if (field.screen === "채무현황") {
    notes.push("신용채무, 담보채무, 담보 원리금은 서로 역할이 다릅니다. 월납부액 산정 대상은 신용채무이고, 담보 원리금이나 이자는 남은소득 계산에만 반영합니다.");
  }

  if (field.screen === "특이사항") {
    notes.push("추가인정 생활비로 반영되는 정기 지출 단서만 확인합니다.");
  }

  if (field.screen === "주거") {
    notes.push("지역, 보증금, 월세, 전세보증금은 각각 다른 단서입니다. 한 문장 안에 여러 값이 함께 나올 수 있습니다.");
  }

  if (field.screen === "재산") {
    notes.push("차량, 주택, 지분, 시세처럼 재산 판단에 필요한 단서를 구분해 누릅니다.");
  }

  return [fieldHint(field), ...(notes.length > 0 ? ["", "실전 포인트", ...notes] : [])].join("\n");
}

function fieldAnswerText(field: IntakeField) {
  const clue = fieldClue(field);
  const marker = scenarioMarkerLabel(field, clue);

  return [
    `선택할 텍스트: ${marker}`,
    `정리값: ${field.label} ${fieldValueLabel(field)}`,
    `시나리오 문장: ${clue}`,
  ].join("\n");
}

function supportHint(level: LevelData) {
  const overdueDays = numericAnswer(level, "overdueDays");
  const baseHint = [
    `현재 문항 연체일수: ${formatNumber(overdueDays)}일`,
    "30일 이하 = 신속채무조정",
    "31~89일 = 사전채무조정",
    "90일 이상 = 개인워크아웃",
  ];

  if (!level.narrative) return baseHint.join("\n");

  return [
    ...baseHint,
    "",
    "실전 포인트",
    "지원구분은 연체일수만 먼저 봅니다.",
    "가족 수, 채무 금액, 담보 여부는 월납부액과 상환기간 계산 단계에서 반영합니다.",
  ].join("\n");
}

function missionHint(calculation: CalculationResult, level: LevelData) {
  const overdueDays = numericAnswer(level, "overdueDays");
  const supportMeta = supportOptionMeta(calculation.supportType);
  const usesSecuredDeduction = hasSecuredIncomeDeduction({
    income: calculation.income,
    repaymentBaseIncome: calculation.repaymentBaseIncome,
    securedPayment: calculation.securedPayment,
  });
  const incomeLabel = usesSecuredDeduction ? "남은소득" : "소득";
  const livingLines =
    level.level >= 5
      ? [
          `MAX 생활비: 최저생계비(${calculation.householdMembers}인 가구) x 150% = ${formatAmount(calculation.maxLivingExpense)}`,
          ...(calculation.additionalLivingExpense > 0
            ? [
                `추가인정 생활비: ${formatAmount(calculation.additionalLivingExpense)}`,
                `반영 생활비: ${formatAmount(calculation.maxLivingExpense)} + ${formatAmount(calculation.additionalLivingExpense)} = ${formatAmount(calculation.recognizedMaxLivingExpense)}`,
              ]
            : []),
        ]
      : [];

  return [
    "1. 지원구분: 연체일수 기준",
    `${formatNumber(overdueDays)}일 → ${calculation.supportType}`,
    "",
    "2. 월납부액: 10천원 단위로 반올림하여 산출",
    usesSecuredDeduction
      ? `남은소득: 총 소득 ${formatAmount(calculation.income)} - 담보 원리금 ${formatAmount(calculation.securedPayment)} = ${formatAmount(calculation.repaymentBaseIncome)}`
      : `소득: ${formatAmount(calculation.income)}`,
    ...livingLines,
    `${incomeLabel} ${formatAmount(calculation.repaymentBaseIncome)} - 생활비 ${formatAmount(calculation.adjustedLivingExpense)} = 월납부액 ${formatAmount(calculation.monthlyPayment)}`,
    "",
    "3. 최대 상환기간 월납부액",
    `${calculation.supportType}: ${supportMeta.detail}`,
    repaymentPeriodFormulaText(calculation),
    ...(level.narrative
      ? [
          "",
          "실전 정리",
          "인정 부양가족만 가구수에 반영합니다.",
          "대상채무는 신용채무 합계입니다.",
          "담보 원리금이나 이자는 남은소득 계산에서 먼저 차감합니다.",
          "원리금상환 방식은 이자율을 반영해 상환기간을 계산합니다.",
        ]
      : []),
  ].join("\n");
}

function missionAnswerText(calculation: CalculationResult) {
  return [
    `지원구분: ${calculation.mission.supportType}`,
    `월납부액: ${formatAmount(calculation.mission.monthlyPayment)}`,
    `상환기간: ${calculation.mission.repaymentPeriod}개월`,
    `생활비: ${formatAmount(calculation.adjustedLivingExpense)}`,
  ].join("\n");
}

function repaymentPeriodFormulaText(calculation: CalculationResult) {
  if (calculation.annualInterestRate > 0) {
    return `${formatAmount(calculation.targetDebt)} ${calculation.maxRepaymentMonths}개월 원리금 분할\n= 월 ${formatAmount(calculation.monthlyPayment)}`;
  }

  return `${formatAmount(calculation.targetDebt)} ${calculation.maxRepaymentMonths}개월 원금 분할\n= 월 ${formatAmount(calculation.monthlyPayment)}`;
}

function supportOptionMeta(option: string) {
  const labels: Record<string, { detail: string; title: string }> = {
    신속채무조정: { detail: "원리금상환, 이자율 11%(가정)", title: "신속채무조정" },
    사전채무조정: { detail: "원리금상환, 이자율 6%(가정)", title: "사전채무조정" },
    개인워크아웃: { detail: "원금상환", title: "개인워크아웃" },
  };

  return labels[option] ?? { detail: "", title: option };
}

function resultSupportTypeLabel(option: string) {
  const noteBySupportType: Record<string, string> = {
    신속채무조정: "평균 이자 11% 가정",
    사전채무조정: "평균 이자 6% 가정",
  };
  const note = noteBySupportType[option];
  if (!note) return option;

  return (
    <>
      {option}
      <small className="support-rate-note">({note})</small>
    </>
  );
}

function supportTermsFor(option: string, fallback: CalculationResult) {
  const terms: Record<string, { annualInterestRate: number; maxRepaymentMonths: number }> = {
    신속채무조정: { annualInterestRate: 0.11, maxRepaymentMonths: 120 },
    사전채무조정: { annualInterestRate: 0.06, maxRepaymentMonths: 120 },
    개인워크아웃: { annualInterestRate: 0, maxRepaymentMonths: 96 },
  };

  return terms[option] ?? {
    annualInterestRate: fallback.annualInterestRate,
    maxRepaymentMonths: fallback.maxRepaymentMonths,
  };
}

function App() {
  const [stats, setStats] = useState<StoredStats>(() => loadStats());
  const [screen, setScreen] = useState<Screen>("start");
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [openTutorialSection, setOpenTutorialSection] = useState(-1);
  const [tutorialExample, setTutorialExample] = useState<{ sectionKey: string; chip: string } | null>(null);
  const [selectedLevel, setSelectedLevel] = useState(() => Math.min(stats.clearedLevel, LEVELS.length - 1));
  const [lastLevelTap, setLastLevelTap] = useState<{ index: number; time: number } | null>(null);
  const [levelIndex, setLevelIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("scenario");
  const [activeFieldIndex, setActiveFieldIndex] = useState(0);
  const [draftValue, setDraftValue] = useState<FieldValue>("");
  const [groupDraft, setGroupDraft] = useState<Record<string, FieldValue>>({});
  const [answers, setAnswers] = useState<Record<string, FieldValue>>({});
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState("");
  const [wrongAttempts, setWrongAttempts] = useState<Record<string, number>>({});
  const [assist, setAssist] = useState<AssistState | null>(null);
  const [showAssistAnswer, setShowAssistAnswer] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [levelMistakes, setLevelMistakes] = useState(0);
  const [results, setResults] = useState<LevelResult[]>([]);
  const [sessionScore, setSessionScore] = useState(0);
  const [missionDraft, setMissionDraft] = useState<MissionDraft>({
    supportType: "",
    monthlyPayment: "",
    repaymentPeriod: "",
  });
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calculatorDraft, setCalculatorDraft] = useState<CalculatorDraft>({
    principal: "",
    annualRate: "",
    months: "",
  });
  const [repaymentDraft, setRepaymentDraft] = useState<number | null>(null);
  const [tutorialPayment, setTutorialPayment] = useState(50);
  const [tutorialMiniPayment, setTutorialMiniPayment] = useState(250);
  const [missionPage, setMissionPage] = useState<0 | 1>(0);
  const [homeChoiceOpen, setHomeChoiceOpen] = useState(false);
  const [reviewResult, setReviewResult] = useState<LevelResult | null>(null);
  const [showAllClues, setShowAllClues] = useState(false);
  const [clueFilterScreen, setClueFilterScreen] = useState<string | null>(null);
  const [lastClueScreen, setLastClueScreen] = useState<string | null>(null);
  const [livingDependentsDraft, setLivingDependentsDraft] = useState<number | null>(null);
  const [scorePopupOpen, setScorePopupOpen] = useState(false);
  const [tierPopupOpen, setTierPopupOpen] = useState(false);
  const [clueReviewOpen, setClueReviewOpen] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [autoSolvedClueCount, setAutoSolvedClueCount] = useState(0);
  const previousAllCluesFoundRef = useRef(false);
  const supportSelectionButtonRef = useRef<HTMLButtonElement | null>(null);

  const level = practiceMode ? PRACTICE_LEVELS[practiceIndex] ?? PRACTICE_LEVELS[0] : LEVELS[levelIndex];
  const calculation = useMemo(() => calculateLevel(level), [level]);
  const expectedLivingDependents = Math.max(0, calculation.householdMembers - 1);
  const defaultLivingDependents = practiceMode ? 0 : Math.max(0, calculation.householdMembers - 1);
  const livingDependents = livingDependentsDraft ?? defaultLivingDependents;
  const livingBasis = useMemo(() => livingExpenseBasisForDependents(livingDependents), [livingDependents]);
  const matchesLivingDependents = livingBasis.dependents === expectedLivingDependents;
  const extraLivingItems = useMemo(() => additionalLivingExpenseItems(level), [level]);
  const additionalLivingExpense = useMemo(
    () => round1(extraLivingItems.reduce((sum, item) => sum + item.amount, 0)),
    [extraLivingItems],
  );
  const recognizedMaxLivingExpense = round1(livingBasis.maxLivingExpense + additionalLivingExpense);
  const calculatorResult = useMemo(() => {
    const principal = normalizeNumber(calculatorDraft.principal) / MONEY_INPUT_SCALE;
    const annualRate = normalizeNumber(calculatorDraft.annualRate);
    const months = Math.floor(normalizeNumber(calculatorDraft.months));

    if (
      !Number.isFinite(principal) ||
      !Number.isFinite(annualRate) ||
      !Number.isFinite(months) ||
      principal <= 0 ||
      annualRate < 0 ||
      months <= 0
    ) {
      return null;
    }

    const monthlyRate = annualRate / 100 / 12;
    const monthlyPayment = paymentForMonths(principal, months, monthlyRate);
    const totalPayment = monthlyPayment * months;

    return {
      monthlyPayment: Math.round(monthlyPayment),
      totalPayment: round1(totalPayment),
      interestPayment: round1(Math.max(0, totalPayment - principal)),
    };
  }, [calculatorDraft]);
  const repaymentModel = useMemo(() => {
    const selectedSupportType = missionDraft.supportType || calculation.supportType;
    const selectedTerms = supportTermsFor(selectedSupportType, calculation);
    const monthlyInterestRate = selectedTerms.annualInterestRate / 12;
    const maxPayment = Math.max(0, Math.round(calculation.repaymentBaseIncome));
    const defaultMonthlyPayment = Math.round(calculation.repaymentBaseIncome / 2);
    const monthlyPayment = Math.max(0, Math.min(maxPayment, repaymentDraft ?? defaultMonthlyPayment));
    const livingExpense = Math.max(0, calculation.repaymentBaseIncome - monthlyPayment);
    const rawRepaymentMonths = repaymentMonthsForPayment(
      calculation.targetDebt,
      monthlyPayment,
      monthlyInterestRate,
    );
    const roundedRequiredPayment = Math.round(
      paymentForMonths(calculation.targetDebt, selectedTerms.maxRepaymentMonths, monthlyInterestRate),
    );
    const targetPayment =
      selectedSupportType === calculation.mission.supportType
        ? calculation.mission.monthlyPayment
        : roundedRequiredPayment;
    const isMissionMaxPeriodAnswer =
      selectedSupportType === calculation.mission.supportType &&
      calculation.cappedByMaxPeriod &&
      monthlyPayment === calculation.mission.monthlyPayment;
    const acceptsRoundedMaxPeriod =
      isMissionMaxPeriodAnswer ||
      (
        rawRepaymentMonths !== null &&
        rawRepaymentMonths > selectedTerms.maxRepaymentMonths &&
        monthlyPayment === roundedRequiredPayment
      );
    const exceedsMaxPeriod =
      rawRepaymentMonths !== null &&
      rawRepaymentMonths > selectedTerms.maxRepaymentMonths &&
      !acceptsRoundedMaxPeriod;
    const cannotCalculatePeriod = rawRepaymentMonths === null || exceedsMaxPeriod;
    const repaymentPeriod = acceptsRoundedMaxPeriod
      ? selectedTerms.maxRepaymentMonths
      : rawRepaymentMonths !== null && rawRepaymentMonths <= selectedTerms.maxRepaymentMonths
        ? rawRepaymentMonths
        : null;
    const periodLabel = repaymentPeriod
      ? `${repaymentPeriod}개월`
      : "계산불가";
    const cappedByMaxPeriod = acceptsRoundedMaxPeriod;
    const feedbackCannotCalculate = rawRepaymentMonths === null
      ? "월납부액이 낮아 상환기간 계산이 어렵습니다. 월납부액을 늘려주세요."
      : "최대 상환기간 안에 들어오지 않습니다. 월납부액을 늘려주세요.";
    const sliderMax = sliderMaxForIncome();
    const sliderValue = paymentToSlider(monthlyPayment, calculation.repaymentBaseIncome, targetPayment);
    const paymentRatio = sliderMax > 0 ? (sliderValue / sliderMax) * 100 : 0;
    const minimumLivingExpenseLimit = livingBasis.minimumLivingExpense * MIN_LIVING_EXPENSE_RATIO;
    const feedbackState =
      livingExpense <= minimumLivingExpenseLimit
        ? "danger"
        : livingExpense > recognizedMaxLivingExpense || cannotCalculatePeriod || exceedsMaxPeriod
          ? "notice"
          : "ok";
    const feedback =
      livingExpense <= minimumLivingExpenseLimit
        ? "생활비가 부족합니다. 최저 생활비 90% 이하입니다. 생활비를 늘려주세요."
          : livingExpense > recognizedMaxLivingExpense
            ? "최대 생활비를 초과합니다. 월납부액을 늘려주세요."
            : cannotCalculatePeriod
              ? feedbackCannotCalculate
              : `생활비 ${formatAmount(livingExpense)}을 확보했습니다. 남은 ${formatAmount(monthlyPayment)}을 월납부액으로 산정할 수 있습니다.`;

    return {
      cappedByMaxPeriod,
      cannotCalculatePeriod,
      exceedsMaxPeriod,
      feedback,
      feedbackState,
      livingExpense,
      maxPayment,
      monthlyPayment,
      paymentRatio,
      periodLabel,
      repaymentPeriod,
      sliderMax,
      sliderValue,
      targetPayment,
    };
  }, [calculation, livingBasis, missionDraft.supportType, recognizedMaxLivingExpense, repaymentDraft]);
  const activeField = level.fields[activeFieldIndex];
  const groupedScreenFields =
    activeField ? level.fields.filter((field) => field.screen === activeField.screen) : [];
  const usesGroupedScreen = groupedScreenFields.length > 1;
  const allCluesFound = level.fields.every((field) => solved[field.key]);

  useEffect(() => {
    const justCompleted = allCluesFound && !previousAllCluesFoundRef.current;
    previousAllCluesFoundRef.current = allCluesFound;

    if (!justCompleted || screen !== "game" || phase !== "scenario" || reviewResult) return;

    requestAnimationFrame(() => {
      supportSelectionButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [allCluesFound, phase, reviewResult, screen]);

  const activeAttemptCount = wrongAttempts[activeField?.key] ?? 0;
  const phaseStep = phase === "scenario" ? 1 : phase === "intake" ? 2 : phase === "mission" ? 3 + missionPage * 0.5 : 4;
  const totalCaseCount = practiceMode ? PRACTICE_LEVELS.length : LEVELS.length;
  const currentCaseIndex = practiceMode ? practiceIndex : levelIndex;
  const phaseProgressWidth = ((currentCaseIndex + phaseStep / 4) / totalCaseCount) * 100;
  const scenarioOrderedFields = useMemo(() => fieldsInScenarioOrder(level), [level]);
  const scenarioActiveField = scenarioOrderedFields.find((field) => !solved[field.key]) ?? activeField;

  const orderedScreenNames = useMemo(() => {
    const ordered: string[] = [];

    scenarioOrderedFields.forEach((field) => {
      if (!ordered.includes(field.screen)) ordered.push(field.screen);
    });

    level.systemScreens.forEach((screenName) => {
      if (!ordered.includes(screenName)) ordered.push(screenName);
    });

    return ordered;
  }, [level, scenarioOrderedFields]);

  const screenProgress = useMemo(() => {
    return orderedScreenNames.map((screenName) => {
      const fields = level.fields.filter((field) => field.screen === screenName);
      const total = fields.length || 1;
      const done = fields.filter((field) => solved[field.key]).length;
      return { screenName, done, total };
    });
  }, [level, orderedScreenNames, solved]);
  const foundClueCount = useMemo(() => level.fields.filter((field) => solved[field.key]).length, [level, solved]);
  const scoredClueCount = Math.max(0, foundClueCount - autoSolvedClueCount);
  const maxLevelScore = levelMaxScoreFor(level);
  const currentLevelScore = levelScoreFor(level, scoredClueCount, levelMistakes);
  const currentStarCount = Math.max(1, Math.min(5, Math.ceil((currentLevelScore / maxLevelScore) * 5)));
  const hasCurrentSecuredIncomeDeduction = hasSecuredIncomeDeduction({
    income: calculation.income,
    repaymentBaseIncome: calculation.repaymentBaseIncome,
    securedPayment: calculation.securedPayment,
  });
  const resultMaxScore = results.reduce((sum, item) => sum + item.maxScore, 0);
  const resultTier = foxTierFor(sessionScore, resultMaxScore);
  const resultTierPercent = resultMaxScore > 0 ? Math.min(100, Math.round((sessionScore / resultMaxScore) * 100)) : 0;
  const canStartPractice = resultTier.name === "마스터여우";
  const isLastPracticeLevel = practiceIndex >= PRACTICE_LEVELS.length - 1;

  const activeScenarioTargets = useMemo(() => {
    const currentClue = scenarioActiveField ? fieldClue(scenarioActiveField) : "";
    const currentFields = scenarioOrderedFields.filter((field) => fieldClue(field) === currentClue);
    return currentFields.filter(Boolean);
  }, [scenarioActiveField, scenarioOrderedFields]);

  const screenClueGroups = useMemo(() => {
    return orderedScreenNames
      .map((screenName) => {
        const fields = level.fields.filter((field) => field.screen === screenName);
        const doneFields = fields.filter((field) => solved[field.key]);
        return { screenName, doneFields, total: fields.length };
      });
  }, [level, orderedScreenNames, solved]);

  const clueSummaryGroups = useMemo(
    () => screenClueGroups.filter((group) => group.doneFields.length > 0),
    [screenClueGroups],
  );

  const focusedClueGroups = useMemo(() => {
    if (clueSummaryGroups.length === 0) return [];

    const firstUnsolvedScreen = scenarioOrderedFields.find((field) => !solved[field.key])?.screen;
    const preferredGroup =
      clueSummaryGroups.find((group) => group.screenName === firstUnsolvedScreen) ??
      clueSummaryGroups.find((group) => group.screenName === "소득") ??
      clueSummaryGroups[0];

    return preferredGroup ? [preferredGroup] : [];
  }, [clueSummaryGroups, scenarioOrderedFields, solved]);

  const visibleClueGroups = useMemo(() => {
    if (showAllClues) return clueSummaryGroups;
    if (clueFilterScreen) return screenClueGroups.filter((group) => group.screenName === clueFilterScreen);
    if (lastClueScreen) return screenClueGroups.filter((group) => group.screenName === lastClueScreen);

    return focusedClueGroups;
  }, [clueFilterScreen, clueSummaryGroups, focusedClueGroups, lastClueScreen, screenClueGroups, showAllClues]);

  const scenarioPrompt = useMemo(() => {
    if (allCluesFound) return "모든 단서를 찾았습니다.";

    const labels = uniqueValues(activeScenarioTargets.filter((field) => !solved[field.key]).map((field) => field.label));
    const actionText = practiceMode ? "인정되는 단서만 누르세요." : "문장 속 단어를 누르세요.";
    if (labels.length === 0) return `${scenarioActiveField.screen} 단서를 찾아주세요. ${actionText}`;
    if (labels.length === 1) return `${labels[0]} 단서를 찾아주세요. ${actionText}`;
    return `${scenarioActiveField.screen} 단서를 찾아주세요. ${actionText}`;
  }, [activeScenarioTargets, allCluesFound, practiceMode, scenarioActiveField, solved]);

  const scenarioDisplayLines = useMemo(() => {
    return practiceMode ? [level.narrative ?? level.scenario.join(" ")] : level.scenario;
  }, [level.narrative, level.scenario, practiceMode]);

  const entryItems = useMemo(() => {
    const groupedScreens = new Set<string>();
    return scenarioOrderedFields.flatMap((field) => {
      const screenFields = level.fields.filter((item) => item.screen === field.screen);
      const index = level.fields.findIndex((item) => item.key === field.key);

      if (screenFields.length > 1) {
        if (groupedScreens.has(field.screen)) return [];
        groupedScreens.add(field.screen);
        return [{ key: `screen-${field.screen}`, label: field.screen, fields: screenFields, index, isGroup: true }];
      }

      return [{ key: field.key, label: field.label, fields: [field], index, isGroup: false }];
    });
  }, [level, scenarioOrderedFields]);

  function entryStatusLabel(item: { fields: IntakeField[]; isGroup: boolean }) {
    const doneFields = item.fields.filter((field) => solved[field.key]);

    if (doneFields.length !== item.fields.length) {
      return doneFields.length > 0 ? `${doneFields.length}/${item.fields.length}` : "대기";
    }

    return item.fields.map((field) => `${field.label} ${fieldValueLabel(field, answers[field.key] ?? field.answer)}`).join(" · ");
  }

  const levelGroups = useMemo(() => {
    return Array.from(new Set(LEVELS.map((item) => item.level))).map((groupLevel) => {
      const cases = LEVELS
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.level === groupLevel);

      return {
        cases,
        level: groupLevel,
        title: cases[0]?.item.title.replace(/\s\d-\d$/, "") ?? `LEVEL ${groupLevel}`,
      };
    });
  }, []);

  function resetLevelState(nextLevelIndex: number, nextPhase: Phase = "scenario") {
    setLevelIndex(nextLevelIndex);
    setPhase(nextPhase);
    setActiveFieldIndex(0);
    setDraftValue("");
    setGroupDraft({});
    setAnswers({});
    setSolved({});
    setFeedback("");
    setWrongAttempts({});
    setAssist(null);
    setShowAssistAnswer(false);
    setScenarioOpen(false);
    setLevelMistakes(0);
    setMissionDraft({
      supportType: "",
      monthlyPayment: "",
      repaymentPeriod: "",
    });
    setCalculatorOpen(false);
    setCalculatorDraft({
      principal: "",
      annualRate: "",
      months: "",
    });
    setRepaymentDraft(null);
    setMissionPage(0);
    setHomeChoiceOpen(false);
    setReviewResult(null);
    setShowAllClues(false);
    setClueFilterScreen(null);
    setLastClueScreen(null);
    setLivingDependentsDraft(null);
    setScorePopupOpen(false);
    setTierPopupOpen(false);
    setClueReviewOpen(false);
    setAutoSolvedClueCount(0);
  }

  function startRun(startIndex = selectedLevel) {
    setPracticeMode(false);
    setPracticeIndex(0);
    setResults([]);
    setSessionScore(0);
    setReviewResult(null);
    setTierPopupOpen(false);
    resetLevelState(startIndex);
    setScreen("game");
  }

  function startPracticeRun() {
    if (!canStartPractice) return;

    setPracticeMode(true);
    setPracticeIndex(0);
    setReviewResult(null);
    setTierPopupOpen(false);
    resetLevelState(0);
    setScreen("game");
  }

  function chooseLevelCase(index: number) {
    const now = Date.now();
    setSelectedLevel(index);

    if (lastLevelTap?.index === index && now - lastLevelTap.time < 520) {
      setLastLevelTap(null);
      startRun(index);
      return;
    }

    setLastLevelTap({ index, time: now });
  }

  function resetStoredStats() {
    saveStats(emptyStats);
    setStats(emptyStats);
    setSelectedLevel(0);
    setLastLevelTap(null);
  }

  function prepareField(index: number) {
    const field = level.fields[index];
    const screenFields = level.fields.filter((item) => item.screen === field.screen);
    setActiveFieldIndex(index);
    setDraftValue(answers[field.key] !== undefined ? fieldClue(field) : "");
    setGroupDraft(
      screenFields.length > 1
        ? Object.fromEntries(screenFields.map((item) => [item.key, answers[item.key] !== undefined ? fieldClue(item) : ""]))
        : {},
    );
    setFeedback("");
  }

  function openAssist(nextAssist: AssistState) {
    setAssist(nextAssist);
    setShowAssistAnswer(false);
  }

  function openRepaymentCalculator() {
    setCalculatorDraft({
      principal: "0",
      annualRate: "0",
      months: "0",
    });
    setCalculatorOpen(true);
  }

  function setDraftForField(field: IntakeField, value: FieldValue) {
    const nextValue = value === field.answer ? fieldClue(field) : String(value);

    if (groupedScreenFields.some((item) => item.key === field.key)) {
      setGroupDraft((current) => ({ ...current, [field.key]: nextValue }));
      return;
    }

    setDraftValue(nextValue);
  }

  function fieldTitle(field: IntakeField) {
    if (usesGroupedScreen) return groupedScreenFields.map((item) => item.label).join(" · ");

    return field.label;
  }

  function renderQuickActions() {
    const showClueReviewButton = phase === "mission";

    return (
      <div className={`quick-actions embedded-actions ${showClueReviewButton ? "has-clue-review" : ""}`}>
        {showClueReviewButton && (
          <button onClick={() => setClueReviewOpen(true)} type="button">
            <Eye size={17} aria-hidden="true" />
            찾은 단서
          </button>
        )}
        <button onClick={() => setScenarioOpen(true)} type="button">
          <ClipboardList size={17} aria-hidden="true" />
          시나리오
        </button>
        <button
          onClick={() => {
            if (phase === "mission") {
              showMissionAssist(missionPage === 0 ? wrongAttempts.supportType ?? 0 : wrongAttempts.mission ?? 0);
            } else if (phase === "intake") {
              showFieldAssist(activeField, activeAttemptCount);
            } else {
              openAssist({
                title: "답안 확인",
                body: "최종미션을 제출한 뒤 계산 결과를 확인하는 화면입니다. 지원구분, 생활비, 월납부액, 상환기간 산식을 함께 봅니다.",
              });
            }
          }}
          type="button"
        >
          <HelpCircle size={17} aria-hidden="true" />
          힌트
        </button>
      </div>
    );
  }

  function selectGroupedClue(clue: string) {
    const matchedFields = groupedScreenFields.filter((field) => fieldClue(field) === clue);

    setGroupDraft((current) => {
      const next = { ...current };

      if (matchedFields.length === 0) {
        next[WRONG_GROUP_CLUE_KEY] = clue;
        return next;
      }

      delete next[WRONG_GROUP_CLUE_KEY];
      matchedFields.forEach((field) => {
        next[field.key] = clue;
      });
      return next;
    });
  }

  function selectedClueSummary(field: IntakeField) {
    const selected = groupDraft[field.key] || "";
    return selected ? "선택됨" : "단서 선택";
  }

  function isScenarioClueSelected(clue: string) {
    if (usesGroupedScreen) {
      return (
        groupDraft[WRONG_GROUP_CLUE_KEY] === clue ||
        groupedScreenFields.some((field) => groupDraft[field.key] === clue)
      );
    }

    return draftValue === clue;
  }

  function scenarioFieldsForLine(line: string) {
    return level.fields.filter((field) => {
      const clue = fieldClue(field);
      if (clue === line || line.includes(clue)) return true;

      const markerLabel = scenarioMarkerLabel(field, line);
      return markerLabel.length > 0 && line.includes(markerLabel);
    });
  }

  function scenarioDecoysForLine(line: string) {
    return (level.decoys ?? []).filter((decoy) => line.includes(decoy.clue) || line.includes(decoy.label));
  }

  function isScenarioLineComplete(line: string) {
    const lineFields = scenarioFieldsForLine(line);
    return lineFields.length > 0 && lineFields.every((field) => solved[field.key]);
  }

  function handleScenarioDecoyTap(decoy: DecoyClue) {
    const targetField =
      activeScenarioTargets.find((field) => field.screen === decoy.screen && !solved[field.key]) ??
      activeScenarioTargets.find((field) => !solved[field.key]) ??
      activeField;
    const nextAttempts = (wrongAttempts[targetField.key] ?? 0) + 1;

    setWrongAttempts((current) => ({ ...current, [targetField.key]: nextAttempts }));
    setLevelMistakes((count) => count + 1);
    setFeedback(`${decoy.label}은(는) 선택하지 않는 단서입니다. ${decoy.reason}`);

    if (nextAttempts >= 2) {
      openAssist({
        title: "제외 단서",
        body: [
          `${decoy.label}은(는) 이번 문항에서 선택하지 않습니다.`,
          decoy.reason,
          "인정되는 부양가족 또는 현재 찾고 있는 접수 단서를 다시 확인하세요.",
        ].join("\n"),
      });
    }
  }

  function handleScenarioFieldsTap(fields: IntakeField[]) {
    const tappedScreen = fields[0]?.screen ?? null;
    if (tappedScreen) {
      setShowAllClues(false);
      setClueFilterScreen(tappedScreen);
      setLastClueScreen(tappedScreen);
    }

    const candidates = activeScenarioTargets.filter((field) => !solved[field.key]);

    if (level.fields.every((field) => solved[field.key])) {
      setFeedback("모든 단서를 확인했습니다. 지원구분을 선택하세요.");
      return;
    }

    const targetFields = fields.filter((field) =>
      candidates.some((candidate) => candidate.key === field.key) && !solved[field.key],
    );

    if (targetFields.length === 0) {
      const targetField = candidates[0] ?? activeField;
      const nextAttempts = (wrongAttempts[targetField.key] ?? 0) + 1;
      setWrongAttempts((current) => ({ ...current, [targetField.key]: nextAttempts }));
      setLevelMistakes((count) => count + 1);
      const practiceWrongMessage =
        practiceMode && targetField.screen === "가족"
          ? "지금은 인정되는 가족 단서를 찾는 단계입니다. 제외 가족은 누르지 마세요."
          : practiceMode && targetField.screen === "채무현황"
            ? "지금 찾는 채무현황 항목과 다른 단서입니다. 신용채무, 담보채무, 원리금을 구분하세요."
            : "지금 찾는 항목의 단서가 아니에요.";
      setFeedback(nextAttempts >= 2 ? "두 번 틀렸어요. 힌트창에서 정답 문장을 볼 수 있습니다." : practiceWrongMessage);
      showFieldAssist(targetField, nextAttempts);
      return;
    }

    const nextSolved = { ...solved };
    const nextAnswers = { ...answers };
    const nextAttempts = { ...wrongAttempts };

    targetFields.forEach((field) => {
      nextSolved[field.key] = true;
      nextAnswers[field.key] = field.answer;
      nextAttempts[field.key] = 0;
    });

    setAnswers(nextAnswers);
    setSolved(nextSolved);
    setWrongAttempts(nextAttempts);
    setFeedback(`${targetFields.map((field) => field.label).join(" · ")} 단서 확인 완료`);

    const nextIndex = nextOpenFieldInOrder(level, nextSolved, scenarioOrderedFields, activeFieldIndex + 1);
    setActiveFieldIndex(nextIndex);
    setDraftValue("");
    setGroupDraft({});
  }

  function renderScenarioMarker(fields: IntakeField[], label: string, mode: "inline" | "tail") {
    const markerKey = fields.map((field) => field.key).join("-");
    const isFound = fields.every((field) => solved[field.key]);

    return (
      <button
        className={`scenario-clue-marker is-${mode} ${isFound ? "is-found" : ""}`}
        key={markerKey}
        onClick={() => handleScenarioFieldsTap(fields)}
        type="button"
      >
        {label}
      </button>
    );
  }

  function renderScenarioDecoyMarker(decoy: DecoyClue, label: string, mode: "inline" | "tail") {
    return (
      <button
        className={`scenario-clue-marker is-${mode} is-decoy`}
        key={`decoy-${decoy.screen}-${label}-${decoy.clue}`}
        onClick={() => handleScenarioDecoyTap(decoy)}
        type="button"
      >
        {label}
      </button>
    );
  }

  function renderScenarioLine(line: string) {
    const fieldMarkers = scenarioFieldsForLine(line)
      .map((field) => {
        const label = scenarioMarkerLabel(field, line);
        return {
          decoy: undefined,
          field,
          fields: [field],
          index: scenarioMarkerIndex(field, line, label),
          label,
        };
      })
      .filter((marker) => marker.index >= 0)
      .reduce<Array<{ decoy?: DecoyClue; fields: IntakeField[]; index: number; label: string }>>((markers, marker) => {
        const existing = markers.find((item) => item.index === marker.index && item.label === marker.label);
        if (existing) {
          existing.fields.push(marker.field);
          return markers;
        }

        markers.push({ fields: marker.fields, index: marker.index, label: marker.label });
        return markers;
      }, []);
    const decoyMarkers = scenarioDecoysForLine(line)
      .map((decoy) => ({
        decoy,
        fields: [],
        index: scenarioDecoyMarkerIndex(decoy, line),
        label: decoy.label,
      }))
      .filter((marker) => marker.index >= 0);
    const lineMarkers = [...fieldMarkers, ...decoyMarkers]
      .sort((first, second) => first.index - second.index || second.label.length - first.label.length);
    const parts = [];
    let cursor = 0;

    lineMarkers.forEach((marker) => {
      const index = marker.index;
      if (index < cursor) return;

      if (index > cursor) {
        parts.push(line.slice(cursor, index));
      }

      parts.push(
        marker.decoy
          ? renderScenarioDecoyMarker(marker.decoy, marker.label, "inline")
          : renderScenarioMarker(marker.fields, marker.label, "inline"),
      );
      cursor = index + marker.label.length;
    });

    if (cursor < line.length) {
      parts.push(line.slice(cursor));
    }

    return (
      <p className="scenario-line-text">
        {parts}
      </p>
    );
  }

  function renderFoundClueGroups(groups: Array<{ screenName: string; doneFields: IntakeField[]; total: number }>) {
    return (
      <>
        {groups.map((group) => {
          return (
            <section className="found-clue-group" key={group.screenName}>
              <div className="found-group-head">
                <span>{group.screenName}</span>
                <strong>{group.doneFields.length}/{group.total}</strong>
              </div>

              <div className="found-group-list">
                {group.doneFields.length === 0 ? (
                  <div className="found-group-empty">
                    <small>{group.screenName}</small>
                    <em>찾은 단서 없음</em>
                  </div>
                ) : (
                  group.doneFields.map((field) => (
                    <div key={field.key}>
                      <small>{field.label}</small>
                      <em>{fieldValueLabel(field, answers[field.key] ?? field.answer)}</em>
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </>
    );
  }

  function renderFoundClueSummary() {
    if (clueSummaryGroups.length === 0 && !clueFilterScreen) return null;
    const isFiltered = clueFilterScreen !== null;
    const canShowAll = clueSummaryGroups.length > 1;

    return (
      <div
        className={`found-clue-summary ${isFiltered ? "is-filtered" : "is-all"} ${
          showAllClues ? "is-expanded" : "is-compact"
        }`}
        aria-label="찾은 단서 정리"
      >
        <div className="found-summary-head">
          <span>찾은 단서</span>
          {showAllClues ? (
            <button
              type="button"
              onClick={() => {
                setShowAllClues(false);
                setClueFilterScreen(null);
              }}
            >
              접기
            </button>
          ) : (
            canShowAll && (
            <button
              type="button"
              onClick={() => {
                setShowAllClues(true);
                setClueFilterScreen(null);
              }}
            >
              전체
            </button>
            )
          )}
        </div>

        {renderFoundClueGroups(visibleClueGroups)}
      </div>
    );
  }

  function renderTutorialVisual(visual: string) {
    if (visual === "flow") {
      return (
        <div className="tutorial-visual tutorial-flow">
          {["문항 선택", "단서 찾기", "지원구분", "최종미션"].map((item, index) => (
            <div key={item}>
              <span>{index + 1}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      );
    }

    if (visual === "scenario") {
      return (
        <div className="tutorial-visual tutorial-scenario tutorial-clue-demo">
          <div className="tutorial-clue-step">
            <p><span className="scenario-clue-marker is-found">월 2,500천원</span> 벌고 있습니다.</p>
            <label>
              <span>소득</span>
              <strong>월 소득 2,500천원</strong>
              <em>✓</em>
            </label>
          </div>
          <div className="tutorial-clue-step">
            <p><span className="scenario-clue-marker is-found">배우자와 자녀 1명</span>을 부양하고 있습니다.</p>
            <label>
              <span>가족</span>
              <strong>부양가족 2명 (3인 가구)</strong>
              <em>✓</em>
            </label>
          </div>
        </div>
      );
    }

    if (visual === "intake") {
      return (
        <div className="tutorial-visual tutorial-intake">
          <div>
            <span>소득</span>
            <small>1/1</small>
          </div>
          <div>
            <span>채무현황</span>
            <small>0/2</small>
          </div>
          <label>
            <span>찾은 단서</span>
            <strong>월 소득 2,500천원</strong>
            <em>✓</em>
          </label>
          <label>
            <span>가족</span>
            <strong>부양가족 2명 (3인 가구)</strong>
            <em>✓</em>
          </label>
        </div>
      );
    }

    if (visual === "review") {
      return (
        <div className="tutorial-visual tutorial-intake tutorial-review">
          <div>
            <span>찾은 단서</span>
            <small>확인</small>
          </div>
          <div>
            <span>시나리오</span>
            <small>원문</small>
          </div>
          <label>
            <span>힌트</span>
            <strong>기준 확인 · 정답 보기</strong>
            <em>?</em>
          </label>
        </div>
      );
    }

    if (visual === "support") {
      return (
        <div className="tutorial-visual tutorial-support">
          <div>
            <strong>30일 이하</strong>
            <span>신속채무조정</span>
            <small>원리금상환 방식 / 이자율 11%(가정) / 상환기간 최대 120개월</small>
          </div>
          <div>
            <strong>31~89일</strong>
            <span>사전채무조정</span>
            <small>원리금상환 방식 / 이자율 6%(가정) / 상환기간 최대 120개월</small>
          </div>
          <div>
            <strong>90일 이상</strong>
            <span>개인워크아웃</span>
            <small>원금상환 방식 / 상환기간 최대 96개월</small>
          </div>
        </div>
      );
    }

    if (visual === "balance") {
      const tutorialIncome = 200;
      const tutorialDebt = 1000;
      const tutorialLivingExpense = Math.max(0, tutorialIncome - tutorialPayment);
      const tutorialRepaymentPeriod = tutorialPayment > 0 ? Math.ceil(tutorialDebt / tutorialPayment) : null;
      const tutorialRatio = tutorialIncome > 0 ? (tutorialPayment / tutorialIncome) * 100 : 0;

      return (
        <div className="tutorial-visual tutorial-balance">
          <div className="tutorial-balance-note">
            <span>추가인정 생활비</span>
            <strong>주거비 · 교육비 · 의료비 · 기타</strong>
          </div>
          <div className="tutorial-balance-head">
            <strong>월납부액 {formatAmount(tutorialPayment)}</strong>
            <strong>생활비 {formatAmount(tutorialLivingExpense)}</strong>
          </div>
          <div
            className="balance-bar tutorial-balance-bar"
            style={{ "--payment-ratio": `${tutorialRatio}%` } as CSSProperties}
          >
            <span className="bar-payment" aria-hidden="true" />
            <span className="bar-living" aria-hidden="true" />
            <i aria-hidden="true" />
            <input
              aria-label="튜토리얼 월납부액과 생활비 조정"
              max={tutorialIncome}
              min="0"
              onChange={(event) => setTutorialPayment(Math.round(Number(event.target.value)))}
              step="1"
              type="range"
              value={tutorialPayment}
            />
          </div>
          <p className={tutorialLivingExpense <= 90 ? "is-danger" : ""}>
            {tutorialLivingExpense <= 90
              ? "생활비가 부족합니다. 생활비를 올려주세요."
              : `신용채무 ${formatAmount(tutorialDebt)} · 상환기간 ${tutorialRepaymentPeriod ? `${tutorialRepaymentPeriod}개월` : "계산불가"}`}
          </p>
        </div>
      );
    }

    if (visual === "score") {
      return (
        <div className="tutorial-visual tutorial-score">
          <span>접수 완료</span>
          <strong>660/660점</strong>
          <div aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <i key={index}>★</i>
            ))}
          </div>
          <p>단서 8/8 · 오답 0회</p>
        </div>
      );
    }

    return null;
  }

  function renderTutorialMiniVisual(visual: string, chip: string) {
    if (visual === "flow") {
      if (chip === "단서 찾기") {
        return (
          <div className="tutorial-mini-shot tutorial-mini-scenario" aria-label={`${chip} 진행 화면 예시`}>
            <p><span className="scenario-clue-marker is-found">월 2,500천원</span> 벌고 있습니다.</p>
            <div className="tutorial-mini-chip-row">
              <span>소득 1/1</span>
              <span>가족 0/1</span>
              <span>채무 0/2</span>
            </div>
          </div>
        );
      }

      if (chip === "지원구분") {
        return (
          <div className="tutorial-mini-shot tutorial-mini-support" aria-label={`${chip} 진행 화면 예시`}>
            {["30일 이하", "31~89일", "90일 이상"].map((item, index) => (
              <span className={index === 2 ? "is-selected" : ""} key={item}>{item}</span>
            ))}
          </div>
        );
      }

      if (chip === "최종미션") {
        return (
          <div className="tutorial-mini-shot tutorial-mini-balance" aria-label={`${chip} 진행 화면 예시`}>
            <div className="tutorial-mini-balance-head">
              <strong>월납부액 250천원</strong>
              <strong>생활비 2,250천원</strong>
            </div>
            <i aria-hidden="true" />
            <p>상환기간 96개월</p>
          </div>
        );
      }

      return (
        <div className="tutorial-mini-shot tutorial-mini-level" aria-label={`${chip} 진행 화면 예시`}>
          <span>LEVEL 1</span>
          <strong>기본상담</strong>
          <div>
            {[1, 2, 3].map((item) => (
              <em key={item}>{item}</em>
            ))}
          </div>
        </div>
      );
    }

    if (visual === "scenario") {
      if (chip === "텍스트 터치") {
        return (
          <div className="tutorial-mini-shot tutorial-mini-scenario" aria-label={`${chip} 진행 화면 예시`}>
            <p><button className="tutorial-mini-token" type="button">월 2,500천원</button> 벌고 있습니다.</p>
            <strong>문장 안의 단서를 직접 누릅니다.</strong>
          </div>
        );
      }

      if (chip === "값 정리") {
        return (
          <div className="tutorial-mini-shot tutorial-mini-list" aria-label={`${chip} 진행 화면 예시`}>
            <span>찾은 단서</span>
            <div><small>소득</small><strong>월 소득 2,500천원</strong></div>
            <div><small>가족</small><strong>2명 (3인 가구)</strong></div>
          </div>
        );
      }

      if (chip === "접수하기") {
        return (
          <div className="tutorial-mini-shot tutorial-mini-submit" aria-label={`${chip} 진행 화면 예시`}>
            <span>모든 단서를 찾았습니다.</span>
            <strong>지원구분 선택하기</strong>
          </div>
        );
      }

      return (
        <div className="tutorial-mini-shot tutorial-mini-scenario" aria-label={`${chip} 진행 화면 예시`}>
          <p><span className="scenario-clue-marker is-found">월 2,500천원</span> 벌고 있습니다.</p>
          <div>
            <small>소득</small>
            <strong>월 소득 2,500천원</strong>
          </div>
        </div>
      );
    }

    if (visual === "review") {
      if (chip === "시나리오") {
        return (
          <div className="tutorial-mini-shot tutorial-mini-scenario" aria-label={`${chip} 진행 화면 예시`}>
            <p>월 2,500천원 벌고 있습니다.</p>
            <p>카드값 때문에 120일째 연체 중입니다.</p>
          </div>
        );
      }

      if (chip === "힌트") {
        return (
          <div className="tutorial-mini-shot tutorial-mini-hint" aria-label={`${chip} 진행 화면 예시`}>
            <span>최종미션 힌트</span>
            <strong>월납부액은 10천원 단위로 반올림합니다.</strong>
          </div>
        );
      }

      if (chip === "정답 보기") {
        return (
          <div className="tutorial-mini-shot tutorial-mini-answer" aria-label={`${chip} 진행 화면 예시`}>
            <span>정답</span>
            <strong>지원구분: 개인워크아웃</strong>
            <strong>월납부액: 250천원</strong>
          </div>
        );
      }

      return (
        <div className="tutorial-mini-shot tutorial-mini-list" aria-label={`${chip} 진행 화면 예시`}>
          <span>찾은 단서</span>
          <div><small>연체일수</small><strong>120일</strong></div>
          <div><small>채무</small><strong>24,000천원</strong></div>
        </div>
      );
    }

    if (visual === "support") {
      return (
        <div className="tutorial-mini-shot tutorial-mini-support" aria-label={`${chip} 진행 화면 예시`}>
          {["30일 이하", "31~89일", "90일 이상"].map((item) => (
            <span className={chip === item ? "is-selected" : ""} key={item}>{item}</span>
          ))}
        </div>
      );
    }

    if (visual === "balance") {
      if (chip === "생활비") {
        return (
          <div className="tutorial-mini-shot tutorial-mini-list" aria-label={`${chip} 진행 화면 예시`}>
            <span>부양가족에 따른 생활비</span>
            <div><small>MIN 생활비</small><strong>1,930천원</strong></div>
            <div><small>MAX 생활비</small><strong>3,220천원</strong></div>
          </div>
        );
      }

      if (chip === "상환기간") {
        return (
          <div className="tutorial-mini-shot tutorial-mini-list" aria-label={`${chip} 진행 화면 예시`}>
            <span>상환기간 계산</span>
            <div><small>대상채무</small><strong>24,000천원</strong></div>
            <div><small>계산결과</small><strong>96개월</strong></div>
          </div>
        );
      }

      if (chip === "추가인정") {
        return (
          <div className="tutorial-mini-shot tutorial-mini-list" aria-label={`${chip} 진행 화면 예시`}>
            <span>추가인정 생활비</span>
            <div><small>주거비</small><strong>서울 최대 600천원</strong></div>
            <div><small>교육비</small><strong>대학생 자녀 300천원</strong></div>
          </div>
        );
      }

      const miniIncome = 2500;
      const miniDebt = 24000;
      const miniLivingExpense = Math.max(0, miniIncome - tutorialMiniPayment);
      const miniRepaymentPeriod = tutorialMiniPayment > 0 ? Math.ceil(miniDebt / tutorialMiniPayment) : null;
      const miniRatio = miniIncome > 0 ? (tutorialMiniPayment / miniIncome) * 100 : 0;

      return (
        <div className="tutorial-mini-shot tutorial-mini-balance" aria-label={`${chip} 진행 화면 예시`}>
          <div className="tutorial-mini-balance-head">
            <strong>월납부액 {formatAmount(tutorialMiniPayment)}</strong>
            <strong>생활비 {formatAmount(miniLivingExpense)}</strong>
          </div>
          <div
            className="balance-bar tutorial-mini-balance-bar"
            style={{ "--payment-ratio": `${miniRatio}%` } as CSSProperties}
          >
            <span className="bar-payment" aria-hidden="true" />
            <span className="bar-living" aria-hidden="true" />
            <i aria-hidden="true" />
            <input
              aria-label="튜토리얼 월납부액과 생활비 조정"
              max={miniIncome}
              min="0"
              onChange={(event) => setTutorialMiniPayment(Number(event.target.value))}
              step="10"
              type="range"
              value={tutorialMiniPayment}
            />
          </div>
          <p>상환기간 {miniRepaymentPeriod ? `${miniRepaymentPeriod}개월` : "계산불가"}</p>
        </div>
      );
    }

    if (visual === "score") {
      if (chip === "단서") {
        return (
          <div className="tutorial-mini-shot tutorial-mini-score-detail" aria-label={`${chip} 진행 화면 예시`}>
            <div><span>단서</span><strong>8/8</strong></div>
            <p>단서를 많이 찾을수록 점수에 유리합니다.</p>
          </div>
        );
      }

      if (chip === "오답") {
        return (
          <div className="tutorial-mini-shot tutorial-mini-score-detail" aria-label={`${chip} 진행 화면 예시`}>
            <div><span>오답</span><strong>0회</strong></div>
            <p>오답이 적을수록 높은 점수를 받습니다.</p>
          </div>
        );
      }

      if (chip === "결과 보기") {
        return (
          <div className="tutorial-mini-shot tutorial-mini-submit" aria-label={`${chip} 진행 화면 예시`}>
            <span>점수 확인 완료</span>
            <strong>결과 보기</strong>
          </div>
        );
      }

      return (
        <div className="tutorial-mini-shot tutorial-mini-score" aria-label={`${chip} 진행 화면 예시`}>
          <span>이번 문항 점수</span>
          <strong>660/660점</strong>
          <p>단서 8/8 · 오답 0회</p>
        </div>
      );
    }

    return null;
  }

  function updateRepaymentDraft(value: number) {
    const paymentValue = Math.round(sliderToPayment(value, calculation.repaymentBaseIncome, repaymentModel.targetPayment));
    const snappedValue =
      Math.abs(paymentValue - repaymentModel.targetPayment) <= PAYMENT_SNAP_TOLERANCE
        ? repaymentModel.targetPayment
        : paymentValue;

    setRepaymentDraft(snappedValue);
  }

  function changeLivingDependents(delta: number) {
    setLivingDependentsDraft((current) => {
      const baseDependents = practiceMode ? 0 : Math.max(0, calculation.householdMembers - 1);
      return Math.max(0, Math.min(5, (current ?? baseDependents) + delta));
    });
  }

  function goPreviousPage() {
    setFeedback("");

    if (reviewResult) {
      setReviewResult(null);
      return;
    }

    if (phase === "scenario") {
      if (practiceMode) {
        if (practiceIndex > 0) {
          setPracticeIndex((current) => Math.max(0, current - 1));
          resetLevelState(levelIndex);
          requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          });
        }

        return;
      }

      const previousResult = results[results.length - 1];

      if (previousResult) {
        setReviewResult(previousResult);
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }

      return;
    }

    if (phase === "intake") {
      if (usesGroupedScreen) {
        const firstIndex = Math.min(...groupedScreenFields.map((field) => level.fields.findIndex((item) => item.key === field.key)));
        if (firstIndex > 0) {
          prepareField(firstIndex - 1);
          return;
        }

        setPhase("scenario");
        return;
      }

      if (activeFieldIndex > 0) {
        prepareField(activeFieldIndex - 1);
        return;
      }

      setPhase("scenario");
      return;
    }

    if (phase === "mission") {
      if (missionPage === 1) {
        setMissionPage(0);
        return;
      }

      setPhase("scenario");
      return;
    }

    if (phase === "calculation") {
      setPhase("mission");
      setMissionPage(1);
    }
  }

  function moveToMissionWhenReady() {
    setMissionPage(0);
    setPhase("mission");
  }

  function solveAllClues() {
    setAnswers(Object.fromEntries(level.fields.map((field) => [field.key, field.answer])));
    setSolved(Object.fromEntries(level.fields.map((field) => [field.key, true])));
    setWrongAttempts((current) => {
      const nextAttempts = { ...current };
      level.fields.forEach((field) => {
        nextAttempts[field.key] = 0;
      });
      return nextAttempts;
    });
    setDraftValue("");
    setGroupDraft({});
  }

  function solveActiveIntakeScreen() {
    const targetFields = usesGroupedScreen ? groupedScreenFields : [activeField];
    const nextSolved = { ...solved };
    const nextAnswers = { ...answers };

    targetFields.forEach((field) => {
      nextSolved[field.key] = true;
      nextAnswers[field.key] = field.answer;
    });

    setSolved(nextSolved);
    setAnswers(nextAnswers);
    setWrongAttempts((current) => {
      const nextAttempts = { ...current };
      targetFields.forEach((field) => {
        nextAttempts[field.key] = 0;
      });
      return nextAttempts;
    });

    return nextSolved;
  }

  function moveToSupportSelection() {
    if (!allCluesFound) {
      setFeedback("단서 완료 후 지원구분을 선택하세요.");
      return;
    }

    setFeedback("");
    setMissionPage(0);
    setPhase("mission");
  }

  function moveToFinalMission() {
    if (!missionDraft.supportType) {
      setFeedback("지원구분을 먼저 선택해 주세요.");
      return;
    }

    if (missionDraft.supportType !== calculation.mission.supportType) {
      const nextAttempts = (wrongAttempts.supportType ?? 0) + 1;
      setWrongAttempts((current) => ({ ...current, supportType: nextAttempts }));
      setLevelMistakes((count) => count + 1);
      setFeedback(
        nextAttempts >= 2
          ? "지원구분이 맞지 않아요. 힌트에서 연체일수 기준을 확인하세요."
          : "지원구분이 맞지 않아요. 연체일수를 다시 확인하세요.",
      );
      if (nextAttempts >= 2) showMissionAssist(nextAttempts);
      return;
    }

    setFeedback("");
    setMissionPage(1);
  }

  function goNextPage() {
    setFeedback("");

    if (reviewResult) {
      setReviewResult(null);
      return;
    }

    if (phase === "scenario") {
      const remainingClues = level.fields.filter((field) => !solved[field.key]).length;
      setAutoSolvedClueCount((count) => count + remainingClues);
      solveAllClues();
      setFeedback(remainingClues > 0 ? "상단 다음 버튼으로 남은 단서를 자동완료했습니다." : "");
      setMissionPage(0);
      setPhase("mission");
      return;
    }

    if (phase === "intake") {
      const nextSolved = solveActiveIntakeScreen();

      if (usesGroupedScreen) {
        const lastIndex = Math.max(...groupedScreenFields.map((field) => level.fields.findIndex((item) => item.key === field.key)));
        if (lastIndex < level.fields.length - 1) {
          prepareField(nextOpenFieldInOrder(level, nextSolved, scenarioOrderedFields, lastIndex + 1));
          return;
        }

        moveToMissionWhenReady();
        return;
      }

      if (activeFieldIndex < level.fields.length - 1) {
        prepareField(nextOpenFieldInOrder(level, nextSolved, scenarioOrderedFields, activeFieldIndex + 1));
        return;
      }

      if (level.fields.every((field) => nextSolved[field.key])) {
        moveToMissionWhenReady();
      }
      return;
    }

    if (phase === "mission") {
      if (missionPage === 0) {
        setMissionDraft((current) => ({ ...current, supportType: calculation.mission.supportType }));
        setMissionPage(1);
        return;
      }

      setMissionDraft({
        supportType: calculation.mission.supportType,
        monthlyPayment: String(calculation.mission.monthlyPayment),
        repaymentPeriod: String(calculation.mission.repaymentPeriod),
      });
      setRepaymentDraft(calculation.mission.monthlyPayment);
      setPhase("calculation");
      return;
    }

    if (phase === "calculation") {
      finishLevel(practiceMode ? (isLastPracticeLevel ? "result" : "next") : levelIndex === LEVELS.length - 1 ? "result" : "next");
    }
  }

  function showFieldAssist(field: IntakeField, attempts: number) {
    openAssist({
      title: attempts >= 2 ? "정답을 확인할 수 있어요" : `${field.label} 힌트`,
      body: practiceMode ? practiceFieldHint(field, level) : fieldHint(field),
      answer: attempts >= 2 ? fieldAnswerText(field) : undefined,
      onFill: attempts >= 2 ? () => setDraftForField(field, field.answer) : undefined,
    });
  }

  function showMissionAssist(attempts: number) {
    if (missionPage === 0) {
      openAssist({
        title: attempts >= 2 ? "지원구분 정답을 확인할 수 있어요" : "지원구분 힌트",
        body: supportHint(level),
        answer:
          attempts >= 2
            ? `연체일수 ${formatNumber(numericAnswer(level, "overdueDays"))}일 → ${calculation.mission.supportType}`
            : undefined,
        onFill:
          attempts >= 2
            ? () => setMissionDraft((current) => ({ ...current, supportType: calculation.mission.supportType }))
            : undefined,
      });
      return;
    }

    openAssist({
      title: attempts >= 2 ? "최종미션 정답을 확인할 수 있어요" : "최종미션 힌트",
      body: missionHint(calculation, level),
      answer: attempts >= 2 ? missionAnswerText(calculation) : undefined,
      onFill:
        attempts >= 2
          ? () =>
              {
                setMissionDraft({
                  supportType: calculation.mission.supportType,
                  monthlyPayment: String(calculation.mission.monthlyPayment),
                  repaymentPeriod: String(calculation.mission.repaymentPeriod),
                });
                setLivingDependentsDraft(expectedLivingDependents);
                setRepaymentDraft(calculation.mission.monthlyPayment);
              }
          : undefined,
    });
  }

  function checkGroupedFields() {
    const parsedValues: Record<string, FieldValue> = {};

    if (groupDraft[WRONG_GROUP_CLUE_KEY]) {
      const nextAttempts = (wrongAttempts[activeField.key] ?? 0) + 1;
      setWrongAttempts((current) => ({ ...current, [activeField.key]: nextAttempts }));
      setLevelMistakes((count) => count + 1);
      setFeedback(nextAttempts >= 2 ? "두 번 틀렸어요. 힌트창에서 정답을 볼 수 있습니다." : "선택한 문장이 이 화면의 접수 항목과 맞지 않아요.");
      showFieldAssist(activeField, nextAttempts);
      return;
    }

    for (const field of groupedScreenFields) {
      const selectedClue = groupDraft[field.key] ?? "";

      if (!selectedClue) {
        setFeedback("필요한 시나리오 단서를 모두 선택해 주세요.");
        showFieldAssist(field, wrongAttempts[field.key] ?? 0);
        return;
      }

      if (!isCorrectClue(field, selectedClue)) {
        const nextAttempts = (wrongAttempts[field.key] ?? 0) + 1;
        setWrongAttempts((current) => ({ ...current, [field.key]: nextAttempts }));
        setLevelMistakes((count) => count + 1);
        setFeedback(nextAttempts >= 2 ? "두 번 틀렸어요. 힌트창에서 정답을 볼 수 있습니다." : "선택한 단서가 항목과 맞지 않아요.");
        showFieldAssist(field, nextAttempts);
        return;
      }

      parsedValues[field.key] = field.answer;
    }

    const nextSolved = { ...solved };
    const nextAnswers = { ...answers };

    groupedScreenFields.forEach((field) => {
      nextSolved[field.key] = true;
      nextAnswers[field.key] = parsedValues[field.key];
    });

    setAnswers(nextAnswers);
    setSolved(nextSolved);
    setWrongAttempts((current) => {
      const nextAttempts = { ...current };
      groupedScreenFields.forEach((field) => {
        nextAttempts[field.key] = 0;
      });
      return nextAttempts;
    });
    setFeedback(`${activeField.screen} 단서 확인 완료`);

    if (level.fields.every((item) => nextSolved[item.key])) {
      setTimeout(() => {
        setPhase("mission");
        setFeedback("");
      }, 380);
      return;
    }

    const lastGroupIndex = Math.max(...groupedScreenFields.map((field) => level.fields.findIndex((item) => item.key === field.key)));
    const nextIndex = nextOpenFieldInOrder(level, nextSolved, scenarioOrderedFields, lastGroupIndex + 1);
    setTimeout(() => prepareField(nextIndex), 280);
  }

  function checkField() {
    if (usesGroupedScreen) {
      checkGroupedFields();
      return;
    }

    const field = activeField;

    if (!draftValue) {
      setFeedback("시나리오에서 맞는 단서를 선택해 주세요.");
      showFieldAssist(field, activeAttemptCount);
      return;
    }

    if (!isCorrectClue(field, draftValue)) {
      const nextAttempts = (wrongAttempts[field.key] ?? 0) + 1;
      setWrongAttempts((current) => ({ ...current, [field.key]: nextAttempts }));
      setLevelMistakes((count) => count + 1);
      setFeedback(nextAttempts >= 2 ? "두 번 틀렸어요. 힌트창에서 정답을 볼 수 있습니다." : "선택한 단서가 항목과 맞지 않아요.");
      showFieldAssist(field, nextAttempts);
      return;
    }

    const nextSolved = { ...solved, [field.key]: true };
    setAnswers((current) => ({ ...current, [field.key]: field.answer }));
    setSolved(nextSolved);
    setWrongAttempts((current) => ({ ...current, [field.key]: 0 }));
    setFeedback(`${field.label} 단서 확인 완료`);

    if (level.fields.every((item) => nextSolved[item.key])) {
      setTimeout(() => {
        setPhase("mission");
        setFeedback("");
      }, 380);
      return;
    }

    const nextIndex = nextOpenFieldInOrder(level, nextSolved, scenarioOrderedFields, activeFieldIndex + 1);
    setTimeout(() => prepareField(nextIndex), 280);
  }

  function submitMission() {
    const monthlyPayment = repaymentModel.monthlyPayment;
    const repaymentPeriod = repaymentModel.repaymentPeriod;
    const mission = calculation.mission;
    const matchesMissionValues =
      missionDraft.supportType === mission.supportType &&
      livingDependents === expectedLivingDependents &&
      Math.abs(monthlyPayment - mission.monthlyPayment) <= 0.05 &&
      repaymentPeriod === mission.repaymentPeriod;
    const isCorrect =
      matchesMissionValues &&
      (practiceMode || (
        repaymentModel.feedbackState === "ok" &&
        !repaymentModel.cannotCalculatePeriod &&
        !repaymentModel.exceedsMaxPeriod
      ));

    if (!isCorrect) {
      const nextAttempts = (wrongAttempts.mission ?? 0) + 1;
      setWrongAttempts((current) => ({ ...current, mission: nextAttempts }));
      setLevelMistakes((count) => count + 1);
      setFeedback(
        !matchesLivingDependents
          ? `부양가족 수를 다시 확인해 주세요. 이 문항은 부양가족 ${formatNumber(expectedLivingDependents)}명 기준입니다.`
          : nextAttempts >= 2
            ? "두 번 틀렸어요. 힌트창에서 정답을 볼 수 있습니다."
            : "최종미션 힌트를 확인해 보세요.",
      );
      showMissionAssist(nextAttempts);
      return;
    }

    setFeedback("");
    if (practiceMode) {
      setPhase("calculation");
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      return;
    }

    setScorePopupOpen(true);
  }

  function finishLevel(destination: "next" | "result" = levelIndex === LEVELS.length - 1 ? "result" : "next") {
    setScorePopupOpen(false);
    if (practiceMode) {
      if (destination === "result" || isLastPracticeLevel) {
        setPracticeMode(false);
        setPracticeIndex(0);
        setScreen("result");
        setTierPopupOpen(false);
        return;
      }

      setPracticeIndex((current) => Math.min(current + 1, PRACTICE_LEVELS.length - 1));
      resetLevelState(levelIndex);
      return;
    }

    const levelScore = currentLevelScore;
    const nextResult = {
      level: level.level,
      title: level.title,
      mistakes: levelMistakes,
      score: levelScore,
      maxScore: maxLevelScore,
      supportType: calculation.supportType,
      income: calculation.income,
      targetDebt: calculation.targetDebt,
      maxLivingExpense: calculation.maxLivingExpense,
      additionalLivingExpense: calculation.additionalLivingExpense,
      adjustedLivingExpense: calculation.adjustedLivingExpense,
      securedPayment: calculation.securedPayment,
      repaymentBaseIncome: calculation.repaymentBaseIncome,
      monthlyPayment: calculation.monthlyPayment,
      repaymentPeriod: calculation.repaymentPeriod,
      maxRepaymentMonths: calculation.maxRepaymentMonths,
      repaymentFormula: repaymentPeriodFormulaText(calculation),
    };
    const nextResults = [...results, nextResult];
    const nextScore = sessionScore + levelScore;
    setResults(nextResults);
    setSessionScore(nextScore);

    const nextClearedLevel = Math.max(stats.clearedLevel, levelIndex + 1);
    const nextStats = {
      bestScore: Math.max(stats.bestScore, nextScore),
      clearedLevel: nextClearedLevel,
      runs: stats.runs + (levelIndex === LEVELS.length - 1 ? 1 : 0),
      lastScore: nextScore,
      updatedAt: new Date().toISOString(),
    };
    saveStats(nextStats);
    setStats(nextStats);

    if (destination === "result") {
      setScreen("result");
      setTierPopupOpen(true);
      return;
    }

    resetLevelState(levelIndex + 1);
  }

  function showCalculationResult() {
    setScorePopupOpen(false);
    setPhase("calculation");
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const tutorialGroup = TUTORIAL_GROUPS[tutorialIndex] ?? TUTORIAL_GROUPS[0];
  const tutorialProgress = ((tutorialIndex + 1) / TUTORIAL_GROUPS.length) * 100;
  const TutorialIcon = tutorialIndex === 0 ? ClipboardList : Calculator;
  const shellClass = `phone-shell screen-${screen} phase-${phase} ${
    screen === "levelSelect" ? "level-select-tone" : `level-${level.level}`
  }${
    screen === "tutorial" ? ` tutorial-tone-${(tutorialIndex % 2) + 1}` : ""
  }${
    practiceMode ? " practice-tone" : ""
  }`;

  return (
    <div className="app">
      <main className={shellClass}>
        {screen === "start" && (
          <section className="start-screen intro-screen">
            <button
              className="intro-poster"
              onClick={() => {
                setTutorialIndex(0);
                setOpenTutorialSection(-1);
                setTutorialExample(null);
                setScreen("tutorial");
              }}
              type="button"
            >
              <img src={startHero} alt="Mystery at the desk 시작 화면" />
            </button>
          </section>
        )}

        {screen === "tutorial" && (
          <section className="game-screen tutorial-screen">
            <header className="game-header">
              <button className="icon-action" onClick={() => setScreen("start")} type="button" title="표지">
                <Home size={19} aria-hidden="true" />
              </button>
              <button
                className="arrow-action"
                disabled={tutorialIndex === 0}
                onClick={() => {
                  setTutorialIndex((index) => Math.max(0, index - 1));
                  setOpenTutorialSection(-1);
                  setTutorialExample(null);
                }}
                type="button"
                title="이전 튜토리얼"
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <div>
                <span>TUTORIAL</span>
                <strong>{tutorialGroup.badge}</strong>
              </div>
              <button
                className="arrow-action"
                onClick={() => {
                  if (tutorialIndex < TUTORIAL_GROUPS.length - 1) {
                    setTutorialIndex((index) => index + 1);
                    setOpenTutorialSection(-1);
                    setTutorialExample(null);
                    return;
                  }
                  setScreen("levelSelect");
                }}
                type="button"
                title="다음 튜토리얼"
              >
                <ChevronRight size={22} aria-hidden="true" />
              </button>
              <div className="score-pill">
                <ClipboardList size={16} aria-hidden="true" />
                {tutorialIndex + 1}/{TUTORIAL_GROUPS.length}
              </div>
            </header>

            <div className="progress-wrap" aria-label="튜토리얼 진행률">
              <span>{tutorialIndex + 1}/{TUTORIAL_GROUPS.length}</span>
              <div className="progress-line">
                <i style={{ width: `${tutorialProgress}%` }} />
              </div>
            </div>

            <article className="mission-panel tutorial-card tutorial-accordion-card">
              <div className="panel-heading">
                <TutorialIcon size={22} aria-hidden="true" />
                <div>
                  <span>{tutorialGroup.badge}</span>
                  <h2>{tutorialGroup.title}</h2>
                </div>
              </div>

              <div className="tutorial-accordion">
                {tutorialGroup.sections.map((section, sectionIndex) => {
                  const isOpen = openTutorialSection === sectionIndex;
                  const sectionKey = `${tutorialIndex}-${sectionIndex}`;
                  const selectedExample =
                    tutorialExample?.sectionKey === sectionKey
                      ? TUTORIAL_CHIP_EXAMPLES[section.badge]?.[tutorialExample.chip]
                      : "";
                  const SectionIcon =
                    section.visual === "flow"
                      ? Smartphone
                      : section.visual === "review"
                        ? HelpCircle
                        : section.visual === "score"
                          ? Trophy
                          : section.visual === "support" || section.visual === "balance"
                            ? Calculator
                            : ClipboardList;

                  return (
                    <section className={`tutorial-section${isOpen ? " is-open" : ""}`} key={section.badge}>
                      <button
                        className="tutorial-section-toggle"
                        onClick={() => {
                          setOpenTutorialSection((current) => (current === sectionIndex ? -1 : sectionIndex));
                          setTutorialExample(null);
                        }}
                        type="button"
                        aria-expanded={isOpen}
                      >
                        <SectionIcon size={18} aria-hidden="true" />
                        <span>{section.badge}</span>
                        <strong>{section.title}</strong>
                        <ChevronRight size={18} aria-hidden="true" />
                      </button>

                      {isOpen && (
                        <div className="tutorial-section-body">
                          <div className="screen-chips tutorial-chip-grid" aria-label={`${section.badge} 핵심`}>
                            {section.chips.map((chip) => (
                              <button
                                className={tutorialExample?.sectionKey === sectionKey && tutorialExample.chip === chip ? "is-active" : ""}
                                key={chip}
                                onClick={() => setTutorialExample({ sectionKey, chip })}
                                type="button"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>

                          {selectedExample && (
                            <>
                              <p className="tutorial-chip-example">
                                {selectedExample}
                              </p>
                              {renderTutorialMiniVisual(section.visual, tutorialExample?.chip ?? section.chips[0])}
                            </>
                          )}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </article>

            <div className="start-actions tutorial-actions">
              <button
                className="primary-action"
                onClick={() => {
                  if (tutorialIndex < TUTORIAL_GROUPS.length - 1) {
                    setTutorialIndex((index) => index + 1);
                    setOpenTutorialSection(-1);
                    setTutorialExample(null);
                    return;
                  }
                  setScreen("levelSelect");
                }}
                type="button"
              >
                {tutorialIndex < TUTORIAL_GROUPS.length - 1 ? (
                  <>
                    <ChevronRight size={19} aria-hidden="true" />
                    다음
                  </>
                ) : (
                  <>
                    <Play size={19} aria-hidden="true" />
                    레벨 선택
                  </>
                )}
              </button>
              <button className="ghost-action" onClick={() => setScreen("levelSelect")} type="button">
                  <ChevronRight size={19} aria-hidden="true" />
                건너뛰기
              </button>
            </div>
          </section>
        )}

        {screen === "levelSelect" && (
          <section className="game-screen level-select-screen">
            <header className="game-header">
              <button className="icon-action" onClick={() => setScreen("start")} type="button" title="첫 화면">
                <Home size={19} aria-hidden="true" />
              </button>
              <button
                className="arrow-action"
                onClick={() => {
                  setTutorialIndex(0);
                  setOpenTutorialSection(-1);
                  setTutorialExample(null);
                  setScreen("tutorial");
                }}
                type="button"
                title="튜토리얼"
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <div>
                <span>LEVEL SELECT</span>
                <strong>레벨 선택</strong>
              </div>
              <button className="arrow-action" onClick={() => startRun()} type="button" title="시작">
                <ChevronRight size={22} aria-hidden="true" />
              </button>
              <div className="score-pill">
                <ClipboardList size={16} aria-hidden="true" />
                {LEVELS.length}
              </div>
            </header>

            <div className="stat-strip" aria-label="저장된 점수">
              <div>
                <span>최고점수</span>
                <strong>{formatNumber(stats.bestScore)}</strong>
              </div>
              <div>
                <span>문항수</span>
                <strong>{LEVELS.length}</strong>
              </div>
              <div>
                <span>최근점수</span>
                <strong>{formatNumber(stats.lastScore)}</strong>
              </div>
            </div>

            <div className="level-map" aria-label="레벨 선택">
              {levelGroups.map((group) => {
                return (
                  <section className="level-node level-group-node" key={group.level}>
                    <div className="level-group-badge">
                      <span>LEVEL {group.level}</span>
                    </div>
                    <div className="level-group-main">
                      <strong className="level-group-name">
                        {group.title}
                      </strong>
                      <div className="level-case-grid">
                        {group.cases.map(({ item, index }, caseIndex) => {
                          const selected = selectedLevel === index;

                          return (
                            <button
                              className={selected ? "is-selected" : ""}
                              key={item.id}
                              onClick={() => chooseLevelCase(index)}
                              onDoubleClick={() => startRun(index)}
                              type="button"
                              title="두 번 누르면 바로 시작"
                            >
                              <strong>{caseIndex + 1}</strong>
                              <small>단서 {levelSelectClueCount(item)}개</small>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="start-actions">
              <button className="primary-action" onClick={() => startRun()} type="button">
                <Play size={19} aria-hidden="true" />
                시작
              </button>
              <button className="ghost-action" onClick={resetStoredStats} type="button" title="저장된 점수 초기화">
                <RotateCcw size={18} aria-hidden="true" />
                기록 초기화
              </button>
            </div>
          </section>
        )}

        {screen === "game" && (
          <section className="game-screen">
            <header className="game-header">
              <button className="icon-action" onClick={() => setHomeChoiceOpen(true)} type="button" title="이동 메뉴">
                <Home size={19} aria-hidden="true" />
              </button>
              <button
                className="arrow-action"
                disabled={
                  phase === "scenario" &&
                  ((practiceMode && practiceIndex === 0) || (!practiceMode && results.length === 0 && !reviewResult))
                }
                onClick={goPreviousPage}
                type="button"
                title={phase === "scenario" && practiceMode ? "이전 실전문제" : phase === "scenario" ? "이전 결과" : "이전 단계"}
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <div>
                <span>{practiceMode ? `실전 ${practiceIndex + 1}/${PRACTICE_LEVELS.length}` : `LEVEL ${level.level}`}</span>
                <strong>{level.title}</strong>
              </div>
              <button className="arrow-action" onClick={goNextPage} type="button" title="다음 단계">
                <ChevronRight size={22} aria-hidden="true" />
              </button>
              {practiceMode ? (
                <div className="practice-pill" aria-label="실전문제">
                  <ClipboardList size={15} aria-hidden="true" />
                  <span>실전</span>
                </div>
              ) : (
                <div className="score-pill">
                  <Trophy size={16} aria-hidden="true" />
                  {formatNumber(sessionScore)}
                </div>
              )}
            </header>

            <div className="progress-wrap" aria-label="전체 진행률">
              <span>{currentCaseIndex + 1}/{totalCaseCount}</span>
              <div className="progress-line">
                <i style={{ width: `${phaseProgressWidth}%` }} />
              </div>
            </div>

            {reviewResult && (
              <article className="calculation-panel previous-calculation-panel">
                <div className="panel-heading">
                  <ClipboardList size={20} aria-hidden="true" />
                  <div>
                    <span>이전 결과</span>
                    <h2>{reviewResult.title}</h2>
                  </div>
                </div>

                <dl className="calc-sheet">
                  <div>
                    <dt>지원구분</dt>
                    <dd>{resultSupportTypeLabel(reviewResult.supportType)}</dd>
                  </div>
                  <div>
                    <dt>대상채무</dt>
                    <dd>{formatAmount(reviewResult.targetDebt)}</dd>
                  </div>
                  <div>
                    <dt>
                      {maxLivingExpenseIncomeLabel(
                        hasSecuredIncomeDeduction({
                          income: reviewResult.income,
                          repaymentBaseIncome: reviewResult.repaymentBaseIncome,
                          securedPayment: reviewResult.securedPayment,
                        }),
                      )}
                    </dt>
                    <dd>
                      <strong>{livingExpenseIncomeComparison(reviewResult.maxLivingExpense, reviewResult.repaymentBaseIncome)}</strong>
                      <span>
                        {maxRepaymentAvailabilityText(
                          reviewResult.maxLivingExpense,
                          reviewResult.repaymentBaseIncome,
                          reviewResult.maxRepaymentMonths,
                        )}
                      </span>
                    </dd>
                  </div>
                  {canUseMaxRepaymentPeriod(reviewResult.maxLivingExpense, reviewResult.repaymentBaseIncome) && (
                    <div>
                      <dt>월납부액</dt>
                      <dd>
                        <strong>{reviewResult.repaymentFormula}</strong>
                      </dd>
                    </div>
                  )}
                  {needsMaxRepaymentVerification(reviewResult) && (
                    <>
                      <div>
                        <dt>
                          <span>최장기간</span>
                          <span>월납부액</span>
                        </dt>
                        <dd>
                          <strong>{maxPeriodPaymentFormulaText(reviewResult)}</strong>
                        </dd>
                      </div>
                      <div>
                        <dt>
                          <span>최대 상환</span>
                          <span>기간 검토</span>
                        </dt>
                        <dd>
                          <span>{maxRepaymentVerificationLabel(reviewResult)}</span>
                          <strong className="calc-formula-inline calc-formula-tight">
                            {maxRepaymentVerificationFormulaText(reviewResult)}
                          </strong>
                          <span>{maxRepaymentVerificationStatusText(reviewResult)}</span>
                        </dd>
                      </div>
                    </>
                  )}
                  <div>
                    <dt>생활비</dt>
                    <dd>
                      <span>
                        {canUseMaxRepaymentPeriod(reviewResult.maxLivingExpense, reviewResult.repaymentBaseIncome) ||
                        (needsMaxRepaymentVerification(reviewResult) && isMaxRepaymentVerifiedPossible(reviewResult))
                          ? hasSecuredIncomeDeduction({
                              income: reviewResult.income,
                              repaymentBaseIncome: reviewResult.repaymentBaseIncome,
                              securedPayment: reviewResult.securedPayment,
                            })
                            ? "남은소득 - 월납부액"
                            : "소득 - 월납부액"
                          : reviewResult.additionalLivingExpense > 0
                            ? "최대생활비 + 추가 인정생활비"
                            : "소득 - 월납부액"}
                      </span>
                      <strong className="calc-formula-inline">
                        {canUseMaxRepaymentPeriod(reviewResult.maxLivingExpense, reviewResult.repaymentBaseIncome) ||
                        (needsMaxRepaymentVerification(reviewResult) && isMaxRepaymentVerifiedPossible(reviewResult))
                          ? livingExpenseFormulaText(
                              reviewResult.repaymentBaseIncome,
                              needsMaxRepaymentVerification(reviewResult)
                                ? maxPeriodMonthlyPaymentFor(reviewResult)
                                : reviewResult.monthlyPayment,
                              reviewResult.adjustedLivingExpense,
                            )
                          : reviewResult.additionalLivingExpense > 0
                          ? recognizedLivingExpenseFormulaText(
                              reviewResult.maxLivingExpense,
                              reviewResult.additionalLivingExpense,
                              reviewResult.adjustedLivingExpense,
                            )
                          : livingExpenseFormulaText(
                              reviewResult.repaymentBaseIncome,
                              reviewResult.monthlyPayment,
                              reviewResult.adjustedLivingExpense,
                            )}
                      </strong>
                    </dd>
                  </div>
                  {needsMaxRepaymentVerification(reviewResult) && !isMaxRepaymentVerifiedPossible(reviewResult) && (
                    <div>
                      <dt>월납부액</dt>
                      <dd>
                        <span>{reviewResult.securedPayment > 0 ? "남은소득 - 생활비" : "소득 - 생활비"}</span>
                        <strong className="calc-formula-inline">
                          {monthlyPaymentFormulaText(
                            reviewResult.repaymentBaseIncome,
                            reviewResult.adjustedLivingExpense,
                            reviewResult.monthlyPayment,
                          )}
                        </strong>
                      </dd>
                    </div>
                  )}
                  {needsMaxRepaymentVerification(reviewResult) && !isMaxRepaymentVerifiedPossible(reviewResult) && (
                    <div>
                      <dt>상환기간</dt>
                      <dd>
                        <span>{formatAmount(reviewResult.targetDebt)} 월 {formatAmount(reviewResult.monthlyPayment)} 납부시 기간</span>
                        <strong>= {reviewResult.repaymentPeriod}개월</strong>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>오답</dt>
                    <dd>{reviewResult.mistakes}회</dd>
                  </div>
                  <div>
                    <dt>점수</dt>
                    <dd>{formatNumber(reviewResult.score)}점</dd>
                  </div>
                </dl>

              </article>
            )}

            {!reviewResult && phase === "scenario" && (
              <article className="mission-panel">
                <div className="panel-heading">
                  <ClipboardList size={20} aria-hidden="true" />
                  <div>
                    <h2>기본 상담 정보를 읽고 단서를 찾아 접수해주세요.</h2>
                  </div>
                </div>

                <p className={`scenario-find-prompt ${practiceMode ? "is-practice" : ""}`}>
                  <span>지금 찾을 단서</span>
                  <strong>{scenarioPrompt}</strong>
                </p>
                {practiceMode && (
                  <p className="practice-scenario-tip">
                    줄글 속 현재 항목만 직접 누릅니다. 제외 가족이나 설명용 단서는 누르면 오답입니다.
                  </p>
                )}

                <div className={`customer-log ${practiceMode ? "is-story" : ""}`}>
                  {scenarioDisplayLines.map((line, index) => {
                    return (
                      <div className={isScenarioLineComplete(line) ? "is-found" : ""} key={`${index}-${line}`}>
                        {renderScenarioLine(line)}
                      </div>
                    );
                  })}
                </div>

                <div className="screen-chips" aria-label="사용 전산 화면">
                  {screenProgress.map((item) => (
                    <button
                      className={`${item.done === item.total ? "is-complete" : ""} ${
                        scenarioActiveField.screen === item.screenName ? "is-active" : ""
                      } ${(!showAllClues && (clueFilterScreen ?? lastClueScreen) === item.screenName) ? "is-filtered" : ""}`}
                      key={item.screenName}
                      onClick={() => {
                        setShowAllClues(false);
                        setClueFilterScreen(item.screenName);
                        setLastClueScreen(item.screenName);
                      }}
                      type="button"
                    >
                      <span>{item.screenName}</span>
                      <small>{item.done}/{item.total}</small>
                    </button>
                  ))}
                </div>

                {renderFoundClueSummary()}

                <button
                  className="primary-action"
                  ref={supportSelectionButtonRef}
                  onClick={moveToSupportSelection}
                  type="button"
                >
                  <Smartphone size={19} aria-hidden="true" />
                  지원구분 선택하기
                </button>
              </article>
            )}

            {!reviewResult && phase === "intake" && (
              <article className="intake-panel">
                <div className="system-tabs" aria-label="전산 화면 진행">
                  {screenProgress.map((item) => (
                    <button
                      className={item.done === item.total ? "is-complete" : activeField.screen === item.screenName ? "is-active" : ""}
                      key={item.screenName}
                      type="button"
                    >
                      <span>{item.screenName}</span>
                      <small>{item.done}/{item.total}</small>
                    </button>
                  ))}
                </div>

                <div className="field-card">
                  <div className="field-head">
                    <span>{activeField.screen}</span>
                    <strong>{fieldTitle(activeField)}</strong>
                  </div>

                  <div className="clue-task">
                    <span>시나리오에서 맞는 단서를 선택하세요.</span>
                    {usesGroupedScreen ? (
                      <div className="clue-target-grid">
                        {groupedScreenFields.map((field) => (
                          <div className={groupDraft[field.key] ? "is-selected" : ""} key={field.key}>
                            <small>{field.label}</small>
                            <strong>{selectedClueSummary(field)}</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="clue-target-grid single-target">
                        <div className={draftValue ? "is-selected" : ""}>
                          <small>{activeField.label}</small>
                          <strong>{draftValue ? "선택됨" : "단서 선택"}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="scenario-choice-list" aria-label="시나리오 단서 선택">
                    {level.scenario.map((line) => (
                      <button
                        className={isScenarioClueSelected(line) ? "is-selected" : ""}
                        key={line}
                        onClick={() => {
                          if (usesGroupedScreen) {
                            selectGroupedClue(line);
                            return;
                          }
                          setDraftValue(line);
                        }}
                        type="button"
                      >
                        {line}
                      </button>
                    ))}
                  </div>

                  {renderQuickActions()}

                  <button className="primary-action" onClick={checkField} type="button">
                    <Check size={19} aria-hidden="true" />
                    확인
                  </button>
                </div>

                <div className="entry-list" aria-label="단서 확인 목록">
                  {entryItems.map((item) => (
                    <button
                      className={`${
                        item.fields.every((field) => solved[field.key]) ? "is-done" : ""
                      } ${item.fields.some((field) => field.key === activeField.key) ? "is-active" : ""}`}
                      key={item.key}
                      onClick={() => prepareField(item.index)}
                      type="button"
                    >
                      <span>{item.label}</span>
                      <strong>{entryStatusLabel(item)}</strong>
                    </button>
                  ))}
                </div>
              </article>
            )}

            {!reviewResult && phase === "calculation" && (
              <article className="calculation-panel">
                {renderCalculationAnswerCard(calculation)}
                {renderCalculationReasonCard(calculation, numericAnswer(level, "overdueDays"))}

                <dl className="calc-sheet">
                  <div>
                    <dt>지원구분</dt>
                    <dd>{resultSupportTypeLabel(calculation.supportType)}</dd>
                  </div>
                  <div>
                    <dt>대상채무</dt>
                    <dd>
                      {practiceMode ? <span>신용채무 합계</span> : null}
                      <strong>{formatAmount(calculation.targetDebt)}</strong>
                    </dd>
                  </div>
                  <div>
                    <dt>
                      {maxLivingExpenseIncomeLabel(
                        hasCurrentSecuredIncomeDeduction,
                      )}
                    </dt>
                    <dd>
                      <strong>{livingExpenseIncomeComparison(calculation.maxLivingExpense, calculation.repaymentBaseIncome)}</strong>
                      <span>
                        {maxRepaymentAvailabilityText(
                          calculation.maxLivingExpense,
                          calculation.repaymentBaseIncome,
                          calculation.maxRepaymentMonths,
                        )}
                      </span>
                    </dd>
                  </div>
                  {canUseMaxRepaymentPeriod(calculation.maxLivingExpense, calculation.repaymentBaseIncome) && (
                    <div>
                      <dt>월납부액</dt>
                      <dd>
                        <strong>{repaymentPeriodFormulaText(calculation)}</strong>
                      </dd>
                    </div>
                  )}
                  {needsMaxRepaymentVerification(calculation) && (
                    <>
                      <div>
                        <dt>
                          <span>최장기간</span>
                          <span>월납부액</span>
                        </dt>
                        <dd>
                          <strong>{maxPeriodPaymentFormulaText(calculation)}</strong>
                        </dd>
                      </div>
                      <div>
                        <dt>
                          <span>최대 상환</span>
                          <span>기간 검토</span>
                        </dt>
                        <dd>
                          <span>{maxRepaymentVerificationLabel(calculation)}</span>
                          <strong className="calc-formula-inline calc-formula-tight">
                            {maxRepaymentVerificationFormulaText(calculation)}
                          </strong>
                          <span>{maxRepaymentVerificationStatusText(calculation)}</span>
                        </dd>
                      </div>
                    </>
                  )}
                  <div>
                    <dt>생활비</dt>
                    <dd>
                      <span>
                        {canUseMaxRepaymentPeriod(calculation.maxLivingExpense, calculation.repaymentBaseIncome) ||
                        (needsMaxRepaymentVerification(calculation) && isMaxRepaymentVerifiedPossible(calculation))
                          ? hasCurrentSecuredIncomeDeduction
                            ? "남은소득 - 월납부액"
                            : "소득 - 월납부액"
                          : calculation.additionalLivingExpense > 0
                            ? "최대생활비 + 추가 인정생활비"
                            : hasCurrentSecuredIncomeDeduction
                              ? "남은소득 - 월납부액"
                              : "소득 - 월납부액"}
                      </span>
                      <strong className="calc-formula-inline">
                        {canUseMaxRepaymentPeriod(calculation.maxLivingExpense, calculation.repaymentBaseIncome) ||
                        (needsMaxRepaymentVerification(calculation) && isMaxRepaymentVerifiedPossible(calculation))
                          ? livingExpenseFormulaText(
                              calculation.repaymentBaseIncome,
                              needsMaxRepaymentVerification(calculation)
                                ? maxPeriodMonthlyPaymentFor(calculation)
                                : calculation.monthlyPayment,
                              calculation.adjustedLivingExpense,
                            )
                          : calculation.additionalLivingExpense > 0
                          ? recognizedLivingExpenseFormulaText(
                              calculation.maxLivingExpense,
                              calculation.additionalLivingExpense,
                              calculation.adjustedLivingExpense,
                            )
                          : livingExpenseFormulaText(
                              calculation.repaymentBaseIncome,
                              calculation.monthlyPayment,
                              calculation.adjustedLivingExpense,
                            )}
                      </strong>
                    </dd>
                  </div>
                  {needsMaxRepaymentVerification(calculation) && !isMaxRepaymentVerifiedPossible(calculation) && (
                    <div>
                      <dt>월납부액</dt>
                      <dd>
                        <span>{hasCurrentSecuredIncomeDeduction ? "남은소득 - 생활비" : "소득 - 생활비"}</span>
                        <strong className="calc-formula-inline">
                          {monthlyPaymentFormulaText(
                            calculation.repaymentBaseIncome,
                            calculation.adjustedLivingExpense,
                            calculation.monthlyPayment,
                          )}
                        </strong>
                      </dd>
                    </div>
                  )}
                  {needsMaxRepaymentVerification(calculation) && !isMaxRepaymentVerifiedPossible(calculation) && (
                    <div>
                      <dt>상환기간</dt>
                      <dd>
                        <span>{formatAmount(calculation.targetDebt)} 월 {formatAmount(calculation.monthlyPayment)} 납부시 기간</span>
                        <strong>= {calculation.repaymentPeriod}개월</strong>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>오답</dt>
                    <dd>{levelMistakes}회</dd>
                  </div>
                </dl>

                {!practiceMode && (
                  <div className="score-preview-card" aria-label={`이번 문항 점수 ${scoreWithMax(currentLevelScore, maxLevelScore)}`}>
                  <div>
                    <span>이번 문항 점수</span>
                    <strong>{scoreWithMax(currentLevelScore, maxLevelScore)}</strong>
                  </div>
                  {autoSolvedClueCount > 0 && (
                    <p>자동완료 단서 {autoSolvedClueCount}개는 단서 점수에서 제외됩니다.</p>
                  )}
                </div>
                )}

                <button
                  className="primary-action"
                  onClick={() => {
                    finishLevel(practiceMode ? (isLastPracticeLevel ? "result" : "next") : levelIndex === LEVELS.length - 1 ? "result" : "next");
                  }}
                  type="button"
                >
                  <ChevronRight size={19} aria-hidden="true" />
                  {practiceMode ? (isLastPracticeLevel ? "실전 종료" : "다음 실전문제") : levelIndex === LEVELS.length - 1 ? "결과 보기" : "다음 레벨"}
                </button>
              </article>
            )}

            {!reviewResult && phase === "mission" && (
              <article className="mission-panel final-mission">
                <div className="panel-heading">
                  <Trophy size={21} aria-hidden="true" />
                  <div>
                    <span>{missionPage === 0 ? "지원구분 선택하기" : "최종미션"}</span>
                    <h2>{missionPage === 0 ? "연체일수 기준으로 지원구분을 선택하세요." : "월납부액, 상환기간을 제출하세요."}</h2>
                  </div>
                </div>

                {missionPage === 0 && (
                  <>
                    <div className="support-select-card">
                      <span className="support-label">지원구분</span>
                      <div className="support-choice-grid" aria-label="지원구분 선택">
                        {SUPPORT_OPTIONS.map((option) => {
                          const optionMeta = supportOptionMeta(option);

                          return (
                            <button
                              aria-disabled={!allCluesFound}
                              className={`${missionDraft.supportType === option ? "is-selected" : ""} ${!allCluesFound ? "is-disabled" : ""}`}
                              key={option}
                              onClick={() => {
                                if (!allCluesFound) {
                                  setFeedback("단서 완료 후 지원구분을 선택하세요.");
                                  return;
                                }

                                setFeedback("");
                                setMissionDraft((current) => ({ ...current, supportType: option }));
                              }}
                              type="button"
                            >
                              <span className="support-display">
                                <strong>{optionMeta.title}</strong>
                                <small>({optionMeta.detail})</small>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {renderQuickActions()}

                    <button className="primary-action" onClick={moveToFinalMission} type="button">
                      <ChevronRight size={19} aria-hidden="true" />
                      최종미션
                    </button>
                  </>
                )}

                {missionPage === 1 && (
                  <>
                    <div className="living-range-hint">
                      <div className="living-range-head">
                        <span>부양가족에 따른 생활비</span>
                        <strong>{livingBasis.householdMembers}인 가구</strong>
                      </div>
                      <div className="dependent-adjuster">
                        <span>부양가족</span>
                        <div className="dependent-stepper" aria-label="부양가족 수 조정">
                          <button
                            aria-label="부양가족 줄이기"
                            disabled={livingBasis.dependents <= 0}
                            onClick={() => changeLivingDependents(-1)}
                            type="button"
                          >
                            -1
                          </button>
                          <strong>{livingBasis.dependents}명</strong>
                          <button
                            aria-label="부양가족 늘리기"
                            disabled={livingBasis.dependents >= 5}
                            onClick={() => changeLivingDependents(1)}
                            type="button"
                          >
                            +1
                          </button>
                        </div>
                      </div>
                      <div>
                        <small>MIN 생활비</small>
                        <strong>{formatAmount(livingBasis.minimumLivingExpense * MIN_LIVING_EXPENSE_RATIO)}</strong>
                      </div>
                      <div>
                        <small>MAX 생활비</small>
                        <strong>{formatAmount(livingBasis.maxLivingExpense)}</strong>
                      </div>
                      {extraLivingItems.length > 0 && (
                        <div className="additional-living-expenses">
                          <div className="additional-living-title">
                            <span>추가인정 생활비</span>
                          </div>
                          <div className="additional-living-grid">
                            {extraLivingItems.map((item) => (
                              <div className="additional-living-item" key={item.label}>
                                <small>{item.label}</small>
                                <strong>{item.value}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {hasCurrentSecuredIncomeDeduction && (
                      <div className="secured-income-card">
                        <span>담보채무 차감</span>
                        <strong>
                          총 소득 {formatAmount(calculation.income)} - 담보 원리금 {formatAmount(calculation.securedPayment)}
                        </strong>
                        <em>남은소득 {formatAmount(calculation.repaymentBaseIncome)}</em>
                      </div>
                    )}

                    <div className="income-balance-card">
                      <div className="balance-head">
                        <strong>생활비와 월납부액 찾기</strong>
                        <span>{hasCurrentSecuredIncomeDeduction ? "남은소득" : "총 소득"} {formatAmount(calculation.repaymentBaseIncome)}</span>
                      </div>
                      <div className="balance-values">
                        <span>월납부액 {formatAmount(repaymentModel.monthlyPayment)}</span>
                        <span>생활비 {formatAmount(repaymentModel.livingExpense)}</span>
                      </div>
                      <div
                        className="balance-bar"
                        style={{ "--payment-ratio": `${repaymentModel.paymentRatio}%` } as CSSProperties}
                      >
                        <span className="bar-payment" aria-hidden="true" />
                        <span className="bar-living" aria-hidden="true" />
                        <i aria-hidden="true" />
                        <input
                          aria-label="월납부액과 생활비 조정"
                          max={repaymentModel.sliderMax}
                          min="0"
                          onChange={(event) => updateRepaymentDraft(Number(event.target.value))}
                          step="0.01"
                          type="range"
                          value={repaymentModel.sliderValue}
                        />
                      </div>
                      <p className={`balance-feedback is-${repaymentModel.feedbackState}`}>
                        {repaymentModel.feedback}
                      </p>
                    </div>

                    <div className="answer-summary-card">
                      <span>제출할 답안</span>
                      <div>
                        <small>지원구분</small>
                        <strong>{missionDraft.supportType || "선택 필요"}</strong>
                      </div>
                      <div>
                        <small>월납부액</small>
                        <strong>{formatAmount(repaymentModel.monthlyPayment)}</strong>
                      </div>
                      <div>
                        <small>상환기간</small>
                        <strong>{repaymentModel.periodLabel}</strong>
                      </div>
                    </div>

                    {renderQuickActions()}

                    <button className="primary-action" onClick={submitMission} type="button">
                      <Check size={19} aria-hidden="true" />
                      제출
                    </button>
                  </>
                )}
              </article>
            )}

            {feedback && <p className="feedback" role="status">{feedback}</p>}
          </section>
        )}

        {screen === "result" && (
          <section className="result-screen">
            <div className="result-medal">
              <Trophy size={38} aria-hidden="true" />
            </div>
            <h1>{formatNumber(sessionScore)}점</h1>
            <p className="result-summary-copy">총 {scoreWithMax(sessionScore, resultMaxScore)} · {resultTier.name} 달성</p>

            <article className="fox-tier-card result-tier-card" aria-label={`최종 티어 ${resultTier.name}`}>
              <span>여우 성장 티어</span>
              <div className="fox-tier-head">
                <strong>
                  <em aria-hidden="true">{resultTier.icon}</em>
                  {resultTier.name}
                </strong>
                <small>{resultTierPercent}% 달성</small>
              </div>
              <p>{resultTier.description}</p>
            </article>

            <div className="result-list">
              {results.map((item) => (
                <div key={`${item.level}-${item.title}`}>
                  <span>LEVEL {item.level} · {item.title}</span>
                  <strong>{scoreWithMax(item.score, item.maxScore)}</strong>
                  <small>오답 {item.mistakes}회</small>
                </div>
              ))}
            </div>

            <div className="start-actions">
              <button className="primary-action" onClick={() => startRun(0)} type="button">
                <Play size={19} aria-hidden="true" />
                다시 도전
              </button>
              <button className="ghost-action" onClick={() => setScreen("start")} type="button">
                <Home size={18} aria-hidden="true" />
                시작 화면
              </button>
            </div>
            <button
              className="practice-result-action"
              disabled={!canStartPractice}
              onClick={startPracticeRun}
              title={canStartPractice ? "실전문제 접수" : "마스터여우 달성 시 열립니다"}
              type="button"
            >
              <ClipboardList size={19} aria-hidden="true" />
              실전문제 접수
            </button>
            {!canStartPractice && <small className="practice-lock-note">마스터여우 달성 시 열립니다.</small>}
          </section>
        )}
      </main>

      {homeChoiceOpen && (
        <div className="sheet-backdrop" role="presentation" onClick={() => setHomeChoiceOpen(false)}>
          <section
            className="bottom-sheet home-choice-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="이동할 화면 선택"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-head">
              <div>
                <span>이동</span>
                <h2>어디로 이동할까요?</h2>
              </div>
              <button className="sheet-close" onClick={() => setHomeChoiceOpen(false)} type="button" title="닫기">
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <div className="home-choice-actions">
              <button
                onClick={() => {
                  setHomeChoiceOpen(false);
                  setScreen("start");
                }}
                type="button"
              >
                <Home size={18} aria-hidden="true" />
                시작 화면
              </button>
              <button
                onClick={() => {
                  setHomeChoiceOpen(false);
                  setScreen("levelSelect");
                }}
                type="button"
              >
                <ClipboardList size={18} aria-hidden="true" />
                레벨 선택
              </button>
            </div>
          </section>
        </div>
      )}

      {screen === "result" && tierPopupOpen && (
        <div className="sheet-backdrop tier-backdrop" role="presentation" onClick={() => setTierPopupOpen(false)}>
          <section
            className="bottom-sheet fox-tier-popup"
            role="dialog"
            aria-modal="true"
            aria-label={`최종 티어 ${resultTier.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="sheet-close tier-close" onClick={() => setTierPopupOpen(false)} type="button" title="닫기">
              <X size={22} aria-hidden="true" />
            </button>
            <div className="fox-tier-head">
              <strong>
                <em aria-hidden="true">{resultTier.icon}</em>
                {resultTier.name}
              </strong>
              <small>{resultTierPercent}% 달성</small>
            </div>
            <p className="fox-tier-copy">{resultTier.description}</p>
            <button className="primary-action" onClick={() => setTierPopupOpen(false)} type="button">
              확인
            </button>
          </section>
        </div>
      )}

      {scenarioOpen && (
        <div className="sheet-backdrop" role="presentation" onClick={() => setScenarioOpen(false)}>
          <section className="bottom-sheet scenario-sheet" role="dialog" aria-modal="true" aria-label="시나리오 다시보기" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-head">
              <div>
                <span>LEVEL {level.level}</span>
                <h2>{level.title} 시나리오</h2>
              </div>
              <button className="sheet-close" onClick={() => setScenarioOpen(false)} type="button" title="닫기">
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <div className="scenario-list">
              {level.narrative ? (
                <p className="scenario-narrative">
                  <strong>전체 상담 내용</strong>
                  {level.narrative}
                </p>
              ) : (
                level.scenario.map((line) => (
                  <p key={line}>{line}</p>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {clueReviewOpen && (
        <div className="sheet-backdrop" role="presentation" onClick={() => setClueReviewOpen(false)}>
          <section
            className="bottom-sheet clue-review-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="찾은 단서 다시보기"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-head">
              <div>
                <span>LEVEL {level.level}</span>
                <h2>찾은 단서 다시보기</h2>
              </div>
              <button className="sheet-close" onClick={() => setClueReviewOpen(false)} type="button" title="닫기">
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            {clueSummaryGroups.length > 0 ? (
              <div className="found-clue-summary is-review">
                {renderFoundClueGroups(clueSummaryGroups)}
              </div>
            ) : (
              <p className="empty-clue-review">아직 찾은 단서가 없습니다.</p>
            )}
          </section>
        </div>
      )}

      {calculatorOpen && (
        <div className="sheet-backdrop" role="presentation" onClick={() => setCalculatorOpen(false)}>
          <section
            className="bottom-sheet calculator-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="원리금 계산기"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-head">
              <div>
                <span>실제 계산</span>
                <h2>원리금 계산기</h2>
              </div>
              <button className="sheet-close" onClick={() => setCalculatorOpen(false)} type="button" title="닫기">
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            <div className="calculator-grid">
              <label>
                <span>채무 원금</span>
                <input
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setCalculatorDraft((current) => ({ ...current, principal: event.target.value }))}
                  placeholder="0"
                  type="number"
                  value={calculatorDraft.principal}
                />
                <em>천원</em>
              </label>
              <label>
                <span>연 이자율</span>
                <input
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setCalculatorDraft((current) => ({ ...current, annualRate: event.target.value }))}
                  placeholder="0"
                  step="0.1"
                  type="number"
                  value={calculatorDraft.annualRate}
                />
                <em>%</em>
              </label>
              <label>
                <span>상환기간</span>
                <input
                  inputMode="numeric"
                  min="1"
                  onChange={(event) => setCalculatorDraft((current) => ({ ...current, months: event.target.value }))}
                  placeholder="0"
                  type="number"
                  value={calculatorDraft.months}
                />
                <em>개월</em>
              </label>
            </div>

            <div className="calculator-result" aria-live="polite">
              {calculatorResult ? (
                <>
                  <div>
                    <span>월납부액</span>
                    <strong>{formatAmount(calculatorResult.monthlyPayment)}</strong>
                  </div>
                  <div>
                    <span>총 상환액</span>
                    <strong>{formatAmount(calculatorResult.totalPayment)}</strong>
                  </div>
                  <div>
                    <span>이자 합계</span>
                    <strong>{formatAmount(calculatorResult.interestPayment)}</strong>
                  </div>
                </>
              ) : (
                <p>채무 원금과 상환기간을 입력하면 월납부액이 계산됩니다.</p>
              )}
            </div>

            <button className="primary-action" onClick={() => setCalculatorOpen(false)} type="button">
              확인
            </button>
          </section>
        </div>
      )}

      {scorePopupOpen && (
        <div className="sheet-backdrop score-backdrop" role="presentation">
          <section
            className="bottom-sheet score-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="문항 점수"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="score-sheet-head">
              <span>접수 완료</span>
              <h2>이번 문항 점수</h2>
              <strong>{scoreWithMax(currentLevelScore, maxLevelScore)}</strong>
            </div>

            <div className="score-stars score-stars-large" aria-label={`별 ${currentStarCount}개`}>
              {Array.from({ length: 5 }).map((_, index) => (
                <span className={index < currentStarCount ? "is-filled" : ""} key={index}>
                  ★
                </span>
              ))}
            </div>

            <div className="score-breakdown">
              <div>
                <span>단서</span>
                <strong>{scoredClueCount}/{level.fields.length}</strong>
                {autoSolvedClueCount > 0 && <small>자동완료 {autoSolvedClueCount}개 제외</small>}
              </div>
              <div>
                <span>오답</span>
                <strong>{levelMistakes}회</strong>
              </div>
            </div>

            <button className="primary-action" onClick={showCalculationResult} type="button">
              <ChevronRight size={19} aria-hidden="true" />
              결과 보기
            </button>
          </section>
        </div>
      )}

      {assist && (
        <div className="sheet-backdrop" role="presentation" onClick={() => setAssist(null)}>
          <section className="bottom-sheet assist-sheet" role="dialog" aria-modal="true" aria-label="힌트" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-head">
              <div>
                <span>도움말</span>
                <h2>{assist.title}</h2>
              </div>
              <button className="sheet-close" onClick={() => setAssist(null)} type="button" title="닫기">
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <p>{assist.body}</p>
            {assist.answer && (
              <div className="answer-box">
                {showAssistAnswer ? (
                  <>
                    <span>정답</span>
                    <strong>{assist.answer}</strong>
                  </>
                ) : (
                  <button className="answer-button" onClick={() => setShowAssistAnswer(true)} type="button">
                    <Eye size={18} aria-hidden="true" />
                    정답 보기
                  </button>
                )}
              </div>
            )}
            <div className="sheet-actions">
              {assist.onFill && showAssistAnswer && (
                <button
                  className="ghost-action"
                  onClick={() => {
                    assist.onFill?.();
                    setAssist(null);
                  }}
                  type="button"
                >
                  값 채우기
                </button>
              )}
              <button className="primary-action" onClick={() => setAssist(null)} type="button">
                확인
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
