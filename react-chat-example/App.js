// App.js - Next-Gen Financial Assistant React App
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import ChatContainer from './components/ChatContainer';

// Enhanced theme for next-gen financial assistant
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
      light: '#8b9cff',
      dark: '#4c63d2',
    },
    secondary: {
      main: '#764ba2',
      light: '#a572d4',
      dark: '#5a3771',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    success: {
      main: '#10b981',
    },
    warning: {
      main: '#f59e0b',
    },
    error: {
      main: '#ef4444',
    },
    info: {
      main: '#06b6d4',
    },
    // Custom colors for workflow types
    workflow: {
      simple: '#3b82f6',
      parallel: '#f59e0b',
      orchestrator: '#8b5cf6',
      chaining: '#10b981',
      routing: '#6366f1',
    },
    // Custom colors for agent states
    agent: {
      ready: '#10b981',
      thinking: '#3b82f6',
      executing: '#f59e0b',
      evaluating: '#8b5cf6',
      responding: '#6366f1',
      error: '#ef4444',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: {
      fontWeight: 700,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      lineHeight: 1.6,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
  },
});

// Extend theme with custom properties
theme.palette.workflow = {
  simple: '#3b82f6',
  parallel: '#f59e0b',
  orchestrator: '#8b5cf6',
  chaining: '#10b981',
  routing: '#6366f1',
};

theme.palette.agent = {
  ready: '#10b981',
  thinking: '#3b82f6',
  executing: '#f59e0b',
  evaluating: '#8b5cf6',
  responding: '#6366f1',
  error: '#ef4444',
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        sx={{ 
          height: '100vh', 
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <ChatContainer />
      </Box>
    </ThemeProvider>
  );
}

export default App;
