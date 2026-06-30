import { useRef, useState } from "react";
import { LEVELS } from "../../../data/levels";
import type { FieldValue, LevelResult, StoredStats } from "../../../types";
import {
  loadStats,
  type AssistState,
  type CalculatorDraft,
  type MissionDraft,
  type Phase,
  type Screen,
} from "../../../appSupport";

export function useDebtGameState() {
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
  const [tutorialMiniPayment, setTutorialMiniPayment] = useState(60);
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
  const previousAllCluesFoundRef = useRef(false);
  const supportSelectionButtonRef = useRef<HTMLButtonElement | null>(null);

  return {
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
  };
}
