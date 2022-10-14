const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("Token tests", function () {
  it("Should mint tokens to selling wallet", async function () {
    const signers = await ethers.getSigners();

    const sellingWallet = signers[1].address;
    const mintAmount = BigInt(50000 * 1e8);

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      sellingWallet,
      signers[0].address,
      signers[0].address,
    ]);
    await azx.deployed();

    await azx.mintGold(mintAmount, [
      "wdfqf78qef8f",
      "qw7d98qfquf9q",
      "8wq9fh89qef3r",
    ]);

    expect(BigInt(await azx.balanceOf(sellingWallet))).to.equal(mintAmount);
  });

  it("Should revert if not a minter call the mint", async function () {
    const signers = await ethers.getSigners();

    const sellingWallet = signers[1].address;
    const mintAmount = BigInt(50000 * 1e8);

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      sellingWallet,
      signers[0].address,
      signers[0].address,
    ]);
    await azx.deployed();

    await expect(
      azx
        .connect(signers[1])
        .mintGold(mintAmount, [
          "wdfqf78qef8f",
          "qw7d98qfquf9q",
          "8wq9fh89qef3r",
        ])
    ).to.be.revertedWith("AUZToken: Only Minter is allowed");
  });

  it("Should burn from token contract", async function () {
    const signers = await ethers.getSigners();

    const sellingWallet = signers[0].address;
    const mintAmount = BigInt(50000 * 1e8);

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      sellingWallet,
      signers[0].address,
      signers[0].address,
    ]);
    await azx.deployed();

    azx.mintGold(mintAmount, [
      "wdfqf78qef8f",
      "qw7d98qfquf9q",
      "8wq9fh89qef3r",
    ]);

    await azx.transfer(azx.address, mintAmount);
    const balance = await azx.balanceOf(azx.address);
    azx.burnGold(balance, ["wdfqf78qef8f"]);

    expect(BigInt(await azx.balanceOf(azx.address))).to.equal(BigInt(0));
  });

  it("Should revert transfers from not allowed contracts and allow from allowed", async function () {
    const signers = await ethers.getSigners();

    const sellingWallet = signers[0].address;
    const mintAmount = BigInt(50000 * 1e8);

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      sellingWallet,
      signers[0].address,
      signers[0].address,
    ]);
    await azx.deployed();

    const SomeContract = await ethers.getContractFactory("SomeContract");
    const someContract = await SomeContract.deploy();
    await someContract.deployed();

    await azx.mintGold(mintAmount, [
      "wdfqf78qef8f",
      "qw7d98qfquf9q",
      "8wq9fh89qef3r",
    ]);

    await azx.transfer(someContract.address, mintAmount);
    await expect(someContract.someFunction(azx.address)).to.be.revertedWith("AUZToken: Contract doesn't have permission to transfer tokens");
    await azx.updateAllowedContracts(someContract.address, true);
    await someContract.someFunction(azx.address);
  });

  it("Should revert if delegateTransferFrom calls not a transfersDelegator and vice versa", async function () {
    const signers = await ethers.getSigners();

    const sellingWallet = signers[0].address;
    const mintAmount = BigInt(60000 * 1e8);

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      sellingWallet,
      signers[0].address,
      signers[0].address,
    ]);
    await azx.deployed();

    await azx.mintGold(mintAmount, [
      "wdfqf78qef8f",
      "qw7d98qfquf9q",
      "8wq9fh89qef3r",
    ]);

    await expect(azx.delegateTransferFrom(sellingWallet, signers[1].address, BigInt(40000 * 1e8),signers[0].address, 0, false)).to.be.revertedWith("Only transfers delegator can call this function");
    await expect(azx.delegateApprove(signers[0].address, BigInt(40000 * 1e8), signers[0].address, 0)).to.be.revertedWith("Only transfers delegator can call this function");
    await azx.updateTransfersDelegator(signers[0].address)
    await azx.delegateApprove(signers[0].address, BigInt(40000 * 1e8), signers[0].address, 0);
    await azx.delegateTransferFrom(sellingWallet, signers[1].address, BigInt(40000 * 1e8), signers[0].address, 0, false)
    await expect(azx.delegateTransferFrom(sellingWallet, signers[1].address, BigInt(10000 * 1e8),signers[0].address, 0, false)).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
  });


  // COMISSIONS TESTS !!!
});
