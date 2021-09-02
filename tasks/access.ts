import { setHardHatEnv } from "../helpers/utils"
import { task } from "hardhat/config";
import { showRewardPool, stakeRewardPool, withdrawRewardPool } from "../helpers/hashrate-contracts";

task("showpool", "get reward pool parameters")
    .addParam("address", "RewardPool contract address")
    .setAction(async (args, hre) => {
        setHardHatEnv(hre);
        //console.log(args.address);
        await showRewardPool(args.address);
    });

task("stake", "stake in reward pool")
    .addParam("address", "RewardPool contract address")
    .addParam("amount", "stake amount", "0")
    .setAction(async (args, hre) => {
        setHardHatEnv(hre);
        await stakeRewardPool(args.address, args.amount);
    });

task("withdraw", "withdraw from rewardpool")
    .addParam("address", "RewardPool contract address")
    .addParam("amount", "stake amount", "0")
    .setAction(async (args, hre) => {
        setHardHatEnv(hre);
        await withdrawRewardPool(args.address, args.amount);
    });