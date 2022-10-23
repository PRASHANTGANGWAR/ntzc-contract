// const { ethers, upgrades } = require("hardhat");
// const { expect } = require("chai");

// describe("Hotwallet tests", function () {
//   it("Buy without signature should revert if amount exceed buy limit", async function () {
//     const signers = await ethers.getSigners();

//     const Access = await ethers.getContractFactory("Access");
//     const access = await upgrades.deployProxy(Access, []);
//     await access.deployed();

//     const AZX = await ethers.getContractFactory("AUZToken");
//     const azx = await upgrades.deployProxy(AZX, [
//       signers[0].address,
//       signers[0].address,
//       access.address,
//     ]);
//     await azx.deployed();
//     await azx.mintGold(BigInt(50000 * 1e8), ["wdfqf78qef8f"]);

//     const TD = await ethers.getContractFactory("HotWallet");
//     const td = await upgrades.deployProxy(TD, [azx.address, access.address]);
//     await td.deployed();

//     await azx.updateFreeOfFeeContracts(signers[0].address, true);
//     await azx.updateFreeOfFeeContracts(td.address, true);
//     await azx.updateAllowedContracts(td.address, true);
//     await azx.transfer(td.address, BigInt(50000 * 1e8));

//     await expect(
//       td.buyGold(signers[2].address, BigInt(10000 * 1e8))
//     ).to.be.revertedWith("HotWallet: amount exceeds buy limit");

//     await td.buyGold(signers[2].address, BigInt(1000 * 1e8));
//     expect(BigInt(await azx.balanceOf(signers[2].address))).to.equal(
//       BigInt(1000 * 1e8)
//     );
//   });

//   it("Buy with manager signature, should revert if signer or caller aren't managers", async function () {
//     const signers = await ethers.getSigners();

//     const Access = await ethers.getContractFactory("Access");
//     const access = await upgrades.deployProxy(Access, []);
//     await access.deployed();

//     const AZX = await ethers.getContractFactory("AUZToken");
//     const azx = await upgrades.deployProxy(AZX, [
//       signers[0].address,
//       signers[0].address,
//       access.address,
//     ]);
//     await azx.deployed();
//     await azx.mintGold(BigInt(50000 * 1e8), ["wdfqf78qef8f"]);

//     const TD = await ethers.getContractFactory("HotWallet");
//     const td = await upgrades.deployProxy(TD, [azx.address, access.address]);
//     await td.deployed();

//     await azx.updateFreeOfFeeContracts(signers[0].address, true);
//     await azx.updateFreeOfFeeContracts(td.address, true);
//     await azx.updateAllowedContracts(td.address, true);
//     await azx.transfer(td.address, BigInt(50000 * 1e8));
//     await access.updateSignValidationWhitelist(td.address, true);

//     const tokenHashMock = ethers.utils.randomBytes(32);
//     const message = await td.getBuyProof(
//       tokenHashMock,
//       signers[2].address,
//       BigInt(10000 * 1e8)
//     );
//     const signature = await signers[0].signMessage(
//       ethers.utils.arrayify(message)
//     );
//     const falseSignature = await signers[1].signMessage(
//       ethers.utils.arrayify(message)
//     );

//     await expect(
//       td.buyGoldWithSignature(
//         falseSignature,
//         tokenHashMock,
//         signers[2].address,
//         BigInt(10000 * 1e8)
//       )
//     ).to.be.revertedWith("HotWallet: Signer is not manager");

//     await td.buyGoldWithSignature(
//       signature,
//       tokenHashMock,
//       signers[2].address,
//       BigInt(10000 * 1e8)
//     );
//     expect(BigInt(await azx.balanceOf(signers[2].address))).to.equal(
//       BigInt(10000 * 1e8)
//     );
//   });

//   it("Delegate sell with admin sale canceling", async function () {
//     const signers = await ethers.getSigners();

//     const Access = await ethers.getContractFactory("Access");
//     const access = await upgrades.deployProxy(Access, []);
//     await access.deployed();

//     const AZX = await ethers.getContractFactory("AUZToken");
//     const azx = await upgrades.deployProxy(AZX, [
//       signers[0].address,
//       signers[0].address,
//       access.address,
//     ]);
//     await azx.deployed();
//     await azx.mintGold(BigInt(50000 * 1e8), ["wdfqf78qef8f"]);

//     const TD = await ethers.getContractFactory("HotWallet");
//     const td = await upgrades.deployProxy(TD, [azx.address, access.address]);
//     await td.deployed();

//     await azx.updateFreeOfFeeContracts(signers[0].address, true);
//     await azx.updateFreeOfFeeContracts(td.address, true);
//     await azx.updateAllowedContracts(td.address, true);
//     await azx.transfer(td.address, BigInt(50000 * 1e8));
//     await access.updateSignValidationWhitelist(td.address, true);
//     await access.updateSignValidationWhitelist(azx.address, true);

//     {
//       const tokenHashMock = ethers.utils.randomBytes(32);
//       const message = await td.getBuyProof(
//         tokenHashMock,
//         signers[2].address,
//         BigInt(10000 * 1e8)
//       );
//       const signature = await signers[0].signMessage(
//         ethers.utils.arrayify(message)
//       );

//       await td.buyGoldWithSignature(
//         signature,
//         tokenHashMock,
//         signers[2].address,
//         BigInt(10000 * 1e8)
//       );
//     }
    
//     {
//       const bytes32hex = ethers.utils.randomBytes(32);
//       const message = await azx.delegateApproveProof(
//         bytes32hex,
//         signers[2].address,
//         td.address,
//         BigInt(1000000 * 1e8),
//         BigInt(1 * 1e8)
//       );
//       const signature = await signers[2].signMessage(ethers.utils.arrayify(message));
//       await azx.delegateApprove(
//         signature,
//         bytes32hex,
//         signers[2].address,
//         td.address,
//         BigInt(1000000 * 1e8),
//         BigInt(1 * 1e8)
//       );
//     }

//     const saleId = ethers.utils.randomBytes(32);
//     {
//       const tokenHashMock = ethers.utils.randomBytes(32);
//       const message = await td.getSaleProof(
//         tokenHashMock,
//         signers[2].address,
//         BigInt(1000 * 1e8),
//         BigInt(1 * 1e8)
//       );
//       const signature = await signers[2].signMessage(
//         ethers.utils.arrayify(message)
//       );
//       const hotwalletBal = await azx.balanceOf(td.address);
//       await td.preAuthorizedSell(
//         signature,
//         tokenHashMock,
//         signers[2].address,
//         BigInt(1000 * 1e8),
//         saleId,
//         BigInt(1 * 1e8)
//       );
//       expect(BigInt(await azx.balanceOf(td.address))).to.equal(BigInt(hotwalletBal) + BigInt(1000 * 1e8))
//     }

//     {
//       const tokenHashMock = ethers.utils.randomBytes(32);
//       const message = await td.getSaleProcessProof(
//         tokenHashMock,
//         saleId,
//         false
//       );
//       const signature = await signers[0].signMessage(
//         ethers.utils.arrayify(message)
//       );
//       const userBal = await azx.balanceOf(signers[2].address);
//       await td.processSaleRequest(
//         signature,
//         tokenHashMock,
//         saleId,
//         false
//       );
//       expect(BigInt(await azx.balanceOf(signers[2].address))).to.equal(BigInt(userBal) + BigInt(1000 * 1e8))
//     }
//   });

  
// });
