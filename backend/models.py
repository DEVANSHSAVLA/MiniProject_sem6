"""
Database Models for AI Chain Guard
Uses Flask-SQLAlchemy with SQLite for zero-config persistence.
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import hashlib
import secrets

db = SQLAlchemy()


class User(db.Model):
    """System user with role-based access control."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='viewer')  # admin, researcher, viewer
    trust_score = db.Column(db.Float, default=100.0)
    is_blocked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = db.Column(db.DateTime)
    public_key = db.Column(db.Text)  # Store user's RSA/ECDSA public key for digital signatures

    api_keys = db.relationship('APIKey', backref='user', lazy=True)
    models = db.relationship('AIModel', backref='owner', lazy=True)
    accounts = db.relationship('BankAccount', backref='owner', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'trust_score': round(self.trust_score, 2),
            'is_blocked': self.is_blocked,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }


class APIKey(db.Model):
    """API keys for programmatic access."""
    __tablename__ = 'api_keys'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(64), unique=True, nullable=False, default=lambda: secrets.token_hex(32))
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    requests_count = db.Column(db.Integer, default=0)
    last_used = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'key': self.key[:8] + '...' + self.key[-4:],
            'name': self.name,
            'user_id': self.user_id,
            'is_active': self.is_active,
            'requests_count': self.requests_count,
            'last_used': self.last_used.isoformat() if self.last_used else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class AIModel(db.Model):
    """Registered AI/ML model with blockchain-tracked integrity."""
    __tablename__ = 'ai_models'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    model_type = db.Column(db.String(50))  # classification, regression, nlp, cv, etc.
    framework = db.Column(db.String(50))   # tensorflow, pytorch, sklearn, etc.
    version = db.Column(db.String(20), default='1.0.0')
    model_hash = db.Column(db.String(64), nullable=False)
    model_fingerprint = db.Column(db.String(128))  # unique fingerprint extracted from architecture
    file_size = db.Column(db.Integer)  # bytes
    accuracy = db.Column(db.Float)
    status = db.Column(db.String(20), default='registered')  # registered, verified, deployed, deprecated
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    blockchain_tx = db.Column(db.String(64))  # blockchain transaction hash
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    versions = db.relationship('ModelVersion', backref='model', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'model_type': self.model_type,
            'framework': self.framework,
            'version': self.version,
            'model_hash': self.model_hash,
            'model_fingerprint': self.model_fingerprint,
            'file_size': self.file_size,
            'accuracy': self.accuracy,
            'status': self.status,
            'owner_id': self.owner_id,
            'owner': self.owner.username if self.owner else None,
            'blockchain_tx': self.blockchain_tx,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'version_count': len(self.versions)
        }


class ModelVersion(db.Model):
    """Version history for AI models with blockchain verification."""
    __tablename__ = 'model_versions'

    id = db.Column(db.Integer, primary_key=True)
    model_id = db.Column(db.Integer, db.ForeignKey('ai_models.id'), nullable=False)
    version = db.Column(db.String(20), nullable=False)
    model_hash = db.Column(db.String(64), nullable=False)
    change_description = db.Column(db.Text)
    accuracy = db.Column(db.Float)
    training_data_hash = db.Column(db.String(64))
    blockchain_tx = db.Column(db.String(64))
    verified = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'model_id': self.model_id,
            'version': self.version,
            'model_hash': self.model_hash,
            'change_description': self.change_description,
            'accuracy': self.accuracy,
            'training_data_hash': self.training_data_hash,
            'blockchain_tx': self.blockchain_tx,
            'verified': self.verified,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Dataset(db.Model):
    """Dataset with provenance tracking."""
    __tablename__ = 'datasets'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    data_type = db.Column(db.String(50))  # tabular, image, text, audio
    source = db.Column(db.String(500))
    record_count = db.Column(db.Integer)
    file_size = db.Column(db.Integer)
    data_hash = db.Column(db.String(64), nullable=False)
    parent_dataset_id = db.Column(db.Integer, db.ForeignKey('datasets.id'))
    blockchain_tx = db.Column(db.String(64))
    integrity_verified = db.Column(db.Boolean, default=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    transformations = db.relationship('DatasetTransformation', backref='dataset', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'data_type': self.data_type,
            'source': self.source,
            'record_count': self.record_count,
            'file_size': self.file_size,
            'data_hash': self.data_hash,
            'parent_dataset_id': self.parent_dataset_id,
            'blockchain_tx': self.blockchain_tx,
            'integrity_verified': self.integrity_verified,
            'owner_id': self.owner_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'transformation_count': len(self.transformations)
        }


class DatasetTransformation(db.Model):
    """Tracks transformations applied to datasets for provenance."""
    __tablename__ = 'dataset_transformations'

    id = db.Column(db.Integer, primary_key=True)
    dataset_id = db.Column(db.Integer, db.ForeignKey('datasets.id'), nullable=False)
    transformation_type = db.Column(db.String(50))  # augmentation, normalization, filtering, etc.
    description = db.Column(db.Text)
    parameters = db.Column(db.Text)  # JSON string
    output_hash = db.Column(db.String(64))
    applied_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    applied_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'dataset_id': self.dataset_id,
            'transformation_type': self.transformation_type,
            'description': self.description,
            'parameters': self.parameters,
            'output_hash': self.output_hash,
            'applied_by': self.applied_by,
            'applied_at': self.applied_at.isoformat() if self.applied_at else None
        }


class SecurityEvent(db.Model):
    """Security events logged by the cybersecurity layer."""
    __tablename__ = 'security_events'

    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(50), nullable=False)
    # Types: dos_attack, ddos_attack, model_poisoning, unauthorized_access,
    #        api_abuse, credential_attack, data_manipulation, honeypot_trigger,
    #        anomaly_detected, rate_limit_exceeded
    severity = db.Column(db.String(20), default='medium')  # low, medium, high, critical
    source_ip = db.Column(db.String(45))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    description = db.Column(db.Text, nullable=False)
    details = db.Column(db.Text)  # JSON string
    action_taken = db.Column(db.String(100))  # blocked, rate_limited, alert, none
    is_resolved = db.Column(db.Boolean, default=False)
    blockchain_tx = db.Column(db.String(64))   # logged on blockchain for tamper-proof record
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'event_type': self.event_type,
            'severity': self.severity,
            'source_ip': self.source_ip,
            'user_id': self.user_id,
            'description': self.description,
            'details': self.details,
            'action_taken': self.action_taken,
            'is_resolved': self.is_resolved,
            'blockchain_tx': self.blockchain_tx,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class AccessLog(db.Model):
    """Detailed access logs for security analysis."""
    __tablename__ = 'access_logs'

    id = db.Column(db.Integer, primary_key=True)
    endpoint = db.Column(db.String(200), nullable=False)
    method = db.Column(db.String(10), nullable=False)
    source_ip = db.Column(db.String(45))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    user_agent = db.Column(db.String(500))
    request_size = db.Column(db.Integer, default=0)
    response_code = db.Column(db.Integer)
    response_time_ms = db.Column(db.Float)
    is_suspicious = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'endpoint': self.endpoint,
            'method': self.method,
            'source_ip': self.source_ip,
            'user_id': self.user_id,
            'response_code': self.response_code,
            'response_time_ms': self.response_time_ms,
            'is_suspicious': self.is_suspicious,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class BankAccount(db.Model):
    """Secure Ledger Bank Account."""
    __tablename__ = 'bank_accounts'

    id = db.Column(db.Integer, primary_key=True)
    account_number = db.Column(db.String(20), unique=True, nullable=False)
    account_type = db.Column(db.String(20), default='checking')  # checking, savings, loan
    balance = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(10), default='USD')
    status = db.Column(db.String(20), default='active')  # active, frozen, closed
    kyc_document_type = db.Column(db.String(50))  # Aadhaar, Passport, SSN, etc.
    kyc_document_id = db.Column(db.String(100))   # Hashed or encrypted ID
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    transactions_sent = db.relationship('BankTransaction', foreign_keys='BankTransaction.sender_id', backref='sender', lazy=True)
    transactions_received = db.relationship('BankTransaction', foreign_keys='BankTransaction.receiver_id', backref='receiver', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'account_number': self.account_number,
            'account_type': self.account_type,
            'balance': round(self.balance, 2),
            'currency': self.currency,
            'status': self.status,
            'kyc_type': self.kyc_document_type,
            'kyc_document_id': self.kyc_document_id,
            'owner_id': self.owner_id,
            'owner': self.owner.username if self.owner else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class BankTransaction(db.Model):
    """Immutable Bank Transaction log."""
    __tablename__ = 'bank_transactions'

    id = db.Column(db.Integer, primary_key=True)
    tx_hash = db.Column(db.String(64), unique=True, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='USD')
    type = db.Column(db.String(20), nullable=False)  # deposit, withdrawal, transfer, bill_payment
    status = db.Column(db.String(20), default='completed')  # pending, completed, failed, flagged
    category = db.Column(db.String(50), default='general')  # general, electricity, water, gas, internet, mobile, insurance
    
    sender_id = db.Column(db.Integer, db.ForeignKey('bank_accounts.id'), nullable=True)
    receiver_id = db.Column(db.Integer, db.ForeignKey('bank_accounts.id'), nullable=True)
    
    description = db.Column(db.String(255))
    blockchain_tx = db.Column(db.String(64))  # Anchor to the real blockchain
    block_index = db.Column(db.Integer)  # Index in the blockchain
    block_hash = db.Column(db.String(64))  # Block hash on the chain
    prev_block_hash = db.Column(db.String(64))  # Previous block hash for chain verification
    ai_risk_score = db.Column(db.Float, default=0.0)  # AI Chain Guard risk assessment
    ai_verdict = db.Column(db.String(20), default='clean')  # clean, suspicious, flagged
    digital_signature = db.Column(db.Text)  # Client-side cryptographic signature
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'tx_hash': self.tx_hash,
            'amount': round(self.amount, 2),
            'currency': self.currency,
            'type': self.type,
            'status': self.status,
            'category': self.category,
            'sender_id': self.sender_id,
            'sender_account': self.sender.account_number if self.sender else None,
            'receiver_id': self.receiver_id,
            'receiver_account': self.receiver.account_number if self.receiver else None,
            'description': self.description,
            'blockchain_tx': self.blockchain_tx,
            'block_index': self.block_index,
            'block_hash': self.block_hash,
            'prev_block_hash': self.prev_block_hash,
            'ai_risk_score': self.ai_risk_score,
            'ai_verdict': self.ai_verdict,
            'digital_signature': self.digital_signature,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Beneficiary(db.Model):
    """Saved beneficiaries for quick transfers."""
    __tablename__ = 'beneficiaries'

    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    account_number = db.Column(db.String(20), nullable=False)
    bank_name = db.Column(db.String(100), default='AI Chain Guard Bank')
    nickname = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    owner = db.relationship('User', backref='beneficiaries')

    def to_dict(self):
        return {
            'id': self.id,
            'owner_id': self.owner_id,
            'name': self.name,
            'account_number': self.account_number,
            'bank_name': self.bank_name,
            'nickname': self.nickname,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
