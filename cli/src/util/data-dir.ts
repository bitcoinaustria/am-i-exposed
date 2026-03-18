import { fileURLToPath } from "url";
import { dirname, join } from "path";

// In CJS bundle (esbuild), __dirname is available. In ESM (tsx dev), use import.meta.
const dir = typeof __dirname !== "undefined"
  ? __dirname
  : dirname(fileURLToPath(import.meta.url));

/** Absolute path to the bundled data/ directory (entity .bin files). */
export const DATA_DIR = join(dir, "..", "..", "data");

/** Absolute path to the bundled wasm/ directory (Boltzmann WASM bindings). */
export const WASM_DIR = join(dir, "..", "..", "wasm");
