GemVault dApp - Build and Run Instructions
==========================================

This file explains how to set up and run the GemVault decentralised application locally.

GemVault is a blockchain-based dApp for managing diamond certification, ownership, grading, polishing, and stakeholder-based access. The frontend is built using React and connects to deployed smart contracts through MetaMask.

This application is only intended to be used by registered stakeholders. Each MetaMask wallet address must be registered with a stakeholder role before it can use the related functionality in the dApp.

## Architecture Overview

The GemVault project is organised into separate folders for the blockchain smart contracts, documentation, and the React frontend application.
## Public Repository

The public GitHub repository for this project is available at:

https://github.com/MattsoFattso/IFB542-BLOCKCHAIN-DIAMONDS

```text
NEWGEMVAULT [IFB542-BLOCKCHAIN-DIAMONDS]
│
├── contracts/
│   └── Contains the Solidity smart contracts used by the GemVault dApp.
│
├── docs/
│   └── Contains project documentation, design notes, diagrams, and supporting files.
│
├── frontend/
│   └── Contains the React frontend application used to interact with the deployed smart contracts.
│
│   ├── public/
│   │   └── Contains static public assets used by the React application.
│   │
│   ├── src/
│   │   ├── ContractData/
│   │   │   └── Stores smart contract ABIs and deployed contract address configuration files.
│   │   │
│   │   ├── css-pages/
│   │   │   └── Contains page-specific CSS styling files for the frontend interface.
│   │   │
│   │   ├── img/
│   │   │   └── Contains image assets used throughout the application.
│   │   │
│   │   ├── pages/
│   │   │   └── Contains the main React page components for each dApp screen.
│   │   │
│   │   ├── App.js
│   │   │   └── Main React component that controls the overall frontend application flow.
│   │   │
│   │   ├── index.js
│   │   │   └── Entry point for rendering the React application.
│   │   │
│   │   ├── App.css
│   │   │   └── Global styling for the main application.
│   │   │
│   │   └── index.css
│   │       └── Base styling for the React application.
│   │
│   ├── package.json
│   │   └── Defines frontend dependencies and npm scripts.
│   │
│   ├── package-lock.json
│   │   └── Locks installed dependency versions.


1. Required Software
====================

Before running the application, make sure the following are installed:

1. Node.js
----------

Node.js is required to run the React frontend and use npm commands.

Download Node.js from:

https://nodejs.org/

After installing Node.js, check that it installed correctly by opening a terminal and running:

node -v
npm -v

Both commands should return version numbers.

2. MetaMask
-----------

MetaMask is required to connect a browser wallet to the dApp.

Install MetaMask from:

https://metamask.io/

After installing MetaMask, make sure you are logged in and connected to the solidity test network being used by the deployed smart contracts. Also make sure you have enough Test Coin to run the application and perform transactions.


2. Project Folder
=================

The React frontend is located inside the frontend folder.

From the main project folder, you will need to move into the frontend folder before running the application.

Use:

cd frontend


3. Installing Dependencies
==========================

Before starting the application for the first time, install the required npm packages.

From the main project folder, run:

cd frontend
npm install

The npm install command may take some time because it downloads all required project dependencies.


4. Running the Application Locally
==================================

To run the application on localhost, run the following commands from the main project folder:

cd frontend
npm install
npm start

If npm install has already been run previously, you can usually just run:

cd frontend
npm start

After running npm start, the application should open automatically in your browser.

If it does not open automatically, go to:

http://localhost:3000


5. MetaMask and Stakeholder Setup
=================================

This dApp requires MetaMask to be connected before blockchain functionality can be used.

When the application opens:

1. Connect your MetaMask wallet.
2. Make sure MetaMask is on the correct blockchain network (SolidityTestNet).
3. Make sure the connected account has been registered as a stakeholder. This will require you to open to StakeHolderManagementContract using the address, and perform the registerStakeholder transaction with the relevant integer representing the role type.
4. Use the parts of the application that match the stakeholder role assigned to that account.

The dApp is only for registered stakeholders. If your MetaMask account has not been registered, the application may still open, but you may not be able to use role-specific functionality.

Each stakeholder role has different permissions.

For example:

- Miner accounts can use miner-related functionality: MintRoughDiamonds, ViewCollections and also Request for a diamond to be polished.
- Kimberley Certifier accounts can certify or reject rough diamonds.
- Grader or Polisher accounts can grade, polish, or process rough diamonds into polished diamonds.

To test different functionality types, you may need to use different MetaMask accounts. Each account must be requested to be added as the correct stakeholder type before it can use that part of the application.


6. Smart Contract Configuration
===============================

The frontend must be connected to the correct deployed smart contract addresses.

These addresses are usually stored in a configuration file inside the frontend source code, such as:

frontend/src/ContractData/ContractAddresses.js

The contract addresses in this file must match the deployed smart contracts.

If the smart contracts are redeployed, the frontend configuration must be updated with the new contract addresses.

If the contract addresses are incorrect, the application may still load, but blockchain transactions and contract reads may fail.


7. ABI Files
============

The frontend uses ABI files to communicate with the deployed smart contracts.

Make sure the ABI files are included in the correct frontend folder, usually something similar to:

frontend/src/ContractData/{ContractName}.json

The ABI files must match the smart contracts that were deployed.

If the ABI files do not match the deployed contracts, the frontend may not be able to call contract functions correctly.


8. Building the Application
===========================

To create a production build of the React application, run:

cd frontend
npm run build

This will create an optimised production version of the application inside:

frontend/build

The build folder can be used for deployment to a web server.


9. Available Commands
=====================

The following commands are used inside the frontend folder.

Install dependencies:

npm install

Start the local development server:

npm start

Build the application for production:

npm run build

Run tests:

npm test


10. Common Issues
=================

Issue: npm install takes a long time
-----------------------------------

This is normal the first time the project is installed. It downloads all required dependencies.

Issue: The app does not open automatically
-----------------------------------------

Manually open the browser and go to:

http://localhost:3000

Issue: MetaMask does not connect
--------------------------------

Check that:

- MetaMask is installed.
- MetaMask is unlocked.
- The correct account is selected.
- The browser has permission to connect to the site.
- You are on a network that allows blockchain transactions.
- The correct blockchain network is selected.

Issue: Transactions fail
------------------------

Check that:

- MetaMask is connected.
- The correct blockchain network is selected.
- The connected wallet has enough test currency for gas.
- The smart contract addresses are correct.
- The connected wallet has the required stakeholder role.
- The ABI files match the deployed smart contracts.

Issue: Role-specific functionality does not work
------------------------------------------------

This usually means the connected MetaMask account has not been registered as the required stakeholder type.

For example, if a Kimberley Certifier page is being used, the connected wallet must be registered as a Kimberley Certifier.

Issue: Contract data is not loading
-----------------------------------

Check that:

- The smart contracts are deployed.
- The frontend contract addresses are correct.
- The ABI files are correct.
- MetaMask is connected to the correct network.


11. Standard Setup Process
==========================

For a normal local setup, follow these steps:

1. Install Node.js.
2. Install MetaMask.
3. Open a terminal in the main project folder.
4. Run:

cd frontend
npm install
npm start

5. Open:

http://localhost:3000

6. Connect MetaMask.
7. Make sure the selected MetaMask account has been registered as the correct stakeholder type.
8. Use the dApp functionality available to that stakeholder role.


12. Important Notes
===================

This application depends on both the React frontend and the deployed blockchain smart contracts.

The frontend provides the user interface, but important actions such as minting, certifying, grading, polishing, and transferring diamonds are performed through smart contract transactions.

Because of this, the application requires:

- Node.js installed.
- npm dependencies installed.
- MetaMask installed and connected.
- Correct smart contract addresses configured.
- Correct ABI files included.
- A deployed blockchain contract system.
- A registered stakeholder wallet address.

If these requirements are not met, the application may load, but its blockchain functionality may not work correctly.


13. Quick Start
===============

Run the following commands from the main project folder:

cd frontend
npm install
npm start

Then open:

http://localhost:3000

Connect MetaMask and use an account that has been registered as the correct stakeholder type.
