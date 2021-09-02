import { HardhatRuntimeEnvironment } from 'hardhat/types';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

export let HardHatEnv: HardhatRuntimeEnvironment;

export const setHardHatEnv = (_env: HardhatRuntimeEnvironment) => {
    HardHatEnv = _env;
};

export const sleep = (milliseconds: number) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds, []));
};

export const getDb = () => low(new FileSync('./deployed-contracts.json'));