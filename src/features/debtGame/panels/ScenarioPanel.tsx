import type { ReactNode, RefObject } from "react";
import { ClipboardList, Smartphone } from "lucide-react";
import type { ScreenName } from "../../../types";

type ScreenProgressItem = {
  done: number;
  screenName: ScreenName;
  total: number;
  totalLabel: string;
};

type ScenarioPanelProps = {
  activeScreenName: ScreenName;
  clueFilterScreen: string | null;
  lastClueScreen: string | null;
  practiceMode: boolean;
  scenarioDisplayLines: string[];
  scenarioPrompt: string;
  screenProgress: ScreenProgressItem[];
  showAllClues: boolean;
  supportSelectionButtonRef: RefObject<HTMLButtonElement>;
  isScenarioLineComplete: (line: string) => boolean;
  onFilterScreen: (screenName: ScreenName) => void;
  onMoveToSupportSelection: () => void;
  renderFoundClueSummary: () => ReactNode;
  renderScenarioLine: (line: string) => ReactNode;
};

export function ScenarioPanel({
  activeScreenName,
  clueFilterScreen,
  lastClueScreen,
  practiceMode,
  scenarioDisplayLines,
  scenarioPrompt,
  screenProgress,
  showAllClues,
  supportSelectionButtonRef,
  isScenarioLineComplete,
  onFilterScreen,
  onMoveToSupportSelection,
  renderFoundClueSummary,
  renderScenarioLine,
}: ScenarioPanelProps) {
  return (
    <article className="mission-panel">
      <div className="panel-heading">
        <ClipboardList size={20} aria-hidden="true" />
        <div>
          <h2>기본 상담 정보를 읽고 단서를 찾아 접수해주세요.</h2>
        </div>
      </div>

      <p className={`scenario-find-prompt ${practiceMode ? "is-practice" : ""}`}>
        <span>지금 찾을 항목</span>
        <strong>{scenarioPrompt}</strong>
      </p>
      {practiceMode && (
        <p className="practice-scenario-tip">
          줄글 속 현재 항목만 직접 누릅니다. 제외 가족이나 설명용 단서는 누르면 오답입니다.
        </p>
      )}

      <div className={`customer-log ${practiceMode ? "is-story" : ""}`}>
        {scenarioDisplayLines.map((line, index) => (
          <div className={isScenarioLineComplete(line) ? "is-found" : ""} key={`${index}-${line}`}>
            {renderScenarioLine(line)}
          </div>
        ))}
      </div>

      <div className="screen-chips" aria-label="접수 항목 진행">
        {screenProgress.map((item) => (
          <button
            className={`${item.done === item.total ? "is-complete" : ""} ${
              activeScreenName === item.screenName ? "is-active" : ""
            } ${(!showAllClues && (clueFilterScreen ?? lastClueScreen) === item.screenName) ? "is-filtered" : ""}`}
            key={item.screenName}
            onClick={() => onFilterScreen(item.screenName)}
            type="button"
          >
            <span>{item.screenName}</span>
            <small>{item.done}/{item.totalLabel}</small>
          </button>
        ))}
      </div>

      {renderFoundClueSummary()}

      <button
        className="primary-action"
        ref={supportSelectionButtonRef}
        onClick={onMoveToSupportSelection}
        type="button"
      >
        <Smartphone size={19} aria-hidden="true" />
        지원구분 선택하기
      </button>
    </article>
  );
}
