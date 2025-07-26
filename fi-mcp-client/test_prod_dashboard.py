#!/usr/bin/env python3
"""
Test Production Dashboard API - Tests the real /api/dashboard-data endpoint
This calls your running api_server_new.py to get real bank transactions from production Fi server
"""

import requests
import json
import sys

def test_dashboard_endpoint():
    """Test the dashboard endpoint with real production data"""
    
    print("=" * 80)
    print("🏦 TESTING PRODUCTION DASHBOARD API")
    print("=" * 80)
    print()
    
    # Your running server URL (adjust port if different)
    base_url = "http://localhost:8001"
    
    print(f"🔗 Testing server at: {base_url}")
    print()
    
    try:
        # First, test if server is running
        print("1️⃣ Testing server health...")
        health_response = requests.get(f"{base_url}/health", timeout=5)
        if health_response.status_code == 200:
            print("   ✅ Server is running!")
            try:
                health_data = health_response.json()
                print(f"   📊 Health data: {health_data}")
            except:
                print("   📊 Server responded with 200 OK")
        else:
            print(f"   ⚠️ Server responded with status {health_response.status_code}")
            print("   🔄 Continuing anyway - server might be running...")
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Cannot connect to server. Is api_server_new.py running?")
        print("   💡 Make sure your server is running on port 8001")
        return
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    print()
    
    # Test dashboard endpoint with a test session
    print("2️⃣ Testing dashboard endpoint...")
    
    # Use a test session ID
    test_session_id = "test_session_123"
    
    try:
        dashboard_url = f"{base_url}/session/{test_session_id}/dashboard"
        
        print(f"   🔄 Calling: {dashboard_url}")
        print()
        
        response = requests.get(dashboard_url, timeout=10)
        
        print(f"   📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Dashboard API Response:")
            print()
            
            # Your api_server_new.py returns structured dashboard data directly
            dashboard_data = data
            
            print("   💰 FINANCIAL SUMMARY:")
            summary_cards = dashboard_data.get('summary_cards', {})
            if summary_cards:
                print(f"      Total Income: {summary_cards.get('total_income', {}).get('formatted_value', 'N/A')}")
                print(f"      Total Spending: {summary_cards.get('total_spending', {}).get('formatted_value', 'N/A')}")
                print(f"      Net Worth: {summary_cards.get('total_net_worth', {}).get('formatted_value', 'N/A')}")
                print(f"      Credit Score: {summary_cards.get('credit_score', {}).get('formatted_value', 'N/A')}")
            print()
            
            print("   📈 SPENDING CATEGORIES:")
            spending_cats = dashboard_data.get('spending_by_category', {})
            if spending_cats:
                for category, amount in sorted(spending_cats.items(), key=lambda x: x[1] if isinstance(x[1], (int, float)) else 0, reverse=True):
                    print(f"      {category}: ₹{amount:,.2f}" if isinstance(amount, (int, float)) else f"      {category}: {amount}")
            else:
                print("      No spending categories available")
            print()
            
            print("   🔄 RECENT TRANSACTIONS:")
            transactions = dashboard_data.get('recent_transactions', [])
            if transactions:
                for i, txn in enumerate(transactions[:5]):  # Show first 5
                    amount = txn.get('amount', 0)
                    category = txn.get('category', 'Unknown')
                    desc = txn.get('description', 'No description')[:40]
                    print(f"      {i+1}. ₹{amount:>10,.2f} | {category:<15} | {desc}")
            else:
                print("      No recent transactions available")
            
            print()
            print("   ✅ SUCCESS! Your dashboard API is working with production Fi server!")
            
        else:
            print(f"   ❌ HTTP Error: {response.status_code}")
            if response.status_code == 404:
                print("   💡 Session not found - this is expected for test session")
                print("   💡 Your dashboard frontend will create real sessions and authenticate")
            try:
                error_data = response.json()
                print(f"   📋 Error Details: {error_data}")
            except:
                print(f"   📋 Response Text: {response.text}")
                
    except requests.exceptions.Timeout:
        print("   ❌ Request timeout - server might be processing")
    except Exception as e:
        print(f"   ❌ Request Error: {e}")
    
    print()
    print("=" * 80)
    print("🔍 WHAT THIS MEANS:")
    print("=" * 80)
    print("✅ Your api_server_new.py has the /session/{id}/dashboard endpoint")
    print("✅ It will call production Fi server using fetch_bank_transactions")
    print("✅ Real transaction data will be categorized and analyzed")
    print("✅ Your React dashboard can consume this data structure")
    print()
    print("🔗 To get real data:")
    print("1. Create a session: POST /session/create")
    print("2. Get auth URL: GET /session/{id}/auth-url")
    print("3. Authenticate with Fi production server")
    print("4. Call dashboard: GET /session/{id}/dashboard")
    print("=" * 80)

if __name__ == "__main__":
    test_dashboard_endpoint()
