# AcreVault proof-of-authority network

A private Ethereum network where blocks are produced only by approved
**validators** (e.g. the land department, the revenue department, the sub-registrar
office and an auditor) instead of miners or stakers. It runs on
[Hyperledger Besu](https://besu.hyperledger.org) with **QBFT** consensus:

- 4 validator nodes; each block is signed by a validator and finalised immediately.
- Keeps working with 1 validator offline (QBFT tolerates `f` faulty validators
  out of `3f + 1`).
- 2-second blocks, zero gas price, chain ID **4242**.

This complements the contract's own authority model: validators decide which
transactions enter the chain, and the contract's registrars (government wallets)
decide which land records are verified.

## Run it

Requires Docker. From `blockchain/`:

```bash
# PRIVATE_KEY in blockchain/.env becomes the funded deployer account
npm run poa:setup     # generate validator keys + genesis (once)
npm run poa:start     # start the 4 validators; JSON-RPC on http://localhost:8545
npm run deploy:poa    # deploy LandRegistry; note the address and block
```

Point the website at it in the root `.env`:

```bash
VITE_RPC_URL=http://localhost:8545
VITE_CHAIN_ID=4242
VITE_CONTRACT_ADDRESS=<address from deploy:poa>
VITE_DEPLOY_BLOCK=<block from deploy:poa>
VITE_EXPLORER_URL=        # no public explorer for a private chain
```

Users add the network to MetaMask (RPC `http://localhost:8545`, chain ID 4242,
symbol ETH). Gas is free, but MetaMask may still require a non-zero balance, so
fund wallets from the deployer:

```bash
FUND_ADDRESS=0x... npx hardhat run scripts/fund.js --network poa
```

`npm run poa:stop` stops the network and keeps its data; `./poa-network/reset.sh`
deletes keys and chain data so you can start fresh.

## Managing validators

Validators vote on membership through the `qbft_*` RPC methods. To add a node,
start it with the same `genesis.json` and a bootnode, then have more than half of
the current validators propose its address:

```bash
curl -X POST localhost:8545 -H 'content-type: application/json' --data \
  '{"jsonrpc":"2.0","id":1,"method":"qbft_proposeValidatorVote","params":["0xNEW_VALIDATOR",true]}'
```

(Send it to each validator's RPC endpoint; only node1 exposes one by default.)
Use `false` to remove a validator and `qbft_getValidatorsByBlockNumber` with
`["latest"]` to list the current set.

## Production notes

This setup is for development and demos. For a real deployment, run each
validator on infrastructure owned by a different authority, keep `key.priv` files
in a secrets manager, don't expose RPC with `*` CORS/host allow-lists, and enable
Besu's node permissioning so only approved nodes can join.
