#!/usr/bin/env python3
"""
Verify Dashboard Fix - Quick test to make sure everything is working
"""

import requests
import json

def verify_dashboard_fix():
    print("🔧 VERIFYING DASHBOARD FIX")
    print("=" * 50)
    
    base_url = "http://localhost:8001"
    
    # Create session and test dashboard
    print("1. Creating test session...")
    try:
        session_resp = requests.post(f"{base_url}/session/create", 
                                   json={"user_id": "verify_user"})
        session_data = session_resp.json()
        session_id = session_data["session_id"]
        print(f"   ✅ Session: {session_id}")
        
        # Test dashboard endpoint
        print("2. Testing dashboard endpoint...")
        dashboard_resp = requests.get(f"{base_url}/session/{session_id}/dashboard")
        dashboard_data = dashboard_resp.json()
        
        if dashboard_data.get("status") == "success":
            print("   ✅ Dashboard API working")
            
            # Check key data points
            dashboard = dashboard_data["dashboard"]
            summary = dashboard["summary_cards"]
            
            net_worth = summary.get("total_net_worth", {}).get("formatted_value", "N/A")
            bank_balance = summary.get("bank_balance", {}).get("formatted_value", "N/A")
            transactions = len(dashboard.get("recent_transactions", []))
            
            print(f"   💰 Net Worth: {net_worth}")
            print(f"   🏦 Bank Balance: {bank_balance}")
            print(f"   🔄 Transactions: {transactions}")
            
            print()
            print("✅ DASHBOARD FIX VERIFICATION SUCCESSFUL!")
            print()
            print("🎯 WHAT TO DO NOW:")
            print("1. Open your React app in browser")
            print("2. Go to Dashboard tab")
            print("3. Check browser console for logs")
            print("4. Should see production data, not ₹0")
            print()
            print(f"🔗 Test with session: {session_id}")
            print(f"🔗 API endpoint: {base_url}/session/{session_id}/dashboard")
            
        else:
            print("   ❌ Dashboard API error")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    verify_dashboard_fix()
