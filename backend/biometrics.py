import hashlib
import time
import random
from datetime import datetime, timezone

class BiometricEngine:
    """
    Simulates advanced identity verification using Decentralized Identifiers (DIDs)
    and behavioral telemetry (interaction speed, typing rhythm, etc.).
    """
    def __init__(self):
        # Mock storage for unverified/verified SSI DIDs
        self.verified_identities = {}

    def generate_did(self, username):
        """Generates a pseudo-DID (Decentralized Identifier) for a user."""
        raw = f"did:ai_chain_guard:{username}:{time.time()}"
        did = "did:ethr:" + hashlib.sha256(raw.encode()).hexdigest()[:40]
        return did

    def verify_ssi_kyc(self, username, user_did):
        """Checks if a DID is valid and anchored to the simulated ledger."""
        if not user_did.startswith("did:ethr:"):
            return False, "Invalid DID Format: Must be did:ethr:..."
            
        # Simulate blockchain verification delay
        time.sleep(0.5)
        
        self.verified_identities[username] = {
            "did": user_did,
            "status": "verified",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        return True, "SSI KYC Verified: Identity anchored to blockchain ledger."

    def profile_behavior(self, telemetry_data):
        """
        Analyzes interaction telemetry to verify if the user matches their expected profile.
        telemetry_data: { 'speed': float, 'entropy': float, 'device': string }
        """
        # Simple simulation: low speed or high entropy suggests robotic/stolen behavior
        score = 0.0
        explanations = []
        
        speed = telemetry_data.get('speed', 0.5)
        entropy = telemetry_data.get('entropy', 0.2)
        
        if speed > 0.9: # Too fast = Bot
            score += 40
            explanations.append("Anomalous Interaction Speed: Bot-like velocity detected.")
            
        if entropy > 0.8: # High variation = Likely session hijacking or scripted
            score += 30
            explanations.append("High Interaction Entropy: Inconsistent touch/mouse patterns.")
            
        if score > 0:
            return {"is_suspicious": True, "score": score, "reasons": explanations}
        
        return {"is_suspicious": false, "score": 5, "reasons": ["Behavior matches baseline profile."]}

    def get_kyc_status(self, username):
        """Returns the current SSI status for a user."""
        return self.verified_identities.get(username, {"status": "unverified", "did": None})

biometric_engine = BiometricEngine()
