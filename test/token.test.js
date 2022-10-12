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
      signers[2].address,
      signers[0].address,
      signers[3].address
    );
    await azx.deployed();

    await azx.mintGold(BigInt(10000 * 1e8), [
      "wdfqf78qef8f",
      "qw7d98qfquf9q",
      "8wq9fh89qef3r",
    ]);
    await azx
      .connect(signers[2])
      .transfer(signers[1].address, BigInt(900 * 1e8));

    await azx
      .connect(signers[1])
      .approve(signers[0].address, BigInt(900 * 1e8));
    await azx.connect(signers[1]).approve(azx.address, BigInt(900 * 1e8));
    await azx
      .connect(signers[1])
      .approve(signers[4].address, BigInt(900 * 1e8));

    {
      const funcCode = await azx.methodWord_approve();
      const hash = await azx
        .connect(signers[1])
        .getProofApproval(
          funcCode,
          hexExample2,
          BigInt(1 * 1e8),
          signers[0].address,
          signers[4].address,
          BigInt(100 * 1e8)
        );
      const sig = (await signers[1].signMessage(ethers.utils.arrayify(hash))).slice(2);
      const sigObjt = {};
      sigObjt.r = "0x" + sig.slice(0, 64);
      sigObjt.s = "0x" + sig.slice(64, 128);
      sigObjt.v = parseInt(sig.slice(128), 16);

      await azx.preAuthorizedApproval(
        funcCode,
        hash,
        sigObjt.r,
        sigObjt.s,
        sigObjt.v,
        hexExample2,
        BigInt(1 * 1e8),
        signers[4].address,
        BigInt(100 * 1e8)
      );
    }
    {
      const funcCode = await azx.methodWord_transfer();
      const hash = await azx
        .connect(signers[1])
        .getProofTransfer(
          funcCode,
          hexExample,
          BigInt(1 * 1e8),
          signers[0].address,
          signers[4].address,
          BigInt(100 * 1e8)
        );
      const sig = (await signers[1].signMessage(ethers.utils.arrayify(hash))).slice(2);
      const sigObjt = {};
      sigObjt.r = "0x" + sig.slice(0, 64);
      sigObjt.s = "0x" + sig.slice(64, 128);
      sigObjt.v = parseInt(sig.slice(128), 16);

      console.log(await azx.balanceOf(signers[1].address));

      await azx.preAuthorizedTransfer(
        hash,
        sigObjt.r,
        sigObjt.s,
        sigObjt.v,
        hexExample,
        BigInt(1 * 1e8),
        signers[4].address,
        BigInt(100 * 1e8)
      );
    }
  });
});
