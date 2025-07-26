import os
import json
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Initialize Firebase
service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
if service_account_path and os.path.exists(service_account_path):
    cred = credentials.Certificate(service_account_path)
    firebase_admin.initialize_app(cred)
else:
    raise Exception('Service account file not found or not set in .env')

# Get Firestore client (default database)
db = firestore.client()

# Try to write a test document
try:
    test_ref = db.collection('test_collection').document('test_doc')
    test_ref.set({
        'message': 'Hello from minimal test!',
        'timestamp': datetime.now(),
        'status': 'success'
    })
    print('✅ Successfully wrote test document to Firestore!')
except Exception as e:
    print(f'❌ Failed to write test document: {e}')
