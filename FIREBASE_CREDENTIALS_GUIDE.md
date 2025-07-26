# 🔑 How to Get Firebase Service Account Credentials

## What is FIREBASE_SERVICE_ACCOUNT_PATH?

The `FIREBASE_SERVICE_ACCOUNT_PATH` points to a JSON file that contains your Firebase project's private credentials. This file allows your backend server to securely connect to Firebase.

## Step-by-Step Guide to Get Firebase Credentials

### Step 1: Go to Firebase Console
1. Open your web browser
2. Go to: **https://console.firebase.google.com/**
3. Sign in with your Google account

### Step 2: Create or Select Your Project
**Option A: If you already have a project called "money-lense":**
- Click on the "money-lense" project

**Option B: If you need to create a new project:**
1. Click "Add project" or "Create a project"
2. Enter project name: `money-lense`
3. Click "Continue"
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 3: Generate Service Account Key
1. In your Firebase project, click the **⚙️ Settings gear icon** (top left)
2. Select **"Project settings"**
3. Click the **"Service accounts"** tab
4. You'll see a section called **"Firebase Admin SDK"**
5. Click **"Generate new private key"** button
6. A popup will appear asking "Generate new private key?"
7. Click **"Generate key"**

### Step 4: Download and Save the JSON File
1. A JSON file will automatically download to your computer
2. The file name will be something like: `money-lense-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`
3. **IMPORTANT**: Rename this file to: `firebase-service-account.json`
4. Move this file to your project directory: `/Users/rushikeshhulage/Desktop/fi/money-lens-pg-dev/fi-mcp-client/`

### Step 5: Verify File Location
After moving the file, you should have:
```
fi-mcp-client/
├── firebase-service-account.json  ← This file should be here
├── .env
├── api_server_new.py
└── firebase_config.py
```

## What about FIREBASE_DATABASE_URL?

The `FIREBASE_DATABASE_URL` you currently have looks correct:
```
FIREBASE_DATABASE_URL=https://money-lense-default-rtdb.firebaseio.com/
```

This URL is automatically generated based on your project name "money-lense". If you want to verify it:

1. In Firebase Console → Your Project
2. Go to **"Realtime Database"** (left sidebar)
3. If prompted, click **"Create Database"**
4. Choose **"Start in test mode"**
5. Select location (e.g., us-central1)
6. The URL shown will match your `.env` file

## Security Important Notes ⚠️

1. **NEVER commit the `firebase-service-account.json` file to Git**
2. **Keep this file secure and private**
3. **Don't share this file with anyone**

Add this to your `.gitignore` file:
```
firebase-service-account.json
```

## Test Your Setup

After completing the steps above, test your Firebase connection:

```bash
cd fi-mcp-client
python -c "
import os
print('✅ Checking Firebase setup...')
if os.path.exists('./firebase-service-account.json'):
    print('✅ Service account file found!')
else:
    print('❌ Service account file missing!')
"
```

## What Each Configuration Does

1. **FIREBASE_SERVICE_ACCOUNT_PATH**: Points to your credentials file
2. **FIREBASE_PROJECT_ID**: Your Firebase project identifier
3. **FIREBASE_DATABASE_URL**: Where your data will be stored

Once you have the `firebase-service-account.json` file in place, your Firebase integration will work perfectly!
