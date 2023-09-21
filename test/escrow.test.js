const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("Escrow tests", function () {
  it("Escrow basic flow", async function () {
    const [manager, seller, buyer, tradeDesk] = await ethers.getSigners();
    const mintAmount = BigInt(50000 * 1e8);

    const Access = await ethers.getContractFactory("Access");
    const access = await upgrades.deployProxy(Access, []);
    await access.deployed();

    const Token = await ethers.getContractFactory("AUZToken");
    const token = await upgrades.deployProxy(Token, [
      manager.address,
      manager.address,
      access.address,
    ]);
    await token.deployed();
    await access.updateSignValidationWhitelist(token.address, true);
    {
      const bytes32hex = ethers.utils.randomBytes(32);
      const message = await token.mintProof(bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
      const signature = await manager.signMessage(
        ethers.utils.arrayify(message)
      );
      await token.mint(signature, bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
    }
    await token.updateCommissionTransfer(100);
    await token.updateFreeOfFeeContracts(manager.address, true);
    await token.transfer(buyer.address, mintAmount);

    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await upgrades.deployProxy(Escrow, [
      token.address,
      manager.address,
      access.address,
    ]);
    await escrow.deployed();
    await token.updateAllowedContracts(escrow.address, true);
    await token.updateFreeOfFeeContracts(escrow.address, true);
    await access.updateSignValidationWhitelist(escrow.address, true);
    {
      const bytes32hex = ethers.utils.randomBytes(32);
      const message = await escrow.tradeDeskProof(
        bytes32hex,
        tradeDesk.address,
        true
      );
      const signature = await manager.signMessage(
        ethers.utils.arrayify(message)
      );
      await escrow.setTradeDesk(signature, bytes32hex, tradeDesk.address, true);
    }

    const tradeId = "TheFirstTrade";

    // REGISTER TRADE
    {
      const tokenHashMock = ethers.utils.randomBytes(32);
      const message = await escrow.registerProof(
        tokenHashMock,
        tradeId,
        [""],
        seller.address,
        buyer.address,
        BigInt(1000 * 1e8),
        BigInt(900 * 1e8),
        "60000"
      );
      const signature = await tradeDesk.signMessage(
        ethers.utils.arrayify(message)
      );
      await escrow.registerTrade(
        signature,
        tokenHashMock,
        tradeId,
        [""],
        seller.address,
        buyer.address,
        BigInt(1000 * 1e8),
        BigInt(900 * 1e8),
        "60000"
      );

      const trade = await escrow.getTrade(tradeId);
      expect(BigInt(trade.tradeCap)).to.equal(BigInt(1000 * 1e8));
      expect(BigInt(trade.sellersPart)).to.equal(BigInt(900 * 1e8));
      expect(trade.seller).to.equal(seller.address);
      expect(trade.buyer).to.equal(buyer.address);
    }

    // VALIDATE TRADE
    {
      const tokenHashMock = ethers.utils.randomBytes(32);
      const message = await escrow.validateProof(tokenHashMock, tradeId, [""]);
      const signature = await manager.signMessage(
        ethers.utils.arrayify(message)
      );
      await escrow.validateTrade(signature, tokenHashMock, tradeId, [""]);

      const trade = await escrow.getTrade(tradeId);
      expect(trade.valid).to.equal(true);
    }

    // BUYERS DELEGATE APPROVE
    {
      const bytes32hex = ethers.utils.randomBytes(32);
      const message = await token.delegateApproveProof(
        bytes32hex,
        buyer.address,
        escrow.address,
        BigInt(1000000 * 1e8),
        BigInt(1 * 1e8)
      );
      const signature = await buyer.signMessage(ethers.utils.arrayify(message));
      await token.delegateApprove(
        signature,
        bytes32hex,
        buyer.address,
        escrow.address,
        BigInt(1000000 * 1e8),
        BigInt(1 * 1e8)
      );
    }

    // PAY TRADE
    {
      const tokenHashMock = ethers.utils.randomBytes(32);
      const message = await escrow.payProof(
        tokenHashMock,
        tradeId,
        [""],
        buyer.address
      );
      const signature = await buyer.signMessage(ethers.utils.arrayify(message));
      await escrow.payTrade(
        signature,
        tokenHashMock,
        tradeId,
        [""],
        buyer.address
      );

      const trade = await escrow.getTrade(tradeId);
      expect(await token.balanceOf(escrow.address)).to.equal(
        BigInt(1000 * 1e8)
      );
      expect(trade.paid).to.equal(true);
    }

    // FINISH TRADE
    {
      const tokenHashMock = ethers.utils.randomBytes(32);
      const message = await escrow.finishProof(tokenHashMock, tradeId, [""]);
      const signature = await tradeDesk.signMessage(
        ethers.utils.arrayify(message)
      );

      await escrow.finishTrade(signature, tokenHashMock, tradeId, [""]);

      const trade = await escrow.getTrade(tradeId);
      expect(trade.finished).to.equal(true);
    }

    // RELEASE TRADE
    {
      const tokenHashMock = ethers.utils.randomBytes(32);
      const message = await escrow.releaseProof(
        tokenHashMock,
        tradeId,
        [""],
        buyer.address
      );
      const managerBal = await token.balanceOf(manager.address);
      const signature = await buyer.signMessage(ethers.utils.arrayify(message));
      await escrow.releaseTrade(
        signature,
        tokenHashMock,
        tradeId,
        [""],
        buyer.address
      );

      expect(await token.balanceOf(seller.address)).to.equal(BigInt(900 * 1e8));
      expect(await token.balanceOf(manager.address)).to.equal(
        BigInt(100 * 1e8) + BigInt(managerBal)
      );
    }
  });

  it("Escrow admin resolve flow", async function () {
    const [manager, seller, buyer, tradeDesk] = await ethers.getSigners();
    const mintAmount = BigInt(50000 * 1e8);

    const Access = await ethers.getContractFactory("Access");
    const access = await upgrades.deployProxy(Access, []);
    await access.deployed();

    const Token = await ethers.getContractFactory("AUZToken");
    const token = await upgrades.deployProxy(Token, [
      manager.address,
      manager.address,
      access.address,
    ]);
    await token.deployed();
    await access.updateSignValidationWhitelist(token.address, true);
    {
      const bytes32hex = ethers.utils.randomBytes(32);
      const message = await token.mintProof(bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
      const signature = await manager.signMessage(
        ethers.utils.arrayify(message)
      );
      await token.mint(signature, bytes32hex, mintAmount, [
        "wdfqf78qef8f",
        "qw7d98qfquf9q",
        "8wq9fh89qef3r",
      ]);
    }
    await token.updateCommissionTransfer(100);
    await token.updateFreeOfFeeContracts(manager.address, true);
    await token.transfer(buyer.address, mintAmount);

    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await upgrades.deployProxy(Escrow, [
      token.address,
      manager.address,
      access.address,
    ]);
    await escrow.deployed();
    await token.updateAllowedContracts(escrow.address, true);
    await token.updateFreeOfFeeContracts(escrow.address, true);
    await access.updateSignValidationWhitelist(escrow.address, true);
    {
      const bytes32hex = ethers.utils.randomBytes(32);
      const message = await escrow.tradeDeskProof(
        bytes32hex,
        tradeDesk.address,
        true
      );
      const signature = await manager.signMessage(
        ethers.utils.arrayify(message)
      );
      await escrow.setTradeDesk(signature, bytes32hex, tradeDesk.address, true);
    }

    const tradeId = "TheFirstTrade";

    // REGISTER TRADE
    {
      const tokenHashMock = ethers.utils.randomBytes(32);
      const message = await escrow.registerProof(
        tokenHashMock,
        tradeId,
        [""],
        seller.address,
        buyer.address,
        BigInt(1000 * 1e8),
        BigInt(900 * 1e8),
        "60000"
      );
      const signature = await tradeDesk.signMessage(
        ethers.utils.arrayify(message)
      );
      await escrow.registerTrade(
        signature,
        tokenHashMock,
        tradeId,
        [""],
        seller.address,
        buyer.address,
        BigInt(1000 * 1e8),
        BigInt(900 * 1e8),
        "60000"
      );

      const trade = await escrow.getTrade(tradeId);
      expect(BigInt(trade.tradeCap)).to.equal(BigInt(1000 * 1e8));
      expect(BigInt(trade.sellersPart)).to.equal(BigInt(900 * 1e8));
      expect(trade.seller).to.equal(seller.address);
      expect(trade.buyer).to.equal(buyer.address);
    }

    // VALIDATE TRADE
    {
      const tokenHashMock = ethers.utils.randomBytes(32);
      const message = await escrow.validateProof(tokenHashMock, tradeId, [""]);
      const signature = await manager.signMessage(
        ethers.utils.arrayify(message)
      );
      await escrow.validateTrade(signature, tokenHashMock, tradeId, [""]);

      const trade = await escrow.getTrade(tradeId);
      expect(trade.valid).to.equal(true);
    }

    // BUYERS DELEGATE APPROVE
    {
      const bytes32hex = ethers.utils.randomBytes(32);
      const message = await token.delegateApproveProof(
        bytes32hex,
        buyer.address,
        escrow.address,
        BigInt(1000000 * 1e8),
        BigInt(1 * 1e8)
      );
      const signature = await buyer.signMessage(ethers.utils.arrayify(message));
      await token.delegateApprove(
        signature,
        bytes32hex,
        buyer.address,
        escrow.address,
        BigInt(1000000 * 1e8),
        BigInt(1 * 1e8)
      );
    }

    // PAY TRADE
    {
      const tokenHashMock = ethers.utils.randomBytes(32);
      const message = await escrow.payProof(
        tokenHashMock,
        tradeId,
        [""],
        buyer.address
      );
      const signature = await buyer.signMessage(ethers.utils.arrayify(message));
      await escrow.payTrade(signature, tokenHashMock, tradeId, [""], buyer.address);

      const trade = await escrow.getTrade(tradeId);
      expect(await token.balanceOf(escrow.address)).to.equal(
        BigInt(1000 * 1e8)
      );
      expect(trade.paid).to.equal(true);
    }

    // FINISH TRADE
    {
      const tokenHashMock = ethers.utils.randomBytes(32);
      const message = await escrow.finishProof(tokenHashMock, tradeId, [""]);
      const signature = await tradeDesk.signMessage(
        ethers.utils.arrayify(message)
      );

      await escrow.finishTrade(signature, tokenHashMock, tradeId, [""]);

      const trade = await escrow.getTrade(tradeId);
      expect(trade.finished).to.equal(true);
    }

    // RESOLVE TRADE
    {
      const tokenHashMock = ethers.utils.randomBytes(32);
      const message = await escrow.resolveProof(
        tokenHashMock,
        tradeId,
        [""],
        true,
        "Some reason..."
      );
      const managerBal = await token.balanceOf(manager.address);
      const signature = await manager.signMessage(
        ethers.utils.arrayify(message)
      );

      await expect(
        escrow.resolveTrade(
          signature,
          tokenHashMock,
          tradeId,
          [""],
          true,
          "Some reason..."
        )
      ).to.be.revertedWith("Escrow: Too early to resolve");

      await network.provider.send("evm_increaseTime", [60000]); // Waiting for resolving period
      await network.provider.send("evm_mine");

      await escrow.resolveTrade(
        signature,
        tokenHashMock,
        tradeId,
        [""],
        true,
        "Some reason..."
      );

      expect(await token.balanceOf(seller.address)).to.equal(BigInt(900 * 1e8));
      expect(await token.balanceOf(manager.address)).to.equal(
        BigInt(100 * 1e8) + BigInt(managerBal)
      );
    }
  });
});
