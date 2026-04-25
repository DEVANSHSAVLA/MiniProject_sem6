"""
AI Transaction Risk Engine & Explainable AI (XAI)
Evaluates banking transactions and provides human-readable explanations for flagged behavior.
"""
import time
import random

class TransactionRiskEngine:
    def __init__(self):
        self.model_version = "rf_xai_v1.2.0"
        
        # In a real-world scenario, this would be a loaded Scikit-Learn/XGBoost model.
        # Here we simulate the ensemble logic to demonstrate XAI.
        self.base_limits = {
            "checking": 5000,
            "savings": 20000
        }

    def evaluate_transfer(self, account_type, transfer_amount, user_trust_score, is_new_device, location_history):
        """
        Evaluate risk score (0-100) and generate SHAP-like explanations for the decision.
        """
        risk_score = 0
        explanations = []

        # Feature 1: Transfer Velocity / Amount Anomaly
        limit = self.base_limits.get(account_type, 5000)
        if transfer_amount > limit * 10:
            risk_score += 85
            explanations.append(f"Amount (${transfer_amount:,.2f}) exceeds historical {account_type} baseline by over 1000%.")
        elif transfer_amount > limit:
            risk_score += 40
            explanations.append(f"Amount (${transfer_amount:,.2f}) is higher than usual for a {account_type} account.")

        # Feature 2: Device & Authentication Context
        if is_new_device:
            risk_score += 30
            explanations.append("Login originates from an unrecognized device signature.")

        # Feature 3: Geographic Location Anomaly
        current_loc = location_history[-1] if location_history else "Unknown"
        if current_loc not in ["Local", "Domestic"]:
            risk_score += 50
            explanations.append(f"Transfer initiated from unusual geographic location: {current_loc}.")

        # Feature 4: User Historical Trust
        if user_trust_score < 50:
            risk_score += 25
            explanations.append(f"User identity trust score is critically low ({user_trust_score}/100).")

        # Normalize score
        risk_score = min(max(risk_score, 0), 100)

        # Generate a cryptographic hash of the reasoning for the blockchain
        reasoning_str = " | ".join(explanations)
        import hashlib
        reason_hash = hashlib.sha256(reasoning_str.encode()).hexdigest()

        return {
            "risk_score": risk_score,
            "model_version": self.model_version,
            "is_flagged": risk_score >= 80,
            "explanations": explanations,
            "reason_hash": reason_hash
        }

risk_engine = TransactionRiskEngine()
