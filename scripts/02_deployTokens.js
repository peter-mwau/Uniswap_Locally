import pkg from 'hardhat';
const { ethers } = pkg;


async function main() {
  const [owner, signer2] = await ethers.getSigners();

  // console.log("Owner address:", owner.address);
  // console.log("Signer2 address:", signer2.address);

  const ABYATKN = await ethers.getContractFactory('ABYATKN', owner);
  const abyatkn = await ABYATKN.deploy();

  const Usdc = await ethers.getContractFactory('UsdCoin', owner);
  const usdc = await Usdc.deploy();

  const WrappedBitcoin = await ethers.getContractFactory('WrappedBitcoin', owner);
  const wrappedBitcoin = await WrappedBitcoin.deploy();

  await abyatkn.connect(owner).mint(
    signer2.address,
    ethers.utils.parseEther('1000000000') //1 Billion ABYTKNS
  )
  await usdc.connect(owner).mint(
    signer2.address,
    ethers.utils.parseEther('1000000')  //1 Million USDC
  )
  await wrappedBitcoin.connect(owner).mint(
    signer2.address,
    ethers.utils.parseEther('100000')
  )

  console.log('ABYATKN_ADDRESS=', `'${abyatkn.address}'`)
  console.log('USDC_ADDRESS=', `'${usdc.address}'`)
  console.log('WRAPPED_BITCOIN_ADDRESS=', `'${wrappedBitcoin.address}'`)
}

/*
npx hardhat run --network localhost scripts/02_deployTokens.js
*/


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });