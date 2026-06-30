import type { MissionAnswer } from "../../types";
import { formatNumber, type MissionDraft } from "../../appSupport";

type SupportSelectionValidationParams = {
  currentAttempts: number;
  expectedSupportType: string;
  selectedSupportType: string;
};

export function validateSupportSelection({
  currentAttempts,
  expectedSupportType,
  selectedSupportType,
}: SupportSelectionValidationParams) {
  if (!selectedSupportType) {
    return {
      feedback: "지원구분을 먼저 선택해 주세요.",
      isCorrect: false,
      nextAttempts: currentAttempts,
      reason: "missing" as const,
    };
  }

  if (selectedSupportType !== expectedSupportType) {
    const nextAttempts = currentAttempts + 1;

    return {
      feedback:
        nextAttempts >= 2
          ? "지원구분이 맞지 않아요. 힌트에서 연체일수 기준을 확인하세요."
          : "지원구분이 맞지 않아요. 연체일수를 다시 확인하세요.",
      isCorrect: false,
      nextAttempts,
      reason: "mismatch" as const,
    };
  }

  return {
    feedback: "",
    isCorrect: true,
    nextAttempts: currentAttempts,
    reason: "correct" as const,
  };
}

type MissionRepaymentModel = {
  cannotCalculatePeriod: boolean;
  exceedsMaxPeriod: boolean;
  feedbackState: string;
  monthlyPayment: number;
  repaymentPeriod: number | null;
};

type MissionSubmissionValidationParams = {
  expectedLivingDependents: number;
  matchesLivingDependents: boolean;
  mission: MissionAnswer;
  missionDraft: MissionDraft;
  nextAttempts: number;
  practiceMode: boolean;
  repaymentModel: MissionRepaymentModel;
};

export function validateMissionSubmission({
  expectedLivingDependents,
  matchesLivingDependents,
  mission,
  missionDraft,
  nextAttempts,
  practiceMode,
  repaymentModel,
}: MissionSubmissionValidationParams) {
  const matchesRequiredDependents = !practiceMode || matchesLivingDependents;
  const matchesMissionValues =
    missionDraft.supportType === mission.supportType &&
    matchesRequiredDependents &&
    Math.abs(repaymentModel.monthlyPayment - mission.monthlyPayment) <= 0.05 &&
    repaymentModel.repaymentPeriod === mission.repaymentPeriod;
  const isCorrect =
    matchesMissionValues &&
    (practiceMode || (
      repaymentModel.feedbackState === "ok" &&
      !repaymentModel.cannotCalculatePeriod &&
      !repaymentModel.exceedsMaxPeriod
    ));

  if (isCorrect) {
    return {
      feedback: "",
      isCorrect,
      matchesMissionValues,
      matchesRequiredDependents,
    };
  }

  return {
    feedback:
      practiceMode && !matchesLivingDependents
        ? `부양가족 수를 다시 확인해 주세요. 이 문항은 부양가족 ${formatNumber(expectedLivingDependents)}명 기준입니다.`
        : nextAttempts >= 2
          ? "두 번 틀렸어요. 힌트창에서 정답을 볼 수 있습니다."
          : "최종미션 힌트를 확인해 보세요.",
    isCorrect,
    matchesMissionValues,
    matchesRequiredDependents,
  };
}
