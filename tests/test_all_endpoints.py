import requests
import threading
import time
import random

BASE_URL = "http://127.0.0.1:5000/api"
STOP = False
metrics = {"auth_calls": 0, "model_calls": 0, "dataset_calls": 0, "errors": 0, "403_blocks": 0}
lock = threading.Lock()

def record_metric(key, status_code=200):
    global metrics
    with lock:
        if status_code == 403 or status_code == 429:
            metrics["403_blocks"] += 1
        elif status_code >= 400 and status_code != 403 and status_code != 404:
            metrics["errors"] += 1
        else:
            metrics[key] += 1

def hammer_auth():
    while not STOP:
        try:
            r = requests.post(f"{BASE_URL}/auth/login", json={"username": f"user{random.randint(1,1000)}", "password": "pass"})
            record_metric("auth_calls", r.status_code)
        except Exception:
            record_metric("auth_calls", 500)
        time.sleep(0.01)

def hammer_models():
    while not STOP:
        try:
            # 50% reads, 50% writes
            if random.random() > 0.5:
                r = requests.get(f"{BASE_URL}/models")
            else:
                r = requests.post(f"{BASE_URL}/models", json={"name": f"Stress_Model_{random.randint(1,1000)}", "version": "1.0", "description": "Stress testing", "owner_id": 1})
            record_metric("model_calls", r.status_code)
        except Exception:
            record_metric("model_calls", 500)
        time.sleep(0.01)

def hammer_datasets():
    while not STOP:
        try:
            r = requests.get(f"{BASE_URL}/datasets")
            record_metric("dataset_calls", r.status_code)
        except Exception:
            record_metric("dataset_calls", 500)
        time.sleep(0.01)

if __name__ == "__main__":
    print("=== Phase 2: Extreme API Stress Test ===")
    print("Spawning 30 concurrent threads across all endpoints...")
    threads = []
    
    for _ in range(10):
        t1 = threading.Thread(target=hammer_auth)
        t2 = threading.Thread(target=hammer_models)
        t3 = threading.Thread(target=hammer_datasets)
        threads.extend([t1, t2, t3])
        t1.start()
        t2.start()
        t3.start()

    print("Blasting API for 5 seconds...")
    try:
        time.sleep(5)
    except KeyboardInterrupt:
        pass
        
    STOP = True
    for t in threads:
        t.join()

    print("\n[RESULT METRICS]")
    for k, v in metrics.items():
        print(f" - {k}: {v}")
    
    print("\nIf '403_blocks' is high (>10), then the Anomaly Detection successfully kicked in and suppressed the attack dynamically!")
    print("Stress test concluded.")
