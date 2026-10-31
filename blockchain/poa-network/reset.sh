#!/usr/bin/env bash
# Stops the network and deletes all generated keys and chain data.
set -euo pipefail
cd "$(dirname "$0")"
docker compose down 2>/dev/null || true
rm -rf networkFiles nodes qbftConfigFile.json .env
echo "Network removed. Run ./setup.sh to create a new one."
