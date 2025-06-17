import pkg from 'hardhat';
const { ethers } = pkg;
import 'dotenv/config';

// Pool addresses
const ABYATKN_USDC_500 = process.env.APP_ABYATKN_USDC_500;

// Token addresses
const ABYATKN_ADDRESS = process.env.APP_ABYATKN_ADDRESS;
const USDC_ADDRESS = process.env.APP_USDC_ADDRESS;
const WRAPPED_BITCOIN_ADDRESS = process.env.APP_WRAPPED_BITCOIN_ADDRESS;


// Uniswap contract addresses
const SWAP_ROUTER_ADDRESS = process.env.SWAP_ROUTER_ADDRESS;
const POSITION_MANAGER_ADDRESS = process.env.POSITION_MANAGER_ADDRESS;

async function main() {
    const [owner, addr1] = await ethers.getSigners();

    const SwapDeploy = await ethers.getContractFactory("Add_Swap_Contract", owner);

    const SwapDeployed = await SwapDeploy.deploy(SWAP_ROUTER_ADDRESS, POSITION_MANAGER_ADDRESS, ABYATKN_ADDRESS, USDC_ADDRESS);

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