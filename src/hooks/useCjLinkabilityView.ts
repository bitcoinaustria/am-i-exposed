import { useState, useEffect } from "react";

/**
 * Manages CoinJoin linkability view state.
 * Auto-resets when query changes. In pro mode, auto-enables when Boltzmann is computed for a CoinJoin.
 */
export function useCjLinkabilityView(
  query: string,
  isCoinJoin: boolean,
  proMode: boolean,
  boltzmannResult: unknown,
): [boolean, (v: boolean) => void] {
  const [cjLinkabilityView, setCjLinkabilityView] = useState(false);

  // Reset CJ linkability view when query changes or when the tx is not a CoinJoin
  useEffect(() => {
    const t = setTimeout(() => setCjLinkabilityView(false), 0);
    return () => clearTimeout(t);
  }, [query, isCoinJoin]);

  // Pro mode: auto-switch to linkability view when Boltzmann is computed for a CoinJoin
  // Normie mode: always reset to normal view
  useEffect(() => {
    if (proMode && boltzmannResult != null && isCoinJoin) {
      const t = setTimeout(() => setCjLinkabilityView(true), 0);
      return () => clearTimeout(t);
    } else if (!proMode) {
      const t = setTimeout(() => setCjLinkabilityView(false), 0);
      return () => clearTimeout(t);
    }
  }, [proMode, boltzmannResult, isCoinJoin]);

  return [cjLinkabilityView, setCjLinkabilityView];
}
