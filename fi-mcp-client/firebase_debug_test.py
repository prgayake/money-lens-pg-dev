#!/usr/bin/env python3
"""
Firebase Connection Test Script
This script will help debug Firebase connectivity and data writing issues.
"""

import os
import sys
import asyncio
import logging
from datetime import datetime

# Add the current directory to Python path
sys.path.append('/Users/rushikeshhulage/Desktop/fi/money-lens-pg-dev/fi-mcp-client')

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_firebase_connection():
    """Test Firebase connection and data operations"""
    print("🔥 Firebase Connection Test Starting...")
    print("=" * 50)
    
    try:
        # Import Firebase config
        from firebase_config import FirebaseMemoryManager
        
        print("✅ Successfully imported FirebaseMemoryManager")
        
        # Initialize Firebase
        manager = FirebaseMemoryManager()
        
        print(f"📡 Firebase initialized: {manager.initialized}")
        print(f"📊 Database client: {manager.db is not None}")
        
        if not manager.initialized:
            print("❌ Firebase not initialized properly!")
            print("\n🔍 Checking environment variables:")
            service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
            print(f"   FIREBASE_SERVICE_ACCOUNT_PATH: {service_account_path}")
            print(f"   File exists: {os.path.exists(service_account_path) if service_account_path else 'N/A'}")
            print(f"   FIREBASE_PROJECT_ID: {os.getenv('FIREBASE_PROJECT_ID')}")
            return
        
        print("\n🧪 Testing database operations...")
        
        # Test 1: Save a test message
        print("\n1️⃣ Testing save_message...")
        test_message = {
            'type': 'test',
            'content': 'This is a test message from Firebase debug script',
            'user_id': 'test_user_123'
        }
        
        saved_message = await manager.save_message('test_session_456', test_message)
        if saved_message:
            print(f"✅ Message saved successfully: {saved_message['id']}")
        else:
            print("❌ Failed to save message")
        
        # Test 2: Get user memory
        print("\n2️⃣ Testing get_user_memory...")
        user_memory = await manager.get_user_memory('test_user_123')
        if user_memory:
            print(f"✅ User memory retrieved: {user_memory}")
        else:
            print("❌ Failed to get user memory")
        
        # Test 3: Update user memory
        print("\n3️⃣ Testing update_user_memory...")
        memory_update = {
            'working_memory': {
                'test_key': 'test_value',
                'last_test': datetime.now().isoformat()
            },
            'episodic_memory': {
                'topics': ['firebase', 'testing', 'debug']
            }
        }
        
        updated_memory = await manager.update_user_memory('test_user_123', memory_update)
        if updated_memory:
            print(f"✅ Memory updated successfully")
        else:
            print("❌ Failed to update memory")
        
        # Test 4: Get conversation history
        print("\n4️⃣ Testing get_conversation_history...")
        history = await manager.get_conversation_history('test_session_456')
        print(f"✅ Conversation history: {len(history)} messages found")
        for msg in history:
            print(f"   - {msg.get('type', 'unknown')}: {msg.get('content', 'no content')[:50]}...")
        
        print("\n🎉 All tests completed!")
        print("\n📋 Check your Firebase Console at:")
        print("   https://console.firebase.google.com/project/money-lense/firestore/data")
        print("   You should see collections: messages, user_memory")
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        import traceback
        traceback.print_exc()

async def check_firestore_rules():
    """Check if Firestore security rules might be blocking writes"""
    print("\n🔒 Firestore Security Rules Check:")
    print("   If data isn't appearing, check your Firestore rules at:")
    print("   https://console.firebase.google.com/project/money-lense/firestore/rules")
    print()
    print("   For testing, your rules should look like:")
    print("   ```")
    print("   rules_version = '2';")
    print("   service cloud.firestore {")
    print("     match /databases/{database}/documents {")
    print("       match /{document=**} {")
    print("         allow read, write: if true; // WARNING: Only for testing!")
    print("       }")
    print("     }")
    print("   }")
    print("   ```")

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv('/Users/rushikeshhulage/Desktop/fi/money-lens-pg-dev/fi-mcp-client/.env')
    
    print("🌍 Environment variables loaded")
    print(f"   FIREBASE_PROJECT_ID: {os.getenv('FIREBASE_PROJECT_ID')}")
    print(f"   FIREBASE_SERVICE_ACCOUNT_PATH: {os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')}")
    
    # Run the test
    asyncio.run(test_firebase_connection())
    asyncio.run(check_firestore_rules())
