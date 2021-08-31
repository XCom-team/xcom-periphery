import { setHardHatEnv } from "../helpers/utils"
import { task } from "hardhat/config";
import { ProxyAdmin } from "../types/ProxyAdmin";
import { ProxyAdmin__factory } from "../types/factories/ProxyAdmin__factory";
import { HashRateStore } from "../types/HashRateStore";
import { HashRateStore__factory } from "../types/factories/HashRateStore__factory";
import { deployContract, getFirstSigner } from "../helpers/contracts-deploy"

task("updatestore", "Update store logic", async (args, hre) => {
    setHardHatEnv(hre);
    const network = hre.network.name;
    const admin = "0x546468C4569B7b87Fe4b76E1F386Cf15c03a8cF8";
    const proxy = "0xA029a96BFBb686AB742FD9C67fEe11e80E77F48C";
    const proxyAdmin = await ProxyAdmin__factory.connect(
        admin,
        await getFirstSigner()
    ) as ProxyAdmin;
    console.log(await proxyAdmin.owner());

    const store = deployContract("HashRateStore", [], true);
    await proxyAdmin.upgrade(proxy, (await store).address);
    const logic = await proxyAdmin.getProxyImplementation(proxy);
    console.log("store logic update to %s\n", logic)
})

/*task("storeState", "get hashrate store state")
    .addParam("address", "contract address")
    .setAction(async (args, hre) => {
        setHardHatEnv(hre);
        const store = await HashRateStore__factory.connect(
            args.address, 
            await getFirstSigner()
        ) as HashRateStore;

        const hashrateBudgets = await store.getBudgetHashRate();

        console.log(
            "contract: %s\nname: %s\nrecipient: %s\nXFT: %s\n XFTI: %s\nUSDT: %s\nhashrate budget: %s-%s\nPrice: %s\nreserve: %s\nPercent: %d\n",
            args.address,
            await store.name(),
            await store.recipient(),
            await store.tokenHashRate(),
            await store.tokenSpread(),
            await store.tokenUnderlying(),
            hashrateBudgets[0].toString(),
            hashrateBudgets[1].toString(),
            await (await store.priceHashRate()).toString(),
            await (await store.reserveHashRate()).toString(),
            await store.percentSpread(),
        );
    })*/