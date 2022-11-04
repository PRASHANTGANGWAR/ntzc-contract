require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-network-helpers");
require("hardhat-tracer");
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config({ path: __dirname + '/.env' })

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 800,
          },
        },
      },
    ],
  },
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  networks: {
    hardhat: {
      forking: {
        // ** ETH **
        url: process.env.ETH_FORK_URL,
        // ** BSC **
        // url: process.env.BSC_FORK_URL,
        // ** POL **
        // url: process.env.POL_FORK_URL,
        // ** BSC TESTNET **
        // url: "https://data-seed-prebsc-1-s3.binance.org:8545/",
      }
    },
    mumbai: {
      url: "https://polygon-mumbai.g.alchemy.com/v2/X_rE2rXvvnQsiy0of3GMn11QS7r9sPla",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 80001,
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s3.binance.org:8545/",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 97,
    }
  },
  mocha: {
    timeout: 100000000,
  }
};
