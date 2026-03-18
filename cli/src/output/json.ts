import type { ScoringResult, Finding } from "@/lib/types";
import type { PrimaryRec } from "@/lib/recommendations/primary-recommendation";
import type { WalletAuditResult } from "@/lib/analysis/wallet-audit";
import type { MempoolTransaction } from "@/lib/api/types";

const VERSION = "0.33.0";

interface JsonEnvelope {
  version: string;
  input: { type: string; value: string };
  network: string;
  score: number;
  grade: string;
  txType?: string;
  txInfo?: Record<string, unknown>;
  addressInfo?: Record<string, unknown>;
  walletInfo?: Record<string, unknown>;
  psbtInfo?: Record<string, unknown>;
  findings: Finding[];
  recommendation?: JsonRec | null;
  chainAnalysis?: unknown;
  boltzmann?: unknown;
  trace?: unknown;
}

interface JsonRec {
  id: string;
  urgency: string;
  headline: string;
  detail: string;
  tools?: { name: string; url: string }[];
}

function recToJson(rec: PrimaryRec | null | undefined): JsonRec | null {
  if (!rec) return null;
  return {
    id: rec.id,
    urgency: rec.urgency,
    headline: rec.headlineDefault,
    detail: rec.detailDefault,
    tools: rec.tools ?? (rec.tool ? [rec.tool] : undefined),
  };
}

export function jsonOutput(data: JsonEnvelope): void {
  console.log(JSON.stringify(data, null, 2));
}

export function txJson(
  txid: string,
  result: ScoringResult,
  tx: MempoolTransaction,
  network: string,
  rec?: PrimaryRec | null,
  chainAnalysis?: unknown,
): void {
  jsonOutput({
    version: VERSION,
    input: { type: "txid", value: txid },
    network,
    score: result.score,
    grade: result.grade,
    txType: result.txType,
    txInfo: {
      inputs: tx.vin.length,
      outputs: tx.vout.length,
      fee: tx.fee,
      size: tx.size,
      weight: tx.weight,
      confirmed: tx.status?.confirmed ?? false,
      blockHeight: tx.status?.block_height ?? null,
    },
    findings: result.findings,
    recommendation: recToJson(rec),
    chainAnalysis: chainAnalysis ?? null,
  });
}

export function addressJson(
  address: string,
  result: ScoringResult,
  network: string,
  addressInfo: Record<string, unknown>,
  rec?: PrimaryRec | null,
): void {
  jsonOutput({
    version: VERSION,
    input: { type: "address", value: address },
    network,
    score: result.score,
    grade: result.grade,
    addressInfo,
    findings: result.findings,
    recommendation: recToJson(rec),
  });
}

export function walletJson(
  descriptor: string,
  result: WalletAuditResult,
  network: string,
): void {
  jsonOutput({
    version: VERSION,
    input: { type: "xpub", value: descriptor },
    network,
    score: result.score,
    grade: result.grade,
    walletInfo: {
      activeAddresses: result.activeAddresses,
      totalTxs: result.totalTxs,
      totalUtxos: result.totalUtxos,
      totalBalance: result.totalBalance,
      reusedAddresses: result.reusedAddresses,
      dustUtxos: result.dustUtxos,
    },
    findings: result.findings,
  });
}

export function psbtJson(
  input: string,
  result: ScoringResult,
  psbtInfo: Record<string, unknown>,
): void {
  jsonOutput({
    version: VERSION,
    input: { type: "psbt", value: input.length > 80 ? input.slice(0, 77) + "..." : input },
    network: "mainnet",
    score: result.score,
    grade: result.grade,
    txType: result.txType,
    psbtInfo,
    findings: result.findings,
  });
}
