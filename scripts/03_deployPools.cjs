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

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

const { Contract, BigNumber } = require("ethers")
const bn = require('bignumber.js')
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 })

const provider = waffle.provider;

function encodePriceSqrt(reserve1, reserve0) {
  return BigNumber.from(
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toString()
  )
}

const nonfungiblePositionManager = new Contract(
  POSITION_MANAGER_ADDRESS,
  artifacts.NonfungiblePositionManager.abi,
  provider
)
const factory = new Contract(
  FACTORY_ADDRESS,
  artifacts.UniswapV3Factory.abi,
  provider
)

async function deployPool(token0, token1, fee, price) {
  const [owner] = await ethers.getSigners();
  await nonfungiblePositionManager.connect(owner).createAndInitializePoolIfNecessary(
    token0,
    token1,
    fee,
    price,
    { gasLimit: 5000000 }
  )
  const poolAddress = await factory.connect(owner).getPool(
    token0,
    token1,
    fee,
  )
  return poolAddress
}


async function main() {
  const abyatknUsdc500 = await deployPool(ABYATKN_ADDRESS, USDC_ADDRESS, 500, encodePriceSqrt(1, 1))
  console.log('ABYATKN_USDC_500=', `'${abyatknUsdc500}'`)
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