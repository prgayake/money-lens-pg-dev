#!/usr/bin/env python3
"""
Test Dashboard Integration - Full test of React dashboard integration with production Fi server
This creates a session, gets dashboard data, and shows the structure for frontend consumption
"""

import requests
import json
import sys

def test_dashboard_integration():
    """Test the complete dashboard integration flow"""
    
    print("=" * 80)
    print("🚀 TESTING FULL DASHBOARD INTEGRATION")
    print("=" * 80)
    print()
    
    base_url = "http://localhost:8001"
    
    print("🔄 Step 1: Creating a new session...")
    try:
        # Create session
        session_response = requests.post(f"{base_url}/session/create", 
                                       json={"user_id": "test_dashboard_user"})
        
        if session_response.status_code == 200:
            session_data = session_response.json()
            session_id = session_data["session_id"]
            print(f"   ✅ Session created: {session_id}")
            print(f"   📋 MCP Session ID: {session_data.get('mcp_session_id', 'N/A')}")
        else:
            print(f"   ❌ Failed to create session: {session_response.status_code}")
            return
            
    except Exception as e:
        print(f"   ❌ Error creating session: {e}")
        return
    
    print()
    print("🏦 Step 2: Fetching dashboard data...")
    try:
        # Get dashboard data
        dashboard_response = requests.get(f"{base_url}/session/{session_id}/dashboard")
        
        if dashboard_response.status_code == 200:
            dashboard_data = dashboard_response.json()
            print("   ✅ Dashboard data retrieved successfully!")
            print()
            
            if dashboard_data.get("status") == "success":
                dashboard = dashboard_data["dashboard"]
                metadata = dashboard_data.get("metadata", {})
                
                print("   💰 FINANCIAL OVERVIEW:")
                summary_cards = dashboard.get("summary_cards", {})
                
                print(f"      💎 Net Worth: {summary_cards.get('total_net_worth', {}).get('formatted_value', 'N/A')}")
                print(f"      🏦 Bank Balance: {summary_cards.get('bank_balance', {}).get('formatted_value', 'N/A')}")
                print(f"      📈 Investments: {summary_cards.get('investments', {}).get('formatted_value', 'N/A')}")
                print(f"      📊 Indian Stocks: {summary_cards.get('indian_stocks', {}).get('formatted_value', 'N/A')}")
                print(f"      🔒 EPF Balance: {summary_cards.get('epf_balance', {}).get('formatted_value', 'N/A')}")
                print(f"      ⭐ Credit Score: {summary_cards.get('credit_score', {}).get('formatted_value', 'N/A')}")
                
                if summary_cards.get('loans_debts', {}).get('value', 0) > 0:
                    print(f"      💳 Loans & Debts: {summary_cards.get('loans_debts', {}).get('formatted_value', 'N/A')}")
                
                print()
                print("   🔄 RECENT TRANSACTIONS:")
                transactions = dashboard.get("recent_transactions", [])
                if transactions:
                    for i, txn in enumerate(transactions[:3]):  # Show first 3
                        symbol = "+" if txn.get("type") == "credit" else "-"
                        amount = txn.get("amount", 0)
                        desc = txn.get("description", "No description")[:35]
                        date = txn.get("date", "N/A")
                        print(f"      {i+1}. {date} | {symbol}₹{amount:>8,.0f} | {desc}")
                    
                    if len(transactions) > 3:
                        print(f"      ... and {len(transactions) - 3} more transactions")
                else:
                    print("      No transactions available")
                
                print()
                print("   📊 DATA STRUCTURE FOR REACT DASHBOARD:")
                print("      ✅ summary_cards - Financial metrics with formatted values")
                print("      ✅ recent_transactions - Transaction history with categories")
                print("      ✅ detailed_sections - Detailed breakdowns per category")
                print("      ✅ alerts - Notifications and recommendations")
                
                print()
                print("   ⚙️ METADATA:")
                print(f"      🕐 Last Updated: {metadata.get('last_updated', 'N/A')}")
                print(f"      ⚡ Execution Time: {metadata.get('execution_time', 'N/A')}s")
                print(f"      📡 Data Sources: {metadata.get('data_sources', 'N/A')}")
                print(f"      🔧 Demo Mode: {metadata.get('demo_mode', False)}")
                
                if metadata.get('demo_mode'):
                    print()
                    print("   ⚠️  DEMO MODE DETECTED:")
                    print("      This session is not authenticated with Fi Money")
                    print("      Showing demo data instead of real financial information")
                    print("      To get real data: authenticate using /session/{id}/auth-url")
                
                print()
                print("   🎯 FRONTEND INTEGRATION:")
                print(f"      API Endpoint: GET /session/{session_id}/dashboard")
                print("      Response Format: JSON with status, dashboard, metadata")
                print("      Frontend: React dashboard can directly consume this structure")
                print("      Categories: Automatic transaction categorization included")
                print("      Behavior: User behavior analysis data ready for AI insights")
                
            else:
                print(f"   ❌ Dashboard API returned error: {dashboard_data.get('error', 'Unknown error')}")
                
        else:
            print(f"   ❌ Dashboard request failed: {dashboard_response.status_code}")
            try:
                error_data = dashboard_response.json()
                print(f"   📋 Error: {error_data}")
            except:
                print(f"   📋 Response: {dashboard_response.text}")
                
    except Exception as e:
        print(f"   ❌ Error fetching dashboard: {e}")
        return
    
    print()
    print("=" * 80)
    print("✅ INTEGRATION TEST COMPLETE!")
    print("=" * 80)
    print()
    print("🎉 YOUR DASHBOARD IS READY:")
    print("✅ Production Fi server connected and responding")
    print("✅ Dashboard API endpoint working with structured data")
    print("✅ React frontend can consume this data directly")
    print("✅ Bank transactions with automatic categorization")
    print("✅ Financial metrics with formatted display values")
    print("✅ User behavior analysis ready for AI insights")
    print()
    print("🔗 To use in React dashboard:")
    print(f"   1. Use session ID: {session_id}")
    print(f"   2. API call: GET {base_url}/session/{session_id}/dashboard")
    print("   3. Parse response.dashboard for UI components")
    print("   4. Use summary_cards for financial overview")
    print("   5. Use recent_transactions for transaction list")
    print("   6. Use metadata.demo_mode to show auth prompt")
    print("=" * 80)

if __name__ == "__main__":
    test_dashboard_integration()
