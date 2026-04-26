"""
Seed Data Script
Populates the database with demo data for immediate visualization.
Run once before starting the server.
"""

import os
import sys
import hashlib
import random
from datetime import datetime, timezone, timedelta

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, APIKey, AIModel, ModelVersion, Dataset, DatasetTransformation, SecurityEvent
from blockchain import blockchain
from smart_contracts import model_registry, version_verification, access_control, data_provenance
from auth import hash_password
from security import security_engine


def seed():
    with app.app_context():
        # Drop and recreate
        db.drop_all()
        db.create_all()

        print("[*] Seeding users...")
        users = [
            User(username='admin', email='admin@aichain.io', full_name='Administrator', password_hash=hash_password('admin123'), role='admin', trust_score=98.5),
            User(username='dr.chen', email='chen@research.edu', full_name='Dr. Wei Chen', password_hash=hash_password('chen123'), role='researcher', trust_score=92.3),
            User(username='sarah_ml', email='sarah@mlops.com', full_name='Sarah Mitchell', password_hash=hash_password('sarah123'), role='researcher', trust_score=88.7),
            User(username='alex_viewer', email='alex@company.com', full_name='Alex Rodriguez', password_hash=hash_password('alex123'), role='viewer', trust_score=95.1),
            User(username='maya_ds', email='maya@datascience.org', full_name='Maya Desai', password_hash=hash_password('maya123'), role='researcher', trust_score=91.0),
        ]
        for u in users:
            db.session.add(u)
        db.session.commit()

        # Grant access in smart contracts
        for u in users:
            access_control.grant_access(u.username, u.role, 'system')
            security_engine.update_trust_score(u.id, 'successful_auth')

        print("[*] Seeding API keys...")
        keys = [
            APIKey(key='ak_prod_' + hashlib.md5(b'prod').hexdigest(), name='Production API Key', user_id=1, requests_count=1247),
            APIKey(key='ak_dev_' + hashlib.md5(b'dev').hexdigest(), name='Development Key', user_id=2, requests_count=523),
            APIKey(key='ak_test_' + hashlib.md5(b'test').hexdigest(), name='Testing Key', user_id=3, requests_count=89),
        ]
        for k in keys:
            db.session.add(k)
        db.session.commit()

        print("[*] Seeding AI models & blockchain entries...")
        models_data = [
            {'name': 'FraudDetector-v3', 'desc': 'Real-time credit card fraud detection using gradient boosting ensemble', 'type': 'classification', 'fw': 'xgboost', 'ver': '3.2.1', 'size': 45_000_000, 'acc': 0.967, 'owner': 1},
            {'name': 'SentimentAnalyzer-BERT', 'desc': 'Multi-language sentiment analysis fine-tuned on social media data', 'type': 'nlp', 'fw': 'pytorch', 'ver': '2.1.0', 'size': 420_000_000, 'acc': 0.942, 'owner': 2},
            {'name': 'MedicalImaging-ResNet', 'desc': 'Chest X-ray pneumonia detection with ResNet-50 architecture', 'type': 'computer_vision', 'fw': 'tensorflow', 'ver': '1.5.3', 'size': 178_000_000, 'acc': 0.951, 'owner': 2},
            {'name': 'AutoPricer-LSTM', 'desc': 'Dynamic pricing prediction using LSTM networks on historical pricing data', 'type': 'regression', 'fw': 'pytorch', 'ver': '4.0.0', 'size': 67_000_000, 'acc': 0.889, 'owner': 3},
            {'name': 'ChatAssistant-GPT', 'desc': 'Customer support chatbot using transformer architecture', 'type': 'nlp', 'fw': 'tensorflow', 'ver': '2.3.0', 'size': 1_200_000_000, 'acc': 0.918, 'owner': 1},
            {'name': 'AnomalyNet-Isolation', 'desc': 'Network traffic anomaly detection using Isolation Forest ensemble', 'type': 'anomaly_detection', 'fw': 'sklearn', 'ver': '1.2.0', 'size': 12_000_000, 'acc': 0.934, 'owner': 5},
            {'name': 'ObjectTracker-YOLO', 'desc': 'Real-time multi-object tracking using YOLOv8 architecture', 'type': 'computer_vision', 'fw': 'pytorch', 'ver': '5.1.2', 'size': 256_000_000, 'acc': 0.961, 'owner': 3},
            {'name': 'RecommendEngine-CF', 'desc': 'Collaborative filtering recommendation engine for e-commerce', 'type': 'recommendation', 'fw': 'tensorflow', 'ver': '3.0.1', 'size': 89_000_000, 'acc': 0.875, 'owner': 5},
        ]

        for md in models_data:
            model_hash = hashlib.sha256(f"{md['name']}-{md['ver']}".encode()).hexdigest()

            # Register on blockchain
            block = blockchain.register_model(md['name'], model_hash, users[md['owner']-1].username, md['ver'])

            # Register in smart contract
            try:
                model_registry.register_model(md['name'], model_hash, users[md['owner']-1].username, md['ver'])
                version_verification.submit_update(md['name'], md['ver'], model_hash, users[md['owner']-1].username)
            except Exception:
                pass

            import random as rnd
            fingerprint = f"{md['name']}-arch-{rnd.randint(1000, 9999)}-weights-{model_hash[:16]}"
            model = AIModel(
                name=md['name'], description=md['desc'], model_type=md['type'],
                framework=md['fw'], version=md['ver'], model_hash=model_hash, model_fingerprint=fingerprint,
                file_size=md['size'], accuracy=md['acc'], status='verified',
                owner_id=md['owner'], blockchain_tx=block.hash
            )
            db.session.add(model)
            db.session.commit()

            # Add version history
            v = ModelVersion(
                model_id=model.id, version=md['ver'], model_hash=model_hash,
                change_description='Initial registration', accuracy=md['acc'],
                blockchain_tx=block.hash, verified=True, created_by=md['owner']
            )
            db.session.add(v)

            # Add an older version for some models
            if random.random() > 0.4:
                parts = md['ver'].split('.')
                old_ver = f"{parts[0]}.{int(parts[1])-1 if int(parts[1])>0 else 0}.0"
                old_hash = hashlib.sha256(f"{md['name']}-{old_ver}".encode()).hexdigest()
                old_v = ModelVersion(
                    model_id=model.id, version=old_ver, model_hash=old_hash,
                    change_description='Previous version',
                    accuracy=round(md['acc'] - random.uniform(0.01, 0.05), 3),
                    blockchain_tx=hashlib.sha256(old_hash.encode()).hexdigest()[:64],
                    verified=True, created_by=md['owner'],
                    created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(10, 60))
                )
                db.session.add(old_v)

        db.session.commit()

        print("[*] Seeding datasets...")
        datasets_data = [
            {'name': 'CreditCard-Transactions-2024', 'desc': 'Anonymized credit card transaction dataset for fraud detection', 'type': 'tabular', 'source': 'Internal Data Warehouse', 'records': 2_500_000, 'size': 890_000_000, 'owner': 1},
            {'name': 'Twitter-Sentiment-Corpus', 'desc': 'Labeled tweet dataset for sentiment analysis training', 'type': 'text', 'source': 'Twitter API Collection', 'records': 1_200_000, 'size': 450_000_000, 'owner': 2},
            {'name': 'ChestXray-NIH-Dataset', 'desc': 'NIH Chest X-ray dataset with 14 disease labels', 'type': 'image', 'source': 'NIH Clinical Center', 'records': 112_120, 'size': 42_000_000_000, 'owner': 2},
            {'name': 'Ecommerce-Pricing-History', 'desc': 'Historical pricing data from multiple e-commerce platforms', 'type': 'tabular', 'source': 'Web Scraping Pipeline', 'records': 8_000_000, 'size': 2_100_000_000, 'owner': 3},
            {'name': 'NetworkTraffic-PCAP-2024', 'desc': 'Network packet capture data for anomaly detection', 'type': 'tabular', 'source': 'Corporate Network Sensors', 'records': 15_000_000, 'size': 5_600_000_000, 'owner': 5},
            {'name': 'CustomerSupport-Dialogues', 'desc': 'Multi-turn customer support conversation transcripts', 'type': 'text', 'source': 'CRM System Export', 'records': 350_000, 'size': 780_000_000, 'owner': 1},
        ]

        for dd in datasets_data:
            data_hash = hashlib.sha256(f"{dd['name']}-seed".encode()).hexdigest()

            block = blockchain.register_dataset(dd['name'], data_hash, users[dd['owner']-1].username, dd['records'])

            try:
                data_provenance.register_dataset(dd['name'], data_hash, users[dd['owner']-1].username, dd['source'])
            except Exception:
                pass

            dataset = Dataset(
                name=dd['name'], description=dd['desc'], data_type=dd['type'],
                source=dd['source'], record_count=dd['records'], file_size=dd['size'],
                data_hash=data_hash, blockchain_tx=block.hash, owner_id=dd['owner']
            )
            db.session.add(dataset)
            db.session.commit()

            # Add transformations for some datasets
            if random.random() > 0.3:
                transforms = random.sample([
                    ('normalization', 'Applied min-max normalization to numeric features'),
                    ('augmentation', 'Data augmentation with random rotations and flips'),
                    ('filtering', 'Removed outliers beyond 3 standard deviations'),
                    ('encoding', 'One-hot encoding applied to categorical features'),
                    ('sampling', 'Stratified sampling to balance class distribution'),
                ], k=random.randint(1, 3))
                for t_type, t_desc in transforms:
                    t = DatasetTransformation(
                        dataset_id=dataset.id, transformation_type=t_type,
                        description=t_desc, output_hash=hashlib.sha256(f"{dd['name']}-{t_type}".encode()).hexdigest(),
                        applied_by=dd['owner']
                    )
                    db.session.add(t)
            db.session.commit()

        print("[*] Seeding security events...")
        event_templates = [
            {'type': 'dos_attack', 'sev': 'critical', 'desc': 'DoS attack detected: 500+ requests/min from single IP', 'action': 'blocked', 'ip': '185.234.218.'},
            {'type': 'dos_attack', 'sev': 'high', 'desc': 'Sustained high-rate traffic pattern detected', 'action': 'rate_limited', 'ip': '91.215.85.'},
            {'type': 'ddos_attack', 'sev': 'critical', 'desc': 'Distributed DoS: coordinated attack from 15 IPs', 'action': 'blocked', 'ip': '45.227.254.'},
            {'type': 'model_poisoning', 'sev': 'critical', 'desc': 'Model hash mismatch detected during update verification', 'action': 'blocked', 'ip': '103.21.244.'},
            {'type': 'model_poisoning', 'sev': 'high', 'desc': 'Suspicious model weight modification attempt', 'action': 'alert', 'ip': '198.51.100.'},
            {'type': 'unauthorized_access', 'sev': 'high', 'desc': 'Attempted access to restricted model endpoint without auth', 'action': 'blocked', 'ip': '203.0.113.'},
            {'type': 'unauthorized_access', 'sev': 'medium', 'desc': 'Invalid token used to access model deployment API', 'action': 'alert', 'ip': '172.16.254.'},
            {'type': 'api_abuse', 'sev': 'medium', 'desc': 'API scraping pattern detected: systematic endpoint enumeration', 'action': 'rate_limited', 'ip': '10.0.0.'},
            {'type': 'credential_attack', 'sev': 'high', 'desc': 'Brute force login attempt: 50+ failed auths in 2 minutes', 'action': 'blocked', 'ip': '192.168.1.'},
            {'type': 'credential_attack', 'sev': 'critical', 'desc': 'Credential stuffing attack with known leaked passwords', 'action': 'blocked', 'ip': '185.220.101.'},
            {'type': 'data_manipulation', 'sev': 'high', 'desc': 'Attempted dataset modification without proper authorization', 'action': 'blocked', 'ip': '77.83.247.'},
            {'type': 'data_manipulation', 'sev': 'medium', 'desc': 'Unusual dataset access pattern - possible data exfiltration', 'action': 'alert', 'ip': '45.33.32.'},
            {'type': 'honeypot_trigger', 'sev': 'high', 'desc': 'Honeypot endpoint /api/models/admin/export accessed', 'action': 'blocked', 'ip': '159.65.0.'},
            {'type': 'honeypot_trigger', 'sev': 'high', 'desc': 'Honeypot endpoint /api/.env accessed - scanning detected', 'action': 'blocked', 'ip': '68.183.0.'},
            {'type': 'anomaly_detected', 'sev': 'medium', 'desc': 'Anomalous payload size in model update request', 'action': 'alert', 'ip': '142.250.185.'},
            {'type': 'rate_limit_exceeded', 'sev': 'low', 'desc': 'Rate limit exceeded for API key ak_dev', 'action': 'rate_limited', 'ip': '127.0.0.'},
            {'type': 'anomaly_detected', 'sev': 'low', 'desc': 'Slightly elevated request rate from research subnet', 'action': 'alert', 'ip': '10.10.0.'},
        ]

        print("[*] Seeding 100,000 simulated transaction events (Experimental Dataset)...")
        from models import BankAccount, BankTransaction
        
        # Create bank accounts for users
        accounts = []
        for i, u in enumerate(users):
            account = BankAccount(
                account_number=f"ACC-00{i+1}",
                account_type='checking' if i % 2 == 0 else 'savings',
                balance=random.uniform(5000, 50000),
                owner_id=u.id
            )
            db.session.add(account)
            accounts.append(account)
        db.session.commit()

        # Mass seed transactions
        batch_size = 5000
        total_transactions = 100000
        fraud_ratio = 0.0017 # 0.17% fraud as per documentation
        
        for i in range(0, total_transactions, batch_size):
            txs = []
            for j in range(batch_size):
                is_fraud = random.random() < fraud_ratio
                amount = random.uniform(10, 500) if not is_fraud else random.uniform(5000, 20000)
                sender = random.choice(accounts)
                receiver = random.choice([a for a in accounts if a.id != sender.id])
                
                tx = BankTransaction(
                    tx_hash=hashlib.sha256(f"tx-{i+j}-{random.random()}".encode()).hexdigest(),
                    amount=amount,
                    type='transfer',
                    status='completed' if not is_fraud else 'flagged',
                    sender_id=sender.id,
                    receiver_id=receiver.id,
                    description=f"Transaction {i+j+1}",
                    created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30))
                )
                txs.append(tx)
            db.session.bulk_save_objects(txs)
            db.session.commit()
            print(f"  ... {i + batch_size} / {total_transactions} seeded")

        db.session.commit()

        print(f"\n{'='*50}")
        print(f"  Seed complete!")
        print(f"{'='*50}")
        print(f"  Users:           {User.query.count()}")
        print(f"  API Keys:        {APIKey.query.count()}")
        print(f"  AI Models:       {AIModel.query.count()}")
        print(f"  Model Versions:  {ModelVersion.query.count()}")
        print(f"  Datasets:        {Dataset.query.count()}")
        print(f"  Security Events: {SecurityEvent.query.count()}")
        print(f"  Blockchain:      {len(blockchain.chain)} blocks")
        print(f"{'='*50}")
        print(f"\n  Login credentials:")
        print(f"    admin / admin123  (admin)")
        print(f"    dr.chen / chen123 (researcher)")
        print(f"    sarah_ml / sarah123 (researcher)")
        print(f"    alex_viewer / alex123 (viewer)")
        print(f"    maya_ds / maya123 (researcher)")
        print(f"{'='*50}\n")


if __name__ == '__main__':
    seed()
