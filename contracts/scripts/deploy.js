const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Factory = await ethers.getContractFactory("DealRoomFactory");
  const factory = await Factory.deploy(deployer.address);
  await factory.waitForDeployment();
  console.log("DealRoomFactory:", await factory.getAddress());

  const Oracle = await ethers.getContractFactory("AIDueDiligenceOracle");
  const oracle = await Oracle.deploy(deployer.address);
  await oracle.waitForDeployment();
  console.log("AIDueDiligenceOracle:", await oracle.getAddress());

  const DealRoom = await ethers.getContractFactory("DealRoom");
  const dealRoom = await DealRoom.deploy(
    "TechCorp Acquisition",
    "Confidential deal room for TechCorp acquisition",
    await factory.getAddress(),
    deployer.address
  );
  await dealRoom.waitForDeployment();
  console.log("DealRoom:", await dealRoom.getAddress());

  await factory.trackDealRoom(await dealRoom.getAddress(), "TechCorp Acquisition");
  console.log("Done!");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
