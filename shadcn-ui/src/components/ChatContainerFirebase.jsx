import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { 
  MessageCircle, 
  Bot, 
  User, 
  Send, 
  Loader2, 
  AlertCircle,
  QrCode,
  TrendingUp,
  Zap,
  History
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8001";

const ChatContainer = ({ sessionId, currentChatId, onFiMoneyAuthRequired }) => {
  const { user, getChatHistory, createNewChat, loginWithGoogle, logout, setCurrentChatId } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [isConnectingToFi, setIsConnectingToFi] = useState(false);
  const [agentState, setAgentState] = useState("ready");
  const [currentWorkflow, setCurrentWorkflow] = useState("simple_response");
  const [fiMoneyConnected, setFiMoneyConnected] = useState(false);
  const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);
  const [sessionMetrics, setSessionMetrics] = useState({
    total_conversations: 0,
    total_tool_calls: 0,
    successful_tool_calls: 0,
  });
  const [pendingMessage, setPendingMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Check Fi Money authentication status
  const checkFiMoneyStatus = useCallback(async () => {
    if (sessionId) {
      try {
        const response = await axios.get(`${API_BASE_URL}/session/${sessionId}/fi-mcp-status`);
        const isConnected = response.data.connected || response.data.connection_status === "connected";
        setFiMoneyConnected(isConnected);
        return isConnected;
      } catch (error) {
        console.error("Error checking Fi Money status:", error);
        setFiMoneyConnected(false);
        return false;
      }
    }
    return false;
  }, [sessionId]);

  // Load conversation context/history from Firebase
  const loadConversationHistory = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setError(null);
      setChatHistoryLoaded(false);
      
      // If user is authenticated and has a current chat, always load from Firebase
      if (user && currentChatId) {
        console.log(`Loading chat history for user ${user.uid}, chat ${currentChatId}`);
        const history = await getChatHistory(currentChatId, 100);
        
        // Convert Firebase messages to chat format
        const chatMessages = history.map(msg => ({
          id: msg.id || msg.message_id,
          type: msg.message_type,
          content: msg.content,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          metadata: msg.metadata || {}
        }));
        
        console.log(`Loaded ${chatMessages.length} messages from Firebase`);
        setMessages(chatMessages);
      } else if (user && !currentChatId) {
        // User is authenticated but no chat selected - show empty state
        console.log('User authenticated but no chat selected');
        setMessages([]);
      } else {
        // User not authenticated - clear messages and don't load session context
        console.log('User not authenticated - clearing messages');
        setMessages([]);
      }
      
      setChatHistoryLoaded(true);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      setChatHistoryLoaded(true); // Set to true even on error to prevent retry loops
    }
  }, [sessionId, user, currentChatId, getChatHistory]);

  // Save message to Firebase
  const saveMessageToFirebase = useCallback(async (message) => {
    if (!user || !currentChatId) {
      console.log('Skipping Firebase save - user or chat not available:', { user: !!user, currentChatId });
      return;
    }
    
    try {
      console.log(`Saving message to Firebase for chat ${currentChatId}`);
      // Save message to Firebase via backend API
      await axios.post(`${API_BASE_URL}/chats/${currentChatId}/messages`, {
        content: message.content,
        message_type: message.type,
        metadata: message.metadata || {},
        timestamp: message.timestamp.toISOString()
      }, {
        headers: {
          'Authorization': `Bearer ${user.idToken}`
        }
      });
      console.log('Message saved to Firebase successfully');
    } catch (error) {
      console.error('Failed to save message to Firebase:', error);
      // Don't throw error to avoid breaking the chat flow
    }
  }, [user, currentChatId]);

  // Auto-create new chat if user is authenticated but no chat exists
  const ensureChatExists = useCallback(async () => {
    if (user && !currentChatId) {
      try {
        const newChatId = await createNewChat("New Financial Chat");
        setCurrentChatId(newChatId);
        return newChatId;
      } catch (error) {
        console.error('Failed to create new chat:', error);
        return null;
      }
    }
    return currentChatId;
  }, [user, currentChatId, createNewChat, setCurrentChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize session and check authentication
  useEffect(() => {
    if (sessionId) {
      // Check Fi Money connection status first
      checkFiMoneyStatus().then(isConnected => {
        if (isConnected) {
          // If authenticated, load conversation history
          loadConversationHistory();
        } else {
          setChatHistoryLoaded(true); // Set to true to show welcome message
        }
      });
      
      // Set up periodic status checking
      const interval = setInterval(checkFiMoneyStatus, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [sessionId, checkFiMoneyStatus, loadConversationHistory]);

  // Reload conversation history when currentChatId changes
  useEffect(() => {
    if (currentChatId && user) {
      setChatHistoryLoaded(false);
      loadConversationHistory();
    } else if (!currentChatId) {
      // Clear messages when no chat is selected
      setMessages([]);
      setChatHistoryLoaded(true);
    }
  }, [currentChatId, user, loadConversationHistory]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [sessionId]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;
    if (!sessionId) {
      setError("No active session. Please refresh the page.");
      return;
    }

    // Ensure chat exists if user is authenticated
    const activeChatId = await ensureChatExists();

    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    setError(null);
    setAgentState("thinking");

    // Save user message to Firebase
    if (user && activeChatId) {
      saveMessageToFirebase(userMessage);
    }

    try {
      const requestData = {
        message: inputMessage.trim(),
        enable_parallel_tools: true,
        max_tool_calls: 10,
        ...(activeChatId && { chat_id: activeChatId }) // Include chat_id for Firebase storage
      };

      const response = await axios.post(
        `${API_BASE_URL}/session/${sessionId}/chat`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(user && { Authorization: `Bearer ${user.idToken}` })
          },
          timeout: 120000
        }
      );

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.data.response,
        timestamp: new Date(),
        metadata: {
          workflow_used: response.data.workflow_used,
          tools_used: response.data.tools_used,
          total_duration: response.data.total_duration,
          agent_state: response.data.agent_state
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setAgentState(response.data.agent_state);
      setCurrentWorkflow(response.data.workflow_used);
      
      // Save assistant message to Firebase
      if (user && activeChatId) {
        saveMessageToFirebase(assistantMessage);
      }
      
      // Update session metrics
      setSessionMetrics(prev => ({
        ...prev,
        total_conversations: prev.total_conversations + 1,
        total_tool_calls: prev.total_tool_calls + (response.data.tools_used?.length || 0),
        successful_tool_calls: prev.successful_tool_calls + (response.data.tools_used?.filter(t => t.success)?.length || 0)
      }));

    } catch (error) {
      console.error("Chat error:", error);
      
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      
      if (error.response?.status === 401) {
        errorMessage = "Your session has expired. Please refresh the page.";
      } else if (error.response?.status === 404) {
        errorMessage = "Session not found. Please refresh the page.";
      } else if (error.response?.status === 423) {
        setIsConnectingToFi(true);
        // Store the current message for retry after authentication
        setPendingMessage(inputMessage.trim());
        
        try {
          const authResponse = await axios.get(`${API_BASE_URL}/session/${sessionId}/auth-url`);
          if (authResponse.data.auth_url) {
            // Open authentication URL in new tab/window
            const authWindow = window.open(authResponse.data.auth_url, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
            
            // Start polling for authentication status
            const pollForAuth = setInterval(async () => {
              try {
                const statusResponse = await axios.get(`${API_BASE_URL}/session/${sessionId}/fi-mcp-status`);
                if (statusResponse.data.connected || statusResponse.data.connection_status === "connected") {
                  clearInterval(pollForAuth);
                  setFiMoneyConnected(true);
                  setIsConnectingToFi(false);
                  
                  if (authWindow && !authWindow.closed) {
                    authWindow.close();
                  }
                  
                  const successMessage = {
                    id: Date.now().toString(),
                    type: "assistant",
                    content: "🎉 **Fi Money Connected Successfully!**\n\nI can now access your financial data. Let me help you with your original request...",
                    timestamp: new Date(),
                    metadata: {}
                  };
                  setMessages(prev => [...prev, successMessage]);
                  
                  // Retry the original request if there was a pending message
                  if (pendingMessage) {
                    setTimeout(async () => {
                      try {
                        const retryRequestData = {
                          message: pendingMessage,
                          enable_parallel_tools: true,
                          max_tool_calls: 10
                        };

                        const retryResponse = await axios.post(
                          `${API_BASE_URL}/session/${sessionId}/chat`,
                          retryRequestData,
                          {
                            headers: {
                              'Content-Type': 'application/json'
                            },
                            timeout: 120000
                          }
                        );

                        const retryAssistantMessage = {
                          id: (Date.now() + 1).toString(),
                          type: "assistant",
                          content: retryResponse.data.response,
                          timestamp: new Date(),
                          metadata: {
                            workflow_used: retryResponse.data.workflow_used,
                            tools_used: retryResponse.data.tools_used,
                            total_duration: retryResponse.data.total_duration,
                            agent_state: retryResponse.data.agent_state
                          }
                        };

                        setMessages(prev => [...prev, retryAssistantMessage]);
                        setPendingMessage(null); // Clear the pending message
                      } catch (retryError) {
                        console.error("Failed to retry original request:", retryError);
                        const retryErrorMessage = {
                          id: (Date.now() + 1).toString(),
                          type: "error",
                          content: "Failed to process your original request. Please try asking again.",
                          timestamp: new Date(),
                        };
                        setMessages(prev => [...prev, retryErrorMessage]);
                        setPendingMessage(null);
                      }
                    }, 1000);
                  }
                }
              } catch (pollError) {
                console.error("Error checking Fi Money status:", pollError);
              }
            }, 2000); // Poll every 2 seconds
            
            // Stop polling after 5 minutes
            setTimeout(() => {
              clearInterval(pollForAuth);
              if (isConnectingToFi) {
                setIsConnectingToFi(false);
                setPendingMessage(null);
                setError("Authentication timeout. Please try connecting again.");
              }
            }, 300000); // 5 minutes
            
            errorMessage = "Please complete the Fi Money authentication in the new tab to access your financial data.";
          }
        } catch (authError) {
          console.error("Auth URL fetch error:", authError);
        }
        setIsConnectingToFi(false);
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. The analysis is taking longer than expected. Please try again.";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      setError(errorMessage);
      
      const errorMessageObj = {
        id: (Date.now() + 1).toString(),
        type: "error",
        content: errorMessage,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsTyping(false);
      setAgentState("ready");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message) => {
    const isUser = message.type === "user";
    const isError = message.type === "error";

    return (
      <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
        <div className={`flex max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"} items-start gap-3`}>
          <Avatar className={`w-8 h-8 ${isUser ? "bg-blue-500" : isError ? "bg-red-500" : "bg-green-500"}`}>
            <AvatarFallback className="text-white">
              {isUser ? <User className="w-4 h-4" /> : isError ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>
          
          <div className={`rounded-lg p-3 ${
            isUser 
              ? "bg-blue-500 text-white" 
              : isError 
                ? "bg-red-50 border border-red-200" 
                : "bg-gray-50 border"
          }`}>
            <div className="prose-sm prose max-w-none">
              {isError ? (
                <p className="m-0 text-red-700">{message.content}</p>
              ) : (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  className={isUser ? "text-white" : "text-gray-800"}
                  components={{
                    p: ({children}) => <p className="m-0 mb-2 last:mb-0">{children}</p>,
                    ul: ({children}) => <ul className="pl-4 m-0 mb-2 last:mb-0">{children}</ul>,
                    ol: ({children}) => <ol className="pl-4 m-0 mb-2 last:mb-0">{children}</ol>,
                    li: ({children}) => <li className="mb-1">{children}</li>,
                    h1: ({children}) => <h1 className="m-0 mb-2 text-lg font-bold">{children}</h1>,
                    h2: ({children}) => <h2 className="m-0 mb-2 text-base font-bold">{children}</h2>,
                    h3: ({children}) => <h3 className="m-0 mb-1 text-sm font-bold">{children}</h3>,
                    strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                    code: ({children}) => <code className={`px-1 py-0.5 rounded text-xs ${isUser ? 'bg-blue-400' : 'bg-gray-200'}`}>{children}</code>,
                    table: ({children}) => <table className="min-w-full my-2 border border-collapse border-gray-300">{children}</table>,
                    th: ({children}) => <th className="px-2 py-1 font-semibold text-left bg-gray-100 border border-gray-300">{children}</th>,
                    td: ({children}) => <td className="px-2 py-1 border border-gray-300">{children}</td>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-opacity-20">
              <span className={`text-xs ${isUser ? "text-blue-100" : "text-gray-500"}`}>
                {message.timestamp?.toLocaleTimeString?.([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) || new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
              
              {message.metadata?.tools_used?.length > 0 && (
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-gray-500">
                    {message.metadata.tools_used.length} tools used
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Financial AI Assistant</CardTitle>
              <CardDescription>
                {fiMoneyConnected ? (
                  <>Connected to Fi Money - Full access to your financial data</>
                ) : (
                  <>Connect to Fi Money for personalized financial insights</>
                )}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Firebase Auth Status */}
            {user ? (
              <div className="flex items-center gap-2 px-3 py-1 border border-green-200 rounded-md bg-green-50">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-700">Chat Saved</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="h-6 px-2 text-xs text-green-700 hover:text-green-800"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={loginWithGoogle}
                className="h-8 px-3 text-xs"
              >
                <User className="w-3 h-3 mr-1" />
                Save Chats
              </Button>
            )}
            
            <Badge variant={agentState === "ready" ? "success" : "secondary"} className="text-xs">
              {agentState}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {currentWorkflow.replace("_", " ")}
            </Badge>
            
            {/* Fi Money Connection Status */}
            <Badge 
              variant="outline" 
              className={`text-xs ${
                fiMoneyConnected 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mr-1 ${
                fiMoneyConnected ? 'bg-green-500' : 'bg-orange-500'
              }`}></div>
              {fiMoneyConnected ? 'Fi Connected' : 'Fi Disconnected'}
            </Badge>
          </div>
        </div>
        
        {user && currentChatId && chatHistoryLoaded && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <History className="w-4 h-4" />
            <span>Chat history loaded - {messages.length} messages</span>
            {fiMoneyConnected && (
              <>
                <span className="mx-2">•</span>
                <span>Fi Money connected</span>
              </>
            )}
          </div>
        )}
        
        <Separator />
      </CardHeader>      <CardContent className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 mb-4 space-y-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="space-y-6 text-center">
                <div>
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">
                    {user ? `Welcome back, ${user.displayName?.split(' ')[0] || 'User'}!` : 'Welcome to Money Lens AI'}
                  </p>
                  <p className="text-sm">
                    {user 
                      ? 'Your chat history is saved and ready. Ask me anything about your finances!'
                      : 'Ask me anything about your finances, investments, or market trends.'
                    }
                  </p>
                  {!fiMoneyConnected && (
                    <p className="mt-2 text-xs text-blue-600">Connect to Fi Money for personalized insights</p>
                  )}
                </div>
                
                {/* Fi Money Authentication Section */}
                {!fiMoneyConnected && (
                  <div className="max-w-md p-6 mx-auto border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <QrCode className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-blue-900">Connect to Fi Money</h3>
                        <p className="text-sm text-blue-700">Access your real financial data</p>
                      </div>
                    </div>
                    
                    <div className="mb-4 space-y-3 text-sm text-blue-800">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>Live portfolio tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span>Real-time transaction analysis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>Credit score monitoring</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={async () => {
                        try {
                          setIsConnectingToFi(true);
                          const response = await axios.get(`${API_BASE_URL}/session/${sessionId}/auth-url`);
                          if (response.data.auth_url) {
                            // Open authentication URL in new tab/window
                            const authWindow = window.open(response.data.auth_url, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
                            
                            // Start polling for authentication status
                            const pollForAuth = setInterval(async () => {
                              try {
                                const statusResponse = await axios.get(`${API_BASE_URL}/session/${sessionId}/fi-mcp-status`);
                                if (statusResponse.data.connected || statusResponse.data.connection_status === "connected") {
                                  clearInterval(pollForAuth);
                                  setFiMoneyConnected(true);
                                  setIsConnectingToFi(false);
                                  if (authWindow && !authWindow.closed) {
                                    authWindow.close();
                                  }
                                  
                                  // Load conversation history after successful authentication
                                  loadConversationHistory();
                                  
                                  setMessages(prev => [...prev, {
                                    id: Date.now().toString(),
                                    type: "assistant",
                                    content: "🎉 **Fi Money Connected Successfully!**\n\nYou can now ask questions about your financial data, such as:\n- What's my net worth?\n- Show my recent transactions\n- Analyze my investment portfolio\n- Check my credit score",
                                    timestamp: new Date(),
                                    metadata: {}
                                  }]);
                                }
                              } catch (pollError) {
                                console.error("Error checking Fi Money status:", pollError);
                              }
                            }, 2000); // Poll every 2 seconds
                            
                            // Stop polling after 5 minutes
                            setTimeout(() => {
                              clearInterval(pollForAuth);
                              if (isConnectingToFi) {
                                setIsConnectingToFi(false);
                                setError("Authentication timeout. Please try connecting again.");
                              }
                            }, 300000); // 5 minutes
                          }
                        } catch (error) {
                          console.error("Failed to get Fi Money auth URL:", error);
                          setError("Failed to initialize Fi Money connection");
                          setIsConnectingToFi(false);
                        }
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={!sessionId || isConnectingToFi}
                    >
                      {isConnectingToFi ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4 mr-2" />
                          Connect Fi Money Account
                        </>
                      )}
                    </Button>
                    
                    <p className="mt-2 text-xs text-blue-600">
                      Secure connection via Fi Money's official API
                    </p>
                  </div>
                )}
                
                {/* Connected Fi Money Status */}
                {fiMoneyConnected && (
                  <div className="max-w-md p-4 mx-auto border border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-green-900">Fi Money Connected</h3>
                        <p className="text-sm text-green-700">Ready to access your financial data</p>
                      </div>
                    </div>
                    <p className="text-xs text-green-600">
                      You can now ask questions about your portfolio, transactions, and more!
                    </p>
                  </div>
                )}
                
                {/* Demo Features Section */}
                <div className="max-w-md p-4 mx-auto border rounded-lg bg-gray-50">
                  <h4 className="mb-3 font-medium text-gray-800">Try these examples:</h4>
                  <div className="space-y-2 text-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start w-full h-auto py-2 text-left"
                      onClick={() => setInputMessage("What are the top performing stocks this week?")}
                    >
                      "What are the top performing stocks this week?"
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start w-full h-auto py-2 text-left"
                      onClick={() => setInputMessage("Explain mutual fund SIPs")}
                    >
                      "Explain mutual fund SIPs"
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start w-full h-auto py-2 text-left"
                      onClick={() => setInputMessage("How to plan for retirement?")}
                    >
                      "How to plan for retirement?"
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 bg-green-500">
                  <AvatarFallback className="text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600">
                      {agentState === "thinking" ? "Thinking..." : 
                       agentState === "executing_tools" ? "Analyzing data..." : 
                       "Processing..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="pt-4 border-t">
          {/* Quick Fi Money Actions */}
          {fiMoneyConnected && (
            <div className="flex flex-wrap gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputMessage("Show my net worth analysis")}
                className="px-2 text-xs h-7"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Net Worth
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputMessage("Analyze my recent transactions")}
                className="px-2 text-xs h-7"
              >
                <History className="w-3 h-3 mr-1" />
                Transactions
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputMessage("Show my credit report")}
                className="px-2 text-xs h-7"
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                Credit Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputMessage("Review my investment portfolio")}
                className="px-2 text-xs h-7"
              >
                <Zap className="w-3 h-3 mr-1" />
                Portfolio
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isTyping 
                  ? "AI is thinking..." 
                  : fiMoneyConnected 
                    ? "Ask about your finances, investments, or market trends..."
                    : "Connect to Fi Money first, or ask general financial questions..."
              }
              disabled={isTyping || !sessionId}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping || !sessionId}
              size="icon"
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {error && (
            <div className="p-2 mt-2 text-sm text-red-700 border border-red-200 rounded bg-red-50">
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>
              Session: {sessionId ? sessionId.slice(0, 8) + "..." : "Not connected"}
            </span>
            <span>
              {sessionMetrics.total_conversations} conversations, {sessionMetrics.total_tool_calls} tools used
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatContainer;
