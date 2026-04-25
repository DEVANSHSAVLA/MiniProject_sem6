# AI Chain Guard: Contract Deployment Guide

This guide provides step-by-step instructions on compiling, deploying, and extracting the application binary interface (ABI) for the `AIChainGuard.sol` smart contract using Ganache and the Remix IDE.

## Prerequisites
1. **Ganache:** Run Ganache and create a local workspace. 
   - **RPC Server:** `HTTP://127.0.0.1:7545`
   - **Network ID:** `1337`
2. **MetaMask:** Install the MetaMask browser extension.

---

## 1. Connecting MetaMask to Ganache
1. Open MetaMask, click the network dropdown at the top, and select **Add Network**.
2. Click **Add a network manually** and enter the following details:
   - **Network Name:** Ganache Local
   - **New RPC URL:** `http://127.0.0.1:7545`
   - **Chain ID:** `1337`
   - **Currency Symbol:** `ETH`
3. Click **Save** and switch to this newly created network.
4. **Import Account:**
   - Open Ganache and click the "Key" icon next to any of the generated accounts to reveal its **Private Key**.
   - Copy the Private Key.
   - In MetaMask, click on your account icon at the top right, select **Import Account**, paste the private key, and click **Import**. You should now have an account with 100 fake ETH ready for gas fees.

---

## 2. Using Remix IDE to Compile
1. Open [Remix IDE](https://remix.ethereum.org/).
2. In the "File Explorer" tab (left sidebar), create a new file named `AIChainGuard.sol`.
3. Paste the complete Solidity code from the `backend/contracts/AIChainGuard.sol` file in this repository into the Remix editor.
4. Navigate to the **Solidity Compiler** tab (second icon on the left).
5. Ensure the compiler version is set to `0.8.0` (or the version matching `pragma solidity ^0.8.0;`).
6. Click the **Compile AIChainGuard.sol** button. Check for the green success checkmark.

---

## 3. Deploying the Contract
1. Navigate to the **Deploy & Run Transactions** tab (third icon on the left).
2. Under the **ENVIRONMENT** dropdown, select **Injected Provider - MetaMask**.
   * MetaMask will prompt you to connect your account to Remix. Approve the connection.
   * Ensure that Remix shows your imported Ganache account address and your ~100 ETH balance.
3. Under the **CONTRACT** dropdown, ensure **AIChainGuard - AIChainGuard.sol** is selected.
4. Click the orange **Deploy** button.
5. MetaMask will pop up asking you to confirm the transaction (to pay the gas fee for deploying the contract). Click **Confirm**.
6. Wait a few seconds for the transaction to be mined.

---

## 4. Extracting the Contract Details (Important for Backend)

You need two pieces of information to connect your Python backend to this deployed contract.

### A. The Contract Address
1. In Remix, at the bottom of the "Deploy & Run Transactions" tab, look under **Deployed Contracts**.
2. Expand your newly deployed `AIChainGuard` contract.
3. Click the **Copy** icon next to the contract name to copy its address.
4. Paste this address into your `backend/.env` file as `BLOCKCHAIN_CONTRACT_ADDRESS`.

### B. The Contract ABI (Application Binary Interface)
1. Go back to the **Solidity Compiler** tab.
2. At the very bottom of the compiler pane, click the small **ABI** button (next to 'Bytecode') to copy the JSON definition of the contract.
3. Paste this entire JSON array into a new file located at `backend/contracts/abi/AIChainGuard.json`.

---

Your Ethereum smart contract is now successfully deployed to Ganache, and your backend is ready to interface with it using Web3.py!
