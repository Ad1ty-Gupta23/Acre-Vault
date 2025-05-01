// src/context/BlockchainContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import LandRegistryAbi from "../lib/LandRegistryAbi.json"; // Ensure the ABI JSON exists here

// Replace with your deployed contract address on Holesky
const CONTRACT_ADDRESS = "0x66C5655A7A3a86BB514ECa467502FF5517692191";

// Create the context
const BlockchainContext = createContext();

// Provider component that will wrap your app
export const BlockchainProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [lands, setLands] = useState([]);
  const [landCount, setLandCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Connect wallet and initialize provider/contract
  const connectWallet = async () => {
    if (!window.ethereum) {
      console.error("MetaMask not found");
      return;
    }
    try {
      // Create a read-only provider using ethers v6
      const _provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      setProvider(_provider);

      // Get the connected account
      const accounts = await _provider.send("eth_accounts", []);
      setAccount(accounts[0]);

      // Create a signer-based contract instance for transactions
      const signer = await _provider.getSigner();
      const _contract = new ethers.Contract(CONTRACT_ADDRESS, LandRegistryAbi, signer);
      setContract(_contract);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  // Function to fetch all land records using a read-only instance
  const fetchLands = async () => {
    if (!provider) return;
    try {
      const readContract = new ethers.Contract(CONTRACT_ADDRESS, LandRegistryAbi, provider);
      const count = await readContract.landCount();
      const countNumber = Number(count);
      setLandCount(countNumber);

      const landsArray = [];
      for (let i = 1; i <= countNumber; i++) {
        const land = await readContract.lands(i);
        landsArray.push({
          id: land.id.toString(),
          owner: land.owner,
          surveyNo: land.surveyNo,
          area: land.area.toString(),
          isVerified: land.isVerified,
        });
      }
      setLands(landsArray);
    } catch (error) {
      console.error("Error fetching lands:", error);
    }
  };

  // Function to register a new land record
  const registerLand = async (ownerName, surveyNo, areaValue) => {
    if (!contract) return;
    try {
      setLoading(true);
      const tx = await contract.registerLand(ownerName, surveyNo, areaValue);
      await tx.wait();
      setLoading(false);
      // Update land records after registration
      await fetchLands();
    } catch (error) {
      console.error("Error registering land:", error);
      setLoading(false);
    }
  };

  // Function to verify a land record
  const verifyLand = async (landId) => {
    if (!contract) return;
    try {
      setLoading(true);
      const tx = await contract.verifyLand(landId);
      await tx.wait();
      setLoading(false);
      // Update lands after verification
      await fetchLands();
    } catch (error) {
      console.error("Error verifying land:", error);
      setLoading(false);
    }
  };


// Function to transfer ownership   
const transferOwnership = async (landId, newOwner) => {     
  if (!contract) return;     
  try {       
    setLoading(true);       
    const tx = await contract.transferOwnership(landId, newOwner);       
    await tx.wait();       
    setLoading(false);       
    // Update lands after transferring ownership       
    await fetchLands();     
  } catch (error) {       
    console.error("Error transferring ownership:", error);       
    setLoading(false);
    throw error; // This will allow your component to catch and handle the error
  }   
};

  // Fetch lands automatically when provider is set
  useEffect(() => {
    if (provider) {
      fetchLands();
    }
  }, [provider]);

  return (
    <BlockchainContext.Provider
      value={{
        account,
        provider,
        contract,
        lands,
        landCount,
        loading,
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
