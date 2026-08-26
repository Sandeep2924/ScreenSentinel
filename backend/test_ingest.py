import requests
import json
import time

API_URL = "http://localhost:3000/api/ingest"
API_KEY = "DEMO_COMPANY_123"

def test_ingest():
    print(f"Testing SaaS Ingest API at {API_URL}...")
    
    payload = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "module": "process_monitor",
        "event_type": "RECORDER_DETECTED",
        "severity": "CRITICAL",
        "details": {
            "process": "obs64.exe",
            "msg": "Simulated test event for SaaS login test"
        }
    }
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("SUCCESS! The Cloud API accepted the event.")
            print("Response:", json.dumps(response.json(), indent=2))
        elif response.status_code == 401:
            print("AUTH FAILED! The API Key was rejected.")
            print("Response:", response.text)
        else:
            print("ERROR! Something went wrong.")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"Failed to connect to {API_URL}. Make sure Next.js is running! Error: {e}")

if __name__ == "__main__":
    test_ingest()
