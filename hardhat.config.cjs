require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const sepoliaUrl =
  process.env.SEPOLIA_RPC_URL ||
  (process.env.INFURA_API_KEY
    ? `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
    : undefined);

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
          viaIR: true,
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
      chainId: 31337,
    },
    hardhat: {},
    skale: {
      url: process.env.APP_RPC_URL,
      accounts: [process.env.APP_PRIVATE_KEY, process.env.APP_SECOND_PRIVATE_KEY],
      chainId: 1020352220,
      allowUnlimitedContractSize: true,
    },
    sepolia: {
      url: sepoliaUrl,
      accounts: process.env.APP_PRIVATE_KEY ? [process.env.APP_PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
    customChains: [
      {
        network: "skale",
        chainId: 1020352220,
        urls: {
          apiURL: process.env.APP_BROCK_EXPLORER,
          browserURL: process.env.APP_RPC_URL,
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  }
};