const hre = require("hardhat");

async function main() {
  // Replace with your deployed contract address
  const contractAddress = "0x66C5655A7A3a86BB514ECa467502FF5517692191";
  
  // Get the contract instance
  const landRegistry = await hre.ethers.getContractAt("LandRegistry", contractAddress);

  // Specify the land record ID you want to transfer and the new owner's name
  const landId = 1; // Change to the appropriate ID if needed
  const newOwner = "Charlie"; // New owner name

  console.log(`Transferring ownership of land record ID ${landId} to ${newOwner}...`);

  // Call the transferOwnership function
  const tx = await landRegistry.transferOwnership(landId, newOwner);
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
