# Firebase Backend Integration for MCP Server

## 1. Install Firebase Admin SDK

```bash
cd ../fi-mcp-client
pip install firebase-admin
```

## 2. Add Firebase Configuration

Create `firebase_config.py`:

```python
import firebase_admin
from firebase_admin import credentials, firestore
import os
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

class FirebaseMemoryManager:
    def __init__(self):
        self.db = None
        self.initialized = False
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase with service account key"""
        try:
            # Option 1: Use service account key file
            service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
            if service_account_path and os.path.exists(service_account_path):
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
            
            # Option 2: Use service account key from environment
            elif os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY'):
                service_account_info = json.loads(os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY'))
                cred = credentials.Certificate(service_account_info)
                firebase_admin.initialize_app(cred)
            
            else:
                logger.error("No Firebase credentials found")
                return
            
            self.db = firestore.client()
            self.initialized = True
            logger.info("Firebase initialized successfully")
            
        except Exception as e:
            logger.error(f"Firebase initialization failed: {e}")
            self.initialized = False
    
    async def create_user(self, user_id: str, user_data: dict):
        """Create or update user profile"""
        if not self.initialized:
            return None
        
        try:
            user_ref = self.db.collection('users').document(user_id)
            user_data['created_at'] = datetime.now()
            user_data['last_updated'] = datetime.now()
            user_ref.set(user_data, merge=True)
            return user_data
        except Exception as e:
            logger.error(f"Failed to create user: {e}")
            return None
    
    async def save_message(self, session_id: str, message_data: dict):
        """Save chat message to Firebase"""
        if not self.initialized:
            return None
        
        try:
            message_ref = self.db.collection('messages').document()
            message_data.update({
                'session_id': session_id,
                'timestamp': datetime.now(),
                'id': message_ref.id
            })
            message_ref.set(message_data)
            return message_data
        except Exception as e:
            logger.error(f"Failed to save message: {e}")
            return None
    
    async def get_conversation_history(self, session_id: str, limit: int = 50):
        """Get conversation history for a session"""
        if not self.initialized:
            return []
        
        try:
            messages_ref = self.db.collection('messages')
            query = messages_ref.where('session_id', '==', session_id)\
                              .order_by('timestamp', direction=firestore.Query.DESCENDING)\
                              .limit(limit)
            
            docs = query.stream()
            messages = []
            for doc in docs:
                message_data = doc.to_dict()
                messages.append(message_data)
            
            return list(reversed(messages))  # Return in chronological order
        except Exception as e:
            logger.error(f"Failed to get conversation history: {e}")
            return []
    
    async def update_user_memory(self, user_id: str, memory_data: dict):
        """Update user's AI memory"""
        if not self.initialized:
            return None
        
        try:
            memory_ref = self.db.collection('user_memory').document(user_id)
            
            # Get existing memory
            existing_memory = memory_ref.get()
            if existing_memory.exists:
                current_memory = existing_memory.to_dict()
            else:
                current_memory = {
                    'working_memory': {},
                    'episodic_memory': {'interaction_count': 0, 'topics': []},
                    'semantic_memory': {'preferences': {}, 'successful_patterns': []}
                }
            
            # Update memory sections
            if 'working_memory' in memory_data:
                current_memory['working_memory'].update(memory_data['working_memory'])
            
            if 'episodic_memory' in memory_data:
                current_memory['episodic_memory']['interaction_count'] += 1
                if 'topics' in memory_data['episodic_memory']:
                    current_memory['episodic_memory']['topics'].extend(
                        memory_data['episodic_memory']['topics']
                    )
            
            if 'semantic_memory' in memory_data:
                current_memory['semantic_memory'].update(memory_data['semantic_memory'])
            
            current_memory['last_updated'] = datetime.now()
            memory_ref.set(current_memory)
            
            return current_memory
        except Exception as e:
            logger.error(f"Failed to update user memory: {e}")
            return None
    
    async def get_user_memory(self, user_id: str):
        """Get user's AI memory"""
        if not self.initialized:
            return None
        
        try:
            memory_ref = self.db.collection('user_memory').document(user_id)
            memory_doc = memory_ref.get()
            
            if memory_doc.exists:
                return memory_doc.to_dict()
            else:
                # Initialize empty memory
                empty_memory = {
                    'working_memory': {},
                    'episodic_memory': {'interaction_count': 0, 'topics': []},
                    'semantic_memory': {'preferences': {}, 'successful_patterns': []},
                    'created_at': datetime.now(),
                    'last_updated': datetime.now()
                }
                memory_ref.set(empty_memory)
                return empty_memory
        except Exception as e:
            logger.error(f"Failed to get user memory: {e}")
            return None

# Global instance
firebase_memory = FirebaseMemoryManager()
```

## 3. Update your API server

Add to `api_server_new.py`:

```python
from firebase_config import firebase_memory
from typing import Optional
import hashlib

def get_user_id_from_session(session_id: str) -> str:
    """Generate consistent user ID from session"""
    return hashlib.md5(session_id.encode()).hexdigest()

@app.post("/session/{session_id}/chat")
async def enhanced_chat(session_id: str, request: ChatRequest):
    try:
        user_id = get_user_id_from_session(session_id)
        
        # 1. Get user memory for context
        user_memory = await firebase_memory.get_user_memory(user_id)
        
        # 2. Save user message
        user_message = {
            'type': 'user',
            'content': request.message,
            'user_id': user_id
        }
        await firebase_memory.save_message(session_id, user_message)
        
        # 3. Add memory context to AI request
        enhanced_context = {
            'user_memory': user_memory,
            'conversation_history': await firebase_memory.get_conversation_history(session_id, limit=10)
        }
        
        # 4. Process with your existing MCP logic
        response = await process_mcp_request(request.message, enhanced_context)
        
        # 5. Save AI response
        ai_message = {
            'type': 'assistant',
            'content': response['response'],
            'tools_used': response.get('tools_used', []),
            'user_id': user_id
        }
        await firebase_memory.save_message(session_id, ai_message)
        
        # 6. Update user memory based on interaction
        memory_update = {
            'working_memory': {
                'last_query': request.message,
                'last_response': response['response'],
                'active_topics': extract_topics(request.message)
            },
            'episodic_memory': {
                'topics': extract_topics(request.message)
            }
        }
        await firebase_memory.update_user_memory(user_id, memory_update)
        
        return response
        
    except Exception as e:
        logger.error(f"Enhanced chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/session/{session_id}/memory")
async def get_session_memory(session_id: str):
    """Get memory and conversation history for session"""
    try:
        user_id = get_user_id_from_session(session_id)
        
        user_memory = await firebase_memory.get_user_memory(user_id)
        conversation_history = await firebase_memory.get_conversation_history(session_id)
        
        return {
            'user_memory': user_memory,
            'conversation_history': conversation_history,
            'user_id': user_id
        }
    except Exception as e:
        logger.error(f"Get memory error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def extract_topics(message: str) -> list:
    """Extract topics from message for memory"""
    # Simple topic extraction - you can enhance this
    financial_keywords = [
        'investment', 'savings', 'budget', 'loan', 'credit', 'debt',
        'stocks', 'bonds', 'mutual funds', 'insurance', 'tax', 'retirement'
    ]
    
    topics = []
    message_lower = message.lower()
    for keyword in financial_keywords:
        if keyword in message_lower:
            topics.append(keyword)
    
    return topics
```

## 4. Environment Configuration

Add to your `.env` file in `fi-mcp-client`:

```bash
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/your/serviceAccountKey.json
# OR use service account key as JSON string
FIREBASE_SERVICE_ACCOUNT_KEY={"type": "service_account", "project_id": "money-lense", ...}
```

## 5. Frontend Simplification

Your React frontend becomes much simpler:

```javascript
// No Firebase imports needed!
const sendMessage = async () => {
  const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/chat`, {
    message: inputMessage
  });
  // Backend handles all Firebase operations
};

// Get memory data from backend
const getMemoryData = async () => {
  const response = await axios.get(`${API_BASE_URL}/session/${sessionId}/memory`);
  return response.data;
};
```

Would you like me to:
1. **Implement this backend Firebase integration** in your MCP server?
2. **Show you how to get Firebase service account credentials**?
3. **Update your frontend to use the backend API instead**?

This approach is much cleaner and more secure! 🚀
