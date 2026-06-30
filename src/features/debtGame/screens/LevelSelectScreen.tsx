import { ChevronLeft, ChevronRight, ClipboardList, Home, Play, RotateCcw } from "lucide-react";
import { LEVELS } from "../../../data/levels";
import type { LevelData, StoredStats } from "../../../types";
import { formatNumber, levelSelectClueCount } from "../../../appSupport";

type LevelGroup = {
  cases: Array<{ item: LevelData; index: number }>;
  level: number;
  title: string;
};

type LevelSelectScreenProps = {
  canStartPractice: boolean;
  levelGroups: LevelGroup[];
  selectedLevel: number;
  stats: StoredStats;
  onChooseCase: (index: number) => void;
  onGoStart: () => void;
  onGoTutorial: () => void;
  onResetStats: () => void;
  onStart: () => void;
  onStartCase: (index: number) => void;
  onStartPractice: () => void;
};

export function LevelSelectScreen({
  canStartPractice,
  levelGroups,
  selectedLevel,
  stats,
  onChooseCase,
  onGoStart,
  onGoTutorial,
  onResetStats,
  onStart,
  onStartCase,
  onStartPractice,
}: LevelSelectScreenProps) {
  return (
    <section className="game-screen level-select-screen">
      <header className="game-header">
        <button className="icon-action" onClick={onGoStart} type="button" title="첫 화면">
          <Home size={19} aria-hidden="true" />
        </button>
        <button className="arrow-action" onClick={onGoTutorial} type="button" title="튜토리얼">
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <div>
          <span>LEVEL SELECT</span>
          <strong>레벨 선택</strong>
        </div>
        <button className="arrow-action" onClick={onStart} type="button" title="시작">
          <ChevronRight size={22} aria-hidden="true" />
        </button>
        <div className="score-pill">
          <ClipboardList size={16} aria-hidden="true" />
          {LEVELS.length}
        </div>
      </header>

      <div className="stat-strip" aria-label="저장된 점수">
        <div>
          <span>최고점수</span>
          <strong>{formatNumber(stats.bestScore)}</strong>
        </div>
        <div>
          <span>문항수</span>
          <strong>{LEVELS.length}</strong>
        </div>
        <div>
          <span>최근점수</span>
          <strong>{formatNumber(stats.lastScore)}</strong>
        </div>
      </div>

      <div className="level-map" aria-label="레벨 선택">
        {levelGroups.map((group) => (
          <section className="level-node level-group-node" key={group.level}>
            <div className="level-group-badge">
              <span>LEVEL {group.level}</span>
            </div>
            <div className="level-group-main">
              <strong className="level-group-name">{group.title}</strong>
              <div className="level-case-grid">
                {group.cases.map(({ item, index }, caseIndex) => (
                  <button
                    className={selectedLevel === index ? "is-selected" : ""}
                    key={item.id}
                    onClick={() => onChooseCase(index)}
                    onDoubleClick={() => onStartCase(index)}
                    type="button"
                    title="두 번 누르면 바로 시작"
                  >
                    <strong>{caseIndex + 1}</strong>
                    <small>단서 {levelSelectClueCount(item)}개</small>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="start-actions">
        <button className="primary-action" onClick={onStart} type="button">
          <Play size={19} aria-hidden="true" />
          시작
        </button>
        <button className="ghost-action" onClick={onResetStats} type="button" title="저장된 점수 초기화">
          <RotateCcw size={18} aria-hidden="true" />
          기록 초기화
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
