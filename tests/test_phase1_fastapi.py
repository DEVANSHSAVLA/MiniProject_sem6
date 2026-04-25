import httpx
import asyncio
import base64
from datetime import datetime

async def test_api():
    base_url = "http://127.0.0.1:8000"
    api_v1 = f"{base_url}/api/v1"
    
    print("--- Phase 1: Verification Test ---")
    
    # 1. Test Root & Zero Trust Identification
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{base_url}/", headers={"X-SPIFFE-ID": "spiffe://ai-chain-guard.io/workload/test-node"})
            print(f"Root Status: {resp.status_code}")
            print(f"Zero Trust Identity: {resp.headers.get('X-Zero-Trust-Identity')}")
            
            # 2. Test Multi-currency Transaction
            payload = {
                "sender_id": 101,
                "receiver_id": 202,
                "amount": 1500.0,
                "currency": "USD",
                "description": "Enterprise cloud payment",
                "digital_signature": "simulated_pss_sig_base64",
                "public_key_pem": "--- BEGIN PUBLIC KEY ---"
            }
            
            resp = await client.post(f"{api_v1}/transactions/process", json=payload, headers={"X-SPIFFE-ID": "spiffe://ai-chain-guard.io/workload/web-gateway"})
            print(f"Transaction Status: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                print(f"Trans ID: {data['transaction_id']}")
                print(f"Risk Score: {data['risk_score']}")
                print(f"Blockchain TX: {data['blockchain_tx']}")
            
            # 3. Test Anomaly Detection (Send multiple requests to see score)
            print("Stress testing for Anomaly Detection...")
            for i in range(5):
                await client.get(f"{base_url}/health", headers={"X-SPIFFE-ID": "spiffe://ai-chain-guard.io/workload/monitor-bot"})
            
            resp = await client.get(f"{base_url}/health", headers={"X-SPIFFE-ID": "spiffe://ai-chain-guard.io/workload/monitor-bot"})
            print(f"IP Risk Header: {resp.headers.get('X-IP-Risk')}")

        except Exception as e:
            print(f"Test Failed: {e}")

if __name__ == "__main__":
    # Note: Ensure uvicorn is running: uvicorn backend_v2.app.main:app --reload
    print("Please ensure the FastAPI server is running before executing this test.")
