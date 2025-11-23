const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const RPC_URL = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Fixed gas price - 10 gwei for Sepolia
const GAS_PRICE = ethers.parseUnits("10", "gwei");

async function main() {
  console.log("=== Simple Deploy Script ===");
  console.log("RPC:", RPC_URL);
  console.log("Gas Price:", ethers.formatUnits(GAS_PRICE, "gwei"), "gwei");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("Wallet:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  const network = await provider.getNetwork();
  console.log("Chain ID:", network.chainId.toString());

  // Read artifact
  const artifactPath = path.join(__dirname, "../artifacts/contracts/Survey.sol/Survey.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  console.log("\nBytecode length:", artifact.bytecode.length);

  // Create factory
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  // Estimate gas
  const deployTx = await factory.getDeployTransaction();
  const estimatedGas = await provider.estimateGas({ ...deployTx, from: wallet.address });
  console.log("Estimated gas:", estimatedGas.toString());

  // Deploy
  console.log("\nDeploying contract...");
  const contract = await factory.deploy({
    gasLimit: estimatedGas * 12n / 10n,
    gasPrice: GAS_PRICE,
  });

  console.log("TX Hash:", contract.deploymentTransaction()?.hash);
  console.log("Waiting...");

  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("\n=== Contract deployed to:", address, "===\n");

  // Gas options for all transactions
  const txOpts = { gasPrice: GAS_PRICE };

  // Create surveys using the contract
  console.log("Creating Survey #1...");
  let tx = await contract.createSurvey(1, "Crypto Survey 2025", "Your crypto habits", 2, 7*24*60*60, 100, 18, false, txOpts);
  await tx.wait();
  tx = await contract.addQuestion(1, ethers.id("Q1"), 0, 1, 5, "Satisfaction (1-5)", txOpts);
  await tx.wait();
  tx = await contract.addQuestion(1, ethers.id("Q2"), 0, 1, 5, "Frequency (1-5)", txOpts);
  await tx.wait();
  tx = await contract.activateSurvey(1, txOpts);
  await tx.wait();
  console.log("Survey #1 done!");

  console.log("Creating Survey #2...");
  tx = await contract.createSurvey(2, "Employee Feedback", "Workplace survey", 3, 14*24*60*60, 500, 18, false, txOpts);
  await tx.wait();
  tx = await contract.addQuestion(2, ethers.id("E1"), 0, 1, 10, "Job satisfaction (1-10)", txOpts);
  await tx.wait();
  tx = await contract.addQuestion(2, ethers.id("E2"), 1, 0, 1, "Recommend company?", txOpts);
  await tx.wait();
  tx = await contract.addQuestion(2, ethers.id("E3"), 0, 1, 5, "Work-life balance (1-5)", txOpts);
  await tx.wait();
  tx = await contract.activateSurvey(2, txOpts);
  await tx.wait();
  console.log("Survey #2 done!");

  console.log("Creating Survey #3...");
  tx = await contract.createSurvey(3, "Product Feedback", "Help us improve", 4, 30*24*60*60, 1000, 0, false, txOpts);
  await tx.wait();
  tx = await contract.addQuestion(3, ethers.id("P1"), 0, 1, 10, "UI rating (1-10)", txOpts);
  await tx.wait();
  tx = await contract.addQuestion(3, ethers.id("P2"), 2, 1, 4, "Priority: 1=Staking 2=NFT 3=Gov 4=Analytics", txOpts);
  await tx.wait();
  tx = await contract.addQuestion(3, ethers.id("P3"), 1, 0, 1, "Used similar products?", txOpts);
  await tx.wait();
  tx = await contract.addQuestion(3, ethers.id("P4"), 4, 1, 5, "Regulation sentiment (1-5)", txOpts);
  await tx.wait();
  tx = await contract.activateSurvey(3, txOpts);
  await tx.wait();
  console.log("Survey #3 done!");

  console.log("Creating Survey #4...");
  tx = await contract.createSurvey(4, "Privacy Survey", "Your privacy preferences", 3, 21*24*60*60, 300, 18, false, txOpts);
  await tx.wait();
  tx = await contract.addQuestion(4, ethers.id("S1"), 0, 1, 10, "Privacy importance (1-10)", txOpts);
  await tx.wait();
  tx = await contract.addQuestion(4, ethers.id("S2"), 1, 0, 1, "Use hardware wallet?", txOpts);
  await tx.wait();
  tx = await contract.addQuestion(4, ethers.id("S3"), 2, 1, 4, "Tech: 1=ZK 2=FHE 3=MPC 4=TEE", txOpts);
  await tx.wait();
  tx = await contract.activateSurvey(4, txOpts);
  await tx.wait();
  console.log("Survey #4 done!");

  console.log("\n=== ALL DONE ===");
  console.log("Contract:", address);
}

main().catch(console.error);
