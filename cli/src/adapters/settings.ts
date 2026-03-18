/**
 * Static analysis settings for CLI.
 * Replaces the React useAnalysisSettings hook.
 */

export interface CliAnalysisSettings {
  maxDepth: number;
  minSats: number;
  skipCoinJoins: boolean;
  skipLargeClusters: boolean;
  enableCache: boolean;
  boltzmannTimeout: number;
}

const defaults: CliAnalysisSettings = {
  maxDepth: 3,
  minSats: 1000,
  skipCoinJoins: false,
  skipLargeClusters: false,
  enableCache: false,
  boltzmannTimeout: 300,
};

let current: CliAnalysisSettings = { ...defaults };

/** Update CLI settings from command-line flags. */
export function setCliSettings(
  overrides: Partial<CliAnalysisSettings>,
): void {
  current = { ...current, ...overrides };
}

/** Get current CLI analysis settings. */
export function getCliSettings(): CliAnalysisSettings {
  return current;
}
