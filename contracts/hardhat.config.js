require("@nomicfoundation/hardhat-toolbox");

const config = {
  solidity: {
    version: "0.8.30",
    settings: {
      evmVersion: "istanbul",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {
      // The BITE CallbackSender mock requires balance >= GAS_LIMIT * tx.gasprice
      // before delivering a callback. Zeroing the base fee lets tests trigger
      // callbacks deterministically without pre-funding each ephemeral sender.
      initialBaseFeePerGas: 0,
    },
    biteSandbox: {
      url: process.env.ENDPOINT || "https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 103698795,
    },
  },
  dependencyCompiler: {
    paths: [
      "@skalenetwork/bite-solidity/test/BiteMock.sol",
      "@skalenetwork/bite-solidity/test/EncryptECIESMock.sol",
      "@skalenetwork/bite-solidity/test/EncryptTEMock.sol",
      "@skalenetwork/bite-solidity/test/SubmitCTXMock.sol",
      "@skalenetwork/bite-solidity/test/CallbackSender.sol",
      "@skalenetwork/bite-solidity/test/PrecompiledMock.sol",
    ],
    keep: true,
  },
};

module.exports = config;
