import os
import sys
import hashlib
import random
from datetime import datetime, timezone

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app import app
from models import db, User, AIModel, Dataset, SecurityEvent

def sync():
    with app.app_context():
        # 1. Ensure Admin exists
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            print("[!] Creating Admin...")
            admin = User(username='admin', email='admin@aichainguard.io', full_name='System Administrator', role='admin', password_hash='...')
            db.session.add(admin)
            db.session.commit()

        # 2. Find Google user
        google_user = User.query.filter(User.email != None).filter(User.username != 'admin').first()
        target_id = google_user.id if google_user else admin.id
        
        print(f"[+] Syncing for User ID: {target_id}")

        # 3. Models
        if AIModel.query.count() == 0:
            m = AIModel(
                name="Isolation Forest Fraud Detector",
                description="Real-time transaction anomaly detection.",
                model_type="Anomaly Detection",
                framework="Scikit-Learn",
                version="1.2.0",
                model_hash=hashlib.sha256(b"m1").hexdigest(),
                model_fingerprint=hashlib.md5(b"m1").hexdigest(),
                file_size=1024*1024,
                accuracy=0.98,
                status="active",
                owner_id=target_id
            )
            db.session.add(m)
            db.session.commit()

        # 4. Datasets
        if Dataset.query.count() == 0:
            d = Dataset(
                name="Global Banking Transactions",
                description="High-fidelity financial data.",
                data_type="Financial",
                source="SWIFT Node 7",
                record_count=500000,
                file_size=50*1024*1024,
                data_hash=hashlib.sha256(b"d1").hexdigest(),
                owner_id=target_id,
                integrity_verified=True
            )
            db.session.add(d)
            db.session.commit()

        # 5. Events
        if SecurityEvent.query.count() == 0:
            e = SecurityEvent(
                event_type="Intrusion Detected",
                severity="high",
                description="Unauthorized access attempt",
                is_resolved=True,
                action_taken="Blocked IP"
            )
            db.session.add(e)
            db.session.commit()

        print("[OK] State synchronized.")

if __name__ == "__main__":
    sync()
