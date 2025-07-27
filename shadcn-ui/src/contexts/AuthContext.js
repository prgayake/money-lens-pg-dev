import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider } from "../firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8001";

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get the ID token and authenticate with backend
          const idToken = await firebaseUser.getIdToken();

          // Store token for API requests
          localStorage.setItem("firebase_token", idToken);

          // Configure axios default header
          axios.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;

          // Login to backend
          const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            id_token: idToken,
          });

          if (response.data.success) {
            const userData = {
              uid: response.data.user_id,
              email: response.data.email,
              displayName: response.data.name,
              photoURL: response.data.picture,
              idToken: idToken,
            };

            setUser(userData);

            // Load user's most recent chat or create a new one
            try {
              const chatsResponse = await axios.get(`${API_BASE_URL}/chats`);
              if (
                chatsResponse.data.chats &&
                chatsResponse.data.chats.length > 0
              ) {
                // Set the most recent chat as current
                const mostRecentChat = chatsResponse.data.chats[0];
                setCurrentChatId(mostRecentChat.id);
              } else {
                // Create a new chat if user has no chats
                const createResponse = await axios.post(
                  `${API_BASE_URL}/chats/create`,
                  {
                    title: "Welcome to Money Lens AI",
                  }
                );
                if (createResponse.data.success) {
                  setCurrentChatId(createResponse.data.chat_id);
                }
              }
            } catch (chatError) {
              console.error("Failed to load/create user chats:", chatError);
              // Don't fail the login process if chat loading fails
            }
          }
        } else {
          // User is signed out
          setUser(null);
          setCurrentChatId(null);
          localStorage.removeItem("firebase_token");
          delete axios.defaults.headers.common["Authorization"];
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);

      // The auth state listener will handle the backend authentication
      console.log("Google login successful:", result.user.email);
    } catch (error) {
      console.error("Google login error:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);

      // Logout from backend if user is authenticated
      if (user) {
        try {
          await axios.post(`${API_BASE_URL}/auth/logout`);
        } catch (error) {
          console.error("Backend logout error:", error);
        }
      }

      // Sign out from Firebase
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      setError(error.message);
    }
  };

  const createNewChat = async (title = "New Chat") => {
    try {
      if (!user) throw new Error("User not authenticated");

      const response = await axios.post(`${API_BASE_URL}/chats/create`, {
        title: title,
      });

      if (response.data.success) {
        setCurrentChatId(response.data.chat_id);
        return response.data.chat_id;
      }

      throw new Error("Failed to create chat");
    } catch (error) {
      console.error("Create chat error:", error);
      setError(error.message);
      return null;
    }
  };

  const getUserChats = async () => {
    try {
      if (!user) throw new Error("User not authenticated");

      const response = await axios.get(`${API_BASE_URL}/chats`);
      return response.data.chats;
    } catch (error) {
      console.error("Get chats error:", error);
      setError(error.message);
      return [];
    }
  };

  const getChatHistory = async (chatId, limit = 50) => {
    try {
      if (!user) throw new Error("User not authenticated");

      const response = await axios.get(
        `${API_BASE_URL}/chats/${chatId}/messages?limit=${limit}`
      );
      return response.data.messages;
    } catch (error) {
      console.error("Get chat history error:", error);
      setError(error.message);
      return [];
    }
  };

  const deleteChat = async (chatId) => {
    try {
      if (!user) throw new Error("User not authenticated");

      const response = await axios.delete(`${API_BASE_URL}/chats/${chatId}`);

      if (response.data.success && currentChatId === chatId) {
        setCurrentChatId(null);
      }

      return response.data.success;
    } catch (error) {
      console.error("Delete chat error:", error);
      setError(error.message);
      return false;
    }
  };

  const value = {
    user,
    loading,
    error,
    currentChatId,
    setCurrentChatId,
    loginWithGoogle,
    logout,
    createNewChat,
    getUserChats,
    getChatHistory,
    deleteChat,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
