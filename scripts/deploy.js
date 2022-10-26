const { getImplementationAddress } = require("@openzeppelin/upgrades-core");
const { ethers, upgrades } = require("hardhat");
const { waitBlocks } = require("../utils/blockWaiter");

async function main() {
  const signers = await ethers.getSigners();
  const admin = signers[0];

  const backend = "0xae30fc5f42d7d8c7e8cbe5ad19620e87fb825735";
  const signer = "0xd31bBAf4c77750c6c79413cFf189315F93DD135e";

  // Access deployed to: 0x2A51414644C14A42f83707E5D31101ce826C5A60 => 0x9a16BE0d10D4ebB6F9065A84002Eb6205C6A6508
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

  // AZX deployed to: 0xC9815C6198ecdFdc477c8Ce3197f0c457cE54676 => 0x4f06410eE5E99C4231ba67dAe0e8030d0Fa30796
  const AZX = await ethers.getContractFactory("AUZToken");
  const azx = await upgrades.deployProxy(AZX, [
    admin.address,
    admin.address,
    access.address,
  ]);
  await azx.deployed();
  await waitBlocks(5);
  const azxImpl = await getImplementationAddress(ethers.provider, azx.address);
  console.log(`AZX deployed to: ${azx.address} => ${azxImpl}`);
  await run("verify:verify", {
    address: azxImpl,
    contract: "contracts/token/AUZToken.sol:AUZToken",
  });

  // HotWallet deployed to: 0xFcD3F4f600fa881f3b5c20e686e2E55b26A5e1ae => 0x2b9C6e8c61ff8dc45bEcd69dB815C18F794cBE49
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

  // Escrow deployed to: 0x210D23F4Dc0B085C8Ac890c4E6e99b712439ffD0 => 0x199BFC98f8c1be7bf31ddF737b0a41Df2a3a4654
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await upgrades.deployProxy(Escrow, [
    azx.address,
    admin.address,
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

  const mintAmount = BigInt(200000 * 1e8);
  await azx.mintGold(mintAmount, ["wdfqf78qef8f"]);
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
