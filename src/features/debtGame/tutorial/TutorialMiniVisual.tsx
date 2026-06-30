import type { CSSProperties } from "react";
import { formatAmount } from "../../../appSupport";

type TutorialMiniVisualProps = {
  chip: string;
  tutorialMiniPayment: number;
  visual: string;
  onTutorialMiniPaymentChange: (value: number) => void;
};

export function TutorialMiniVisual({
  chip,
  tutorialMiniPayment,
  visual,
  onTutorialMiniPaymentChange,
}: TutorialMiniVisualProps) {
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

    const miniIncome = 220;
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
            onChange={(event) => onTutorialMiniPaymentChange(Number(event.target.value))}
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
