const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("Manager tests", function () {
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

    const TD = await ethers.getContractFactory("Manager");
    const td = await upgrades.deployProxy(TD, []);
    await td.deployed();
    await td.updateAZX(azx.address);

    await azx.updateManager(td.address);

    const aprfuncCode = await td.methodWord_approve();
    const aprhash = await td
      .connect(signers[1])
      .getProof(
        aprfuncCode,
        hexExample,
        BigInt(1 * 1e8),
        td.address,
        BigInt(100 * 1e8)
      );
    const aprsig = await signers[1].signMessage(ethers.utils.arrayify(aprhash));

    await td.preAuthorizedApproval(
      aprhash,
      aprsig,
      hexExample,
      BigInt(1 * 1e8),
      BigInt(100 * 1e8)
    );

    expect(
      BigInt(await azx.allowance(signers[1].address, td.address))
    ).to.equal(BigInt(100 * 1e8));
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

    const TD = await ethers.getContractFactory("Manager");
    const td = await upgrades.deployProxy(TD, []);
    await td.deployed();
    await td.updateAZX(azx.address);

    await azx.updateManager(td.address);

    const aprfuncCode = await td.methodWord_approve();
    const aprhash = await td
      .connect(signers[1])
      .getProof(
        aprfuncCode,
        hexExample,
        BigInt(1 * 1e8),
        td.address,
        BigInt(100 * 1e8)
      );
    const aprsig = await signers[1].signMessage(ethers.utils.arrayify(aprhash));

    await expect(
      td
        .connect(signers[2])
        .preAuthorizedApproval(
          aprhash,
          aprsig,
          hexExample,
          BigInt(1 * 1e8),
          BigInt(100 * 1e8)
        )
    ).to.be.revertedWith("Manager: Only managers is allowed");
  });

  it("Delegate transfer", async function () {
    const signers = await ethers.getSigners();
    const hexExample =
      "0x0000000000000000000000000000000000000000000000000000000000000001";
    const hexExample2 =
      "0x0000000000000000000000000000000000000000000000000000000000000002";

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      signers[0].address,
      signers[0].address,
      signers[0].address,
    ]);
    await azx.deployed();
    await azx.updateCommissionTransfer(0);
    await azx.mintGold(BigInt(50000 * 1e8), [
      "wdfqf78qef8f",
      "qw7d98qfquf9q",
      "8wq9fh89qef3r",
    ]);
    await azx.transfer(signers[1].address, BigInt(2000 * 1e8));

    const TD = await ethers.getContractFactory("Manager");
    const td = await upgrades.deployProxy(TD, []);
    await td.deployed();
    await td.updateAZX(azx.address);

    await azx.updateManager(td.address);

    const aprfuncCode = await td.methodWord_approve();
    const aprhash = await td
      .connect(signers[1])
      .getProof(
        aprfuncCode,
        hexExample,
        BigInt(1 * 1e8),
        td.address,
        BigInt(1000 * 1e8)
      );
    const aprsig = await signers[1].signMessage(ethers.utils.arrayify(aprhash));

    await td.preAuthorizedApproval(
      aprhash,
      aprsig,
      hexExample,
      BigInt(1 * 1e8),
      BigInt(1000 * 1e8)
    );

    const trfuncCode = await td.methodWord_transfer();
    const trhash = await td
      .connect(signers[1])
      .getProof(
        trfuncCode,
        hexExample2,
        BigInt(1 * 1e8),
        signers[3].address,
        BigInt(1000 * 1e8)
      );
    const trsig = await signers[1].signMessage(ethers.utils.arrayify(trhash));

    await td.preAuthorizedTransfer(
      trhash,
      trsig,
      hexExample2,
      BigInt(1 * 1e8),
      signers[3].address,
      BigInt(1000 * 1e8)
    );

    expect(BigInt(await azx.balanceOf(signers[1].address))).to.equal(
      BigInt(998 * 1e8)
    ); // 998 = 2000 Balance - 1000 Transfer - 1 Fee Approve - 1 Fee Transfer
    expect(BigInt(await azx.balanceOf(signers[3].address))).to.equal(
      BigInt(1000 * 1e8)
    );
  });

  it("Should revert if delegate transfer exceeded allowance", async function () {
    const signers = await ethers.getSigners();
    const hexExample =
      "0x0000000000000000000000000000000000000000000000000000000000000001";
    const hexExample2 =
      "0x0000000000000000000000000000000000000000000000000000000000000002";

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      signers[0].address,
      signers[0].address,
      signers[0].address,
    ]);
    await azx.deployed();
    await azx.updateCommissionTransfer(0);
    await azx.mintGold(BigInt(50000 * 1e8), [
      "wdfqf78qef8f",
      "qw7d98qfquf9q",
      "8wq9fh89qef3r",
    ]);
    await azx.transfer(signers[1].address, BigInt(5000 * 1e8));

    const TD = await ethers.getContractFactory("Manager");
    const td = await upgrades.deployProxy(TD, []);
    await td.deployed();
    await td.updateAZX(azx.address);

    await azx.updateManager(td.address);

    const aprfuncCode = await td.methodWord_approve();
    const aprhash = await td
      .connect(signers[1])
      .getProof(
        aprfuncCode,
        hexExample,
        BigInt(1 * 1e8),
        td.address,
        BigInt(1000 * 1e8)
      );
    const aprsig = await signers[1].signMessage(ethers.utils.arrayify(aprhash));

    await td.preAuthorizedApproval(
      aprhash,
      aprsig,
      hexExample,
      BigInt(1 * 1e8),
      BigInt(1000 * 1e8)
    );

    const trfuncCode = await td.methodWord_transfer();
    const trhash = await td
      .connect(signers[1])
      .getProof(
        trfuncCode,
        hexExample2,
        BigInt(1 * 1e8),
        signers[3].address,
        BigInt(2000 * 1e8)
      );
    const trsig = await signers[1].signMessage(ethers.utils.arrayify(trhash));

    await expect(
      td.preAuthorizedTransfer(
        trhash,
        trsig,
        hexExample2,
        BigInt(1 * 1e8),
        signers[3].address,
        BigInt(2000 * 1e8)
      )
    ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
  });

  it("Should revert if manager calls different data than user signed", async function () {
    const signers = await ethers.getSigners();
    const hexExample =
      "0x0000000000000000000000000000000000000000000000000000000000000001";
    const hexExample2 =
      "0x0000000000000000000000000000000000000000000000000000000000000002";

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      signers[0].address,
      signers[0].address,
      signers[0].address,
    ]);
    await azx.deployed();
    await azx.updateCommissionTransfer(0);
    await azx.mintGold(BigInt(50000 * 1e8), [
      "wdfqf78qef8f",
      "qw7d98qfquf9q",
      "8wq9fh89qef3r",
    ]);
    await azx.transfer(signers[1].address, BigInt(5000 * 1e8));

    const TD = await ethers.getContractFactory("Manager");
    const td = await upgrades.deployProxy(TD, []);
    await td.deployed();
    await td.updateAZX(azx.address);

    await azx.updateManager(td.address);

    const aprfuncCode = await td.methodWord_approve();
    const aprhash = await td
      .connect(signers[1])
      .getProof(
        aprfuncCode,
        hexExample,
        BigInt(1 * 1e8),
        td.address,
        BigInt(1000 * 1e8)
      );
    const aprsig = await signers[1].signMessage(ethers.utils.arrayify(aprhash));

    await td.preAuthorizedApproval(
      aprhash,
      aprsig,
      hexExample,
      BigInt(1 * 1e8),
      BigInt(1000 * 1e8)
    );

    const trfuncCode = await td.methodWord_transfer();
    const trhash = await td
      .connect(signers[1])
      .getProof(
        trfuncCode,
        hexExample2,
        BigInt(1 * 1e8),
        signers[3].address,
        BigInt(2000 * 1e8)
      );
    const trsig = await signers[1].signMessage(ethers.utils.arrayify(trhash));

    await expect(
      td.preAuthorizedTransfer(
        trhash,
        trsig,
        hexExample2,
        BigInt(1000 * 1e8),
        signers[5].address,
        BigInt(2000 * 1e8)
      )
    ).to.be.revertedWith("Manager: Invalid proof");
  });
});
