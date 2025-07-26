#!/usr/bin/env python3
"""
Debug Dashboard Data Flow - Check what data is being sent/received
"""

import requests
import json

def debug_dashboard_flow():
    print("🔍 DEBUGGING DASHBOARD DATA FLOW")
    print("=" * 60)
    
    base_url = "http://localhost:8001"
    
    # Create a session
    print("1. Creating session...")
    session_resp = requests.post(f"{base_url}/session/create", json={"user_id": "debug_user"})
    session_data = session_resp.json()
    session_id = session_data["session_id"]
    print(f"   Session ID: {session_id}")
    
    # Get dashboard data
    print("2. Getting dashboard data...")
    dashboard_resp = requests.get(f"{base_url}/session/{session_id}/dashboard")
    dashboard_data = dashboard_resp.json()
    
    print("3. Raw API Response Structure:")
    print(f"   Status: {dashboard_data.get('status')}")
    print(f"   Has dashboard key: {'dashboard' in dashboard_data}")
    
    if 'dashboard' in dashboard_data:
        dashboard = dashboard_data['dashboard']
        print(f"   Summary cards: {'summary_cards' in dashboard}")
        print(f"   Transactions: {'recent_transactions' in dashboard}")
        
        if 'summary_cards' in dashboard:
            cards = dashboard['summary_cards']
            print(f"   Net worth value: {cards.get('total_net_worth', {}).get('value', 'MISSING')}")
            print(f"   Bank balance: {cards.get('bank_balance', {}).get('value', 'MISSING')}")
        
        if 'recent_transactions' in dashboard:
            txns = dashboard['recent_transactions']
            print(f"   Number of transactions: {len(txns)}")
            if txns:
                print(f"   First transaction: {txns[0]}")
    
    print("\n4. Expected Frontend Data Structure:")
    print("   The React component expects:")
    print("   - sessionId prop to be passed")
    print("   - API_BASE_URL to be correct")
    print("   - Data transformation to work")
    
    print(f"\n5. Test API call from frontend perspective:")
    print(f"   URL: {base_url}/session/{session_id}/dashboard")
    print(f"   Expected by component: sessionId='{session_id}'")
    
    # Save the session ID for frontend testing
    with open('/tmp/test_session_id.txt', 'w') as f:
        f.write(session_id)
    print(f"\n✅ Session ID saved to /tmp/test_session_id.txt for testing")
    print(f"   Use this session ID in your React component: {session_id}")

if __name__ == "__main__":
    debug_dashboard_flow()
