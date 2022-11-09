const { getImplementationAddress } = require("@openzeppelin/upgrades-core");
const { ethers, upgrades } = require("hardhat");
const { waitBlocks } = require("../utils/blockWaiter");

async function main() {
  const signers = await ethers.getSigners();

  // const Access = await ethers.getContractFactory("Access");
  // const access = await upgrades.upgradeProxy("0x2A51414644C14A42f83707E5D31101ce826C5A60", Access);
  // await access.deployed();
  // await waitBlocks(5);
  // const accessImpl = await getImplementationAddress(
  //   ethers.provider,
  //   access.address
  // );
  // console.log(`Access deployed to: ${access.address} => ${accessImpl}`);
  // await run("verify:verify", {
  //   address: accessImpl,
  //   contract: "contracts/access/Access.sol:Access",
  // });

  // const Token = await ethers.getContractFactory("AUZToken");
  // const token = await upgrades.upgradeProxy("0x1994Fd475c4769138A6f834141DAEc362516497F", Token);
  // await token.deployed();
  // await waitBlocks(5);
  // const tokenImpl = await getImplementationAddress(
  //   ethers.provider,
  //   token.address
  // );
  // console.log(`Token deployed to: ${token.address} => ${tokenImpl}`);
  // await run("verify:verify", {
  //   address: tokenImpl,
  //   contract: "contracts/token/AUZToken.sol:AUZToken",
  // });

  // const HW = await ethers.getContractFactory("HotWallet");
  // const hw = await upgrades.upgradeProxy("0x5CdE1b89f757eDdA8f149d6d63C7dE764C83d498", HW);
  // await hw.deployed();
  // await waitBlocks(5);
  // const hwImpl = await getImplementationAddress(
  //   ethers.provider,
  //   hw.address
  // );
  // console.log(`HW deployed to: ${hw.address} => ${hwImpl}`);
  // await run("verify:verify", {
  //   address: hwImpl,
  //   contract: "contracts/hotwallet/HotWallet.sol:HotWallet",
  // });

  // const Escrow = await ethers.getContractFactory("Escrow");
  // const escrow = await upgrades.upgradeProxy(
  //   "0xE91Fe1A637F63038995E9923c0D06A5ba5C78Ec4",
  //   Escrow
  // );
  // await escrow.deployed();
  // await waitBlocks(5);
  // const escrowImpl = await getImplementationAddress(ethers.provider, escrow.address);
  // console.log(`Escrow deployed to: ${escrow.address} => ${escrowImpl}`);
  // await run("verify:verify", {
  //   address: escrowImpl,
  //   contract: "contracts/hotwallet/Escrow.sol:Escrow",
  // });


  // const back = "0xae30fc5f42d7d8c7e8cbe5ad19620e87fb825735";
  // const signer = "0xd31bBAf4c77750c6c79413cFf189315F93DD135e";

  // const Access = "0x2A51414644C14A42f83707E5D31101ce826C5A60";
  // const access = await ethers.getContractAt("Access", Access);

  // await access.updateSenders(signer, true);
  // await access.updateSigners(signer, true);

  console.log("DONE!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });








  // const azx = await ethers.getContractAt("AUZToken", "0x1994Fd475c4769138A6f834141DAEc362516497F");
  // const access = await ethers.getContractAt("Access", "0xf74Fa7226237c54Acb18211fb3b2FC62AAFF8fa9");

  // const Escrow = await ethers.getContractFactory("Escrow");
  // const escrow = await upgrades.deployProxy(Escrow, [
  //   azx.address,
  //   "0xccd8b289CE99fFbB8E7e1CF5e8a7c81DBd25Fed2",
  //   access.address,
  // ]);
  // await escrow.deployed();
  // await waitBlocks(5);
  // const escrowImpl = await getImplementationAddress(
  //   ethers.provider,
  //   escrow.address
  // );
  // console.log(`Escrow deployed to: ${escrow.address} => ${escrowImpl}`);
  // await run("verify:verify", {
  //   address: escrowImpl,
  //   contract: "contracts/escrow/Escrow.sol:Escrow",
  // });

  // await access.updateSignValidationWhitelist(escrow.address, true);
  // await azx.updateAllowedContracts(escrow.address, true);
  // await azx.updateFreeOfFeeContracts(escrow.address, true);
