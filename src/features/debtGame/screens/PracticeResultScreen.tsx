import { ClipboardList, Home, Play } from "lucide-react";
import { PRACTICE_LEVELS } from "../../../data/levels";

type PracticeResultScreenProps = {
  onGoLevelSelect: () => void;
  onGoStart: () => void;
  onRestartPractice: () => void;
};

export function PracticeResultScreen({
  onGoLevelSelect,
  onGoStart,
  onRestartPractice,
}: PracticeResultScreenProps) {
  return (
    <section className="result-screen practice-complete-screen">
      <div className="result-medal">
        <ClipboardList size={38} aria-hidden="true" />
      </div>
      <h1>실전문제 접수 완료</h1>
      <p className="result-summary-copy">총 {PRACTICE_LEVELS.length}개 실전문제를 모두 접수했습니다.</p>

      <div className="result-list practice-complete-list" aria-label="완료한 실전문제">
        {PRACTICE_LEVELS.map((item, index) => (
          <div key={item.id}>
            <span>실전문제 {index + 1}</span>
            <strong>접수 완료</strong>
            <small>{item.title}</small>
          </div>
        ))}
      </div>

      <div className="start-actions">
        <button className="primary-action" onClick={onRestartPractice} type="button">
          <Play size={19} aria-hidden="true" />
          다시 접수
        </button>
        <button className="ghost-action" onClick={onGoLevelSelect} type="button">
          <ClipboardList size={18} aria-hidden="true" />
          레벨 선택
        </button>
      </div>
      <button className="practice-result-action" onClick={onGoStart} type="button">
        <Home size={18} aria-hidden="true" />
        시작 화면
      </button>
    </section>
  );
}
