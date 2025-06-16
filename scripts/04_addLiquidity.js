import pkg from 'hardhat';
const { ethers } = pkg;
import { Contract } from 'ethers';
import { Token } from '@uniswap/sdk-core';
import { Pool, Position, nearestUsableTick } from '@uniswap/v3-sdk';
import AbyatknArtifact from "../artifacts/contracts/ABYATKN.sol/ABYATKN.json" assert { type: "json" };
import UsdcArtifact from "../artifacts/contracts/UsdCoin.sol/UsdCoin.json" assert { type: "json" };
import UniswapV3PoolArtifact from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json" assert { type: "json" };
import NonfungiblePositionManagerArtifact from "@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json" assert { type: "json" };

// Pool addresses
const ABYATKN_USDC_500 = '0x1FA8DDa81477A5b6FA1b2e149e93ed9C7928992F'

// Token addresses
const ABYATKN_ADDRESS = '0x0165878A594ca255338adfa4d48449f69242Eb8F'
const USDC_ADDRESS = '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853'
const WRAPPED_BITCOIN_ADDRESS = '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6'


// Uniswap contract addresses
const WETH_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
const FACTORY_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
const SWAP_ROUTER_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
const NFT_DESCRIPTOR_ADDRESS = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
const POSITION_DESCRIPTOR_ADDRESS = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
const POSITION_MANAGER_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'

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
    liquidity: liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  };
}

async function main() {
  const [owner, signer2] = await ethers.getSigners();
  const provider = ethers.provider;

  const abyatknContract = new Contract(ABYATKN_ADDRESS, AbyatknArtifact.abi, provider);
  const usdcContract = new Contract(USDC_ADDRESS, UsdcArtifact.abi, provider);

  await abyatknContract.connect(signer2).approve(POSITION_MANAGER_ADDRESS, ethers.utils.parseEther('1000'));
  await usdcContract.connect(signer2).approve(POSITION_MANAGER_ADDRESS, ethers.utils.parseEther('1000'));

  const poolContract = new Contract(ABYATKN_USDC_500, UniswapV3PoolArtifact.abi, provider);

  const poolData = await getPoolData(poolContract);

  const AbyaToken = new Token(31337, ABYATKN_ADDRESS, 18, 'ABYATKN', 'ABYATKN');
  const UsdcToken = new Token(31337, USDC_ADDRESS, 18, 'USDC', 'UsdCoin');

  const pool = new Pool(
    AbyaToken,
    UsdcToken,
    poolData.fee,
    poolData.sqrtPriceX96.toString(),
    poolData.liquidity.toString(),
    poolData.tick
  );

  const position = new Position({
    pool: pool,
    liquidity: ethers.utils.parseEther('1'),
    tickLower: nearestUsableTick(poolData.tick, poolData.tickSpacing) - poolData.tickSpacing * 2,
    tickUpper: nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 2,
  });

  const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts;

  const params = {
    token0: ABYATKN_ADDRESS,
    token1: USDC_ADDRESS,
    fee: poolData.fee,
    tickLower: nearestUsableTick(poolData.tick, poolData.tickSpacing) - poolData.tickSpacing * 2,
    tickUpper: nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 2,
    amount0Desired: amount0Desired.toString(),
    amount1Desired: amount1Desired.toString(),
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer2.address,
    deadline: Math.floor(Date.now() / 1000) + (60 * 10),
  };

  const nonfungiblePositionManager = new Contract(
    POSITION_MANAGER_ADDRESS,
    NonfungiblePositionManagerArtifact.abi,
    provider
  );

  const tx = await nonfungiblePositionManager.connect(signer2).mint(params, { gasLimit: '1000000' });
  const receipt = await tx.wait();
  console.log("Liquidity added:", receipt);
}

/*
npx hardhat run --network localhost scripts/04_addLiquidity.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });