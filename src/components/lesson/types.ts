/** A graded step reports its score (0–100) and whether it reached the pass mark. */
export type StepResultFn = (score: number, passed: boolean) => void;
