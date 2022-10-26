const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("Token tests", function () {
  it("Test of all parts of system", async function () {
    const signers = await ethers.getSigners();
    const admin = signers[0];
    
    const backend = "0xae30fc5f42d7d8c7e8cbe5ad19620e87fb825735";
    const signer = "0xd31bBAf4c77750c6c79413cFf189315F93DD135e";

    const Access = await ethers.getContractFactory("Access");
    const access = await upgrades.deployProxy(Access, []);
    await access.deployed();

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      admin.address,
      admin.address,
      access.address,
    ]);
    await azx.deployed();

    const HW = await ethers.getContractFactory("HotWallet");
    const hw = await upgrades.deployProxy(HW, [azx.address, access.address]);
    await hw.deployed();

    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await upgrades.deployProxy(Escrow, [
      azx.address,
      admin.address,
      access.address,
    ]);
    await escrow.deployed();

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
    await azx.transfer(hw.address, BigInt(100000 * 1e8));
    await azx.transfer("0xBF758171658F88B53206cf0fF23DB805C8d3304F", BigInt(5000 * 1e8));


  });

  // it("Test of all parts of system", async function () {
  //   const back = "0xae30fc5f42d7d8c7e8cbe5ad19620e87fb825735";
    
  //   const Access = "0x2A51414644C14A42f83707E5D31101ce826C5A60";
  //   const access = await ethers.getContractAt("Access", Access);

  //   console.log(await access.owner());
  //   console.log(await access.isSigner(back));
  //   console.log(await access.isSender(back));

  // });
});
