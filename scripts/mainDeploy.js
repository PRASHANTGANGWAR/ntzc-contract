const { getImplementationAddress } = require("@openzeppelin/upgrades-core");
const { ethers, upgrades } = require("hardhat");
const { waitBlocks } = require("../utils/blockWaiter");

async function main() {
  const signers = await ethers.getSigners();
  const admin = signers[0];

  // console.log("Admin:", admin.address);
  // console.log("Balance:", (await admin.getBalance()).toString());
  // console.log("Admin:", await ethers.provider.getFeeData());

  // // Access deployed to: 0xcFd13Ad3D50E657D1e788e1992F31CA5c7EfdDF5
  // const Access = await ethers.getContractFactory("Access");
  // const access = await upgrades.deployProxy(Access, [], {
  //   timeout: 0,
  // });
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

  // // NTZC deployed to: 0x7777720711f49d04191957e36e14B8D306a5902d
  // const AZX = await ethers.getContractFactory("NTZCToken");
  // const azx = await upgrades.deployProxy(
  //   AZX,
  //   [
  //     "0xAc425601EE0B50DD2c42E381F674278C5835C22B",
  //     "0xAc425601EE0B50DD2c42E381F674278C5835C22B",
  //     "0xcFd13Ad3D50E657D1e788e1992F31CA5c7EfdDF5",
  //   ],
  //   { timeout: 0 }
  // );
  // await azx.deployed();
  // await waitBlocks(5);
  // const azxImpl = await getImplementationAddress(ethers.provider, azx.address);
  // console.log(`AZX deployed to: ${azx.address} => ${azxImpl}`);
  // await run("verify:verify", {
  //   address: azxImpl,
  //   contract: "contracts/token/NTZCToken.sol:NTZCToken",
  // });

  // // Hot Wallet deployed to: 0x50d7FB1dDd7cA69473Dd0d5c58A1685518f54520
  // const HW = await ethers.getContractFactory("HotWallet");
  // const hw = await upgrades.deployProxy(
  //   HW,
  //   [
  //     "0x7777720711f49d04191957e36e14B8D306a5902d",
  //     "0xcFd13Ad3D50E657D1e788e1992F31CA5c7EfdDF5",
  //   ],
  //   { timeout: 0, txOverride: { gasPrice: 10 * 1e9 } }
  // );
  // await hw.deployed();
  // await waitBlocks(5);
  // const hwImpl = await getImplementationAddress(ethers.provider, hw.address);
  // console.log(`HotWallet deployed to: ${hw.address} => ${hwImpl}`);
  // await run("verify:verify", {
  //   address: hwImpl,
  //   contract: "contracts/hotwallet/HotWallet.sol:HotWallet",
  // });

  // // Escrow deployed to: 0x8a007b068b3Fb8ddA7F2CD88e24Ea2a0801A984F
  // const Escrow = await ethers.getContractFactory("Escrow");
  // const escrow = await upgrades.deployProxy(
  //   Escrow,
  //   [
  //     "0x7777720711f49d04191957e36e14B8D306a5902d",
  //     "0xAc425601EE0B50DD2c42E381F674278C5835C22B",
  //     "0xcFd13Ad3D50E657D1e788e1992F31CA5c7EfdDF5",
  //   ],
  //   { timeout: 0, txOverride: { gasPrice: 15 * 1e9 } }
  // );
  // await escrow.deployed();
  // await waitBlocks(5);
  // const escrowImpl = await getImplementationAddress(
  //   ethers.provider,
  //   escrow.address
  // );
  // console.log(`Escrow deployed to: ${escrow.address} => ${escrowImpl}`);
  // await run("verify:verify", {
  //   address: escrowImpl,
  //   contract: "contracts/escrow/Escrow.sol:Escrow",
  // });

  // COLD WALLET 0xAc425601EE0B50DD2c42E381F674278C5835C22B
  // HOT WALLET (NOT CONTRACT BUT ADMIN) 0xc16397ab2C63131Be359f1360627073153a31b64
  // MANAGER (ADMIN) 0x14cc2EcfCB3BA85a5f5082b044ACC920b15D7EC6
  // BACKEND 0x10832296Cc39961cfA0507D6859b70d2d86F3108

  
  // const azx = await ethers.getContractAt("NTZCToken", "0x7777720711f49d04191957e36e14B8D306a5902d");
  // const mintAmount = BigInt(100000 * 1e8);
  // {
  //   const bytes32hex = ethers.utils.randomBytes(32);
  //   const message = await azx.mintProof(bytes32hex, mintAmount, [
  //     "wdfqf78qef8f",
  //     "qw7d98qfquf9q",
  //     "8wq9fh89qef3r",
  //   ]);
  //   const signature = await admin.signMessage(ethers.utils.arrayify(message));

  //   await azx.mint(signature, bytes32hex, mintAmount, [
  //     "wdfqf78qef8f",
  //     "qw7d98qfquf9q",
  //     "8wq9fh89qef3r",
  //   ]);
  // }

  console.log("DONE!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
