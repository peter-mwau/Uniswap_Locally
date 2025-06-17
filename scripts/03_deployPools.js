import 'dotenv/config';
import pkg from 'hardhat';
const { ethers } = pkg;
import { Contract, BigNumber } from 'ethers';
import bn from 'bignumber.js';
import UniswapV3FactoryArtifact from "@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json" assert { type: "json" };
import NonfungiblePositionManagerArtifact from "@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json" assert { type: "json" };

// Token addresses
const ABYATKN_ADDRESS = process.env.APP_ABYATKN_ADDRESS;
const USDC_ADDRESS = process.env.APP_USDC_ADDRESS;
const WRAPPED_BITCOIN_ADDRESS = process.env.APP_WRAPPED_BITCOIN_ADDRESS;

console.log('ABYATKN_ADDRESS=', `'${ABYATKN_ADDRESS}'`);
console.log('USDC_ADDRESS=', `'${USDC_ADDRESS}'`);


// Uniswap contract addresses
const WETH_ADDRESS = process.env.APP_WETH_ADDRESS;
const FACTORY_ADDRESS = process.env.APP_FACTORY_ADDRESS;
const SWAP_ROUTER_ADDRESS = process.env.APP_SWAP_ROUTER_ADDRESS;
const NFT_DESCRIPTOR_ADDRESS = process.env.APP_NFT_DESCRIPTOR_ADDRESS;
const POSITION_DESCRIPTOR_ADDRESS = process.env.APP_POSITION_DESCRIPTOR_ADDRESS;
const POSITION_MANAGER_ADDRESS = process.env.APP_POSITION_MANAGER_ADDRESS;

console.log('FACTORY_ADDRESS=', `'${FACTORY_ADDRESS}'`);
console.log('POSITION_MANAGER_ADDRESS=', `'${POSITION_MANAGER_ADDRESS}'`);


bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

function encodePriceSqrt(reserve1, reserve0) {
  console.log("Encoding price with reserves:", reserve1, reserve0);
  return BigNumber.from(
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toString()
  );
}

const provider = ethers.provider;

const nonfungiblePositionManager = new Contract(
  POSITION_MANAGER_ADDRESS,
  NonfungiblePositionManagerArtifact.abi,
  provider
);

const factory = new Contract(
  FACTORY_ADDRESS,
  UniswapV3FactoryArtifact.abi,
  provider
);

async function deployPool(tokenA, tokenB, fee, price) {
  const [owner] = await ethers.getSigners();
  const [token0, token1] = BigNumber.from(tokenA).lt(tokenB)
    ? [tokenA, tokenB]
    : [tokenB, tokenA];

  console.log("Deploying pool:");
  console.log({ token0, token1, fee, price: price.toString() });

  const existingPool = await factory.getPool(token0, token1, fee);
  if (existingPool !== ethers.constants.AddressZero) {
    console.log("Pool already exists:", existingPool);
    return existingPool;
  }

  try {
    const tx = await nonfungiblePositionManager.connect(owner).createAndInitializePoolIfNecessary(
      token0,
      token1,
      fee,
      price,
      { gasLimit: 8_000_000 }
    );
    const receipt = await tx.wait();
    console.log("Pool created. Gas used:", receipt.gasUsed.toString());
  } catch (err) {
    console.error("Pool creation failed:", err);
  }

  const poolAddress = await factory.getPool(token0, token1, fee);
  return poolAddress;
}


async function main() {
  const abyatknUsdc500 = await deployPool(ABYATKN_ADDRESS, USDC_ADDRESS, 500, encodePriceSqrt(1000000000, 1000000));
  console.log('ABYATKN_USDC_500=', `'${abyatknUsdc500}'`);
}

/*
npx hardhat run --network localhost scripts/03_deployPools.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });