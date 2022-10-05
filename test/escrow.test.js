const { ethers, upgrades } = require("hardhat");

describe("Tests", function () {
  it("Escrow test", async function () {
    const [manager, seller, buyer] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy("AUZ", "AUZ", 18);
    await token.deployed();

    await token.mint(buyer.address, BigInt(2000 * 1e18));

    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await upgrades.deployProxy(Escrow, [
      token.address,
      manager.address,
    ]);
    await escrow.deployed();

    await token.connect(buyer).approve(escrow.address, BigInt(2000 * 1e18));

    await escrow.registerTrade(
      "FirstTrade1",
      ethers.utils.defaultAbiCoder.encode(["string"], ["FirstTrade1"]),
      seller.address,
      BigInt(1500 * 1e18),
      BigInt(500 * 1e18)
    );

    await escrow.confirmBuyer("FirstTrade1", buyer.address);
    await escrow.connect(buyer).payForTrade("FirstTrade1");
    await escrow.approveTrade("FirstTrade1");
    await escrow.connect(buyer).finishTrade("FirstTrade1");

  });
});
