#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/../boltzmann-rs"

echo "Building boltzmann-rs WASM for Node.js..."
wasm-pack build --target nodejs --release --out-dir ../cli/wasm

# Clean up unnecessary files
rm -f ../cli/wasm/.gitignore ../cli/wasm/package.json

echo "Node.js WASM build complete. Output in cli/wasm/"
ls -lh ../cli/wasm/
