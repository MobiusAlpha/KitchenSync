#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Ensure uv is available
if ! command -v uv &>/dev/null; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi

# Install/update specify-cli
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git 2>/dev/null || \
uv tool upgrade specify-cli 2>/dev/null || true
