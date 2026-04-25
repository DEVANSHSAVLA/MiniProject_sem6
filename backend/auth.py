"""
Authentication & Authorization Module
JWT token management, API key validation, and role-based access control.
"""

import hashlib
import jwt
import secrets
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import request, jsonify, g

SECRET_KEY = 'blockchain-ai-security-system-secret-key-2024'
TOKEN_EXPIRY_HOURS = 24


def hash_password(password):
    """Hash a password with SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password, password_hash):
    """Verify a password against its hash."""
    return hash_password(password) == password_hash


def generate_token(user_id, username, role):
    """Generate a JWT token."""
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def decode_token(token):
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def require_auth(f):
    """Decorator to require JWT authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Check Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        # Check API key
        api_key = request.headers.get('X-API-Key')

        if not token and not api_key:
            return jsonify({'error': 'Authentication required'}), 401

        if token:
            payload = decode_token(token)
            if not payload:
                return jsonify({'error': 'Invalid or expired token'}), 401
            g.current_user = payload
        elif api_key:
            # API key validation would check database
            from models import APIKey, db
            key_record = APIKey.query.filter_by(key=api_key, is_active=True).first()
            if not key_record:
                return jsonify({'error': 'Invalid API key'}), 401
            key_record.requests_count += 1
            key_record.last_used = datetime.now(timezone.utc)
            db.session.commit()
            g.current_user = {
                'user_id': key_record.user_id,
                'username': key_record.user.username,
                'role': key_record.user.role
            }

        return f(*args, **kwargs)
    return decorated


def require_role(*roles):
    """Decorator to require specific roles."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(g, 'current_user'):
                return jsonify({'error': 'Authentication required'}), 401
            if g.current_user.get('role') not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


def generate_api_key():
    """Generate a new API key."""
    return secrets.token_hex(32)
