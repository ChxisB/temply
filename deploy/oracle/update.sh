#!/usr/bin/env bash
# Deploy the latest commit of the configured branch: pull, install, build the
# client, restart both services, and check health. Safe to run repeatedly.
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"
APP_DIR=/opt/temply
BRANCH="${BRANCH:-$(git -C "$APP_DIR" rev-parse --abbrev-ref HEAD)}"

cd "$APP_DIR"
git fetch --quiet origin "$BRANCH"
git checkout --quiet "$BRANCH"
git pull --ff-only --quiet origin "$BRANCH"
bun install --frozen-lockfile

# NEXT_PUBLIC_* values are baked in at build time, so the client is built on
# the host with its .env in place.
(cd client && bun run build)

sudo systemctl restart temply-server
sudo systemctl restart temply-client

for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:9000/api/health >/dev/null 2>&1; then
    echo "healthy: $(curl -fsS http://127.0.0.1:9000/api/health)"
    exit 0
  fi
  sleep 1
done
echo "the app did not answer /api/health within 30s — see: journalctl -u temply-server -u temply-client -n 100" >&2
exit 1
