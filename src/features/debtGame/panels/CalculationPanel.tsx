import { ChevronRight } from "lucide-react";
import type { CalculationResult } from "../../../calculation";
import type { LevelData } from "../../../types";
import {
  canUseMaxRepaymentPeriod,
  formatAmount,
  isMaxRepaymentVerifiedPossible,
  livingExpenseFormulaText,
  livingExpenseIncomeComparison,
  maxLivingExpenseIncomeLabel,
  maxPeriodMonthlyPaymentFor,
  maxPeriodPaymentFormulaText,
  maxRepaymentAvailabilityText,
  maxRepaymentVerificationFormulaText,
  maxRepaymentVerificationLabel,
  maxRepaymentVerificationStatusText,
  monthlyPaymentFormulaText,
  needsMaxRepaymentVerification,
  numericAnswer,
  recognizedLivingExpenseFormulaDisplayTextFor,
  recognizedLivingExpenseLabel,
  renderCalculationAnswerCard,
  renderCalculationReasonCard,
  repaymentPeriodFormulaText,
  scoreWithMax,
} from "../../../appSupport";

type CalculationPanelProps = {
  calculation: CalculationResult;
  currentLevelScore: number;
  hasCurrentSecuredIncomeDeduction: boolean;
  isLastLevel: boolean;
  isLastPracticeLevel: boolean;
  level: LevelData;
  levelMistakes: number;
  maxLevelScore: number;
  practiceMode: boolean;
  onFinish: () => void;
};

export function CalculationPanel({
  calculation,
  currentLevelScore,
  hasCurrentSecuredIncomeDeduction,
  isLastLevel,
  isLastPracticeLevel,
  level,
  levelMistakes,
  maxLevelScore,
  practiceMode,
  onFinish,
}: CalculationPanelProps) {
  return (
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
          <dt>{maxLivingExpenseIncomeLabel(hasCurrentSecuredIncomeDeduction)}</dt>
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
        </div>
      )}

      <button className="primary-action" onClick={onFinish} type="button">
        <ChevronRight size={19} aria-hidden="true" />
        {practiceMode ? (isLastPracticeLevel ? "실전 종료" : "다음 실전문제") : isLastLevel ? "결과 보기" : "다음 레벨"}
      </button>
    </article>
  );
}
