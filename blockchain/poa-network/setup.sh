#!/usr/bin/env bash
# Generates validator keys and the genesis block for the AcreVault proof-of-authority
# network (Hyperledger Besu, QBFT consensus, 4 validators). Run once, then `docker compose up -d`.
set -euo pipefail
cd "$(dirname "$0")"

BESU_IMAGE="${BESU_IMAGE:-hyperledger/besu:26.10.1}"

if [ -d networkFiles ]; then
  echo "Network already generated. Run ./reset.sh first to start over (this deletes the chain)." >&2
  exit 1
fi

# The deployer account gets a genesis balance so it can deploy the contract and fund wallets
if [ -z "${DEPLOYER_ADDRESS:-}" ]; then
  DEPLOYER_ADDRESS=$(cd .. && node -e '
    require("dotenv").config();
    if (!process.env.PRIVATE_KEY) process.exit(1);
    console.log(new (require("ethers").Wallet)(process.env.PRIVATE_KEY).address);
  ') || { echo "Set PRIVATE_KEY in blockchain/.env (or export DEPLOYER_ADDRESS)." >&2; exit 1; }
fi
echo "Deployer: $DEPLOYER_ADDRESS"

sed "s/__DEPLOYER__/${DEPLOYER_ADDRESS#0x}/" qbftConfigFile.template.json > qbftConfigFile.json

# Call the besu binary directly: the image's entrypoint runs commands twice when started as root
docker run --rm --user "$(id -u):$(id -g)" -v "$PWD:/work" --entrypoint /opt/besu/bin/besu "$BESU_IMAGE" \
  operator generate-blockchain-config \
  --config-file=/work/qbftConfigFile.json \
  --to=/work/networkFiles \
  --private-key-file-name=key.priv

# One directory per validator: its keys plus its chain data
i=1
for dir in networkFiles/keys/*/; do
  mkdir -p "nodes/node$i/data"
  cp "${dir}key.priv" "${dir}key.pub" "nodes/node$i/"
  echo "node$i validator address: $(basename "$dir")"
  i=$((i + 1))
done

BOOTNODE_PUBKEY=$(cat nodes/node1/key.pub)
cat > .env <<ENV
BESU_IMAGE=$BESU_IMAGE
HOST_UID=$(id -u)
HOST_GID=$(id -g)
BOOTNODE=enode://${BOOTNODE_PUBKEY#0x}@172.16.240.11:30303
ENV

echo "Done. Start the network with: docker compose up -d"
