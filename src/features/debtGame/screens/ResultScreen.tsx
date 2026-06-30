import { ClipboardList, Home, Play, Trophy } from "lucide-react";
import type { LevelResult } from "../../../types";
import { formatNumber, scoreWithMax } from "../../../appSupport";

type ResultTier = {
  description: string;
  icon: string;
  name: string;
};

type ResultScreenProps = {
  canStartPractice: boolean;
  resultMaxScore: number;
  resultTier: ResultTier;
  resultTierPercent: number;
  results: LevelResult[];
  sessionScore: number;
  onGoStart: () => void;
  onRestart: () => void;
  onStartPractice: () => void;
};

export function ResultScreen({
  canStartPractice,
  resultMaxScore,
  resultTier,
  resultTierPercent,
  results,
  sessionScore,
  onGoStart,
  onRestart,
  onStartPractice,
}: ResultScreenProps) {
  return (
    <section className="result-screen">
      <div className="result-medal">
        <Trophy size={38} aria-hidden="true" />
      </div>
      <h1>{formatNumber(sessionScore)}점</h1>
      <p className="result-summary-copy">총 {scoreWithMax(sessionScore, resultMaxScore)} · {resultTier.name} 달성</p>

      <article className="fox-tier-card result-tier-card" aria-label={`최종 티어 ${resultTier.name}`}>
        <span>여우 성장 티어</span>
        <div className="fox-tier-head">
          <strong>
            <em aria-hidden="true">{resultTier.icon}</em>
            {resultTier.name}
          </strong>
          <small>{resultTierPercent}% 달성</small>
        </div>
        <p>{resultTier.description}</p>
      </article>

      <div className="result-list">
        {results.map((item) => (
          <div key={`${item.level}-${item.title}`}>
            <span>LEVEL {item.level} · {item.title}</span>
            <strong>{scoreWithMax(item.score, item.maxScore)}</strong>
            <small>오답 {item.mistakes}회</small>
          </div>
        ))}
      </div>

      <div className="start-actions">
        <button className="primary-action" onClick={onRestart} type="button">
          <Play size={19} aria-hidden="true" />
          다시 도전
        </button>
        <button className="ghost-action" onClick={onGoStart} type="button">
          <Home size={18} aria-hidden="true" />
          시작 화면
        </button>
      </div>
      <button
        className="practice-result-action"
        disabled={!canStartPractice}
        onClick={onStartPractice}
        title={canStartPractice ? "실전문제 접수" : "마스터여우 달성 시 열립니다"}
        type="button"
      >
        <ClipboardList size={19} aria-hidden="true" />
        실전문제 접수
      </button>
      {!canStartPractice && <small className="practice-lock-note">마스터여우 달성 시 열립니다.</small>}
    </section>
  );
}
