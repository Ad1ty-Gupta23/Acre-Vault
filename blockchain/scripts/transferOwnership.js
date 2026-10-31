const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error("Set CONTRACT_ADDRESS to the deployed LandRegistry address");
  
  // Get the contract instance
  const landRegistry = await hre.ethers.getContractAt("LandRegistry", contractAddress);

  // Specify the land record ID you want to transfer and the new owner's name
  const landId = 1; // Change to the appropriate ID if needed
  const newOwner = "Charlie"; // New owner name
  const newOwnerWallet = process.env.NEW_OWNER_WALLET; // New owner's wallet address
  if (!newOwnerWallet) throw new Error("Set NEW_OWNER_WALLET to the new owner's address");
  const documentCid = process.env.DOCUMENT_CID; // IPFS CID of the transfer deed
  if (!documentCid) throw new Error("Set DOCUMENT_CID to the transfer deed's IPFS CID");

  console.log(`Transferring ownership of land record ID ${landId} to ${newOwner}...`);

  // Call the transferOwnership function
  const tx = await landRegistry.transferOwnership(landId, newOwner, newOwnerWallet, documentCid);
  await tx.wait();

  console.log("Ownership transferred successfully!");

  // Optionally, fetch the updated land record to verify the change
  const updatedLand = await landRegistry.lands(landId);
  console.log("Updated Land Record:");
  console.log(`Land ID: ${updatedLand.id.toString()}`);
  console.log(`Owner: ${updatedLand.owner}`);
  console.log(`Survey No: ${updatedLand.surveyNo}`);
  console.log(`Area: ${updatedLand.area.toString()}`);
  console.log(`Verified: ${updatedLand.isVerified}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in script:", error);
    process.exit(1);
  });
