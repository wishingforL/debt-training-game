import {
  formatMoney,
  livingExpenseBasisForDependents,
  paymentForMonths,
  repaymentMonthsForPayment,
  specialLivingExpenseForMaxPeriod,
  type CalculationResult,
} from "./calculation";
import { SUPPORT_OPTIONS } from "./data/levels";
import type { DecoyClue, FieldValue, IntakeField, LevelData, ScreenName, StoredStats } from "./types";

export const STORAGE_KEY = "rookie-debt-adjustment-game-v1";
export const PAYMENT_SNAP_TOLERANCE = 0.25;
export const MONEY_INPUT_SCALE = 10;
export const PAYMENT_SLIDER_MAX = 100;
export const PAYMENT_FOCUS_RULES = [
  { minIncome: 400, rangeRatio: 0.07, sliderShare: 20 },
  { minIncome: 300, rangeRatio: 0.08, sliderShare: 15 },
  { minIncome: 200, rangeRatio: 0.09, sliderShare: 12 },
  { minIncome: 0, rangeRatio: 0.1, sliderShare: 10 },
];
export const LOW_PAYMENT_COMPACT_LIMIT = 10;
export const LOW_LIVING_EXPENSE_RATIO = 0.3;
export const LOW_PAYMENT_SLIDER_WEIGHT = 1.5;
export const BEFORE_FOCUS_SLIDER_WEIGHT = 44;
export const AFTER_FOCUS_SLIDER_WEIGHT = 42.5;
export const HIGH_PAYMENT_SLIDER_WEIGHT = 2;
export const MIN_LIVING_EXPENSE_RATIO = 0.9;
export const MONEY_FIELD_KEYS = new Set([
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
export const SCREEN_ORDER: ScreenName[] = ["소득", "가족", "주거", "채무현황", "재산", "특이사항", "급여가압류"];
export const TUTORIAL_PAGES = [
  {
    badge: "게임 소개",
    title: "신입 직원이 되어 접수 단서를 찾습니다.",
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
export const TUTORIAL_GROUPS = [
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
export const TUTORIAL_CHIP_EXAMPLES: Record<string, Record<string, string>> = {
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
export const emptyStats: StoredStats = {
  bestScore: 0,
  clearedLevel: 0,
  practiceUnlocked: false,
  runs: 0,
  lastScore: 0,
};

export const FOX_TIERS = [
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
    description: "복잡한 사례 속 숨겨진 단서를 찾아내는 능력자",
  },
  {
    icon: "👑",
    minRatio: 0.9,
    name: "마스터여우",
    description: "어떤 사례도 해결할 수 있는 최고 능력자",
  },
];

export type Screen = "start" | "tutorial" | "levelSelect" | "game" | "result" | "practiceResult";
export type Phase = "scenario" | "calculation" | "mission";

export type MissionDraft = {
  supportType: string;
  monthlyPayment: string;
  repaymentPeriod: string;
};

export type AssistState = {
  title: string;
  body: string;
  answer?: string;
  onFill?: () => void;
};

export type CalculatorDraft = {
  principal: string;
  annualRate: string;
  months: string;
};

export type AdditionalLivingExpenseItem = {
  active: boolean;
  amount: number;
  label: string;
  value: string;
};

export const formatNumber = (value: number) => new Intl.NumberFormat("ko-KR").format(value);
export const normalizeNumber = (value: string) => Number(value.replace(/,/g, "").trim());
export const round1 = (value: number) => Math.round(value * 10) / 10;

export function isMoneyField(field: IntakeField) {
  return field.unit === "천원" || MONEY_FIELD_KEYS.has(field.key);
}

export function formatAmount(valueInManwon: number) {
  return `${formatMoney(Math.round(valueInManwon) * MONEY_INPUT_SCALE)}천원`;
}

export function comparisonSign(value: number) {
  if (value > 0) return ">";
  if (value < 0) return "<";
  return "=";
}

export function livingExpenseIncomeComparison(maxLivingExpense: number, income: number) {
  return `${formatAmount(maxLivingExpense)} - ${formatAmount(income)} ${comparisonSign(maxLivingExpense - income)} 0`;
}

export function canUseMaxRepaymentPeriod(maxLivingExpense: number, income: number) {
  return maxLivingExpense - income >= 0;
}

export function maxRepaymentAvailabilityText(maxLivingExpense: number, income: number, maxRepaymentMonths: number) {
  const status = canUseMaxRepaymentPeriod(maxLivingExpense, income) ? "가능" : "추가 검증 필요";
  return `최대 ${maxRepaymentMonths}개월 ${status}`;
}

export type MaxRepaymentReviewData = {
  additionalLivingExpense: number;
  baseAdditionalLivingExpense?: number;
  annualInterestRate?: number;
  maxLivingExpense: number;
  maxRepaymentMonths: number;
  repaymentBaseIncome: number;
  specialLivingExpense?: number;
  specialLivingExpenseLimit?: number;
  supportType: string;
  targetDebt: number;
};

export function annualInterestRateForSupport(supportType: string, fallback = 0) {
  const annualInterestRateBySupportType: Record<string, number> = {
    신속채무조정: 0.11,
    사전채무조정: 0.06,
    개인워크아웃: 0,
  };

  return annualInterestRateBySupportType[supportType] ?? fallback;
}

export function maxPeriodMonthlyPaymentFor(data: MaxRepaymentReviewData) {
  const annualInterestRate = data.annualInterestRate ?? annualInterestRateForSupport(data.supportType);
  return Math.round(paymentForMonths(data.targetDebt, data.maxRepaymentMonths, annualInterestRate / 12));
}

export function maxPeriodPaymentFormulaText(data: MaxRepaymentReviewData) {
  const methodLabel = (data.annualInterestRate ?? annualInterestRateForSupport(data.supportType)) > 0 ? "원리금" : "원금";

  return `${formatAmount(data.targetDebt)} ${data.maxRepaymentMonths}개월 ${methodLabel}\n= ${formatAmount(maxPeriodMonthlyPaymentFor(data))}`;
}

export function recognizedMaxLivingExpenseFor(data: MaxRepaymentReviewData) {
  return round1(data.maxLivingExpense + data.additionalLivingExpense);
}

export function specialLivingExpenseFor(data: MaxRepaymentReviewData) {
  return data.specialLivingExpense ?? 0;
}

export function baseAdditionalLivingExpenseFor(data: MaxRepaymentReviewData) {
  return data.baseAdditionalLivingExpense ?? round1(Math.max(0, data.additionalLivingExpense - specialLivingExpenseFor(data)));
}

export function recognizedLivingExpenseLabel(data: MaxRepaymentReviewData) {
  const baseExtra = baseAdditionalLivingExpenseFor(data);
  const specialExtra = specialLivingExpenseFor(data);

  if (baseExtra > 0 && specialExtra > 0) return "최대생활비 + 추가인정 생활비 + 기타 특별 생활비";
  if (specialExtra > 0) return "최대생활비 + 기타 특별 생활비";
  if (baseExtra > 0) return "최대생활비 + 추가인정 생활비";
  return "최대생활비";
}

export function recognizedLivingExpenseFormulaTextFor(data: MaxRepaymentReviewData, livingExpense: number) {
  const baseExtra = baseAdditionalLivingExpenseFor(data);
  const specialExtra = specialLivingExpenseFor(data);
  const parts = [formatAmount(data.maxLivingExpense)];

  if (baseExtra > 0) parts.push(formatAmount(baseExtra));
  if (specialExtra > 0) parts.push(formatAmount(specialExtra));

  return `${parts.join(" + ")} = ${formatAmount(livingExpense)}`;
}

export function recognizedLivingExpenseFormulaDisplayTextFor(data: MaxRepaymentReviewData, livingExpense: number) {
  return recognizedLivingExpenseFormulaTextFor(data, livingExpense);
}

export function needsMaxRepaymentVerification(data: MaxRepaymentReviewData) {
  return !canUseMaxRepaymentPeriod(data.maxLivingExpense, data.repaymentBaseIncome);
}

export function maxRepaymentVerificationValue(data: MaxRepaymentReviewData) {
  return round1(
    data.repaymentBaseIncome -
      recognizedMaxLivingExpenseFor(data) -
      maxPeriodMonthlyPaymentFor(data),
  );
}

export function maxRepaymentVerificationLabel(data: MaxRepaymentReviewData) {
  const baseExtra = baseAdditionalLivingExpenseFor(data);
  const specialExtra = specialLivingExpenseFor(data);

  if (baseExtra > 0 && specialExtra > 0) {
    return "소득-(최대생활비+추가+기타)-월납부액";
  }
  if (specialExtra > 0) return "소득-(최대생활비+기타)-월납부액";
  if (baseExtra > 0) return "소득-(최대생활비+추가)-월납부액";
  return "소득-최대생활비-월납부액";
}

export function maxRepaymentVerificationFormulaText(data: MaxRepaymentReviewData) {
  const value = maxRepaymentVerificationValue(data);

  return `${formatAmount(data.repaymentBaseIncome)} - ${formatAmount(recognizedMaxLivingExpenseFor(data))} - ${formatAmount(maxPeriodMonthlyPaymentFor(data))} ${comparisonSign(value)} 0`;
}

export function isMaxRepaymentVerifiedPossible(data: MaxRepaymentReviewData) {
  return maxRepaymentVerificationValue(data) <= 0;
}

export function maxRepaymentVerificationStatusText(data: MaxRepaymentReviewData) {
  return `${data.maxRepaymentMonths}개월 ${isMaxRepaymentVerifiedPossible(data) ? "가능" : "불가"}`;
}

export function livingExpenseFormulaText(baseIncome: number, monthlyPayment: number, livingExpense: number) {
  return `${formatAmount(baseIncome)} - ${formatAmount(monthlyPayment)} = ${formatAmount(livingExpense)}`;
}

export function dependentAnswerLabel(householdMembers: number) {
  const dependents = Math.max(0, householdMembers - 1);
  return `${formatNumber(dependents)}명 (${formatNumber(householdMembers)}인 가구)`;
}

export function monthlyPaymentFormulaText(baseIncome: number, livingExpense: number, monthlyPayment: number) {
  return `${formatAmount(baseIncome)} - ${formatAmount(livingExpense)} = ${formatAmount(monthlyPayment)}`;
}

export function maxLivingExpenseIncomeLabel(hasSecuredPayment: boolean) {
  return (
    <>
      <span>최대생활비</span>
      <span>
        - {hasSecuredPayment ? <><strong>남은</strong>소득</> : "소득"}
      </span>
    </>
  );
}

export type CalculationReasonData = MaxRepaymentReviewData & {
  adjustedLivingExpense: number;
  householdMembers: number;
  income: number;
  monthlyPayment: number;
  repaymentPeriod: number;
  securedPayment: number;
};

export function livingExpenseReasonText(data: CalculationReasonData) {
  const baseExtra = baseAdditionalLivingExpenseFor(data);
  const specialExtra = specialLivingExpenseFor(data);

  if (baseExtra > 0 && specialExtra > 0) {
    return `최대생활비(${formatAmount(data.maxLivingExpense)})에 추가인정 생활비(${formatAmount(baseExtra)})와 기타 특별 생활비(${formatAmount(specialExtra)})를 더한 ${formatAmount(data.adjustedLivingExpense)}을 생활비로 반영합니다.`;
  }
  if (specialExtra > 0) {
    return `최대생활비(${formatAmount(data.maxLivingExpense)})에 기타 특별 생활비(${formatAmount(specialExtra)})를 더한 ${formatAmount(data.adjustedLivingExpense)}을 생활비로 반영합니다.`;
  }
  if (baseExtra > 0) {
    return `최대생활비(${formatAmount(data.maxLivingExpense)})에 추가인정 생활비(${formatAmount(baseExtra)})를 더한 ${formatAmount(data.adjustedLivingExpense)}을 생활비로 반영합니다.`;
  }
  return "가구수 기준 최대생활비와 소득을 비교해 최대 상환기간 가능 여부를 확인합니다.";
}

export function dependentRuleNoteFor(level?: LevelData) {
  if (level?.id === "practice-5") {
    return "신청인 소득이 낮아 대학생 자녀와 70세 모친은 이번 산정에서 제외하고, 본인만 1인 가구로 봅니다.";
  }

  return "";
}

export function calculationReasonSteps(data: CalculationReasonData, overdueDays: number, level?: LevelData) {
  const hasSecuredDeduction = hasSecuredIncomeDeduction(data);
  const baseIncomeLabel = hasSecuredDeduction ? "남은소득" : "소득";
  const dependentRuleNote = dependentRuleNoteFor(level);
  const maxPayment = maxPeriodMonthlyPaymentFor(data);
  const usesMaxPeriodPayment =
    canUseMaxRepaymentPeriod(data.maxLivingExpense, data.repaymentBaseIncome) ||
    (needsMaxRepaymentVerification(data) && isMaxRepaymentVerifiedPossible(data));
  const appliedMonthlyPayment = usesMaxPeriodPayment ? maxPayment : data.monthlyPayment;

  return [
    `연체 ${formatNumber(overdueDays)}일 기준으로 ${data.supportType}을 선택합니다.`,
    dependentRuleNote || `부양가족 ${dependentAnswerLabel(data.householdMembers)} 기준으로 생활비 범위를 확인합니다.`,
    hasSecuredDeduction
      ? `담보 원리금 ${formatAmount(data.securedPayment)}을 먼저 차감해 ${baseIncomeLabel} ${formatAmount(data.repaymentBaseIncome)}을 기준으로 봅니다.`
      : `${baseIncomeLabel} ${formatAmount(data.repaymentBaseIncome)}에서 생활비와 월납부액을 확인합니다.`,
    livingExpenseReasonText(data),
    usesMaxPeriodPayment
      ? `최대 상환기간의 월납부액 ${formatAmount(appliedMonthlyPayment)}을 적용하고 생활비 ${formatAmount(data.adjustedLivingExpense)}이 남는지 확인합니다.`
      : `대상채무 ${formatAmount(data.targetDebt)}을 매월 ${formatAmount(data.monthlyPayment)}(월납부액, ${formatAmount(data.repaymentBaseIncome)} - ${formatAmount(data.adjustedLivingExpense)})으로 상환하면 ${data.repaymentPeriod}개월이 걸립니다.`,
  ];
}

export function renderCalculationAnswerCard(data: CalculationReasonData) {
  return (
    <section className="calc-answer-card" aria-label="최종 정답 요약">
      <span>최종 정답</span>
      <div>
        <small>지원구분</small>
        <strong>{resultSupportTypeLabel(data.supportType)}</strong>
      </div>
      <div>
        <small>부양가족</small>
        <strong>{dependentAnswerLabel(data.householdMembers)}</strong>
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

export function renderCalculationReasonCard(data: CalculationReasonData, overdueDays: number, level?: LevelData) {
  return (
    <section className="calc-reason-card" aria-label="정답 판단 요약">
      <div>
        <strong>왜 이 답인가요?</strong>
      </div>
      <ol>
        {calculationReasonSteps(data, overdueDays, level).map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}

export function hasSecuredIncomeDeduction({
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

export function fieldUnitLabel(field: IntakeField) {
  return isMoneyField(field) ? "천원" : field.unit ?? "";
}

export type PaymentSliderSegment = {
  paymentEnd: number;
  paymentStart: number;
  sliderEnd: number;
  sliderStart: number;
};

export const SCORE_BASE = 500;
export const SCORE_CLUE_BONUS = 20;
export const SCORE_MISTAKE_PENALTY = 50;
export const SCORE_MINIMUM = 100;

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function levelMaxScoreFor(level: Pick<LevelData, "fields">) {
  return SCORE_BASE + level.fields.length * SCORE_CLUE_BONUS;
}

export function levelScoreFor(level: Pick<LevelData, "fields">, foundClues: number, mistakes: number) {
  const boundedClues = clamp(foundClues, 0, level.fields.length);
  return Math.max(SCORE_MINIMUM, SCORE_BASE + boundedClues * SCORE_CLUE_BONUS - mistakes * SCORE_MISTAKE_PENALTY);
}

export function scoreWithMax(score: number, maxScore: number) {
  return `${formatNumber(score)}/${formatNumber(maxScore)}점`;
}

export function foxTierFor(score: number, maxScore: number) {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  return [...FOX_TIERS].reverse().find((tier) => ratio >= tier.minRatio) ?? FOX_TIERS[0];
}

export function paymentFocusRuleForIncome(income: number) {
  return PAYMENT_FOCUS_RULES.find((rule) => income >= rule.minIncome) ?? PAYMENT_FOCUS_RULES[PAYMENT_FOCUS_RULES.length - 1];
}

export function buildPaymentSliderSegments(income: number, targetPayment: number) {
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

export function sliderMaxForIncome() {
  return PAYMENT_SLIDER_MAX;
}

export function paymentToSlider(monthlyPayment: number, income: number, targetPayment: number) {
  const safePayment = clamp(monthlyPayment, 0, Math.max(0, income));
  const segments = buildPaymentSliderSegments(income, targetPayment);
  const segment = segments.find((item) => safePayment <= item.paymentEnd) ?? segments[segments.length - 1];
  if (!segment || segment.paymentEnd === segment.paymentStart) return 0;

  const ratio = (safePayment - segment.paymentStart) / (segment.paymentEnd - segment.paymentStart);
  return clamp(segment.sliderStart + ratio * (segment.sliderEnd - segment.sliderStart), 0, PAYMENT_SLIDER_MAX);
}

export function sliderToPayment(sliderValue: number, income: number, targetPayment: number) {
  const safeSliderValue = clamp(sliderValue, 0, PAYMENT_SLIDER_MAX);
  const segments = buildPaymentSliderSegments(income, targetPayment);
  const segment = segments.find((item) => safeSliderValue <= item.sliderEnd) ?? segments[segments.length - 1];
  if (!segment || segment.sliderEnd === segment.sliderStart) return 0;

  const ratio = (safeSliderValue - segment.sliderStart) / (segment.sliderEnd - segment.sliderStart);
  return round1(segment.paymentStart + ratio * (segment.paymentEnd - segment.paymentStart));
}

export function loadStats(): StoredStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats;
    return { ...emptyStats, ...JSON.parse(raw) };
  } catch {
    return emptyStats;
  }
}

export function saveStats(stats: StoredStats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function screenOrderIndex(screenName: ScreenName) {
  const index = SCREEN_ORDER.indexOf(screenName);
  return index >= 0 ? index : SCREEN_ORDER.length;
}

export function debtSummaryOrderKey(key: string) {
  if (key === "overdueDays") return 0;
  if (key === "debt") return 1;
  if (key === "unsecuredDebt" || key.startsWith("unsecuredDebt.")) return 1;
  if (key === "securedDebt" || key.startsWith("securedDebt.")) return 2;
  if (key === "securedPayment" || key.startsWith("securedPayment.")) return 3;
  return 99;
}

export function fieldSummaryOrder(field: IntakeField) {
  return debtSummaryOrderKey(field.key);
}

export function compareFieldsByScreenOrder(level: LevelData, first: IntakeField, second: IntakeField) {
  const firstScreenOrder = screenOrderIndex(first.screen);
  const secondScreenOrder = screenOrderIndex(second.screen);

  if (firstScreenOrder !== secondScreenOrder) return firstScreenOrder - secondScreenOrder;
  const firstFieldOrder = fieldSummaryOrder(first);
  const secondFieldOrder = fieldSummaryOrder(second);
  if (firstFieldOrder !== secondFieldOrder) return firstFieldOrder - secondFieldOrder;

  return level.fields.findIndex((field) => field.key === first.key) - level.fields.findIndex((field) => field.key === second.key);
}

export function fieldsInScenarioOrder(level: LevelData) {
  if (level.narrative) {
    return [...level.fields].sort((first, second) => compareFieldsByScreenOrder(level, first, second));
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

  return ordered.sort((first, second) => compareFieldsByScreenOrder(level, first, second));
}

export function scenarioLineScreenOrder(level: LevelData, line: string, originalIndex: number) {
  const matchedScreens = level.fields
    .filter((field) => line.includes(fieldClue(field)))
    .map((field) => screenOrderIndex(field.screen));

  if (matchedScreens.length === 0) return SCREEN_ORDER.length + originalIndex / 1000;
  return Math.min(...matchedScreens);
}

export function scenarioLinesInScreenOrder(level: LevelData) {
  return level.scenario
    .map((line, index) => ({ line, index }))
    .sort((first, second) => {
      const firstOrder = scenarioLineScreenOrder(level, first.line, first.index);
      const secondOrder = scenarioLineScreenOrder(level, second.line, second.index);
      return firstOrder === secondOrder ? first.index - second.index : firstOrder - secondOrder;
    })
    .map((item) => item.line);
}

export function nextOpenFieldInOrder(level: LevelData, solved: Record<string, boolean>, orderedFields: IntakeField[], fallback: number) {
  const nextField = orderedFields.find((field) => !solved[field.key]);
  if (!nextField) return Math.min(fallback, level.fields.length - 1);

  const nextIndex = level.fields.findIndex((field) => field.key === nextField.key);
  return nextIndex >= 0 ? nextIndex : Math.min(fallback, level.fields.length - 1);
}

export function debtClueGroupKey(field: IntakeField) {
  if (field.key.startsWith("unsecuredDebt.")) return "unsecuredDebt";
  if (field.key.startsWith("securedDebt.")) return "securedDebt";
  return null;
}

export function sameDebtClueGroup(first: IntakeField, second: IntakeField) {
  const firstGroup = debtClueGroupKey(first);
  return firstGroup !== null && firstGroup === debtClueGroupKey(second);
}

export function sameDependentClueGroup(first: IntakeField, second: IntakeField) {
  return first.key.startsWith("dependent.") && second.key.startsWith("dependent.");
}

export function fieldValueLabel(field: IntakeField, value: FieldValue = field.answer) {
  if (typeof value === "boolean") return value ? "있음" : "없음";
  if (field.key === "dependents" && typeof value === "number") {
    return `${formatNumber(value)}명 (${formatNumber(value + 1)}인 가구)`;
  }
  if (typeof value === "number") return isMoneyField(field) ? formatAmount(value) : `${formatNumber(value)}${fieldUnitLabel(field)}`;
  return value;
}

export function numericAnswer(level: LevelData, key: string) {
  const value = level.fields.find((field) => field.key === key)?.answer;
  return typeof value === "number" ? value : 0;
}

export function numericAnswers(level: LevelData, key: string) {
  return round1(
    level.fields
      .filter((field) => field.key === key || field.key.startsWith(`${key}.`))
      .reduce((sum, field) => sum + (typeof field.answer === "number" ? field.answer : 0), 0),
  );
}

export function stringAnswer(level: LevelData, key: string) {
  const value = level.fields.find((field) => field.key === key)?.answer;
  return typeof value === "string" ? value : "";
}

export function additionalLivingExpenseItems(level: LevelData): AdditionalLivingExpenseItem[] {
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

export function fieldClue(field: IntakeField) {
  return field.clue ?? fieldValueLabel(field);
}

export function clueMarkerLabel(field: IntakeField) {
  if (field.type === "choice") return String(field.answer);
  return fieldValueLabel(field);
}

export function compactDebtClueMarker(label: string) {
  return label.replace(/^00\S+\s+/, "");
}

export function scenarioMarkerLabel(field: IntakeField, line: string) {
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
    return line.includes("담보채무는 없습니다") ? "담보채무는 없습니다" : "담보채무";
  }

  if (field.key.startsWith("unsecuredDebt.") || field.key.startsWith("securedDebt.")) {
    const clue = fieldClue(field).replace(/\.$/, "");
    if (line.includes(clue)) return compactDebtClueMarker(clue);
  }

  if (line.includes(answerLabel)) return answerLabel;

  const clue = fieldClue(field);
  if (clue === line) return line.replace(/\.$/, "");
  if (line.includes(clue)) return clue.replace(/\.$/, "");
  return answerLabel;
}

export function scenarioMarkerLabels(field: IntakeField, line: string) {
  if (field.key.startsWith("unsecuredDebt.") || field.key.startsWith("securedDebt.")) {
    const clue = fieldClue(field).replace(/\.$/, "");

    if (line.includes(clue)) {
      const compactClue = compactDebtClueMarker(clue).replace(/[,.]$/u, "").trim();
      const amountMatch = compactClue.match(/[\d,]+천원/u);

      if (amountMatch) {
        const amountLabel = amountMatch[0];
        const debtTypeLabel = compactClue
          .replace(amountLabel, "")
          .replace(/[,\s]+$/u, "")
          .trim();

        return [debtTypeLabel, amountLabel].filter((label) => label.length > 0 && line.includes(label));
      }
    }
  }

  const label = scenarioMarkerLabel(field, line);
  return label ? [label] : [];
}

export function allIndexesOf(text: string, query: string) {
  const indexes: number[] = [];
  if (!query) return indexes;

  let index = text.indexOf(query);
  while (index >= 0) {
    indexes.push(index);
    index = text.indexOf(query, index + query.length);
  }

  return indexes;
}

export function markerIndexInContext(text: string, label: string, context?: string) {
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

export function scenarioMarkerIndex(field: IntakeField, line: string, label: string) {
  return markerIndexInContext(line, label, fieldClue(field));
}

export function scenarioDecoyMarkerIndex(decoy: DecoyClue, line: string) {
  return markerIndexInContext(line, decoy.label, decoy.clue);
}

export function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

export function uniqueFields<T extends { key: string }>(fields: T[]) {
  return fields.filter((field, index, list) => list.findIndex((item) => item.key === field.key) === index);
}

export function cluePromptLabel(label: string) {
  return label.replace(/\s*단서$/u, "").trim();
}

export function levelSelectClueCount(item: LevelData) {
  return item.fields.filter((field) => field.key !== "housingType").length;
}

export function fieldHint(field: IntakeField) {
  if (field.key.startsWith("dependent.")) {
    return [
      `${field.screen} 화면의 ${field.label} 항목입니다.`,
      "부양가족으로 인정되는 사람의 단서만 터치하세요. 소득이 있거나 별도 산정 대상이 아닌 가족은 선택하지 않습니다.",
    ].join("\n");
  }

  if (field.key.startsWith("unsecuredDebt.")) {
    return [
      `${field.screen} 화면의 ${field.label} 항목입니다.`,
      "담보가 없는 빚을 누르세요. 카드대금, 카드론, 신용대출처럼 신용으로 빌린 금액입니다.",
      "여러 개가 있으면 순서와 상관없이 각각 눌러 합산합니다.",
    ].join("\n");
  }

  if (field.key.startsWith("securedDebt.")) {
    return [
      `${field.screen} 화면의 ${field.label} 항목입니다.`,
      "담보가 붙은 대출 금액을 누르세요. 주택담보, 전세담보, 차량담보, 보증서담보가 여기에 해당합니다.",
      "카드대금이나 신용대출 금액은 누르지 않습니다.",
    ].join("\n");
  }

  if (field.key.startsWith("securedPayment.")) {
    return [
      `${field.screen} 화면의 ${field.label} 항목입니다.`,
      "대출 잔액이 아니라 매월 내는 돈을 누르세요.",
      "예: 매월 250천원씩 내고 있습니다.",
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

export function practiceFieldHint(field: IntakeField, level: LevelData) {
  if (!level.narrative) return fieldHint(field);

  const notes: string[] = [];

  if (field.screen === "가족") {
    notes.push("인정 부양가족만 선택합니다. 소득으로 생활하는 가족, 이혼한 배우자처럼 제외 사유가 있는 사람은 누르지 않습니다.");
  }

  if (field.screen === "채무현황") {
    notes.push("신용채무는 월납부액을 계산할 때 쓰는 빚입니다.");
    notes.push("담보대출은 집, 전세, 차량, 보증서처럼 담보가 붙은 대출입니다.");
    notes.push("매월 내는 담보 원리금이나 이자는 소득에서 먼저 빼는 금액입니다.");
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

export function fieldAnswerText(field: IntakeField) {
  const clue = fieldClue(field);
  const marker = scenarioMarkerLabel(field, clue);

  return [
    `눌러야 하는 단서\n${marker}`,
    `접수 화면에 정리되는 값\n${field.label} ${fieldValueLabel(field)}`,
    `원문\n${clue}`,
  ].join("\n");
}

export function supportHint(level: LevelData) {
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

export function missionHint(calculation: CalculationResult) {
  const maxPeriodMonthlyPayment = maxPeriodMonthlyPaymentFor(calculation);
  const maxPeriodStatus = calculation.cappedByMaxPeriod
    ? "소득이 높지 않아 상환기간 최장이 가능합니다."
    : "소득이 높아 상환기간 최장이 불가합니다.";

  return [
    `1. 부양가족: ${dependentAnswerLabel(calculation.householdMembers)}`,
    `2. ${maxPeriodStatus}`,
    `3. 최대상환 기간: ${calculation.maxRepaymentMonths}개월`,
    `4. 최대상환 기간 월납부금액: ${formatAmount(maxPeriodMonthlyPayment)}`,
  ].join("\n");
}

export function missionAnswerText(calculation: CalculationResult) {
  return [
    `지원구분: ${calculation.mission.supportType}`,
    `부양가족: ${dependentAnswerLabel(calculation.householdMembers)}`,
    `월납부액: ${formatAmount(calculation.mission.monthlyPayment)}`,
    `상환기간: ${calculation.mission.repaymentPeriod}개월`,
    `생활비: ${formatAmount(calculation.adjustedLivingExpense)}`,
  ].join("\n");
}

export function repaymentPeriodFormulaText(calculation: CalculationResult) {
  const maxPeriodMonthlyPayment = maxPeriodMonthlyPaymentFor(calculation);

  if (calculation.annualInterestRate > 0) {
    return `${formatAmount(calculation.targetDebt)} ${calculation.maxRepaymentMonths}개월 원리금\n= ${formatAmount(maxPeriodMonthlyPayment)}`;
  }

  return `${formatAmount(calculation.targetDebt)} ${calculation.maxRepaymentMonths}개월 원금\n= ${formatAmount(maxPeriodMonthlyPayment)}`;
}

export function supportOptionMeta(option: string) {
  const labels: Record<string, { detail: string; title: string }> = {
    신속채무조정: { detail: "원리금상환, 이자율 11%(가정)", title: "신속채무조정" },
    사전채무조정: { detail: "원리금상환, 이자율 6%(가정)", title: "사전채무조정" },
    개인워크아웃: { detail: "원금상환", title: "개인워크아웃" },
  };

  return labels[option] ?? { detail: "", title: option };
}

export function resultSupportTypeLabel(option: string) {
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

export function supportTermsFor(option: string, fallback: CalculationResult) {
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
