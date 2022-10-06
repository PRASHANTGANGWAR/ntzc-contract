const { ethers, upgrades } = require("hardhat");

describe("Tests", function () {
  it("Escrow basic flow", async function () {
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
      buyer.address,
      BigInt(1500 * 1e18),
      BigInt(500 * 1e18)
    );

    await escrow.connect(buyer).payTrade("FirstTrade1");
    await escrow.connect(buyer).approveTrade("FirstTrade1");
    await escrow.finishTrade("FirstTrade1");
  });

  it("Escrow admin resolve flow", async function () {
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
      buyer.address,
      BigInt(1500 * 1e18),
      BigInt(500 * 1e18)
    );

    console.log(await escrow.getTrade("FirstTrade1"))

    await escrow.connect(buyer).payTrade("FirstTrade1");

    await network.provider.send("evm_increaseTime", [259200]);
    await network.provider.send("evm_mine");

    await escrow.resolveTrade("FirstTrade1", true, "Some reason...");
  });
});
