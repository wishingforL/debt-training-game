import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  HelpCircle,
  Home,
  Play,
  Smartphone,
  Trophy,
} from "lucide-react";
import { TUTORIAL_CHIP_EXAMPLES, TUTORIAL_GROUPS } from "../../../appSupport";
import { TutorialMiniVisual } from "../tutorial/TutorialMiniVisual";

type TutorialExample = {
  sectionKey: string;
  chip: string;
} | null;

type TutorialScreenProps = {
  openTutorialSection: number;
  tutorialExample: TutorialExample;
  tutorialIndex: number;
  tutorialMiniPayment: number;
  tutorialProgress: number;
  onGoLevelSelect: () => void;
  onGoStart: () => void;
  onNextGroup: () => void;
  onPreviousGroup: () => void;
  onSelectExample: (example: Exclude<TutorialExample, null>) => void;
  onTutorialMiniPaymentChange: (value: number) => void;
  onToggleSection: (sectionIndex: number) => void;
};

export function TutorialScreen({
  openTutorialSection,
  tutorialExample,
  tutorialIndex,
  tutorialMiniPayment,
  tutorialProgress,
  onGoLevelSelect,
  onGoStart,
  onNextGroup,
  onPreviousGroup,
  onSelectExample,
  onTutorialMiniPaymentChange,
  onToggleSection,
}: TutorialScreenProps) {
  const tutorialGroup = TUTORIAL_GROUPS[tutorialIndex] ?? TUTORIAL_GROUPS[0];
  const TutorialIcon = tutorialIndex === 0 ? ClipboardList : Calculator;

  return (
    <section className="game-screen tutorial-screen">
      <header className="game-header">
        <button className="icon-action" onClick={onGoStart} type="button" title="표지">
          <Home size={19} aria-hidden="true" />
        </button>
        <button
          className="arrow-action"
          disabled={tutorialIndex === 0}
          onClick={onPreviousGroup}
          type="button"
          title="이전 튜토리얼"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <div>
          <span>TUTORIAL</span>
          <strong>{tutorialGroup.badge}</strong>
        </div>
        <button className="arrow-action" onClick={onNextGroup} type="button" title="다음 튜토리얼">
          <ChevronRight size={22} aria-hidden="true" />
        </button>
        <div className="score-pill">
          <ClipboardList size={16} aria-hidden="true" />
          {tutorialIndex + 1}/{TUTORIAL_GROUPS.length}
        </div>
      </header>

      <div className="progress-wrap" aria-label="튜토리얼 진행률">
        <span>{tutorialIndex + 1}/{TUTORIAL_GROUPS.length}</span>
        <div className="progress-line">
          <i style={{ width: `${tutorialProgress}%` }} />
        </div>
      </div>

      <article className="mission-panel tutorial-card tutorial-accordion-card">
        <div className="panel-heading">
          <TutorialIcon size={22} aria-hidden="true" />
          <div>
            <span>{tutorialGroup.badge}</span>
            <h2>{tutorialGroup.title}</h2>
          </div>
        </div>

        <div className="tutorial-accordion">
          {tutorialGroup.sections.map((section, sectionIndex) => {
            const isOpen = openTutorialSection === sectionIndex;
            const sectionKey = `${tutorialIndex}-${sectionIndex}`;
            const selectedExample =
              tutorialExample?.sectionKey === sectionKey
                ? TUTORIAL_CHIP_EXAMPLES[section.badge]?.[tutorialExample.chip]
                : "";
            const SectionIcon =
              section.visual === "flow"
                ? Smartphone
                : section.visual === "review"
                  ? HelpCircle
                  : section.visual === "score"
                    ? Trophy
                    : section.visual === "support" || section.visual === "balance"
                      ? Calculator
                      : ClipboardList;

            return (
              <section className={`tutorial-section${isOpen ? " is-open" : ""}`} key={section.badge}>
                <button
                  className="tutorial-section-toggle"
                  onClick={() => onToggleSection(sectionIndex)}
                  type="button"
                  aria-expanded={isOpen}
                >
                  <SectionIcon size={18} aria-hidden="true" />
                  <span>{section.badge}</span>
                  <strong>{section.title}</strong>
                  <ChevronRight size={18} aria-hidden="true" />
                </button>

                {isOpen && (
                  <div className="tutorial-section-body">
                    <div className="screen-chips tutorial-chip-grid" aria-label={`${section.badge} 핵심`}>
                      {section.chips.map((chip) => (
                        <button
                          className={tutorialExample?.sectionKey === sectionKey && tutorialExample.chip === chip ? "is-active" : ""}
                          key={chip}
                          onClick={() => onSelectExample({ sectionKey, chip })}
                          type="button"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {selectedExample && (
                      <>
                        <p className="tutorial-chip-example">{selectedExample}</p>
                        <TutorialMiniVisual
                          chip={tutorialExample?.chip ?? section.chips[0]}
                          tutorialMiniPayment={tutorialMiniPayment}
                          visual={section.visual}
                          onTutorialMiniPaymentChange={onTutorialMiniPaymentChange}
                        />
                      </>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </article>

      <div className="start-actions tutorial-actions">
        <button className="primary-action" onClick={onNextGroup} type="button">
          {tutorialIndex < TUTORIAL_GROUPS.length - 1 ? (
            <>
              <ChevronRight size={19} aria-hidden="true" />
              다음
            </>
          ) : (
            <>
              <Play size={19} aria-hidden="true" />
              레벨 선택
            </>
          )}
        </button>
        <button className="ghost-action" onClick={onGoLevelSelect} type="button">
          <ChevronRight size={19} aria-hidden="true" />
          건너뛰기
        </button>
      </div>
    </section>
  );
}
