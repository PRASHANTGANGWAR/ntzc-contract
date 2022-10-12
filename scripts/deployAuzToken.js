const { getImplementationAddress } = require("@openzeppelin/upgrades-core");
const { ethers, upgrades } = require("hardhat");

async function main() {
  const signers = await ethers.getSigners();

  // const AUZ = await ethers.getContractFactory("AdvancedAUZToken");
  // const auz = await AUZ.deploy(signers[0].address, signers[0].address, signers[0].address);
  // await auz.deployed();

  // console.log(auz.address)

  // try {
  //   await run("verify:verify", {
  //     address: "0x6f47D02060f3bd428158465D8eFeF69912AE6fe6",
  //     contract: "contracts/token/azx.sol:AdvancedAUZToken",
  //     constructorArguments: [signers[0].address, signers[0].address, signers[0].address],
  //   });
  // } catch (error) {
  //   console.log("Verify ERR: ", error);
  // }

  // const azx = await ethers.getContractAt(
  //   "AdvancedAUZToken",
  //   "0x6f47D02060f3bd428158465D8eFeF69912AE6fe6"
  // );
  // await azx.mintGold(BigInt(100000 * 1e8), ["0xfa398782ca103ebfd98cf30ad305a"]);

  // const HW = await ethers.getContractFactory("HotWallet");
  // const hw = await HW.deploy("0x6f47D02060f3bd428158465D8eFeF69912AE6fe6");
  // await hw.deployed();

  // await azx.updateAllowedContracts(hw.address, true);
  // await azx.updateFreeContracts(hw.address, true);

  try {
    await run("verify:verify", {
      address: "0xA2802D6bA82b61d6D830fa0215Fe99efB0b989CD",
      contract: "contracts/hotwallet/hotwallet.sol:HotWallet",
      constructorArguments: ["0x6f47D02060f3bd428158465D8eFeF69912AE6fe6"],
    });
  } catch (error) {
    console.log("Verify ERR: ", error);
   }

  // console.log(hw.address) "0xA2802D6bA82b61d6D830fa0215Fe99efB0b989CD"

  console.log("DONE!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
