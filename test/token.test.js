const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("Token tests", function () {
  it("Should mint tokens to selling wallet", async function () {
    const signers = await ethers.getSigners();

    const sellingWallet = signers[1].address;
    const mintAmount = BigInt(50000 * 1e8);

    const Access = await ethers.getContractFactory("Access");
    const access = await upgrades.deployProxy(Access, []);
    await access.deployed();

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      sellingWallet,
      signers[0].address,
      access.address,
    ]);
    await azx.deployed();
    await access.updateSignValidationWhitelist(azx.address, true);

    {
      const bytes32hex = ethers.utils.randomBytes(32);
      const message = await azx.mintProof(bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
      const signature = await signers[0].signMessage(
        ethers.utils.arrayify(message)
      );
      await azx.mint(signature, bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
    }

    expect(BigInt(await azx.balanceOf(sellingWallet))).to.equal(mintAmount);
  });

  it("Should revert if not a minter call the mint", async function () {
    const signers = await ethers.getSigners();

    const sellingWallet = signers[1].address;
    const mintAmount = BigInt(50000 * 1e8);

    const Access = await ethers.getContractFactory("Access");
    const access = await upgrades.deployProxy(Access, []);
    await access.deployed();

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      sellingWallet,
      signers[0].address,
      access.address,
    ]);
    await azx.deployed();

    await access.updateSignValidationWhitelist(azx.address, true);

    {
      const bytes32hex = ethers.utils.randomBytes(32);
      const message = await azx.mintProof(bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
      const signature = await signers[1].signMessage(
        ethers.utils.arrayify(message)
      );
      await expect(
        azx
          .mint(signature, bytes32hex, mintAmount, [
            "wdfqf78qef8f",
            "qw7d98qfquf9q",
            "8wq9fh89qef3r",
          ])
      ).to.be.revertedWith("AUZToken: Signer is not minter");
    }

    
  });

  it("Should burn from token contract", async function () {
    const signers = await ethers.getSigners();

    const sellingWallet = signers[0].address;
    const mintAmount = BigInt(50000 * 1e8);

    const Access = await ethers.getContractFactory("Access");
    const access = await upgrades.deployProxy(Access, []);
    await access.deployed();

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      sellingWallet,
      signers[0].address,
      access.address,
    ]);
    await azx.deployed();

    await access.updateSignValidationWhitelist(azx.address, true);

    {
      const bytes32hex = ethers.utils.randomBytes(32);
      const message = await azx.mintProof(bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
      const signature = await signers[0].signMessage(
        ethers.utils.arrayify(message)
      );
      await azx.mint(signature, bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
    }
    expect(BigInt(await azx.balanceOf(signers[0].address))).to.equal(BigInt(mintAmount));

    {
      const bytes32hex = ethers.utils.randomBytes(32);
      const message = await azx.burnProof(bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
      const signature = await signers[0].signMessage(
        ethers.utils.arrayify(message)
      );
      await azx.burn(signature, bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
    }

    expect(BigInt(await azx.balanceOf(signers[0].address))).to.equal(BigInt(0));
  });

  it("Should revert transfers from not allowed contracts and vice versa", async function () {
    const signers = await ethers.getSigners();

    const sellingWallet = signers[0].address;
    const mintAmount = BigInt(50000 * 1e8);

    const Access = await ethers.getContractFactory("Access");
    const access = await upgrades.deployProxy(Access, []);
    await access.deployed();

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      sellingWallet,
      signers[0].address,
      access.address,
    ]);
    await azx.deployed();

    const SomeContract = await ethers.getContractFactory("SomeContract");
    const someContract = await SomeContract.deploy();
    await someContract.deployed();

    await access.updateSignValidationWhitelist(azx.address, true);
    {
      const bytes32hex = ethers.utils.randomBytes(32);
      const message = await azx.mintProof(bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
      const signature = await signers[0].signMessage(
        ethers.utils.arrayify(message)
      );
      await azx.mint(signature, bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
    }

    await azx.transfer(someContract.address, mintAmount);
    await expect(someContract.someFunction(azx.address)).to.be.revertedWith(
      "AUZToken: Contract doesn't have permission to transfer tokens"
    );
    await azx.updateAllowedContracts(someContract.address, true);
    await someContract.someFunction(azx.address);
  });

  it("Transfer comissions calculations", async function () {
    const signers = await ethers.getSigners();

    const sellingWallet = signers[0].address;
    const mintAmount = BigInt(50000 * 1e8);

    const Access = await ethers.getContractFactory("Access");
    const access = await upgrades.deployProxy(Access, []);
    await access.deployed();

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      sellingWallet,
      signers[0].address,
      access.address,
    ]);
    await azx.deployed();

    await access.updateSignValidationWhitelist(azx.address, true);
    {
      const bytes32hex = ethers.utils.randomBytes(32);
      const message = await azx.mintProof(bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
      const signature = await signers[0].signMessage(
        ethers.utils.arrayify(message)
      );
      await azx.mint(signature, bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
    }

    await azx.updateCommissionTransfer(0); // 0% fee
    await azx.transfer(signers[1].address, BigInt(1000 * 1e8));
    expect(BigInt(await azx.balanceOf(signers[1].address))).to.equal(
      BigInt(1000 * 1e8)
    );

    await azx.updateCommissionTransfer(1000); // 1% fee
    await azx.transfer(signers[2].address, BigInt(1000 * 1e8));
    expect(BigInt(await azx.balanceOf(signers[2].address))).to.equal(
      BigInt(990 * 1e8)
    );
  });

  it("Should take transfer fee if address is not whitelisted and and vice versa", async function () {
    const signers = await ethers.getSigners();

    const sellingWallet = signers[0].address;
    const mintAmount = BigInt(50000 * 1e8);

    const Access = await ethers.getContractFactory("Access");
    const access = await upgrades.deployProxy(Access, []);
    await access.deployed();

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      sellingWallet,
      signers[0].address,
      access.address,
    ]);
    await azx.deployed();

    await access.updateSignValidationWhitelist(azx.address, true);
    {
      const bytes32hex = ethers.utils.randomBytes(32);
      const message = await azx.mintProof(bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
      const signature = await signers[0].signMessage(
        ethers.utils.arrayify(message)
      );
      await azx.mint(signature, bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
    }

    await azx.updateCommissionTransfer(1000); // 1% fee
    await azx.transfer(signers[2].address, BigInt(1000 * 1e8));
    expect(BigInt(await azx.balanceOf(signers[2].address))).to.equal(
      BigInt(990 * 1e8)
    );

    await azx.updateFreeOfFeeContracts(signers[0].address, true); // 0% fee
    await azx.transfer(signers[1].address, BigInt(1000 * 1e8));
    expect(BigInt(await azx.balanceOf(signers[1].address))).to.equal(
      BigInt(1000 * 1e8)
    );
  });

  it("Delegate approve", async function () {
    const signers = await ethers.getSigners();

    const sellingWallet = signers[0].address;
    const mintAmount = BigInt(50000 * 1e8);

    const Access = await ethers.getContractFactory("Access");
    const access = await upgrades.deployProxy(Access, []);
    await access.deployed();

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      sellingWallet,
      signers[0].address,
      access.address,
    ]);
    await azx.deployed();
    await access.updateSignValidationWhitelist(azx.address, true);
    {
      const bytes32hex = ethers.utils.randomBytes(32);
      const message = await azx.mintProof(bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
      const signature = await signers[0].signMessage(
        ethers.utils.arrayify(message)
      );
      await azx.mint(signature, bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
    }
    await azx.transfer(signers[1].address, mintAmount);

    const bytes32hex = ethers.utils.randomBytes(32);
    const message = await azx.delegateApproveProof(
      bytes32hex,
      signers[1].address,
      signers[0].address,
      BigInt(1000 * 1e8),
      BigInt(1 * 1e8)
    );
    const signature = await signers[1].signMessage(
      ethers.utils.arrayify(message)
    );

    await expect(
      azx.delegateApprove(
        signature,
        bytes32hex,
        signers[1].address,
        signers[0].address,
        BigInt(100000 * 1e8),
        BigInt(1000 * 1e8)
      )
    ).to.be.revertedWith("AUZToken: Signer is not owner");

    await expect(
      azx.delegateTransfer(
        signature,
        bytes32hex,
        signers[1].address,
        signers[0].address,
        BigInt(100000 * 1e8),
        BigInt(1000 * 1e8)
      )
    ).to.be.revertedWith("AUZToken: Signer is not owner"); // it means that proof is invalid (ECDSA recover wrong address from wrong signature)

    await expect(
      azx
        .connect(signers[1])
        .delegateApprove(
          signature,
          bytes32hex,
          signers[1].address,
          signers[0].address,
          BigInt(1000 * 1e8),
          BigInt(1 * 1e8)
        )
    ).to.be.revertedWith("AUZToken: Only managers is allowed");

    await azx.delegateApprove(
      signature,
      bytes32hex,
      signers[1].address,
      signers[0].address,
      BigInt(1000 * 1e8),
      BigInt(1 * 1e8)
    );

    expect(
      BigInt(await azx.allowance(signers[1].address, signers[0].address))
    ).to.equal(BigInt(1000 * 1e8));
  });

  it("Delegate transfer", async function () {
    const signers = await ethers.getSigners();

    const sellingWallet = signers[0].address;
    const mintAmount = BigInt(50000 * 1e8);

    const Access = await ethers.getContractFactory("Access");
    const access = await upgrades.deployProxy(Access, []);
    await access.deployed();

    const AZX = await ethers.getContractFactory("AUZToken");
    const azx = await upgrades.deployProxy(AZX, [
      sellingWallet,
      signers[0].address,
      access.address,
    ]);
    await azx.deployed();
    await access.updateSignValidationWhitelist(azx.address, true);
    {
      const bytes32hex = ethers.utils.randomBytes(32);
      const message = await azx.mintProof(bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
      const signature = await signers[0].signMessage(
        ethers.utils.arrayify(message)
      );
      await azx.mint(signature, bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
    }
    await azx.updateCommissionTransfer(0);
    await azx.transfer(signers[1].address, mintAmount);

    const bytes32hex = ethers.utils.randomBytes(32);
    const message = await azx.delegateTransferProof(
      bytes32hex,
      signers[1].address,
      signers[0].address,
      BigInt(1000 * 1e8),
      0
    );
    const signature = await signers[1].signMessage(
      ethers.utils.arrayify(message)
    );

    await expect(
      azx.delegateTransfer(
        signature,
        bytes32hex,
        signers[1].address,
        signers[0].address,
        BigInt(100000 * 1e8),
        BigInt(1000 * 1e8)
      )
    ).to.be.revertedWith("AUZToken: Signer is not owner");

    await expect(
      azx
        .connect(signers[1])
        .delegateTransfer(
          signature,
          bytes32hex,
          signers[1].address,
          signers[0].address,
          BigInt(1000 * 1e8),
          0
        )
    ).to.be.revertedWith("AUZToken: Only managers is allowed");

    await azx.delegateTransfer(
      signature,
      bytes32hex,
      signers[1].address,
      signers[0].address,
      BigInt(1000 * 1e8),
      0
    );

    expect(BigInt(await azx.balanceOf(signers[0].address))).to.equal(
      BigInt(1000 * 1e8)
    );
  });
});
