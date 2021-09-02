import { ethers } from "hardhat";
import { HashRateStore__factory } from "../types/factories/HashRateStore__factory";
import { HashRateStore } from "../types/HashRateStore";

async function main() {
  let address = "0x06afa4aCf058F1925A0E7dEb28FE70B503b2F02C";
  const accounts = await ethers.getSigners();
  const store = await HashRateStore__factory.connect(
    address, 
    accounts[0]
  ) as HashRateStore;

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

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });