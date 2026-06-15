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
import { useMemo, useState, type CSSProperties } from "react";
import {
  calculateLevel,
  formatMoney,
  livingExpenseBasisForDependents,
  paymentForMonths,
  repaymentMonthsForPayment,
  type CalculationResult,
} from "./calculation";
import { LEVELS, SUPPORT_OPTIONS } from "./data/levels";
import type { FieldValue, IntakeField, LevelData, LevelResult, StoredStats } from "./types";
import startHero from "../assets/start-hero.jpg";

const STORAGE_KEY = "rookie-debt-adjustment-game-v1";
const PAYMENT_SNAP_TOLERANCE = 0.25;
const MONEY_INPUT_SCALE = 10;
const PAYMENT_SLIDER_MAX = 100;
const HIGH_INCOME_PAYMENT_THRESHOLD = 400;
const DEFAULT_PAYMENT_FOCUS_RANGE_RATIO = 0.1;
const DEFAULT_PAYMENT_FOCUS_SLIDER_SHARE = 10;
const HIGH_INCOME_PAYMENT_FOCUS_RANGE_RATIO = 0.05;
const HIGH_INCOME_PAYMENT_FOCUS_SLIDER_SHARE = 15;
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
      "단서를 많이 찾고 오답이 적을수록 높은 점수를 받습니다.",
      "결과 보기 전 문항 점수와 단서 수, 오답 수를 확인하세요.",
    ],
    chips: ["문항 점수", "단서", "오답", "결과 보기"],
  },
];
const emptyStats: StoredStats = {
  bestScore: 0,
  clearedLevel: 0,
  runs: 0,
  lastScore: 0,
};

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
  return MONEY_FIELD_KEYS.has(field.key);
}

function formatAmount(valueInManwon: number) {
  return `${formatMoney(Math.round(valueInManwon) * MONEY_INPUT_SCALE)}천원`;
}

function formatAmountNumber(valueInManwon: number) {
  return formatMoney(Math.round(valueInManwon) * MONEY_INPUT_SCALE);
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildPaymentSliderSegments(income: number, targetPayment: number) {
  const safeIncome = Math.max(0, income);
  if (safeIncome <= 0) {
    return [{ paymentStart: 0, paymentEnd: 0, sliderStart: 0, sliderEnd: PAYMENT_SLIDER_MAX }];
  }

  const safeTarget = clamp(targetPayment, 0, safeIncome);
  const isHighIncome = safeIncome >= HIGH_INCOME_PAYMENT_THRESHOLD;
  const focusRangeRatio = isHighIncome ? HIGH_INCOME_PAYMENT_FOCUS_RANGE_RATIO : DEFAULT_PAYMENT_FOCUS_RANGE_RATIO;
  const focusSliderShare = isHighIncome ? HIGH_INCOME_PAYMENT_FOCUS_SLIDER_SHARE : DEFAULT_PAYMENT_FOCUS_SLIDER_SHARE;
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

function stringAnswer(level: LevelData, key: string) {
  const value = level.fields.find((field) => field.key === key)?.answer;
  return typeof value === "string" ? value : "";
}

function additionalLivingExpenseItems(level: LevelData): AdditionalLivingExpenseItem[] {
  if (level.level < 5) return [];

  const scenarioText = level.scenario.join(" ");
  const isSeoul = stringAnswer(level, "residenceArea") === "서울" || scenarioText.includes("서울");
  const hasCollegeChild = scenarioText.includes("대학생");
  const medicalExpense = numericAnswer(level, "medicalExpense");
  const isSingleHousehold = numericAnswer(level, "dependents") === 0 && scenarioText.includes("미혼");

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

  if (field.key === "dependents") {
    if (Number(field.answer) === 0 && line.includes("미혼")) return "미혼";
    const dependentPhrase = line.split("을 부양")[0]?.split("를 부양")[0]?.trim();
    if (dependentPhrase && dependentPhrase !== line) return dependentPhrase;
  }

  if (field.key === "housingType") {
    const rentMatch = line.match(/월세\s[\d,]+천원/);
    if (rentMatch) return rentMatch[0];
    const jeonseMatch = line.match(/전세보증금\s[\d,]+천원/);
    if (jeonseMatch) return jeonseMatch[0];
    if (line.includes("보증금")) return "보증금";
  }

  if (field.key === "hasVehicle" && line.includes("차량")) {
    if (line.includes("차량 한 대")) return "차량 한 대";
    return "차량";
  }

  if (field.key === "homeOwned" && line.includes("본인 명의 집")) {
    return "본인 명의 집";
  }

  if (field.key === "wageGarnishment" && line.includes("급여")) {
    if (line.includes("급여가 압류")) return "급여가 압류";
    return "급여";
  }

  if (field.key === "securedDebt" && Number(field.answer) === 0 && line.includes("담보채무")) {
    return "담보채무";
  }

  if (line.includes(answerLabel)) return answerLabel;
  return answerLabel;
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

  return [
    `현재 문항 연체일수: ${formatNumber(overdueDays)}일`,
    "30일 이하 = 신속채무조정",
    "31~89일 = 사전채무조정",
    "90일 이상 = 개인워크아웃",
  ].join("\n");
}

function missionHint(calculation: CalculationResult, level: LevelData) {
  const overdueDays = numericAnswer(level, "overdueDays");
  const supportMeta = supportOptionMeta(calculation.supportType);
  const incomeLabel = calculation.securedPayment > 0 ? "남은 소득" : "소득";
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
    calculation.securedPayment > 0
      ? `남은 소득: 총 소득 ${formatAmount(calculation.income)} - 담보 원리금 ${formatAmount(calculation.securedPayment)} = ${formatAmount(calculation.repaymentBaseIncome)}`
      : `소득: ${formatAmount(calculation.income)}`,
    ...livingLines,
    `${incomeLabel} ${formatAmount(calculation.repaymentBaseIncome)} - 생활비 ${formatAmount(calculation.adjustedLivingExpense)} = 월납부액 ${formatAmount(calculation.monthlyPayment)}`,
    "",
    "3. 상환기간: 대상채무, 월납부액, 상환조건으로 계산",
    `${calculation.supportType}: ${supportMeta.detail}`,
    repaymentPeriodFormulaText(calculation),
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
  const capLabel = calculation.cappedByMaxPeriod ? `, 최대 ${calculation.maxRepaymentMonths}개월 적용` : "";

  if (calculation.annualInterestRate > 0) {
    return `${formatAmount(calculation.targetDebt)}을 월납부액 ${formatAmount(calculation.monthlyPayment)}으로 납부하고, 연 ${formatMoney(calculation.annualInterestRate * 100)}% ${calculation.repaymentMethod} 조건 적용 = ${calculation.repaymentPeriod}개월${capLabel}`;
  }

  return `${formatAmount(calculation.targetDebt)}을 월납부액 ${formatAmount(calculation.monthlyPayment)}으로 나누어 계산 = ${calculation.repaymentPeriod}개월${capLabel}`;
}

function supportOptionMeta(option: string) {
  const labels: Record<string, { detail: string; title: string }> = {
    신속채무조정: { detail: "원리금상환, 이자율 11%(가정)", title: "신속채무조정" },
    사전채무조정: { detail: "원리금상환, 이자율 6%(가정)", title: "사전채무조정" },
    개인워크아웃: { detail: "원금상환", title: "개인워크아웃" },
  };

  return labels[option] ?? { detail: "", title: option };
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
  const [selectedLevel, setSelectedLevel] = useState(() => Math.min(stats.clearedLevel, LEVELS.length - 1));
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
  const [missionPage, setMissionPage] = useState<0 | 1>(0);
  const [homeChoiceOpen, setHomeChoiceOpen] = useState(false);
  const [showAllClues, setShowAllClues] = useState(false);
  const [clueFilterScreen, setClueFilterScreen] = useState<string | null>(null);
  const [livingDependentsDraft, setLivingDependentsDraft] = useState<number | null>(null);
  const [scorePopupOpen, setScorePopupOpen] = useState(false);
  const [clueReviewOpen, setClueReviewOpen] = useState(false);

  const level = LEVELS[levelIndex];
  const calculation = useMemo(() => calculateLevel(level), [level]);
  const livingDependents = livingDependentsDraft ?? Math.max(0, calculation.householdMembers - 1);
  const livingBasis = useMemo(() => livingExpenseBasisForDependents(livingDependents), [livingDependents]);
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
    const acceptsRoundedMaxPeriod =
      rawRepaymentMonths !== null &&
      rawRepaymentMonths > selectedTerms.maxRepaymentMonths &&
      monthlyPayment === roundedRequiredPayment;
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
  const activeAttemptCount = wrongAttempts[activeField?.key] ?? 0;
  const phaseStep = phase === "scenario" ? 1 : phase === "intake" ? 2 : phase === "mission" ? 3 + missionPage * 0.5 : 4;
  const phaseProgressWidth = ((levelIndex + phaseStep / 4) / LEVELS.length) * 100;
  const scenarioOrderedFields = useMemo(() => fieldsInScenarioOrder(level), [level]);

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
  const maxLevelScore = 500 + level.level * 60 + level.fields.length * 20;
  const currentLevelScore = Math.max(100, 500 + level.level * 60 + foundClueCount * 20 - levelMistakes * 50);
  const currentStarCount = Math.max(1, Math.min(5, Math.ceil((currentLevelScore / maxLevelScore) * 5)));

  const activeScenarioTargets = useMemo(() => {
    const currentClue = activeField ? fieldClue(activeField) : "";
    const currentFields = scenarioOrderedFields.filter((field) => fieldClue(field) === currentClue);
    return currentFields.filter(Boolean);
  }, [activeField, scenarioOrderedFields]);

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

    return focusedClueGroups;
  }, [clueFilterScreen, clueSummaryGroups, focusedClueGroups, screenClueGroups, showAllClues]);

  const scenarioPrompt = useMemo(() => {
    if (allCluesFound) return "모든 단서를 찾았습니다.";

    const labels = uniqueValues(activeScenarioTargets.filter((field) => !solved[field.key]).map((field) => field.label));
    if (labels.length === 0) return `${activeField.screen} 단서를 찾아주세요.`;
    if (labels.length === 1) return `${labels[0]} 단서를 찾아주세요.`;
    return `${activeField.screen} 단서를 찾아주세요.`;
  }, [activeField, activeScenarioTargets, allCluesFound, solved]);

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
    setShowAllClues(false);
    setClueFilterScreen(null);
    setLivingDependentsDraft(null);
    setScorePopupOpen(false);
    setClueReviewOpen(false);
  }

  function startRun(startIndex = selectedLevel) {
    setResults([]);
    setSessionScore(0);
    resetLevelState(startIndex);
    setScreen("game");
  }

  function resetStoredStats() {
    saveStats(emptyStats);
    setStats(emptyStats);
    setSelectedLevel(0);
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
    return level.fields.filter((field) => fieldClue(field) === line);
  }

  function isScenarioLineComplete(line: string) {
    const lineFields = scenarioFieldsForLine(line);
    return lineFields.length > 0 && lineFields.every((field) => solved[field.key]);
  }

  function handleScenarioFieldsTap(fields: IntakeField[]) {
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
      setFeedback(nextAttempts >= 2 ? "두 번 틀렸어요. 힌트창에서 정답 문장을 볼 수 있습니다." : "지금 찾는 항목의 단서가 아니에요.");
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

  function renderScenarioLine(line: string) {
    const lineFields = scenarioFieldsForLine(line)
      .map((field) => {
        const label = scenarioMarkerLabel(field, line);
        return {
          field,
          index: line.indexOf(label),
          label,
        };
      })
      .filter((marker) => marker.index >= 0)
      .reduce<Array<{ fields: IntakeField[]; index: number; label: string }>>((markers, marker) => {
        const existing = markers.find((item) => item.index === marker.index && item.label === marker.label);
        if (existing) {
          existing.fields.push(marker.field);
          return markers;
        }

        markers.push({ fields: [marker.field], index: marker.index, label: marker.label });
        return markers;
      }, [])
      .sort((first, second) => first.index - second.index || second.label.length - first.label.length);
    const parts = [];
    let cursor = 0;

    lineFields.forEach((marker) => {
      const index = marker.index;
      if (index < cursor) return;

      if (index > cursor) {
        parts.push(line.slice(cursor, index));
      }

      parts.push(renderScenarioMarker(marker.fields, marker.label, "inline"));
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
      <div className={`found-clue-summary ${isFiltered ? "is-filtered" : "is-all"}`} aria-label="찾은 단서 정리">
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
          <strong>900점</strong>
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
      const baseDependents = Math.max(0, calculation.householdMembers - 1);
      return Math.max(0, Math.min(5, (current ?? baseDependents) + delta));
    });
  }

  function goPreviousPage() {
    setFeedback("");

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

    if (phase === "scenario") {
      solveAllClues();
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
      finishLevel(levelIndex === LEVELS.length - 1 ? "result" : "next");
    }
  }

  function showFieldAssist(field: IntakeField, attempts: number) {
    openAssist({
      title: attempts >= 2 ? "정답을 확인할 수 있어요" : `${field.label} 힌트`,
      body: fieldHint(field),
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
    const isCorrect =
      missionDraft.supportType === mission.supportType &&
      repaymentModel.feedbackState === "ok" &&
      !repaymentModel.cannotCalculatePeriod &&
      !repaymentModel.exceedsMaxPeriod &&
      Math.abs(monthlyPayment - mission.monthlyPayment) <= 0.05 &&
      repaymentPeriod === mission.repaymentPeriod;

    if (!isCorrect) {
      const nextAttempts = (wrongAttempts.mission ?? 0) + 1;
      setWrongAttempts((current) => ({ ...current, mission: nextAttempts }));
      setLevelMistakes((count) => count + 1);
      setFeedback(nextAttempts >= 2 ? "두 번 틀렸어요. 힌트창에서 정답을 볼 수 있습니다." : "최종미션 힌트를 확인해 보세요.");
      showMissionAssist(nextAttempts);
      return;
    }

    setFeedback("");
    setScorePopupOpen(true);
  }

  function finishLevel(destination: "next" | "result" = levelIndex === LEVELS.length - 1 ? "result" : "next") {
    setScorePopupOpen(false);
    const levelScore = currentLevelScore;
    const nextResult = {
      level: level.level,
      title: level.title,
      mistakes: levelMistakes,
      score: levelScore,
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

  const tutorialPage = TUTORIAL_PAGES[tutorialIndex] ?? TUTORIAL_PAGES[0];
  const tutorialProgress = ((tutorialIndex + 1) / TUTORIAL_PAGES.length) * 100;
  const TutorialIcon = [Smartphone, ClipboardList, HelpCircle, Calculator][tutorialIndex] ?? ClipboardList;
  const shellClass = `phone-shell screen-${screen} phase-${phase} ${
    screen === "levelSelect" ? "level-select-tone" : `level-${level.level}`
  }${
    screen === "tutorial" ? ` tutorial-tone-${(tutorialIndex % 2) + 1}` : ""
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
                onClick={() => setTutorialIndex((index) => Math.max(0, index - 1))}
                type="button"
                title="이전 튜토리얼"
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <div>
                <span>TUTORIAL</span>
                <strong>{tutorialPage.badge}</strong>
              </div>
              <button
                className="arrow-action"
                onClick={() => {
                  if (tutorialIndex < TUTORIAL_PAGES.length - 1) {
                    setTutorialIndex((index) => index + 1);
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
                {tutorialIndex + 1}/{TUTORIAL_PAGES.length}
              </div>
            </header>

            <div className="progress-wrap" aria-label="튜토리얼 진행률">
              <span>{tutorialIndex + 1}/{TUTORIAL_PAGES.length}</span>
              <div className="progress-line">
                <i style={{ width: `${tutorialProgress}%` }} />
              </div>
            </div>

            <article className="mission-panel tutorial-card">
              <div className="panel-heading">
                <TutorialIcon size={22} aria-hidden="true" />
                <div>
                  <span>{tutorialPage.badge}</span>
                  <h2>{tutorialPage.title}</h2>
                </div>
              </div>

              {renderTutorialVisual(tutorialPage.visual)}

              <div className="customer-log tutorial-log">
                {tutorialPage.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              <div className="screen-chips" aria-label="튜토리얼 핵심">
                {tutorialPage.chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
            </article>

            <div className="start-actions tutorial-actions">
              <button
                className="primary-action"
                onClick={() => {
                  if (tutorialIndex < TUTORIAL_PAGES.length - 1) {
                    setTutorialIndex((index) => index + 1);
                    return;
                  }
                  setScreen("levelSelect");
                }}
                type="button"
              >
                {tutorialIndex < TUTORIAL_PAGES.length - 1 ? (
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
              <button className="arrow-action" onClick={() => setScreen("tutorial")} type="button" title="튜토리얼">
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
                    <div className="level-group-title">
                      <span>LEVEL {group.level}</span>
                      <strong>
                        {group.title === "추가인정 생활비" ? (
                          <>
                            추가인정
                            <br />
                            생활비
                          </>
                        ) : (
                          group.title
                        )}
                      </strong>
                    </div>
                    <div className="level-case-grid">
                      {group.cases.map(({ item, index }, caseIndex) => {
                        const selected = selectedLevel === index;

                        return (
                          <button
                            className={selected ? "is-selected" : ""}
                            key={item.id}
                            onClick={() => setSelectedLevel(index)}
                            type="button"
                          >
                            <strong>{caseIndex + 1}</strong>
                            <small>단서 {levelSelectClueCount(item)}개</small>
                          </button>
                        );
                      })}
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
                disabled={phase === "scenario"}
                onClick={goPreviousPage}
                type="button"
                title="이전 단계"
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <div>
                <span>LEVEL {level.level}</span>
                <strong>{level.title}</strong>
              </div>
              <button className="arrow-action" onClick={goNextPage} type="button" title="다음 단계">
                <ChevronRight size={22} aria-hidden="true" />
              </button>
              <div className="score-pill">
                <Trophy size={16} aria-hidden="true" />
                {formatNumber(sessionScore)}
              </div>
            </header>

            <div className="progress-wrap" aria-label="전체 진행률">
              <span>{levelIndex + 1}/{LEVELS.length}</span>
              <div className="progress-line">
                <i style={{ width: `${phaseProgressWidth}%` }} />
              </div>
            </div>

            {phase === "scenario" && (
              <article className="mission-panel">
                <div className="panel-heading">
                  <ClipboardList size={20} aria-hidden="true" />
                  <div>
                    <h2>기본 상담 정보를 읽고 단서를 찾아 접수해주세요.</h2>
                  </div>
                </div>

                <p className="scenario-find-prompt">{scenarioPrompt}</p>

                <div className="customer-log">
                  {level.scenario.map((line) => {
                    return (
                      <div className={isScenarioLineComplete(line) ? "is-found" : ""} key={line}>
                        {renderScenarioLine(line)}
                      </div>
                    );
                  })}
                </div>

                <div className="screen-chips" aria-label="사용 전산 화면">
                  {screenProgress.map((item) => (
                    <button
                      className={`${item.done === item.total ? "is-complete" : ""} ${
                        activeField.screen === item.screenName ? "is-active" : ""
                      } ${clueFilterScreen === item.screenName ? "is-filtered" : ""}`}
                      key={item.screenName}
                      onClick={() => {
                        setShowAllClues(false);
                        setClueFilterScreen(item.screenName);
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
                  onClick={moveToSupportSelection}
                  type="button"
                >
                  <Smartphone size={19} aria-hidden="true" />
                  지원구분 선택하기
                </button>
              </article>
            )}

            {phase === "intake" && (
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

            {phase === "calculation" && (
              <article className="calculation-panel">
                <dl className="calc-sheet">
                  <div>
                    <dt>지원구분</dt>
                    <dd>{calculation.supportType}</dd>
                  </div>
                  <div>
                    <dt>대상채무</dt>
                    <dd>{formatAmount(calculation.targetDebt)}</dd>
                  </div>
                  <div>
                    <dt>최대 생활비</dt>
                    <dd>
                      {`최저생계비(${calculation.householdMembers}인 가구) x 150% = ${formatAmount(calculation.maxLivingExpense)}`}
                    </dd>
                  </div>
                  {calculation.additionalLivingExpense > 0 && (
                    <div>
                      <dt>추가인정 생활비</dt>
                      <dd>{formatAmount(calculation.additionalLivingExpense)}</dd>
                    </div>
                  )}
                  <div>
                    <dt>생활비</dt>
                    <dd>{formatAmount(calculation.adjustedLivingExpense)}</dd>
                  </div>
                  <div>
                    <dt>월납부액</dt>
                    <dd>
                      <span>{calculation.securedPayment > 0 ? "남은 소득 - 생활비" : "소득 - 생활비"}</span>
                      <strong>
                        {formatAmount(calculation.repaymentBaseIncome)} - {formatAmount(calculation.adjustedLivingExpense)} = {formatAmount(calculation.monthlyPayment)}
                      </strong>
                    </dd>
                  </div>
                  <div>
                    <dt>상환기간</dt>
                    <dd>
                      <span>{calculation.annualInterestRate > 0 ? "대상채무 · 월납부액 · 이자율" : "대상채무 / 월납부액"}</span>
                      <strong>{repaymentPeriodFormulaText(calculation)}</strong>
                    </dd>
                  </div>
                  <div>
                    <dt>오답</dt>
                    <dd>{levelMistakes}회</dd>
                  </div>
                </dl>

                <div className="score-preview-card" aria-label={`이번 문항 점수 ${currentLevelScore}점`}>
                  <div>
                    <span>이번 문항 점수</span>
                    <strong>{formatNumber(currentLevelScore)}점</strong>
                  </div>
                </div>

                <button
                  className="primary-action"
                  onClick={() => {
                    finishLevel(levelIndex === LEVELS.length - 1 ? "result" : "next");
                  }}
                  type="button"
                >
                  <ChevronRight size={19} aria-hidden="true" />
                  {levelIndex === LEVELS.length - 1 ? "결과 보기" : "다음 레벨"}
                </button>
              </article>
            )}

            {phase === "mission" && (
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

                    {calculation.securedPayment > 0 && (
                      <div className="secured-income-card">
                        <span>담보채무 차감</span>
                        <strong>
                          총 소득 {formatAmount(calculation.income)} - 담보 원리금 {formatAmount(calculation.securedPayment)}
                        </strong>
                        <em>남은 소득 {formatAmount(calculation.repaymentBaseIncome)}</em>
                      </div>
                    )}

                    <div className="income-balance-card">
                      <div className="balance-head">
                        <strong>생활비와 월납부액 찾기</strong>
                        <span>{calculation.securedPayment > 0 ? "남은 소득" : "총 소득"} {formatAmount(calculation.repaymentBaseIncome)}</span>
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
            <span className="eyebrow">교육 클리어</span>
            <h1>{formatNumber(sessionScore)}점</h1>
            <p>소득, 가족, 주거, 재산, 채무현황, 추가인정 생활비 흐름을 모두 확인했습니다.</p>

            <div className="result-list">
              {results.map((item) => (
                <div key={`${item.level}-${item.title}`}>
                  <span>LEVEL {item.level} · {item.title}</span>
                  <strong>{formatNumber(item.score)}점</strong>
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
              {level.scenario.map((line) => (
                <p key={line}>{line}</p>
              ))}
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
              <strong>{formatNumber(currentLevelScore)}점</strong>
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
                <strong>{foundClueCount}/{level.fields.length}</strong>
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
