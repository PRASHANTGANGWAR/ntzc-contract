const { ethers, upgrades } = require("hardhat");

const hexExample =
  "0x0000000000000000000000000000000000000000000000000000000000000001";
const hexExample2 =
  "0x0000000000000000000000000000000000000000000000000000000000000002";

describe("Token tests", function () {
  it("Token", async function () {
    const signers = await ethers.getSigners();

    for (let i = 0; i < 5; i++) {
      console.log(`Signer ${i}: ${signers[i].address}`);
    }
    console.log("____________________________________________________");

    const AZX = await ethers.getContractFactory("AdvancedAUZToken");
    const azx = await AZX.deploy(
      signers[0].address,
      signers[0].address,
      signers[3].address
    );
    await azx.deployed();

    const HW = await ethers.getContractFactory("HotWallet");
    const hw = await HW.deploy(azx.address);
    await hw.deployed();
    await hw.updateManagers(signers[1].address, true);

    await azx.updateHotWallet(hw.address);
    await azx.updateAllowedContracts(hw.address, true);
    await azx.updateFreeOfFeeContracts(hw.address, true);
    await azx.updateFreeOfFeeContracts(signers[0].address, true);

    await azx.mintGold(BigInt(50000 * 1e8), [
      "wdfqf78qef8f",
      "qw7d98qfquf9q",
      "8wq9fh89qef3r",
    ]);
    await azx.transfer(hw.address, BigInt(50000 * 1e8));

    await hw.buyGold(signers[2].address, BigInt(5000 * 1e8));

    const buyProof = await hw.getSignatureProof(
      signers[2].address,
      BigInt(10000 * 1e8)
    );
    const buySig = (
      await signers[1].signMessage(ethers.utils.arrayify(buyProof))
    ).slice(2);
    const buyObj = {};
    buyObj.r = "0x" + buySig.slice(0, 64);
    buyObj.s = "0x" + buySig.slice(64, 128);
    buyObj.v = parseInt(buySig.slice(128), 16);
    console.log(buyObj);

    console.log(await azx.balanceOf(signers[2].address));
    await hw.buyGoldWithSignature(
      signers[2].address,
      BigInt(10000 * 1e8),
      buyProof,
      buyObj.r,
      buyObj.s,
      buyObj.v
    );
    console.log(await azx.balanceOf(signers[2].address));

    // ____________________________________________________ //

    const sellProof = await hw.connect(signers[2].address).getSignatureProof(
      signers[2].address,
      BigInt(100 * 1e8)
    );
    const sellSig = (
      await signers[2].signMessage(ethers.utils.arrayify(sellProof))
    ).slice(2);
    const sellObj = {};
    sellObj.r = "0x" + sellSig.slice(0, 64);
    sellObj.s = "0x" + sellSig.slice(64, 128);
    sellObj.v = parseInt(sellSig.slice(128), 16);
    console.log(sellObj);

    console.log(await azx.balanceOf(signers[2].address));
    await hw.sellGoldWithSignature(
      signers[2].address,
      BigInt(100 * 1e8),
      sellProof,
      sellObj.r,
      sellObj.s,
      sellObj.v
    );
    console.log(await azx.balanceOf(signers[2].address));


    // await azx
    //   .connect(signers[2])
    //   .transfer(signers[1].address, BigInt(900 * 1e8));

    // await azx
    //   .connect(signers[1])
    //   .approve(signers[0].address, BigInt(900 * 1e8));
    // await azx.connect(signers[1]).approve(azx.address, BigInt(900 * 1e8));
    // await azx
    //   .connect(signers[1])
    //   .approve(signers[4].address, BigInt(900 * 1e8));
    // {
    //   const funcCode = await azx.methodWord_approve();
    //   const hash = await azx
    //     .connect(signers[1])
    //     .getProofApproval(
    //       funcCode,
    //       hexExample2,
    //       BigInt(1 * 1e8),
    //       signers[0].address,
    //       signers[4].address,
    //       BigInt(100 * 1e8)
    //     );
    //   const sig = (await signers[1].signMessage(ethers.utils.arrayify(hash))).slice(2);
    //   const sigObjt = {};
    //   sigObjt.r = "0x" + sig.slice(0, 64);
    //   sigObjt.s = "0x" + sig.slice(64, 128);
    //   sigObjt.v = parseInt(sig.slice(128), 16);

    //   await azx.preAuthorizedApproval(
    //     funcCode,
    //     hash,
    //     sigObjt.r,
    //     sigObjt.s,
    //     sigObjt.v,
    //     hexExample2,
    //     BigInt(1 * 1e8),
    //     signers[4].address,
    //     BigInt(100 * 1e8)
    //   );
    // }
    // {
    //   const funcCode = await azx.methodWord_transfer();
    //   const hash = await azx
    //     .connect(signers[1])
    //     .getProofTransfer(
    //       funcCode,
    //       hexExample,
    //       BigInt(1 * 1e8),
    //       signers[0].address,
    //       signers[4].address,
    //       BigInt(100 * 1e8)
    //     );
    //   const sig = (await signers[1].signMessage(ethers.utils.arrayify(hash))).slice(2);
    //   const sigObjt = {};
    //   sigObjt.r = "0x" + sig.slice(0, 64);
    //   sigObjt.s = "0x" + sig.slice(64, 128);
    //   sigObjt.v = parseInt(sig.slice(128), 16);

    //   console.log(await azx.balanceOf(signers[1].address));

    //   await azx.preAuthorizedTransfer(
    //     hash,
    //     sigObjt.r,
    //     sigObjt.s,
    //     sigObjt.v,
    //     hexExample,
    //     BigInt(1 * 1e8),
    //     signers[4].address,
    //     BigInt(100 * 1e8)
    //   );
    // }
  });
});
