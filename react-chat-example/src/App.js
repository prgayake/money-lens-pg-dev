// App.js - Main Application Component
import React, { useState, useEffect, useCallback } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
  ExitToApp as LogoutIcon,
} from "@mui/icons-material";
import ChatContainer from "./components/ChatContainer";
import FinancialDashboard from "./components/FinancialDashboard";
import AuthenticationModal from "./components/AuthenticationModal";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8001";

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
    },
    secondary: {
      main: "#dc004e",
      light: "#f06292",
      dark: "#c51162",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    success: {
      main: "#2e7d32",
    },
    error: {
      main: "#d32f2f",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authUrl, setAuthUrl] = useState("");

  const getAuthUrl = useCallback(async (sessionId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/session/${sessionId}/auth-url`
      );
      const { auth_url } = response.data;
      setAuthUrl(auth_url);
    } catch (error) {
      console.error("Failed to get auth URL:", error);
    }
  }, []);

  const createNewSession = useCallback(async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/session/create`);
      const { session_id } = response.data;

      setSessionId(session_id);
      localStorage.setItem("fi_session_id", session_id);

      // Get authentication URL
      await getAuthUrl(session_id);
      setShowAuthModal(true);

      console.log("✅ New session created:", session_id);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  }, [getAuthUrl]);

  const checkSessionStatus = useCallback(
    async (sessionId) => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/session/${sessionId}/status`
        );
        const { authenticated } = response.data;

        setSessionId(sessionId);
        setIsAuthenticated(authenticated);

        if (!authenticated) {
          await getAuthUrl(sessionId);
          setShowAuthModal(true);
        }

        console.log("✅ Session status checked:", { sessionId, authenticated });
      } catch (error) {
        console.error("Failed to check session status:", error);
        await createNewSession();
      }
    },
    [getAuthUrl, createNewSession]
  );

  useEffect(() => {
    const initializeSession = async () => {
      // Check localStorage for existing session
      const savedSessionId = localStorage.getItem("fi_session_id");

      if (savedSessionId) {
        await checkSessionStatus(savedSessionId);
      } else {
        await createNewSession();
      }
    };

    initializeSession();
  }, [checkSessionStatus, createNewSession]);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem("fi_session_id");
    setSessionId(null);
    setIsAuthenticated(false);
    setCurrentTab(0);
    await createNewSession();
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        {/* App Bar */}
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Financial AI Assistant
            </Typography>

            {isAuthenticated && (
              <>
                <Tabs
                  value={currentTab}
                  onChange={handleTabChange}
                  textColor="inherit"
                  indicatorColor="secondary"
                  sx={{ mr: 2 }}
                >
                  <Tab icon={<ChatIcon />} label="Chat" />
                  <Tab icon={<DashboardIcon />} label="Dashboard" />
                </Tabs>

                <Button
                  color="inherit"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ flex: 1, overflow: "hidden" }}>
          {!isAuthenticated ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <Typography variant="h4" gutterBottom>
                Welcome to Financial AI Assistant
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                textAlign="center"
              >
                Please authenticate to access your financial data and start
                chatting with the AI assistant.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => setShowAuthModal(true)}
              >
                Get Started
              </Button>
            </Box>
          ) : (
            <>
              {/* Chat Tab */}
              {currentTab === 0 && (
                <ChatContainer
                  sessionId={sessionId}
                  isAuthenticated={isAuthenticated}
                  onAuthRequired={() => setShowAuthModal(true)}
                />
              )}

              {/* Dashboard Tab */}
              {currentTab === 1 && (
                <FinancialDashboard
                  sessionId={sessionId}
                  apiBaseUrl={API_BASE_URL}
                  isVisible={currentTab === 1}
                />
              )}
            </>
          )}
        </Box>

        {/* Authentication Modal */}
        <AuthenticationModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          sessionId={sessionId}
          authUrl={authUrl}
          onAuthSuccess={handleAuthSuccess}
          apiBaseUrl={API_BASE_URL}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
