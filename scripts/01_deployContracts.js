import pkg from 'hardhat';
const { ethers } = pkg;
import fs from "fs";
import path from "path";


// Alternative approach: Load artifacts directly from filesystem
const loadArtifact = (artifactPath) => {
  try {
    const fullPath = path.resolve(artifactPath);
    const artifactData = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(artifactData);
  } catch (error) {
    console.error(`Failed to load artifact from ${artifactPath}:`, error.message);
    throw error;
  }
};

// Load artifacts - adjust paths according to your project structure
const artifacts = {
  WETH9: loadArtifact("../Uniswap_Locally/WETH9.json"),
  UniswapV3Factory: loadArtifact("./node_modules/@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  SwapRouter: loadArtifact("./node_modules/@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json"),
  NFTDescriptor: loadArtifact("./node_modules/@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json"),
  NonfungibleTokenPositionDescriptor: loadArtifact("./node_modules/@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json"),
  NonfungiblePositionManager: loadArtifact("./node_modules/@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

const linkLibraries = ({ bytecode, linkReferences }, libraries) => {
  Object.keys(linkReferences).forEach((fileName) => {
    Object.keys(linkReferences[fileName]).forEach((contractName) => {
      if (!libraries.hasOwnProperty(contractName)) {
        throw new Error(`Missing link library name ${contractName}`);
      }
      const address = ethers.utils.getAddress(libraries[contractName]).toLowerCase().slice(2);
      linkReferences[fileName][contractName].forEach(({ start, length }) => {
        const start2 = 2 + start * 2;
        const length2 = length * 2;
        bytecode = bytecode
          .slice(0, start2)
          .concat(address)
          .concat(bytecode.slice(start2 + length2, bytecode.length));
      });
    });
  });
  return bytecode;
};

async function main() {
  console.log("Starting Uniswap V3 deployment...");

  const [owner] = await ethers.getSigners();
  console.log("Deploying with account:", owner.address);
  console.log("Account balance:", ethers.utils.formatEther(await owner.getBalance()));

  // Validate bytecode before deployment
  const validateBytecode = (name, bytecode) => {
    if (!bytecode || bytecode.length < 10) {
      throw new Error(`Invalid bytecode for ${name}: ${bytecode}`);
    }
    console.log(`✓ ${name} bytecode validated (length: ${bytecode.length})`);
  };

  // Deploy WETH9
  console.log("\n1. Deploying WETH9...");
  validateBytecode("WETH9", artifacts.WETH9.bytecode);
  const Weth = await ethers.getContractFactory(artifacts.WETH9.abi, artifacts.WETH9.bytecode);
  const weth = await Weth.deploy();
  await weth.deployed();
  console.log("WETH9 deployed to:", weth.address);

  // Deploy UniswapV3Factory
  console.log("\n2. Deploying UniswapV3Factory...");
  validateBytecode("UniswapV3Factory", artifacts.UniswapV3Factory.bytecode);
  const Factory = await ethers.getContractFactory(artifacts.UniswapV3Factory.abi, artifacts.UniswapV3Factory.bytecode);
  const factory = await Factory.deploy();
  await factory.deployed();
  console.log("UniswapV3Factory deployed to:", factory.address);

  // Deploy SwapRouter
  console.log("\n3. Deploying SwapRouter...");
  validateBytecode("SwapRouter", artifacts.SwapRouter.bytecode);
  const SwapRouterContract = await ethers.getContractFactory(artifacts.SwapRouter.abi, artifacts.SwapRouter.bytecode);
  const swapRouter = await SwapRouterContract.deploy(factory.address, weth.address);
  await swapRouter.deployed();
  console.log("SwapRouter deployed to:", swapRouter.address);

  // Deploy NFTDescriptor
  console.log("\n4. Deploying NFTDescriptor...");
  validateBytecode("NFTDescriptor", artifacts.NFTDescriptor.bytecode);
  const NFTDescriptorContract = await ethers.getContractFactory(artifacts.NFTDescriptor.abi, artifacts.NFTDescriptor.bytecode);
  const nftDescriptor = await NFTDescriptorContract.deploy();
  await nftDescriptor.deployed();
  console.log("NFTDescriptor deployed to:", nftDescriptor.address);

  // Deploy NonfungibleTokenPositionDescriptor with linked libraries
  console.log("\n5. Deploying NonfungibleTokenPositionDescriptor...");
  const linkedBytecode = linkLibraries(
    {
      bytecode: artifacts.NonfungibleTokenPositionDescriptor.bytecode,
      linkReferences: artifacts.NonfungibleTokenPositionDescriptor.linkReferences || {
        "@uniswap/v3-periphery/contracts/libraries/NFTDescriptor.sol": {
          NFTDescriptor: [
            {
              length: 20,
              start: 1261,
            },
          ],
        },
      },
    },
    {
      NFTDescriptor: nftDescriptor.address,
    }
  );

  validateBytecode("NonfungibleTokenPositionDescriptor (linked)", linkedBytecode);
  const NonfungibleTokenPositionDescriptorContract = await ethers.getContractFactory(
    artifacts.NonfungibleTokenPositionDescriptor.abi,
    linkedBytecode
  );
  const nonfungibleTokenPositionDescriptor = await NonfungibleTokenPositionDescriptorContract.deploy(weth.address, ethers.utils.formatBytes32String("ETH"));
  await nonfungibleTokenPositionDescriptor.deployed();
  console.log("NonfungibleTokenPositionDescriptor deployed to:", nonfungibleTokenPositionDescriptor.address);

  // Deploy NonfungiblePositionManager
  console.log("\n6. Deploying NonfungiblePositionManager...");
  validateBytecode("NonfungiblePositionManager", artifacts.NonfungiblePositionManager.bytecode);
  const NonfungiblePositionManagerContract = await ethers.getContractFactory(
    artifacts.NonfungiblePositionManager.abi,
    artifacts.NonfungiblePositionManager.bytecode
  );
  const nonfungiblePositionManager = await NonfungiblePositionManagerContract.deploy(
    factory.address,
    weth.address,
    nonfungibleTokenPositionDescriptor.address
  );
  await nonfungiblePositionManager.deployed();
  console.log("NonfungiblePositionManager deployed to:", nonfungiblePositionManager.address);

  console.log("\n🎉 Deployment Complete!");
  console.log("=====================================");
  console.log("Contract Addresses:");
  console.log("=====================================");
  console.log(`WETH_ADDRESS='${weth.address}'`);
  console.log(`FACTORY_ADDRESS='${factory.address}'`);
  console.log(`SWAP_ROUTER_ADDRESS='${swapRouter.address}'`);
  console.log(`NFT_DESCRIPTOR_ADDRESS='${nftDescriptor.address}'`);
  console.log(`POSITION_DESCRIPTOR_ADDRESS='${nonfungibleTokenPositionDescriptor.address}'`);
  console.log(`POSITION_MANAGER_ADDRESS='${nonfungiblePositionManager.address}'`);

  // Save addresses to a file for later use
  const addresses = {
    WETH_ADDRESS: weth.address,
    FACTORY_ADDRESS: factory.address,
    SWAP_ROUTER_ADDRESS: swapRouter.address,
    NFT_DESCRIPTOR_ADDRESS: nftDescriptor.address,
    POSITION_DESCRIPTOR_ADDRESS: nonfungibleTokenPositionDescriptor.address,
    POSITION_MANAGER_ADDRESS: nonfungiblePositionManager.address,
  };

  fs.writeFileSync('./deployed-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("\n📝 Addresses saved to deployed-addresses.json");
}

/*
npx hardhat run --network localhost scripts/01_deployContracts.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error during deployment:", error);
    process.exit(1);
  });