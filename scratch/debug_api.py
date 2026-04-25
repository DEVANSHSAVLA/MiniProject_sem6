import requests

url = "http://localhost:5000/api/bank/accounts"
headers = {
    "X-SPIFFE-ID": "spiffe://ai-chain-guard.io/public/anonymous",
    "Authorization": "Bearer demo-token" # We need a token if it uses @require_auth
}

try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
