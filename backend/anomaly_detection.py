"""
ML-Based Anomaly Detection Engine
Uses Isolation Forest to detect abnormal traffic patterns.

Isolation Forest works by randomly partitioning data points. Anomalous data points 
require fewer partitions to isolate and are therefore detected quickly.
"""

import numpy as np
import math
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import MinMaxScaler

class AnomalyDetector:
    """
    AI-powered anomaly detection using Isolation Forest.
    Input Features:
    - request frequency
    - IP request rate
    - endpoint usage distribution
    - request time interval
    
    Output:
    - anomaly score
    - threat classification
    """

    def __init__(self):
        # Tracking features per IP
        self.ip_history = defaultdict(list)
        self.ip_endpoints = defaultdict(list)
        self.ip_scores = defaultdict(lambda: 0.0)
        self.ip_volumetric = defaultdict(lambda: {"total_bytes": 0, "packets": 0, "start_time": datetime.now(timezone.utc)})
        self.ip_slowloris_buffer = defaultdict(list) # Track request durations

        # The ML Models (Ensemble Detection)
        self.iso_forest = IsolationForest(
            n_estimators=200,
            contamination=0.0017,  
            random_state=42
        )
        self.oc_svm = OneClassSVM(
            kernel='rbf', gamma='auto', nu=0.1
        )
        self.scaler = MinMaxScaler()
        self.is_trained = False
        self.training_data = []
        
        # Attack Prediction Model tracking
        self.system_risk_history = []

        # Detection thresholds
        self.RATE_THRESHOLD = 30
        
    def _extract_features(self, ip):
        """Extract the 6 key features for Isolation Forest."""
        recent = self.ip_history[ip]
        if len(recent) < 2:
            return None
            
        # Feature 1: request_rate (total in last 10 mins)
        request_rate = len(recent)
        
        # Feature 2: time_interval (average time between requests)
        time_intervals = [(recent[i] - recent[i-1]).total_seconds() for i in range(1, len(recent))]
        time_interval = np.mean(time_intervals) if time_intervals else 0.0
        
        # Feature 3: ip_entropy (Shannon entropy of accessed endpoints)
        endpoints = self.ip_endpoints[ip]
        if not endpoints:
            ip_entropy = 0.0
        else:
            freq = {e: endpoints.count(e) / len(endpoints) for e in set(endpoints)}
            ip_entropy = -sum(p * math.log2(p) for p in freq.values())
            
        # Feature 4: endpoint_variance
        endpoint_variance = np.var(time_intervals) if len(time_intervals) > 1 else 0.0
        
        # Feature 5: Bytes Per Second (Volumetric)
        vol = self.ip_volumetric[ip]
        duration = max(1, (datetime.now(timezone.utc) - vol["start_time"]).total_seconds())
        bps = vol["total_bytes"] / duration
        
        # Feature 6: Packets Per Second (Req frequency)
        pps = vol["packets"] / duration
        
        return [request_rate, time_interval, ip_entropy, endpoint_variance, bps, pps]

    def record_request(self, ip, endpoint, payload_size=0, auth_success=True):
        """
        Record an incoming request and evaluate it using Isolation Forest.
        Returns (is_anomalous, anomaly_score, threat_classification).
        """
        now = datetime.now(timezone.utc)

        # Record raw data
        self.ip_history[ip].append(now)
        self.ip_endpoints[ip].append(endpoint)
        
        # Update volumetric data
        self.ip_volumetric[ip]["total_bytes"] += payload_size
        self.ip_volumetric[ip]["packets"] += 1

        # Prune old data (keep last 10 minutes)
        cutoff = now - timedelta(minutes=10)
        self.ip_history[ip] = [t for t in self.ip_history[ip] if t > cutoff]

        features = self._extract_features(ip)
        
        # We need a minimum amount of data to make a prediction
        if not features:
            self.ip_scores[ip] = 0.0
            return False, 0.0, None
            
        # Phase 1 - Baseline Training
        if not self.is_trained:
            self.training_data.append(features)
            if len(self.training_data) > 50:  # Init basic models early
                self.scaler.fit(self.training_data)
                scaled_data = self.scaler.transform(self.training_data)
                self.iso_forest.fit(scaled_data)
                self.oc_svm.fit(scaled_data)
                self.is_trained = True
            
            if features[0] > self.RATE_THRESHOLD: 
                return True, 0.8, 'dos_attack'
            return False, 0.0, None

        self.training_data.append(features)
        
        # AI Model Retraining System: Retrain rigorously after 5000 events
        if len(self.training_data) >= 5000 and len(self.training_data) % 5000 == 0:
            self.retrain_model()

        # Phase 2 - Real-Time Multi-Model Ensemble Detection
        scaled_features = self.scaler.transform([features])

        iso_pred = self.iso_forest.predict(scaled_features)[0]
        svm_pred = self.oc_svm.predict(scaled_features)[0]
        
        # Ensemble Logic: If either model detects anomaly (-1), flag it.
        prediction = -1 if (iso_pred == -1 or svm_pred == -1) else 1
        
        # Continuous Scoring
        iso_score = self.iso_forest.decision_function(scaled_features)[0]
        svm_score = self.oc_svm.decision_function(scaled_features)[0]
        raw_score = (iso_score + svm_score) / 2.0
        
        anomaly_score = float(max(0, 0.5 - raw_score)) 
        
        self.ip_scores[ip] = anomaly_score
        self.system_risk_history.append(anomaly_score) # For predictive risk

        if prediction == -1:
            # Threat classification based on new features
            if features[0] > self.RATE_THRESHOLD:
                threat_class = 'dos_attack'
            elif features[4] > 1000000: # 1MB/s threshold for prototype 
                threat_class = 'volumetric_ddos'
            elif features[2] > 1.5: # High entropy
                threat_class = 'unauthorized_access'
            else:
                threat_class = 'api_abuse'
                
            return True, anomaly_score, threat_class

        # Decay score if normal
        self.ip_scores[ip] = max(0, self.ip_scores[ip] - 0.05)
        return False, self.ip_scores[ip], None

    def get_attack_prediction(self):
        """Attack Prediction Model: Calculates future DOS attack probability risk with labels."""
        if not self.system_risk_history: 
            return {"probability": 0.0, "level": "LOW"}
            
        # Look at trend of last 100 events
        recent_trend = self.system_risk_history[-100:]
        avg_risk = np.mean(recent_trend)
        velocity = (recent_trend[-1] - recent_trend[0]) if len(recent_trend) > 1 else 0
        probability = min(100.0, max(0.0, (avg_risk * 100) + (velocity * 200)))
        
        level = "LOW"
        if probability > 70: level = "HIGH"
        elif probability > 30: level = "MEDIUM"
        
        return {
            "probability": round(probability, 1),
            "level": level,
            "trend": "increasing" if velocity > 0 else "decreasing"
        }

    def get_top_attack_endpoints(self, security_events):
        """Analyze security events to identify the most targeted API endpoints."""
        endpoint_counts = defaultdict(int)
        for event in security_events:
            endpoint = event.get('endpoint', 'unknown')
            endpoint_counts[endpoint] += 1
        
        sorted_endpoints = sorted(endpoint_counts.items(), key=lambda x: x[1], reverse=True)
        return [{"endpoint": k, "count": v} for k, v in sorted_endpoints[:5]]

    def get_ip_report(self, ip):
        """Generate a detailed anomaly report for an IP."""
        features = self._extract_features(ip) or [0, 0, 0, 0]
        return {
            'ip': ip,
            'anomaly_score': round(self.ip_scores.get(ip, 0.0), 4),
            'requests_per_minute': features[1],
            'total_requests': features[0],
            'unique_endpoints': len(set(self.ip_endpoints.get(ip, []))),
        }

    def get_system_stats(self):
        """Get overall anomaly detection statistics."""
        active_ips = len(self.ip_history)
        suspicious_ips = sum(1 for score in self.ip_scores.values() if score > 0.5)

        return {
            'active_ips': active_ips,
            'suspicious_ips': suspicious_ips,
            'avg_anomaly_score': round(
                np.mean(list(self.ip_scores.values())) if self.ip_scores else 0.0, 4
            ),
            'max_anomaly_score': round(
                max(self.ip_scores.values()) if self.ip_scores else 0.0, 4
            ),
            'is_ml_trained': self.is_trained
        }

    def reset_ip(self, ip):
        """Reset all tracking data for an IP."""
        self.ip_history.pop(ip, None)
        self.ip_endpoints.pop(ip, None)
        self.ip_scores.pop(ip, None)
        self.ip_volumetric.pop(ip, None)
        self.ip_slowloris_buffer.pop(ip, None)

    def check_slowloris(self, ip, duration_ms):
        """
        Detect Slowloris attacks by monitoring long-duration/low-payload requests.
        """
        self.ip_slowloris_buffer[ip].append(duration_ms)
        if len(self.ip_slowloris_buffer[ip]) > 10:
            self.ip_slowloris_buffer[ip] = self.ip_slowloris_buffer[ip][-10:]
            avg_duration = np.mean(self.ip_slowloris_buffer[ip])
            if avg_duration > 5000: # > 5 seconds average duration for simple requests
                return True
        return False

    def get_global_traffic_stats(self):
        """Calculate aggregate system-wide traffic for DDoS detection."""
        total_bps = sum(v["total_bytes"] / max(1, (datetime.now(timezone.utc) - v["start_time"]).total_seconds()) 
                       for v in self.ip_volumetric.values())
        total_pps = sum(v["packets"] / max(1, (datetime.now(timezone.utc) - v["start_time"]).total_seconds()) 
                       for v in self.ip_volumetric.values())
        return {
            "total_bps": round(total_bps, 2),
            "total_pps": round(total_pps, 2),
            "global_threat_level": "CRITICAL" if total_pps > 1000 else "NORMAL"
        }

    def retrain_model(self):
        """Phase 2: Periodically retrain the ensemble models to adapt to evolving traffic patterns."""
        if len(self.training_data) > 50:
            self.training_data = self.training_data[-5000:]
            self.scaler.fit(self.training_data)
            scaled_data = self.scaler.transform(self.training_data)
            self.iso_forest.fit(scaled_data)
            self.oc_svm.fit(scaled_data)
            self.is_trained = True


# Global anomaly detector instance
anomaly_detector = AnomalyDetector()
