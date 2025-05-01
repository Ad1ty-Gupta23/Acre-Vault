const hre = require("hardhat");

async function main() {
  // Replace with your deployed contract address
  const contractAddress = "0x66C5655A7A3a86BB514ECa467502FF5517692191";
  const landRegistry = await hre.ethers.getContractAt("LandRegistry", contractAddress);

  // 1. Register a new land record
  console.log("Registering Land...");
  let tx = await landRegistry.registerLand("Bob", "S9234", 1500);
  await tx.wait();
  console.log("Land registered successfully!");

  // 2. Fetch total number of land records
  const landCount = await landRegistry.landCount();
  console.log("Total lands registered:", landCount.toString());

  // Convert landCount to a number using Number() instead of .toNumber()
  const count = Number(landCount);
  for (let i = 1; i <= count; i++) {
    const land = await landRegistry.lands(i);
    console.log(`\nLand ID: ${land.id.toString()}`);
    console.log(`Owner: ${land.owner}`);
    console.log(`Survey No: ${land.surveyNo}`);
    console.log(`Area: ${land.area.toString()}`);
    console.log(`Verified: ${land.isVerified}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in script:", error);
    process.exit(1);
  });
