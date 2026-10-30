# LandRegistry contract

Solidity contract behind AcreVault. See the root README for full setup.

```shell
npm test                 # run the contract tests
npm run compile          # compile (writes artifacts/)
npm run deploy:holesky   # deploy; needs HOLESKY_RPC_URL and PRIVATE_KEY in .env
```

After changing the contract, copy the ABI from
`artifacts/contracts/LandRegistry.sol/LandRegistry.json` (the `abi` field) to
`frontend/src/lib/LandRegistryAbi.json`.

Scripts in `scripts/` read `CONTRACT_ADDRESS` from the environment:

- `setRegistrar.js` – grant or revoke the registrar role (`REGISTRAR`, `ALLOWED=false` to revoke)
- `registerLand.js`, `verifyLand.js`, `transferOwnership.js` – manual examples
