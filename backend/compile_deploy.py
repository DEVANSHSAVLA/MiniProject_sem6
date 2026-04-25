import os
from dotenv import load_dotenv
from web3 import Web3
import solcx
import json

# Load environment variables
load_dotenv()

# Install specific solc version
print("Installing solc 0.8.0...")
solcx.install_solc('0.8.0')
solcx.set_solc_version('0.8.0')

# Web3 setup
PROVIDER_URL = os.getenv("WEB3_PROVIDER_URI", "http://127.0.0.1:7545")
w3 = Web3(Web3.HTTPProvider(PROVIDER_URL))

ganache_connected = w3.is_connected()
if not ganache_connected:
    print("Warning: Failed to connect to Ganache! Will only compile ABI.")

private_key = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
wallet_address = os.getenv("BLOCKCHAIN_WALLET_ADDRESS")

# Compile contract
contract_file = "contracts/AIChainGuard.sol"
with open(contract_file, "r") as f:
    contract_source = f.read()

print("Compiling contract...")
compiled_sol = solcx.compile_source(
    contract_source,
    output_values=["abi", "bin"]
)

# Get the contract interface
contract_id, contract_interface = compiled_sol.popitem()
abi = contract_interface['abi']
bytecode = contract_interface['bin']

# Save ABI
abi_path = "contracts/abi/AIChainGuard.json"
os.makedirs(os.path.dirname(abi_path), exist_ok=True)
with open(abi_path, "w") as f:
    json.dump(abi, f, indent=2)
print(f"Saved ABI to {abi_path}")

# Deploy
if ganache_connected:
    print("Deploying contract...")
    AIChainGuard = w3.eth.contract(abi=abi, bytecode=bytecode)

    # Build transaction
    nonce = w3.eth.get_transaction_count(wallet_address)
    tx = AIChainGuard.constructor().build_transaction({
        'chainId': 1337,
        'gas': 3000000,
        'gasPrice': w3.to_wei('20', 'gwei'),
        'nonce': nonce,
    })

    # Sign and send
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key)
    try:
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    except AttributeError:
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    try:
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        contract_address = tx_receipt.contractAddress
        print(f"Contract successfully deployed at: {contract_address}")
        
        # Update .env
        with open(".env", "r") as f:
            env_lines = f.readlines()
            
        with open(".env", "w") as f:
            for line in env_lines:
                if line.startswith("BLOCKCHAIN_CONTRACT_ADDRESS="):
                    f.write(f"BLOCKCHAIN_CONTRACT_ADDRESS={contract_address}\n")
                else:
                    f.write(line)
        print("Updated .env file with new BLOCKCHAIN_CONTRACT_ADDRESS")
    except Exception as e:
        print(f"Error waiting for receipt: {e}")
else:
    print("Ganache not connected. Saved ABI but skipping deployment.")
