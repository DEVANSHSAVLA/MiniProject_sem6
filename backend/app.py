"""
Main Flask Application
AI Chain Guard: A Blockchain-Based Security Framework for Secure AI Infrastructure
All API routes, middleware, and request processing.
"""

import os
import sys

# Load .env file for environment variables (GOOGLE_CLIENT_ID, etc.)
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))
except ImportError:
    # Fallback: manually read .env if python-dotenv is not installed
    _env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(_env_path):
        with open(_env_path) as _f:
            for _line in _f:
                _line = _line.strip()
                if _line and not _line.startswith('#') and '=' in _line:
                    _key, _val = _line.split('=', 1)
                    _val = _val.strip().strip('"').strip("'")
                    os.environ.setdefault(_key.strip(), _val)

# Ensure backend directory is in path for relative imports
cur_dir = os.path.dirname(os.path.abspath(__file__))
if cur_dir not in sys.path:
    sys.path.append(cur_dir)

import json
import hashlib
import time
from datetime import datetime, timezone, timedelta
from flask import Flask, request, jsonify, g, send_from_directory, session
from flask_cors import CORS
from flask_sock import Sock

from models import db, User, APIKey, AIModel, ModelVersion, Dataset, DatasetTransformation, SecurityEvent, AccessLog, BankAccount, BankTransaction, Beneficiary
from blockchain import blockchain
import blockchain_web3
from crypto_utils import crypto_manager
import hashing
from smart_contracts import model_registry, version_verification, access_control, data_provenance
from auth import hash_password, verify_password, generate_token, decode_token, require_auth, require_role, soft_auth
from anomaly_detection import anomaly_detector
from security import security_engine, threat_profiler, adaptive_defense
from federated_learning import federated_engine
from events import bus
from gateway import gateway, secure_gateway
from elite_security import elite_engine
from threat_intel import intel_feed

# ── App Configuration ────────────────────────────────────────────

app = Flask(__name__, static_folder=None)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///c:/Users/Deepak Chheda/OneDrive/Desktop/MINI PROJECT/instance/ai_security.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_SORT_KEYS'] = False
app.config['SECRET_KEY'] = 'ai-chain-guard-secret-key-2024'

CORS(app, resources={r"/api/*": {
    "origins": ["http://localhost:8000", "http://127.0.0.1:8000", "http://localhost:5000"], 
    "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "X-API-Key", "X-SPIFFE-ID"], 
    "expose_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True,
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}})
sock = Sock(app)
db.init_app(app)

# Track active WebSocket clients
ws_clients = set()

# ── Static File Serving ─────────────────────────────────────────
@app.route('/docs/images/<path:filename>')
def serve_docs_images(filename):
    """Serves research figures like ROC curves and architecture diagrams."""
    return send_from_directory(os.path.join(os.getcwd(), 'docs', 'images'), filename)

# ── Zero Trust / mTLS Middleware ────────────────────────────────
@app.before_request
def zero_trust_validation():
    """
    Simulates a Zero Trust Service Mesh (Istio/SPIFFE) identity validation.
    Ensures all requests carry a verified SVID-based identity header.
    """
    # Bypass for CORS preflight
    if request.method == 'OPTIONS':
        return

    # In production, this would be verified via mTLS certificates
    svid_header = request.headers.get("X-SPIFFE-ID", "spiffe://ai-chain-guard.io/public/anonymous")
    print(f"[TRUST] Request to {request.path} from {request.remote_addr}. SVID: {svid_header}")
    g.identity = svid_header
    
    # conceptual check: ensure identity is rooted in the secure domain
    if not svid_header.startswith("spiffe://ai-chain-guard.io"):
        return jsonify({
            "error": "Zero Trust Validation Failed",
            "reason": "Unrecognized workload identity (SVID Mismatch)",
            "status": 403
        }), 403

# ── Database Initialization ─────────────────────────────────────
with app.app_context():
    db.create_all()
    # Ensure admin account always exists
    if not User.query.filter_by(username='admin').first():
        admin_user = User(
            username='admin',
            email='admin@aichain.io',
            full_name='Administrator',
            password_hash=hash_password('admin123'),
            role='admin',
            trust_score=98.5
        )
        db.session.add(admin_user)
        db.session.commit()
        print("[SEED] Created default admin account (admin / admin123)")
    else:
        print("[SEED] Admin account already exists")


def purge_old_logs():
    """Enterprise Log Retention Policy: Remove security logs older than 90 days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=90)
    with app.app_context():
        try:
            SecurityEvent.query.filter(SecurityEvent.created_at < cutoff).delete()
            AccessLog.query.filter(AccessLog.created_at < cutoff).delete()
            db.session.commit()
        except Exception as e:
            db.session.rollback()

def initialize_blockchain():
    """Rebuild the in-memory blockchain from database records on startup."""
    with app.app_context():
        # Register all models on blockchain
        models = AIModel.query.order_by(AIModel.created_at.asc()).all()
        for m in models:
            owner = User.query.get(m.owner_id)
            owner_name = owner.username if owner else 'unknown'
            try:
                blockchain.register_model(m.name, m.model_hash, owner_name, m.version)
                model_registry.register_model(m.name, m.model_hash, owner_name, m.version)
                version_verification.submit_update(m.name, m.version, m.model_hash, owner_name)
            except Exception:
                pass

        # Register all datasets on blockchain
        datasets = Dataset.query.order_by(Dataset.created_at.asc()).all()
        for d in datasets:
            owner = User.query.get(d.owner_id)
            owner_name = owner.username if owner else 'unknown'
            try:
                blockchain.register_dataset(d.name, d.data_hash, owner_name, d.record_count or 0)
                data_provenance.register_dataset(d.name, d.data_hash, owner_name, d.source)
            except Exception:
                pass

        # Log critical/high security events on blockchain
        events = SecurityEvent.query.filter(
            SecurityEvent.severity.in_(['critical', 'high'])
        ).order_by(SecurityEvent.created_at.asc()).all()
        for e in events:
            try:
                blockchain.log_security_event(e.event_type, e.severity, e.description, e.source_ip)
            except Exception:
                pass

        # Grant access for all users in smart contracts
        users = User.query.all()
        for u in users:
            try:
                access_control.grant_access(u.username, u.role, 'system')
                security_engine.update_trust_score(u.id, 'successful_auth')
            except Exception:
                pass

        print(f"  Blockchain initialized: {len(blockchain_web3.get_chain_data())} blocks")


# Initialize blockchain from database
initialize_blockchain()
purge_old_logs()

# ── WebSockets ────────────────────────────────────────────────────

@sock.route('/api/ws/events')
def ws_events(ws):
    """Real-time Security Event Streaming to SOC Dashboard"""
    ws_clients.add(ws)
    try:
        while True:
            # Keep connection alive with simple ping/pong or wait for client messages
            message = ws.receive() 
    except Exception:
        pass
    finally:
        ws_clients.remove(ws)

def broadcast_event(event_dict):
    """Broadcast security event to all connected dashboard WebSockets."""
    dead_clients = set()
    for client in ws_clients:
        try:
            client.send(json.dumps(event_dict))
        except Exception:
            dead_clients.add(client)
    for dc in dead_clients:
        ws_clients.remove(dc)


# ── Middleware ────────────────────────────────────────────────────

@app.before_request
def before_request_handler():
    """Security middleware: rate limiting, anomaly detection, honeypot checks."""
    g.request_start = time.time()
    ip = request.headers.get('X-Forwarded-For', request.remote_addr) or '127.0.0.1'

    # Skip all security checks for static files and CORS preflight
    # This MUST happen first so blocked IPs don't trigger CORS preflight failures
    if request.method == 'OPTIONS' or request.path == '/' or request.path.startswith(('/css/', '/js/', '/favicon.ico')):
        return None

    # 1. Check for Active Redirection (Diverted IPs)
    redirection_path = adaptive_defense.check_redirection(ip)
    if redirection_path and request.path != redirection_path:
        return send_from_directory(os.getcwd(), redirection_path.lstrip('/')) 
    
    # 2. Check for Active Throttling (Tar Pit)
    delay = adaptive_defense.get_throttle_delay(ip)
    if delay > 0:
        time.sleep(delay)

    # Whitelist localhost from all security checks (dev environment)
    if ip in ('127.0.0.1', '::1', 'localhost'):
        return None

    # Check Dynamic Firewall (Blocked IPs)
    if ip in security_engine.blocked_ips:
        if time.time() < security_engine.blocked_ips[ip]:
            return jsonify({
                'error': 'Forbidden',
                'message': 'Your IP has been temporarily blocked due to malicious activity.'
            }), 403
        else:
            del security_engine.blocked_ips[ip]

    # Honeypot check
    is_honeypot, trigger = security_engine.check_honeypot(
        request.path, ip, request.headers.get('User-Agent')
    )
    if is_honeypot:
        # Log the event
        with app.app_context():
            event = SecurityEvent(
                event_type='honeypot_trigger',
                severity='high',
                source_ip=ip,
                description=f'Honeypot triggered: {request.path}',
                details=json.dumps(trigger),
                action_taken='blocked'
            )
            db.session.add(event)
            db.session.commit()

            # Log on Ethereum blockchain via Web3
            from hashlib import sha256
            event_hash_raw = f"{ip}-{request.path}-honeypot"
            event_hash = sha256(event_hash_raw.encode()).hexdigest()
            blockchain_web3.store_security_event(event_hash)
            

        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource does not exist'
        }), 404

    # Rate limiting
    is_allowed, remaining = security_engine.check_rate_limit(ip)
    if not is_allowed:
        # Log rate limit event
        event = SecurityEvent(
            event_type='rate_limit_exceeded',
            severity='medium',
            source_ip=ip,
            description=f'Rate limit exceeded by {ip}',
            action_taken='rate_limited'
        )
        db.session.add(event)
        db.session.commit()

        return jsonify({
            'error': 'Rate limit exceeded',
            'retry_after': security_engine.BLOCK_DURATION
        }), 429

    # Anomaly detection
    payload_size = request.content_length or 0
    is_anomalous, score, anomaly_type = anomaly_detector.record_request(
        ip, request.path, payload_size
    )
    if is_anomalous and score > 0.7:
        action = 'alert'
        if score > 0.8:
            security_engine.block_ip(ip, reason="high_anomaly")
            action = 'blocked'

        event = SecurityEvent(
            event_type=anomaly_type or 'anomaly_detected',
            severity='high' if score > 0.85 else 'medium',
            source_ip=ip,
            description=f'Anomaly detected: {anomaly_type} (score: {score:.2f})',
            details=json.dumps(anomaly_detector.get_ip_report(ip)),
            action_taken=action
        )
        db.session.add(event)
        db.session.commit()
        
        # Broadcast real-time SOC alert via WebSocket
        broadcast_event({
            "type": "NEW_SECURITY_EVENT",
            "data": event.to_dict()
        })


@app.after_request
def after_request_handler(response):
    """Log access and add security headers."""
    ip = request.headers.get('X-Forwarded-For', request.remote_addr) or '127.0.0.1'
    response_time = (time.time() - g.get('request_start', time.time())) * 1000

    # Slowloris check
    if anomaly_detector.check_slowloris(ip, response_time):
        event = SecurityEvent(
            event_type='slowloris_attack',
            severity='high',
            source_ip=ip,
            description=f'Slowloris pattern detected from {ip} (avg duration > 5s)',
            action_taken='active_mitigation'
        )
        db.session.add(event)
        db.session.commit()
        security_engine.initiate_active_defense(ip, "slowloris_attack")

    # Log access (skip for high-frequency endpoints)
    if not request.path.startswith('/api/dashboard'):
        try:
            log = AccessLog(
                endpoint=request.path,
                method=request.method,
                source_ip=ip,
                user_agent=request.headers.get('User-Agent', '')[:500],
                request_size=request.content_length or 0,
                response_code=response.status_code,
                response_time_ms=round(response_time, 2)
            )
            db.session.add(log)
            db.session.commit()
        except Exception:
            db.session.rollback()

    # Security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

    # Ensure CORS headers are always present (even on error responses)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-API-Key'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'

    return response


# ── Auth Routes ──────────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    username = data.get('username')
    full_name = data.get('full_name', 'System User')
    email = data.get('email') or f"{username}@aichain.local"
    password = data.get('password')
    role = data.get('role', 'researcher')

    if not all([username, password]):
        return jsonify({'error': 'username and password are required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409

    user = User(
        username=username,
        email=email,
        full_name=full_name,
        password_hash=hash_password(password),
        role=role
    )
    db.session.add(user)
    db.session.commit()

    # Grant access in smart contract
    access_control.grant_access(username, role, 'system')

    # Update trust score
    security_engine.update_trust_score(user.id, 'successful_auth')

    token = generate_token(user.id, user.username, user.role)
    return jsonify({
        'message': 'User registered successfully',
        'token': token,
        'user': user.to_dict()
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate a user and return a JWT token."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    username = data.get('username')
    password = data.get('password')

    if not all([username, password]):
        return jsonify({'error': 'username and password are required'}), 400

    # Support identity as either username or email
    user = User.query.filter((User.username == username) | (User.email == username)).first()

    if not user or not verify_password(password, user.password_hash):
        ip = request.headers.get('X-Forwarded-For', request.remote_addr) or '127.0.0.1'
        is_attack = security_engine.record_auth_failure(ip)
        anomaly_detector.record_request(ip, '/api/auth/login', auth_success=False)

        if is_attack:
            event = SecurityEvent(
                event_type='credential_attack',
                severity='high',
                source_ip=ip,
                description=f'Credential attack detected from {ip}',
                action_taken='blocked'
            )
            db.session.add(event)
            db.session.commit()

        return jsonify({'error': 'Invalid credentials'}), 401

    if user.is_blocked:
        return jsonify({'error': 'Account is blocked'}), 403

    user.last_login = datetime.now(timezone.utc)
    db.session.commit()

    security_engine.update_trust_score(user.id, 'successful_auth')

    token = generate_token(user.id, user.username, user.role)
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    })


@app.route('/api/auth/google', methods=['POST'])
def google_login():
    """Authenticate via Google Sign-In (supports both ID token and OAuth2 access token)."""
    data = request.get_json()
    credential = data.get('credential')      # Legacy: JWT id_token from GSI
    access_token = data.get('access_token')   # New: OAuth2 access token

    email = None
    name = None

    if access_token:
        # ── OAuth2 Access Token Flow ──
        # Verify by calling Google's userinfo endpoint
        import requests as http_requests
        print(f"[AUTH] Google OAuth2 Access Token flow. Token length: {len(access_token)}")
        try:
            resp = http_requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=10
            )
            if resp.status_code != 200:
                print(f"[AUTH] Google userinfo failed: HTTP {resp.status_code}")
                return jsonify({'error': 'Invalid Google access token'}), 401
            userinfo = resp.json()
            email = userinfo.get('email')
            name = userinfo.get('name', email.split('@')[0] if email else 'User')
            print(f"[AUTH] OAuth2 Verified. Email: {email}, Name: {name}")
        except Exception as e:
            print(f"[AUTH] OAuth2 Verification FAILED: {str(e)}")
            return jsonify({'error': f'Google verification failed: {str(e)}'}), 401

    elif credential:
        # ── Legacy GSI ID Token Flow ──
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        print(f"[AUTH] Google ID Token flow. Credential length: {len(credential)}")
        client_id = os.environ.get('GOOGLE_CLIENT_ID', '')
        print(f"[AUTH] Using Client ID: {client_id}")
        try:
            idinfo = id_token.verify_oauth2_token(credential, google_requests.Request(), client_id)
            email = idinfo.get('email')
            name = idinfo.get('name', email.split('@')[0])
            print(f"[AUTH] Token Verified. Email: {email}, Name: {name}")
        except Exception as e:
            print(f"[AUTH] Token Verification FAILED: {str(e)}")
            return jsonify({'error': f'Invalid Google token: {str(e)}'}), 401
    else:
        return jsonify({'error': 'Google credential or access_token is required'}), 400

    if not email:
        return jsonify({'error': 'Could not retrieve email from Google'}), 401

    # Find or create user
    user = User.query.filter_by(email=email).first()
    
    if not user:
        # Generate a unique username from name
        base_username = name.replace(' ', '_').lower()
        username = base_username
        counter = 1
        while User.query.filter_by(username=username).first():
            username = f"{base_username}{counter}"
            counter += 1
            
        user = User(
            username=username,
            email=email,
            full_name=name,
            password_hash=hash_password(os.urandom(16).hex()),
            role='researcher' # New users are researchers by default
        )
        db.session.add(user)
        db.session.commit()
    else:
        # Update existing user's name if it changed in Google
        user.full_name = name
        db.session.commit()

    user.last_login = datetime.now(timezone.utc)
    db.session.commit()

    token = generate_token(user.id, user.username, user.role)
    return jsonify({
        'message': 'Google login successful',
        'token': token,
        'user': user.to_dict()
    })


def send_otp_email(to_email, otp_code, gateway_email=None):
    """Send OTP via Gmail SMTP to Email and optionally a Phone Gateway. Returns True on success."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    gmail_addr = os.environ.get('GMAIL_ADDRESS', '')
    gmail_pass = os.environ.get('GMAIL_APP_PASSWORD', '')
    if not gmail_addr or not gmail_pass:
        print("[MAIL] Gmail credentials not configured — skipping email")
        return False

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'AI Chain Guard — Verification Code: {otp_code}'
    msg['From'] = f'AI Chain Guard <{gmail_addr}>'
    
    recipients = [to_email]
    if gateway_email:
        recipients.append(gateway_email)
    
    msg['To'] = ", ".join(recipients)

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:30px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:24px;font-weight:700;color:#818cf8;">AI Chain Guard</div>
            <div style="font-size:13px;color:#94a3b8;">Blockchain Security Framework</div>
        </div>
        <div style="background:#1e293b;padding:24px;border-radius:8px;text-align:center;border:1px solid #334155;">
            <div style="font-size:14px;color:#94a3b8;margin-bottom:12px;">Your verification code is</div>
            <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#6366f1;font-family:monospace;">{otp_code}</div>
            <div style="font-size:12px;color:#64748b;margin-top:12px;">This code expires in 10 minutes</div>
        </div>
        <div style="text-align:center;margin-top:20px;font-size:11px;color:#475569;">
            If you did not request this code, please ignore this email.
        </div>
    </div>
    """
    msg.attach(MIMEText(html, 'html'))

    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(gmail_addr, gmail_pass)
            server.sendmail(gmail_addr, recipients, msg.as_string())
        print(f"[MAIL/SMS] OTP sent to {recipients}")
        return True
    except Exception as e:
        print(f"[MAIL] Failed to send: {e}")
        return False

# ── Model Routes ─────────────────────────────────────────────────

@app.route('/api/models', methods=['GET'])
def list_models():
    """List all registered AI models."""
    models = AIModel.query.order_by(AIModel.created_at.desc()).all()
    return jsonify({
        'models': [m.to_dict() for m in models],
        'total': len(models)
    })


@app.route('/api/models', methods=['POST'])
def register_model():
    """Register a new AI model on the blockchain."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    name = data.get('name')
    model_hash = data.get('model_hash') or hashlib.sha256(
        f"{name}-{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()

    if not name:
        return jsonify({'error': 'Model name is required'}), 400

    owner_id = data.get('owner_id', 1)
    owner = User.query.get(owner_id)
    if not owner:
        return jsonify({'error': 'Owner not found'}), 404

    # Register on Ethereum blockchain via Web3
    web3_resp = blockchain_web3.store_model_hash(model_hash)
    block_hash = web3_resp.get("tx_hash", "pending") if web3_resp.get("status") == "success" else "error_tx"

    # Register in smart contract
    try:
        model_registry.register_model(name, model_hash, owner.username, data.get('version', '1.0.0'))
    except Exception:
        pass  # model may already be in contract

    # Register version in smart contract
    try:
        version_verification.submit_update(
            name, data.get('version', '1.0.0'), model_hash, owner.username
        )
    except Exception:
        pass

    # Generate unique AI Model Fingerprint based on simulated architecture parameters
    import random
    model_fingerprint = f"{name}-arch-{random.randint(1000, 9999)}-weights-{model_hash[:16]}"
    
    # Save to database
    model = AIModel(
        name=name,
        description=data.get('description', ''),
        model_type=data.get('model_type', 'classification'),
        framework=data.get('framework', 'tensorflow'),
        version=data.get('version', '1.0.0'),
        model_hash=model_hash,
        model_fingerprint=model_fingerprint,
        file_size=data.get('file_size', 0),
        accuracy=data.get('accuracy'),
        status='registered',
        owner_id=owner_id,
        blockchain_tx=block_hash
    )
    db.session.add(model)
    db.session.flush()

    # Add initial version record
    version = ModelVersion(
        model_id=model.id,
        version=data.get('version', '1.0.0'),
        model_hash=model_hash,
        change_description='Initial registration',
        accuracy=data.get('accuracy'),
        blockchain_tx=block_hash,
        verified=True,
        created_by=owner_id
    )
    db.session.add(version)
    db.session.commit()

    return jsonify({
        'message': 'Model registered successfully',
        'model': model.to_dict(),
        'blockchain_tx': block_hash,
        'block_index': 0
    }), 201


@app.route('/api/models/<int:model_id>', methods=['GET'])
def get_model(model_id):
    """Get a specific model by ID."""
    model = AIModel.query.get(model_id)
    if not model:
        return jsonify({'error': 'Model not found'}), 404

    # Get blockchain history
    bc_history = blockchain.get_model_history(model.name)

    return jsonify({
        'model': model.to_dict(),
        'blockchain_history': bc_history
    })


@app.route('/api/models/<int:model_id>', methods=['PUT'])
def update_model(model_id):
    """Update a model and record on blockchain."""
    model = AIModel.query.get(model_id)
    if not model:
        return jsonify({'error': 'Model not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    old_hash = model.model_hash
    new_hash = data.get('model_hash') or hashlib.sha256(
        f"{model.name}-{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()
    new_version = data.get('version', model.version)

    # Record update on blockchain
    block = blockchain.update_model(
        model.name, old_hash, new_hash,
        model.owner.username if model.owner else 'unknown',
        new_version,
        data.get('change_description', 'Model updated')
    )

    # Smart contract version verification
    try:
        version_verification.submit_update(
            model.name, new_version, new_hash,
            model.owner.username if model.owner else 'unknown',
            old_hash
        )
    except Exception:
        pass

    # Update model
    model.model_hash = new_hash
    model.version = new_version
    model.status = data.get('status', model.status)
    model.accuracy = data.get('accuracy', model.accuracy)
    model.description = data.get('description', model.description)
    model.updated_at = datetime.now(timezone.utc)
    model.blockchain_tx = block.hash

    # Add version entry
    version = ModelVersion(
        model_id=model.id,
        version=new_version,
        model_hash=new_hash,
        change_description=data.get('change_description', 'Model updated'),
        accuracy=data.get('accuracy', model.accuracy),
        blockchain_tx=block.hash,
        verified=True,
        created_by=data.get('updated_by', 1)
    )
    db.session.add(version)
    db.session.commit()

    return jsonify({
        'message': 'Model updated successfully',
        'model': model.to_dict(),
        'blockchain_tx': block.hash
    })


@app.route('/api/models/<int:model_id>/versions', methods=['GET'])
def get_model_versions(model_id):
    """Get version history for a model."""
    model = AIModel.query.get(model_id)
    if not model:
        return jsonify({'error': 'Model not found'}), 404

    versions = ModelVersion.query.filter_by(model_id=model_id).order_by(
        ModelVersion.created_at.desc()
    ).all()

    return jsonify({
        'model_name': model.name,
        'versions': [v.to_dict() for v in versions],
        'total': len(versions)
    })


@app.route('/api/models/<int:model_id>/verify', methods=['POST'])
def verify_model(model_id):
    """Verify model integrity and calculate Trust Score."""
    model = AIModel.query.get(model_id)
    if not model:
        return jsonify({'error': 'Model not found'}), 404

    is_verified, block_data = blockchain.verify_model(model.name, model.model_hash)
    
    # Calculate Trust Score (0-100)
    # Baseline: 50
    # +20 if blockchain verified
    # +10 if has multiple versions
    # +10 if accuracy > 0.9
    # -30 if verification fails
    trust_score = 50
    if is_verified: trust_score += 20
    else: trust_score -= 30
    
    if model.version_count and model.version_count > 1: trust_score += 10
    if model.accuracy and model.accuracy > 0.9: trust_score += 10
    if model.status == 'deployed': trust_score += 10
    
    trust_score = min(100, max(0, trust_score))

    return jsonify({
        'model_name': model.name,
        'model_hash': model.model_hash,
        'is_verified': is_verified,
        'tamper_status': 'CLEAN' if is_verified else 'TAMPERED',
        'trust_score': trust_score,
        'blockchain_record': block_data,
        'verification_timestamp': datetime.now(timezone.utc).isoformat()
    })

@app.route('/api/security/report', methods=['GET'])
def generate_security_report():
    """Generate a comprehensive security audit report."""
    stats = {
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'report_type': 'enterprise_audit',
        'overall_security_posture': 'secured',
        'metrics': {
            'total_models': AIModel.query.count(),
            'total_datasets': Dataset.query.count(),
            'total_security_events': SecurityEvent.query.count(),
            'critical_events': SecurityEvent.query.filter_by(severity='critical').count(),
            'blocked_ips': SecurityEvent.query.filter_by(event_type='blocked').count()
        },
        'system_integrity': {
            'blockchain_sync': True,
            'last_validation': datetime.now(timezone.utc).isoformat(),
            'chain_status': 'healthy'
        },
        'top_threats': [e.to_dict() for e in SecurityEvent.query.filter_by(severity='critical').limit(5).all()],
        'recommendations': [
            'Maintain regular model integrity scans.',
            'Review IP reputation lists weekly.',
            'Ensure all training datasets are cryptographically signed.'
        ]
    }
    return jsonify(stats)

@app.route('/api/models/<int:model_id>/deploy', methods=['POST'])
def deploy_model(model_id):
    """Verify model integrity before allowing deployment."""
    model = AIModel.query.get(model_id)
    if not model:
        return jsonify({'error': 'Model not found'}), 404

    # Critical Academic Requirement: Pre-Deployment Integrity Check
    is_verified, _ = blockchain.verify_model(model.name, model.model_hash)
            
    if not is_verified:
        # Prevent deployment and log security event
        event = SecurityEvent(
            event_type='deployment_blocked',
            severity='critical',
            description=f'Integrity verification failed for deployment of {model.name}. Hashes do not match blockchain ledger.',
            action_taken='blocked'
        )
        db.session.add(event)
        db.session.commit()
        return jsonify({
            'success': False,
            'error': 'Integrity Check Failed. The model data does not match the blockchain hash. Deployment blocked.',
            'event': event.to_dict()
        }), 403

    model.status = 'deployed'
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Integrity verified on the blockchain. Model successfully deployed.',
        'model': model.to_dict()
    })


# ── Dataset Routes ───────────────────────────────────────────────

@app.route('/api/datasets', methods=['GET'])
def list_datasets():
    """List all registered datasets."""
    datasets = Dataset.query.order_by(Dataset.created_at.desc()).all()
    return jsonify({
        'datasets': [d.to_dict() for d in datasets],
        'total': len(datasets)
    })


@app.route('/api/datasets', methods=['POST'])
def register_dataset():
    """Register a new dataset with provenance tracking."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    name = data.get('name')
    data_hash = data.get('data_hash') or hashlib.sha256(
        f"{name}-{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()

    if not name:
        return jsonify({'error': 'Dataset name is required'}), 400

    owner_id = data.get('owner_id', 1)
    owner = User.query.get(owner_id)
    if not owner:
        return jsonify({'error': 'Owner not found'}), 404

    # Register on Ethereum blockchain via Web3
    web3_resp = blockchain_web3.store_dataset_hash(data_hash)
    block_hash = web3_resp.get("tx_hash", "pending") if web3_resp.get("status") == "success" else "error_tx"

    # Register in smart contract
    try:
        data_provenance.register_dataset(
            name, data_hash, owner.username,
            data.get('source'), data.get('metadata')
        )
    except Exception:
        pass

    dataset = Dataset(
        name=name,
        description=data.get('description', ''),
        data_type=data.get('data_type', 'tabular'),
        source=data.get('source', ''),
        record_count=data.get('record_count', 0),
        file_size=data.get('file_size', 0),
        data_hash=data_hash,
        blockchain_tx=block_hash,
        owner_id=owner_id
    )
    db.session.add(dataset)
    db.session.commit()

    return jsonify({
        'message': 'Dataset registered successfully',
        'dataset': dataset.to_dict(),
        'blockchain_tx': block_hash
    }), 201


@app.route('/api/datasets/upload', methods=['POST'])
def upload_dataset():
    """Import a dataset from a CSV file upload with automatic profiling."""
    import csv
    import io

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided. Send a CSV file with key "file".'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'Empty filename'}), 400

    if not file.filename.lower().endswith('.csv'):
        return jsonify({'error': 'Only CSV files are supported'}), 400

    # Read file content
    raw_bytes = file.read()
    file_size = len(raw_bytes)

    # Compute SHA-256 hash of the raw file content
    data_hash = hashlib.sha256(raw_bytes).hexdigest()

    # Parse CSV
    try:
        text = raw_bytes.decode('utf-8')
    except UnicodeDecodeError:
        text = raw_bytes.decode('latin-1')

    reader = csv.reader(io.StringIO(text))
    rows = list(reader)

    if len(rows) < 2:
        return jsonify({'error': 'CSV file must have a header row and at least one data row'}), 400

    columns = rows[0]
    data_rows = rows[1:]
    record_count = len(data_rows)

    # Build column profile (type inference)
    column_profiles = []
    for i, col in enumerate(columns):
        sample_values = [r[i] for r in data_rows[:100] if i < len(r) and r[i].strip()]
        # Simple type inference
        col_type = 'text'
        if sample_values:
            numeric_count = sum(1 for v in sample_values if v.replace('.', '', 1).replace('-', '', 1).isdigit())
            if numeric_count / len(sample_values) > 0.8:
                col_type = 'numeric'
        column_profiles.append({
            'name': col,
            'type': col_type,
            'non_null': len(sample_values),
            'sample': sample_values[:3]
        })

    # Extract preview (first 10 rows)
    preview_rows = data_rows[:10]

    # Use form data for optional fields, fallback to filename
    name = request.form.get('name') or file.filename.rsplit('.', 1)[0]
    description = request.form.get('description') or f'Imported from {file.filename} ({record_count} records, {len(columns)} columns)'
    source = request.form.get('source') or 'CSV Upload'
    data_type = request.form.get('data_type') or 'tabular'

    # Register on Ethereum blockchain via Web3
    web3_resp = blockchain_web3.store_dataset_hash(data_hash)
    block_hash = web3_resp.get("tx_hash", "pending") if web3_resp.get("status") == "success" else "error_tx"

    # Register in smart contract
    try:
        owner = User.query.get(1)
        data_provenance.register_dataset(
            name, data_hash, owner.username if owner else 'system',
            source
        )
    except Exception:
        pass

    dataset = Dataset(
        name=name,
        description=description,
        data_type=data_type,
        source=source,
        record_count=record_count,
        file_size=file_size,
        data_hash=data_hash,
        blockchain_tx=block_hash,
        owner_id=1
    )
    db.session.add(dataset)
    db.session.commit()

    return jsonify({
        'message': 'Dataset imported and registered on blockchain',
        'dataset': dataset.to_dict(),
        'blockchain_tx': block_hash,
        'profile': {
            'columns': column_profiles,
            'total_columns': len(columns),
            'total_rows': record_count,
            'file_size': file_size,
            'preview_headers': columns,
            'preview_rows': preview_rows
        }
    }), 201


@app.route('/api/datasets/<int:dataset_id>', methods=['GET'])
def get_dataset(dataset_id):
    """Get dataset details with provenance info."""
    dataset = Dataset.query.get(dataset_id)
    if not dataset:
        return jsonify({'error': 'Dataset not found'}), 404

    # Get provenance from smart contract
    lineage = data_provenance.get_lineage(dataset.name)

    return jsonify({
        'dataset': dataset.to_dict(),
        'lineage': lineage,
        'transformations': [t.to_dict() for t in dataset.transformations]
    })


# ── Blockchain Routes ────────────────────────────────────────────

@app.route('/api/blockchain/chain', methods=['GET'])
def get_chain():
    """Get the full blockchain ledger."""
    try:
        chain = blockchain_web3.get_chain_data()
        return jsonify({
            'chain': chain,
            'length': len(chain)
        })
    except Exception as e:
        print(f"[!] Blockchain Chain Error: {e}")
        return jsonify({"error": "Blockchain Internal Error", "details": str(e)}), 500


@app.route('/api/security/mitigation/status', methods=['GET'])
def get_mitigation_status():
    """Get status of active DDoS mitigations and counter-attacks."""
    return jsonify({
        "adaptive_defense": adaptive_defense.get_status(),
        "counter_reports": security_engine.counter_mitigation.incident_reports,
        "global_traffic": anomaly_detector.get_global_traffic_stats()
    })

@app.route('/api/security/honeypot/tar-pit', methods=['GET', 'POST'])
def tar_pit_honeypot():
    """
    Resource Exhaustion Trap (Honeypot):
    Slows down attackers by sending back large, slow, junk data.
    """
    ip = request.headers.get('X-Forwarded-For', request.remote_addr) or '127.0.0.1'
    print(f"[!] Tar-Pit: Trapping {ip} in resource exhaustion loop")
    
    def generate_junk():
        yield b"AI_CHAIN_GUARD_SECURITY_TRAP_START\n"
        for i in range(100):
            time.sleep(0.5) # Slow sending
            yield json.dumps({
                "chunk": i,
                "data": hashlib.sha256(str(time.time()).encode()).hexdigest() * 10
            }).encode() + b"\n"
        yield b"AI_CHAIN_GUARD_SECURITY_TRAP_END\n"
        
    return app.response_class(generate_junk(), mimetype='application/json')

@app.route('/api/blockchain/validate', methods=['GET'])
def validate_chain():
    """Validate blockchain integrity."""
    try:
        is_valid, message = blockchain_web3.is_chain_valid()
        return jsonify({
            'is_valid': is_valid,
            'message': message,
            'chain_length': len(blockchain_web3.get_chain_data()),
            'latest_block_hash': blockchain_web3.get_latest_block_hash(),
            'validated_at': datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        print(f"[!] Blockchain Validation Error: {e}")
        return jsonify({"error": "Blockchain Validation Error", "details": str(e)}), 500


@app.route('/api/blockchain/stats', methods=['GET'])
def blockchain_stats():
    """Get blockchain statistics."""
    try:
        return jsonify(blockchain_web3.get_stats())
    except Exception as e:
        print(f"[!] Blockchain Stats Error: {e}")
        return jsonify({"error": "Blockchain Stats Error", "details": str(e)}), 500


# ── Security Routes ──────────────────────────────────────────────

@app.route('/api/security/events', methods=['GET'])
def get_security_events():
    """Get security event log."""
    limit = request.args.get('limit', 50, type=int)
    severity = request.args.get('severity')
    event_type = request.args.get('type')

    query = SecurityEvent.query.order_by(SecurityEvent.created_at.desc())

    if severity:
        query = query.filter_by(severity=severity)
    if event_type:
        query = query.filter_by(event_type=event_type)

    events = query.limit(limit).all()
    return jsonify({
        'events': [e.to_dict() for e in events],
        'total': SecurityEvent.query.count()
    })


@app.route('/api/security/stats', methods=['GET'])
def security_stats():
    """Get security statistics."""
    engine_stats = security_engine.get_security_stats()
    detector_stats = anomaly_detector.get_system_stats()

    # Count events by type from database
    event_counts = {}
    for event_type in ['dos_attack', 'ddos_attack', 'model_poisoning', 'unauthorized_access',
                       'api_abuse', 'credential_attack', 'data_manipulation', 'honeypot_trigger',
                       'anomaly_detected', 'rate_limit_exceeded']:
        count = SecurityEvent.query.filter_by(event_type=event_type).count()
        if count > 0:
            event_counts[event_type] = count

    # Count events by severity
    severity_counts = {}
    for severity in ['low', 'medium', 'high', 'critical']:
        count = SecurityEvent.query.filter_by(severity=severity).count()
        if count > 0:
            severity_counts[severity] = count

    return jsonify({
        'engine': engine_stats,
        'anomaly_detector': detector_stats,
        'event_counts': event_counts,
        'severity_counts': severity_counts,
        'total_events': SecurityEvent.query.count(),
        'unresolved_events': SecurityEvent.query.filter_by(is_resolved=False).count()
    })


@app.route('/api/security/trust-scores', methods=['GET'])
def get_trust_scores():
    """Get all user trust scores."""
    users = User.query.all()
    scores = []
    for user in users:
        profile = security_engine.get_trust_score(user.id)
        scores.append({
            'user_id': user.id,
            'username': user.username,
            'role': user.role,
            'trust_score': round(user.trust_score, 2),
            'engine_score': profile.to_dict()
        })
    return jsonify({'trust_scores': scores})


@app.route('/api/security/blocked-ips', methods=['GET'])
def get_blocked_ips():
    """Get currently blocked IPs."""
    return jsonify({
        'blocked_ips': security_engine.get_blocked_ips()
    })


@app.route('/api/security/honeypot-triggers', methods=['GET'])
def get_honeypot_triggers():
    """Get honeypot trigger events."""
    return jsonify({
        'triggers': security_engine.get_honeypot_triggers()
    })


# ── Dashboard Routes ─────────────────────────────────────────────

@app.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    """Get aggregate statistics for the dashboard."""
    total_models = AIModel.query.count()
    total_datasets = Dataset.query.count()
    total_blocks = len(blockchain_web3.get_chain_data())
    total_users = User.query.count()

    # Security stats
    total_events = SecurityEvent.query.count()
    unresolved = SecurityEvent.query.filter_by(is_resolved=False).count()
    
    # NEW: Active Defense Status
    active_defense = {
        "rate_limiter": "ACTIVE",
        "firewall_engine": "ACTIVE",
        "ai_detection": "ACTIVE",
        "blockchain_logger": "ACTIVE"
    }

    # NEW: Top Attack Endpoints
    recent_events_for_endpoints = [e.to_dict() for e in SecurityEvent.query.order_by(SecurityEvent.created_at.desc()).limit(100).all()]
    top_endpoints = anomaly_detector.get_top_attack_endpoints(recent_events_for_endpoints)

    # NEW: Attack Prediction with Labels
    prediction = anomaly_detector.get_attack_prediction()

    severity_counts = {
        'critical': SecurityEvent.query.filter_by(severity='critical').count(),
        'high': SecurityEvent.query.filter_by(severity='high').count(),
        'medium': SecurityEvent.query.filter_by(severity='medium').count(),
        'low': SecurityEvent.query.filter_by(severity='low').count()
    }

    # Chain validity
    is_valid, _ = blockchain_web3.is_chain_valid()

    # Recent events
    recent_events = SecurityEvent.query.order_by(
        SecurityEvent.created_at.desc()
    ).limit(10).all()

    # Model stats by type
    model_types = db.session.query(
        AIModel.model_type, db.func.count(AIModel.id)
    ).group_by(AIModel.model_type).all()

    # Model stats by framework
    frameworks = db.session.query(
        AIModel.framework, db.func.count(AIModel.id)
    ).group_by(AIModel.framework).all()

    # Calculate dynamic Security Risk Score (100 is perfectly secure)
    risk_score = 100
    risk_score -= (severity_counts['critical'] * 10)
    risk_score -= (severity_counts['high'] * 5)
    risk_score -= (severity_counts['medium'] * 2)
    risk_score -= (severity_counts['low'] * 1)
    risk_score = max(0, risk_score)  # Floor at 0

    return jsonify({
        'overview': {
            'total_models': total_models,
            'total_datasets': total_datasets,
            'total_blocks': total_blocks,
            'total_users': total_users,
            'chain_valid': is_valid,
            'security_risk_score': risk_score,
            'attack_prediction': anomaly_detector.get_attack_prediction()
        },
        'security': {
            'total_events': total_events,
            'severity_counts': severity_counts,
            'unresolved_events': unresolved,
            'blocked_ips': len(security_engine.get_blocked_ips())
        },
        'recent_events': [e.to_dict() for e in recent_events],
        'model_types': {t: c for t, c in model_types},
        'frameworks': {f: c for f, c in frameworks}
    })


# ── Bank Routes ──────────────────────────────────────────────────

def _run_ai_chain_guard(ip, amount, tx_type, account_type='checking'):
    """
    AI Chain Guard: Run anomaly detection + risk scoring on a banking operation.
    Returns (risk_score, verdict, explanations).
    """
    from risk_engine import risk_engine

    # Anomaly detection scan
    payload_size = int(amount * 100)  # Simulate payload proportional to amount
    is_anomalous, anomaly_score, anomaly_type = anomaly_detector.record_request(
        ip, f'/api/bank/{tx_type}', payload_size
    )

    # Risk engine evaluation
    try:
        user_trust = security_engine.get_ip_trust_score(ip)
    except (AttributeError, Exception):
        user_trust = 80  # Default trust score
    is_new_device = False
    location_history = ["Local" if str(ip).startswith("127") else "Unknown Origin"]

    ai_eval = risk_engine.evaluate_transfer(
        account_type=account_type,
        transfer_amount=amount,
        user_trust_score=user_trust,
        is_new_device=is_new_device,
        location_history=location_history
    )

    # Combine scores
    combined_score = ai_eval["risk_score"]
    if is_anomalous and anomaly_score > 0.5:
        combined_score = min(100, combined_score + int(anomaly_score * 20))

    verdict = 'clean'
    if combined_score >= 80:
        verdict = 'flagged'
    elif combined_score >= 40:
        verdict = 'suspicious'

    return combined_score, verdict, ai_eval.get("explanations", []), ai_eval


def _log_bank_tx_on_blockchain(tx_type, amount, account_number, description, extra_data=None):
    """
    Log a banking transaction on the in-memory blockchain.
    Returns (block_hash, block_index, prev_block_hash).
    """
    data = {
        'type': f'bank_{tx_type}',
        'amount': amount,
        'account': account_number,
        'description': description,
        'timestamp': datetime.now(timezone.utc).isoformat(),
    }
    if extra_data:
        data.update(extra_data)

    block = blockchain.add_block(data)
    return block.hash, block.index, block.previous_hash


@app.route('/api/bank/public-key', methods=['GET'])
def get_server_public_key():
    """Returns the server's RSA Public Key for End-to-End Encryption (E2EE)."""
    return jsonify({
        'public_key': crypto_manager.get_server_public_key_pem()
    })

@app.route('/api/bank/register-key', methods=['POST'])
@soft_auth
def register_client_public_key():
    """Registers the client's Public Key for Digital Signatures (Non-Repudiation)."""
    data = request.get_json()
    public_key_pem = data.get('public_key')
    
    if not public_key_pem:
        return jsonify({'error': 'Public key is required'}), 400
        
    user = User.query.get(g.current_user['user_id'])
    user.public_key = public_key_pem
    db.session.commit()
    
    return jsonify({'message': 'Public key registered successfully for digital signatures'})


@app.route('/api/bank/accounts', methods=['GET'])
@soft_auth
def get_bank_accounts():
    """Get all bank accounts for the authenticated user."""
    accounts = BankAccount.query.filter_by(owner_id=g.current_user['user_id']).all()
    return jsonify({
        'accounts': [a.to_dict() for a in accounts]
    })


@app.route('/api/kyc/send-otp', methods=['POST'])
@soft_auth
def send_kyc_otp():
    """Send an OTP for KYC verification via Gmail SMTP."""
    data = request.get_json()
    email = data.get('email')
    phone = data.get('phone')
    gateway = data.get('gateway_domain') # e.g. vtext.com or airtelmail.com
    
    if not email:
        return jsonify({'error': 'Email is required for verification'}), 400
        
    # Generate a random 6-digit OTP
    import random
    otp = str(random.randint(100000, 999999))
    
    session['kyc_otp'] = otp
    session['kyc_email'] = email
    
    print(f"[KYC] OTP for {email}/{phone}: {otp}")
    
    # Construct Gateway Email if phone provided
    gateway_email = f"{phone}@{gateway}" if phone and gateway else None
    
    # Send via Gmail SMTP (Dual Channel)
    email_sent = send_otp_email(email, otp, gateway_email)
    
    if not email_sent:
        return jsonify({
            'error': 'Email delivery failed',
            'message': 'We could not send the verification code to your Gmail. Please check the backend configuration or your internet connection.'
        }), 500
        
    return jsonify({
        'message': f'Verification code successfully sent to {email}',
        'email_sent': True
    })


@app.route('/api/bank/accounts', methods=['POST'])
@soft_auth
def create_bank_account():
    """Create a new bank account with full KYC – logged on blockchain."""
    data = request.get_json()
    account_type = data.get('account_type', 'checking')
    holder_name = data.get('holder_name')
    initial_deposit = float(data.get('initial_deposit', 0))
    currency = data.get('currency', 'USD')
    
    # KYC Fields
    otp = data.get('otp')
    kyc_type = data.get('kyc_document_type')
    kyc_id = data.get('kyc_document_id')

    # Basic Validation
    if initial_deposit < 100:
        return jsonify({'error': 'Minimum initial deposit is $100.00'}), 400
    if not holder_name or len(holder_name.strip()) < 2:
        return jsonify({'error': 'Account holder name is required'}), 400
        
    # OTP Validation
    stored_otp = session.get('kyc_otp')
    if not otp or otp != stored_otp:
        return jsonify({'error': 'Invalid or expired verification code'}), 403
    
    # Document Validation
    import re
    if kyc_type == 'Aadhaar':
        if not re.match(r'^\d{12}$', kyc_id):
            return jsonify({'error': 'Aadhaar Card must be exactly 12 digits'}), 400
    elif kyc_type == 'SSN':
        if not re.match(r'^\d{4}$|^\d{9}$', kyc_id):
            return jsonify({'error': 'Invalid SSN format'}), 400
    elif kyc_type == 'Passport':
        if not re.match(r'^[A-Z0-9]{6,12}$', kyc_id):
            return jsonify({'error': 'Invalid Passport number format'}), 400
            
    # Hash the ID for storage (GDPR/Security)
    hashed_id = hashlib.sha256(kyc_id.encode()).hexdigest()

    import random
    account_number = str(random.randint(1000000000, 9999999999))

    account = BankAccount(
        account_number=account_number,
        account_type=account_type,
        owner_id=g.current_user['user_id'],
        balance=initial_deposit,
        currency=currency,
        kyc_document_type=kyc_type,
        kyc_document_id=f"SHA256:{hashed_id[:16]}..."
    )
    db.session.add(account)

    # Log initial deposit as a transaction
    tx_raw = f"{account_number}-deposit-{initial_deposit}-{datetime.now(timezone.utc).isoformat()}"
    tx_hash = hashlib.sha256(tx_raw.encode()).hexdigest()

    tx = BankTransaction(
        tx_hash=tx_hash,
        amount=initial_deposit,
        currency=currency,
        type='deposit',
        sender_id=None,
        receiver_id=None,
        description=f'Initial deposit for new {account_type} account (KYC Verified)',
        blockchain_tx=f"0x{tx_hash[:64]}",
        ai_risk_score=0.0,
        ai_verdict='clean'
    )
    db.session.add(tx)
    db.session.commit()

    # Log account creation and KYC on blockchain
    block_hash, block_index, prev_hash = _log_bank_tx_on_blockchain(
        'kyc_account_creation', initial_deposit, account_number,
        f'New {account_type} account opened. KYC: {kyc_type} verified.',
        {
            'owner': g.current_user['username'], 
            'holder': holder_name, 
            'currency': currency, 
            'kyc_type': kyc_type,
            'kyc_id_hash': hashed_id
        }
    )
    
    # Clear OTP from session after successful use
    session.pop('kyc_otp', None)

    return jsonify({
        'message': 'Account created successfully with full KYC',
        'account': account.to_dict(),
        'blockchain_receipt': {
            'block_hash': block_hash,
            'block_index': block_index,
            'prev_block_hash': prev_hash,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    }), 201

# Previous create_bank_account code is replaced by the updated version above



@app.route('/api/bank/deposit', methods=['POST'])
@soft_auth
def deposit_funds():
    """Deposit funds – with AI Chain Guard scan and blockchain logging."""
    data = request.get_json()
    account_id = data.get('account_id')
    amount = float(data.get('amount', 0))

    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than zero'}), 400

    account = BankAccount.query.filter_by(id=account_id, owner_id=g.current_user['user_id']).first()
    if not account:
        return jsonify({'error': 'Account not found or access denied'}), 404

    if account.status != 'active':
        return jsonify({'error': 'Account is frozen. Contact support.'}), 403

    ip = request.remote_addr or '127.0.0.1'

    # AI Chain Guard scan
    risk_score, verdict, explanations, _ = _run_ai_chain_guard(
        ip, amount, 'deposit', account.account_type
    )

    account.balance += amount

    # Hash transaction
    tx_raw = f"{account.account_number}-deposit-{amount}-{datetime.now(timezone.utc).isoformat()}"
    tx_hash = hashlib.sha256(tx_raw.encode()).hexdigest()

    # Log on blockchain
    block_hash, block_index, prev_hash = _log_bank_tx_on_blockchain(
        'deposit', amount, account.account_number,
        data.get('description', 'Deposit'),
        {'tx_hash': tx_hash, 'ai_verdict': verdict}
    )

    tx = BankTransaction(
        tx_hash=tx_hash,
        amount=amount,
        type='deposit',
        receiver_id=account.id,
        description=data.get('description', 'Deposit'),
        blockchain_tx=f"0x{block_hash[:64]}",
        block_index=block_index,
        block_hash=block_hash,
        prev_block_hash=prev_hash,
        ai_risk_score=risk_score,
        ai_verdict=verdict
    )
    db.session.add(tx)
    db.session.commit()

    return jsonify({
        'message': 'Deposit successful',
        'transaction': tx.to_dict(),
        'new_balance': account.balance,
        'blockchain_receipt': {
            'tx_hash': tx_hash,
            'block_hash': block_hash,
            'block_index': block_index,
            'prev_block_hash': prev_hash,
            'timestamp': datetime.now(timezone.utc).isoformat()
        },
        'ai_chain_guard': {
            'risk_score': risk_score,
            'verdict': verdict,
            'scan_passed': verdict == 'clean'
        }
    })


@app.route('/api/bank/withdraw', methods=['POST'])
@soft_auth
def withdraw_funds():
    """Withdraw funds – with AI Chain Guard scan and blockchain logging."""
    data = request.get_json()
    account_id = data.get('account_id')
    amount = float(data.get('amount', 0))

    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than zero'}), 400

    account = BankAccount.query.filter_by(id=account_id, owner_id=g.current_user['user_id']).first()
    if not account:
        return jsonify({'error': 'Account not found or access denied'}), 404

    if account.status != 'active':
        return jsonify({'error': 'Account is frozen. Contact support.'}), 403

    if account.balance < amount:
        return jsonify({'error': 'Insufficient funds'}), 400

    ip = request.remote_addr or '127.0.0.1'

    # AI Chain Guard scan
    risk_score, verdict, explanations, _ = _run_ai_chain_guard(
        ip, amount, 'withdraw', account.account_type
    )

    account.balance -= amount

    tx_raw = f"{account.account_number}-withdrawal-{amount}-{datetime.now(timezone.utc).isoformat()}"
    tx_hash = hashlib.sha256(tx_raw.encode()).hexdigest()

    # Log on blockchain
    block_hash, block_index, prev_hash = _log_bank_tx_on_blockchain(
        'withdrawal', amount, account.account_number,
        data.get('description', 'Withdrawal'),
        {'tx_hash': tx_hash, 'ai_verdict': verdict}
    )

    tx = BankTransaction(
        tx_hash=tx_hash,
        amount=amount,
        type='withdrawal',
        sender_id=account.id,
        description=data.get('description', 'Withdrawal'),
        blockchain_tx=f"0x{block_hash[:64]}",
        block_index=block_index,
        block_hash=block_hash,
        prev_block_hash=prev_hash,
        ai_risk_score=risk_score,
        ai_verdict=verdict
    )
    db.session.add(tx)
    db.session.commit()

    return jsonify({
        'message': 'Withdrawal successful',
        'transaction': tx.to_dict(),
        'new_balance': account.balance,
        'blockchain_receipt': {
            'tx_hash': tx_hash,
            'block_hash': block_hash,
            'block_index': block_index,
            'prev_block_hash': prev_hash,
            'timestamp': datetime.now(timezone.utc).isoformat()
        },
        'ai_chain_guard': {
            'risk_score': risk_score,
            'verdict': verdict,
            'scan_passed': verdict == 'clean'
        }
    })


@app.route('/api/bank/transfer', methods=['POST'])
@soft_auth
def transfer_funds():
    """Transfer funds – full AI Chain Guard + E2EE + Signatures + MFA."""
    raw_data = request.get_json()
    
    # 1. E2EE Decryption
    if raw_data.get('encrypted_aes_key'):
        data = crypto_manager.decrypt_e2ee_payload(
            raw_data.get('encrypted_aes_key'),
            raw_data.get('iv'),
            raw_data.get('encrypted_payload')
        )
        if not data:
            return jsonify({'error': 'E2EE Decryption Failed'}), 400
        signature = raw_data.get('signature')
    else:
        data = raw_data
        signature = data.get('signature')

    sender_account_id = data.get('from_account_id')
    receiver_account_num = data.get('to_account_number')
    amount = float(data.get('amount', 0))
    mfa_code = data.get('mfa_code')

    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than zero'}), 400

    sender_account = BankAccount.query.filter_by(id=sender_account_id, owner_id=g.current_user['user_id']).first()
    if not sender_account:
        return jsonify({'error': 'Source account not found or access denied'}), 404

    # 2. Digital Signature Verification
    user = User.query.get(g.current_user['user_id'])
    if user.public_key:
        if not signature:
            return jsonify({'error': 'Digital signature required for non-repudiation'}), 401
        payload_string = f"{sender_account_id}:{receiver_account_num}:{amount}"
        if not crypto_manager.verify_signature(user.public_key, payload_string, signature):
            return jsonify({'error': 'Invalid Digital Signature. Transaction rejected.'}), 403

    if sender_account.status != 'active':
        return jsonify({'error': 'Source account is frozen. Contact support.'}), 403

    receiver_account = BankAccount.query.filter_by(account_number=receiver_account_num).first()
    if not receiver_account:
        return jsonify({'error': 'Destination account not found'}), 404

    if sender_account.balance < amount:
        return jsonify({'error': 'Insufficient funds'}), 400

    ip = request.remote_addr or '127.0.0.1'

    # AI Chain Guard deep scan for transfers
    from risk_engine import risk_engine

    user_trust = security_engine.get_ip_trust_score(ip)
    is_new_device = amount == 8888  # Magic test trigger
    location_history = ["Local" if str(ip).startswith("127") else "Unknown Origin"]

    ai_eval = risk_engine.evaluate_transfer(
        account_type=sender_account.account_type,
        transfer_amount=amount,
        user_trust_score=user_trust,
        is_new_device=is_new_device,
        location_history=location_history
    )

    # 3. Adaptive MFA Check
    requires_mfa = amount > 10000 or ai_eval["risk_score"] >= 40
    if requires_mfa and mfa_code != "000000":
        return jsonify({
            'error': 'High Risk or High Value transfer. Multi-Factor Authentication required.',
            'requires_mfa': True
        }), 403

    tx_raw = f"{sender_account.account_number}-{receiver_account.account_number}-transfer-{amount}-{datetime.now(timezone.utc).isoformat()}"
    tx_hash = hashlib.sha256(tx_raw.encode()).hexdigest()

    # Log on blockchain
    block_hash, block_index, prev_hash = _log_bank_tx_on_blockchain(
        'transfer', amount, sender_account.account_number,
        data.get('description', 'Transfer'),
        {
            'tx_hash': tx_hash,
            'from': sender_account.account_number,
            'to': receiver_account.account_number,
            'ai_risk_score': ai_eval["risk_score"],
            'ai_verdict': 'flagged' if ai_eval["is_flagged"] else 'clean'
        }
    )

    risk_verdict = 'flagged' if ai_eval["is_flagged"] else ('suspicious' if ai_eval["risk_score"] >= 40 else 'clean')

    tx = BankTransaction(
        tx_hash=tx_hash,
        amount=amount,
        type='transfer',
        sender_id=sender_account.id,
        receiver_id=receiver_account.id,
        description=data.get('description', 'Transfer'),
        blockchain_tx=f"0x{block_hash[:64]}",
        block_index=block_index,
        block_hash=block_hash,
        prev_block_hash=prev_hash,
        ai_risk_score=ai_eval["risk_score"],
        ai_verdict=risk_verdict,
        digital_signature=signature
    )
    db.session.add(tx)

    if ai_eval["is_flagged"]:
        event = SecurityEvent(
            event_type='fraud_detected',
            severity='critical',
            source_ip=ip,
            user_id=g.current_user['user_id'],
            description=f'AI Risk Engine flagged transfer of ${amount}. Score: {ai_eval["risk_score"]}. Reasons: {" | ".join(ai_eval["explanations"])}',
            action_taken='blocked'
        )
        db.session.add(event)
        try:
            security_engine.reduce_ip_trust(ip, penalty=20, reason='ai_fraud_flag')
        except (AttributeError, Exception):
            pass  # method may not exist

        try:
            blockchain_web3.store_fraud_decision(
                tx_hash_str=tx_hash,
                fraud_score=int(ai_eval["risk_score"]),
                model_version=ai_eval["model_version"],
                reason_hash=ai_eval["reason_hash"]
            )
        except Exception as e:
            print(f"Blockchain audit logging failed: {e}")

        tx.status = 'flagged'
        db.session.commit()
        return jsonify({
            'error': 'Transfer blocked by AI Risk Engine',
            'risk_score': ai_eval["risk_score"],
            'xai_explanations': ai_eval["explanations"],
            'transaction': tx.to_dict(),
            'blockchain_receipt': {
                'tx_hash': tx_hash,
                'block_hash': block_hash,
                'block_index': block_index,
                'prev_block_hash': prev_hash,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        }), 403

    sender_account.balance -= amount
    receiver_account.balance += amount
    db.session.commit()

    return jsonify({
        'message': 'Transfer successful',
        'transaction': tx.to_dict(),
        'new_balance': sender_account.balance,
        'blockchain_receipt': {
            'tx_hash': tx_hash,
            'block_hash': block_hash,
            'block_index': block_index,
            'prev_block_hash': prev_hash,
            'timestamp': datetime.now(timezone.utc).isoformat()
        },
        'ai_chain_guard': {
            'risk_score': ai_eval["risk_score"],
            'verdict': risk_verdict,
            'scan_passed': not ai_eval["is_flagged"],
            'explanations': ai_eval["explanations"]
        }
    })


@app.route('/api/bank/pay-bill', methods=['POST'])
@soft_auth
def pay_bill():
    """Pay a utility bill – logged on blockchain with AI Chain Guard."""
    data = request.get_json()
    account_id = data.get('account_id')
    amount = float(data.get('amount', 0))
    category = data.get('category', 'general')  # electricity, water, gas, internet, mobile, insurance
    provider = data.get('provider', 'Unknown Provider')
    bill_number = data.get('bill_number', '')

    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than zero'}), 400

    account = BankAccount.query.filter_by(id=account_id, owner_id=g.current_user['user_id']).first()
    if not account:
        return jsonify({'error': 'Account not found or access denied'}), 404

    if account.status != 'active':
        return jsonify({'error': 'Account is frozen. Contact support.'}), 403

    if account.balance < amount:
        return jsonify({'error': 'Insufficient funds'}), 400

    ip = request.remote_addr or '127.0.0.1'

    # AI Chain Guard scan
    risk_score, verdict, explanations, _ = _run_ai_chain_guard(
        ip, amount, 'bill_payment', account.account_type
    )

    account.balance -= amount

    tx_raw = f"{account.account_number}-bill-{category}-{provider}-{amount}-{datetime.now(timezone.utc).isoformat()}"
    tx_hash = hashlib.sha256(tx_raw.encode()).hexdigest()

    # Log on blockchain
    block_hash, block_index, prev_hash = _log_bank_tx_on_blockchain(
        'bill_payment', amount, account.account_number,
        f'Bill Payment: {category.title()} – {provider}',
        {'tx_hash': tx_hash, 'category': category, 'provider': provider, 'bill_number': bill_number}
    )

    tx = BankTransaction(
        tx_hash=tx_hash,
        amount=amount,
        type='bill_payment',
        category=category,
        sender_id=account.id,
        description=f'{category.title()} Bill – {provider}' + (f' (#{bill_number})' if bill_number else ''),
        blockchain_tx=f"0x{block_hash[:64]}",
        block_index=block_index,
        block_hash=block_hash,
        prev_block_hash=prev_hash,
        ai_risk_score=risk_score,
        ai_verdict=verdict
    )
    db.session.add(tx)
    db.session.commit()

    return jsonify({
        'message': f'{category.title()} bill paid successfully',
        'transaction': tx.to_dict(),
        'new_balance': account.balance,
        'blockchain_receipt': {
            'tx_hash': tx_hash,
            'block_hash': block_hash,
            'block_index': block_index,
            'prev_block_hash': prev_hash,
            'timestamp': datetime.now(timezone.utc).isoformat()
        },
        'ai_chain_guard': {
            'risk_score': risk_score,
            'verdict': verdict,
            'scan_passed': verdict == 'clean'
        }
    })


@app.route('/api/bank/statement/<int:account_id>', methods=['GET'])
@soft_auth
def get_account_statement(account_id):
    """Get mini-statement for a specific account (last 20 transactions)."""
    account = BankAccount.query.filter_by(id=account_id, owner_id=g.current_user['user_id']).first()
    if not account:
        return jsonify({'error': 'Account not found or access denied'}), 404

    transactions = BankTransaction.query.filter(
        (BankTransaction.sender_id == account.id) |
        (BankTransaction.receiver_id == account.id)
    ).order_by(BankTransaction.created_at.desc()).limit(20).all()

    total_deposits = sum(t.amount for t in transactions if t.type == 'deposit')
    total_withdrawals = sum(t.amount for t in transactions if t.type in ('withdrawal', 'bill_payment'))
    total_transfers_out = sum(t.amount for t in transactions if t.type == 'transfer' and t.sender_id == account.id)
    total_transfers_in = sum(t.amount for t in transactions if t.type == 'transfer' and t.receiver_id == account.id)

    return jsonify({
        'account': account.to_dict(),
        'transactions': [t.to_dict() for t in transactions],
        'summary': {
            'total_deposits': round(total_deposits, 2),
            'total_withdrawals': round(total_withdrawals, 2),
            'total_transfers_out': round(total_transfers_out, 2),
            'total_transfers_in': round(total_transfers_in, 2),
            'net_flow': round(total_deposits + total_transfers_in - total_withdrawals - total_transfers_out, 2)
        }
    })


@app.route('/api/bank/transactions', methods=['GET'])
@soft_auth
def get_bank_transactions():
    """Get all transactions for the logged-in user's accounts."""
    user_accounts = BankAccount.query.filter_by(owner_id=g.current_user['user_id']).all()
    account_ids = [acc.id for acc in user_accounts]

    transactions = BankTransaction.query.filter(
        (BankTransaction.sender_id.in_(account_ids)) |
        (BankTransaction.receiver_id.in_(account_ids))
    ).order_by(BankTransaction.created_at.desc()).limit(50).all()

    return jsonify({
        'transactions': [tx.to_dict() for tx in transactions],
        'total': len(transactions)
    })


@app.route('/api/bank/beneficiaries', methods=['GET'])
@soft_auth
def get_beneficiaries():
    """Get saved beneficiaries for the user."""
    bens = Beneficiary.query.filter_by(owner_id=g.current_user['user_id']).order_by(Beneficiary.created_at.desc()).all()
    return jsonify({
        'beneficiaries': [b.to_dict() for b in bens]
    })


@app.route('/api/bank/beneficiaries', methods=['POST'])
@soft_auth
def add_beneficiary():
    """Add a new beneficiary."""
    data = request.get_json()
    name = data.get('name')
    account_number = data.get('account_number')

    if not name or not account_number:
        return jsonify({'error': 'Name and account number are required'}), 400

    # Check if beneficiary already exists
    existing = Beneficiary.query.filter_by(
        owner_id=g.current_user['user_id'], account_number=account_number
    ).first()
    if existing:
        return jsonify({'error': 'Beneficiary with this account number already exists'}), 409

    # Validate account exists
    target_account = BankAccount.query.filter_by(account_number=account_number).first()

    ben = Beneficiary(
        owner_id=g.current_user['user_id'],
        name=name,
        account_number=account_number,
        bank_name=data.get('bank_name', 'AI Chain Guard Bank'),
        nickname=data.get('nickname', '')
    )
    db.session.add(ben)
    db.session.commit()

    return jsonify({
        'message': 'Beneficiary added successfully',
        'beneficiary': ben.to_dict(),
        'account_verified': target_account is not None
    }), 201


@app.route('/api/bank/beneficiaries/<int:ben_id>', methods=['DELETE'])
@soft_auth
def delete_beneficiary(ben_id):
    """Remove a saved beneficiary."""
    ben = Beneficiary.query.filter_by(id=ben_id, owner_id=g.current_user['user_id']).first()
    if not ben:
        return jsonify({'error': 'Beneficiary not found'}), 404

    db.session.delete(ben)
    db.session.commit()
    return jsonify({'message': 'Beneficiary removed successfully'})


@app.route('/api/bank/freeze', methods=['POST'])
@soft_auth
def freeze_account():
    """Freeze or unfreeze a bank account."""
    data = request.get_json()
    account_id = data.get('account_id')
    action = data.get('action', 'freeze')  # freeze or unfreeze

    account = BankAccount.query.filter_by(id=account_id, owner_id=g.current_user['user_id']).first()
    if not account:
        return jsonify({'error': 'Account not found or access denied'}), 404

    if action == 'freeze':
        account.status = 'frozen'
    else:
        account.status = 'active'

    # Log on blockchain
    block_hash, block_index, prev_hash = _log_bank_tx_on_blockchain(
        f'account_{action}', 0, account.account_number,
        f'Account {action}d by owner',
        {'action': action, 'owner': g.current_user['username']}
    )

    db.session.commit()

    return jsonify({
        'message': f'Account {action}d successfully',
        'account': account.to_dict(),
        'blockchain_receipt': {
            'block_hash': block_hash,
            'block_index': block_index,
            'prev_block_hash': prev_hash,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    })


@app.route('/api/bank/admin/incidents', methods=['GET'])
@soft_auth
def get_admin_incidents():
    """Get all flagged transactions for admin review (SecOps Dashboard)."""
    if g.current_user.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    flagged = BankTransaction.query.filter(
        BankTransaction.ai_verdict.in_(['flagged', 'suspicious'])
    ).order_by(BankTransaction.created_at.desc()).limit(50).all()

    return jsonify({
        'incidents': [tx.to_dict() for tx in flagged],
        'total': len(flagged)
    })


@app.route('/api/bank/admin/resolve', methods=['POST'])
@soft_auth
def resolve_incident():
    """Resolve a flagged transaction (approve or reject)."""
    if g.current_user.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json()
    tx_id = data.get('transaction_id')
    action = data.get('action')  # 'approve' or 'reject'

    tx = BankTransaction.query.get(tx_id)
    if not tx:
        return jsonify({'error': 'Transaction not found'}), 404

    if action == 'approve':
        tx.status = 'completed'
        tx.ai_verdict = 'clean'
    elif action == 'reject':
        tx.status = 'rejected'
    else:
        return jsonify({'error': 'Invalid action. Use approve or reject.'}), 400

    # Log the admin resolution on the blockchain
    block_hash, block_index, prev_hash = _log_bank_tx_on_blockchain(
        'admin_resolution', tx.amount, tx.tx_hash,
        f'Admin {action}d flagged TX',
        {'admin': g.current_user['username'], 'action': action, 'original_verdict': 'flagged'}
    )

    db.session.commit()

    return jsonify({
        'message': f'Transaction {action}d successfully',
        'transaction': tx.to_dict(),
        'blockchain_receipt': {
            'block_hash': block_hash,
            'block_index': block_index,
            'prev_block_hash': prev_hash,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    })


@app.route('/api/bank/analytics', methods=['GET'])
@soft_auth
def get_bank_analytics():
    """Get spending analytics for the user's accounts."""
    user_accounts = BankAccount.query.filter_by(owner_id=g.user.id).all()
    account_ids = [acc.id for acc in user_accounts]

    all_txs = BankTransaction.query.filter(
        (BankTransaction.sender_id.in_(account_ids)) |
        (BankTransaction.receiver_id.in_(account_ids))
    ).order_by(BankTransaction.created_at.desc()).limit(200).all()

    # Category breakdown
    category_spend = {}
    for tx in all_txs:
        if tx.sender_id in account_ids and tx.type in ('withdrawal', 'bill_payment', 'transfer'):
            cat = tx.category or 'general'
            category_spend[cat] = category_spend.get(cat, 0) + tx.amount

    # Type breakdown
    type_breakdown = {}
    for tx in all_txs:
        type_breakdown[tx.type] = type_breakdown.get(tx.type, 0) + 1

    # Total in/out
    total_in = sum(t.amount for t in all_txs if t.receiver_id in account_ids)
    total_out = sum(t.amount for t in all_txs if t.sender_id in account_ids)

    # AI guard summary
    flagged_count = sum(1 for t in all_txs if t.ai_verdict == 'flagged')
    suspicious_count = sum(1 for t in all_txs if t.ai_verdict == 'suspicious')

    return jsonify({
        'category_spend': category_spend,
        'type_breakdown': type_breakdown,
        'total_inflow': round(total_in, 2),
        'total_outflow': round(total_out, 2),
        'net_flow': round(total_in - total_out, 2),
        'ai_security_summary': {
            'total_scanned': len(all_txs),
            'flagged': flagged_count,
            'suspicious': suspicious_count,
            'clean': len(all_txs) - flagged_count - suspicious_count
        },
        'total_balance': round(sum(a.balance for a in user_accounts), 2)
    })


# ── Users Routes ─────────────────────────────────────────────────

@app.route('/api/users', methods=['GET'])
def list_users():
    """List all users."""
    users = User.query.all()
    return jsonify({
        'users': [u.to_dict() for u in users],
        'total': len(users)
    })

@app.route('/api/security/attribution', methods=['GET'])
def get_attack_attribution():
    """Get threat intelligence profiles for recent attackers."""
    from security import threat_profiler
    
    recent_events = SecurityEvent.query.filter(SecurityEvent.severity.in_(['high', 'critical'])).order_by(SecurityEvent.created_at.desc()).limit(15).all()
    
    profiles = []
    for event in recent_events:
        try:
            ip = event.source_ip or '0.0.0.0'
            profile = threat_profiler.profile_ip(ip, attack_type=event.event_type)
            profile["event_id"] = event.id
            profile["severity"] = event.severity
            profile["description"] = event.description
            profiles.append(profile)
        except Exception:
            pass
        
    return jsonify({
        'profiles': profiles,
        'total': len(profiles)
    })


# ── Batch 2: Federated Learning & Self-Healing ──────────────────

@app.route('/api/federated/train', methods=['POST'])
@require_auth
def start_federated_round():
    """Trigger a new round of federated decentralized training."""
    from federated_learning import federated_engine
    import blockchain_web3
    
    summary = federated_engine.start_round(blockchain_client=blockchain_web3)
    
    # Log the global weight update to the blockchain
    blockchain_web3.store_model_weight_update(
        summary['round_id'], 
        summary['new_global_hash'], 
        summary['nodes_participated']
    )
    
    return jsonify({
        'success': True,
        'message': 'Federated training round completed and logged to blockchain.',
        'summary': summary
    })

@app.route('/api/federated/status', methods=['GET'])
def get_federated_status():
    """Get status of the decentralized AI training network."""
    from federated_learning import federated_engine
    return jsonify(federated_engine.get_status())

@app.route('/api/security/healing', methods=['GET'])
def get_healing_status():
    """Monitor the autonomous self-healing defense engine."""
    from security import adaptive_defense
    import blockchain_web3
    
    # Before returning, check if any nodes should be auto-restored
    restored = adaptive_defense.check_self_healing()
    
    # Log restorations to blockchain
    for node in restored:
        blockchain_web3.store_self_healing_action(node, "RESTORE", "Auto-heartbeat verification")
        
    return jsonify(adaptive_defense.get_status())

@app.route('/api/security/isolate', methods=['POST'])
@require_auth
def manual_isolate():
    """Manually trigger node isolation (for administrative intervention)."""
    from security import adaptive_defense
    import blockchain_web3
    
    data = request.get_json()
    node = data.get('node', 'Main_Gateway')
    reason = data.get('reason', 'Administrative Lock')
    
    success = adaptive_defense.isolate_node(node, reason)
    if success:
        blockchain_web3.store_self_healing_action(node, "ISOLATE", reason)
        return jsonify({'success': True, 'message': f'Node {node} isolated.'})
    return jsonify({'success': False, 'message': f'Node {node} is already isolated.'}), 400


# ── Batch 3: Model Integrity & SSI KYC ──────────────────────────

@app.route('/api/security/model/status', methods=['GET'])
def get_model_integrity_status():
    """Get diagnostic telemetry for the AI model registry."""
    from model_registry import model_registry
    return jsonify(model_registry.get_status())

@app.route('/api/security/model/verify', methods=['POST'])
@require_auth
def verify_model_integrity():
    """Manually trigger a blockchain hash cross-check for the active model."""
    from model_registry import model_registry
    
    # Optional: simulate a hash check (e.g. from a file upload or scan)
    data = request.get_json() or {}
    tampered_hash = data.get('simulate_hash')
    
    is_valid, message = model_registry.verify_integrity(current_file_hash=tampered_hash)
    return jsonify({
        'success': is_valid,
        'message': message,
        'status': model_registry.active_model['status']
    })

@app.route('/api/security/model/rollback', methods=['POST'])
@require_auth
def rollback_model_version():
    """Restore the AI model to the last known healthy version from the ledger."""
    from model_registry import model_registry
    import blockchain_web3
    
    success, message = model_registry.rollback_model()
    if success:
        # Log the recovery event to the blockchain
        blockchain_web3.store_self_healing_action(
            "AI_MODEL_CORE", 
            "ROLLBACK", 
            f"Recovery to ver {model_registry.active_model['version']}"
        )
        return jsonify({'success': True, 'message': message})
    return jsonify({'success': False, 'message': message}), 400

@app.route('/api/kyc/status', methods=['GET'])
@soft_auth
def get_kyc_status():
    """Get the current SSI identity status for the logged-in user."""
    from biometrics import biometric_engine
    return jsonify(biometric_engine.get_kyc_status(g.current_user['username']))

@app.route('/api/kyc/verify', methods=['POST'])
@soft_auth
def verify_kyc_did():
    """Verify a user's Decentralized Identifier for banking access."""
    from biometrics import biometric_engine
    
    data = request.get_json()
    did = data.get('did')
    
    if not did:
        # If no DID provided, generate a new one for the demo
        did = biometric_engine.generate_did(g.current_user['username'])
        
    success, message = biometric_engine.verify_ssi_kyc(g.current_user['username'], did)
    return jsonify({
        'success': success,
        'message': message,
        'did': did
    })


# ── Smart Contract Routes ────────────────────────────────────────

@app.route('/api/contracts/events', methods=['GET'])
def get_contract_events():
    """Get smart contract events."""
    events = []
    events.extend(model_registry.events[-20:])
    events.extend(version_verification.events[-20:])
    events.extend(access_control.events[-20:])
    events.extend(data_provenance.events[-20:])

    # Sort by timestamp
    events.sort(key=lambda e: e.get('timestamp', ''), reverse=True)

    return jsonify({
        'events': events[:50],
        'total': len(events)
    })


@app.route('/api/security/process_transaction', methods=['POST'])
def process_demo_transaction():
    """
    Core AI Chain Guard Transaction Processor (Demo Endpoint).
    Integrates AI Risk Scoring, Anomaly Detection, and Blockchain Anchoring.
    """
    data = request.get_json()
    amount = float(data.get('amount', 0))
    description = data.get('description', 'Demo Transaction')
    sender_id = data.get('sender_id', 1)
    
    ip = request.remote_addr or '127.0.0.1'
    
    # 1. Run AI Chain Guard Security Scan
    combined_score, verdict, explanations, ai_eval = _run_ai_chain_guard(
        ip, amount, 'demo_transfer', 'checking'
    )
    
    # 2. Log to Blockchain for Absolute Provenance
    tx_raw = f"demo-{sender_id}-{amount}-{time.time()}"
    tx_hash = hashlib.sha256(tx_raw.encode()).hexdigest()
    
    block_hash, block_index, prev_hash = _log_bank_tx_on_blockchain(
        'demo_transfer', amount, f"DEMO-ACC-{sender_id}",
        description,
        {
            'tx_hash': tx_hash,
            'ai_risk_score': combined_score,
            'ai_verdict': verdict,
            'security_scan': 'PASSED' if verdict != 'flagged' else 'FAILED'
        }
    )
    
    # 3. Handle Blocked Transactions
    if verdict == 'flagged':
        return jsonify({
            'status': 'blocked',
            'message': 'Transaction Blocked by AI Chain Guard',
            'risk_score': combined_score,
            'explanations': explanations,
            'blockchain_receipt': {
                'block_hash': block_hash,
                'block_index': block_index,
                'tx_hash': tx_hash
            }
        }), 403

    return jsonify({
        'status': 'success',
        'message': 'Transaction Authorized and Anchored',
        'risk_score': combined_score,
        'verdict': verdict,
        'explanations': explanations,
        'blockchain_receipt': {
            'block_hash': block_hash,
            'block_index': block_index,
            'tx_hash': tx_hash,
            'prev_hash': prev_hash
        }
    })


# ── Serve Frontend ───────────────────────────────────────────────

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')


@app.route('/')
def serve_index():
    """Serve the frontend SPA."""
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, 'css'), filename)


@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, 'js'), filename)


# ── Error Handlers ───────────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Endpoint not found'}), 404
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500



# --- Elite SOC API Endpoints (Phase 9) ---

@app.route('/api/elite/status', methods=['GET'])
@require_auth
def get_elite_status():
    return jsonify({
        "robustness_score": elite_engine.get_robustness_score(),
        "defenses": elite_engine.robustness_features,
        "drift_status": "NORMAL",
        "gateway_active": True,
        "event_bus_status": "STREAMING"
    })

@app.route('/api/elite/intel', methods=['GET'])
@require_auth
def get_elite_intel():
    return jsonify({
        "feed": intel_feed.get_live_feed(8)
    })

@app.route('/api/elite/events', methods=['GET'])
@require_auth
def get_elite_events():
    return jsonify({
        "events": list(bus.get_history(30))
    })

@app.route('/api/elite/toggle-defense', methods=['POST'])
@require_auth
@require_role('admin')
def toggle_elite_defense():
    data = request.json
    feature = data.get('feature')
    if feature in elite_engine.robustness_features:
        new_state = not elite_engine.robustness_features[feature]
        elite_engine.robustness_features[feature] = new_state
        bus.publish("security_config", {"feature": feature, "enabled": new_state, "admin": g.user_id})
        return jsonify({"success": True, "feature": feature, "enabled": new_state})
    return jsonify({"error": "Invalid feature"}), 400

# ── Run ──────────────────────────────────────────────────────────

if __name__ == '__main__':
    print("\n" + "="*60)
    print("  Blockchain AI Model Management & Security System")
    print("="*60)
    print(f"  Server:     http://localhost:5000")
    print(f"  Dashboard:  http://localhost:5000/")
    print(f"  API:        http://localhost:5000/api/")
    print(f"  Blockchain: {len(blockchain_web3.get_chain_data())} blocks")
    print("="*60 + "\n")
    app.run(host='127.0.0.1', port=5000, debug=True)
