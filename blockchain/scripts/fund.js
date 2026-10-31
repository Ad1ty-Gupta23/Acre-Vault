const hre = require("hardhat");

// Sends ETH from the deployer to a user's wallet on the PoA network so they can pay gas.
// Usage: FUND_ADDRESS=0x... [AMOUNT=10] npx hardhat run scripts/fund.js --network poa
async function main() {
  const to = process.env.FUND_ADDRESS;
  const amount = process.env.AMOUNT || "10";
  if (!to || !hre.ethers.isAddress(to)) throw new Error("Set FUND_ADDRESS to a wallet address");

  const [deployer] = await hre.ethers.getSigners();
  const tx = await deployer.sendTransaction({ to, value: hre.ethers.parseEther(amount) });
  await tx.wait();
  const balance = await hre.ethers.provider.getBalance(to);
  console.log(`Sent ${amount} ETH to ${to} (balance now ${hre.ethers.formatEther(balance)} ETH)`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
