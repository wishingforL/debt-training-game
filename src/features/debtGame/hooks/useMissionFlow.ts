import { useMemo, type Dispatch, type SetStateAction } from "react";
import {
  livingExpenseBasisForDependents,
  paymentForMonths,
  repaymentMonthsForPayment,
  specialLivingExpenseForMaxPeriod,
  type CalculationResult,
} from "../../../calculation";
import type { LevelData } from "../../../types";
import {
  MIN_LIVING_EXPENSE_RATIO,
  PAYMENT_SNAP_TOLERANCE,
  additionalLivingExpenseItems,
  formatAmount,
  hasSecuredIncomeDeduction,
  paymentToSlider,
  round1,
  sliderMaxForIncome,
  sliderToPayment,
  supportTermsFor,
  type MissionDraft,
} from "../../../appSupport";

type UseMissionFlowParams = {
  calculation: CalculationResult;
  level: LevelData;
  livingDependentsDraft: number | null;
  missionDraft: MissionDraft;
  practiceMode: boolean;
  repaymentDraft: number | null;
  setLivingDependentsDraft: Dispatch<SetStateAction<number | null>>;
  setRepaymentDraft: Dispatch<SetStateAction<number | null>>;
};

export function useMissionFlow({
  calculation,
  level,
  livingDependentsDraft,
  missionDraft,
  practiceMode,
  repaymentDraft,
  setLivingDependentsDraft,
  setRepaymentDraft,
}: UseMissionFlowParams) {
  const expectedLivingDependents = Math.max(0, calculation.householdMembers - 1);
  const defaultLivingDependents = practiceMode ? 0 : expectedLivingDependents;
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
    const isMaxPeriodFeedback = targetPaymentTooLow || exceedsMaxPeriod;
    const feedbackState =
      livingExpense <= minimumLivingExpenseLimit
        ? "danger"
        : isMaxPeriodFeedback
          ? "period"
        : livingExpense > recognizedMaxLivingExpense ||
            cannotCalculatePeriod ||
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
  const hasCurrentSecuredIncomeDeduction = hasSecuredIncomeDeduction({
    income: calculation.income,
    repaymentBaseIncome: calculation.repaymentBaseIncome,
    securedPayment: calculation.securedPayment,
  });

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
      const baseDependents = practiceMode ? 0 : expectedLivingDependents;
      return Math.max(0, Math.min(5, (current ?? baseDependents) + delta));
    });
  }

  return {
    changeLivingDependents,
    expectedLivingDependents,
    extraLivingItems,
    hasCurrentSecuredIncomeDeduction,
    livingBasis,
    matchesLivingDependents,
    repaymentModel,
    updateRepaymentDraft,
    updateRepaymentDraftFromClientX,
  };
}
