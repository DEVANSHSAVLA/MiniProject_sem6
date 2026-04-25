"""
Federated Learning Simulator
Enables decentralized AI model training across multiple virtual bank nodes (branches)
to preserve user data privacy while improving global fraud detection.
"""
import time
import random
import hashlib
from datetime import datetime, timezone

class FederatedLearner:
    def __init__(self, node_count=5):
        self.nodes = [f"Branch_{i:03d}" for i in range(node_count)]
        self.global_weights_hash = hashlib.sha256(b"initial_global_weights_v1.0").hexdigest()
        self.training_history = []
        self.is_training = False

    def start_round(self, blockchain_client=None):
        """
        Simulates one round of federated training.
        1. Local nodes train on 'private' data.
        2. Local gradients (hashes) are sent to aggregator.
        3. Global model weights are updated.
        """
        self.is_training = True
        round_id = f"FL_ROUND_{int(time.time())}"
        
        updates = []
        for node in self.nodes:
            # Simulate local training
            local_delta = random.uniform(0.01, 0.05)
            local_hash = hashlib.sha256(f"{node}-{self.global_weights_hash}-{local_delta}".encode()).hexdigest()
            
            updates.append({
                "node": node,
                "local_hash": local_hash,
                "contribution_score": round(random.uniform(0.7, 0.99), 2)
            })
            
            # Log to blockchain if client provided
            if blockchain_client:
                try:
                    # We reuse store_dataset_hash or a dedicated function to log the weight contribution
                    blockchain_client.store_dataset_hash(local_hash) 
                except:
                    pass

        # Update global weights (simulated)
        self.global_weights_hash = hashlib.sha256(f"global-{round_id}-{random.random()}".encode()).hexdigest()
        
        summary = {
            "round_id": round_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "nodes_participated": len(self.nodes),
            "new_global_hash": self.global_weights_hash,
            "avg_accuracy_gain": f"+{random.uniform(0.5, 2.1):.2f}%",
            "updates": updates
        }
        
        self.training_history.append(summary)
        self.is_training = False
        return summary

    def get_status(self):
        return {
            "active_nodes": self.nodes,
            "current_global_model_hash": self.global_weights_hash,
            "rounds_completed": len(self.training_history),
            "last_round": self.training_history[-1] if self.training_history else None
        }

# Global federated learner instance
federated_engine = FederatedLearner()
