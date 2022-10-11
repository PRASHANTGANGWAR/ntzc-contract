require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-tracer");

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
  networks: {
    hardhat: {
      forking: {
        // ** ETH **
        url: "https://eth-mainnet.g.alchemy.com/v2/ykAnFwdjMGr5J4O_ZINye-fbEO_SHFUe",
        // ** BSC **
        // url: "https://powerful-rough-pool.bsc.discover.quiknode.pro/61d092c01e8a3e12dcc314cdcb85aecdc1f09ecb/",
        // ** POL **
        // url: "https://polygon-mainnet.infura.io/v3/a52089cc61bc43a9ab54d46e82e5933e",
        // ** BSC TESTNET **
        // url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      }

    }
  },
  mocha: {
    timeout: 100000000,
  }
};
