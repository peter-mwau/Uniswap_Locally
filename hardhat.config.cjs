require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.24", // For your contracts
        settings: {
          optimizer: {
            enabled: true,
            runs: 5000,
            details: { yul: false },
          },
        },
      },
      {
        version: "0.7.6", // For Uniswap and OpenZeppelin dependencies
        settings: {
          optimizer: {
            enabled: true,
            runs: 500,
          },
        },
      },
    ],
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    hardhat: {},
  },
};