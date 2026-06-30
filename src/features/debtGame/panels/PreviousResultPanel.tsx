import { ClipboardList } from "lucide-react";
import type { LevelResult } from "../../../types";
import {
  canUseMaxRepaymentPeriod,
  formatAmount,
  formatNumber,
  hasSecuredIncomeDeduction,
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
  recognizedLivingExpenseFormulaDisplayTextFor,
  recognizedLivingExpenseLabel,
} from "../../../appSupport";

type PreviousResultPanelProps = {
  result: LevelResult;
};

export function PreviousResultPanel({ result }: PreviousResultPanelProps) {
  return (
    <article className="calculation-panel previous-calculation-panel">
      <div className="panel-heading">
        <ClipboardList size={20} aria-hidden="true" />
        <div>
          <span>이전 결과</span>
          <h2>{result.title}</h2>
        </div>
      </div>

      <dl className="calc-sheet">
        <div>
          <dt>대상채무</dt>
          <dd>{formatAmount(result.targetDebt)}</dd>
        </div>
        <div>
          <dt>
            {maxLivingExpenseIncomeLabel(
              hasSecuredIncomeDeduction({
                income: result.income,
                repaymentBaseIncome: result.repaymentBaseIncome,
                securedPayment: result.securedPayment,
              }),
            )}
          </dt>
          <dd>
            <strong>{livingExpenseIncomeComparison(result.maxLivingExpense, result.repaymentBaseIncome)}</strong>
            <span>
              {maxRepaymentAvailabilityText(
                result.maxLivingExpense,
                result.repaymentBaseIncome,
                result.maxRepaymentMonths,
              )}
            </span>
          </dd>
        </div>
        {canUseMaxRepaymentPeriod(result.maxLivingExpense, result.repaymentBaseIncome) && (
          <div className="calc-period-payment-row">
            <dt>월납부액</dt>
            <dd>
              <strong className="calc-formula-period-payment">{result.repaymentFormula}</strong>
            </dd>
          </div>
        )}
        {needsMaxRepaymentVerification(result) && (
          <>
            <div>
              <dt>
                <span>최장기간</span>
                <span>월납부액</span>
              </dt>
              <dd>
                <strong className="calc-formula-max-payment">{maxPeriodPaymentFormulaText(result)}</strong>
              </dd>
            </div>
            <div>
              <dt>
                <span>최대 상환</span>
                <span>기간 검토</span>
              </dt>
              <dd>
                <span>{maxRepaymentVerificationLabel(result)}</span>
                <strong className="calc-formula-inline calc-formula-tight">
                  {maxRepaymentVerificationFormulaText(result)}
                </strong>
                <span>{maxRepaymentVerificationStatusText(result)}</span>
              </dd>
            </div>
          </>
        )}
        <div>
          <dt>생활비</dt>
          <dd>
            <span>
              {canUseMaxRepaymentPeriod(result.maxLivingExpense, result.repaymentBaseIncome) ||
              (needsMaxRepaymentVerification(result) && isMaxRepaymentVerifiedPossible(result))
                ? hasSecuredIncomeDeduction({
                    income: result.income,
                    repaymentBaseIncome: result.repaymentBaseIncome,
                    securedPayment: result.securedPayment,
                  })
                  ? "남은소득 - 월납부액"
                  : "소득 - 월납부액"
                : result.additionalLivingExpense > 0
                  ? recognizedLivingExpenseLabel(result)
                  : "소득 - 월납부액"}
            </span>
            <strong className="calc-formula-inline">
              {canUseMaxRepaymentPeriod(result.maxLivingExpense, result.repaymentBaseIncome) ||
              (needsMaxRepaymentVerification(result) && isMaxRepaymentVerifiedPossible(result))
                ? livingExpenseFormulaText(
                    result.repaymentBaseIncome,
                    needsMaxRepaymentVerification(result)
                      ? maxPeriodMonthlyPaymentFor(result)
                      : result.monthlyPayment,
                    result.adjustedLivingExpense,
                  )
                : result.additionalLivingExpense > 0
                  ? recognizedLivingExpenseFormulaDisplayTextFor(result, result.adjustedLivingExpense)
                  : livingExpenseFormulaText(
                      result.repaymentBaseIncome,
                      result.monthlyPayment,
                      result.adjustedLivingExpense,
                    )}
            </strong>
          </dd>
        </div>
        {needsMaxRepaymentVerification(result) && !isMaxRepaymentVerifiedPossible(result) && (
          <div>
            <dt>월납부액</dt>
            <dd>
              <span>{result.securedPayment > 0 ? "남은소득 - 생활비" : "소득 - 생활비"}</span>
              <strong className="calc-formula-inline">
                {monthlyPaymentFormulaText(
                  result.repaymentBaseIncome,
                  result.adjustedLivingExpense,
                  result.monthlyPayment,
                )}
              </strong>
            </dd>
          </div>
        )}
        {needsMaxRepaymentVerification(result) && !isMaxRepaymentVerifiedPossible(result) && (
          <div>
            <dt>상환기간</dt>
            <dd>
              <span>{formatAmount(result.targetDebt)} 월 {formatAmount(result.monthlyPayment)} 납부시 기간</span>
              <strong>= {result.repaymentPeriod}개월</strong>
            </dd>
          </div>
        )}
        <div>
          <dt>오답</dt>
          <dd>{result.mistakes}회</dd>
        </div>
        <div>
          <dt>점수</dt>
          <dd>{formatNumber(result.score)}점</dd>
        </div>
      </dl>
    </article>
  );
}
