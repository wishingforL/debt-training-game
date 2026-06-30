import {
  Calculator,
  ChevronRight,
  Eye,
  HelpCircle,
  ClipboardList,
  Home,
  Trophy,
  X,
} from "lucide-react";
import { useMemo, type KeyboardEvent } from "react";
import {
  calculateLevel,
  formatMoney,
  paymentForMonths,
} from "../../calculation";
import { LEVELS, PRACTICE_LEVELS } from "../../data/levels";
import type { DecoyClue, IntakeField } from "../../types";
import startHero from "../../../assets/start-hero.jpg";
import { GameScreen } from "./screens/GameScreen";
import { LevelSelectScreen } from "./screens/LevelSelectScreen";
import { CalculationPanel } from "./panels/CalculationPanel";
import { MissionPanel } from "./panels/MissionPanel";
import { PreviousResultPanel } from "./panels/PreviousResultPanel";
import { PracticeResultScreen } from "./screens/PracticeResultScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { ScenarioPanel } from "./panels/ScenarioPanel";
import { StartScreen } from "./screens/StartScreen";
import { TutorialScreen } from "./screens/TutorialScreen";
import { useDebtGameState } from "./hooks/useDebtGameState";
import { useGameScrollReset, useSupportButtonAutoScroll } from "./hooks/useGameScrollEffects";
import { useMissionFlow } from "./hooks/useMissionFlow";
import { useScenarioClues } from "./hooks/useScenarioClues";
import { validateMissionSubmission, validateSupportSelection } from "./missionValidation";
import { validateScenarioDecoyTap, validateScenarioFieldTap } from "./scenarioValidation";
import { completeAllClues } from "./scenarioProgress";
import { createLevelResult, createNextStats } from "./resultFlow";

import {
  MONEY_INPUT_SCALE,
  TUTORIAL_GROUPS,
  emptyStats,
  Phase,
  AssistState,
  formatNumber,
  normalizeNumber,
  round1,
  formatAmount,
  levelMaxScoreFor,
  levelScoreFor,
  scoreWithMax,
  foxTierFor,
  saveStats,
  debtSummaryOrderKey,
  fieldValueLabel,
  numericAnswer,
  fieldClue,
  scenarioMarkerLabel,
  scenarioMarkerLabels,
  scenarioMarkerIndex,
  scenarioDecoyMarkerIndex,
  fieldHint,
  practiceFieldHint,
  fieldAnswerText,
  supportHint,
  missionHint,
  missionAnswerText,
} from "../../appSupport";
function App() {
  const {
    activeFieldIndex,
    answers,
    assist,
    calculatorDraft,
    calculatorOpen,
    clueFilterScreen,
    clueReviewOpen,
    feedback,
    homeChoiceOpen,
    lastClueScreen,
    lastLevelTap,
    levelIndex,
    levelMistakes,
    livingDependentsDraft,
    missionDraft,
    missionPage,
    openTutorialSection,
    phase,
    practiceIndex,
    practiceMode,
    previousAllCluesFoundRef,
    repaymentDraft,
    results,
    reviewResult,
    scenarioOpen,
    scorePopupOpen,
    screen,
    selectedLevel,
    sessionScore,
    setActiveFieldIndex,
    setAnswers,
    setAssist,
    setCalculatorDraft,
    setCalculatorOpen,
    setClueFilterScreen,
    setClueReviewOpen,
    setFeedback,
    setHomeChoiceOpen,
    setLastClueScreen,
    setLastLevelTap,
    setLevelIndex,
    setLevelMistakes,
    setLivingDependentsDraft,
    setMissionDraft,
    setMissionPage,
    setOpenTutorialSection,
    setPhase,
    setPracticeIndex,
    setPracticeMode,
    setRepaymentDraft,
    setResults,
    setReviewResult,
    setScenarioOpen,
    setScorePopupOpen,
    setScreen,
    setSelectedLevel,
    setSessionScore,
    setShowAllClues,
    setShowAssistAnswer,
    setSolved,
    setStats,
    setTierPopupOpen,
    setTutorialExample,
    setTutorialIndex,
    setTutorialMiniPayment,
    setWrongAttempts,
    showAllClues,
    showAssistAnswer,
    solved,
    stats,
    supportSelectionButtonRef,
    tierPopupOpen,
    tutorialExample,
    tutorialIndex,
    tutorialMiniPayment,
    wrongAttempts,
  } = useDebtGameState();

  const level = practiceMode ? PRACTICE_LEVELS[practiceIndex] ?? PRACTICE_LEVELS[0] : LEVELS[levelIndex];
  const calculation = useMemo(() => calculateLevel(level), [level]);
  const {
    changeLivingDependents,
    expectedLivingDependents,
    extraLivingItems,
    hasCurrentSecuredIncomeDeduction,
    livingBasis,
    matchesLivingDependents,
    repaymentModel,
    updateRepaymentDraft,
    updateRepaymentDraftFromClientX,
  } = useMissionFlow({
    calculation,
    level,
    livingDependentsDraft,
    missionDraft,
    practiceMode,
    repaymentDraft,
    setLivingDependentsDraft,
    setRepaymentDraft,
  });
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
  const activeField = level.fields[activeFieldIndex];
  const {
    activeScenarioTargets,
    allCluesFound,
    clueSummaryGroups,
    foundClueCount,
    scenarioActiveField,
    scenarioDisplayLines,
    scenarioOrderedFields,
    scenarioPrompt,
    screenProgress,
    visibleClueGroups,
  } = useScenarioClues({
    activeField,
    clueFilterScreen,
    lastClueScreen,
    level,
    practiceMode,
    showAllClues,
    solved,
  });

  useSupportButtonAutoScroll({
    allCluesFound,
    phase,
    previousAllCluesFoundRef,
    reviewResult,
    screen,
    supportSelectionButtonRef,
  });
  useGameScrollReset({
    levelIndex,
    missionPage,
    phase,
    practiceIndex,
    practiceMode,
    reviewResult,
    screen,
    tutorialIndex,
  });

  const phaseStep = phase === "scenario" ? 1 : phase === "mission" ? 3 + missionPage * 0.5 : 4;
  const totalCaseCount = practiceMode ? PRACTICE_LEVELS.length : LEVELS.length;
  const currentCaseIndex = practiceMode ? practiceIndex : levelIndex;
  const phaseProgressWidth = ((currentCaseIndex + phaseStep / 4) / totalCaseCount) * 100;
  const scoredClueCount = foundClueCount;
  const maxLevelScore = levelMaxScoreFor(level);
  const currentLevelScore = levelScoreFor(level, scoredClueCount, levelMistakes);
  const currentStarCount = Math.max(1, Math.min(5, Math.ceil((currentLevelScore / maxLevelScore) * 5)));
  const resultMaxScore = results.reduce((sum, item) => sum + item.maxScore, 0);
  const resultTier = foxTierFor(sessionScore, resultMaxScore);
  const resultTierPercent = resultMaxScore > 0 ? Math.min(100, Math.round((sessionScore / resultMaxScore) * 100)) : 0;
  const reachedMasterTier = resultMaxScore > 0 && resultTier.minRatio >= 0.9;
  const canStartPractice = Boolean(stats.practiceUnlocked || reachedMasterTier);
  const isLastPracticeLevel = practiceIndex >= PRACTICE_LEVELS.length - 1;

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
    const validation = validateScenarioDecoyTap({
      activeField,
      activeScenarioTargets,
      decoy,
      solved,
      wrongAttempts,
    });

    setWrongAttempts((current) => ({ ...current, [validation.targetField.key]: validation.nextAttempts }));
    setLevelMistakes((count) => count + 1);
    setFeedback(validation.feedback);

    if (validation.nextAttempts >= 2) {
      openAssist({
        title: "제외 단서",
        body: validation.assistBody,
      });
    }
  }

  function handleScenarioFieldsTap(fields: IntakeField[]) {
    const validation = validateScenarioFieldTap({
      activeField,
      activeFieldIndex,
      activeScenarioTargets,
      answers,
      fields,
      level,
      practiceMode,
      scenarioActiveField,
      scenarioOrderedFields,
      solved,
      wrongAttempts,
    });

    if (validation.status === "complete") {
      setFeedback(validation.feedback);
      return;
    }

    if (validation.status === "wrong") {
      setWrongAttempts((current) => ({ ...current, [validation.targetField.key]: validation.nextAttempts }));
      setLevelMistakes((count) => count + 1);
      setFeedback(validation.feedback);
      showFieldAssist(validation.targetField, validation.nextAttempts);
      return;
    }

    if (validation.successScreen) {
      setShowAllClues(false);
      setClueFilterScreen(validation.successScreen);
      setLastClueScreen(validation.successScreen);
    }

    setAnswers(validation.nextAnswers);
    setSolved(validation.nextSolved);
    setWrongAttempts(validation.nextWrongAttempts);
    setFeedback(validation.feedback);
    setActiveFieldIndex(validation.nextActiveFieldIndex);
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
        const labels = scenarioMarkerLabels(field, line);
        if (labels.length === 0) return [];

        const markers: Array<{
          decoy: undefined,
          field: IntakeField;
          fields: IntakeField[];
          index: number;
          label: string;
        }> = [];

        labels.forEach((label) => {
          if (!label) return;

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
            searchFrom = index + Math.max(label.length, 1);
          }

          if (markers.every((marker) => marker.label !== label)) {
            markers.push({
              decoy: undefined,
              field,
              fields: [field],
              index: scenarioMarkerIndex(field, line, label),
              label,
            });
          }
        });

        return markers;
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
    const supportValidation = validateSupportSelection({
      currentAttempts: wrongAttempts.supportType ?? 0,
      expectedSupportType: calculation.mission.supportType,
      selectedSupportType: missionDraft.supportType,
    });

    if (supportValidation.reason === "missing") {
      setFeedback(supportValidation.feedback);
      return;
    }

    if (!supportValidation.isCorrect) {
      setWrongAttempts((current) => ({ ...current, supportType: supportValidation.nextAttempts }));
      setLevelMistakes((count) => count + 1);
      setFeedback(supportValidation.feedback);
      if (supportValidation.nextAttempts >= 2) showMissionAssist(supportValidation.nextAttempts);
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
      if (!allCluesFound) {
        const completedClues = completeAllClues(level);

        setAnswers((current) => ({ ...current, ...completedClues.answers }));
        setSolved((current) => ({ ...current, ...completedClues.solved }));
        setWrongAttempts((current) => ({ ...current, ...completedClues.wrongAttempts }));
      }

      setFeedback("");
      setMissionPage(0);
      setPhase("mission");
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

  function submitMission() {
    const nextAttempts = (wrongAttempts.mission ?? 0) + 1;
    const missionValidation = validateMissionSubmission({
      expectedLivingDependents,
      matchesLivingDependents,
      mission: calculation.mission,
      missionDraft,
      nextAttempts,
      practiceMode,
      repaymentModel,
    });

    if (!missionValidation.isCorrect) {
      setWrongAttempts((current) => ({ ...current, mission: nextAttempts }));
      setLevelMistakes((count) => count + 1);
      setFeedback(missionValidation.feedback);
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
    const nextResult = createLevelResult({
      calculation,
      level,
      levelMistakes,
      levelScore,
      maxLevelScore,
    });
    const nextResults = [...results, nextResult];
    const nextScore = sessionScore + levelScore;
    const nextMaxScore = nextResults.reduce((sum, item) => sum + item.maxScore, 0);
    setResults(nextResults);
    setSessionScore(nextScore);

    const nextStats = createNextStats({
      destination,
      isLastLevel: levelIndex === LEVELS.length - 1,
      levelIndex,
      nextMaxScore,
      nextScore,
      practiceMode,
      stats,
    });
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

  const tutorialProgress = ((tutorialIndex + 1) / TUTORIAL_GROUPS.length) * 100;
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
          <StartScreen
            startHero={startHero}
            onStartTutorial={() => {
              setTutorialIndex(0);
              setOpenTutorialSection(-1);
              setTutorialExample(null);
              setScreen("tutorial");
            }}
          />
        )}

        {screen === "tutorial" && (
          <TutorialScreen
            openTutorialSection={openTutorialSection}
            tutorialExample={tutorialExample}
            tutorialIndex={tutorialIndex}
            tutorialMiniPayment={tutorialMiniPayment}
            tutorialProgress={tutorialProgress}
            onGoLevelSelect={() => setScreen("levelSelect")}
            onGoStart={() => setScreen("start")}
            onNextGroup={() => {
              if (tutorialIndex < TUTORIAL_GROUPS.length - 1) {
                setTutorialIndex((index) => index + 1);
                setOpenTutorialSection(-1);
                setTutorialExample(null);
                return;
              }
              setScreen("levelSelect");
            }}
            onPreviousGroup={() => {
              setTutorialIndex((index) => Math.max(0, index - 1));
              setOpenTutorialSection(-1);
              setTutorialExample(null);
            }}
            onSelectExample={setTutorialExample}
            onTutorialMiniPaymentChange={setTutorialMiniPayment}
            onToggleSection={(sectionIndex) => {
              setOpenTutorialSection((current) => (current === sectionIndex ? -1 : sectionIndex));
              setTutorialExample(null);
            }}
          />
        )}

        {screen === "levelSelect" && (
          <LevelSelectScreen
            canStartPractice={canStartPractice}
            levelGroups={levelGroups}
            selectedLevel={selectedLevel}
            stats={stats}
            onChooseCase={chooseLevelCase}
            onGoStart={() => setScreen("start")}
            onGoTutorial={() => {
              setTutorialIndex(0);
              setOpenTutorialSection(-1);
              setTutorialExample(null);
              setScreen("tutorial");
            }}
            onResetStats={resetStoredStats}
            onStart={() => startRun()}
            onStartCase={startRun}
            onStartPractice={startPracticeRun}
          />
        )}

        {screen === "game" && (
          <GameScreen
            currentIndex={currentCaseIndex}
            levelTitle={level.title}
            nextTitle={phase === "scenario" && !allCluesFound ? "단서 정답 확인 후 다음 단계" : "다음 단계"}
            onHome={() => setHomeChoiceOpen(true)}
            onNext={goNextPage}
            onPrevious={goPreviousPage}
            previousDisabled={
              phase === "scenario" &&
              ((practiceMode && practiceIndex === 0) || (!practiceMode && results.length === 0 && !reviewResult))
            }
            previousTitle={phase === "scenario" && practiceMode ? "이전 실전문제" : phase === "scenario" ? "이전 결과" : "이전 단계"}
            progressWidth={phaseProgressWidth}
            scoreSlot={
              practiceMode ? (
                <div className="score-pill practice-pill" aria-label="실전문제">
                  <Trophy size={16} aria-hidden="true" />
                </div>
              ) : (
                <div className="score-pill">
                  <Trophy size={16} aria-hidden="true" />
                  {formatNumber(sessionScore)}
                </div>
              )
            }
            stageLabel={practiceMode ? `실전 ${practiceIndex + 1}/${PRACTICE_LEVELS.length}` : `LEVEL ${level.level}`}
            totalCount={totalCaseCount}
          >

            {reviewResult && <PreviousResultPanel result={reviewResult} />}

            {!reviewResult && phase === "scenario" && (
              <ScenarioPanel
                activeScreenName={scenarioActiveField.screen}
                clueFilterScreen={clueFilterScreen}
                lastClueScreen={lastClueScreen}
                practiceMode={practiceMode}
                scenarioDisplayLines={scenarioDisplayLines}
                scenarioPrompt={scenarioPrompt}
                screenProgress={screenProgress}
                showAllClues={showAllClues}
                supportSelectionButtonRef={supportSelectionButtonRef}
                isScenarioLineComplete={isScenarioLineComplete}
                onFilterScreen={(screenName) => {
                  setShowAllClues(false);
                  setClueFilterScreen(screenName);
                  setLastClueScreen(screenName);
                }}
                onMoveToSupportSelection={moveToSupportSelection}
                renderFoundClueSummary={renderFoundClueSummary}
                renderScenarioLine={renderScenarioLine}
              />
            )}

            {!reviewResult && phase === "calculation" && (
              <CalculationPanel
                calculation={calculation}
                currentLevelScore={currentLevelScore}
                hasCurrentSecuredIncomeDeduction={hasCurrentSecuredIncomeDeduction}
                isLastLevel={levelIndex === LEVELS.length - 1}
                isLastPracticeLevel={isLastPracticeLevel}
                level={level}
                levelMistakes={levelMistakes}
                maxLevelScore={maxLevelScore}
                practiceMode={practiceMode}
                onFinish={() => {
                  finishLevel(practiceMode ? (isLastPracticeLevel ? "result" : "next") : levelIndex === LEVELS.length - 1 ? "result" : "next");
                }}
              />
            )}

            {!reviewResult && phase === "mission" && (
              <MissionPanel
                allCluesFound={allCluesFound}
                calculation={calculation}
                extraLivingItems={extraLivingItems}
                hasCurrentSecuredIncomeDeduction={hasCurrentSecuredIncomeDeduction}
                livingBasis={livingBasis}
                missionDraft={missionDraft}
                missionPage={missionPage}
                repaymentModel={repaymentModel}
                renderQuickActions={renderQuickActions}
                onChangeLivingDependents={changeLivingDependents}
                onMoveToFinalMission={moveToFinalMission}
                onSetFeedback={setFeedback}
                onSetMissionDraft={setMissionDraft}
                onSubmitMission={submitMission}
                onUpdateRepaymentDraft={updateRepaymentDraft}
                onUpdateRepaymentDraftFromClientX={updateRepaymentDraftFromClientX}
              />
            )}

            {feedback && <p className="feedback" role="status">{feedback}</p>}
          </GameScreen>
        )}

        {screen === "result" && (
          <ResultScreen
            canStartPractice={canStartPractice}
            resultMaxScore={resultMaxScore}
            resultTier={resultTier}
            resultTierPercent={resultTierPercent}
            results={results}
            sessionScore={sessionScore}
            onGoStart={() => setScreen("start")}
            onRestart={() => startRun(0)}
            onStartPractice={startPracticeRun}
          />
        )}
        {screen === "practiceResult" && (
          <PracticeResultScreen
            onGoLevelSelect={() => setScreen("levelSelect")}
            onGoStart={() => setScreen("start")}
            onRestartPractice={startPracticeRun}
          />
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
