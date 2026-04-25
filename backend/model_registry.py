import hashlib
import time
from datetime import datetime, timezone

class SecureModelRegistry:
    """
    Ensures AI models are protected against poisoning by verifying fingerprints 
    against blockchain-stored hashes and providing automated restoration.
    """
    def __init__(self):
        # Simulated active model state
        self.active_model = {
            "name": "FraudDetection_v2",
            "version": "2.4.1",
            "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "fingerprint": "layer_dense_64_relu_softmax_v1",
            "last_verified": datetime.now(timezone.utc).isoformat(),
            "status": "healthy"
        }
        # In-memory history of known-good hashes (mocking blockchain fetch)
        self.blockchain_history = [
            {"version": "2.4.0", "hash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"},
            {"version": "2.4.1", "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
        ]

    def verify_integrity(self, current_file_hash=None):
        """Cross-checks current model state against expected blockchain fingerprint."""
        if not current_file_hash:
            current_file_hash = self.active_model["hash"]
            
        # Simulate integrity check logic
        if current_file_hash != self.active_model["hash"]:
            self.active_model["status"] = "poisoned"
            self.active_model["last_verified"] = datetime.now(timezone.utc).isoformat()
            return False, "Hash Mismatch: Potential Poisoning Attempt Detected"
            
        self.active_model["status"] = "healthy"
        self.active_model["last_verified"] = datetime.now(timezone.utc).isoformat()
        return True, "Integrity Verified: Matches Blockchain Record"

    def rollback_model(self):
        """Restores the model to the last known healthy version on the ledger."""
        if len(self.blockchain_history) < 2:
            return False, "No previous versions found on blockchain."
            
        # Revert to the previous version in history
        previous = self.blockchain_history[0]
        self.active_model.update({
            "version": previous["version"],
            "hash": previous["hash"],
            "status": "restored",
            "last_verified": datetime.now(timezone.utc).isoformat()
        })
        return True, f"Successfully restored model to version {previous['version']} from blockchain ledger."

    def get_status(self):
        """Returns diagnostic telemetry for the model registry."""
        return {
            "active_model": self.active_model,
            "version_history": self.blockchain_history,
            "integrity_score": 100 if self.active_model["status"] != "poisoned" else 0,
            "rollback_available": len(self.blockchain_history) > 1
        }

model_registry = SecureModelRegistry()
