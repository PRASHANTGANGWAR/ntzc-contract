const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("Manager tests", function () {
  it("Delegate approve", async function () {
    const signers = await ethers.getSigners();
    const bytes32hex = ethers.utils.randomBytes(32);

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
        bytes32hex,
        BigInt(1 * 1e8),
        td.address,
        BigInt(100 * 1e8)
      );
    const aprsig = await signers[1].signMessage(ethers.utils.arrayify(aprhash));

    await td.preAuthorizedApproval(
      aprhash,
      aprsig,
      bytes32hex,
      BigInt(1 * 1e8),
      BigInt(100 * 1e8)
    );

    expect(
      BigInt(await azx.allowance(signers[1].address, td.address))
    ).to.equal(BigInt(100 * 1e8));
  });

  it("Should revert if broadcaster is not a manager", async function () {
    const signers = await ethers.getSigners();
    const bytes32hex = ethers.utils.randomBytes(32);

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
        bytes32hex,
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
          bytes32hex,
          BigInt(1 * 1e8),
          BigInt(100 * 1e8)
        )
    ).to.be.revertedWith("Manager: Only managers is allowed");
  });

  it("Delegate transfer", async function () {
    const signers = await ethers.getSigners();
    const bytes32hex = ethers.utils.randomBytes(32);
    const bytes32hex2 = ethers.utils.randomBytes(32);

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
        bytes32hex,
        BigInt(1 * 1e8),
        td.address,
        BigInt(1000 * 1e8)
      );
    const aprsig = await signers[1].signMessage(ethers.utils.arrayify(aprhash));

    await td.preAuthorizedApproval(
      aprhash,
      aprsig,
      bytes32hex,
      BigInt(1 * 1e8),
      BigInt(1000 * 1e8)
    );

    const trfuncCode = await td.methodWord_transfer();
    const trhash = await td
      .connect(signers[1])
      .getProof(
        trfuncCode,
        bytes32hex2,
        BigInt(1 * 1e8),
        signers[3].address,
        BigInt(1000 * 1e8)
      );
    const trsig = await signers[1].signMessage(ethers.utils.arrayify(trhash));

    await td.preAuthorizedTransfer(
      trhash,
      trsig,
      bytes32hex2,
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
    const bytes32hex = ethers.utils.randomBytes(32);
    const bytes32hex2 = ethers.utils.randomBytes(32);

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
        bytes32hex,
        BigInt(1 * 1e8),
        td.address,
        BigInt(1000 * 1e8)
      );
    const aprsig = await signers[1].signMessage(ethers.utils.arrayify(aprhash));

    await td.preAuthorizedApproval(
      aprhash,
      aprsig,
      bytes32hex,
      BigInt(1 * 1e8),
      BigInt(1000 * 1e8)
    );

    const trfuncCode = await td.methodWord_transfer();
    const trhash = await td
      .connect(signers[1])
      .getProof(
        trfuncCode,
        bytes32hex2,
        BigInt(1 * 1e8),
        signers[3].address,
        BigInt(2000 * 1e8)
      );
    const trsig = await signers[1].signMessage(ethers.utils.arrayify(trhash));

    await expect(
      td.preAuthorizedTransfer(
        trhash,
        trsig,
        bytes32hex2,
        BigInt(1 * 1e8),
        signers[3].address,
        BigInt(2000 * 1e8)
      )
    ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
  });

  it("Should revert if manager calls different data than user signed", async function () {
    const signers = await ethers.getSigners();
    const bytes32hex = ethers.utils.randomBytes(32);
    const bytes32hex2 = ethers.utils.randomBytes(32);

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
        bytes32hex,
        BigInt(1 * 1e8),
        td.address,
        BigInt(1000 * 1e8)
      );
    const aprsig = await signers[1].signMessage(ethers.utils.arrayify(aprhash));

    await td.preAuthorizedApproval(
      aprhash,
      aprsig,
      bytes32hex,
      BigInt(1 * 1e8),
      BigInt(1000 * 1e8)
    );

    const trfuncCode = await td.methodWord_transfer();
    const trhash = await td
      .connect(signers[1])
      .getProof(
        trfuncCode,
        bytes32hex2,
        BigInt(1 * 1e8),
        signers[3].address,
        BigInt(2000 * 1e8)
      );
    const trsig = await signers[1].signMessage(ethers.utils.arrayify(trhash));

    await expect(
      td.preAuthorizedTransfer(
        trhash,
        trsig,
        bytes32hex2,
        BigInt(1000 * 1e8),
        signers[5].address,
        BigInt(2000 * 1e8)
      )
    ).to.be.revertedWith("Manager: Invalid proof");
  });

  it("Buy without signature should revert if amount exceed buy limit", async function () {
    const signers = await ethers.getSigners();
    const bytes32hex = ethers.utils.randomBytes(32);
    const bytes32hex2 = ethers.utils.randomBytes(32);

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

    const TD = await ethers.getContractFactory("Manager");
    const td = await upgrades.deployProxy(TD, []);
    await td.deployed();
    await td.updateAZX(azx.address);
    await td.updateManagers(signers[1].address, true);

    await azx.updateFreeOfFeeContracts(signers[0].address, true);
    await azx.transfer(td.address, BigInt(50000 * 1e8));
    await azx.updateManager(td.address);

    await expect(
      td.buyGold(signers[2].address, BigInt(10000 * 1e8))
    ).to.be.revertedWith("Manager: amount exceeds buy limit");

    await td.buyGold(signers[2].address, BigInt(1000 * 1e8));
  });

  it("Buy with manager signature, should revert if signer or caller aren't managers", async function () {
    const signers = await ethers.getSigners();
    const bytes32hex = ethers.utils.randomBytes(32);
    const bytes32hex2 = ethers.utils.randomBytes(32);

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

    const TD = await ethers.getContractFactory("Manager");
    const td = await upgrades.deployProxy(TD, []);
    await td.deployed();
    await td.updateAZX(azx.address);
    await td.updateManagers(signers[1].address, true);

    await azx.updateFreeOfFeeContracts(signers[0].address, true);
    await azx.transfer(td.address, BigInt(50000 * 1e8));
    await azx.updateManager(td.address);

    const buyfuncCode = await td.methodWord_buy();
    const buyhash = await td
      .connect(signers[1])
      .getProof(
        buyfuncCode,
        bytes32hex,
        BigInt(0 * 1e8),
        signers[2].address,
        BigInt(1000 * 1e8)
      );

    const buysigWrong = await signers[2].signMessage(
      ethers.utils.arrayify(buyhash)
    );
    await expect(
      td.buyGoldWithSignature(
        buyhash,
        buysigWrong,
        bytes32hex,
        signers[2].address,
        BigInt(1000 * 1e8)
      )
    ).to.be.revertedWith("Manager: Signer is not manager");

    const buysigTrue = await signers[1].signMessage(
      ethers.utils.arrayify(buyhash)
    );
    await td.buyGoldWithSignature(
      buyhash,
      buysigTrue,
      bytes32hex,
      signers[2].address,
      BigInt(1000 * 1e8)
    );
  });

  it("Delegate sell", async function () {
    const signers = await ethers.getSigners();
    const bytes32hex = ethers.utils.randomBytes(32);
    const bytes16Example = ethers.utils.randomBytes(16);

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

    const TD = await ethers.getContractFactory("Manager");
    const td = await upgrades.deployProxy(TD, []);
    await td.deployed();
    await td.updateAZX(azx.address);
    await td.updateManagers(signers[1].address, true);

    await azx.updateFreeOfFeeContracts(signers[0].address, true);
    await azx.transfer(signers[2].address, BigInt(1000 * 1e8));
    await azx.updateManager(td.address);
    await azx.connect(signers[2]).approve(td.address, BigInt(1000 * 1e8));

    const sellfuncCode = await td.methodWord_sell();
    const sellhash = await td
      .connect(signers[2])
      .getProof(
        sellfuncCode,
        bytes32hex,
        BigInt(0 * 1e8),
        td.address,
        BigInt(1000 * 1e8)
      );

    const sellsig = await signers[2].signMessage(
      ethers.utils.arrayify(sellhash)
    );

    await td.preAuthorizedSell(
      sellhash,
      sellsig,
      bytes32hex,
      0,
      BigInt(1000 * 1e8),
      bytes16Example
    );

    expect(BigInt(await azx.balanceOf(signers[2].address))).to.equal(BigInt(0));
    expect(BigInt(await azx.balanceOf(td.address))).to.equal(
      BigInt(1000 * 1e8)
    );
    const requestProof = await td.getSaleApproveProof(bytes16Example, true);
    const signature = await signers[1].signMessage(ethers.utils.arrayify(requestProof));
    await td.processSaleRequest(bytes16Example, true, signature)
  });

  it("Sale request cancel", async function () {
    const signers = await ethers.getSigners();
    const bytes32hex = ethers.utils.randomBytes(32);
    const bytes16Example = ethers.utils.randomBytes(16);

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

    const TD = await ethers.getContractFactory("Manager");
    const td = await upgrades.deployProxy(TD, []);
    await td.deployed();
    await td.updateAZX(azx.address);
    await td.updateManagers(signers[1].address, true);

    await azx.updateFreeOfFeeContracts(signers[0].address, true);
    await azx.transfer(signers[2].address, BigInt(1000 * 1e8));
    await azx.updateManager(td.address);
    await azx.connect(signers[2]).approve(td.address, BigInt(1000 * 1e8));

    const sellfuncCode = await td.methodWord_sell();
    const sellhash = await td
      .connect(signers[2])
      .getProof(
        sellfuncCode,
        bytes32hex,
        BigInt(0 * 1e8),
        td.address,
        BigInt(1000 * 1e8)
      );

    const sellsig = await signers[2].signMessage(
      ethers.utils.arrayify(sellhash)
    );

    await td.preAuthorizedSell(
      sellhash,
      sellsig,
      bytes32hex,
      0,
      BigInt(1000 * 1e8),
      bytes16Example
    );
      
    const requestProof = await td.getSaleApproveProof(bytes16Example, false);
    const signature = await signers[1].signMessage(ethers.utils.arrayify(requestProof));
    await td.processSaleRequest(bytes16Example, false, signature);
    expect(BigInt(await azx.balanceOf(signers[2].address))).to.equal(BigInt(1000 * 1e8));
  });
});
