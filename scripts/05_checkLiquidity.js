import pkg from 'hardhat';
const { ethers } = pkg;
import { Contract } from 'ethers';
import UniswapV3PoolArtifact from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json" assert { type: "json" };

// Pool address
const ABYATKN_USDC_500 = '0x19bd284707b43D1512Ebb9ef871AD5d9759d4f01';

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
  const provider = ethers.provider;
  const poolContract = new Contract(ABYATKN_USDC_500, UniswapV3PoolArtifact.abi, provider);
  const poolData = await getPoolData(poolContract);
  console.log('poolData', poolData);
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