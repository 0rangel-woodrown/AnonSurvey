import { ethers } from "hardhat";

async function main() {
  console.log("Starting Survey contract deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy Survey (FHE-enabled)
  const Survey = await ethers.getContractFactory("Survey");
  console.log("Deploying Survey contract (FHE enabled)...");

  const survey = await Survey.deploy();
  await survey.waitForDeployment();

  const surveyAddress = await survey.getAddress();
  console.log("Survey contract deployed to:", surveyAddress);

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    surveyAddress: surveyAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Wait for a few block confirmations
  console.log("\nWaiting for 2 block confirmations...");
  await survey.deploymentTransaction()?.wait(2);
  console.log("Deployment confirmed!\n");

  // Bootstrap: create a few example surveys (must match Survey.sol signature)
  console.log("Creating example surveys...");

  const now = Math.floor(Date.now() / 1000);

  // Survey 1
  await (await survey.createSurvey(
    1, // surveyId
    "Crypto Usage 2025",
    "Habits and preferences",
    2, // numQuestions
    7 * 24 * 60 * 60, // duration
    100, // targetParticipants
    18, // minAge
    false // requiresVerification
  )).wait();

  const q1Id = ethers.id("Q1: Satisfaction");
  const q2Id = ethers.id("Q2: Usage Frequency");
  await (await survey.addQuestion(1, q1Id, 0, 1, 5, "Overall satisfaction (1-5)")) // QuestionType.Rating = 0
    .wait();
  await (await survey.addQuestion(1, q2Id, 0, 1, 5, "Usage frequency (1-5)"))
    .wait();

  await (await survey.activateSurvey(1)).wait();
  console.log("Example survey #1 created and activated");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
