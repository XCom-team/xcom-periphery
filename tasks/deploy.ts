import { task } from "hardhat/config";
import { deployContract, getContract } from "../helpers/contracts-deploy";
import { setHardHatEnv } from "../helpers/utils";
import { storePrepare, showStore, showRewardPool, connectProxyAdmin, connectRewardPool } from "../helpers/hashrate-contracts";

type tplotOptions = {
    [key: string]: string
}

const FIL: tplotOptions = {
    hecotest: "0x58BBCE4CB3e17c7984e9E3c22337396f1b5D552E",
    heco: "0xae3a768f9aB104c69A7CD6041fE16fFa235d1810",
}

const XFT: tplotOptions = {
    hecotest: "0xFCc001EA1b967267d5b80635966E03B7FA0F7C5c",
    heco: "0x5A73932e0A5653E6B9ef0d71e53Ec2c35b3F4a32",
}

const XFTI: tplotOptions = {
    hecotest: "0x8A6509E5D1605Dd17085b7eb22d43E9C6De5E379",
    heco: "0x9671757040b0AF0a3d28CE461036F2Ece9E0916B",
}

//usdt
const USDT: tplotOptions = {
    hecotest: "0x480Ab667389A6a2Fb12c8B1622003a119Cc91991",
    heco: "0xa71EdC38d189767582C38A3145b5873052c3e47a",
}

const RECIPIENT: tplotOptions = {
    hecotest: "0x43295489e915225AAa8F83967F67B056A3279347"
}

const LENDINGPOOL: tplotOptions = {
    hecotest: "0x074Dd89fBEb91C6D3C248390E091cbd02CdB1B9c",
    heco: "0x1BeB0e1d334a5289b235a4bdF8CA54146627A11a"
}

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
/*task("accounts", "Prints the list of accounts", async (args, hre) => {
    const accounts = await hre.ethers.getSigners();
  
    for (const account of accounts) {
        console.log(await account.address);
    }
    console.log(hre.network.name);
});*/
  
task("testenv", "Prints process.env", async (args, hre) => {
    const _env = process.env;
    console.log(_env);
});

task("hashratestore", "Deploy store proxy", async (args, hre) => {
    setHardHatEnv(hre);
    const network = hre.network.name;
    /*const store = await hre.ethers.getContractFactory("HashRateStore");
    const para = [RECIPIENT[network], XFT[network], XFTI[network], USDT[network], 1048576, "500000000000000000", 3];
    const storeProxy = await hre.upgrades.deployProxy(store, para);
    await storeProxy.deployed();
    console.log("HashRate Store proxy deployed @ ", storeProxy.address);*/
    const store = deployContract("HashRateStore", [], true);
    const _logic = (await store).address;
    const proxyAdmin = deployContract("ProxyAdmin", [], true);
    const _admin = (await proxyAdmin).address;
    //const storeLogic = "0x0E6A5BAf9674327fEDFD8FC3ea73B2b01008b75A";
    //const store = getContract("HashRateStore", storeLogic);
    //const admin = "0x546468C4569B7b87Fe4b76E1F386Cf15c03a8cF8";
    const para = [RECIPIENT[network], XFT[network], XFTI[network], USDT[network], 1048576, "500000000000000000", 3];
    const storeEncodedInitialize = (await store).interface.encodeFunctionData('initialize', para);
    //console.log("para = %s\nabi = %s\n", para, storeEncodedInitialize);
    const storeProxy = deployContract("TransparentUpgradeableProxy",[_logic, _admin, storeEncodedInitialize],true);
    const _proxy = (await storeProxy).address;
    await storePrepare(_proxy, XFT[network], XFTI[network]);
    console.log(
        "Contract HashRate Store\nlogic: %s\nadmin: %s\nproxy: %s\n",
        _logic,
        _admin,
        _proxy
    );
    showStore(_proxy);
});

task("rewardpool", "Deploy reward pool & proxy", async (args, hre) => {
    setHardHatEnv(hre);
    const network = hre.network.name;
    const logicContract = deployContract("RewardPool", [], true);
    const logic = (await logicContract).address;
    
    //const adminXFT = (await deployContract("ProxyAdmin", [], true)).address;
    //const adminXFTI = (await deployContract("ProxyAdmin", [], true)).address;
    const admin = "0xE89c1EC76CD30B05c24C13d2020BC6ed77279ccb";
    const xftPara = ["XFT Reward Pool", FIL[network], XFT[network], LENDINGPOOL[network],604800];
    const xftEncodedInitialize = (await logicContract).interface.encodeFunctionData('initialize', xftPara);
    const xftiPara = ["XFTI Reward Pool", FIL[network], XFTI[network], LENDINGPOOL[network], 604800];
    const xftiEncodedInitialize = (await logicContract).interface.encodeFunctionData('initialize', xftiPara);
    const xftProxy = deployContract("TransparentUpgradeableProxy",[logic, admin, xftEncodedInitialize], true);
    const proxyXFT = (await xftProxy).address;
    const xftiProxy = deployContract("TransparentUpgradeableProxy",[logic, admin, xftiEncodedInitialize], true);
    const proxyXFTI = (await xftiProxy).address;
    
    console.log("Reward Pool\n\tContract Logic deployed @ %s\n", logic);
    console.log("\tContract admin deployed @ %s", admin);
    console.log("XFT\n\tContract proxy deployed @ %s\n", proxyXFT);
    console.log("XFTI\n\tContract proxy deployed @ %s\n", proxyXFTI);
    showRewardPool(proxyXFT);
    showRewardPool(proxyXFTI);
})

task("updatestore", "Update store logic", async (args, hre) => {
    setHardHatEnv(hre);
    const network = hre.network.name;
    const admin = "0x546468C4569B7b87Fe4b76E1F386Cf15c03a8cF8";
    const proxy = "0xA029a96BFBb686AB742FD9C67fEe11e80E77F48C";
    const proxyAdmin = await connectProxyAdmin(admin);
    console.log(await proxyAdmin.owner());

    const store = deployContract("HashRateStore", [], true);
    await proxyAdmin.upgrade(proxy, (await store).address);
    const logic = await proxyAdmin.getProxyImplementation(proxy);
    console.log("store logic update to %s\n", logic);
});

task("updatepool", "Update RewaordPool logic", async (args, hre) => {
    setHardHatEnv(hre);
    const admin = "0xE89c1EC76CD30B05c24C13d2020BC6ed77279ccb";
    const proxyXFT = "0xa0ad6fA217A5CFFC89257691E397b4e550988bb1";
    const proxyXFTI = "0x60A7f76A9C3F1E1fd611e92c0cdFe184A4c37a69";

    const logicContract = deployContract("RewardPool", [], true);
    const logic = (await logicContract).address;
    await (await connectProxyAdmin(admin)).upgrade(proxyXFT, logic);
    await (await connectProxyAdmin(admin)).upgrade(proxyXFTI, logic);
});