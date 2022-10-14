const { getImplementationAddress } = require("@openzeppelin/upgrades-core");
const { ethers, upgrades } = require("hardhat");
const { waitBlocks } = require("../utils/blockWaiter");

async function main() {
  const signers = await ethers.getSigners();

  // 0xb2E9c5B31EA9B861DD4FC6569F37D1B3B11905Af => 0x23eB94d988Efeeff1F6E8Af1C6C88beDeF5f38C3

  // const AUZ = await ethers.getContractFactory("AUZToken");
  // const auz = await upgrades.deployProxy(AUZ, [
  //   "0xc3f4929ECC1bBd794aD46089B8C1e9777c11Ea4D",
  //   "0xc3f4929ECC1bBd794aD46089B8C1e9777c11Ea4D",
  //   "0xc3f4929ECC1bBd794aD46089B8C1e9777c11Ea4D",
  // ]);
  // auz.deployed();
  // await waitBlocks(5);
  // const auzImplAddress = await getImplementationAddress(
  //   ethers.provider,
  //   auz.address
  // );
  // console.log(
  //   `Token deployed to: ${auz.address} => ${auzImplAddress}`
  // );
  // await run("verify:verify", {
  //   address: auzImplAddress,
  //   contract: "contracts/token/AUZToken.sol:AUZToken",
  // });

  //  0xec63261A6DE7D81dd0c637Ba493aB5957F9143Bc => 0xdF755CDdA91aC37C57EEc8e63AfC8eA0371BE255

  // const Manager = await ethers.getContractFactory("Manager");
  // const manager = await upgrades.deployProxy(Manager, []);
  // manager.deployed();
  // await waitBlocks(5);
  // const managerImplAddress = await getImplementationAddress(
  //   ethers.provider,
  //   manager.address
  // );
  // console.log(
  //   `Manager deployed to: ${manager.address} => ${managerImplAddress}`
  // );
  // await run("verify:verify", {
  //   address: managerImplAddress,
  //   contract: "contracts/manager/Manager.sol:Manager",
  // });

  const azx = await ethers.getContractAt("AUZToken", "0xb2E9c5B31EA9B861DD4FC6569F37D1B3B11905Af");
  const manager = await ethers.getContractAt("Manager", "0xec63261A6DE7D81dd0c637Ba493aB5957F9143Bc");

  // await azx.mintGold(BigInt(50000 * 1e8), ["wdfqf78qef8f"]);
  // await manager.updateAZX(azx.address);
  // await manager.updateManagers("0xae30fc5f42d7d8c7e8cbe5ad19620e87fb825735", true);
  // await azx.updateFreeOfFeeContracts(signers[0].address, true);
  // await azx.transfer(manager.address, BigInt(50000 * 1e8));
  // await azx.updateManager(manager.address);

  // await manager.buyGoldWithSignature(
  //   "0x55a0f7f93a38477e681cb1425d6fc1b0907176b961a7876da1096ecb886a01b5",
  //   "0xac731e44664c0224c0f396e599d1cd982b3de6cba4954316bda8bc6f6478530c03704b774c0f05b925b8385182e243af3382cdf3c5037bef073c73fdf5e628061b",
  //   "0x9937a44a0f221ce22c2d8b68f7adda463393b7b2def6b1fba5360ed59b1cdfcf",
  //   "0xc3f4929ECC1bBd794aD46089B8C1e9777c11Ea4D",
  //   BigInt(10 * 1e8)
  // )

  // console.log(await manager.methodWord_approve())
  // const hex = "0x9077c3fae74a277cdfe18494fee2ea8f16adeff923677c7209a8e4a8c823e024";
  // const methodApprove = "0x095ea7b3";
  // const proof = await manager.getProof(methodApprove, hex, BigInt(1 * 1e8), manager.address, BigInt(10 * 1e8));
  // const sign = await signers[0].signMessage(ethers.utils.arrayify(proof));
  // console.log(proof);
  // console.log(sign);

  // console.log(await manager.methodWord_transfer())
  // const hex = "0x17ff2e4a94118c8fb5e8c30e3752401bf8f22ad4f6ae6f49d26351955afa1efe";
  // const methodTransfer = "0xa9059cbb";
  // const proof = await manager.getProof(methodTransfer, hex, BigInt(1 * 1e8), "0xae30fc5f42d7d8c7e8cbe5ad19620e87fb825735", BigInt(10 * 1e8));
  // const sign = await signers[0].signMessage(ethers.utils.arrayify(proof));
  // console.log(proof);
  // console.log(sign);



  console.log("DONE!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
