import { useEffect, type RefObject, type MutableRefObject } from "react";
import type { LevelResult } from "../../../types";
import type { Phase, Screen } from "../../../appSupport";

type UseSupportButtonAutoScrollParams = {
  allCluesFound: boolean;
  phase: Phase;
  previousAllCluesFoundRef: MutableRefObject<boolean>;
  reviewResult: LevelResult | null;
  screen: Screen;
  supportSelectionButtonRef: RefObject<HTMLButtonElement | null>;
};

type UseGameScrollResetParams = {
  levelIndex: number;
  missionPage: number;
  phase: Phase;
  practiceIndex: number;
  practiceMode: boolean;
  reviewResult: LevelResult | null;
  screen: Screen;
  tutorialIndex: number;
};

export function useSupportButtonAutoScroll({
  allCluesFound,
  phase,
  previousAllCluesFoundRef,
  reviewResult,
  screen,
  supportSelectionButtonRef,
}: UseSupportButtonAutoScrollParams) {
  useEffect(() => {
    const justCompleted = allCluesFound && !previousAllCluesFoundRef.current;
    previousAllCluesFoundRef.current = allCluesFound;

    if (!justCompleted || screen !== "game" || phase !== "scenario" || reviewResult) return;

    const scrollToSupportButton = () => {
      supportSelectionButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    const frame = requestAnimationFrame(scrollToSupportButton);
    const timeout = window.setTimeout(scrollToSupportButton, 140);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [allCluesFound, phase, previousAllCluesFoundRef, reviewResult, screen, supportSelectionButtonRef]);
}

export function useGameScrollReset({
  levelIndex,
  missionPage,
  phase,
  practiceIndex,
  practiceMode,
  reviewResult,
  screen,
  tutorialIndex,
}: UseGameScrollResetParams) {
  useEffect(() => {
    const scrollToTop = () => {
      const topOptions: ScrollToOptions = { top: 0, left: 0, behavior: "auto" };
      window.scrollTo(topOptions);
      document.scrollingElement?.scrollTo(topOptions);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      document
        .querySelectorAll<HTMLElement>(".phone-shell, .sheet-panel, .modal-panel")
        .forEach((element) => element.scrollTo(topOptions));
    };

    const frame = window.requestAnimationFrame(scrollToTop);
    const timeouts = [
      window.setTimeout(scrollToTop, 60),
      window.setTimeout(scrollToTop, 160),
      window.setTimeout(scrollToTop, 320),
    ];

    return () => {
      window.cancelAnimationFrame(frame);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [levelIndex, missionPage, phase, practiceIndex, practiceMode, reviewResult, screen, tutorialIndex]);
}
