#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

worker="${SITES_PROJECT_ROOT}/dist/server/index.js"
hosting="${SITES_PROJECT_ROOT}/dist/.openai/hosting.json"

[[ -f "${worker}" ]] || {
  echo "Missing Sites Worker entry: dist/server/index.js" >&2
  exit 66
}
[[ -f "${hosting}" ]] || {
  echo "Missing packaged Sites manifest: dist/.openai/hosting.json" >&2
  exit 66
}

if grep -Fq "/.vinext/fonts/" "${worker}"; then
  echo "Sites Worker contains a build-machine font path instead of a public asset URL." >&2
  exit 65
fi

font_count="$({ find "${SITES_PROJECT_ROOT}/dist/client/assets" -type f -name '*.woff2' -print 2>/dev/null || true; } | wc -l | tr -d '[:space:]')"
if [[ "${font_count}" -lt 2 ]]; then
  echo "Expected the bundled Geist and Geist Mono webfonts in dist/client/assets." >&2
  exit 66
fi

# sites-env.sh always runs this script from the project root. Keeping the
# loader relative avoids Git Bash rewriting it to a bare C:/ path, which
# Node treats as an unsupported URL scheme for --import on Windows.
node \
  --import "./scripts/register-cloudflare-loader.mjs" \
  --input-type=module \
  - "${worker}" "${hosting}" <<'NODE'
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const [workerPath, hostingPath] = process.argv.slice(2);
JSON.parse(await readFile(hostingPath, "utf8"));

const workerUrl = pathToFileURL(workerPath);
workerUrl.searchParams.set("sites-validation", `${process.pid}-${Date.now()}`);
const worker = await import(workerUrl.href);
if (!worker.default || typeof worker.default.fetch !== "function") {
  throw new Error("dist/server/index.js must have an ESM default export with fetch(request, env, ctx)");
}
NODE

echo "Validated Sites artifact: ESM Worker default.fetch and hosting manifest are present."
