import type { DecoyClue, FieldValue, IntakeField, LevelData } from "../../types";
import {
  cluePromptLabel,
  fieldClue,
  nextOpenFieldInOrder,
  sameDebtClueGroup,
  sameDependentClueGroup,
  uniqueFields,
  uniqueValues,
} from "../../appSupport";

type ScenarioFieldTapValidationParams = {
  activeField: IntakeField;
  activeFieldIndex: number;
  activeScenarioTargets: IntakeField[];
  answers: Record<string, FieldValue>;
  fields: IntakeField[];
  level: LevelData;
  practiceMode: boolean;
  scenarioActiveField: IntakeField;
  scenarioOrderedFields: IntakeField[];
  solved: Record<string, boolean>;
  wrongAttempts: Record<string, number>;
};

function isDebtAmountField(field: IntakeField) {
  return (
    field.screen === "채무현황" &&
    (field.key === "unsecuredDebt" ||
      field.key === "securedDebt" ||
      field.key.startsWith("unsecuredDebt.") ||
      field.key.startsWith("securedDebt."))
  );
}

function canGroupBySameClue(tappedField: IntakeField, candidate: IntakeField) {
  if (tappedField.key === candidate.key) return true;
  if (isDebtAmountField(tappedField) && isDebtAmountField(candidate)) return false;
  return fieldClue(candidate) === fieldClue(tappedField);
}

export function validateScenarioFieldTap({
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
}: ScenarioFieldTapValidationParams) {
  if (level.fields.every((field) => solved[field.key])) {
    return {
      feedback: "모든 단서를 확인했습니다. 지원구분을 선택하세요.",
      status: "complete" as const,
    };
  }

  const tappedScreen = fields[0]?.screen ?? null;
  const activeScreenName = scenarioActiveField?.screen ?? activeField?.screen ?? tappedScreen;
  const activeScreenCandidates = activeScreenName
    ? scenarioOrderedFields.filter((field) => field.screen === activeScreenName && !solved[field.key])
    : [];
  const candidates = uniqueFields([
    ...activeScenarioTargets.filter((field) => !solved[field.key]),
    ...activeScreenCandidates,
  ]);
  const directTargetFields = fields.filter((field) =>
    candidates.some((candidate) => candidate.key === field.key) && !solved[field.key],
  );
  const groupedTargetFields = candidates.filter((candidate) =>
    directTargetFields.some(
      (field) =>
        candidate.screen === field.screen &&
        !solved[candidate.key] &&
        (canGroupBySameClue(field, candidate) ||
          (!practiceMode && sameDebtClueGroup(field, candidate)) ||
          sameDependentClueGroup(field, candidate)),
    ),
  );
  const targetFields = uniqueFields([...directTargetFields, ...groupedTargetFields]);

  if (targetFields.length === 0) {
    const targetField = candidates[0] ?? activeField;
    const nextAttempts = (wrongAttempts[targetField.key] ?? 0) + 1;
    const practiceWrongMessage =
      practiceMode && targetField.screen === "가족"
        ? "지금은 인정되는 가족 단서를 찾는 단계입니다. 제외 가족은 누르지 마세요."
        : practiceMode && targetField.screen === "채무현황"
          ? "지금 찾는 채무현황 항목과 다른 단서입니다. 신용채무, 담보채무, 원리금을 구분하세요."
          : "지금 찾는 항목의 단서가 아니에요.";

    return {
      feedback: nextAttempts >= 2 ? "두 번 틀렸어요. 힌트창에서 정답 문장을 볼 수 있습니다." : practiceWrongMessage,
      nextAttempts,
      status: "wrong" as const,
      targetField,
    };
  }

  const successScreen = targetFields[0]?.screen ?? tappedScreen;
  const nextSolved = { ...solved };
  const nextAnswers = { ...answers };
  const nextAttempts = { ...wrongAttempts };

  targetFields.forEach((field) => {
    nextSolved[field.key] = true;
    nextAnswers[field.key] = field.answer;
    nextAttempts[field.key] = 0;
  });

  return {
    feedback: `${uniqueValues(targetFields.map((field) => cluePromptLabel(field.label))).join(" · ")} 확인 완료`,
    nextActiveFieldIndex: nextOpenFieldInOrder(level, nextSolved, scenarioOrderedFields, activeFieldIndex + 1),
    nextAnswers,
    nextSolved,
    nextWrongAttempts: nextAttempts,
    status: "correct" as const,
    successScreen,
    targetFields,
  };
}

type ScenarioDecoyTapValidationParams = {
  activeField: IntakeField;
  activeScenarioTargets: IntakeField[];
  decoy: DecoyClue;
  solved: Record<string, boolean>;
  wrongAttempts: Record<string, number>;
};

export function validateScenarioDecoyTap({
  activeField,
  activeScenarioTargets,
  decoy,
  solved,
  wrongAttempts,
}: ScenarioDecoyTapValidationParams) {
  const targetField =
    activeScenarioTargets.find((field) => field.screen === decoy.screen && !solved[field.key]) ??
    activeScenarioTargets.find((field) => !solved[field.key]) ??
    activeField;
  const nextAttempts = (wrongAttempts[targetField.key] ?? 0) + 1;

  return {
    assistBody: [
      `${decoy.label}은(는) 이번 문항에서 선택하지 않습니다.`,
      decoy.reason,
      "인정되는 부양가족 또는 현재 찾고 있는 접수 단서를 다시 확인하세요.",
    ].join("\n"),
    feedback: `${decoy.label}은(는) 선택하지 않는 단서입니다. ${decoy.reason}`,
    nextAttempts,
    targetField,
  };
}
