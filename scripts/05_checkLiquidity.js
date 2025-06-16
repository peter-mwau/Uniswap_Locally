import pkg from 'hardhat';
const { ethers } = pkg;
import { Contract } from 'ethers';
import UniswapV3PoolArtifact from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json" assert { type: "json" };

// Pool address
const ABYATKN_USDC_500 = '0x1FA8DDa81477A5b6FA1b2e149e93ed9C7928992F'

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

  const token0Address = await poolContract.token0();
  const token1Address = await poolContract.token1();

  const token0 = new Contract(token0Address, ["function balanceOf(address owner) view returns (uint256)"], provider);
  const token1 = new Contract(token1Address, ["function balanceOf(address owner) view returns (uint256)"], provider);

  const token0Balance = await token0.balanceOf(ABYATKN_USDC_500);
  const token1Balance = await token1.balanceOf(ABYATKN_USDC_500);

  console.log("Token0(ABYTKN) (", token0Address, ") balance:", token0Balance.toString());
  console.log("Token1(USDC) (", token1Address, ") balance:", token1Balance.toString());

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