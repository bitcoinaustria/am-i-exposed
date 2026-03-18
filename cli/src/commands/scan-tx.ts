import { analyzeTransaction } from "@/lib/analysis/orchestrator";
import {
  selectRecommendations,
  type RecommendationContext,
} from "@/lib/recommendations/primary-recommendation";
import type { TxContext } from "@/lib/analysis/heuristics/types";
import type { MempoolTransaction } from "@/lib/api/types";
import { traceBackward, traceForward } from "@/lib/analysis/chain/recursive-trace";
import { analyzeEntityProximity } from "@/lib/analysis/chain/entity-proximity";
import { analyzeBackwardTaint } from "@/lib/analysis/chain/taint";
import { matchEntitySync } from "@/lib/analysis/entity-filter/entity-match";
import { createClient } from "../util/api";
import type { GlobalOpts } from "../index";
import { setJsonMode, startSpinner, updateSpinner, succeedSpinner } from "../util/progress";
import { formatTxResult } from "../output/formatter";
import { txJson } from "../output/json";

export async function scanTx(txid: string, opts: GlobalOpts): Promise<void> {
  const isJson = !!opts.json;
  setJsonMode(isJson);

  // Validate txid
  if (!/^[0-9a-fA-F]{64}$/.test(txid)) {
    throw new Error(`Invalid txid: expected 64 hex characters, got "${txid}"`);
  }

  const client = createClient(opts);
  const chainDepth = Number(opts.chainDepth ?? opts["chain-depth"] ?? 0);
  const minSats = Number(opts.minSats ?? opts["min-sats"] ?? 1000);

  // Fetch transaction
  startSpinner("Fetching transaction...");
  const tx = await client.getTransaction(txid);
  let rawHex: string | undefined;
  try {
    rawHex = await client.getTxHex(txid);
  } catch {
    // Raw hex is optional - some endpoints don't support it
  }

  // Build TxContext (parent txs, output tx counts)
  updateSpinner("Fetching context (parent transactions)...");
  const ctx = await buildTxContext(tx, client);

  // Run analysis
  updateSpinner("Running heuristic analysis...");
  const result = await analyzeTransaction(tx, rawHex, undefined, ctx);

  // Chain analysis (optional)
  let chainAnalysis: unknown = null;
  if (chainDepth > 0) {
    updateSpinner(`Tracing transaction graph (depth ${chainDepth})...`);
    chainAnalysis = await runChainAnalysis(tx, chainDepth, minSats, client);
  }

  // Recommendation
  const recCtx: RecommendationContext = {
    findings: result.findings,
    grade: result.grade,
    txType: result.txType,
    walletGuess: null,
  };
  const [primary] = selectRecommendations(recCtx);

  succeedSpinner("Analysis complete");

  // Output
  if (isJson) {
    txJson(txid, result, tx, opts.network, primary, chainAnalysis);
  } else {
    console.log(formatTxResult(txid, result, tx, opts.network, primary));
  }
}

/** Build TxContext for richer heuristic analysis. */
async function buildTxContext(
  tx: MempoolTransaction,
  client: ReturnType<typeof createClient>,
): Promise<TxContext> {
  const ctx: TxContext = {};
  const parentTxs = new Map<string, MempoolTransaction>();

  // Fetch parent transactions for all inputs (needed for entity detection, post-mix, etc.)
  const parentTxids = new Set<string>();
  for (const vin of tx.vin) {
    if (!vin.is_coinbase && vin.txid) {
      parentTxids.add(vin.txid);
    }
  }

  const parentFetches = [...parentTxids].map(async (ptxid) => {
    try {
      const ptx = await client.getTransaction(ptxid);
      parentTxs.set(ptxid, ptx);
    } catch {
      // Skip failed parent fetches
    }
  });
  await Promise.all(parentFetches);

  ctx.parentTxs = parentTxs;

  // Set parentTx (first input's parent) for peel chain detection
  if (tx.vin[0] && !tx.vin[0].is_coinbase && tx.vin[0].txid) {
    ctx.parentTx = parentTxs.get(tx.vin[0].txid);
  }

  // Fetch output address tx counts (for fresh-address change detection)
  const outputAddresses = tx.vout
    .map((v) => v.scriptpubkey_address)
    .filter((a): a is string => !!a);

  if (outputAddresses.length > 0 && outputAddresses.length <= 20) {
    const txCounts = new Map<string, number>();
    const countFetches = outputAddresses.map(async (addr) => {
      try {
        const addrData = await client.getAddress(addr);
        txCounts.set(
          addr,
          addrData.chain_stats.tx_count + addrData.mempool_stats.tx_count,
        );
      } catch {
        // Skip
      }
    });
    await Promise.all(countFetches);
    ctx.outputTxCounts = txCounts;
  }

  return ctx;
}

/** Run chain analysis modules on traced graph. */
async function runChainAnalysis(
  tx: MempoolTransaction,
  depth: number,
  minSats: number,
  client: ReturnType<typeof createClient>,
): Promise<unknown> {
  const backwardResult = await traceBackward(tx, depth, minSats, client);
  const forwardResult = await traceForward(tx, depth, minSats, client);

  // Run chain analysis modules
  const findings: import("@/lib/types").Finding[] = [];

  // Entity proximity
  const proximityResult = analyzeEntityProximity(tx, backwardResult.layers, forwardResult.layers);
  findings.push(...proximityResult.findings);

  // Taint analysis
  const entityChecker = (addr: string) => {
    const match = matchEntitySync(addr);
    return match ? { category: match.category, entityName: match.entityName } : null;
  };
  const taintResult = analyzeBackwardTaint(tx, backwardResult.layers, entityChecker);
  findings.push(...taintResult.findings);

  return {
    backward: {
      depth,
      txsFetched: backwardResult.fetchCount,
      aborted: backwardResult.aborted,
      layers: backwardResult.layers.map((l) => ({
        depth: l.depth,
        txCount: l.txs.size,
      })),
    },
    forward: {
      depth,
      txsFetched: forwardResult.fetchCount,
      aborted: forwardResult.aborted,
      layers: forwardResult.layers.map((l) => ({
        depth: l.depth,
        txCount: l.txs.size,
      })),
    },
    findings,
  };
}
