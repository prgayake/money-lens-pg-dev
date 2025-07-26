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
  CircularProgress,
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authUrl, setAuthUrl] = useState("");

  const createNewSession = useCallback(async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/session/create`);
      const { session_id } = response.data;

      setSessionId(session_id);
      localStorage.setItem("fi_session_id", session_id);

      console.log("✅ New session created:", session_id);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  }, []);

  useEffect(() => {
    const initializeSession = async () => {
      // Check localStorage for existing session
      const savedSessionId = localStorage.getItem("fi_session_id");

      if (savedSessionId) {
        setSessionId(savedSessionId);
        console.log("✅ Using existing session:", savedSessionId);
      } else {
        await createNewSession();
      }
    };

    initializeSession();
  }, [createNewSession]);

  const handleConnectToFiMoney = (fiMoneyUrl) => {
    setAuthUrl(fiMoneyUrl);
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    localStorage.removeItem("fi_session_id");
    setSessionId(null);
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

            {sessionId && (
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
                  New Session
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ flex: 1, overflow: "hidden" }}>
          {sessionId ? (
            <>
              {/* Chat Tab */}
              {currentTab === 0 && (
                <ChatContainer
                  sessionId={sessionId}
                  onFiMoneyAuthRequired={handleConnectToFiMoney}
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
          ) : (
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
              <CircularProgress />
              <Typography variant="body1" color="text.secondary">
                Setting up your session...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Fi Money Authentication Modal */}
        <AuthenticationModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          sessionId={sessionId}
          authUrl={authUrl}
          onAuthSuccess={() => setShowAuthModal(false)}
          apiBaseUrl={API_BASE_URL}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
