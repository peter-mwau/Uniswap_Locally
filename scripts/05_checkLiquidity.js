import pkg from 'hardhat';
const { ethers } = pkg;
import { Contract } from 'ethers';
import 'dotenv/config';

import fs from 'fs';
import path from 'path';

const loadArtifact = (artifactPath) => {
  try {
    const fullPath = path.resolve(artifactPath);
    const data = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Failed to load artifact at ${artifactPath}:`, err.message);
    throw err;
  }
};

const UniswapV3PoolArtifact = loadArtifact('./node_modules/@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json');


// Pool address
const ABYATKN_USDC_500 = process.env.APP_ABYATKN_USDC_500;

if (!ABYATKN_USDC_500) {
  throw new Error("Missing pool address: APP_ABYATKN_USDC_500 not set in .env");
}


async function getPoolData(poolContract) {
  const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
    poolContract.tickSpacing(),
    poolContract.fee(),
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  return {
    tickSpacing: tickSpacing,
    fee: fee,
    liquidity: liquidity.toString(),
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  };
}


async function main() {
  try {
    const provider = ethers.provider;

    if (!ABYATKN_USDC_500) {
      throw new Error("Missing pool address: APP_ABYATKN_USDC_500 not set in .env");
    }
    const poolContract = new Contract(ABYATKN_USDC_500, UniswapV3PoolArtifact.abi, provider);

    const poolData = await getPoolData(poolContract);
    console.log('poolData', poolData);

    const token0Address = await poolContract.token0();
    const token1Address = await poolContract.token1();

    const token0 = new Contract(token0Address, ["function balanceOf(address owner) view returns (uint256)"], provider);
    const token1 = new Contract(token1Address, ["function balanceOf(address owner) view returns (uint256)"], provider);

    const token0Balance = await token0.balanceOf(ABYATKN_USDC_500);
    const token1Balance = await token1.balanceOf(ABYATKN_USDC_500);

    console.log("Token0(ABYTKN) (", token0Address, ") balance:", token0Balance.toString());
    console.log("Token1(USDC) (", token1Address, ") balance:", token1Balance.toString());
  } catch (error) {
    console.error("Error fetching pool data:", error);
  }


}

/*
npx hardhat run --network localhost scripts/05_checkLiquidity.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });