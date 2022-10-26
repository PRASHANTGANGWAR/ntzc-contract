const { getImplementationAddress } = require("@openzeppelin/upgrades-core");
const { ethers, upgrades } = require("hardhat");
const { waitBlocks } = require("../utils/blockWaiter");

async function main() {
  const signers = await ethers.getSigners();

  // const Access = await ethers.getContractFactory("Access");
  // const access = await upgrades.upgradeProxy("0x2A51414644C14A42f83707E5D31101ce826C5A60", Access);
  // await access.deployed();
  // await waitBlocks(5);
  // const accessImpl = await getImplementationAddress(
  //   ethers.provider,
  //   access.address
  // );
  // console.log(`Access deployed to: ${access.address} => ${accessImpl}`);
  // await run("verify:verify", {
  //   address: accessImpl,
  //   contract: "contracts/access/Access.sol:Access",
  // });
  
  const back = "0xae30fc5f42d7d8c7e8cbe5ad19620e87fb825735";
  const signer = "0xd31bBAf4c77750c6c79413cFf189315F93DD135e";
  
  const Access = "0x2A51414644C14A42f83707E5D31101ce826C5A60";
  const access = await ethers.getContractAt("Access", Access);

  await access.updateSenders(signer, true);
  await access.updateSigners(signer, true);

  console.log("DONE!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });