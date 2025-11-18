import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "CheersBoard";

// contracts deployments dir
const rel = "../contracts";
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const deploymentsDir = path.join(dir, "deployments");

function ensureLocalhost() {
  if (!fs.existsSync(path.join(deploymentsDir, "localhost"))) {
    // try auto-deploy (if not on windows)
    if (process.platform !== "win32") {
      try {
        execSync(`npm run deploy:localhost`, {
          cwd: path.resolve(rel),
          stdio: "inherit",
        });
      } catch (e) {
        console.error("Auto deploy localhost failed", e?.message);
      }
    }
  }
}

ensureLocalhost();

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);
  if (!fs.existsSync(chainDeploymentDir)) {
    if (!optional) {
      console.error(`Missing deployments for ${chainName}. Please deploy first.`);
      process.exit(1);
    }
    return undefined;
  }
  const jsonString = fs.readFileSync(
    path.join(chainDeploymentDir, `${contractName}.json`),
    "utf-8"
  );
  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;
  return obj;
}

const deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, false);
let deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true);
if (!deploySepolia) {
  deploySepolia = { abi: deployLocalhost.abi, address: "0x0000000000000000000000000000000000000000" };
}

const tsCode = `
/* Auto-generated. Run: npm run genabi */
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: deployLocalhost.abi }, null, 2)} as const;
`;
const tsAddresses = `
/* Auto-generated. Run: npm run genabi */
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${deployLocalhost.address}", chainId: 31337, chainName: "hardhat" },
};
`;

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}Addresses.ts`), tsAddresses, "utf-8");
console.log("ABI and addresses generated in ./abi");


