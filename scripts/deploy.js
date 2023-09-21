const { getImplementationAddress } = require("@openzeppelin/upgrades-core");
const { ethers, upgrades } = require("hardhat");
const { waitBlocks } = require("../utils/blockWaiter");

async function main() {
  const signers = await ethers.getSigners();
  const admin = signers[0];

  const backend = "0xae30fc5f42d7d8c7e8cbe5ad19620e87fb825735";
  const signer = "0xd31bBAf4c77750c6c79413cFf189315F93DD135e";
  const signer2 = "0x3ddD16e693E7c7251d64d9ad36506cBDf2268D55";

  // Access deployed to: 0xf74Fa7226237c54Acb18211fb3b2FC62AAFF8fa9 => 0x5D27E3f348948522B72B2d4056Ad1C0E86133b96
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

  // AZX deployed to: 0x1994Fd475c4769138A6f834141DAEc362516497F => 0x8FB9c7724B79E4b93490B4Bb2e76b13A478249AA
  const AZX = await ethers.getContractFactory("NTZCToken");
  const azx = await upgrades.deployProxy(AZX, [
    admin.address,
    "0xccd8b289CE99fFbB8E7e1CF5e8a7c81DBd25Fed2",
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

  // HotWallet deployed to: 0x5CdE1b89f757eDdA8f149d6d63C7dE764C83d498 => 0x18807080950A9e034c46fBCEFc952F5D115B4C7C
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

  // Escrow deployed to: 0xBc3868C72D66961C09b21108a4fcd51f1f0B5ceC => 0x02cd7d521F0322e4420b7D56F7e4A86aB791A51c
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await upgrades.deployProxy(Escrow, [
    azx.address,
    "0xccd8b289CE99fFbB8E7e1CF5e8a7c81DBd25Fed2",
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
  await azx.transfer(hw.address, BigInt(100000 * 1e8));
  await azx.transfer(
    "0xBF758171658F88B53206cf0fF23DB805C8d3304F",
    BigInt(5000 * 1e8)
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
