# Uniswap_Locally

A simple local Uniswap deployment for testing and experimenting with liquidity provision.

## 📌 Project Overview

This project sets up a local Uniswap environment using Hardhat, enabling developers to:

- Deploy Uniswap core contracts locally
- Provide liquidity
- Simulate token swaps
- Run custom test cases for protocol behavior

It is ideal for learning, debugging, or extending Uniswap functionalities without depending on live networks.

## 🔧 Features

- Local Uniswap deployment using Hardhat
- Custom ERC20 token contracts for testing
- Liquidity provision and swap testing
- Ability to modify and extend Uniswap smart contracts
- Option to interact via scripts or a simple UI (planned)

## 📁 Directory Structure

uniswap_locally/
├── contracts/ # Smart contracts (e.g., ERC20, Uniswap)
├── scripts/ # Deployment and interaction scripts
├── test/ # Test cases for liquidity and swap logic
├── hardhat.config.js # Hardhat configuration
└── README.md # Project documentation


## 🚀 Getting Started

### Prerequisites

- Node.js and npm installed
- Hardhat installed globally or locally in the project

### Installation

1. Clone the repository:

```bash
git clone https://github.com/peter-mwau/Uniswap_Locally.git
cd Uniswap_Locally
```

2. Install dependencies:
```bash
npm install
```

3. Compile the contracts:
```bash
npx hardhat compile
```

4. Start a local node:
```bash
npx hardhat node
```

5. Deploy contracts locally:
```bash
npx hardhat run scripts/${deploy_script}.js --network localhost
```

🧪 Testing
Run your tests:
```bash
npx hardhat test
```

- You can write custom test cases in the test/ directory to simulate liquidity provision, swaps, and edge cases.

🎯 Future Enhancements
Add a simple frontend UI to interact with deployed contracts (styled using Tailwind CSS)

Integrate IPFS (e.g., via Pinata) for decentralized metadata storage

Extend token logic for mint/burn scenarios

Deploy to public testnets like Sepolia

🤝 Contributions
Feel free to fork, improve, or contribute to the project. Issues and pull requests are welcome!

📄 License
This project is open-source and available under the MIT License.
```bash

---

Let me know if you'd like to include sample token addresses, screenshots, or specific Uniswap versions (v2/v3) in the README.
```