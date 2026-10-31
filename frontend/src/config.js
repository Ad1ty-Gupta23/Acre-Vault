// Central place for service URLs and chain settings.
// Override any of these with VITE_* variables in a root .env file (see .env.example).
const env = import.meta.env;

export const API_URL = env.VITE_API_URL || "http://localhost:5001/api";
export const FRAUD_API_URL = env.VITE_FRAUD_API_URL || "http://localhost:5000";
export const CHAT_API_URL = env.VITE_CHAT_API_URL || "http://localhost:8000";

export const CONTRACT_ADDRESS =
  env.VITE_CONTRACT_ADDRESS || "0x66C5655A7A3a86BB514ECa467502FF5517692191";

// Holesky testnet by default
export const CHAIN_ID = Number(env.VITE_CHAIN_ID || 17000);
export const RPC_URL = env.VITE_RPC_URL || "https://ethereum-holesky-rpc.publicnode.com";
export const EXPLORER_URL = env.VITE_EXPLORER_URL || "https://holesky.etherscan.io";

// Block the contract was deployed at; event queries start here (0 scans the whole chain)
export const DEPLOY_BLOCK = Number(env.VITE_DEPLOY_BLOCK || 0);

// Gateway used to open documents stored on IPFS
export const IPFS_GATEWAY = env.VITE_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
