const { getImplementationAddress } = require("@openzeppelin/upgrades-core");
const { ethers, upgrades } = require("hardhat");
const { waitBlocks } = require("../utils/blockWaiter");

async function main() {
  const signers = await ethers.getSigners();
  const admin = signers[0];

  const backend = "0xae30fc5f42d7d8c7e8cbe5ad19620e87fb825735";
  const signer = "0xaEB3Aaaf2E2A399383Cd45AF9570B3c1Ed7e7b04"//"0xd31bBAf4c77750c6c79413cFf189315F93DD135e";
  const signer2 = "0x3ddD16e693E7c7251d64d9ad36506cBDf2268D55";

  // Access deployed to: 0x01357a26Aa7624F887a905C44343fab25c4d2df7 => 0xe829db6Ea8fEB1eE3fA6D6dd5C22022CB4e82001
  const Access = await ethers.getContractFactory("Access");
  const access = await upgrades.deployProxy(Access, []);
  await access.deployed();
  await waitBlocks(5);
  const accessImpl = await getImplementationAddress(
    ethers.provider,
    access.address
  );
  console.log(`Access deployed to: ${access.address} => ${accessImpl}`);
  await run("verify:verify", {
    address: accessImpl,
    contract: "contracts/access/Access.sol:Access",
  });
  // AZX deployed to: 0x98247069345999Ff7069024276535CdF2050135d => 0x3acbdf1F0751D466756961cd5d525881f7880b28
  const AZX = await ethers.getContractFactory("NTZCToken");
  const azx = await upgrades.deployProxy(AZX, [
    admin.address,
    "0x4f1AF681d21affec44Bff5Bf5c871f15Ff516DBf",
    access.address,
  ]);
  await azx.deployed();
  await waitBlocks(5);
  const azxImpl = await getImplementationAddress(ethers.provider, azx.address);
  console.log(`AZX deployed to: ${azx.address} => ${azxImpl}`);
  await run("verify:verify", {
    address: azxImpl,
    contract: "contracts/token/NTZCToken.sol:NTZCToken",
  });

  // HotWallet deployed to: 0x3b1B143D8191A195f0E8c8800289b5388C736885 => 0x95E7643D7Ae995D70502C5Ea74f18553cfd209a2
  const HW = await ethers.getContractFactory("HotWallet");
  const hw = await upgrades.deployProxy(HW, [azx.address, access.address]);
  await hw.deployed();
  await waitBlocks(5);
  const hwImpl = await getImplementationAddress(ethers.provider, hw.address);
  console.log(`HotWallet deployed to: ${hw.address} => ${hwImpl}`);
  await run("verify:verify", {
    address: hwImpl,
    contract: "contracts/hotwallet/HotWallet.sol:HotWallet",
  });

  // Escrow deployed to: 0x36e186BC20a7b21370e27F688D59B67268AA195c => 0x33C710ca66Dbb499A0fEC4dac1218f04b1Cc7814
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await upgrades.deployProxy(Escrow, [
    azx.address,
    "0x4f1AF681d21affec44Bff5Bf5c871f15Ff516DBf",
    access.address,
  ]);
  await escrow.deployed();
  await waitBlocks(5);
  const escrowImpl = await getImplementationAddress(
    ethers.provider,
    escrow.address
  );
  console.log(`Escrow deployed to: ${escrow.address} => ${escrowImpl}`);
  await run("verify:verify", {
    address: escrowImpl,
    contract: "contracts/escrow/Escrow.sol:Escrow",
  });

  await access.updateSignValidationWhitelist(azx.address, true);
  await access.updateSignValidationWhitelist(escrow.address, true);
  await access.updateSignValidationWhitelist(hw.address, true);

  await azx.updateAllowedContracts(escrow.address, true);
  await azx.updateFreeOfFeeContracts(escrow.address, true);
  await azx.updateAllowedContracts(hw.address, true);
  await azx.updateFreeOfFeeContracts(hw.address, true);
  await azx.updateFreeOfFeeContracts(admin.address, true);

  await access.updateSenders(backend, true);
  await access.updateSigners(backend, true);
  await access.updateSenders(signer, true);
  await access.updateSigners(signer, true);
  await access.updateTradeDeskUsers(signer, true);
  await access.updateMinters(signer, true);
  await access.updateSigners(signer2, true);
  await access.updateTradeDeskUsers(signer2, true);
  await access.updateMinters(signer2, true);

  const mintAmount = BigInt(200000 * 1e8);
  {
    const bytes32hex = ethers.utils.randomBytes(32);
    const message = await azx.mintProof(bytes32hex, mintAmount, [
      "wdfqf78qef8f",
      "qw7d98qfquf9q",
      "8wq9fh89qef3r",
    ]);
    const signature = await admin.signMessage(
      ethers.utils.arrayify(message)
    );
    await azx.mint(signature, bytes32hex, mintAmount, [
      "wdfqf78qef8f",
      "qw7d98qfquf9q",
      "8wq9fh89qef3r",
    ]);
  }
  await waitBlocks(5);
  await azx.transfer(hw.address, BigInt(100000 * 1e8),  { gasLimit: 2000000 } );
  await azx.transfer(
   "0x4f1AF681d21affec44Bff5Bf5c871f15Ff516DBf",
    BigInt(5000 * 1e8),  { gasLimit: 2000000 }
  );

  console.log("DONE!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// const Manager = await ethers.getContractFactory("Manager");
// const manager = await upgrades.upgradeProxy("0xec63261A6DE7D81dd0c637Ba493aB5957F9143Bc", Manager);
// manager.deployed();
// await waitBlocks(5);
// const managerImplAddress = await getImplementationAddress(
//   ethers.provider,
//   manager.address
// );
// console.log(
//   `Manager deployed to: ${manager.address} => ${managerImplAddress}`
// );
// await run("verify:verify", {
//   address: managerImplAddress,
//   contract: "contracts/manager/Manager.sol:Manager",
// });
