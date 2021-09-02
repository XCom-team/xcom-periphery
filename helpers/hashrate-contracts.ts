import { BigNumberish, BytesLike, Signer } from "ethers";
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
import { HttpNetworkAccountsConfig } from "hardhat/types";
import { poll } from "ethers/lib/utils";

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
    console.log("contract:         %s @ %s", await store.name(), address);
    console.log("recipient:        %s", await store.recipient());
    console.log("hashrate token:   %s", await store.tokenHashRate());
    console.log("spread token:     %s", await store.tokenSpread());
    console.log("underlying token: %s", await store.tokenUnderlying());
    console.log("hashrate budget:  %s-%s", hashrateBudgets[0].toString(), hashrateBudgets[1].toString());
    console.log("spread budget:    %s-%s", spreadBudgets[0].toString(), spreadBudgets[1].toString());
    console.log("hashrate price:   %s", (await store.priceHashRate()).toString());
    console.log("hashrate reserve: %s", (await store.reserveHashRate()).toString());
    console.log("spread percent:   %s", await store.percentSpread());
}

export const showRewardPool = async (address: string) : Promise<void> => {
    const pool = await RewardPool__factory.connect(
        address,
        await getFirstSigner()
    );
    console.log("contract:             %s @ %s", await pool.name(), address);
    console.log("reward:               %s", await pool.rewardToken());
    console.log("lockToken:            %s", await pool.lockToken());
    console.log("LendingPool:          %s", await pool.lendingPool());
    console.log("duration:             %s", (await pool.duration()).toString());
    console.log("total stake:          %s", (await pool.totalSupply()).toString());
    console.log("rewardPerTokenStored: %s", (await pool.rewardPerTokenStored()).toString());
    console.log("lastUpdateTime:       %s", (await pool.lastUpdateTime()).toString());
    console.log("rewardRate:           %s", (await pool.rewardRate()).toString());
    console.log("periodFinish:         %s", (await pool.periodFinish()).toString());
    console.log("budgetTotal:          %s", (await pool.budgetTotal()).toString());
}

export const accountInPool = async (account: string, rewardpool: string) : Promise<void> => {
    const pool = RewardPool__factory.connect(
        rewardpool,
        await getFirstSigner()
    );

    console.log("earned: %s", await pool.earned(account));
    console.log("staked: %s", await pool.balanceOf(account));
}

export const stakeRewardPool = async (address: string, amount: BigNumberish) : Promise<void> => {
    const account = await getFirstSigner();
    const pool = RewardPool__factory.connect(
        address,
        account
    );

    if (amount > 0) {
        const tx = pool.stake(amount);
        (await tx).wait(1);
    }
    await accountInPool(await account.getAddress(), address);
}

export const withdrawRewardPool = async (address: string, amount: BigNumberish) : Promise<void> => {
    const account = await getFirstSigner();
    const pool = RewardPool__factory.connect(
        address,
        account
    );
    (await pool.withdraw(amount)).wait(1);
    await accountInPool(await account.getAddress(), address);
}