const hre = require("hardhat");

async function main() {
  // Get Contract Factory
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");

  console.log("Deploying LandRegistry contract...");
  const landRegistry = await LandRegistry.deploy(); // Deploy contract

  await landRegistry.waitForDeployment(); // Correct method in ethers v6+

  console.log(`LandRegistry deployed at: ${await landRegistry.getAddress()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
