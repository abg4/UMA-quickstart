import { getContractFactory, utf8ToHex, hre } from "../utils";
import { proposalLiveness, zeroRawValue, identifier } from "../constants";
import { interfaceName } from "@uma/common";

export const umaEcosystemFixture = hre.deployments.createFixture(async ({ ethers }) => {
  const [deployer] = await ethers.getSigners();

  // Deploy the UMA ecosystem contracts.
  const timer = await (await getContractFactory("Timer", deployer)).deploy();
  const finder = await (await getContractFactory("Finder", deployer)).deploy();
  const collateralWhitelist = await (await getContractFactory("AddressWhitelist", deployer)).deploy();
  const identifierWhitelist = await (await getContractFactory("IdentifierWhitelist", deployer)).deploy();
  const store = await (await getContractFactory("Store", deployer)).deploy(zeroRawValue, zeroRawValue, timer.address);
  const mockOracle = await (
    await getContractFactory("MockOracleAncillary", deployer)
  ).deploy(finder.address, timer.address);
  const optimisticOracle = await (
    await getContractFactory("OptimisticOracle", deployer)
  ).deploy(proposalLiveness, finder.address, timer.address);

  // Set all the contracts within the finder.
  await finder.changeImplementationAddress(utf8ToHex(interfaceName.CollateralWhitelist), collateralWhitelist.address);
  await finder.changeImplementationAddress(utf8ToHex(interfaceName.IdentifierWhitelist), identifierWhitelist.address);
  await finder.changeImplementationAddress(utf8ToHex(interfaceName.Store), store.address);
  await finder.changeImplementationAddress(utf8ToHex(interfaceName.OptimisticOracle), optimisticOracle.address);
  await finder.changeImplementationAddress(utf8ToHex(interfaceName.Oracle), mockOracle.address);

  // Set up other required UMA ecosystem components.
  await identifierWhitelist.addSupportedIdentifier(identifier);

  return { timer, finder, collateralWhitelist, identifierWhitelist, store, optimisticOracle, mockOracle };
});

module.exports.tags = ["UmaEcosystem"];
