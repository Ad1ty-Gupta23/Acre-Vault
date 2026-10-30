require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.18",
  networks: {
    holesky: {
      url: process.env.HOLESKY_RPC_URL || "https://ethereum-holesky-rpc.publicnode.com",
      // Empty when PRIVATE_KEY is unset so local compile/test works without a .env
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 17000,
    }
  },
};
