import requests
import time
import threading
import json

BASE_URL = "http://127.0.0.1:5000/api"

def simulate_flood(ip_alias, count=20):
    print(f"[*] Starting flood simulation for {ip_alias}...")
    for i in range(count):
        try:
            # We can't easily spoof IP without raw sockets, but we can simulate high frequency
            resp = requests.get(f"{BASE_URL}/models", headers={"X-Forwarded-For": ip_alias})
            if resp.status_code == 429:
                print(f"[!] {ip_alias}: Rate limited at request {i}")
                break
            elif resp.status_code == 403:
                print(f"[!] {ip_alias}: Blocked at request {i}")
                break
        except Exception as e:
            print(f"[#] Error: {e}")
    
    # Check mitigation status
    resp = requests.get(f"{BASE_URL}/security/mitigation/status")
    if resp.status_code == 200:
        status = resp.json()
        print(f"[*] Mitigation Status after flood: {json.dumps(status.get('adaptive_defense'), indent=2)}")
    else:
        print(f"[!] Could not get status: {resp.status_code} - {resp.text}")

def simulate_slowloris(ip_alias):
    print(f"[*] Starting Slowloris simulation for {ip_alias}...")
    # Simulate 12 slow requests to trigger detection (>10)
    for i in range(12):
        print(f"  > Slow request {i+1}/12...")
        # We hit an endpoint that we can control or just wait
        resp = requests.post(f"{BASE_URL}/auth/login", 
                            json={"username": "attacker", "password": "wrong"},
                            headers={"X-Forwarded-For": ip_alias})
        # Note: The server logic for Slowloris check is in after_request, 
        # but for it to be "slow", the request processing must take time.
        # In our simulation, login might be fast, so we might need a truly slow endpoint 
        # or mock the duration. Since we can't easily mock duration from outside, 
        # we'll just check if the logic is triggered if the response *was* slow.
    
    resp = requests.get(f"{BASE_URL}/security/mitigation/status")
    if resp.status_code == 200:
        status = resp.json()
        print(f"[*] Counter Reports: {json.dumps(status['counter_reports'], indent=2)}")
    else:
        print(f"[!] Could not get reports: {resp.status_code}")

def check_tar_pit(ip_alias):
    print(f"[*] Checking Tar-Pit for {ip_alias}...")
    # If the IP is diverted, this should hit the tar-pit
    resp = requests.get(f"{BASE_URL}/models", headers={"X-Forwarded-For": ip_alias}, stream=True)
    print(f"[*] Status Code: {resp.status_code}")
    if resp.status_code == 200:
        print("[*] Reading stream (this should be slow)...")
        for line in resp.iter_lines():
            if line:
                print(f"  > {line.decode()}")
                break # Just read first line to verify

if __name__ == "__main__":
    print("=== AI Chain Guard DDoS Defense Simulation ===")
    # 1. Trigger rate limit -> block -> active defense
    simulate_flood("1.2.3.4", count=600) # Exceed 500 req/min
    
    # 2. Check if redirected to tar-pit
    # Note: In the simulated environment, remote_addr might be constant.
    # The middleware uses request.remote_addr, which is usually 127.0.0.1 in local tests.
    
    print("\n--- Simulation Complete ---")
