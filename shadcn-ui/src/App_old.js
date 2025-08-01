import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Separator } from "./components/ui/separator";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { ToastProvider } from "./components/ui/toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ChatContainerFirebase from "./components/ChatContainerFirebase";
import ChatHistory from "./components/ChatHistory";
import Login from "./components/Login";
import Header from "./components/Header";
import FinancialDashboard from "./components/FinancialDashboard_new";
import AuthenticationModal from "./components/AuthenticationModal";
import { MessageCircle, BarChart3, User, RefreshCw, History } from "lucide-react";
import axios from "axios";
import "./index.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8001";

function AppContent() {
  const { user, loading: authLoading, currentChatId, setCurrentChatId } = useAuth();
  const [currentTab, setCurrentTab] = useState("chat");
  const [sessionId, setSessionId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authUrl, setAuthUrl] = useState("");
  const [sessionStatus, setSessionStatus] = useState("initializing");

  const createNewSession = useCallback(async () => {
    try {
      setSessionStatus("creating");
      const response = await axios.post(`${API_BASE_URL}/session/create`);
      const { session_id } = response.data;

      setSessionId(session_id);
      localStorage.setItem("fi_session_id", session_id);
      setSessionStatus("ready");

      console.log("✅ New session created:", session_id);
    } catch (error) {
      console.error("Failed to create session:", error);
      setSessionStatus("error");
    }
  }, []);

  useEffect(() => {
    const initializeSession = async () => {
      // Check localStorage for existing session
      const savedSessionId = localStorage.getItem("fi_session_id");

      if (savedSessionId) {
        // Validate that the session still exists on the backend
        try {
          setSessionStatus("initializing");
          const response = await axios.get(`${API_BASE_URL}/session/${savedSessionId}/status`);
          if (response.status === 200) {
            setSessionId(savedSessionId);
            setSessionStatus("ready");
            console.log("✅ Using existing session:", savedSessionId);
            return;
          }
        } catch (error) {
          console.log("❌ Existing session invalid, creating new one:", error.response?.status);
          localStorage.removeItem("fi_session_id");
        }
      }
      
      // Create new session if none exists or existing session is invalid
      await createNewSession();
    };

    if (!authLoading) {
      initializeSession();
    }
  }, [createNewSession, authLoading]);

  const handleConnectToFiMoney = (fiMoneyUrl) => {
    setAuthUrl(fiMoneyUrl);
    setShowAuthModal(true);
  };

  const handleNewSession = async () => {
    localStorage.removeItem("fi_session_id");
    setSessionId(null);
    setCurrentTab("chat");
    setAuthUrl(null);
    setShowAuthModal(false);
    await createNewSession();
  };

  const handleChatSelect = (chatId) => {
    setCurrentChatId(chatId);
    setCurrentTab("chat");
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if user is not authenticated
  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header sessionStatus={sessionStatus} />
      
      <div className="flex h-[calc(100vh-73px)]">
        {/* Chat History Sidebar */}
        <div className="w-80 border-r bg-white p-4">
          <ChatHistory 
            onChatSelect={handleChatSelect}
            currentChatId={currentChatId}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="h-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid w-fit grid-cols-2">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleNewSession}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  New Session
                </Button>
              </div>
            </div>

            <div className="h-[calc(100%-60px)]">
              <TabsContent value="chat" className="h-full m-0">
                {currentChatId ? (
                  <ChatContainerFirebase
                    sessionId={sessionId}
                    currentChatId={currentChatId}
                    onFiMoneyAuthRequired={handleConnectToFiMoney}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <Card className="w-full max-w-md text-center">
                      <CardHeader>
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <CardTitle>Select a Chat</CardTitle>
                        <CardDescription>
                          Choose a chat from the sidebar or create a new one to start a conversation.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="dashboard" className="h-full m-0">
                <FinancialDashboard sessionId={sessionId} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      {showAuthModal && (
        <AuthenticationModal
          authUrl={authUrl}
          onClose={() => {
            setShowAuthModal(false);
            setAuthUrl("");
          }}
          sessionId={sessionId}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
      default: return "Unknown";
    }
  };

  return (
    <ToastProvider>
      <div className="h-screen bg-background flex flex-col">
        {/* Modern Header */}
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="container flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    💰
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold">Money-Lens</h1>
                  <p className="text-sm text-muted-foreground">
                    Next-generation financial intelligence
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant={getStatusBadgeVariant()} className="px-3 py-1">
                {getStatusText()}
              </Badge>
              
              {sessionId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewSession}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  New Session
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {sessionId ? (
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="h-full flex flex-col">
              {/* Tab Navigation */}
              <div className="border-b bg-muted/30">
                <div className="container px-6 py-3">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="chat" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Dashboard
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                <TabsContent value="chat" className="h-full m-0">
                  <ChatContainer
                    sessionId={sessionId}
                    onFiMoneyAuthRequired={handleConnectToFiMoney}
                  />
                </TabsContent>

                <TabsContent value="dashboard" className="h-full m-0">
                  <FinancialDashboard
                    sessionId={sessionId}
                    onRefresh={() => console.log("Refresh financial data")}
                    isLoading={false}
                  />
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            // Loading State
            <div className="h-full flex items-center justify-center">
              <Card className="w-full max-w-md mx-6">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Setting Up Session
                  </CardTitle>
                  <CardDescription>
                    Initializing your Financial AI Assistant...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Status</span>
                      <Badge variant={getStatusBadgeVariant()}>
                        {getStatusText()}
                      </Badge>
                    </div>
                    <Separator />
                    <p className="text-xs text-muted-foreground text-center">
                      This may take a few seconds...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Fi Money Authentication Modal */}
        <AuthenticationModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          sessionId={sessionId}
          authUrl={authUrl}
          onAuthSuccess={() => setShowAuthModal(false)}
        />
      </div>
    </ToastProvider>
  );
}

export default App;
