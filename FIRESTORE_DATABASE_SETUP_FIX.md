# 🔥 Fix: Create Firestore Database for money-lense Project

## 🚨 Issue Found
Your Firebase project "money-lense" exists, but the **Firestore database hasn't been created yet**.

Error: `404 The database (default) does not exist for project money-lense`

## 🛠️ Solution: Create Firestore Database

### Step 1: Go to Firebase Console
1. Open: **https://console.firebase.google.com/project/money-lense**
2. Make sure you're in the "money-lense" project

### Step 2: Create Firestore Database
1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"** button
3. **Choose production mode or test mode:**
   - **Test mode** (recommended for now): Allows read/write for 30 days
   - **Production mode**: Requires security rules setup

### Step 3: Select Location
1. Choose a location for your database (e.g., `us-central1`)
2. Click **"Done"**

### Step 4: Wait for Database Creation
- This may take a few minutes
- You'll see "Setting up your database..." message

## 🔧 Alternative Quick Setup via Direct Link

Click this direct link to set up Firestore for your project:
**https://console.cloud.google.com/datastore/setup?project=money-lense**

## ✅ After Database Creation

Once the database is created, run our test again:

```bash
cd fi-mcp-client
python firebase_debug_test.py
```

You should see:
- ✅ Messages saved successfully
- ✅ User memory operations working
- 📊 Data appearing in Firebase Console

## 🔒 Security Rules (For Testing)

If you chose "Production mode", you'll need basic security rules. Go to:
**https://console.firebase.google.com/project/money-lense/firestore/rules**

And use these test rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // WARNING: Only for testing!
    }
  }
}
```

## 🎯 What to Expect

After creating the database, your Firebase Console should show:
- **Collections**: `messages`, `user_memory`, `users`, `sessions`
- **Documents**: Test data from our debug script
- **Real-time updates**: When you chat with the AI

The database name should be `(default)` which is what our code expects.
