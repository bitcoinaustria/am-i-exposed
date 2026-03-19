export type BitcoinNetwork = "mainnet" | "testnet4" | "signet";

export interface NetworkConfig {
  label: string;
  mempoolBaseUrl: string;
  /** mempool.space v3 onion - used when Tor is detected (mainnet only) */
  mempoolOnionUrl?: string;
  explorerUrl: string;
}

export const NETWORK_CONFIG: Record<BitcoinNetwork, NetworkConfig> = {
  mainnet: {
    label: "Mainnet",
    mempoolBaseUrl: "https://mempool.bitcoin-austria.at/api",
    explorerUrl: "https://mempool.bitcoin-austria.at",
  },
  testnet4: {
    label: "Testnet4",
    mempoolBaseUrl: "https://mempool.bitcoin-austria.at/testnet4/api",
    explorerUrl: "https://mempool.bitcoin-austria.at/testnet4",
  },
  signet: {
    label: "Signet",
    mempoolBaseUrl: "https://mempool.bitcoin-austria.at/signet/api",
    explorerUrl: "https://mempool.bitcoin-austria.at/signet",
  },
};

export const DEFAULT_NETWORK: BitcoinNetwork = "mainnet";

export function isValidNetwork(value: string): value is BitcoinNetwork {
  return value === "mainnet" || value === "testnet4" || value === "signet";
}
