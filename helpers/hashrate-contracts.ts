import { BytesLike } from "ethers";
import { getFirstSigner, getEthersSigners } from "./contracts-deploy";
import { verifyEtherscanContract } from "./etherscan-verification"
import {
    HashRateStore,
    HashRateStore__factory,
    RewardPool,
    RewardPool__factory,
    ProxyAdmin,
    ProxyAdmin__factory,
    TransparentUpgradeableProxy,
    TransparentUpgradeableProxy__factory,
    IERC20PresetMinterPauser,
    IERC20PresetMinterPauser__factory
} from "../types";

export const deployHashRateStore = async ():Promise<HashRateStore> => {
    const factory = new HashRateStore__factory(await getFirstSigner());
    const contract = await factory.deploy();
    await verifyEtherscanContract(contract.address, []);
    return contract;
};

export const connectHashRateStore = async (
    address: string,
    accountIndex = 0
) : Promise<HashRateStore> => {
    return await HashRateStore__factory.connect(
        address, 
        await (await getEthersSigners())[accountIndex]
      );
}

export const deployRewardPool = async ():Promise<RewardPool> => {
    const factory = new RewardPool__factory(await getFirstSigner());
    const contract = await factory.deploy();
    await verifyEtherscanContract(contract.address, []);
    return contract;
}

export const connectRewardPool = async (
    address: string,
    accountIndex = 0
) : Promise<RewardPool> => {
    return await RewardPool__factory.connect(
        address, 
        await (await getEthersSigners())[accountIndex]
      );
}

export const deployProxyAdmin = async ():Promise<ProxyAdmin> => {
    const factory = new ProxyAdmin__factory(await getFirstSigner());
    const contract = await factory.deploy();
    await verifyEtherscanContract(contract.address, []);
    return contract;
}

export const connectProxyAdmin = async (
    address: string,
    accountIndex = 0
) : Promise<ProxyAdmin> => {
    return await ProxyAdmin__factory.connect(
        address, 
        await (await getEthersSigners())[accountIndex]
      );
}

export const deployTransparentUpgradeableProxy = async (
    logic: string,
    admin: string,
    data: BytesLike
):Promise<TransparentUpgradeableProxy> => {
    const factory = new TransparentUpgradeableProxy__factory(await getFirstSigner());
    const contract = await factory.deploy(logic, admin, data);
    await verifyEtherscanContract(contract.address, []);
    return contract;
}

export const connectTransparentUpgradeableProxy = async (
    address: string,
    accountIndex = 0
) : Promise<TransparentUpgradeableProxy> => {
    return await TransparentUpgradeableProxy__factory.connect(
        address, 
        await (await getEthersSigners())[accountIndex]
      );
}

export const connectIERC20PresetMinterPauser = async (
    address: string,
    accountIndex = 0
) : Promise<IERC20PresetMinterPauser> => {
    return await IERC20PresetMinterPauser__factory.connect(
        address, 
        await (await getEthersSigners())[accountIndex]
      );
}

//too token minter
export const storePrepare = async (
    address: string,
    hashrateToken: string,
    spreadToken: string
) : Promise<void> => {
    const hashRate = connectIERC20PresetMinterPauser(hashrateToken);
    const spread = connectIERC20PresetMinterPauser(spreadToken);
    const hsTX = (await hashRate).grantRole((await (await hashRate).MINTER_ROLE()), address);
    (await hsTX).wait(1);
    const spreadTX = (await spread).grantRole((await (await spread).MINTER_ROLE()), address);
    (await spreadTX).wait(1);
}

export const showStore = async (address: string) : Promise<void> => {
  const store = await HashRateStore__factory.connect(
    address,
    await getFirstSigner()
  );

  const hashrateBudgets = await store.getBudgetHashRate();
  const spreadBudgets = await store.getBudgetSpread();
  console.log(
    "contract:        %s\nname:            %s\nrecipient:       %s\nhashrate token:  %s\nspread token:    %s\nUSDT:            %s\nhashrate budget: %s-%s\nspread budget:   %s-%s\nhashrate price:  %s\nreserve:         %s\nspread percent:  %d\n",
    address,
    await store.name(),
    await store.recipient(),
    await store.tokenHashRate(),
    await store.tokenSpread(),
    await store.tokenUnderlying(),
    hashrateBudgets[0].toString(),
    hashrateBudgets[1].toString(),
    spreadBudgets[0].toString(),
    spreadBudgets[1].toString(),
    await (await store.priceHashRate()).toString(),
    await (await store.reserveHashRate()).toString(),
    await store.percentSpread(),
  );
}

export const showRewardPool = async (address: string) : Promise<void> => {
  const pool = await RewardPool__factory.connect(
    address,
    await getFirstSigner()
  );
  console.log("contract:  %s@%s", await pool.name(), address);
  console.log("reward:    %s", await pool.rewardToken());
  console.log("lockToken: %s", await pool.lockToken());
  console.log("LendingPool: %s", await pool.lendingPool());
  console.log("duration:  %s", await (await pool.duration()).toString());
}