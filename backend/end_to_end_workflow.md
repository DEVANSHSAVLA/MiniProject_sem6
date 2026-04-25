# AI Chain Guard: End-to-End Blockchain Workflow

This document explains the complete, production-quality lifecycle of how an AI Model or Dataset is secured using the Ganache/Web3.py infrastructure.

## Step 1: User Upload (FastAPI Endpoint)
A researcher or engineer (e.g., `dr.chen`) uploads an AI model file (e.g., a `.h5` or `.pkl` weight file) or a Training Dataset via the FastAPI backend endpoint `POST /register-model`.

## Step 2: Content Hashing
Before any data is moved to the database, the backend invokes `hashing.py`.
The `hash_model(file_path)` function streams the large AI payload file in chunks (to prevent RAM exhaustion) and generates a unique, deterministic SHA-256 cryptographic hash (e.g., `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`).

## Step 3: Relational Storage (PostgreSQL)
The structural metadata of the model (Name, Framework, Size, Accuracy, Version, Owner ID, and the newly generated `model_hash`) is immediately securely inserted into the PostgreSQL `AIModel` table. 
*Note: The actual multi-gigabyte files are stored in a secure cloud bucket or local NAS, mapped by the PostgreSQL database.*

## Step 4: Immutable Ledger Commit (Web3 & Ganache)
The backend simultaneously triggers `blockchain_web3.py`.
1. The script securely loads the Ganache wallet private key from the `.env` file.
2. It constructs a transaction to call the Solidity `registerModel(string modelHash)` function on the deployed `AIChainGuard` smart contract.
3. The transaction is signed and sent to `http://127.0.0.1:7545`.
4. The Ganache Ethereum node mines the block, permanently etching the `model_hash` into the immutable blockchain.
5. The `transaction_hash` of this Ethereum event is returned to FastAPI and saved sequentially in the PostgreSQL database table alongside the model metadata for cross-referencing.

## Step 5: Threat Detection & Security Event Logging
When the Isolation Forest machine learning model actively monitors API traffic and detects a high-severity DoS attack or Model Extraction attempt:
1. It physically drops the connection/IP.
2. It generates a SHA-256 hash of the attacker's metadata.
3. It triggers `store_security_event(hash)` to instantly write this security incident to the Ethereum Blockchain, creating a tamper-proof forensic audit trail of the attack.

## Step 6: Frontend SOC Dashboard Verification
When an administrator views the SOC Dashboard, the frontend queries the database.
To prevent database manipulation (insider threats), the backend can run a `Verification Check`, querying the smart contract directly via Web3's `getModel(id)` view function. If the database hash does not perfectly match the blockchain hash, the dashboard flags the asset as **COMPROMISED**.
