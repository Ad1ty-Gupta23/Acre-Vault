// src/context/BlockchainContext.js
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import LandRegistryAbi from "../lib/LandRegistryAbi.json"; // Ensure the ABI JSON exists here
import { CONTRACT_ADDRESS, CHAIN_ID, RPC_URL, DEPLOY_BLOCK } from "../config";

// Create the context
const BlockchainContext = createContext();

// Turn ethers/MetaMask errors into something readable (e.g. the contract's revert reason)
export const getErrorMessage = (error) =>
  error?.reason ||
  error?.info?.error?.message ||
  error?.shortMessage ||
  error?.message ||
  "Transaction failed";

// Provider component that will wrap your app
export const BlockchainProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isRegistrar, setIsRegistrar] = useState(false);
  const [lands, setLands] = useState([]);
  const [landCount, setLandCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [landsLoading, setLandsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Public RPC so anyone can browse the registry without connecting a wallet
  const readContract = useMemo(
    () => new ethers.Contract(CONTRACT_ADDRESS, LandRegistryAbi, new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID)),
    []
  );

  const ensureCorrectNetwork = async () => {
    const chainIdHex = `0x${CHAIN_ID.toString(16)}`;
    const current = await window.ethereum.request({ method: "eth_chainId" });
    if (current !== chainIdHex) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    }
  };

  // Connect wallet and initialize provider/contract
  const connectWallet = async () => {
    if (!window.ethereum) {
      const message = "MetaMask not found. Install it to sign transactions.";
      setError(message);
      toast.error(message);
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await ensureCorrectNetwork();
      const _provider = new ethers.BrowserProvider(window.ethereum);

      // Create a signer-based contract instance for transactions
      const signer = await _provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      setContract(new ethers.Contract(CONTRACT_ADDRESS, LandRegistryAbi, signer));
      setError(null);
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError(getErrorMessage(err));
      toast.error(`Wallet connection failed: ${getErrorMessage(err)}`);
    }
  };

  // Function to fetch all land records using a read-only instance
  const fetchLands = useCallback(async () => {
    setLandsLoading(true);
    try {
      const countNumber = Number(await readContract.landCount());
      setLandCount(countNumber);

      const ids = Array.from({ length: countNumber }, (_, i) => i + 1);
      const landsArray = await Promise.all(
        ids.map(async (i) => {
          const [land, ownerWallet, documentCid] = await Promise.all([
            readContract.lands(i),
            // Contracts deployed before owner wallets/documents were tracked don't have these getters
            readContract.landOwnerWallet(i).catch(() => null),
            readContract.landDocumentCid(i).catch(() => null),
          ]);
          return {
            id: land.id.toString(),
            owner: land.owner,
            surveyNo: land.surveyNo,
            area: land.area.toString(),
            isVerified: land.isVerified,
            ownerWallet,
            documentCid: documentCid || null,
          };
        })
      );
      setLands(landsArray);
    } catch (err) {
      console.error("Error fetching lands:", err);
      setError("Could not load land records from the blockchain.");
      toast.error("Could not load land records from the blockchain.", { toastId: "lands-error" });
    } finally {
      setLandsLoading(false);
    }
  }, [readContract]);

  // Registry history from contract events, oldest first. Each entry:
  // { type: "registered" | "verified" | "transferred", landId, owner, wallet, documentCid, txHash, blockNumber, timestamp }
  const fetchHistory = useCallback(
    async ({ landId, limit } = {}) => {
      const [registered, verified, transferred] = await Promise.all([
        readContract.queryFilter(readContract.filters.LandRegistered(), DEPLOY_BLOCK),
        readContract.queryFilter(readContract.filters.LandVerified(), DEPLOY_BLOCK),
        readContract.queryFilter(readContract.filters.OwnershipTransferred(), DEPLOY_BLOCK),
      ]);

      let events = [
        ...registered.map((e) => ({
          type: "registered",
          owner: e.args.owner,
          wallet: e.args.ownerWallet,
          documentCid: e.args.documentCid,
          e,
        })),
        ...verified.map((e) => ({ type: "verified", wallet: e.args.registrar, e })),
        ...transferred.map((e) => ({
          type: "transferred",
          owner: e.args.newOwner,
          wallet: e.args.newOwnerWallet,
          documentCid: e.args.documentCid,
          e,
        })),
      ]
        .map(({ e, ...rest }) => ({
          ...rest,
          landId: e.args.id.toString(),
          txHash: e.transactionHash,
          blockNumber: e.blockNumber,
          logIndex: e.index,
        }))
        .sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex);

      if (landId) events = events.filter((event) => event.landId === String(landId));
      if (limit) events = events.slice(-limit);

      // One block lookup per distinct block for timestamps
      const provider = readContract.runner;
      const blockNumbers = [...new Set(events.map((event) => event.blockNumber))];
      const blocks = await Promise.all(blockNumbers.map((n) => provider.getBlock(n)));
      const timestamps = Object.fromEntries(blocks.map((block) => [block.number, block.timestamp * 1000]));

      return events.map((event) => ({ ...event, timestamp: timestamps[event.blockNumber] }));
    },
    [readContract]
  );

  // Wraps a write: requires a wallet, waits for the receipt, refreshes lands,
  // and rethrows a readable error so pages can show it.
  const sendTransaction = async (send) => {
    if (!contract) throw new Error("Connect your wallet first.");
    setLoading(true);
    try {
      const tx = await send(contract);
      const receipt = await tx.wait();
      await fetchLands();
      return receipt;
    } catch (err) {
      console.error("Transaction error:", err);
      throw new Error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Function to register a new land record; documentCid is the deed's IPFS CID
  const registerLand = (ownerName, surveyNo, areaValue, documentCid) =>
    sendTransaction((c) => c.registerLand(ownerName, surveyNo, areaValue, documentCid));

  // Function to verify a land record (registrars only)
  const verifyLand = (landId) => sendTransaction((c) => c.verifyLand(landId));

  // Function to transfer ownership (current owner wallet, or a registrar).
  // documentCid is the transfer deed's IPFS CID and becomes the land's current document.
  const transferOwnership = (landId, newOwner, newOwnerWallet, documentCid) =>
    sendTransaction((c) => c.transferOwnership(landId, newOwner, newOwnerWallet, documentCid));

  // Load the registry on start
  useEffect(() => {
    fetchLands();
  }, [fetchLands]);

  // Check whether the connected wallet is a registrar
  useEffect(() => {
    if (!account) {
      setIsRegistrar(false);
      return;
    }
    readContract.isRegistrar(account).then(setIsRegistrar).catch(() => setIsRegistrar(false));
  }, [account, readContract]);

  // Keep state in sync when the user switches account or network in MetaMask
  useEffect(() => {
    if (!window.ethereum?.on) return;
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setContract(null);
      } else {
        connectWallet();
      }
    };
    const handleChainChanged = () => window.location.reload();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  return (
    <BlockchainContext.Provider
      value={{
        account,
        contract,
        isRegistrar,
        lands,
        landCount,
        loading,
        landsLoading,
        error,
        connectWallet,
        fetchLands,
        fetchHistory,
        registerLand,
        verifyLand,
        transferOwnership,
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
};

// Custom hook for using the blockchain context
export const useBlockchain = () => useContext(BlockchainContext);
