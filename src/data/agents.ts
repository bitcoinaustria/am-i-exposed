/** Static data for the /agents page. */

export interface AgentTool {
  name: string;
  desc: string;
  example: string;
}

export interface AgentWorkflow {
  title: string;
  steps: string[];
}

export interface GradeInfo {
  grade: string;
  range: string;
  color: string;
}

export interface PerfRow {
  mode: string;
  time: string;
  timeColor?: string;
  notes: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export const TOOLS: AgentTool[] = [
  {
    name: "scan_transaction",
    desc: "Run 27 privacy heuristics on a transaction. Detects CoinJoin, change outputs, wallet fingerprints, entity matches, and more.",
    example: "am-i-exposed scan tx 323df21f...dec2 --json",
  },
  {
    name: "scan_address",
    desc: "Check address reuse, UTXO hygiene, spending patterns, entity identification, and temporal correlation.",
    example: "am-i-exposed scan address bc1q... --json",
  },
  {
    name: "scan_psbt",
    desc: "Analyze an unsigned transaction BEFORE broadcasting. Zero network access needed. The key tool for privacy-aware transaction crafting.",
    example: "am-i-exposed scan psbt /tmp/proposed-tx.psbt --json",
  },
  {
    name: "scan_wallet",
    desc: "Wallet-level privacy audit via xpub/zpub/descriptor. Derives addresses, scans activity, checks reuse and UTXO hygiene.",
    example: "am-i-exposed scan xpub zpub6r... --json --gap-limit 30",
  },
  {
    name: "compute_boltzmann",
    desc: "Compute Boltzmann entropy, wallet efficiency, and the full link probability matrix. Auto-detects WabiSabi and JoinMarket for turbo mode.",
    example: "am-i-exposed boltzmann 323df21f...dec2 --json",
  },
];

export const WORKFLOWS: AgentWorkflow[] = [
  {
    title: "Pre-broadcast privacy check",
    steps: [
      "Craft a transaction in your wallet, export as PSBT",
      "Run: am-i-exposed scan psbt <file> --json",
      'Check .grade - if D or F, modify coin selection',
      "Repeat until grade is B or better, then sign and broadcast",
    ],
  },
  {
    title: "Wallet health audit",
    steps: [
      "Export your xpub/zpub from wallet software",
      "Run: am-i-exposed scan xpub <key> --json --gap-limit 30",
      "Check reusedAddresses (should be 0) and dustUtxos (should be 0)",
      "Review findings for consolidation history and script type mixing",
    ],
  },
  {
    title: "Transaction forensics",
    steps: [
      "Run: am-i-exposed scan tx <txid> --json",
      "Check grade and txType for quick assessment",
      "For deeper analysis: am-i-exposed chain-trace <txid> --depth 3 --json",
      "Review entity proximity and taint findings",
    ],
  },
];

export const MCP_CONFIG = `{
  "mcpServers": {
    "bitcoin-privacy": {
      "command": "npx",
      "args": ["-y", "am-i-exposed", "mcp"]
    }
  }
}`;

export const JSON_EXAMPLE = `{
  "score": 95,
  "grade": "A+",
  "txType": "whirlpool-coinjoin",
  "findings": [
    {
      "id": "h4-whirlpool",
      "severity": "good",
      "title": "Whirlpool CoinJoin detected",
      "scoreImpact": 30,
      "confidence": "deterministic"
    }
  ],
  "recommendation": {
    "urgency": "when-convenient",
    "headline": "Maintain UTXO separation"
  }
}`;

export const GRADES: GradeInfo[] = [
  { grade: "A+", range: "90-100", color: "text-severity-good" },
  { grade: "B", range: "75-89", color: "text-severity-low" },
  { grade: "C", range: "50-74", color: "text-severity-medium" },
  { grade: "D", range: "25-49", color: "text-severity-high" },
  { grade: "F", range: "0-24", color: "text-severity-critical" },
];

export const PERF_ROWS: PerfRow[] = [
  { mode: "Normal scan", time: "~10s", notes: "Full context (parent txs + output addresses)" },
  { mode: "--fast", time: "~6s", notes: "Skip context fetching, all heuristics still run" },
  { mode: "Cached (repeat)", time: "~1.5s", timeColor: "text-severity-good", notes: "SQLite cache, instant on second scan" },
  { mode: "PSBT (offline)", time: "<1s", timeColor: "text-severity-good", notes: "Zero network access needed" },
  { mode: "Boltzmann", time: "2-15ms", notes: "Rust/WASM, turbo modes for WabiSabi/JoinMarket" },
];

export const PRIVACY_POINTS: string[] = [
  "No addresses or transactions are logged or persisted by the CLI",
  "Entity detection uses bundled data files (~92 MB), no external APIs",
  "PSBT analysis requires zero network access",
  "Only mempool.space API is used for blockchain data (or your custom endpoint)",
  "All analysis runs locally on your machine",
];

export const FOOTER_LINKS: FooterLink[] = [
  { label: "skill.md (full docs)", href: "https://github.com/Copexit/am-i-exposed/blob/main/cli/skill.md" },
  { label: "CLI source code", href: "https://github.com/Copexit/am-i-exposed/tree/main/cli" },
  { label: "Full spec", href: "https://github.com/Copexit/am-i-exposed/blob/main/docs/spec-cli-tool.md" },
  { label: "npm package", href: "https://www.npmjs.com/package/am-i-exposed" },
];
