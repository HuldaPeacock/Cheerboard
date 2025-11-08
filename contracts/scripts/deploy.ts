import { ethers, artifacts, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const factory = await ethers.getContractFactory("CheersBoard");
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log("CheersBoard deployed at:", addr);

  // Write a minimal deployments json for frontend genabi script
  const net = await ethers.provider.getNetwork();
  const chainId = Number(net.chainId);
  const chainName = network.name;
  const outdir = path.resolve(__dirname, "..", "deployments", chainName);
  fs.mkdirSync(outdir, { recursive: true });
  const artifact = await artifacts.readArtifact("CheersBoard");
  fs.writeFileSync(
    path.join(outdir, "CheersBoard.json"),
    JSON.stringify({ abi: artifact.abi, address: addr, chainId, chainName }, null, 2),
    "utf-8"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


