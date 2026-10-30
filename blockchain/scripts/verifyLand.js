const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error("Set CONTRACT_ADDRESS to the deployed LandRegistry address");

  // Get the contract instance
  const landRegistry = await hre.ethers.getContractAt("LandRegistry", contractAddress);

  // Specify the land record ID to verify
  const landId = 1; // Change as needed

  console.log(`Verifying land with ID ${landId}...`);
  
  // Call the verifyLand function
  const tx = await landRegistry.verifyLand(landId);
  await tx.wait();
  console.log("Land verified successfully!");

  // Optionally, fetch the updated land record to confirm the verification
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
