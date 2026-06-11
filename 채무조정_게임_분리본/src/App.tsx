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
import { useMemo, useState } from "react";
import { calculateLevel, formatMoney, paymentForMonths, type CalculationResult } from "./calculation";
import { LEVELS, SUPPORT_OPTIONS } from "./data/levels";
import type { FieldValue, IntakeField, LevelData, LevelResult, StoredStats } from "./types";
import startHero from "../assets/start-hero.jpg";

const STORAGE_KEY = "rookie-debt-adjustment-game-v1";
const emptyStats: StoredStats = {
  bestScore: 0,
  clearedLevel: 0,
  runs: 0,
  lastScore: 0,
};

type Screen = "start" | "levelSelect" | "game" | "result";
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
    "지원구분은 연체일수 기준으로 판단합니다. 30일 이하는 신속채무조정, 31~89일은 사전채무조정, 90일 이상은 개인워크아웃입니다.",
    `월 변제금은 조정된 가용소득 ${formatMoney(calculation.disposableIncome)}만원을 기준으로 입력합니다.`,
    "상환기간은 신속채무조정 연 11% 원리금균등, 사전채무조정 연 6% 원리금균등, 개인워크아웃 원금 기준으로 계산합니다.",
  ].join(" ");
}

function App() {
  const [stats, setStats] = useState<StoredStats>(() => loadStats());
  const [screen, setScreen] = useState<Screen>("start");
  const [selectedLevel, setSelectedLevel] = useState(() => Math.min(stats.clearedLevel, LEVELS.length - 1));
  const [levelIndex, setLevelIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("scenario");
  const [activeFieldIndex, setActiveFieldIndex] = useState(0);
  const [draftValue, setDraftValue] = useState<FieldValue>("");
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
      monthlyPayment: round1(monthlyPayment),
      totalPayment: round1(totalPayment),
      interestPayment: round1(Math.max(0, totalPayment - principal)),
    };
  }, [calculatorDraft]);
  const activeField = level.fields[activeFieldIndex];
  const solvedCount = level.fields.filter((field) => solved[field.key]).length;
  const levelProgress = Math.round((solvedCount / level.fields.length) * 100);
  const unlockedLevel = Math.min(stats.clearedLevel + 1, LEVELS.length);
  const activeAttemptCount = wrongAttempts[activeField?.key] ?? 0;

  const screenProgress = useMemo(() => {
    return level.systemScreens.map((screenName) => {
      const fields = level.fields.filter((field) => field.screen === screenName);
      const total = fields.length || 1;
      const done = fields.filter((field) => solved[field.key]).length;
      return { screenName, done, total };
    });
  }, [level, solved]);

  function resetLevelState(nextLevelIndex: number, nextPhase: Phase = "scenario") {
    setLevelIndex(nextLevelIndex);
    setPhase(nextPhase);
    setActiveFieldIndex(0);
    setDraftValue("");
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
    setActiveFieldIndex(index);
    setDraftValue(answers[field.key] ?? "");
    setFeedback("");
  }

  function openAssist(nextAssist: AssistState) {
    setAssist(nextAssist);
    setShowAssistAnswer(false);
  }

  function openRepaymentCalculator() {
    setCalculatorDraft({
      principal: String(calculation.targetDebt),
      annualRate: String(round1(calculation.annualInterestRate * 100)),
      months: String(calculation.repaymentPeriod || calculation.maxRepaymentMonths),
    });
    setCalculatorOpen(true);
  }

  function goPreviousPage() {
    setFeedback("");

    if (phase === "intake") {
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
      onFill: attempts >= 2 ? () => setDraftValue(field.answer) : undefined,
    });
  }

  function showMissionAssist(attempts: number) {
    openAssist({
      title: attempts >= 2 ? "최종미션 정답을 확인할 수 있어요" : "최종미션 힌트",
      body: missionHint(calculation),
      answer:
        attempts >= 2
          ? `${calculation.mission.supportType} / 월 ${formatMoney(calculation.mission.monthlyPayment)}만원 / ${calculation.mission.repaymentPeriod}개월`
          : undefined,
      onFill:
        attempts >= 2
          ? () =>
              setMissionDraft({
                supportType: calculation.mission.supportType,
                monthlyPayment: String(calculation.mission.monthlyPayment),
                repaymentPeriod: String(calculation.mission.repaymentPeriod),
              })
          : undefined,
    });
  }

  function checkField() {
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
    const monthlyPayment = normalizeNumber(missionDraft.monthlyPayment);
    const repaymentPeriod = normalizeNumber(missionDraft.repaymentPeriod);
    const mission = calculation.mission;
    const isCorrect =
      missionDraft.supportType === mission.supportType &&
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

  const shellClass = `phone-shell screen-${screen} phase-${phase} level-${level.level}`;

  return (
    <div className="app">
      <main className={shellClass}>
        {screen === "start" && (
          <section className="start-screen intro-screen">
            <button className="intro-poster" onClick={() => setScreen("levelSelect")} type="button">
              <img src={startHero} alt="Mystery at the desk 시작 화면" />
            </button>
          </section>
        )}

        {screen === "levelSelect" && (
          <section className="start-screen level-select-screen">
            <div className="level-select-nav">
              <button className="return-home-action" onClick={() => setScreen("start")} type="button">
                <ChevronLeft size={18} aria-hidden="true" />
                첫 화면
              </button>
            </div>

            <div className="stat-strip" aria-label="저장된 점수">
              <div>
                <span>최고점수</span>
                <strong>{formatNumber(stats.bestScore)}</strong>
              </div>
              <div>
                <span>해금</span>
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

            <div className="progress-line" aria-label="레벨 진행률">
              <i
                style={{
                  width: `${
                    phase === "scenario"
                      ? 4
                      : phase === "intake"
                        ? Math.max(16, Math.min(76, levelProgress))
                        : phase === "mission"
                          ? 86
                          : 100
                  }%`,
                }}
              />
            </div>

            {phase !== "scenario" && (
              <div className="quick-actions">
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
                        body: "최종미션을 제출한 뒤 계산 결과를 확인하는 화면입니다. 지원구분, 생계비, 가용소득, 월변제금, 상환기간 산식을 함께 봅니다.",
                      });
                    }
                  }}
                  type="button"
                >
                  <HelpCircle size={17} aria-hidden="true" />
                  힌트
                </button>
              </div>
            )}

            {phase === "scenario" && (
              <article className="mission-panel">
                <div className="panel-heading">
                  <ClipboardList size={20} aria-hidden="true" />
                  <div>
                    <span>{level.badge}</span>
                    <h2>{level.goal}</h2>
                  </div>
                </div>

                <div className="customer-log">
                  {level.scenario.map((line) => (
                    <p key={line}><span>고객</span>{line}</p>
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
                    <strong>{activeField.label}</strong>
                  </div>

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

                  <button className="primary-action" onClick={checkField} type="button">
                    <Check size={19} aria-hidden="true" />
                    확인
                  </button>
                </div>

                <div className="entry-list" aria-label="입력 완료 목록">
                  {level.fields.map((field, index) => (
                    <button
                      className={`${solved[field.key] ? "is-done" : ""} ${index === activeFieldIndex ? "is-active" : ""}`}
                      key={field.key}
                      onClick={() => prepareField(index)}
                      type="button"
                    >
                      <span>{field.label}</span>
                      <strong>{solved[field.key] ? fieldValueLabel(field.answer, field.unit) : "대기"}</strong>
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
                    <dt>최대 생계비</dt>
                    <dd>가구수에 따른 최저생계비 x 150% = {formatMoney(calculation.maxLivingExpense)}만원</dd>
                  </div>
                  <div>
                    <dt>생계비</dt>
                    <dd>{formatMoney(calculation.adjustedLivingExpense)}만원</dd>
                  </div>
                  <div>
                    <dt>월변제금</dt>
                    <dd>
                      소득 {formatMoney(calculation.income)}만원 - 생계비 {formatMoney(calculation.adjustedLivingExpense)}만원 = {formatMoney(calculation.disposableIncome)}만원
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
                    <h2>지원구분, 월 변제금, 변제기간을 제출하세요.</h2>
                  </div>
                </div>

                <button
                  className="repayment-tool"
                  onClick={openRepaymentCalculator}
                  type="button"
                >
                  <Calculator size={22} aria-hidden="true" />
                  <span>
                    <strong>원리금 계산기</strong>
                    <small>신속 11% · 사전 6% · 개인워크아웃 원금 기준</small>
                  </span>
                </button>

                <label className="select-entry">
                  <span>지원구분</span>
                  <select
                    onChange={(event) => setMissionDraft((current) => ({ ...current, supportType: event.target.value }))}
                    value={missionDraft.supportType}
                  >
                    <option value="">선택</option>
                    {SUPPORT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="number-entry compact">
                  <span>월 변제금</span>
                  <input
                    inputMode="numeric"
                    onChange={(event) => setMissionDraft((current) => ({ ...current, monthlyPayment: event.target.value }))}
                    placeholder="0"
                    type="number"
                    value={missionDraft.monthlyPayment}
                  />
                  <em>만원</em>
                </label>

                <label className="number-entry compact">
                  <span>변제기간</span>
                  <input
                    inputMode="numeric"
                    onChange={(event) => setMissionDraft((current) => ({ ...current, repaymentPeriod: event.target.value }))}
                    placeholder="0"
                    type="number"
                    value={missionDraft.repaymentPeriod}
                  />
                  <em>개월</em>
                </label>

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
                    <span>월 변제금</span>
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
                <p>채무 원금과 상환기간을 입력하면 월 변제금이 계산됩니다.</p>
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
