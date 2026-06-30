import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";

type GameScreenProps = {
  children: ReactNode;
  currentIndex: number;
  levelTitle: string;
  onHome: () => void;
  onNext: () => void;
  onPrevious: () => void;
  nextDisabled?: boolean;
  nextTitle?: string;
  previousDisabled: boolean;
  previousTitle: string;
  progressWidth: number;
  scoreSlot: ReactNode;
  stageLabel: string;
  totalCount: number;
};

export function GameScreen({
  children,
  currentIndex,
  levelTitle,
  onHome,
  onNext,
  onPrevious,
  nextDisabled = false,
  nextTitle = "다음 단계",
  previousDisabled,
  previousTitle,
  progressWidth,
  scoreSlot,
  stageLabel,
  totalCount,
}: GameScreenProps) {
  return (
    <section className="game-screen">
      <header className="game-header">
        <button className="icon-action" onClick={onHome} type="button" title="이동 메뉴">
          <Home size={19} aria-hidden="true" />
        </button>
        <button
          className="arrow-action"
          disabled={previousDisabled}
          onClick={onPrevious}
          type="button"
          title={previousTitle}
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <div>
          <span>{stageLabel}</span>
          <strong>{levelTitle}</strong>
        </div>
        <button className="arrow-action" disabled={nextDisabled} onClick={onNext} type="button" title={nextTitle}>
          <ChevronRight size={22} aria-hidden="true" />
        </button>
        {scoreSlot}
      </header>

      <div className="progress-wrap" aria-label="전체 진행률">
        <span>{currentIndex + 1}/{totalCount}</span>
        <div className="progress-line">
          <i style={{ width: `${progressWidth}%` }} />
        </div>
      </div>

      {children}
    </section>
  );
}
