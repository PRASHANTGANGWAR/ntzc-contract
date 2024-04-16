### Initializing the Contract
The NTZC contract includes an initialize function that invokes __LERC20_init. This function requires the address of the lossless contract, which is already deployed by with community.

## Set this address into NTZC smart contract:
    For deployment on bsctestnet, use the address: 0xDBB5125CEEaf7233768c84A5dF570AeECF0b4634
    For deployment on mainnet, use the address: 0xe91D7cEBcE484070fc70777cB04F7e2EfAe31DB4

## Prerequisites
    Node.js
    Hardhat

## Install dependencies:
   npm install

### env setup:
   The project directory contains the .envExample file. Create a similar file named .env and populate it with the required keys.

#### Deployment

## Run the deployment script:
    npx hardhat run scripts/deploy.js


## Deploy on specific network:
    npx hardhat run scripts/deploy.js --network networkName
    
#### Additional Commands

## Run tests:
    npx hardhat test

## Generate gas reports during testing:
    REPORT_GAS=true npx hardhat test

## Spin up a local node:
    npx hardhat node




