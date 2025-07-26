// Firebase Memory Inspector - Run this in browser console
// This will show you exactly what memory data is stored

async function inspectFirebaseMemory() {
  console.log('🔍 Firebase Memory Inspector Starting...\n');
  
  try {
    // Import Firebase services
    const { db } = await import('./firebase/config.js');
    const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
    
    console.log('📊 FIREBASE MEMORY INSPECTION RESULTS');
    console.log('=====================================\n');
    
    // 1. Check Users Collection
    console.log('1️⃣ USERS COLLECTION:');
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      console.log(`   Found ${usersSnapshot.size} users`);
      usersSnapshot.forEach((doc) => {
        console.log(`   User ID: ${doc.id}`);
        console.log(`   Data:`, doc.data());
        console.log('   ---');
      });
    } catch (error) {
      console.log('   Error:', error.message);
    }
    console.log('');
    
    // 2. Check Sessions Collection
    console.log('2️⃣ SESSIONS COLLECTION:');
    try {
      const sessionsSnapshot = await getDocs(collection(db, 'sessions'));
      console.log(`   Found ${sessionsSnapshot.size} sessions`);
      sessionsSnapshot.forEach((doc) => {
        console.log(`   Session ID: ${doc.id}`);
        console.log(`   Data:`, doc.data());
        console.log('   ---');
      });
    } catch (error) {
      console.log('   Error:', error.message);
    }
    console.log('');
    
    // 3. Check Conversations Collection
    console.log('3️⃣ CONVERSATIONS COLLECTION:');
    try {
      const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
      console.log(`   Found ${conversationsSnapshot.size} conversations`);
      conversationsSnapshot.forEach((doc) => {
        console.log(`   Conversation ID: ${doc.id}`);
        console.log(`   Data:`, doc.data());
        console.log('   ---');
      });
    } catch (error) {
      console.log('   Error:', error.message);
    }
    console.log('');
    
    // 4. Check Messages Collection (latest 10)
    console.log('4️⃣ MESSAGES COLLECTION (Latest 10):');
    try {
      const messagesQuery = query(
        collection(db, 'messages'), 
        orderBy('timestamp', 'desc'), 
        limit(10)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      console.log(`   Found ${messagesSnapshot.size} recent messages`);
      messagesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   Message ID: ${doc.id}`);
        console.log(`   Type: ${data.type}`);
        console.log(`   Content: ${data.content?.substring(0, 100)}...`);
        console.log(`   Timestamp: ${data.timestamp?.toDate()}`);
        console.log('   ---');
      });
    } catch (error) {
      console.log('   Error:', error.message);
    }
    console.log('');
    
    // 5. Check User Memory Collection (THE IMPORTANT ONE!)
    console.log('5️⃣ USER MEMORY COLLECTION (🧠 YOUR MEMORY DATA):');
    try {
      const memorySnapshot = await getDocs(collection(db, 'user_memory'));
      console.log(`   Found ${memorySnapshot.size} memory records`);
      memorySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   User ID: ${doc.id}`);
        console.log('   📝 Working Memory:', data.working_memory);
        console.log('   📚 Episodic Memory:', data.episodic_memory);
        console.log('   🎯 Semantic Memory:', data.semantic_memory);
        console.log(`   Last Updated: ${data.last_updated?.toDate()}`);
        console.log('   ===================================');
      });
    } catch (error) {
      console.log('   Error:', error.message);
    }
    console.log('');
    
    // 6. Current User Info
    console.log('6️⃣ CURRENT USER INFO:');
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      if (auth.currentUser) {
        console.log(`   Current User ID: ${auth.currentUser.uid}`);
        console.log(`   Anonymous: ${auth.currentUser.isAnonymous}`);
        console.log(`   Created: ${auth.currentUser.metadata.creationTime}`);
      } else {
        console.log('   No user currently signed in');
      }
    } catch (error) {
      console.log('   Error:', error.message);
    }
    
    console.log('\n🎉 Memory inspection complete!');
    console.log('\n💡 To see real-time updates, you can also:');
    console.log('   1. Open Firebase Console → Firestore');
    console.log('   2. Send a chat message and watch data appear');
    console.log('   3. Re-run this inspector: inspectFirebaseMemory()');
    
  } catch (error) {
    console.error('❌ Memory inspection failed:', error);
  }
}

// Quick functions for specific checks
async function checkUserMemory() {
  try {
    const { db } = await import('./firebase/config.js');
    const { getAuth } = await import('firebase/auth');
    const { doc, getDoc } = await import('firebase/firestore');
    
    const auth = getAuth();
    if (!auth.currentUser) {
      console.log('❌ No user signed in');
      return;
    }
    
    const userMemoryDoc = await getDoc(doc(db, 'user_memory', auth.currentUser.uid));
    if (userMemoryDoc.exists()) {
      console.log('🧠 YOUR CURRENT MEMORY DATA:');
      console.log(userMemoryDoc.data());
    } else {
      console.log('📝 No memory data found for current user');
    }
  } catch (error) {
    console.error('Error checking user memory:', error);
  }
}

async function checkRecentMessages() {
  try {
    const { db } = await import('./firebase/config.js');
    const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
    
    const messagesQuery = query(
      collection(db, 'messages'), 
      orderBy('timestamp', 'desc'), 
      limit(5)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    
    console.log('💬 YOUR RECENT MESSAGES:');
    messagesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`${data.type}: ${data.content}`);
      console.log(`Time: ${data.timestamp?.toDate()}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error checking recent messages:', error);
  }
}

// Make functions available globally
window.inspectFirebaseMemory = inspectFirebaseMemory;
window.checkUserMemory = checkUserMemory;
window.checkRecentMessages = checkRecentMessages;

console.log(`
🔍 Firebase Memory Inspector Loaded!

Available commands:
- inspectFirebaseMemory()  // Complete memory inspection
- checkUserMemory()       // Check your memory data only
- checkRecentMessages()   // Check recent chat messages

Run any of these commands to see your stored data!
`);
