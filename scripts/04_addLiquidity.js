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
const ABYATKN_USDC_500 = '0x19bd284707b43D1512Ebb9ef871AD5d9759d4f01';

// Token addresses
const ABYATKN_ADDRESS = '0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8';
const USDC_ADDRESS = '0x851356ae760d987E095750cCeb3bC6014560891C';
const WRAPPED_BITCOIN_ADDRESS = '0xf5059a5D33d5853360D16C683c16e67980206f36';

// Uniswap contract addresses
const WETH_ADDRESS = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";
const FACTORY_ADDRESS = "0x59b670e9fA9D0A427751Af201D676719a970857b";
const SWAP_ROUTER_ADDRESS = "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1";
const NFT_DESCRIPTOR_ADDRESS = "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44";
const POSITION_DESCRIPTOR_ADDRESS = "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f";
const POSITION_MANAGER_ADDRESS = "0x4A679253410272dd5232B3Ff7cF5dbB88f295319";

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