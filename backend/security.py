"""
Cybersecurity Layer
Comprehensive security mechanisms: DoS/DDoS detection, model poisoning detection,
dynamic trust scoring, honeypot endpoints, automated blocking, and credential attack detection.
"""

import time
import random
import hashlib
from collections import defaultdict
from datetime import datetime, timezone, timedelta


class SecurityEngine:
    """
    Central cybersecurity engine managing all security mechanisms.
    """

    def __init__(self):
        # Rate limiting
        self.rate_limits = defaultdict(list)       # ip -> [timestamps]
        self.blocked_ips = {}                       # ip -> blocked_until
        self.RATE_LIMIT_WINDOW = 60                 # seconds
        self.RATE_LIMIT_MAX = 500                   # max requests per minute (Rate Limiting Engine)
        self.BLOCK_DURATION = 10                    # seconds to block

        # IP Reputation System
        self.ip_trust_scores = defaultdict(lambda: 100.0)

        # Trust scoring
        self.trust_scores = {}                      # user_id -> TrustProfile

        # Honeypot
        self.honeypot_triggers = []                 # list of honeypot trigger events

        # DoS tracking
        self.dos_suspects = defaultdict(int)        # ip -> violation_count
        self.DOS_THRESHOLD = 3                      # violations before blocking

        self.failed_auths = defaultdict(list)       # ip -> [timestamps]
        self.CREDENTIAL_THRESHOLD = 10              # failed auths in window

        # Counter-Mitigation
        self.counter_mitigation = CounterMitigationModule()
        self.active_defense_enabled = True

    # ---- Rate Limiting ----

    def check_rate_limit(self, ip):
        """
        Check if an IP has exceeded rate limits.
        Returns (is_allowed, remaining_requests).
        """
        now = time.time()

        # Check if IP is blocked
        if ip in self.blocked_ips:
            if now < self.blocked_ips[ip]:
                return False, 0
            else:
                del self.blocked_ips[ip]

        # Clean old entries
        self.rate_limits[ip] = [
            t for t in self.rate_limits[ip]
            if now - t < self.RATE_LIMIT_WINDOW
        ]

        # Check limit
        current_count = len(self.rate_limits[ip])
        if current_count >= self.RATE_LIMIT_MAX:
            self.dos_suspects[ip] += 1
            if self.dos_suspects[ip] >= self.DOS_THRESHOLD:
                # Upgrade to active mitigation
                if self.active_defense_enabled:
                    self.initiate_active_defense(ip, "ddos_flood")
                self.block_ip(ip)
            return False, 0

        # Record request
        self.rate_limits[ip].append(now)
        remaining = self.RATE_LIMIT_MAX - current_count - 1
        return True, remaining

    def block_ip(self, ip, duration=None, reason="anomaly"):
        """Dynamic Firewall Engine: Block an IP address immediately."""
        duration = duration or self.BLOCK_DURATION
        self.blocked_ips[ip] = time.time() + duration
        self.reduce_ip_trust(ip, penalty=15, reason=reason)

    def unblock_ip(self, ip):
        """Unblock an IP address."""
        self.blocked_ips.pop(ip, None)
        self.dos_suspects.pop(ip, None)

    def reduce_ip_trust(self, ip, penalty, reason="unknown"):
        """Decrease IP trust score based on behavior."""
        self.ip_trust_scores[ip] = max(0.0, self.ip_trust_scores[ip] - penalty)
        if self.ip_trust_scores[ip] < 20.0 and ip not in self.blocked_ips:
            # Auto-block exceptionally low trust IPs
            self.block_ip(ip, duration=86400, reason=f"reputation_crit_{reason}")
            if self.active_defense_enabled:
                self.initiate_active_defense(ip, f"low_reputation_{reason}")

    def initiate_active_defense(self, ip, threat_type):
        """Trigger active counter-mitigation and redirection."""
        # 1. Report to global threat intel (Simulated)
        self.counter_mitigation.report_to_intel(ip, threat_type)
        
        # 2. Divert to honeypot in the defense engine
        adaptive_defense.divert_to_honeypot(ip, reason=threat_type)
        
        # 3. Apply traffic throttling (tar-pit) if not fully blocked
        adaptive_defense.apply_traffic_throttling(ip)

    def get_defense_action(self, threat_type, anomaly_score):
        """Map threat types to automated defense responses."""
        if anomaly_score > 0.9 or threat_type == 'dos_attack':
            return "IP_BLOCKED"
        elif threat_type == 'brute_force':
            return "ACCOUNT_LOCK_PENDING"
        elif anomaly_score > 0.7:
            return "RATE_LIMIT_APPLIED"
        return "MONITORING"

    def get_blocked_ips(self):
        """Get list of currently blocked IPs with reasons."""
        now = time.time()
        active_blocks = {}
        for ip, until in list(self.blocked_ips.items()):
            if until > now:
                active_blocks[ip] = {
                    'blocked_until': datetime.fromtimestamp(until, tz=timezone.utc).isoformat(),
                    'remaining_seconds': int(until - now),
                    'reputation': self.ip_trust_scores.get(ip, 0.0)
                }
            else:
                del self.blocked_ips[ip]
        return active_blocks

    # ---- Trust Scoring ----

    def get_trust_score(self, user_id):
        """Get or initialize trust score for a user."""
        if user_id not in self.trust_scores:
            self.trust_scores[user_id] = TrustProfile(user_id)
        return self.trust_scores[user_id]

    def update_trust_score(self, user_id, event_type, severity='low'):
        """Update trust score based on an event."""
        profile = self.get_trust_score(user_id)
        profile.record_event(event_type, severity)
        return profile.score

    def get_all_trust_scores(self):
        """Get all user trust scores."""
        return {uid: profile.to_dict() for uid, profile in self.trust_scores.items()}

    # ---- Honeypot ----

    def check_honeypot(self, endpoint, ip, user_agent=None):
        """
        Check if a request hit a honeypot endpoint.
        Honeypot endpoints are fake model endpoints designed to catch attackers.
        """
        honeypot_paths = [
            '/api/models/admin/export',
            '/api/models/internal/weights',
            '/api/v2/models/download',
            '/api/debug/models',
            '/api/backup/database',
            '/api/internal/config',
            '/api/models/secret/keys',
            '/api/.env',
            '/api/admin/shell',
        ]

        if any(endpoint.startswith(path) for path in honeypot_paths):
            trigger = {
                'ip': ip,
                'endpoint': endpoint,
                'user_agent': user_agent,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'action': 'blocked'
            }
            self.honeypot_triggers.append(trigger)
            self.reduce_ip_trust(ip, penalty=50) # Massive penalty for honeypot
            self.block_ip(ip, duration=3600, reason="honeypot")  # Block for 1 hour
            return True, trigger

        return False, None

    def get_honeypot_triggers(self):
        """Get all honeypot trigger events."""
        return self.honeypot_triggers[-50:]  # last 50

    # ---- Model Poisoning Detection ----

    def check_model_update(self, model_name, new_hash, expected_old_hash, blockchain):
        """
        Verify a model update isn't a poisoning attempt.
        Checks hash chain integrity through blockchain.
        """
        # Verify the old hash matches blockchain record
        is_verified, block_data = blockchain.verify_model(model_name, expected_old_hash)

        if not is_verified:
            return False, 'Model hash mismatch - potential poisoning attempt'

        # Check if hash has changed suspiciously (same version, different hash)
        history = blockchain.get_model_history(model_name)
        for entry in history:
            stored_hash = entry['data'].get('model_hash') or entry['data'].get('new_hash')
            if stored_hash == new_hash:
                return False, 'Duplicate hash detected - potential replay attack'

        return True, 'Model update verified'

    # ---- Credential Attack Detection ----

    def record_auth_failure(self, ip):
        """Record a failed authentication attempt."""
        now = time.time()
        self.failed_auths[ip].append(now)

        # Clean old entries
        self.failed_auths[ip] = [
            t for t in self.failed_auths[ip]
            if now - t < self.RATE_LIMIT_WINDOW
        ]

        if len(self.failed_auths[ip]) >= self.CREDENTIAL_THRESHOLD:
            self.block_ip(ip, duration=1800)  # Block for 30 minutes
            return True  # credential attack detected
        return False

    # ---- Statistics ----

    def get_security_stats(self):
        """Get overall security statistics."""
        now = time.time()
        active_blocks = sum(1 for until in self.blocked_ips.values() if until > now)

        return {
            'blocked_ips_count': active_blocks,
            'dos_suspects': len(self.dos_suspects),
            'honeypot_triggers': len(self.honeypot_triggers),
            'total_trust_profiles': len(self.trust_scores),
            'avg_trust_score': round(
                sum(p.score for p in self.trust_scores.values()) / max(len(self.trust_scores), 1), 2
            ),
            'rate_limit_config': {
                'window_seconds': self.RATE_LIMIT_WINDOW,
                'max_requests': self.RATE_LIMIT_MAX,
                'block_duration': self.BLOCK_DURATION
            },
            'ip_trust_scores': dict(self.ip_trust_scores)
        }


class TrustProfile:
    """
    Dynamic trust scoring for system users.
    Score ranges from 0 (untrusted) to 100 (fully trusted).
    """

    SEVERITY_PENALTIES = {
        'low': 2,
        'medium': 5,
        'high': 15,
        'critical': 30
    }

    POSITIVE_EVENTS = {
        'successful_auth': 1,
        'valid_model_update': 2,
        'verified_action': 1,
        'consistent_usage': 0.5
    }

    def __init__(self, user_id):
        self.user_id = user_id
        self.score = 100.0
        self.events = []
        self.created_at = datetime.now(timezone.utc)
        self.last_updated = datetime.now(timezone.utc)

    def record_event(self, event_type, severity='low'):
        """Record a security event and update score."""
        now = datetime.now(timezone.utc)

        if event_type in self.POSITIVE_EVENTS:
            # Positive event - increase score
            change = self.POSITIVE_EVENTS[event_type]
            self.score = min(100.0, self.score + change)
        else:
            # Negative event - decrease score
            penalty = self.SEVERITY_PENALTIES.get(severity, 5)
            self.score = max(0.0, self.score - penalty)

        self.events.append({
            'event_type': event_type,
            'severity': severity,
            'score_after': round(self.score, 2),
            'timestamp': now.isoformat()
        })
        self.last_updated = now

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'score': round(self.score, 2),
            'event_count': len(self.events),
            'recent_events': self.events[-10:],
            'created_at': self.created_at.isoformat(),
            'last_updated': self.last_updated.isoformat()
        }


class AttackerProfiler:
    """
    Threat Intelligence Engine to trace attacker behavior and geolocation.
    """
    def __init__(self):
        # Simulated geolocation and fingerprint database
        self.geo_db = {
            "192.168.1.1": "Local Network",
            "8.8.8.8": "Mountain View, CA, US",
            "103.25.4.11": "St. Petersburg, Russia",
            "45.2.11.9": "Beijing, China",
            "185.11.3.4": "Bucharest, Romania"
        }
        self.botnet_agents = ["python-requests", "curl", "masscan", "nmap", "gobuster"]

    def profile_ip(self, ip, user_agent="Unknown", attack_type="General Anomaly"):
        """
        Generates a comprehensive threat intelligence profile for a malicious IP.
        """
        location = self.geo_db.get(ip, "Unknown Origin")
        if ip.startswith("10.") or ip.startswith("172.") or ip.startswith("127.") or ip.startswith("192."):
            location = "Localhost / Intranet"
            
        fingerprint = "Script Kiddie"
        ua_lower = str(user_agent).lower()
        if any(bot in ua_lower for bot in self.botnet_agents):
            fingerprint = "Automated Botnet"
        elif attack_type in ["credential_stuffing", "brute_force", "honeypot"]:
            fingerprint = "Advanced Persistent Threat (APT) / Stuffing Rig"
            
        return {
            "ip": ip,
            "geo_location": location,
            "attack_pattern": attack_type,
            "threat_actor_fingerprint": fingerprint,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

class AdaptiveDefenseEngine:
    """
    Self-Healing Security Layer to automatically isolate corrupted nodes
    and restore services after threat mitigation.
    """
    def __init__(self):
        self.isolated_endpoints = set()
        self.redirections = {}  # {source_endpoint: target_node}
        self.recovery_queue = []
        self.healing_history = []
        self.diverted_ips = {} # ip -> target_honeypot
        self.throttled_ips = {} # ip -> delay_ms

    def isolate_node(self, endpoint, reason="Suspicious Activity Detected"):
        """Isolates a specific API endpoint or service node."""
        if endpoint in self.isolated_endpoints:
            return False
            
        self.isolated_endpoints.add(endpoint)
        action = {
            "node": endpoint,
            "action": "ISOLATE",
            "reason": reason,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "OFFLINE"
        }
        self.healing_history.append(action)
        
        # Schedule auto-recovery in 300 seconds for simulation
        self.recovery_queue.append({
            "node": endpoint, 
            "restore_time": time.time() + 300
        })
        return True

    def divert_to_honeypot(self, ip, reason="DDoS Activity"):
        """Redirects malicious traffic to a high-interaction sinkhole."""
        self.diverted_ips[ip] = "/api/security/honeypot/tar-pit"
        action = {
            "ip": ip,
            "action": "DIVERT",
            "target": "TAR_PIT_HONEPOT",
            "reason": reason,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        self.healing_history.append(action)
        return True

    def apply_traffic_throttling(self, ip, delay_ms=2000):
        """Applies artificial latency to suspicious traffic (Tar Pit)."""
        self.throttled_ips[ip] = delay_ms
        return True

    def check_redirection(self, ip):
        """Check if an IP should be redirected."""
        return self.diverted_ips.get(ip)

    def get_throttle_delay(self, ip):
        """Get the artificial delay for an IP."""
        return self.throttled_ips.get(ip, 0) / 1000.0 # Return in seconds

    def restore_node(self, endpoint):
        """Restores an isolated node to operational status."""
        if endpoint in self.isolated_endpoints:
            self.isolated_endpoints.remove(endpoint)
            action = {
                "node": endpoint,
                "action": "RESTORE",
                "reason": "System Heartbeat Verified",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "ONLINE"
            }
            self.healing_history.append(action)
            return True
        return False

    def check_self_healing(self):
        """Checks the recovery queue and auto-restores nodes if cooldown expired."""
        now = time.time()
        restored = []
        
        # We'll use a local copy of the list to iterate and remove efficiently
        for item in list(self.recovery_queue):
            if now >= item["restore_time"]:
                self.restore_node(item["node"])
                restored.append(item["node"])
                self.recovery_queue.remove(item)
                
        return restored

    def get_status(self):
        return {
            "isolated_count": len(self.isolated_endpoints),
            "isolated_nodes": list(self.isolated_endpoints),
            "diverted_ips_count": len(self.diverted_ips),
            "throttled_ips_count": len(self.throttled_ips),
            "total_healing_actions": len(self.healing_history),
            "recent_actions": self.healing_history[-10:]
        }

class CounterMitigationModule:
    """
    Active Defense Module: Handles automated counter-attacks (reporting, traceback, and resource traps).
    """
    def __init__(self):
        self.incident_reports = []

    def report_to_intel(self, ip, threat_type):
        """Simulates reporting the attacker to external security databases."""
        report = {
            "target_ip": ip,
            "threat_type": threat_type,
            "reporters": ["AbuseIPDB", "AlienVault", "AI_Chain_Guard_Network"],
            "status": "SUBMITTED",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        self.incident_reports.append(report)
        print(f"[!] Counter-Mitigation: Reported {ip} to global threat intel for {threat_type}")
        return report

    def initiate_reverse_traceback(self, ip):
        """Simulates automated traceback to identify the attack origin node."""
        path = [ip, "104.22.5.1", "172.67.2.1", "ISP_BACKBONE_LEVEL_3", "DC_CLUSTER_NORTH_KV"]
        return {
            "source_ip": ip,
            "trace_path": path,
            "origin_node_detected": True,
            "confidence": 0.94
        }

# Global security engine instances
security_engine = SecurityEngine()
threat_profiler = AttackerProfiler()
adaptive_defense = AdaptiveDefenseEngine()
