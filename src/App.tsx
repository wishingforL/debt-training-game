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
  paymentForMonths,
  repaymentMonthsForPayment,
  type CalculationResult,
} from "./calculation";
import { LEVELS, SUPPORT_OPTIONS } from "./data/levels";
import type { FieldValue, IntakeField, LevelData, LevelResult, StoredStats } from "./types";
import startHero from "../assets/start-hero.jpg";

const STORAGE_KEY = "rookie-debt-adjustment-game-v1";
const PAYMENT_SNAP_TOLERANCE = 0.45;
const TUTORIAL_PAGES = [
  {
    badge: "참여 안내",
    title: "게임은 이렇게 진행됩니다.",
    lines: [
      "표지를 누르면 튜토리얼을 확인한 뒤 레벨을 선택합니다.",
      "각 레벨은 시나리오 읽기, 접수 입력, 최종미션 순서로 진행됩니다.",
      "설치 없이 브라우저에서 플레이하며, 점수와 잠금해제 기록은 이 기기에 저장됩니다.",
    ],
    chips: ["표지", "튜토리얼", "레벨 선택", "접수 시작"],
  },
  {
    badge: "시나리오",
    title: "고객의 말에서 접수 단서를 찾습니다.",
    lines: [
      "고객이 말한 월소득, 부양가족, 연체일수, 채무 금액을 먼저 확인합니다.",
      "레벨이 올라가면 주거, 보증금, 월세, 재산, 담보채무, 급여압류가 추가됩니다.",
      "기억이 안 나면 언제든 시나리오 다시보기를 눌러 원문을 다시 확인하세요.",
    ],
    chips: ["소득", "가족", "연체", "채무", "주거", "재산"],
  },
  {
    badge: "접수 입력",
    title: "전산 항목을 하나씩 채웁니다.",
    lines: [
      "상단 탭은 현재 입력해야 할 전산 화면입니다.",
      "숫자는 만원 단위로 입력합니다. 예를 들어 2,400만원은 2400으로 입력합니다.",
      "틀리면 힌트를 확인할 수 있고, 두 번 이상 틀리면 정답 보기와 값 채우기가 열립니다.",
    ],
    chips: ["입력", "확인", "힌트", "정답 보기"],
  },
  {
    badge: "지원구분",
    title: "연체일수로 지원구분을 판단합니다.",
    lines: [
      "30일 이하는 신속채무조정입니다. 원리금상환, 이자율 11%, 최대 120개월 기준입니다.",
      "31~89일은 사전채무조정입니다. 원리금상환, 이자율 6%, 최대 120개월 기준입니다.",
      "90일 이상은 개인워크아웃입니다. 원금상환, 최대 96개월 기준입니다.",
    ],
    chips: ["신속", "사전", "개인워크아웃"],
  },
  {
    badge: "월납부액",
    title: "생활비를 남기고 월납부액을 찾습니다.",
    lines: [
      "총 소득은 고정이고, 막대의 경계를 움직이면 생활비와 월납부액이 함께 바뀝니다.",
      "생활비가 부족하면 생활비를 늘리고, 계산불가가 뜨면 월납부액을 늘려야 합니다.",
      "정답 근처는 0.45만원 범위에서 자동으로 붙어 손가락으로 맞추기 쉽게 되어 있습니다.",
    ],
    chips: ["총 소득", "생활비", "월납부액", "계산불가"],
  },
  {
    badge: "점수",
    title: "정확할수록 점수가 높아집니다.",
    lines: [
      "레벨 기본점수는 900점에 레벨 보너스가 더해집니다.",
      "오답은 1회마다 80점이 차감됩니다. 그래도 레벨당 최소 240점은 보장됩니다.",
      "시나리오 다시보기와 힌트는 연습용 도구입니다. 필요한 만큼 확인하며 익히세요.",
    ],
    chips: ["기본점수", "오답 감점", "최소점수", "기록 저장"],
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

const formatNumber = (value: number) => new Intl.NumberFormat("ko-KR").format(value);
const normalizeNumber = (value: string) => Number(value.replace(/,/g, "").trim());
const round1 = (value: number) => Math.round(value * 10) / 10;

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
  if (field.type === "number") return Number(value) === Number(field.answer);
  return value === field.answer;
}

function nextOpenField(level: LevelData, solved: Record<string, boolean>, fallback: number) {
  const next = level.fields.findIndex((field) => !solved[field.key]);
  return next >= 0 ? next : Math.min(fallback, level.fields.length - 1);
}

function fieldValueLabel(value: FieldValue, unit?: string) {
  if (typeof value === "boolean") return value ? "있음" : "없음";
  if (typeof value === "number") return `${formatNumber(value)}${unit ?? ""}`;
  return value;
}

function fieldHint(field: IntakeField) {
  const hints: Record<string, string> = {
    income: "고객이 말한 월 소득 문장을 찾으세요. 금액은 만원 단위로 입력합니다.",
    dependents: "부양한다고 말한 가족 수만 입력합니다. 본인은 부양가족 수에 넣지 않습니다.",
    debt: "빚 또는 채무로 표현된 총액을 확인하세요.",
    overdueDays: "며칠째 연체 중인지 말한 문장을 확인하세요.",
    housingType: "보증금, 월세, 전세보증금이 나오면 주거형태는 임차입니다.",
    deposit: "월세 보증금 금액만 만원 단위로 입력합니다.",
    monthlyRent: "월세 금액만 입력합니다.",
    jeonseDeposit: "전세보증금으로 말한 금액을 입력합니다.",
    unsecuredDebt: "신용채무라고 말한 금액만 입력합니다.",
    securedDebt: "주택담보대출처럼 담보가 있는 채무 금액입니다. 없으면 0입니다.",
    hasVehicle: "본인 명의 차량이 있다고 했는지 확인합니다.",
    depositAsset: "예금으로 보유한 금액을 입력합니다.",
    wageGarnishment: "급여가 압류되어 있다고 했는지 확인합니다.",
  };

  return hints[field.key] ?? "상담 문장 안에서 같은 항목을 찾아 입력하세요.";
}

function missionHint(calculation: CalculationResult) {
  return [
    "1. 지원구분: 연체일수 기준으로 판단합니다.",
    "30일 이하 = 신속채무조정",
    "31~89일 = 사전채무조정",
    "90일 이상 = 개인워크아웃",
    "",
    "2. 월납부액: 반올림하여 산출",
    "소득 - 생활비(생활비 변경해 최장 상환기간 구하기)",
    "",
    "3. 상환기간 계산 기준:",
    "신속채무조정 = 원리금상환, 이자율 11%",
    "사전채무조정 = 원리금상환, 이자율 6%",
    "개인워크아웃 = 원금상환",
  ].join("\n");
}

function supportOptionMeta(option: string) {
  const labels: Record<string, { detail: string; title: string }> = {
    신속채무조정: { detail: "원리금상환, 이자율 11%", title: "신속채무조정" },
    사전채무조정: { detail: "원리금상환, 이자율 6%", title: "사전채무조정" },
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

  const level = LEVELS[levelIndex];
  const calculation = useMemo(() => calculateLevel(level), [level]);
  const calculatorResult = useMemo(() => {
    const principal = normalizeNumber(calculatorDraft.principal);
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
    const maxPayment = Math.max(0, Math.round(calculation.income));
    const defaultMonthlyPayment = Math.round(calculation.income / 2);
    const monthlyPayment = Math.max(0, Math.min(maxPayment, repaymentDraft ?? defaultMonthlyPayment));
    const livingExpense = Math.max(0, calculation.income - monthlyPayment);
    const rawRepaymentMonths = repaymentMonthsForPayment(
      calculation.targetDebt,
      monthlyPayment,
      monthlyInterestRate,
    );
    const roundedRequiredPayment = Math.round(
      paymentForMonths(calculation.targetDebt, selectedTerms.maxRepaymentMonths, monthlyInterestRate),
    );
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
    const paymentRatio = maxPayment > 0 ? (monthlyPayment / maxPayment) * 100 : 0;
    const minimumLivingExpenseLimit = calculation.minimumLivingExpense * 0.7;
    const feedbackState =
      livingExpense <= minimumLivingExpenseLimit
        ? "danger"
        : livingExpense > calculation.maxLivingExpense || cannotCalculatePeriod || exceedsMaxPeriod
          ? "notice"
          : "ok";
    const feedback =
      livingExpense <= minimumLivingExpenseLimit
        ? "생활비가 부족합니다. 최저 생활비 70% 이하입니다. 생활비를 늘려주세요."
          : livingExpense > calculation.maxLivingExpense
            ? "최대 생활비를 초과합니다. 월납부액을 늘려주세요."
            : cannotCalculatePeriod
              ? feedbackCannotCalculate
              : `생활비 ${formatMoney(livingExpense)}만원을 확보했습니다. 남은 ${formatMoney(monthlyPayment)}만원을 월납부액으로 산정할 수 있습니다.`;

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
      targetPayment: roundedRequiredPayment,
    };
  }, [calculation, missionDraft.supportType, repaymentDraft]);
  const activeField = level.fields[activeFieldIndex];
  const groupedScreenFields =
    activeField?.screen === "채무현황" ? level.fields.filter((field) => field.screen === activeField.screen) : [];
  const usesGroupedScreen = phase === "intake" && groupedScreenFields.length > 1;
  const unlockedLevel = Math.min(stats.clearedLevel + 1, LEVELS.length);
  const activeAttemptCount = wrongAttempts[activeField?.key] ?? 0;
  const phaseStep = phase === "scenario" ? 1 : phase === "intake" ? 2 : phase === "mission" ? 3 : 4;
  const phaseProgressWidth = ((level.level - 1 + phaseStep / 4) / LEVELS.length) * 100;

  const screenProgress = useMemo(() => {
    return level.systemScreens.map((screenName) => {
      const fields = level.fields.filter((field) => field.screen === screenName);
      const total = fields.length || 1;
      const done = fields.filter((field) => solved[field.key]).length;
      return { screenName, done, total };
    });
  }, [level, solved]);

  const entryItems = useMemo(() => {
    const groupedScreens = new Set<string>();
    return level.fields.flatMap((field, index) => {
      const screenFields = field.screen === "채무현황" ? level.fields.filter((item) => item.screen === field.screen) : [];

      if (screenFields.length > 1) {
        if (groupedScreens.has(field.screen)) return [];
        groupedScreens.add(field.screen);
        return [{ key: `screen-${field.screen}`, label: field.screen, fields: screenFields, index, isGroup: true }];
      }

      return [{ key: field.key, label: field.label, fields: [field], index, isGroup: false }];
    });
  }, [level]);

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
    const screenFields = field.screen === "채무현황" ? level.fields.filter((item) => item.screen === field.screen) : [];
    setActiveFieldIndex(index);
    setDraftValue(answers[field.key] ?? "");
    setGroupDraft(
      screenFields.length > 1
        ? Object.fromEntries(screenFields.map((item) => [item.key, answers[item.key] ?? ""]))
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
    if (field.screen === "채무현황" && groupedScreenFields.some((item) => item.key === field.key)) {
      setGroupDraft((current) => ({ ...current, [field.key]: value }));
      return;
    }

    setDraftValue(value);
  }

  function fieldTitle(field: IntakeField) {
    if (usesGroupedScreen) return groupedScreenFields.map((item) => item.label).join(" · ");

    if (field.key === "dependents") {
      const rawValue = String(draftValue).trim();
      const dependents = normalizeNumber(rawValue);
      const householdMembers = rawValue === "" || Number.isNaN(dependents) ? 0 : Math.max(1, dependents + 1);
      return `${field.label}(${householdMembers}인 가구)`;
    }

    return field.label;
  }

  function renderQuickActions() {
    return (
      <div className="quick-actions embedded-actions">
        <button onClick={() => setScenarioOpen(true)} type="button">
          <ClipboardList size={17} aria-hidden="true" />
          시나리오 다시보기
        </button>
        <button
          onClick={() => {
            if (phase === "mission") showMissionAssist(wrongAttempts.mission ?? 0);
            else if (phase === "intake") showFieldAssist(activeField, activeAttemptCount);
            else {
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

  function updateRepaymentDraft(value: number) {
    const snappedValue =
      Math.abs(value - repaymentModel.targetPayment) <= PAYMENT_SNAP_TOLERANCE
        ? repaymentModel.targetPayment
        : value;

    setRepaymentDraft(snappedValue);
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
      setPhase("intake");
      prepareField(level.fields.length - 1);
      return;
    }

    if (phase === "calculation") {
      setPhase("mission");
    }
  }

  function goNextPage() {
    setFeedback("");

    if (phase === "scenario") {
      setPhase("intake");
      prepareField(activeFieldIndex);
      return;
    }

    if (phase === "intake") {
      if (usesGroupedScreen) {
        const lastIndex = Math.max(...groupedScreenFields.map((field) => level.fields.findIndex((item) => item.key === field.key)));
        if (lastIndex < level.fields.length - 1) {
          prepareField(lastIndex + 1);
          return;
        }

        setPhase("mission");
        return;
      }

      if (activeFieldIndex < level.fields.length - 1) {
        prepareField(activeFieldIndex + 1);
        return;
      }

      setPhase("mission");
      return;
    }

    if (phase === "mission") {
      setPhase("calculation");
      return;
    }

    if (phase === "calculation") {
      finishLevel();
    }
  }

  function showFieldAssist(field: IntakeField, attempts: number) {
    openAssist({
      title: attempts >= 2 ? "정답을 확인할 수 있어요" : `${field.label} 힌트`,
      body: fieldHint(field),
      answer: attempts >= 2 ? fieldValueLabel(field.answer, field.unit) : undefined,
      onFill: attempts >= 2 ? () => setDraftForField(field, field.answer) : undefined,
    });
  }

  function showMissionAssist(attempts: number) {
    openAssist({
      title: attempts >= 2 ? "최종미션 정답을 확인할 수 있어요" : "최종미션 힌트",
      body: missionHint(calculation),
      answer:
        attempts >= 2
          ? `${calculation.mission.supportType} / 월납부액 ${formatMoney(calculation.mission.monthlyPayment)}만원 / ${calculation.mission.repaymentPeriod}개월`
          : undefined,
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

    for (const field of groupedScreenFields) {
      const draft = groupDraft[field.key] ?? "";
      const value = field.type === "number" ? normalizeNumber(String(draft)) : draft;

      if (field.type === "number" && (String(draft).trim() === "" || Number.isNaN(value))) {
        setFeedback("숫자를 입력해 주세요.");
        openAssist({
          title: "입력 형식",
          body: "숫자만 입력하면 됩니다. 예를 들어 2,400만원은 2400으로 입력하세요.",
        });
        return;
      }

      if (!isCorrectValue(field, value)) {
        const nextAttempts = (wrongAttempts[field.key] ?? 0) + 1;
        setWrongAttempts((current) => ({ ...current, [field.key]: nextAttempts }));
        setLevelMistakes((count) => count + 1);
        setFeedback(nextAttempts >= 2 ? "두 번 틀렸어요. 힌트창에서 정답을 볼 수 있습니다." : "힌트를 확인해 보세요.");
        showFieldAssist(field, nextAttempts);
        return;
      }

      parsedValues[field.key] = value;
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
    setFeedback(`${activeField.screen} 입력 완료`);

    if (level.fields.every((item) => nextSolved[item.key])) {
      setTimeout(() => {
        setPhase("mission");
        setFeedback("");
      }, 380);
      return;
    }

    const lastGroupIndex = Math.max(...groupedScreenFields.map((field) => level.fields.findIndex((item) => item.key === field.key)));
    const nextIndex = nextOpenField(level, nextSolved, lastGroupIndex + 1);
    setTimeout(() => prepareField(nextIndex), 280);
  }

  function checkField() {
    if (usesGroupedScreen) {
      checkGroupedFields();
      return;
    }

    const field = activeField;
    const value = field.type === "number" ? normalizeNumber(String(draftValue)) : draftValue;

    if (field.type === "number" && (String(draftValue).trim() === "" || Number.isNaN(value))) {
      setFeedback("숫자를 입력해 주세요.");
      openAssist({
        title: "입력 형식",
        body: "숫자만 입력하면 됩니다. 예를 들어 2,400만원은 2400으로 입력하세요.",
      });
      return;
    }

    if (!isCorrectValue(field, value)) {
      const nextAttempts = (wrongAttempts[field.key] ?? 0) + 1;
      setWrongAttempts((current) => ({ ...current, [field.key]: nextAttempts }));
      setLevelMistakes((count) => count + 1);
      setFeedback(nextAttempts >= 2 ? "두 번 틀렸어요. 힌트창에서 정답을 볼 수 있습니다." : "힌트를 확인해 보세요.");
      showFieldAssist(field, nextAttempts);
      return;
    }

    const nextSolved = { ...solved, [field.key]: true };
    setAnswers((current) => ({ ...current, [field.key]: value }));
    setSolved(nextSolved);
    setWrongAttempts((current) => ({ ...current, [field.key]: 0 }));
    setFeedback(`${field.label} 입력 완료`);

    if (level.fields.every((item) => nextSolved[item.key])) {
      setTimeout(() => {
        setPhase("mission");
        setFeedback("");
      }, 380);
      return;
    }

    const nextIndex = nextOpenField(level, nextSolved, activeFieldIndex + 1);
    setTimeout(() => prepareField(nextIndex), 280);
  }

  function submitMission() {
    const monthlyPayment = repaymentModel.monthlyPayment;
    const repaymentPeriod = repaymentModel.repaymentPeriod;
    const mission = calculation.mission;
    const isCorrect =
      missionDraft.supportType === mission.supportType &&
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
    setPhase("calculation");
  }

  function finishLevel() {
    const levelScore = Math.max(240, 900 + level.level * 120 - levelMistakes * 80);
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

    const nextClearedLevel = Math.max(stats.clearedLevel, level.level);
    const nextStats = {
      bestScore: Math.max(stats.bestScore, nextScore),
      clearedLevel: nextClearedLevel,
      runs: stats.runs + (level.level === LEVELS.length ? 1 : 0),
      lastScore: nextScore,
      updatedAt: new Date().toISOString(),
    };
    saveStats(nextStats);
    setStats(nextStats);

    if (levelIndex === LEVELS.length - 1) {
      setScreen("result");
      return;
    }

    resetLevelState(levelIndex + 1);
  }

  const tutorialPage = TUTORIAL_PAGES[tutorialIndex] ?? TUTORIAL_PAGES[0];
  const tutorialProgress = ((tutorialIndex + 1) / TUTORIAL_PAGES.length) * 100;
  const TutorialIcon = [Smartphone, ClipboardList, HelpCircle, Calculator, Trophy, Play][tutorialIndex] ?? ClipboardList;
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
                {Math.max(1, unlockedLevel)}/{LEVELS.length}
              </div>
            </header>

            <div className="progress-wrap" aria-label="잠금해제 진행률">
              <span>{Math.max(1, unlockedLevel)}/{LEVELS.length}</span>
              <div className="progress-line">
                <i style={{ width: `${(Math.max(1, unlockedLevel) / LEVELS.length) * 100}%` }} />
              </div>
            </div>

            <div className="stat-strip" aria-label="저장된 점수">
              <div>
                <span>최고점수</span>
                <strong>{formatNumber(stats.bestScore)}</strong>
              </div>
              <div>
                <span>잠금해제</span>
                <strong>{Math.max(1, unlockedLevel)} / {LEVELS.length}</strong>
              </div>
              <div>
                <span>최근점수</span>
                <strong>{formatNumber(stats.lastScore)}</strong>
              </div>
            </div>

            <div className="level-map" aria-label="레벨 선택">
              {LEVELS.map((item, index) => {
                const locked = item.level > unlockedLevel;
                const selected = selectedLevel === index;
                return (
                  <button
                    className={`level-node ${selected ? "is-selected" : ""}`}
                    disabled={locked}
                    key={item.id}
                    onClick={() => setSelectedLevel(index)}
                    type="button"
                  >
                    <span>LEVEL {item.level}</span>
                    <strong>{item.title}</strong>
                    <small>{locked ? "잠김" : item.badge}</small>
                  </button>
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
              <button className="icon-action" onClick={() => setScreen("start")} type="button" title="시작 화면">
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
              <span>{level.level}/{LEVELS.length}</span>
              <div className="progress-line">
                <i style={{ width: `${phaseProgressWidth}%` }} />
              </div>
            </div>

            {phase === "scenario" && (
              <article className="mission-panel">
                <div className="panel-heading">
                  <ClipboardList size={20} aria-hidden="true" />
                  <div>
                    <h2>기본 상담 정보를 읽고 접수를 시작하세요.</h2>
                  </div>
                </div>

                <div className="customer-log">
                  {level.scenario.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>

                <div className="screen-chips" aria-label="사용 전산 화면">
                  {level.systemScreens.map((screenName) => (
                    <span key={screenName}>{screenName}</span>
                  ))}
                </div>

                <button
                  className="primary-action"
                  onClick={() => {
                    setPhase("intake");
                    prepareField(0);
                  }}
                  type="button"
                >
                  <Smartphone size={19} aria-hidden="true" />
                  접수 시작
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

                  {usesGroupedScreen ? (
                    <div className="grouped-entry">
                      {groupedScreenFields.map((field) => (
                        <label className="number-entry stacked" key={field.key}>
                          <span>{field.label}</span>
                          <input
                            inputMode="numeric"
                            min="0"
                            onChange={(event) =>
                              setGroupDraft((current) => ({ ...current, [field.key]: event.target.value }))
                            }
                            pattern="[0-9]*"
                            placeholder="0"
                            type="number"
                            value={String(groupDraft[field.key] ?? "")}
                          />
                          <em>{field.unit}</em>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <>
                      {activeField.type === "number" && (
                        <label className="number-entry">
                          <input
                            inputMode="numeric"
                            min="0"
                            onChange={(event) => setDraftValue(event.target.value)}
                            pattern="[0-9]*"
                            placeholder="0"
                            type="number"
                            value={String(draftValue)}
                          />
                          <span>{activeField.unit}</span>
                        </label>
                      )}

                      {(activeField.type === "choice" || activeField.type === "boolean") && (
                        <div className="option-grid">
                          {activeField.options?.map((option) => (
                            <button
                              className={draftValue === option.value ? "is-selected" : ""}
                              key={`${activeField.key}-${String(option.value)}`}
                              onClick={() => setDraftValue(option.value)}
                              type="button"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {renderQuickActions()}

                  <button className="primary-action" onClick={checkField} type="button">
                    <Check size={19} aria-hidden="true" />
                    확인
                  </button>
                </div>

                <div className="entry-list" aria-label="입력 완료 목록">
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
                      <strong>
                        {item.fields.every((field) => solved[field.key])
                          ? item.isGroup
                            ? "입력 완료"
                            : fieldValueLabel(item.fields[0].answer, item.fields[0].unit)
                          : "대기"}
                      </strong>
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
                    <dd>{formatMoney(calculation.targetDebt)}만원</dd>
                  </div>
                  <div>
                    <dt>가구수</dt>
                    <dd>{calculation.householdMembers}인 가구</dd>
                  </div>
                  <div>
                    <dt>최대 생활비</dt>
                    <dd>최저생계비({calculation.householdMembers}인 가구) x 150% = {formatMoney(calculation.maxLivingExpense)}만원</dd>
                  </div>
                  <div>
                    <dt>생활비</dt>
                    <dd>{formatMoney(calculation.adjustedLivingExpense)}만원</dd>
                  </div>
                  <div>
                    <dt>월납부액</dt>
                    <dd>
                      소득 {formatMoney(calculation.income)}만원 - 생활비 {formatMoney(calculation.adjustedLivingExpense)}만원 = {formatMoney(calculation.monthlyPayment)}만원
                    </dd>
                  </div>
                  <div>
                    <dt>상환기간</dt>
                    <dd>
                      {calculation.annualInterestRate > 0
                        ? `${formatMoney(calculation.targetDebt)}만원을 연 ${formatMoney(calculation.annualInterestRate * 100)}% ${calculation.repaymentMethod} 조건으로 계산 = ${calculation.repaymentPeriod}개월`
                        : `${formatMoney(calculation.targetDebt)} / ${formatMoney(calculation.disposableIncome)} = ${calculation.repaymentPeriod}개월`}
                      {calculation.cappedByMaxPeriod ? `, 최대 ${calculation.maxRepaymentMonths}개월 적용` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>오답</dt>
                    <dd>{levelMistakes}회</dd>
                  </div>
                </dl>

                <button
                  className="primary-action"
                  onClick={() => {
                    finishLevel();
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
                    <span>최종미션</span>
                    <h2>지원구분, 월납부액, 상환기간을 제출하세요.</h2>
                  </div>
                </div>

                <div className="support-select-card">
                  <span className="support-label">지원구분</span>
                  <div className="support-choice-grid" aria-label="지원구분 선택">
                    {SUPPORT_OPTIONS.map((option) => {
                      const optionMeta = supportOptionMeta(option);

                      return (
                        <button
                          className={missionDraft.supportType === option ? "is-selected" : ""}
                          key={option}
                          onClick={() => setMissionDraft((current) => ({ ...current, supportType: option }))}
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

                <div className="income-balance-card">
                  <div className="balance-head">
                    <strong>생활비를 남기고 월납부액 찾기</strong>
                    <span>총 소득 {formatMoney(calculation.income)}만원</span>
                  </div>
                  <div className="balance-values">
                    <span>월납부액 {formatMoney(repaymentModel.monthlyPayment)}만원</span>
                    <span>생활비 {formatMoney(repaymentModel.livingExpense)}만원</span>
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
                      max={repaymentModel.maxPayment}
                      min="0"
                      onChange={(event) => updateRepaymentDraft(Number(event.target.value))}
                      step="1"
                      type="range"
                      value={repaymentModel.monthlyPayment}
                    />
                  </div>
                  <p className={`balance-feedback is-${repaymentModel.feedbackState}`}>
                    {repaymentModel.feedback}
                  </p>
                  <div className="balance-result">
                    <div>
                      <span>월납부액</span>
                      <strong>{formatMoney(repaymentModel.monthlyPayment)}만원</strong>
                    </div>
                    <div>
                      <span>상환기간</span>
                      <strong>
                        {repaymentModel.periodLabel}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="answer-summary-card">
                  <span>제출할 답안</span>
                  <div>
                    <small>지원구분</small>
                    <strong>{missionDraft.supportType || "선택 필요"}</strong>
                  </div>
                  <div>
                    <small>월납부액</small>
                    <strong>{formatMoney(repaymentModel.monthlyPayment)}만원</strong>
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
            <p>주거, 가족, 소득, 재산, 채무현황, 급여가압류 화면을 모두 통과했습니다.</p>

            <div className="result-list">
              {results.map((item) => (
                <div key={item.level}>
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
                <em>만원</em>
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
                    <strong>{formatMoney(calculatorResult.monthlyPayment)}만원</strong>
                  </div>
                  <div>
                    <span>총 상환액</span>
                    <strong>{formatMoney(calculatorResult.totalPayment)}만원</strong>
                  </div>
                  <div>
                    <span>이자 합계</span>
                    <strong>{formatMoney(calculatorResult.interestPayment)}만원</strong>
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
