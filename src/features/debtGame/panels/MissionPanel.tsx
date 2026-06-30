import type { CSSProperties, ReactNode } from "react";
import { Check, ChevronRight, Trophy } from "lucide-react";
import type { CalculationResult } from "../../../calculation";
import { SUPPORT_OPTIONS } from "../../../data/levels";
import {
  dependentAnswerLabel,
  formatAmount,
  MIN_LIVING_EXPENSE_RATIO,
  type AdditionalLivingExpenseItem,
  type MissionDraft,
  supportOptionMeta,
} from "../../../appSupport";

type LivingBasis = {
  dependents: number;
  householdMembers: number;
  maxLivingExpense: number;
  minimumLivingExpense: number;
};

type RepaymentModel = {
  feedback: string;
  feedbackState: string;
  livingExpense: number;
  monthlyPayment: number;
  paymentRatio: number;
  periodLabel: string;
  sliderMax: number;
  sliderValue: number;
};

type MissionPanelProps = {
  allCluesFound: boolean;
  calculation: CalculationResult;
  extraLivingItems: AdditionalLivingExpenseItem[];
  hasCurrentSecuredIncomeDeduction: boolean;
  livingBasis: LivingBasis;
  missionDraft: MissionDraft;
  missionPage: 0 | 1;
  repaymentModel: RepaymentModel;
  onChangeLivingDependents: (delta: number) => void;
  onMoveToFinalMission: () => void;
  onSetFeedback: (feedback: string) => void;
  onSetMissionDraft: (updater: (current: MissionDraft) => MissionDraft) => void;
  onSubmitMission: () => void;
  onUpdateRepaymentDraft: (value: number) => void;
  onUpdateRepaymentDraftFromClientX: (clientX: number, element: HTMLElement) => void;
  renderQuickActions: () => ReactNode;
};

export function MissionPanel({
  allCluesFound,
  calculation,
  extraLivingItems,
  hasCurrentSecuredIncomeDeduction,
  livingBasis,
  missionDraft,
  missionPage,
  repaymentModel,
  onChangeLivingDependents,
  onMoveToFinalMission,
  onSetFeedback,
  onSetMissionDraft,
  onSubmitMission,
  onUpdateRepaymentDraft,
  onUpdateRepaymentDraftFromClientX,
  renderQuickActions,
}: MissionPanelProps) {
  return (
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
                        onSetFeedback("단서 완료 후 지원구분을 선택하세요.");
                        return;
                      }

                      onSetFeedback("");
                      onSetMissionDraft((current) => ({ ...current, supportType: option }));
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

          <button className="primary-action" onClick={onMoveToFinalMission} type="button">
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
                  onClick={() => onChangeLivingDependents(-1)}
                  type="button"
                >
                  -1
                </button>
                <strong>{livingBasis.dependents}명</strong>
                <button
                  aria-label="부양가족 늘리기"
                  disabled={livingBasis.dependents >= 5}
                  onClick={() => onChangeLivingDependents(1)}
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
                onUpdateRepaymentDraftFromClientX(event.clientX, event.currentTarget);
              }}
              onPointerMove={(event) => {
                if (event.pointerType === "mouse" && event.buttons !== 1) {
                  return;
                }

                event.preventDefault();
                onUpdateRepaymentDraftFromClientX(event.clientX, event.currentTarget);
              }}
              onTouchMove={(event) => {
                const touch = event.touches[0];

                if (!touch) {
                  return;
                }

                event.preventDefault();
                onUpdateRepaymentDraftFromClientX(touch.clientX, event.currentTarget);
              }}
              onTouchStart={(event) => {
                const touch = event.touches[0];

                if (!touch) {
                  return;
                }

                event.preventDefault();
                onUpdateRepaymentDraftFromClientX(touch.clientX, event.currentTarget);
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
                onChange={(event) => onUpdateRepaymentDraft(Number(event.target.value))}
                onInput={(event) => onUpdateRepaymentDraft(Number(event.currentTarget.value))}
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

          <button className="primary-action" onClick={onSubmitMission} type="button">
            <Check size={19} aria-hidden="true" />
            제출
          </button>
        </>
      )}
    </article>
  );
}
