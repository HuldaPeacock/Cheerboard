import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("Deploying CheersBoard...");
  await deploy("CheersBoard", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
  log("CheersBoard deployed.");
};

export default func;
func.tags = ["CheersBoard"];


