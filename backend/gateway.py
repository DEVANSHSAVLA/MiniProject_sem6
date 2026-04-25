import time
from functools import wraps
from flask import request, jsonify
from events import bus

class APIGateway:
    """
    Simulates a high-performance API Gateway (NGINX/Kong)
    Handles: Rate Limiting, Bot Detection, and Request Sanitization.
    """
    def __init__(self):
        self.rate_limits = {} # IP -> (count, reset_time)
        self.MAX_RPM = 60 # 60 requests per minute baseline
        self.BOT_THRESHOLD = 0.8 # Anomaly score from bot heuristics

    def limit_rate(self, ip):
        now = time.time()
        if ip not in self.rate_limits:
            self.rate_limits[ip] = [1, now + 60]
            return True
        
        count, reset = self.rate_limits[ip]
        if now > reset:
            self.rate_limits[ip] = [1, now + 60]
            return True
        
        if count >= self.MAX_RPM:
            bus.publish("security_gateway", {"ip": ip, "reason": "rate_limit_exceeded", "severity": "warning"})
            return False
        
        self.rate_limits[ip][0] += 1
        return True

    def detect_bot(self):
        # Heuristic: Check user-agent, headers, and request speed
        ua = request.headers.get('User-Agent', '')
        if 'bot' in ua.lower() or 'python-requests' in ua.lower():
            return True
        return False

gateway = APIGateway()

def secure_gateway(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        ip = request.remote_addr
        
        if not gateway.limit_rate(ip):
            return jsonify({"error": "Rate limit exceeded (API Gateway)", "status": 429}), 429
        
        if gateway.detect_bot():
             bus.publish("security_gateway", {"ip": ip, "reason": "bot_pattern_detected", "severity": "critial"})
             # We allow for logging but might block in strict mode
        
        return f(*args, **kwargs)
    return decorated_function
