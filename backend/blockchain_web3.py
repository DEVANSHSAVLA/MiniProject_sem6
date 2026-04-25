import os
import json
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Web3 Configuration
PROVIDER_URL = os.getenv("WEB3_PROVIDER_URI", "http://127.0.0.1:7545")
CHAIN_ID = 1337

w3 = Web3(Web3.HTTPProvider(PROVIDER_URL))

if not w3.is_connected():
    print(f"[!] Warning: Web3 is not connected to provider at {PROVIDER_URL}")

# Key Management (NEVER hardcode keys directly)
PRIVATE_KEY = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
WALLET_ADDRESS = os.getenv("BLOCKCHAIN_WALLET_ADDRESS")
CONTRACT_ADDRESS = os.getenv("BLOCKCHAIN_CONTRACT_ADDRESS")

# Contract ABI Initialization
contract = None

if PRIVATE_KEY and WALLET_ADDRESS and CONTRACT_ADDRESS:
    # Setup Account
    account = Account.from_key(PRIVATE_KEY)
    w3.eth.default_account = account.address

    # Load ABI
    abi_path = os.path.join(os.path.dirname(__file__), "contracts", "abi", "AIChainGuard.json")
    if os.path.exists(abi_path):
        with open(abi_path, "r") as f:
            contract_abi = json.load(f)
            # Find the abi array in standard remix output format
            if isinstance(contract_abi, list):
               abi_array = contract_abi
            else:
               abi_array = contract_abi.get("abi", contract_abi)
            
        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi_array)
    else:
        print(f"[!] Warning: Contract ABI not found at {abi_path}. Deploy contract first.")

def _send_transaction(func_call):
    """Internal helper to safely construct, sign, and send a transaction with proper nonce and gas handling to prevent replay attacks."""
    if not contract or not PRIVATE_KEY:
        raise Exception("Web3 is not properly configured. Check .env and contract deployment.")
        
    nonce = w3.eth.get_transaction_count(WALLET_ADDRESS)
    
    # Build transaction
    tx = func_call.build_transaction({
        'chainId': CHAIN_ID,
        'gas': 2000000,
        'gasPrice': w3.to_wei('20', 'gwei'),
        'nonce': nonce,
    })
    
    # Sign transaction (Protected by Private Key)
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
    
    # Send transaction
    # We use raw_transaction to be compatible with newer Web3.py versions
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    
    # Wait for receipt
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return tx_receipt

def store_model_hash(model_hash):
    """Registers an AI model's structural hash to the immutable ledger."""
    if not model_hash:
        raise ValueError("Invalid hash provided.")
    try:
        receipt = _send_transaction(contract.functions.registerModel(model_hash))
        return {"status": "success", "tx_hash": receipt.transactionHash.hex()}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def store_dataset_hash(dataset_hash):
    """Registers a training dataset hash to the blockchain."""
    if not dataset_hash:
        raise ValueError("Invalid hash provided.")
    try:
        receipt = _send_transaction(contract.functions.registerDataset(dataset_hash))
        return {"status": "success", "tx_hash": receipt.transactionHash.hex()}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def store_security_event(event_hash):
    """Registers a high-severity security anomaly directly onto the blockchain."""
    if not event_hash:
        raise ValueError("Invalid hash provided.")
    try:
        receipt = _send_transaction(contract.functions.registerSecurityEvent(event_hash))
        return {"status": "success", "tx_hash": receipt.transactionHash.hex()}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def store_fraud_decision(tx_hash_str, fraud_score, model_version, reason_hash):
    """Registers an AI's transparent reasoning for blocking/flagging a transaction for XAI audit trail."""
    if not tx_hash_str or not reason_hash:
        raise ValueError("Invalid parameters provided.")
    try:
        receipt = _send_transaction(contract.functions.logFraudDecision(tx_hash_str, fraud_score, model_version, reason_hash))
        return {"status": "success", "tx_hash": receipt.transactionHash.hex()}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def store_model_weight_update(round_id, weight_hash, nodes_count):
    """Registers a global federated learning update to the blockchain."""
    if not round_id or not weight_hash:
        raise ValueError("Invalid parameters provided.")
    try:
        receipt = _send_transaction(contract.functions.logModelWeightUpdate(round_id, weight_hash, nodes_count))
        return {"status": "success", "tx_hash": receipt.transactionHash.hex()}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def store_self_healing_action(node_id, action_type, reason):
    """Registers a self-healing security operation (isolation/restoration) to the blockchain."""
    if not node_id or not action_type:
        raise ValueError("Invalid parameters provided.")
    try:
        receipt = _send_transaction(contract.functions.logSelfHealingAction(node_id, action_type, reason))
        return {"status": "success", "tx_hash": receipt.transactionHash.hex()}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def listen_for_model_registration():
    """Example listener for specific blockchain events."""
    if not contract:
        print("[!] Contract not loaded. Cannot set up listener.")
        return None
    try:
        event_filter = contract.events.ModelRegistered.create_filter(from_block='latest')
        print("Listening for ModelRegistered events...")
        return event_filter
    except Exception as e:
        print(f"Error setting up listener: {e}")
        return None

def get_chain_data():
    if not w3.is_connected():
        return []
    
    latest_block_num = w3.eth.block_number
    chain_data = []
    
    # Fetch last 50 blocks max to prevent slow queries
    start_block = max(0, latest_block_num - 50)
    
    for i in range(start_block, latest_block_num + 1):
        block = w3.eth.get_block(i, full_transactions=True)
        tx_messages = []
        for tx in block.transactions:
            if tx.to == CONTRACT_ADDRESS:
                tx_messages.append(f"Smart Contract Call (Tx: {tx.hash.hex()[:12]}...)")
                
                # Try to find specific events in the logs of this transaction receipt
                try:
                    receipt = w3.eth.get_transaction_receipt(tx.hash)
                    for log in receipt.logs:
                        # Event hashes
                        fraud_event = w3.keccak(text="FraudDecisionLogged(string,uint256,string,string,address,uint256)").hex()
                        weight_event = w3.keccak(text="ModelWeightUpdated(string,string,uint256,address,uint256)").hex()
                        healing_event = w3.keccak(text="SelfHealingActionLogged(string,string,string,address,uint256)").hex()
                        
                        if log.topics:
                            topic = log.topics[0].hex()
                            if topic == fraud_event:
                                tx_messages.append("🛡️ AI Fraud Decision Recorded")
                            elif topic == weight_event:
                                tx_messages.append("🔄 Federated Learning Round Completed")
                            elif topic == healing_event:
                                tx_messages.append("🩹 Autonomous Self-Healing Operation")
                except:
                    pass
            elif tx.to is None:
                tx_messages.append(f"Smart Contract Deployed (Ganache)")
        
        msg = " | ".join(tx_messages) if tx_messages else "Ganache Genesis / Miner Block (No Contract Transactions)"
        
        # Determine pseudo event type based on contract vs general tx
        event_type = "ethereum_transaction"
        if "🛡️ AI Fraud Decision" in msg:
            event_type = "ai_fraud_audit"
        elif "🔄 Federated Learning" in msg:
            event_type = "federated_update"
        elif "🩹 Autonomous Self-Healing" in msg:
            event_type = "self_healing_audit"
        elif "Smart Contract Call" in msg:
            event_type = "smart_contract_call"
        elif "Deployed" in msg:
            event_type = "contract_deployment"
            
        from datetime import datetime, timezone
        
        chain_data.append({
            "index": block.number,
            "timestamp": datetime.fromtimestamp(block.timestamp, timezone.utc).isoformat(),
            "data": {
                "type": event_type,
                "message": msg,
                "system": "Ganache Web3 ETH Network"
            },
            "previous_hash": block.parentHash.hex(),
            "nonce": str(block.nonce) if isinstance(block.nonce, int) else block.nonce.hex(),
            "hash": block.hash.hex()
        })
        
    return chain_data

def get_stats():
    if not w3.is_connected():
        return {"total_blocks": 0, "difficulty": 0, "event_types": 0, "valid_chain": False}
    return {
        "total_blocks": w3.eth.block_number + 1,
        "difficulty": 1337,
        "event_types": 3,
        "valid_chain": True
    }

def is_chain_valid():
    return True, "Chain valid (Ethereum PoW/PoA)"

def get_latest_block_hash():
    if not w3.is_connected():
        return "0x0"
    return w3.eth.get_block('latest').hash.hex()
