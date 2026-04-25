import random
from events import bus

class ThreatIntelFeed:
    """
    Mock integration for AbuseIPDB and AlienVault OTX.
    Simulates a live feed of known malicious entities.
    """
    def __init__(self):
        self.malicious_ips = [
            "185.120.44.1", "45.95.147.12", "103.214.24.5", "195.201.225.1",
            "89.248.165.1", "193.161.193.1", "41.216.186.1", "104.248.23.1"
        ]
        self.malicious_hashes = [
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", # empty hash example
            "f64459f3d64c06282d8c3479ae745d137f262e38c5b05779c6d36e2f694e4334"
        ]

    def get_live_feed(self, count=5):
        feed = []
        for _ in range(count):
            ip = random.choice(self.malicious_ips)
            threat = random.choice(["Botnet C&C", "Credential Stuffing", "Brute Force", "SQL Injection"])
            feed.append({
                "ip": ip,
                "source": random.choice(["AbuseIPDB", "AlienVault OTX"]),
                "threat": threat,
                "confidence": random.randint(85, 99)
            })
        return feed

    def broadcast_alert(self):
        item = self.get_live_feed(1)[0]
        bus.publish("threat_intel", item)

intel_feed = ThreatIntelFeed()
