const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("Escrow tests", function () {
  it("Escrow basic flow", async function () {
    const [manager, seller, buyer] = await ethers.getSigners();
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
    await token.mintGold(mintAmount, ["wdfqf78qef8f"]);
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
    await access.updateSignValidationWhitelist(token.address, true);
    await access.updateSignValidationWhitelist(escrow.address, true);

    const tradeId = "TheFirstTrade";

    // REGISTER TRADE
    {
      const tokenHashMock = ethers.utils.randomBytes(32);
      const tradeHashMock = ethers.utils.randomBytes(64);
      const message = await escrow.registerProof(
        tokenHashMock,
        tradeId,
        tradeHashMock,
        seller.address,
        buyer.address,
        BigInt(1000 * 1e8),
        BigInt(100 * 1e8)
      );
      const signature = await manager.signMessage(
        ethers.utils.arrayify(message)
      );
      await escrow.registerTrade(
        signature,
        tokenHashMock,
        tradeId,
        tradeHashMock,
        seller.address,
        buyer.address,
        BigInt(1000 * 1e8),
        BigInt(100 * 1e8)
      );

      const trade = await escrow.getTrade(tradeId);
      expect(BigInt(trade.price)).to.equal(BigInt(1000 * 1e8));
      expect(BigInt(trade.fee)).to.equal(BigInt(100 * 1e8));
      expect(trade.seller).to.equal(seller.address);
      expect(trade.buyer).to.equal(buyer.address);
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
        buyer.address
      );
      const signature = await buyer.signMessage(ethers.utils.arrayify(message));
      await escrow.payTrade(signature, tokenHashMock, tradeId, buyer.address);

      const trade = await escrow.getTrade(tradeId);
      expect(await token.balanceOf(escrow.address)).to.equal(
        BigInt(1100 * 1e8)
      );
      expect(trade.paid).to.equal(true);
    }

    // APPROVE TRADE
    {
      const tokenHashMock = ethers.utils.randomBytes(32);
      const message = await escrow.approveProof(
        tokenHashMock,
        tradeId,
        buyer.address
      );
      const signature = await buyer.signMessage(ethers.utils.arrayify(message));
      await escrow.approveTrade(signature, tokenHashMock, tradeId, buyer.address);

      const trade = await escrow.getTrade(tradeId);
      expect(trade.approved).to.equal(true);
    }

    // FINISH TRADE
    {
      const tokenHashMock = ethers.utils.randomBytes(32);
      const message = await escrow.finishProof(
        tokenHashMock,
        tradeId,
      );
      const signature = await manager.signMessage(ethers.utils.arrayify(message));
      const managerBal = await token.balanceOf(manager.address);
      await escrow.finishTrade(signature, tokenHashMock, tradeId);

      const trade = await escrow.getTrade(tradeId);
      expect(trade.finished).to.equal(true);
      expect(await token.balanceOf(seller.address)).to.equal(
        BigInt(1000 * 1e8)
      );
      expect(await token.balanceOf(manager.address)).to.equal(
        BigInt(100 * 1e8) + BigInt(managerBal)
      );
    }
  });

  it("Escrow admin resolve flow", async function () {
    const [manager, seller, buyer] = await ethers.getSigners();
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
    await token.mintGold(mintAmount, ["wdfqf78qef8f"]);
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
    await access.updateSignValidationWhitelist(token.address, true);
    await access.updateSignValidationWhitelist(escrow.address, true);

    const tradeId = "TheFirstTrade";

    // REGISTER TRADE
    {
      const tokenHashMock = ethers.utils.randomBytes(32);
      const tradeHashMock = ethers.utils.randomBytes(64);
      const message = await escrow.registerProof(
        tokenHashMock,
        tradeId,
        tradeHashMock,
        seller.address,
        buyer.address,
        BigInt(1000 * 1e8),
        BigInt(100 * 1e8)
      );
      const signature = await manager.signMessage(
        ethers.utils.arrayify(message)
      );
      await escrow.registerTrade(
        signature,
        tokenHashMock,
        tradeId,
        tradeHashMock,
        seller.address,
        buyer.address,
        BigInt(1000 * 1e8),
        BigInt(100 * 1e8)
      );
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
        buyer.address
      );
      const signature = await buyer.signMessage(ethers.utils.arrayify(message));
      await escrow.payTrade(signature, tokenHashMock, tradeId, buyer.address);
    }

    //////////////
    // There is something happened and buyer has got the goods but don't wont/cannot make approve
    //////////////

    await network.provider.send("evm_increaseTime", [259200]); // Waiting for resolving period
    await network.provider.send("evm_mine");

    // RESOLVE TRADE
    {
      const tokenHashMock = ethers.utils.randomBytes(32);
      const message = await escrow.resolveProof(
        tokenHashMock,
        tradeId,
        true,
        "The reason"
      );
      const signature = await manager.signMessage(ethers.utils.arrayify(message));
      const managerBal = await token.balanceOf(manager.address);
      await escrow.resolveTrade(signature, tokenHashMock, tradeId, true, "The reason");

      const trade = await escrow.getTrade(tradeId);
      expect(trade.finished).to.equal(true);
      expect(await token.balanceOf(seller.address)).to.equal(
        BigInt(1000 * 1e8)
      );
      expect(await token.balanceOf(manager.address)).to.equal(
        BigInt(100 * 1e8) + BigInt(managerBal)
      );
    }
  });
});
