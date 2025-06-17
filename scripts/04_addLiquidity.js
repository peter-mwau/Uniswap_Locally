import pkg from 'hardhat';
const { ethers } = pkg;
import { Contract } from 'ethers';
import { Token } from '@uniswap/sdk-core';
import { Pool, Position, nearestUsableTick } from '@uniswap/v3-sdk';
import AbyatknArtifact from "../artifacts/contracts/ABYATKN.sol/ABYATKN.json" assert { type: "json" };
import UsdcArtifact from "../artifacts/contracts/UsdCoin.sol/UsdCoin.json" assert { type: "json" };
import UniswapV3PoolArtifact from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json" assert { type: "json" };
import NonfungiblePositionManagerArtifact from "@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json" assert { type: "json" };
import 'dotenv/config';

// Pool addresses
const ABYATKN_USDC_500 = process.env.APP_ABYATKN_USDC_500;

// Token addresses
const ABYATKN_ADDRESS = process.env.APP_ABYATKN_ADDRESS;
const USDC_ADDRESS = process.env.APP_USDC_ADDRESS;
const WRAPPED_BITCOIN_ADDRESS = process.env.APP_WRAPPED_BITCOIN_ADDRESS;

console.log("Pool Address:", ABYATKN_USDC_500);


// Uniswap contract addresses
const WETH_ADDRESS = process.env.APP_WETH_ADDRESS;
const FACTORY_ADDRESS = process.env.APP_FACTORY_ADDRESS;
const SWAP_ROUTER_ADDRESS = process.env.APP_SWAP_ROUTER_ADDRESS;
const NFT_DESCRIPTOR_ADDRESS = process.env.APP_NFT_DESCRIPTOR_ADDRESS;
const POSITION_DESCRIPTOR_ADDRESS = process.env.APP_POSITION_DESCRIPTOR_ADDRESS;
const POSITION_MANAGER_ADDRESS = process.env.APP_POSITION_MANAGER_ADDRESS;

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

  const MAX_UINT = ethers.constants.MaxUint256;
  await abyatknContract.connect(signer2).approve(POSITION_MANAGER_ADDRESS, MAX_UINT);
  await usdcContract.connect(signer2).approve(POSITION_MANAGER_ADDRESS, MAX_UINT);

  const abyatknAllowance = await abyatknContract.allowance(signer2.address, POSITION_MANAGER_ADDRESS);
  const usdcAllowance = await usdcContract.allowance(signer2.address, POSITION_MANAGER_ADDRESS);

  console.log("ABYATKN Allowance:", ethers.utils.formatEther(abyatknAllowance));
  console.log("USDC Allowance:", ethers.utils.formatEther(usdcAllowance));

  const balanceA = await abyatknContract.balanceOf(signer2.address);
  const balanceB = await usdcContract.balanceOf(signer2.address);
  console.log("Balance ABYATKN:", ethers.utils.formatEther(balanceA));
  console.log("Balance USDC:", ethers.utils.formatEther(balanceB));


  const poolContract = new Contract(ABYATKN_USDC_500, UniswapV3PoolArtifact.abi, provider);

  const poolData = await getPoolData(poolContract);

  console.log("Tick Lower:", nearestUsableTick(poolData.tick, poolData.tickSpacing) - poolData.tickSpacing * 2);
  console.log("Tick Upper:", nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 2);

  const UsdcToken = new Token(31337, USDC_ADDRESS, 18, 'USDC', 'UsdCoin');
  const AbyaToken = new Token(31337, ABYATKN_ADDRESS, 18, 'ABYATKN', 'ABYATKN');

  const [tokenA, tokenB] = USDC_ADDRESS.toLowerCase() < ABYATKN_ADDRESS.toLowerCase()
    ? [UsdcToken, AbyaToken]
    : [AbyaToken, UsdcToken];

  const pool = new Pool(
    tokenA,
    tokenB,
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

  console.log("Amount0 Desired:", amount0Desired.toString());
  console.log("Amount1 Desired:", amount1Desired.toString());


  const params = {
    token0: tokenA.address,
    token1: tokenB.address,
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

  try {
    const tx = await nonfungiblePositionManager.connect(signer2).mint(params, { gasLimit: '8000000' });
    const receipt = await tx.wait();
    console.log("Liquidity added:", receipt);
  } catch (error) {
    console.error("Error adding liquidity:", error);
  }
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