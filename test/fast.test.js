// const { ethers, upgrades } = require("hardhat");
// const { expect } = require("chai");
// const helpers = require("@nomicfoundation/hardhat-network-helpers");

// describe("Escrow tests", function () {
//   it("Escrow basic flow", async function () {

//     const access = await ethers.getContractAt("Access", "0xf74Fa7226237c54Acb18211fb3b2FC62AAFF8fa9");
//     const escrow = await ethers.getContractAt("Escrow", "0xbc3868c72d66961c09b21108a4fcd51f1f0b5cec");
//     const tradeDesk = await new ethers.Wallet("e0d5ca2ca41cdb5f25117c21960734fe8ef6dc4726716f3c1838227859bef23b", ethers.provider);
//     const backend = await new ethers.Wallet("cd8e6a5fb3f08cf62ede0e2d241cf2659276470993156d904c21f53fe34d5af2", ethers.provider);
//     let proof;
//     {
//         const message = await escrow.registerProof(
//         "0xb7ea346ad328dfa07c15bf516f4587ef232a7c3eb68d4aa77c26b7470bca9e7c",
//         "637b53d2e2dd1e1c24b69141",
//         ["https://auz-public-files-bucket.s3.eu-central-1.amazonaws.com/da0a9b26-51f4-41af-8538-ec9213f9c9ec-Make_Questions.jfif"],
//         "0x50bfC4c57319A6b50Cd9Aa75c34FDcefBacE2f41",
//         "0xd31bBAf4c77750c6c79413cFf189315F93DD135e",
//         "400000000",
//         "300000000",
//         "17280000000000"
//       );
//       const signature = await tradeDesk.signMessage(
//         ethers.utils.arrayify(message)
//       );
//       proof = signature;
//     }
//     await escrow.connect(backend).registerTrade(
//       proof,
//       "0xb7ea346ad328dfa07c15bf516f4587ef232a7c3eb68d4aa77c26b7470bca9e7c",
//       "637b53d2e2dd1e1c24b69141",
//       ["https://auz-public-files-bucket.s3.eu-central-1.amazonaws.com/da0a9b26-51f4-41af-8538-ec9213f9c9ec-Make_Questions.jfif"],
//       "0x50bfC4c57319A6b50Cd9Aa75c34FDcefBacE2f41",
//       "0xd31bBAf4c77750c6c79413cFf189315F93DD135e",
//       "400000000",
//       "300000000",
//       "17280000000000"
//     )


//     // // REGISTER TRADE
//     // {
//     //   const tokenHashMock = ethers.utils.randomBytes(32);
//     //   const message = await escrow.registerProof(
//     //     tokenHashMock,
//     //     tradeId,
//     //     [""],
//     //     seller.address,
//     //     buyer.address,
//     //     BigInt(1000 * 1e8),
//     //     BigInt(900 * 1e8),
//     //     "60000"
//     //   );
//     //   const signature = await tradeDesk.signMessage(
//     //     ethers.utils.arrayify(message)
//     //   );
//     //   await escrow.registerTrade(
//     //     signature,
//     //     tokenHashMock,
//     //     tradeId,
//     //     [""],
//     //     seller.address,
//     //     buyer.address,
//     //     BigInt(1000 * 1e8),
//     //     BigInt(900 * 1e8),
//     //     "60000"
//     //   );

//     //   const trade = await escrow.getTrade(tradeId);
//     //   expect(BigInt(trade.tradeCap)).to.equal(BigInt(1000 * 1e8));
//     //   expect(BigInt(trade.sellersPart)).to.equal(BigInt(900 * 1e8));
//     //   expect(trade.seller).to.equal(seller.address);
//     //   expect(trade.buyer).to.equal(buyer.address);
//     // }
//   });
// });