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

    await hw.buyGold(signers[1].address, BigInt(5000 * 1e8));

    const buyProof = await hw.getSignatureProof(
      signers[2].address,
      BigInt(10000 * 1e8)
    );
    const buySig = await signers[1].signMessage(
      ethers.utils.arrayify(buyProof)
    );

    console.log(await azx.balanceOf(signers[2].address));
    await hw.buyGoldWithSignature(
      signers[2].address,
      BigInt(10000 * 1e8),
      buyProof,
      buySig
    );
    console.log(await azx.balanceOf(signers[2].address));

    // ____________________________________________________ //

    const sellProof = await hw
      .connect(signers[2].address)
      .getSignatureProof(signers[2].address, BigInt(100 * 1e8));
    const sellSig = await signers[2].signMessage(
      ethers.utils.arrayify(sellProof)
    );

    console.log(await azx.balanceOf(signers[2].address));
    await hw.sellGoldWithSignature(
      signers[2].address,
      BigInt(100 * 1e8),
      sellProof,
      sellSig
    );
    console.log(await azx.balanceOf(signers[2].address));

    //____________________________________________________//

    const aprfuncCode = await azx.methodWord_approve();
    const aprhash = await azx
      .connect(signers[1])
      .getProofApproval(
        aprfuncCode,
        hexExample2,
        BigInt(1 * 1e8),
        signers[0].address,
        signers[4].address,
        BigInt(100 * 1e8)
      );
    const aprsig = await signers[1].signMessage(ethers.utils.arrayify(aprhash));

    await azx.preAuthorizedApproval(
      aprfuncCode,
      aprhash,
      aprsig,
      hexExample2,
      BigInt(1 * 1e8),
      signers[4].address,
      BigInt(100 * 1e8)
    );

    //____________________________________________________//

    const trfuncCode = await azx.methodWord_transfer();
    const trhash = await azx
      .connect(signers[1])
      .getProofTransfer(
        trfuncCode,
        hexExample,
        BigInt(1 * 1e8),
        signers[0].address,
        signers[4].address,
        BigInt(100 * 1e8)
      );
    const trsig = await signers[1].signMessage(ethers.utils.arrayify(trhash));

    console.log(await azx.balanceOf(signers[1].address));

    await azx.preAuthorizedTransfer(
      trhash,
      trsig,
      hexExample,
      BigInt(1 * 1e8),
      signers[4].address,
      BigInt(100 * 1e8)
    );
  });
});
