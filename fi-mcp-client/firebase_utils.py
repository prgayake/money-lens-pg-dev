"""
Firebase utilities for authentication and Firestore operations
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore, auth
from google.cloud.firestore_v1.base_query import FieldFilter

logger = logging.getLogger(__name__)

class FirebaseManager:
    _instance = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseManager, cls).__new__(cls)
            cls._instance._initialize_firebase()
        return cls._instance
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if Firebase is already initialized
            if not firebase_admin._apps:
                service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', './firebase-service-account.json')
                
                if os.path.exists(service_account_path):
                    cred = credentials.Certificate(service_account_path)
                    firebase_admin.initialize_app(cred)
                    logger.info("Firebase initialized with service account file")
                else:
                    # Try to initialize with environment variables
                    service_account_info = {
                        "type": "service_account",
                        "project_id": "money-lense",
                        "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
                        "private_key": os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
                        "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
                        "client_id": os.getenv('FIREBASE_CLIENT_ID'),
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                        "client_x509_cert_url": os.getenv('FIREBASE_CLIENT_X509_CERT_URL'),
                        "universe_domain": "googleapis.com"
                    }
                    cred = credentials.Certificate(service_account_info)
                    firebase_admin.initialize_app(cred)
                    logger.info("Firebase initialized with environment variables")
            
            self._db = firestore.client()
            logger.info("Firestore client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            raise
    
    @property
    def db(self):
        """Get Firestore database instance"""
        if self._db is None:
            self._initialize_firebase()
        return self._db
    
    def verify_token(self, id_token: str) -> Dict[str, Any]:
        """Verify Firebase ID token and return user info"""
        try:
            decoded_token = auth.verify_id_token(id_token)
            return {
                'uid': decoded_token['uid'],
                'email': decoded_token.get('email'),
                'name': decoded_token.get('name'),
                'picture': decoded_token.get('picture'),
                'verified': True
            }
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            return {'verified': False, 'error': str(e)}
    
    def create_user_profile(self, uid: str, user_data: Dict[str, Any]) -> bool:
        """Create or update user profile in Firestore"""
        try:
            user_ref = self.db.collection('users').document(uid)
            
            # Check if user already exists
            user_doc = user_ref.get()
            
            user_profile = {
                'email': user_data.get('email'),
                'name': user_data.get('name'),
                'picture': user_data.get('picture'),
                'updated_at': datetime.utcnow(),
                'last_login': datetime.utcnow()
            }
            
            if not user_doc.exists:
                user_profile['created_at'] = datetime.utcnow()
                user_profile['chat_count'] = 0
            else:
                # Increment chat count if user exists
                existing_data = user_doc.to_dict()
                user_profile['created_at'] = existing_data.get('created_at', datetime.utcnow())
                user_profile['chat_count'] = existing_data.get('chat_count', 0)
            
            user_ref.set(user_profile)
            logger.info(f"User profile created/updated for UID: {uid}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create user profile: {e}")
            return False
    
    def save_chat_message(self, chat_id: str, user_id: str, message_data: Dict[str, Any]) -> bool:
        """Save a chat message to Firestore"""
        try:
            chat_ref = self.db.collection('chats').document(chat_id)
            
            # Check if chat document exists, create if not
            chat_doc = chat_ref.get()
            if not chat_doc.exists:
                chat_ref.set({
                    'user_id': user_id,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow(),
                    'message_count': 0
                })
            
            # Add message to messages subcollection
            message_ref = chat_ref.collection('messages').document()
            message_data.update({
                'timestamp': datetime.utcnow(),
                'chat_id': chat_id,
                'user_id': user_id
            })
            
            message_ref.set(message_data)
            
            # Update chat metadata
            chat_ref.update({
                'updated_at': datetime.utcnow(),
                'message_count': firestore.Increment(1),
                'last_message': message_data.get('content', '')[:100] + '...' if len(message_data.get('content', '')) > 100 else message_data.get('content', '')
            })
            
            logger.info(f"Chat message saved for chat_id: {chat_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save chat message: {e}")
            return False
    
    def get_chat_history(self, chat_id: str, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get chat history for a specific chat"""
        try:
            chat_ref = self.db.collection('chats').document(chat_id)
            
            # Verify chat belongs to user
            chat_doc = chat_ref.get()
            if not chat_doc.exists:
                logger.warning(f"Chat {chat_id} not found")
                return []
            
            chat_data = chat_doc.to_dict()
            if chat_data.get('user_id') != user_id:
                logger.warning(f"Chat {chat_id} does not belong to user {user_id}")
                return []
            
            # Get messages ordered by timestamp
            messages_ref = chat_ref.collection('messages').order_by('timestamp').limit(limit)
            messages = messages_ref.stream()
            
            chat_history = []
            for message in messages:
                message_data = message.to_dict()
                message_data['id'] = message.id
                chat_history.append(message_data)
            
            logger.info(f"Retrieved {len(chat_history)} messages for chat {chat_id}")
            return chat_history
            
        except Exception as e:
            logger.error(f"Failed to get chat history: {e}")
            return []
    
    def get_user_chats(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get all chats for a user"""
        try:
            chats_ref = self.db.collection('chats').where(
                filter=FieldFilter('user_id', '==', user_id)
            ).order_by('updated_at', direction=firestore.Query.DESCENDING).limit(limit)
            
            chats = chats_ref.stream()
            
            user_chats = []
            for chat in chats:
                chat_data = chat.to_dict()
                chat_data['id'] = chat.id
                user_chats.append(chat_data)
            
            logger.info(f"Retrieved {len(user_chats)} chats for user {user_id}")
            return user_chats
            
        except Exception as e:
            logger.error(f"Failed to get user chats: {e}")
            return []
    
    def create_new_chat(self, user_id: str, title: str = "New Chat") -> str:
        """Create a new chat for a user"""
        try:
            chat_ref = self.db.collection('chats').document()
            chat_id = chat_ref.id
            
            chat_data = {
                'user_id': user_id,
                'title': title,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'message_count': 0,
                'last_message': ''
            }
            
            chat_ref.set(chat_data)
            
            # Update user's chat count
            user_ref = self.db.collection('users').document(user_id)
            user_ref.update({
                'chat_count': firestore.Increment(1),
                'updated_at': datetime.utcnow()
            })
            
            logger.info(f"New chat created with ID: {chat_id}")
            return chat_id
            
        except Exception as e:
            logger.error(f"Failed to create new chat: {e}")
            return None
    
    def delete_chat(self, chat_id: str, user_id: str) -> bool:
        """Delete a chat and all its messages"""
        try:
            chat_ref = self.db.collection('chats').document(chat_id)
            
            # Verify chat belongs to user
            chat_doc = chat_ref.get()
            if not chat_doc.exists:
                logger.warning(f"Chat {chat_id} not found")
                return False
            
            chat_data = chat_doc.to_dict()
            if chat_data.get('user_id') != user_id:
                logger.warning(f"Chat {chat_id} does not belong to user {user_id}")
                return False
            
            # Delete all messages in the chat
            messages_ref = chat_ref.collection('messages')
            messages = messages_ref.stream()
            
            for message in messages:
                message.reference.delete()
            
            # Delete the chat document
            chat_ref.delete()
            
            # Update user's chat count
            user_ref = self.db.collection('users').document(user_id)
            user_ref.update({
                'chat_count': firestore.Increment(-1),
                'updated_at': datetime.utcnow()
            })
            
            logger.info(f"Chat {chat_id} deleted successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete chat: {e}")
            return False

# Global instance
firebase_manager = FirebaseManager()
