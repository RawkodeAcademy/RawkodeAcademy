#!/usr/bin/env bash
set -euo pipefail

target="./node_modules/@cloudflare/workerd-linux-64/bin/workerd"
if [[ ! -f "$target" ]]; then
  echo "[patch-workerd] workerd binary not found at $target (ok if not on Linux)"
  exit 0
fi

if ! command -v patchelf >/dev/null 2>&1; then
  echo "[patch-workerd] patchelf not found; skipping patch"
  exit 0
fi

interp="/lib64/ld-linux-x86-64.so.2"
if [[ -n "${NIX_GLIBC_INTERP:-}" ]]; then
  interp="$NIX_GLIBC_INTERP"
fi

echo "[patch-workerd] setting interpreter to $interp"
patchelf --set-interpreter "$interp" "$target" || true
echo "[patch-workerd] done"

