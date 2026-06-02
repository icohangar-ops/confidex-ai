# Confidex AI — Deployment Addresses

## SKALE BITE V2 Sandbox
- **Chain ID**: 103698795
- **RPC**: https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox
- **Explorer**: https://base-sepolia-testnet-explorer.skalenodes.com:10032
- **Deployer**: 0xD1f413eF481e0b022b2eD795E6408bE21f59F976

## How to Deploy

1. Fund the deployer address with sFUEL on the BITE V2 Sandbox:
   - Visit https://faucet.skale.network/ and connect wallet
   - OR use the SKALE portal: https://portal.skale.network/
   - Select chain: BITE V2 Sandbox
   - Send sFUEL to: 0xD1f413eF481e0b022b2eD795E6408bE21f59F976

2. Set up environment:
   ```bash
   cd contracts
   cp .env.example .env
   # Edit .env with your private key and funded address
   ```

3. Deploy:
   ```bash
   npx hardhat run scripts/deploy.js --network biteSandbox
   ```

4. Verify on explorer:
   https://base-sepolia-testnet-explorer.skalenodes.com:10032/address/0xD1f413eF481e0b022b2eD795E6408bE21f59F976
