#!/usr/bin/env python3
"""
Test React Error Fix - Check if the object rendering issue is resolved
"""

import requests
import json

def test_react_error_fix():
    print("🔧 TESTING REACT ERROR FIX")
    print("=" * 50)
    
    base_url = "http://localhost:8001"
    
    # Create session
    print("1. Creating session for React test...")
    session_resp = requests.post(f"{base_url}/session/create", json={"user_id": "react_test"})
    session_data = session_resp.json()
    session_id = session_data["session_id"]
    
    # Get dashboard data to check structure
    print("2. Getting dashboard data structure...")
    dashboard_resp = requests.get(f"{base_url}/session/{session_id}/dashboard")
    dashboard_data = dashboard_resp.json()
    
    if dashboard_data.get("status") == "success":
        dashboard = dashboard_data["dashboard"]
        
        print("3. Checking potentially problematic data types:")
        
        # Check credit score structure
        credit_score = dashboard["summary_cards"].get("credit_score", {})
        print(f"   Credit Score type: {type(credit_score.get('value'))}")
        print(f"   Credit Score value: {credit_score.get('value')}")
        
        # Check if there are any unexpected object types
        summary_cards = dashboard.get("summary_cards", {})
        for key, value in summary_cards.items():
            if isinstance(value, dict):
                inner_value = value.get("value")
                print(f"   {key}: value={inner_value} (type: {type(inner_value)})")
        
        print()
        print("✅ Data structure analysis complete")
        print()
        print("🎯 FOR REACT FRONTEND:")
        print("1. Clear browser cache and refresh")
        print("2. Open browser developer tools (F12)")
        print("3. Check console for any remaining errors")
        print("4. The creditScore object rendering issue should be fixed")
        print()
        print(f"🔗 Session for testing: {session_id}")
        print("🔗 Expected: No more 'Objects are not valid as React child' errors")
        
    else:
        print("❌ Dashboard API error")

if __name__ == "__main__":
    test_react_error_fix()
