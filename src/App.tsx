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
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import {
  calculateLevel,
  formatMoney,
  livingExpenseBasisForDependents,
  paymentForMonths,
  repaymentMonthsForPayment,
  specialLivingExpenseForMaxPeriod,
  type CalculationResult,
} from "./calculation";
import { LEVELS, PRACTICE_LEVELS, SUPPORT_OPTIONS } from "./data/levels";
import type { DecoyClue, FieldValue, IntakeField, LevelData, LevelResult, ScreenName, StoredStats } from "./types";
import startHero from "../assets/start-hero.jpg";

import {
  PAYMENT_SNAP_TOLERANCE,
  MONEY_INPUT_SCALE,
  MIN_LIVING_EXPENSE_RATIO,
  WRONG_GROUP_CLUE_KEY,
  TUTORIAL_GROUPS,
  TUTORIAL_CHIP_EXAMPLES,
  emptyStats,
  Screen,
  Phase,
  MissionDraft,
  AssistState,
  CalculatorDraft,
  formatNumber,
  normalizeNumber,
  round1,
  formatAmount,
  livingExpenseIncomeComparison,
  canUseMaxRepaymentPeriod,
  maxRepaymentAvailabilityText,
  maxPeriodMonthlyPaymentFor,
  maxPeriodPaymentFormulaText,
  recognizedLivingExpenseLabel,
  recognizedLivingExpenseFormulaDisplayTextFor,
  needsMaxRepaymentVerification,
  maxRepaymentVerificationLabel,
  maxRepaymentVerificationFormulaText,
  isMaxRepaymentVerifiedPossible,
  maxRepaymentVerificationStatusText,
  livingExpenseFormulaText,
  dependentAnswerLabel,
  monthlyPaymentFormulaText,
  maxLivingExpenseIncomeLabel,
  renderCalculationAnswerCard,
  renderCalculationReasonCard,
  hasSecuredIncomeDeduction,
  levelMaxScoreFor,
  levelScoreFor,
  scoreWithMax,
  foxTierFor,
  sliderMaxForIncome,
  paymentToSlider,
  sliderToPayment,
  loadStats,
  saveStats,
  screenOrderIndex,
  debtSummaryOrderKey,
  fieldsInScenarioOrder,
  scenarioLinesInScreenOrder,
  nextOpenFieldInOrder,
  sameDebtClueGroup,
  sameDependentClueGroup,
  fieldValueLabel,
  numericAnswer,
  additionalLivingExpenseItems,
  fieldClue,
  scenarioMarkerLabel,
  scenarioMarkerIndex,
  scenarioDecoyMarkerIndex,
  isCorrectClue,
  uniqueValues,
  uniqueFields,
  cluePromptLabel,
  levelSelectClueCount,
  fieldHint,
  practiceFieldHint,
  fieldAnswerText,
  supportHint,
  missionHint,
  missionAnswerText,
  repaymentPeriodFormulaText,
  supportOptionMeta,
  supportTermsFor,
} from "./appSupport";
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
  const baseExtraLivingItems = useMemo(() => additionalLivingExpenseItems(level), [level]);
  const baseAdditionalLivingExpense = useMemo(
    () => round1(baseExtraLivingItems.reduce((sum, item) => sum + item.amount, 0)),
    [baseExtraLivingItems],
  );
  const currentSpecialLivingExpense = useMemo(() => {
    if ((calculation.specialLivingExpense ?? 0) <= 0) return 0;

    return specialLivingExpenseForMaxPeriod({
      minimumLivingExpense: livingBasis.minimumLivingExpense,
      repaymentBaseIncome: calculation.repaymentBaseIncome,
      maxLivingExpense: livingBasis.maxLivingExpense,
      baseAdditionalLivingExpense,
      targetDebt: calculation.targetDebt,
      maxRepaymentMonths: calculation.maxRepaymentMonths,
      monthlyInterestRate: calculation.monthlyInterestRate,
    });
  }, [
    baseAdditionalLivingExpense,
    calculation.maxRepaymentMonths,
    calculation.monthlyInterestRate,
    calculation.repaymentBaseIncome,
    calculation.specialLivingExpense,
    calculation.targetDebt,
    livingBasis.maxLivingExpense,
    livingBasis.minimumLivingExpense,
  ]);
  const extraLivingItems = useMemo(() => {
    if (currentSpecialLivingExpense <= 0) return baseExtraLivingItems;

    return [
      ...baseExtraLivingItems,
      {
        label: "기타 특별 생활비",
        value: formatAmount(currentSpecialLivingExpense),
        amount: currentSpecialLivingExpense,
        active: true,
      },
    ];
  }, [baseExtraLivingItems, currentSpecialLivingExpense]);
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
    const paymentTolerance = 0.05;
    const targetPaymentTooLow = monthlyPayment + paymentTolerance < targetPayment;
    const targetPaymentTooHigh = monthlyPayment - paymentTolerance > targetPayment;
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
    const cannotCalculatePeriod = rawRepaymentMonths === null || exceedsMaxPeriod || targetPaymentTooLow;
    const repaymentPeriod = targetPaymentTooLow
      ? null
      : acceptsRoundedMaxPeriod
      ? selectedTerms.maxRepaymentMonths
      : rawRepaymentMonths !== null && rawRepaymentMonths <= selectedTerms.maxRepaymentMonths
        ? rawRepaymentMonths
        : null;
    const periodLabel = targetPaymentTooLow
      ? `${selectedTerms.maxRepaymentMonths}개월 초과`
      : repaymentPeriod
      ? `${repaymentPeriod}개월`
      : "계산불가";
    const cappedByMaxPeriod = acceptsRoundedMaxPeriod;
    const feedbackCannotCalculate = targetPaymentTooLow
      ? "최대 상환기간 안에 들어오지 않습니다. 월납부액을 늘려주세요."
      : rawRepaymentMonths === null
      ? "월납부액이 낮아 상환기간 계산이 어렵습니다. 월납부액을 늘려주세요."
      : "최대 상환기간 안에 들어오지 않습니다. 월납부액을 늘려주세요.";
    const sliderMax = sliderMaxForIncome();
    const sliderValue = paymentToSlider(monthlyPayment, calculation.repaymentBaseIncome, targetPayment);
    const paymentRatio = sliderMax > 0 ? (sliderValue / sliderMax) * 100 : 0;
    const minimumLivingExpenseLimit = livingBasis.minimumLivingExpense * MIN_LIVING_EXPENSE_RATIO;
    const feedbackState =
      livingExpense <= minimumLivingExpenseLimit
        ? "danger"
        : livingExpense > recognizedMaxLivingExpense ||
            cannotCalculatePeriod ||
            exceedsMaxPeriod ||
            targetPaymentTooLow ||
            targetPaymentTooHigh
          ? "notice"
          : "ok";
    const feedback =
      livingExpense <= minimumLivingExpenseLimit
        ? "생활비가 부족합니다. 최저 생활비 90% 이하입니다. 생활비를 늘려주세요."
          : livingExpense > recognizedMaxLivingExpense
            ? "최대 생활비를 초과합니다. 월납부액을 늘려주세요."
            : cannotCalculatePeriod
              ? feedbackCannotCalculate
              : targetPaymentTooHigh
                ? `월납부액이 정답 기준보다 높습니다. ${formatAmount(targetPayment)}에 맞춰주세요.`
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

    const scrollToSupportButton = () => {
      supportSelectionButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    const frame = requestAnimationFrame(scrollToSupportButton);
    const timeout = window.setTimeout(scrollToSupportButton, 140);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [allCluesFound, phase, reviewResult, screen]);

  useEffect(() => {
    const scrollToTop = () => {
      const topOptions: ScrollToOptions = { top: 0, left: 0, behavior: "auto" };
      window.scrollTo(topOptions);
      document.scrollingElement?.scrollTo(topOptions);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      document
        .querySelectorAll<HTMLElement>(".phone-shell, .sheet-panel, .modal-panel")
        .forEach((element) => element.scrollTo(topOptions));
    };

    const frame = window.requestAnimationFrame(scrollToTop);
    const timeouts = [
      window.setTimeout(scrollToTop, 60),
      window.setTimeout(scrollToTop, 160),
      window.setTimeout(scrollToTop, 320),
    ];

    return () => {
      window.cancelAnimationFrame(frame);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [levelIndex, missionPage, phase, practiceIndex, practiceMode, reviewResult, screen, tutorialIndex]);

  const activeAttemptCount = wrongAttempts[activeField?.key] ?? 0;
  const phaseStep = phase === "scenario" ? 1 : phase === "intake" ? 2 : phase === "mission" ? 3 + missionPage * 0.5 : 4;
  const totalCaseCount = practiceMode ? PRACTICE_LEVELS.length : LEVELS.length;
  const currentCaseIndex = practiceMode ? practiceIndex : levelIndex;
  const phaseProgressWidth = ((currentCaseIndex + phaseStep / 4) / totalCaseCount) * 100;
  const scenarioOrderedFields = useMemo(() => fieldsInScenarioOrder(level), [level]);
  const scenarioActiveField = scenarioOrderedFields.find((field) => !solved[field.key]) ?? activeField;

  const orderedScreenNames = useMemo(() => {
    const ordered: ScreenName[] = [];

    scenarioOrderedFields.forEach((field) => {
      if (!ordered.includes(field.screen)) ordered.push(field.screen);
    });

    level.systemScreens.forEach((screenName) => {
      if (!ordered.includes(screenName)) ordered.push(screenName);
    });

    return ordered.sort((first, second) => screenOrderIndex(first) - screenOrderIndex(second));
  }, [level, scenarioOrderedFields]);

  const screenProgress = useMemo(() => {
    return orderedScreenNames.map((screenName) => {
      const fields = level.fields.filter((field) => field.screen === screenName);
      const total = fields.length || 1;
      const done = fields.filter((field) => solved[field.key]).length;
      const totalLabel = practiceMode && screenName === "가족" ? "?" : String(total);
      return { screenName, done, total, totalLabel };
    });
  }, [level, orderedScreenNames, practiceMode, solved]);
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
  const reachedMasterTier = resultMaxScore > 0 && resultTier.minRatio >= 0.9;
  const canStartPractice = Boolean(stats.practiceUnlocked || reachedMasterTier);
  const isLastPracticeLevel = practiceIndex >= PRACTICE_LEVELS.length - 1;

  const activeScenarioTargets = useMemo(() => {
    const currentClue = scenarioActiveField ? fieldClue(scenarioActiveField) : "";
    const currentFields = scenarioOrderedFields.filter((field) => fieldClue(field) === currentClue);
    const debtGroupFields = scenarioActiveField
      ? scenarioOrderedFields.filter((field) => sameDebtClueGroup(scenarioActiveField, field))
      : [];
    const dependentGroupFields = scenarioActiveField
      ? scenarioOrderedFields.filter((field) => sameDependentClueGroup(scenarioActiveField, field))
      : [];
    const combinedFields = [...currentFields, ...debtGroupFields, ...dependentGroupFields];
    return uniqueFields(combinedFields);
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
    if (allCluesFound) return "모든 항목을 찾았습니다.";

    const labels = uniqueValues(
      activeScenarioTargets.filter((field) => !solved[field.key]).map((field) => cluePromptLabel(field.label)),
    );
    const actionText = practiceMode ? "인정되는 항목만 누르세요." : "문장 속 단어를 누르세요.";
    const activeScreenName = scenarioActiveField?.screen ?? activeField?.screen ?? "";
    const promptLabel =
      practiceMode && activeScreenName === "가족"
        ? "부양가족"
        : labels.length === 1
          ? labels[0]
          : activeScreenName;
    return `${promptLabel} 찾아주세요. ${actionText}`;
  }, [activeField, activeScenarioTargets, allCluesFound, practiceMode, scenarioActiveField, solved]);

  const scenarioDisplayLines = useMemo(() => {
    return practiceMode ? [level.narrative ?? level.scenario.join(" ")] : scenarioLinesInScreenOrder(level);
  }, [level, practiceMode]);

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
    const activeScreenName = scenarioActiveField?.screen ?? activeField?.screen ?? tappedScreen;
    const activeScreenCandidates = activeScreenName
      ? scenarioOrderedFields.filter((field) => field.screen === activeScreenName && !solved[field.key])
      : [];
    const candidates = uniqueFields([
      ...activeScenarioTargets.filter((field) => !solved[field.key]),
      ...activeScreenCandidates,
    ]);

    if (level.fields.every((field) => solved[field.key])) {
      setFeedback("모든 단서를 확인했습니다. 지원구분을 선택하세요.");
      return;
    }

    const directTargetFields = fields.filter((field) =>
      candidates.some((candidate) => candidate.key === field.key) && !solved[field.key],
    );
    const groupedTargetFields = candidates.filter((candidate) =>
      directTargetFields.some(
        (field) =>
          candidate.screen === field.screen &&
          !solved[candidate.key] &&
          (fieldClue(candidate) === fieldClue(field) ||
            sameDebtClueGroup(field, candidate) ||
            sameDependentClueGroup(field, candidate)),
      ),
    );
    const targetFields = uniqueFields([...directTargetFields, ...groupedTargetFields]);

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

    const successScreen = targetFields[0]?.screen ?? tappedScreen;
    if (successScreen) {
      setShowAllClues(false);
      setClueFilterScreen(successScreen);
      setLastClueScreen(successScreen);
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
    setFeedback(`${uniqueValues(targetFields.map((field) => cluePromptLabel(field.label))).join(" · ")} 확인 완료`);

    const nextIndex = nextOpenFieldInOrder(level, nextSolved, scenarioOrderedFields, activeFieldIndex + 1);
    setActiveFieldIndex(nextIndex);
    setDraftValue("");
    setGroupDraft({});
  }

  function renderScenarioMarker(fields: IntakeField[], label: string, mode: "inline" | "tail") {
    const markerKey = fields.map((field) => field.key).join("-");
    const isFound = fields.every((field) => solved[field.key]);
    const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      handleScenarioFieldsTap(fields);
    };

    return (
      <span
        className={`scenario-clue-marker is-${mode} ${isFound ? "is-found" : ""}`}
        key={markerKey}
        onClick={() => handleScenarioFieldsTap(fields)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        {label}
      </span>
    );
  }

  function renderScenarioDecoyMarker(decoy: DecoyClue, label: string, mode: "inline" | "tail") {
    const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      handleScenarioDecoyTap(decoy);
    };

    return (
      <span
        className={`scenario-clue-marker is-${mode} is-decoy`}
        key={`decoy-${decoy.screen}-${label}-${decoy.clue}`}
        onClick={() => handleScenarioDecoyTap(decoy)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        {label}
      </span>
    );
  }

  function renderScenarioLine(line: string) {
    const fieldMarkers = scenarioFieldsForLine(line)
      .flatMap((field) => {
        const label = scenarioMarkerLabel(field, line);
        if (!label) return [];

        const markers: Array<{
          decoy: undefined,
          field: IntakeField;
          fields: IntakeField[];
          index: number;
          label: string;
        }> = [];
        let searchFrom = 0;

        while (searchFrom < line.length) {
          const index = line.indexOf(label, searchFrom);
          if (index < 0) break;

          markers.push({
            decoy: undefined,
            field,
            fields: [field],
            index,
            label,
          });
          searchFrom = index + label.length;
        }

        return markers.length > 0
          ? markers
          : [{
              decoy: undefined,
              field,
              fields: [field],
              index: scenarioMarkerIndex(field, line, label),
              label,
            }];
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

  function foundClueDisplayItems(fields: IntakeField[]) {
    const items: Array<{ key: string; label: string; value: string }> = [];
    const insertedPrefixes = new Set<string>();

    fields.forEach((field) => {
      const aggregate =
        field.key.startsWith("unsecuredDebt.")
          ? { key: "unsecuredDebt", label: "신용대출" }
          : field.key.startsWith("securedDebt.")
            ? { key: "securedDebt", label: "담보대출" }
            : null;

      if (aggregate) {
        if (!insertedPrefixes.has(aggregate.key)) {
          const amount = fields
            .filter((item) => item.key.startsWith(`${aggregate.key}.`))
            .reduce((sum, item) => {
              const value = answers[item.key] ?? item.answer;
              return sum + (typeof value === "number" ? value : Number(item.answer) || 0);
            }, 0);
          items.push({ key: aggregate.key, label: aggregate.label, value: formatAmount(round1(amount)) });
          insertedPrefixes.add(aggregate.key);
        }
        return;
      }

      items.push({
        key: field.key,
        label: field.label,
        value: fieldValueLabel(field, answers[field.key] ?? field.answer),
      });
    });

    if (fields[0]?.screen !== "채무현황") return items;

    return [...items].sort((first, second) => debtSummaryOrderKey(first.key) - debtSummaryOrderKey(second.key));
  }

  function renderFoundClueGroups(groups: Array<{ screenName: string; doneFields: IntakeField[]; total: number }>) {
    return (
      <>
        {groups.map((group) => {
          const displayItems = foundClueDisplayItems(group.doneFields);

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
                  displayItems.map((item) => (
                    <div key={item.key}>
                      <small>{item.label}</small>
                      <em>{item.value}</em>
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

  function updateRepaymentDraftFromClientX(clientX: number, element: HTMLElement) {
    const rect = element.getBoundingClientRect();

    if (rect.width <= 0 || repaymentModel.sliderMax <= 0) {
      return;
    }

    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    updateRepaymentDraft(ratio * repaymentModel.sliderMax);
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
    const matchesRequiredDependents = !practiceMode || livingDependents === expectedLivingDependents;
    const matchesMissionValues =
      missionDraft.supportType === mission.supportType &&
      matchesRequiredDependents &&
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
        practiceMode && !matchesLivingDependents
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
        setScreen("practiceResult");
        setTierPopupOpen(false);
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: "auto" });
        });
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
    const nextResults = [...results, nextResult];
    const nextScore = sessionScore + levelScore;
    const nextMaxScore = nextResults.reduce((sum, item) => sum + item.maxScore, 0);
    const nextTier = foxTierFor(nextScore, nextMaxScore);
    const nextPracticeUnlocked = Boolean(stats.practiceUnlocked || (!practiceMode && destination === "result" && nextTier.minRatio >= 0.9));
    setResults(nextResults);
    setSessionScore(nextScore);

    const nextClearedLevel = Math.max(stats.clearedLevel, levelIndex + 1);
    const nextStats = {
      bestScore: Math.max(stats.bestScore, nextScore),
      clearedLevel: nextClearedLevel,
      practiceUnlocked: nextPracticeUnlocked,
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
                <div className="score-pill practice-pill" aria-label="실전문제">
                  <Trophy size={16} aria-hidden="true" />
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
                    <div className="calc-period-payment-row">
                      <dt>월납부액</dt>
                      <dd>
                        <strong className="calc-formula-period-payment">{reviewResult.repaymentFormula}</strong>
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
                          <strong className="calc-formula-max-payment">{maxPeriodPaymentFormulaText(reviewResult)}</strong>
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
                            ? recognizedLivingExpenseLabel(reviewResult)
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
                          ? recognizedLivingExpenseFormulaDisplayTextFor(reviewResult, reviewResult.adjustedLivingExpense)
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
                  <span>지금 찾을 항목</span>
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
                      <small>{item.done}/{item.totalLabel}</small>
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
                      <small>{item.done}/{item.totalLabel}</small>
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
                {renderCalculationReasonCard(calculation, numericAnswer(level, "overdueDays"), level)}

                <dl className="calc-sheet">
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
                    <div className="calc-period-payment-row">
                      <dt>월납부액</dt>
                      <dd>
                        <strong className="calc-formula-period-payment">{repaymentPeriodFormulaText(calculation)}</strong>
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
                          <strong className="calc-formula-max-payment">{maxPeriodPaymentFormulaText(calculation)}</strong>
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
                            ? recognizedLivingExpenseLabel(calculation)
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
                          ? recognizedLivingExpenseFormulaDisplayTextFor(calculation, calculation.adjustedLivingExpense)
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
                    <h2>{missionPage === 0 ? "연체일수 기준으로 지원구분을 선택하세요." : "부양가족, 월납부액, 상환기간을 제출하세요."}</h2>
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
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.currentTarget.setPointerCapture?.(event.pointerId);
                          updateRepaymentDraftFromClientX(event.clientX, event.currentTarget);
                        }}
                        onPointerMove={(event) => {
                          if (event.pointerType === "mouse" && event.buttons !== 1) {
                            return;
                          }

                          event.preventDefault();
                          updateRepaymentDraftFromClientX(event.clientX, event.currentTarget);
                        }}
                        onTouchMove={(event) => {
                          const touch = event.touches[0];

                          if (!touch) {
                            return;
                          }

                          event.preventDefault();
                          updateRepaymentDraftFromClientX(touch.clientX, event.currentTarget);
                        }}
                        onTouchStart={(event) => {
                          const touch = event.touches[0];

                          if (!touch) {
                            return;
                          }

                          event.preventDefault();
                          updateRepaymentDraftFromClientX(touch.clientX, event.currentTarget);
                        }}
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
                          onInput={(event) => updateRepaymentDraft(Number(event.currentTarget.value))}
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
                        <small>부양가족</small>
                        <strong>{dependentAnswerLabel(livingBasis.householdMembers)}</strong>
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
        {screen === "practiceResult" && (
          <section className="result-screen practice-complete-screen">
            <div className="result-medal">
              <ClipboardList size={38} aria-hidden="true" />
            </div>
            <h1>실전문제 접수 완료</h1>
            <p className="result-summary-copy">총 {PRACTICE_LEVELS.length}개 실전문제를 모두 접수했습니다.</p>

            <div className="result-list practice-complete-list" aria-label="완료한 실전문제">
              {PRACTICE_LEVELS.map((item, index) => (
                <div key={item.id}>
                  <span>실전문제 {index + 1}</span>
                  <strong>접수 완료</strong>
                  <small>{item.title}</small>
                </div>
              ))}
            </div>

            <div className="start-actions">
              <button className="primary-action" onClick={startPracticeRun} type="button">
                <Play size={19} aria-hidden="true" />
                다시 접수
              </button>
              <button className="ghost-action" onClick={() => setScreen("levelSelect")} type="button">
                <ClipboardList size={18} aria-hidden="true" />
                레벨 선택
              </button>
            </div>
            <button className="practice-result-action" onClick={() => setScreen("start")} type="button">
              <Home size={18} aria-hidden="true" />
              시작 화면
            </button>
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
              <button
                className="sheet-close"
                onClick={() => setClueReviewOpen(false)}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setClueReviewOpen(false);
                }}
                type="button"
                title="닫기"
              >
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
