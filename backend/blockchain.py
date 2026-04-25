"""
Blockchain Implementation for AI Model Management
Pure-Python blockchain with proof-of-work, chain validation, and tamper detection.
Stores cryptographic hashes of models, datasets, and training updates.
"""

import hashlib
import json
import time
from datetime import datetime, timezone


class Block:
    """A single block in the blockchain."""

    def __init__(self, index, timestamp, data, previous_hash, nonce=0):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        """Generate SHA-256 hash of block contents."""
        block_string = json.dumps({
            'index': self.index,
            'timestamp': self.timestamp,
            'data': self.data,
            'previous_hash': self.previous_hash,
            'nonce': self.nonce
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()

    def to_dict(self):
        return {
            'index': self.index,
            'timestamp': self.timestamp,
            'data': self.data,
            'previous_hash': self.previous_hash,
            'nonce': self.nonce,
            'hash': self.hash
        }


class Blockchain:
    """
    Blockchain ledger for AI model integrity tracking.
    Implements proof-of-work consensus with configurable difficulty.
    """

    DIFFICULTY = 2  # Number of leading zeros required in hash

    def __init__(self):
        self.chain = []
        self.pending_transactions = []
        self._create_genesis_block()

    def _create_genesis_block(self):
        """Create the first block in the chain."""
        genesis_block = Block(
            index=0,
            timestamp=datetime.now(timezone.utc).isoformat(),
            data={
                'type': 'genesis',
                'message': 'AI Model Security Blockchain Initialized',
                'system': 'AI Chain Guard: A Blockchain-Based Security Framework for Secure AI Infrastructure'
            },
            previous_hash='0' * 64
        )
        self.chain.append(genesis_block)

    def get_latest_block(self):
        """Return the most recent block."""
        return self.chain[-1]

    def proof_of_work(self, block):
        """
        Simple proof-of-work: find a nonce that produces a hash
        with the required number of leading zeros.
        """
        target = '0' * self.DIFFICULTY
        while not block.hash.startswith(target):
            block.nonce += 1
            block.hash = block.calculate_hash()
        return block

    def add_block(self, data):
        """
        Add a new block to the chain after proof-of-work.
        Returns the new block.
        """
        previous_block = self.get_latest_block()
        new_block = Block(
            index=len(self.chain),
            timestamp=datetime.now(timezone.utc).isoformat(),
            data=data,
            previous_hash=previous_block.hash
        )
        new_block = self.proof_of_work(new_block)
        self.chain.append(new_block)
        return new_block

    def is_chain_valid(self):
        """
        Validate the entire blockchain.
        Checks hash integrity and chain linkage.
        Returns (is_valid, error_message).
        """
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]

            # Verify current block's hash
            if current_block.hash != current_block.calculate_hash():
                return False, f'Block {i}: Hash mismatch (data tampered)'

            # Verify chain linkage
            if current_block.previous_hash != previous_block.hash:
                return False, f'Block {i}: Chain broken (previous_hash mismatch)'

            # Verify proof-of-work
            if not current_block.hash.startswith('0' * self.DIFFICULTY):
                return False, f'Block {i}: Invalid proof-of-work'

        return True, 'Chain is valid'

    def register_model(self, model_name, model_hash, owner, version='1.0.0', metadata=None):
        """Record a new model registration on the blockchain."""
        data = {
            'type': 'model_registration',
            'model_name': model_name,
            'model_hash': model_hash,
            'owner': owner,
            'version': version,
            'metadata': metadata or {},
            'action': 'REGISTER'
        }
        block = self.add_block(data)
        return block

    def update_model(self, model_name, old_hash, new_hash, updater, version, change_description=''):
        """Record a model update on the blockchain."""
        data = {
            'type': 'model_update',
            'model_name': model_name,
            'old_hash': old_hash,
            'new_hash': new_hash,
            'updater': updater,
            'version': version,
            'change_description': change_description,
            'action': 'UPDATE'
        }
        block = self.add_block(data)
        return block

    def verify_model(self, model_name, model_hash):
        """
        Verify a model's integrity by checking its hash against blockchain records.
        Returns (is_verified, block_data).
        """
        for block in reversed(self.chain):
            if block.data.get('type') in ('model_registration', 'model_update'):
                stored_hash = block.data.get('model_hash') or block.data.get('new_hash')
                if block.data.get('model_name') == model_name and stored_hash == model_hash:
                    return True, block.to_dict()
        return False, None

    def register_dataset(self, dataset_name, data_hash, owner, record_count=0, metadata=None):
        """Record a dataset registration on the blockchain."""
        data = {
            'type': 'dataset_registration',
            'dataset_name': dataset_name,
            'data_hash': data_hash,
            'owner': owner,
            'record_count': record_count,
            'metadata': metadata or {},
            'action': 'REGISTER_DATASET'
        }
        block = self.add_block(data)
        return block

    def log_security_event(self, event_type, severity, description, source_ip=None):
        """Log a security event on the blockchain for tamper-proof record."""
        data = {
            'type': 'security_event',
            'event_type': event_type,
            'severity': severity,
            'description': description,
            'source_ip': source_ip,
            'action': 'SECURITY_LOG'
        }
        block = self.add_block(data)
        return block

    def transfer_ownership(self, model_name, from_owner, to_owner, model_hash):
        """Record an ownership transfer on the blockchain."""
        data = {
            'type': 'ownership_transfer',
            'model_name': model_name,
            'from_owner': from_owner,
            'to_owner': to_owner,
            'model_hash': model_hash,
            'action': 'TRANSFER'
        }
        block = self.add_block(data)
        return block

    def get_chain_data(self):
        """Return the full chain as a list of dicts."""
        return [block.to_dict() for block in self.chain]

    def get_model_history(self, model_name):
        """Get all blockchain entries for a specific model."""
        history = []
        for block in self.chain:
            if block.data.get('model_name') == model_name:
                history.append(block.to_dict())
        return history

    def get_stats(self):
        """Return blockchain statistics."""
        type_counts = {}
        for block in self.chain:
            block_type = block.data.get('type', 'unknown')
            type_counts[block_type] = type_counts.get(block_type, 0) + 1

        return {
            'total_blocks': len(self.chain),
            'latest_block_hash': self.get_latest_block().hash,
            'difficulty': self.DIFFICULTY,
            'type_counts': type_counts,
            'is_valid': self.is_chain_valid()[0]
        }


# Global blockchain instance
blockchain = Blockchain()
