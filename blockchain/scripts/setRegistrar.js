const hre = require("hardhat");

// Usage: CONTRACT_ADDRESS=0x... REGISTRAR=0x... [ALLOWED=false] npx hardhat run scripts/setRegistrar.js --network holesky
async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const registrar = process.env.REGISTRAR;
  const allowed = process.env.ALLOWED !== "false";
  if (!contractAddress || !registrar) throw new Error("Set CONTRACT_ADDRESS and REGISTRAR");

  const landRegistry = await hre.ethers.getContractAt("LandRegistry", contractAddress);
  console.log(`${allowed ? "Granting" : "Revoking"} registrar role for ${registrar}...`);
  const tx = await landRegistry.setRegistrar(registrar, allowed);
  await tx.wait();
  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
