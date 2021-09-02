import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';

require('dotenv').config();

const path = require('path');
const secretKey = process.env.SECRETKEY || '';
const secretTest = process.env.SECRETKEYTEST || '';
const SKIP_LOAD = process.env.SKIP_LOAD === 'true';

require(`${path.join(__dirname, 'tasks')}/deploy.ts`);
require(`${path.join(__dirname, 'tasks')}/access.ts`);

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

export default {
  solidity: "0.8.4",
  defaultNetwork: "hecotest",
  networks: {
    hardhat: {},
    hecotest: {
      chainId: 256,
      url: "https://http-testnet.hecochain.com",
      accounts: [secretTest],
      gas: 21000,
      gasPrice: 1000000000,
    },
    heco: {
      chainId: 128,
      url: "https://http-mainnet-node.huobichain.com",
      accounts:[secretKey],
      gas: 960000,
      gasPrice: 2250000000,
    }
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};