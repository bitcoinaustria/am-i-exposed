import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  configureDataLoader,
  loadEntityFilter,
  loadFullEntityFilter,
} from "@/lib/analysis/entity-filter/filter-loader";
import { DATA_DIR } from "../util/data-dir";

/**
 * Map internal entity data paths to the CLI's bundled data directory.
 * Internal paths are like "/data/entity-index.bin" - strip the "/data/" prefix
 * and resolve against DATA_DIR.
 */
function resolveDataPath(internalPath: string): string {
  const filename = internalPath.replace(/^\/data\//, "");
  return join(DATA_DIR, filename);
}

/**
 * Filesystem-based fetch for entity binary files.
 * Used as the fetchFn override for configureDataLoader().
 */
async function fsFetchArrayBuffer(
  path: string,
): Promise<ArrayBuffer | null> {
  const filePath = resolveDataPath(path);
  if (!existsSync(filePath)) return null;
  try {
    const buffer = readFileSync(filePath);
    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    );
  } catch {
    return null;
  }
}

/**
 * Initialize entity filter for CLI usage.
 * Configures filesystem-based data loading and loads the core index.
 * Call once at CLI startup before any analysis.
 */
export async function initEntityFilter(): Promise<void> {
  configureDataLoader({ fetchFn: fsFetchArrayBuffer });

  // Load core index (0.4 MB - fast)
  await loadEntityFilter();

  // Also load full index if available (57 MB + 35 MB - slower but comprehensive)
  await loadFullEntityFilter();
}
