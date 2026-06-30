import { useMemo } from "react";
import type { IntakeField, LevelData, ScreenName } from "../../../types";
import {
  cluePromptLabel,
  fieldClue,
  fieldsInScenarioOrder,
  sameDebtClueGroup,
  sameDependentClueGroup,
  scenarioLinesInScreenOrder,
  screenOrderIndex,
  uniqueFields,
  uniqueValues,
} from "../../../appSupport";

type UseScenarioCluesParams = {
  activeField: IntakeField;
  clueFilterScreen: string | null;
  lastClueScreen: string | null;
  level: LevelData;
  practiceMode: boolean;
  showAllClues: boolean;
  solved: Record<string, boolean>;
};

export function useScenarioClues({
  activeField,
  clueFilterScreen,
  lastClueScreen,
  level,
  practiceMode,
  showAllClues,
  solved,
}: UseScenarioCluesParams) {
  const allCluesFound = level.fields.every((field) => solved[field.key]);
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

  const activeScenarioTargets = useMemo(() => {
    const currentClue = scenarioActiveField ? fieldClue(scenarioActiveField) : "";
    const currentFields = scenarioOrderedFields.filter((field) => fieldClue(field) === currentClue);
    const debtGroupFields = scenarioActiveField && !practiceMode
      ? scenarioOrderedFields.filter((field) => sameDebtClueGroup(scenarioActiveField, field))
      : [];
    const dependentGroupFields = scenarioActiveField
      ? scenarioOrderedFields.filter((field) => sameDependentClueGroup(scenarioActiveField, field))
      : [];
    const combinedFields = [...currentFields, ...debtGroupFields, ...dependentGroupFields];
    return uniqueFields(combinedFields);
  }, [practiceMode, scenarioActiveField, scenarioOrderedFields]);

  const screenClueGroups = useMemo(() => {
    return orderedScreenNames.map((screenName) => {
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

  return {
    activeScenarioTargets,
    allCluesFound,
    clueSummaryGroups,
    foundClueCount,
    orderedScreenNames,
    scenarioActiveField,
    scenarioDisplayLines,
    scenarioOrderedFields,
    scenarioPrompt,
    screenClueGroups,
    screenProgress,
    visibleClueGroups,
  };
}
