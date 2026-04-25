"""
Smart Contract Logic for AI Chain Guard
Python-simulated Solidity-style smart contracts for model verification,
access control, and data provenance.
"""

import hashlib
import json
from datetime import datetime, timezone


class SmartContractError(Exception):
    """Custom exception for smart contract violations."""
    pass


class ModelRegistryContract:
    """
    Smart contract for AI model registration and ownership management.
    Mirrors Solidity contract patterns with state, modifiers, and events.
    """

    def __init__(self):
        # State variables
        self.models = {}          # model_name -> {owner, hash, version, registered_at}
        self.ownership_history = []
        self.events = []          # Contract events log

    def _emit_event(self, event_name, data):
        """Emit a contract event."""
        event = {
            'event': event_name,
            'data': data,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'block_number': len(self.events)
        }
        self.events.append(event)
        return event

    def register_model(self, model_name, model_hash, owner, version='1.0.0'):
        """
        Register a new AI model.
        Requires: model not already registered.
        """
        if model_name in self.models:
            raise SmartContractError(f'Model "{model_name}" is already registered')

        self.models[model_name] = {
            'owner': owner,
            'hash': model_hash,
            'version': version,
            'registered_at': datetime.now(timezone.utc).isoformat(),
            'is_active': True
        }

        return self._emit_event('ModelRegistered', {
            'model_name': model_name,
            'owner': owner,
            'hash': model_hash,
            'version': version
        })

    def transfer_ownership(self, model_name, from_owner, to_owner):
        """
        Transfer model ownership.
        Requires: caller is current owner.
        """
        if model_name not in self.models:
            raise SmartContractError(f'Model "{model_name}" not found')

        model = self.models[model_name]
        if model['owner'] != from_owner:
            raise SmartContractError(f'Only the owner can transfer ownership')

        old_owner = model['owner']
        model['owner'] = to_owner

        self.ownership_history.append({
            'model_name': model_name,
            'from': old_owner,
            'to': to_owner,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })

        return self._emit_event('OwnershipTransferred', {
            'model_name': model_name,
            'from_owner': old_owner,
            'to_owner': to_owner
        })

    def verify_ownership(self, model_name, claimed_owner):
        """Verify if a user is the owner of a model."""
        if model_name not in self.models:
            return False
        return self.models[model_name]['owner'] == claimed_owner

    def get_model_info(self, model_name):
        """Get model registration info."""
        return self.models.get(model_name)


class VersionVerificationContract:
    """
    Smart contract for verifying model update integrity.
    Ensures model updates maintain a valid chain of versions.
    """

    def __init__(self):
        self.version_chains = {}  # model_name -> [version_entries]
        self.events = []

    def _emit_event(self, event_name, data):
        event = {
            'event': event_name,
            'data': data,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        self.events.append(event)
        return event

    def submit_update(self, model_name, new_version, new_hash, updater, old_hash=None):
        """
        Submit a model update for verification.
        Validates version chain integrity.
        """
        if model_name not in self.version_chains:
            self.version_chains[model_name] = []

        chain = self.version_chains[model_name]

        # Verify previous hash if chain is not empty
        if chain and old_hash:
            last_entry = chain[-1]
            if last_entry['hash'] != old_hash:
                raise SmartContractError(
                    f'Hash mismatch: expected {last_entry["hash"][:16]}..., '
                    f'got {old_hash[:16]}...'
                )

        # Check for duplicate version
        for entry in chain:
            if entry['version'] == new_version:
                raise SmartContractError(
                    f'Version {new_version} already exists for model "{model_name}"'
                )

        entry = {
            'version': new_version,
            'hash': new_hash,
            'previous_hash': chain[-1]['hash'] if chain else None,
            'updater': updater,
            'verified': True,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        chain.append(entry)

        return self._emit_event('VersionVerified', {
            'model_name': model_name,
            'version': new_version,
            'hash': new_hash,
            'updater': updater
        })

    def verify_version(self, model_name, version, expected_hash):
        """Verify a specific version's integrity."""
        if model_name not in self.version_chains:
            return False, 'Model not found in version chain'

        for entry in self.version_chains[model_name]:
            if entry['version'] == version:
                if entry['hash'] == expected_hash:
                    return True, 'Version verified successfully'
                else:
                    return False, 'Hash mismatch - possible tampering detected'

        return False, 'Version not found'

    def get_version_chain(self, model_name):
        """Get the full version chain for a model."""
        return self.version_chains.get(model_name, [])


class AccessControlContract:
    """
    Smart contract for role-based access control.
    Manages permissions and access auditing.
    """

    ROLES = {
        'admin': ['read', 'write', 'delete', 'deploy', 'transfer', 'manage_users'],
        'researcher': ['read', 'write', 'deploy'],
        'viewer': ['read']
    }

    def __init__(self):
        self.access_records = {}  # user -> {role, permissions, granted_at}
        self.audit_log = []
        self.events = []

    def _emit_event(self, event_name, data):
        event = {
            'event': event_name,
            'data': data,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        self.events.append(event)
        return event

    def grant_access(self, user, role, granted_by):
        """Grant access role to a user."""
        if role not in self.ROLES:
            raise SmartContractError(f'Invalid role: {role}')

        self.access_records[user] = {
            'role': role,
            'permissions': self.ROLES[role],
            'granted_by': granted_by,
            'granted_at': datetime.now(timezone.utc).isoformat()
        }

        self.audit_log.append({
            'action': 'grant_access',
            'user': user,
            'role': role,
            'granted_by': granted_by,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })

        return self._emit_event('AccessGranted', {
            'user': user,
            'role': role,
            'granted_by': granted_by
        })

    def check_permission(self, user, required_permission):
        """Check if a user has a specific permission."""
        if user not in self.access_records:
            return False
        return required_permission in self.access_records[user]['permissions']

    def revoke_access(self, user, revoked_by):
        """Revoke a user's access."""
        if user in self.access_records:
            old_role = self.access_records[user]['role']
            del self.access_records[user]

            self.audit_log.append({
                'action': 'revoke_access',
                'user': user,
                'old_role': old_role,
                'revoked_by': revoked_by,
                'timestamp': datetime.now(timezone.utc).isoformat()
            })

            return self._emit_event('AccessRevoked', {
                'user': user,
                'old_role': old_role,
                'revoked_by': revoked_by
            })


class DataProvenanceContract:
    """
    Smart contract for dataset lineage tracking.
    Records the complete provenance chain from source to transformation.
    """

    def __init__(self):
        self.datasets = {}            # dataset_name -> registration_data
        self.lineage_graph = {}       # dataset_name -> [transformation_entries]
        self.events = []

    def _emit_event(self, event_name, data):
        event = {
            'event': event_name,
            'data': data,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        self.events.append(event)
        return event

    def register_dataset(self, dataset_name, data_hash, owner, source=None, metadata=None):
        """Register a new dataset with its provenance info."""
        if dataset_name in self.datasets:
            raise SmartContractError(f'Dataset "{dataset_name}" already registered')

        self.datasets[dataset_name] = {
            'hash': data_hash,
            'owner': owner,
            'source': source,
            'metadata': metadata or {},
            'registered_at': datetime.now(timezone.utc).isoformat(),
            'is_verified': True
        }
        self.lineage_graph[dataset_name] = []

        return self._emit_event('DatasetRegistered', {
            'dataset_name': dataset_name,
            'hash': data_hash,
            'owner': owner,
            'source': source
        })

    def record_transformation(self, dataset_name, transformation_type, output_hash,
                               applied_by, description='', parameters=None):
        """Record a transformation applied to a dataset."""
        if dataset_name not in self.datasets:
            raise SmartContractError(f'Dataset "{dataset_name}" not found')

        entry = {
            'transformation_type': transformation_type,
            'input_hash': self.datasets[dataset_name]['hash'],
            'output_hash': output_hash,
            'applied_by': applied_by,
            'description': description,
            'parameters': parameters,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        self.lineage_graph[dataset_name].append(entry)

        # Update current hash
        self.datasets[dataset_name]['hash'] = output_hash

        return self._emit_event('TransformationRecorded', {
            'dataset_name': dataset_name,
            'transformation_type': transformation_type,
            'output_hash': output_hash
        })

    def verify_integrity(self, dataset_name, expected_hash):
        """Verify dataset integrity against registered hash."""
        if dataset_name not in self.datasets:
            return False, 'Dataset not found'

        current_hash = self.datasets[dataset_name]['hash']
        if current_hash == expected_hash:
            return True, 'Dataset integrity verified'
        return False, 'Hash mismatch - possible data manipulation'

    def get_lineage(self, dataset_name):
        """Get the full transformation lineage of a dataset."""
        if dataset_name not in self.datasets:
            return None
        return {
            'registration': self.datasets[dataset_name],
            'transformations': self.lineage_graph.get(dataset_name, [])
        }


# Global contract instances
model_registry = ModelRegistryContract()
version_verification = VersionVerificationContract()
access_control = AccessControlContract()
data_provenance = DataProvenanceContract()
