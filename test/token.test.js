const { ethers, upgrades } = require("hardhat");

describe("Token tests", function () {
  it("Token", async function () {
    const signers = await ethers.getSigners();

    for (let i = 0; i < 5; i++) {
      console.log(`Signer ${i}: ${signers[i].address}`);
    }
    console.log("____________________________________________________");

    const AZX = await ethers.getContractFactory("AdvancedAUZToken");
    const azx = await AZX.deploy(signers[2].address, signers[0].address, signers[3].address);
    await azx.deployed();

    await azx.mintGold(BigInt(10000*1e8), ["wdfqf78qef8f", "qw7d98qfquf9q", "8wq9fh89qef3r"]);
    await azx.connect(signers[2]).transfer(signers[1].address, BigInt(900*1e8));
   
  });
});