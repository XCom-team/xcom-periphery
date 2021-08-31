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
  console.log(
    "contract: %s\nname: %s\nrecipient: %s\nXFT: %s\n XFTI: %s\nUSDT: %s\nhashrate budget: %s-%s\nspread budget: %s-%s\nPrice: %s\nreserve: %s\nPercent: %d\n",
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

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });