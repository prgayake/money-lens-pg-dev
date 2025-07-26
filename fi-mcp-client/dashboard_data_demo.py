#!/usr/bin/env python3
"""
Dashboard Data Demo - Shows exactly what data structure your dashboard will receive
This demonstrates the data format for bank transactions with categorization and behavior analysis
"""

import json
import os
from typing import Dict, List

def load_test_bank_data() -> dict:
    """Load test bank transaction data from fi-mcp-dev directory"""
    try:
        # Path to test data
        test_data_path = "/Users/pradyumna/Downloads/money-lens-pg-dev/fi-mcp-dev/test_data_dir/1010101010/fetch_bank_transactions.json"
        
        if os.path.exists(test_data_path):
            with open(test_data_path, 'r') as f:
                return json.load(f)
        else:
            print(f"❌ Test data file not found at: {test_data_path}")
            return {}
    except Exception as e:
        print(f"❌ Error loading test data: {e}")
        return {}

def categorize_transaction(description: str) -> str:
    """Categorize transaction based on description"""
    description_lower = description.lower()
    
    # Food & Dining
    if any(word in description_lower for word in ['grocer', 'restaurant', 'food', 'dining', 'cafe', 'swiggy', 'zomato']):
        return "Food & Dining"
    
    # Transportation
    if any(word in description_lower for word in ['fuel', 'petrol', 'diesel', 'uber', 'ola', 'cab', 'taxi', 'transport']):
        return "Transportation"
    
    # Bills & Utilities
    if any(word in description_lower for word in ['electricity', 'water', 'gas', 'mobile', 'broadband', 'internet', 'bill']):
        return "Bills & Utilities"
    
    # Credit Card
    if any(word in description_lower for word in ['credit card', 'card payment', 'card-bill']):
        return "Credit Card"
    
    # Investment & Finance
    if any(word in description_lower for word in ['sip', 'mutual fund', 'fd', 'rd', 'zerodha', 'etf', 'investment', 'installment']):
        return "Investment"
    
    # Rent
    if any(word in description_lower for word in ['rent']):
        return "Housing & Rent"
    
    # Salary
    if any(word in description_lower for word in ['salary', 'payroll']):
        return "Income"
    
    # Interest
    if any(word in description_lower for word in ['interest']):
        return "Finance"
    
    # Default
    return "Others"

def generate_behavior_analysis(transactions: List[dict], spending_by_category: dict) -> dict:
    """Generate AI-powered behavior analysis"""
    if not transactions:
        return {
            "insights": ["No transaction data available for analysis"],
            "score": "N/A",
            "recommendations": ["Connect your bank account to get personalized insights"]
        }
    
    insights = []
    recommendations = []
    
    # Analyze spending patterns
    if spending_by_category:
        top_category = max(spending_by_category.items(), key=lambda x: x[1])
        insights.append(f"Highest spending category: {top_category[0]} (₹{top_category[1]:,.0f})")
        
        if "Food & Dining" in spending_by_category:
            food_spending = spending_by_category["Food & Dining"]
            if food_spending > 5000:
                recommendations.append("Consider meal planning to optimize food expenses")
        
        if "Investment" in spending_by_category:
            insights.append("Good investment discipline with regular SIPs")
        else:
            recommendations.append("Consider starting systematic investments for long-term wealth")
    
    # Analyze transaction frequency
    debit_count = len([t for t in transactions if t["type"] == "debit"])
    credit_count = len([t for t in transactions if t["type"] == "credit"])
    
    if debit_count > credit_count * 3:
        insights.append("High transaction frequency - mostly expenses")
        recommendations.append("Track daily expenses to identify optimization opportunities")
    
    # Calculate a simple spending score
    total_spending = sum(spending_by_category.values())
    total_income = sum([t["amount"] for t in transactions if t["type"] == "credit"])
    
    if total_income > 0:
        spending_ratio = total_spending / total_income
        if spending_ratio < 0.7:
            score = "Excellent"
            insights.append("Great savings discipline!")
        elif spending_ratio < 0.85:
            score = "Good"
            insights.append("Healthy spending-to-income ratio")
        else:
            score = "Needs Improvement"
            recommendations.append("Consider reducing discretionary expenses")
    else:
        score = "N/A"
    
    return {
        "insights": insights,
        "score": score,
        "recommendations": recommendations
    }

def process_dashboard_data():
    """Process and display dashboard data structure"""
    print("=" * 80)
    print("🏦 FINANCIAL DASHBOARD DATA DEMO")
    print("=" * 80)
    print()
    
    # Load test bank data
    bank_data = load_test_bank_data()
    
    if not bank_data:
        print("❌ No bank data available")
        return
    
    print("✅ Bank data loaded successfully!")
    print(f"📊 Found {len(bank_data.get('bankTransactions', []))} bank(s) with transaction data")
    print()
    
    # Process transactions
    recent_transactions = []
    if bank_data.get("bankTransactions") and len(bank_data["bankTransactions"]) > 0:
        bank_txns = bank_data["bankTransactions"][0]["txns"]
        
        print(f"🔄 Processing {len(bank_txns)} transactions from first bank...")
        
        # Convert to frontend format and get recent transactions
        for i, txn in enumerate(bank_txns[:15]):  # Show first 15 transactions
            amount = float(txn[0])
            description = txn[1]
            date = txn[2]
            txn_type = int(txn[3])  # 1=CREDIT, 2=DEBIT
            mode = txn[4]
            balance = float(txn[5])
            
            # Categorize transaction
            category = categorize_transaction(description)
            
            recent_transactions.append({
                "id": f"txn_{hash(f'{date}_{description}_{amount}')}",
                "amount": amount,
                "description": description,
                "date": date,
                "type": "credit" if txn_type == 1 else "debit",
                "category": category,
                "mode": mode,
                "balance": balance
            })
    
    # Calculate spending by category
    spending_by_category = {}
    total_spending = 0
    total_income = 0
    
    for txn in recent_transactions:
        if txn["type"] == "debit":
            category = txn["category"]
            amount = txn["amount"]
            spending_by_category[category] = spending_by_category.get(category, 0) + amount
            total_spending += amount
        elif txn["type"] == "credit":
            total_income += txn["amount"]
    
    # Generate user behavior analysis
    behavior_analysis = generate_behavior_analysis(recent_transactions, spending_by_category)
    
    # Create the complete dashboard data structure
    dashboard_data = {
        "success": True,
        "status": "success",
        "data": {
            "recent_transactions": recent_transactions,
            "spending_by_category": spending_by_category,
            "total_spending": total_spending,
            "total_income": total_income,
            "behavior_analysis": behavior_analysis,
            "last_updated": 1706347200  # Mock timestamp
        }
    }
    
    # Display the results
    print("=" * 80)
    print("📊 DASHBOARD DATA STRUCTURE")
    print("=" * 80)
    print()
    
    print("💰 FINANCIAL SUMMARY:")
    print(f"   Total Income: ₹{total_income:,.2f}")
    print(f"   Total Spending: ₹{total_spending:,.2f}")
    print(f"   Transactions Processed: {len(recent_transactions)}")
    print()
    
    print("📈 SPENDING BY CATEGORY:")
    for category, amount in sorted(spending_by_category.items(), key=lambda x: x[1], reverse=True):
        print(f"   {category}: ₹{amount:,.2f}")
    print()
    
    print("🎯 BEHAVIOR ANALYSIS:")
    print(f"   Score: {behavior_analysis['score']}")
    print("   Insights:")
    for insight in behavior_analysis['insights']:
        print(f"     • {insight}")
    print("   Recommendations:")
    for recommendation in behavior_analysis['recommendations']:
        print(f"     • {recommendation}")
    print()
    
    print("🔄 RECENT TRANSACTIONS (First 10):")
    for i, txn in enumerate(recent_transactions[:10]):
        type_symbol = "+" if txn["type"] == "credit" else "-"
        print(f"   {i+1:2d}. {type_symbol}₹{txn['amount']:>10,.2f} | {txn['category']:<15} | {txn['description'][:40]}")
    print()
    
    print("=" * 80)
    print("📋 COMPLETE JSON STRUCTURE FOR YOUR DASHBOARD:")
    print("=" * 80)
    print()
    print(json.dumps(dashboard_data, indent=2, default=str))
    print()
    
    print("=" * 80)
    print("✅ This is the exact data structure your /api/dashboard-data endpoint will return!")
    print("🔗 Your React dashboard can now consume this data to display:")
    print("   • Bank transactions with smart categorization")
    print("   • Spending breakdown by category") 
    print("   • AI-powered behavior analysis and recommendations")
    print("   • Financial insights and spending score")
    print("=" * 80)

if __name__ == "__main__":
    process_dashboard_data()
