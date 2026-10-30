// src/context/BlockchainContext.js
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import LandRegistryAbi from "../lib/LandRegistryAbi.json"; // Ensure the ABI JSON exists here
import { CONTRACT_ADDRESS, CHAIN_ID, RPC_URL } from "../config";

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
      setError("MetaMask not found. Install it to sign transactions.");
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
          const [land, ownerWallet] = await Promise.all([
            readContract.lands(i),
            // Contracts deployed before owner wallets were tracked don't have this getter
            readContract.landOwnerWallet(i).catch(() => null),
          ]);
          return {
            id: land.id.toString(),
            owner: land.owner,
            surveyNo: land.surveyNo,
            area: land.area.toString(),
            isVerified: land.isVerified,
            ownerWallet,
          };
        })
      );
      setLands(landsArray);
    } catch (err) {
      console.error("Error fetching lands:", err);
      setError("Could not load land records from the blockchain.");
    } finally {
      setLandsLoading(false);
    }
  }, [readContract]);

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

  // Function to register a new land record
  const registerLand = (ownerName, surveyNo, areaValue) =>
    sendTransaction((c) => c.registerLand(ownerName, surveyNo, areaValue));

  // Function to verify a land record (registrars only)
  const verifyLand = (landId) => sendTransaction((c) => c.verifyLand(landId));

  // Function to transfer ownership (current owner wallet, or a registrar)
  const transferOwnership = (landId, newOwner, newOwnerWallet) =>
    sendTransaction((c) => c.transferOwnership(landId, newOwner, newOwnerWallet));

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
