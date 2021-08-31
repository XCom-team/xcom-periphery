import { HardHatEnv } from "./utils";
import { Contract, Signer, ContractTransaction } from 'ethers';
import { verifyEtherscanContract } from "./etherscan-verification"

export const waitForTx = async (tx: ContractTransaction) => await tx.wait(1);

export const getEthersSigners = async () : Promise<Signer[]> => {
    const ethersSigners = await Promise.all(await HardHatEnv.ethers.getSigners());
    return ethersSigners;
}

export const getFirstSigner = async () => (await getEthersSigners())[0];

export const deployContract = async <ContractType extends Contract>(
    contractName: string,
    args: any[],
    verify?: boolean
): Promise<ContractType> => {
    const contract = (await (await HardHatEnv.ethers.getContractFactory(contractName))
        .connect(await getFirstSigner())
        .deploy(...args)) as ContractType;
    await waitForTx(contract.deployTransaction);
    console.log("Contract ", contractName, " deploy @ ", contract.address);
    if (verify) {
        await verifyEtherscanContract(contract.address, args);
    }
    return contract;
};

export const getContract = async <ContractType extends Contract>(
    contractName: string,
    address: string
): Promise<ContractType> => (await HardHatEnv.ethers.getContractAt(contractName, address)) as ContractType;