"""
Firebase Memory Manager for MCP Financial Assistant
Handles persistent memory storage for user conversations and AI learning
"""

import firebase_admin
from firebase_admin import credentials, firestore
import os
from datetime import datetime
import json
import logging
import hashlib
from typing import Dict, Any, Optional, List
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

class FirebaseMemoryManager:
    def __init__(self):
        self.db = None
        self.initialized = False
        self.executor = ThreadPoolExecutor(max_workers=4)
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase with service account key"""
        try:
            # Check if Firebase is already initialized
            if firebase_admin._apps:
                self.db = firestore.client()
                self.initialized = True
                logger.info("Firebase already initialized (using default database)")
                return
            
            # Option 1: Use service account key file
            service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
            if service_account_path and os.path.exists(service_account_path):
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized with service account file")
                self.db = firestore.client()
                self.initialized = True
                logger.info("Firestore client initialized with default database (service account file)")
                return
            
            # Option 2: Use service account key from environment
            elif os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY'):
                service_account_info = json.loads(os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY'))
                cred = credentials.Certificate(service_account_info)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized with service account key from env")
                self.db = firestore.client()
                self.initialized = True
                logger.info("Firestore client initialized with default database (service account env)")
                return
            
            # Option 3: Use default credentials (for Google Cloud deployment)
            else:
                try:
                    cred = credentials.ApplicationDefault()
                    firebase_admin.initialize_app(cred)
                    logger.info("Firebase initialized with default credentials")
                    self.db = firestore.client()
                    self.initialized = True
                    logger.info("Firebase Memory Manager initialized successfully (using default database)")
                    return
                except Exception as e:
                    logger.warning(f"Default credentials failed: {e}")
                    logger.warning("Firebase memory features disabled - no credentials found")
                    return
            
        except Exception as e:
            logger.error(f"Firebase initialization failed: {e}")
            self.initialized = False
    
    def _run_sync(self, coro):
        """Run async code in sync context"""
        return asyncio.run_coroutine_threadsafe(coro, asyncio.get_event_loop()).result()
    
    async def create_user(self, user_id: str, user_data: dict) -> Optional[dict]:
        """Create or update user profile"""
        if not self.initialized:
            return None
        
        try:
            def _create_user():
                user_ref = self.db.collection('users').document(user_id)
                user_data['created_at'] = datetime.now()
                user_data['last_updated'] = datetime.now()
                user_ref.set(user_data, merge=True)
                return user_data
            
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(self.executor, _create_user)
        except Exception as e:
            logger.error(f"Failed to create user: {e}")
            return None
    
    async def save_message(self, session_id: str, message_data: dict) -> Optional[dict]:
        """Save chat message to Firebase"""
        if not self.initialized:
            return None
        
        try:
            def _save_message():
                message_ref = self.db.collection('messages').document()
                message_data.update({
                    'session_id': session_id,
                    'timestamp': datetime.now(),
                    'id': message_ref.id
                })
                message_ref.set(message_data)
                return message_data
            
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(self.executor, _save_message)
        except Exception as e:
            logger.error(f"Failed to save message: {e}")
            return None
    
    async def get_conversation_history(self, session_id: str, limit: int = 50) -> List[dict]:
        """Get conversation history for a session"""
        if not self.initialized:
            return []
        
        try:
            def _get_history():
                messages_ref = self.db.collection('messages')
                query = messages_ref.where('session_id', '==', session_id)\
                                  .order_by('timestamp', direction=firestore.Query.DESCENDING)\
                                  .limit(limit)
                
                docs = query.stream()
                messages = []
                for doc in docs:
                    message_data = doc.to_dict()
                    # Convert Firestore timestamp to datetime
                    if 'timestamp' in message_data:
                        message_data['timestamp'] = message_data['timestamp']
                    messages.append(message_data)
                
                return list(reversed(messages))  # Return in chronological order
            
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(self.executor, _get_history)
        except Exception as e:
            logger.error(f"Failed to get conversation history: {e}")
            return []
    
    async def update_user_memory(self, user_id: str, memory_data: dict) -> Optional[dict]:
        """Update user's AI memory with enhanced error logging"""
        if not self.initialized:
            logger.error(f"[update_user_memory] Not initialized. user_id={user_id}, memory_data={memory_data}")
            return None

        try:
            def _update_memory():
                try:
                    memory_ref = self.db.collection('user_memory').document(user_id)
                    logger.info(f"[update_user_memory] Updating user_id={user_id} with memory_data={memory_data}")

                    # Get existing memory
                    existing_memory = memory_ref.get()
                    if existing_memory.exists:
                        current_memory = existing_memory.to_dict()
                    else:
                        current_memory = {
                            'working_memory': {},
                            'episodic_memory': {'interaction_count': 0, 'topics': [], 'successful_tools': []},
                            'semantic_memory': {'preferences': {}, 'successful_patterns': [], 'financial_goals': []}
                        }

                    # Update memory sections
                    if 'working_memory' in memory_data:
                        logger.info(f"[update_user_memory] Updating working_memory: {memory_data['working_memory']}")
                        current_memory['working_memory'].update(memory_data['working_memory'])

                    if 'episodic_memory' in memory_data:
                        logger.info(f"[update_user_memory] Updating episodic_memory: {memory_data['episodic_memory']}")
                        current_memory['episodic_memory']['interaction_count'] += 1
                        if 'topics' in memory_data['episodic_memory']:
                            # Add new topics, avoid duplicates
                            existing_topics = set(current_memory['episodic_memory'].get('topics', []))
                            new_topics = set(memory_data['episodic_memory']['topics'])
                            current_memory['episodic_memory']['topics'] = list(existing_topics.union(new_topics))

                        if 'successful_tools' in memory_data['episodic_memory']:
                            current_memory['episodic_memory']['successful_tools'].extend(
                                memory_data['episodic_memory']['successful_tools']
                            )

                    if 'semantic_memory' in memory_data:
                        logger.info(f"[update_user_memory] Updating semantic_memory: {memory_data['semantic_memory']}")
                        if 'preferences' in memory_data['semantic_memory']:
                            current_memory['semantic_memory']['preferences'].update(
                                memory_data['semantic_memory']['preferences']
                            )
                        if 'successful_patterns' in memory_data['semantic_memory']:
                            current_memory['semantic_memory']['successful_patterns'].extend(
                                memory_data['semantic_memory']['successful_patterns']
                            )
                        if 'financial_goals' in memory_data['semantic_memory']:
                            current_memory['semantic_memory']['financial_goals'].extend(
                                memory_data['semantic_memory']['financial_goals']
                            )

                    current_memory['last_updated'] = datetime.now()
                    memory_ref.set(current_memory)
                    logger.info(f"[update_user_memory] Successfully updated user_id={user_id}")
                    return current_memory
                except Exception as inner_e:
                    logger.error(f"[update_user_memory] Firestore error for user_id={user_id}: {inner_e}")
                    raise

            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(self.executor, _update_memory)
        except Exception as e:
            logger.error(f"[update_user_memory] Failed to update user memory for user_id={user_id}: {e}. memory_data={memory_data}")
            return None
    
    async def get_user_memory(self, user_id: str) -> Optional[dict]:
        """Get user's AI memory"""
        if not self.initialized:
            return None
        
        try:
            def _get_memory():
                memory_ref = self.db.collection('user_memory').document(user_id)
                memory_doc = memory_ref.get()
                
                if memory_doc.exists:
                    return memory_doc.to_dict()
                else:
                    # Initialize empty memory
                    empty_memory = {
                        'working_memory': {},
                        'episodic_memory': {'interaction_count': 0, 'topics': [], 'successful_tools': []},
                        'semantic_memory': {'preferences': {}, 'successful_patterns': [], 'financial_goals': []},
                        'created_at': datetime.now(),
                        'last_updated': datetime.now()
                    }
                    memory_ref.set(empty_memory)
                    return empty_memory
            
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(self.executor, _get_memory)
        except Exception as e:
            logger.error(f"Failed to get user memory: {e}")
            return None

    async def create_session(self, session_id: str, session_data: dict) -> Optional[dict]:
        """Create session record"""
        if not self.initialized:
            return None
        
        try:
            def _create_session():
                session_ref = self.db.collection('sessions').document(session_id)
                session_data.update({
                    'created_at': datetime.now(),
                    'last_updated': datetime.now()
                })
                session_ref.set(session_data)
                return session_data
            
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(self.executor, _create_session)
        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            return None

def get_user_id_from_session(session_id: str) -> str:
    """Generate consistent user ID from session"""
    return hashlib.md5(session_id.encode()).hexdigest()

def extract_topics(message: str, tools_used: List[str] = None) -> List[str]:
    """Extract financial topics from message"""
    financial_keywords = [
        'investment', 'savings', 'budget', 'loan', 'credit', 'debt',
        'stocks', 'bonds', 'mutual funds', 'insurance', 'tax', 'retirement',
        'portfolio', 'trading', 'analysis', 'dividend', 'growth', 'value',
        'bank', 'account', 'transaction', 'balance', 'income', 'expense'
    ]
    
    topics = []
    message_lower = message.lower()
    
    # Extract from message content
    for keyword in financial_keywords:
        if keyword in message_lower:
            topics.append(keyword)
    
    # Extract from tools used
    if tools_used:
        for tool in tools_used:
            if 'stock' in tool.lower():
                topics.append('stocks')
            elif 'mutual' in tool.lower() or 'fund' in tool.lower():
                topics.append('mutual funds')
            elif 'search' in tool.lower():
                topics.append('research')
    
    return list(set(topics))  # Remove duplicates

def analyze_successful_patterns(tools_used: List[dict], response_quality: float = 1.0) -> List[str]:
    """Analyze successful interaction patterns"""
    patterns = []
    
    if tools_used and response_quality > 0.7:
        tool_names = [tool.get('name', '') for tool in tools_used if tool.get('success', False)]
        
        if len(tool_names) > 1:
            patterns.append(f"multi_tool_success: {' + '.join(tool_names)}")
        elif len(tool_names) == 1:
            patterns.append(f"single_tool_success: {tool_names[0]}")
    
    return patterns

# Global instance
firebase_memory = FirebaseMemoryManager()
