import { HardhatRuntimeEnvironment } from 'hardhat/types';

export let HardHatEnv: HardhatRuntimeEnvironment;

export const setHardHatEnv = (_env: HardhatRuntimeEnvironment) => {
    HardHatEnv = _env;
};

export const sleep = (milliseconds: number) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds, []));
};