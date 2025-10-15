import { ethers } from "hardhat";

async function main() {
  console.log("Testing simple deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Try deploying a very simple contract first
  const SimpleTest = await ethers.getContractFactory("Survey");
  console.log("Deploying Survey...");
  
  try {
    const contract = await SimpleTest.deploy();
    console.log("Deployment transaction sent");
    await contract.waitForDeployment();
    console.log("Contract deployed to:", await contract.getAddress());
  } catch (error: any) {
    console.error("Deployment failed:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
