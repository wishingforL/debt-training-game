import type { FieldValue, LevelData } from "../../types";

export function completeAllClues(level: LevelData) {
  const answers: Record<string, FieldValue> = {};
  const solved: Record<string, boolean> = {};
  const wrongAttempts: Record<string, number> = {};

  level.fields.forEach((field) => {
    answers[field.key] = field.answer;
    solved[field.key] = true;
    wrongAttempts[field.key] = 0;
  });

  return { answers, solved, wrongAttempts };
}
