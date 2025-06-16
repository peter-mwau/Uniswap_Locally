import pkg from 'hardhat';
const { ethers } = pkg;

// Pool addresses
const ABYATKN_USDC_500 = '0x19bd284707b43D1512Ebb9ef871AD5d9759d4f01';

// Token addresses
const ABYATKN_ADDRESS = '0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf'
const USDC_ADDRESS = '0x0E801D84Fa97b50751Dbf25036d067dCf18858bF'
const WRAPPED_BITCOIN_ADDRESS = '0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf'


// Uniswap contract addresses
const SWAP_ROUTER_ADDRESS = "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1";
const POSITION_MANAGER_ADDRESS = "0x4A679253410272dd5232B3Ff7cF5dbB88f295319";

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