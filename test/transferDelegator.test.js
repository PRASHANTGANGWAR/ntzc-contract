const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("Delegator tests", function () {
  it("Delegate approve", async function () {
    const signers = await ethers.getSigners();
    const hexExample =
      "0x0000000000000000000000000000000000000000000000000000000000000001";

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      signers[0].address,
      signers[0].address,
      signers[0].address,
    ]);
    await azx.deployed();
    await azx.mintGold(BigInt(50000 * 1e8), [
      "wdfqf78qef8f",
      "qw7d98qfquf9q",
      "8wq9fh89qef3r",
    ]);
    await azx.transfer(signers[1].address, BigInt(50000 * 1e8));

    const TD = await ethers.getContractFactory("TransfersDelegator");
    const td = await upgrades.deployProxy(TD, []);
    await td.deployed();
    await td.updateAZX(azx.address);

    await azx.updateTransfersDelegator(td.address);

    const aprfuncCode = await td.methodWord_approve();
    const aprhash = await td
      .connect(signers[1])
      .getProof(
        aprfuncCode,
        hexExample,
        BigInt(1 * 1e8),
        signers[0].address,
        signers[4].address,
        BigInt(100 * 1e8)
      );
    const aprsig = await signers[1].signMessage(ethers.utils.arrayify(aprhash));

    await td.preAuthorizedApproval(
      aprfuncCode,
      aprhash,
      aprsig,
      hexExample,
      BigInt(1 * 1e8),
      signers[4].address,
      BigInt(100 * 1e8)
    );
  });

  it("Should revert if broadcaster is not a manager", async function () {
    const signers = await ethers.getSigners();
    const hexExample =
      "0x0000000000000000000000000000000000000000000000000000000000000001";

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      signers[0].address,
      signers[0].address,
      signers[0].address,
    ]);
    await azx.deployed();
    await azx.mintGold(BigInt(50000 * 1e8), [
      "wdfqf78qef8f",
      "qw7d98qfquf9q",
      "8wq9fh89qef3r",
    ]);
    await azx.transfer(signers[1].address, BigInt(50000 * 1e8));

    const TD = await ethers.getContractFactory("TransfersDelegator");
    const td = await upgrades.deployProxy(TD, []);
    await td.deployed();
    await td.updateAZX(azx.address);

    await azx.updateTransfersDelegator(td.address);

    const aprfuncCode = await td.methodWord_approve();
    const aprhash = await td
      .connect(signers[1])
      .getProof(
        aprfuncCode,
        hexExample,
        BigInt(1 * 1e8),
        signers[2].address,
        signers[4].address,
        BigInt(100 * 1e8)
      );
    const aprsig = await signers[1].signMessage(ethers.utils.arrayify(aprhash));

    await expect(td.connect(signers[2]).preAuthorizedApproval(
      aprfuncCode,
      aprhash,
      aprsig,
      hexExample,
      BigInt(1 * 1e8),
      signers[4].address,
      BigInt(100 * 1e8)
    )).to.be.revertedWith("TransfersDelegator: Only managers is allowed");
  });

  // it("Delegate approve", async function () {
  //   const signers = await ethers.getSigners();

  //   const mintAmount = BigInt(60000 * 1e8);

  //   const AZX = await ethers.getContractFactory("AUZToken");
  //   const azx = await upgrades.deployProxy(AZX, [
  //     signers[0].address,
  //     signers[0].address,
  //     signers[0].address,
  //   ]);
  //   await azx.deployed();

  //   await azx.mintGold(mintAmount, [
  //     "wdfqf78qef8f",
  //     "qw7d98qfquf9q",
  //     "8wq9fh89qef3r",
  //   ]);

  //   await azx.updateTransfersDelegator(signers[0].address);
  // });
});
