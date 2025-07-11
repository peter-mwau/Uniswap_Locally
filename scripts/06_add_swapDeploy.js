import pkg from 'hardhat';
const { ethers } = pkg;
import 'dotenv/config';

// Pool addresses
const ABYATKN_USDC_500 = process.env.APP_ABYATKN_USDC_500;

// Token addresses
const ABYATKN_ADDRESS = process.env.APP_ABYATKN_ADDRESS;
const USDC_ADDRESS = process.env.APP_USDC_ADDRESS;
const WRAPPED_BITCOIN_ADDRESS = process.env.APP_WRAPPED_BITCOIN_ADDRESS;

console.log('ABYATKN_USDC_500=', `'${ABYATKN_USDC_500}'`);
console.log('ABYATKN_ADDRESS=', `'${ABYATKN_ADDRESS}'`);
console.log('USDC_ADDRESS=', `'${USDC_ADDRESS}'`);

// Uniswap contract addresses
const SWAP_ROUTER_ADDRESS = process.env.APP_SWAP_ROUTER_ADDRESS;
const POSITION_MANAGER_ADDRESS = process.env.APP_POSITION_MANAGER_ADDRESS;

console.log('SWAP_ROUTER_ADDRESS=', `'${SWAP_ROUTER_ADDRESS}'`);
console.log('POSITION_MANAGER_ADDRESS=', `'${POSITION_MANAGER_ADDRESS}'`);


async function main() {
    const [owner, addr1] = await ethers.getSigners();

    if (!SWAP_ROUTER_ADDRESS || !POSITION_MANAGER_ADDRESS || !ABYATKN_ADDRESS || !USDC_ADDRESS) {
        throw new Error("Missing environment variables!");
    }


    const SwapDeploy = await ethers.getContractFactory("Add_Swap_Contract", owner);

    const SwapDeployed = await SwapDeploy.deploy(SWAP_ROUTER_ADDRESS, POSITION_MANAGER_ADDRESS, ABYATKN_USDC_500);

    await SwapDeployed.deployed();

    console.log("Swap contract deployed to:", SwapDeployed.address);
}

/*
npx hardhat run --network localhost scripts/06_add_swapDeploy.js
*/

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });