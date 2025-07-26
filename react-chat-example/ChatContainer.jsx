// ChatContainer.jsx - Next-Gen Financial Assistant Chat Interface
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  Grid,
  LinearProgress,
  Tooltip,
  Badge,
  Stack,
  Fade,
  Collapse,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Refresh as RefreshIcon,
  QrCode as QrCodeIcon,
  Assessment as AssessmentIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  AccountTree as WorkflowIcon,
  Memory as MemoryIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Public as WebIcon,
  BarChart as PortfolioIcon,
  Bolt as BoltIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import axios from 'axios';

// Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';

// Workflow type configurations
const WORKFLOW_TYPES = {
  simple_response: {
    name: 'Simple Response',
    icon: BotIcon,
    color: '#3b82f6',
    description: 'Direct AI response for straightforward queries'
  },
  parallelization: {
    name: 'Parallel Execution',
    icon: BoltIcon,
    color: '#f59e0b',
    description: 'Multiple tools running simultaneously'
  },
  orchestrator_workers: {
    name: 'Orchestrator-Workers',
    icon: PsychologyIcon,
    color: '#8b5cf6',
    description: 'Multi-step analysis with dynamic coordination'
  },
  prompt_chaining: {
    name: 'Prompt Chaining',
    icon: TimelineIcon,
    color: '#10b981',
    description: 'Sequential dependent tasks with context building'
  },
  routing: {
    name: 'Intelligent Routing',
    icon: WorkflowIcon,
    color: '#6366f1',
    description: 'Smart capability selection and routing'
  }
};

// Agent state configurations
const AGENT_STATES = {
  ready: { name: 'Ready', color: '#10b981', icon: CheckIcon },
  thinking: { name: 'Thinking', color: '#3b82f6', icon: PsychologyIcon },
  executing_tools: { name: 'Executing Tools', color: '#f59e0b', icon: BoltIcon },
  evaluating: { name: 'Evaluating', color: '#8b5cf6', icon: AssessmentIcon },
  responding: { name: 'Responding', color: '#6366f1', icon: BotIcon },
  error: { name: 'Error', color: '#ef4444', icon: ErrorIcon }
};

// Tool category configurations
const TOOL_CATEGORIES = {
  financial_data: { name: 'Financial Data', icon: MoneyIcon, color: '#10b981' },
  market_analysis: { name: 'Market Analysis', icon: TrendingUpIcon, color: '#3b82f6' },
  web_search: { name: 'Web Search', icon: WebIcon, color: '#f59e0b' },
  portfolio_analysis: { name: 'Portfolio Analysis', icon: PortfolioIcon, color: '#8b5cf6' }
};

// Example queries for different workflows
const EXAMPLE_QUERIES = [
  {
    text: "What is my current net worth?",
    workflow: "simple_response",
    category: "Financial Data"
  },
  {
    text: "Compare Apple, Microsoft, and Google stock performance",
    workflow: "parallelization",
    category: "Market Analysis"
  },
  {
    text: "Analyze my complete financial portfolio and provide optimization recommendations",
    workflow: "orchestrator_workers",
    category: "Complex Analysis"
  },
  {
    text: "What are the latest market trends affecting tech stocks?",
    workflow: "prompt_chaining",
    category: "Market Research"
  },
  {
    text: "Create a diversified investment strategy based on my risk profile",
    workflow: "orchestrator_workers",
    category: "Investment Strategy"
  }
];

// Message component for displaying individual messages
const MessageBubble = ({ message, isUser }) => {
  const [showTools, setShowTools] = useState(false);
  
  return (
    <ListItem
      sx={{
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 2,
        mb: 2,
      }}
    >
      <Avatar
        sx={{
          bgcolor: isUser ? 'primary.main' : 'success.main',
          width: 40,
          height: 40,
        }}
      >
        {isUser ? <PersonIcon /> : <BotIcon />}
      </Avatar>
      
      <Box sx={{ maxWidth: '70%', minWidth: '200px' }}>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            bgcolor: isUser ? 'primary.main' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          }}
        >
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
          
          {/* Workflow badge for assistant messages */}
          {!isUser && message.metadata?.workflow && (
            <Box sx={{ mt: 1 }}>
              <Chip
                size="small"
                icon={React.createElement(WORKFLOW_TYPES[message.metadata.workflow]?.icon || BotIcon)}
                label={WORKFLOW_TYPES[message.metadata.workflow]?.name || message.metadata.workflow}
                sx={{
                  bgcolor: WORKFLOW_TYPES[message.metadata.workflow]?.color || '#6366f1',
                  color: 'white',
                  fontSize: '0.75rem',
                }}
              />
            </Box>
          )}
          
          {/* Tool execution details */}
          {!isUser && message.metadata?.tools && message.metadata.tools.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                onClick={() => setShowTools(!showTools)}
                startIcon={showTools ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ fontSize: '0.75rem', p: 0.5 }}
              >
                {message.metadata.tools.length} Tools Used
              </Button>
              
              <Collapse in={showTools}>
                <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                  {message.metadata.tools.map((tool, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip
                        size="small"
                        icon={React.createElement(TOOL_CATEGORIES[tool.category]?.icon || WebIcon)}
                        label={tool.tool_name}
                        sx={{
                          bgcolor: TOOL_CATEGORIES[tool.category]?.color || '#6b7280',
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20,
                        }}
                      />
                      {tool.success ? <CheckIcon sx={{ color: 'success.main', fontSize: 16 }} /> : <ErrorIcon sx={{ color: 'error.main', fontSize: 16 }} />}
                      <Typography variant="caption">
                        {tool.duration.toFixed(2)}s
                      </Typography>
                      {message.metadata.executionSummary?.parallel_groups > 0 && (
                        <Chip
                          size="small"
                          label="⚡ Parallel"
                          sx={{ fontSize: '0.6rem', height: 18, bgcolor: 'warning.light' }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Box>
          )}
        </Paper>
        
        {/* Timestamp */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            mt: 0.5,
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </Typography>
      </Box>
    </ListItem>
  );
};

// Agent status component
const AgentStatusCard = ({ agentState, currentWorkflow, sessionMetrics }) => {
  const stateConfig = AGENT_STATES[agentState] || AGENT_STATES.ready;
  const workflowConfig = WORKFLOW_TYPES[currentWorkflow];
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PsychologyIcon color="primary" />
          Agent Status
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Badge
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: stateConfig.color,
                animation: agentState === 'thinking' || agentState === 'executing_tools' ? 'pulse 2s infinite' : 'none',
              },
            }}
          >
            {React.createElement(stateConfig.icon, { sx: { color: stateConfig.color } })}
          </Badge>
          <Typography variant="body2" fontWeight={600}>
            {stateConfig.name}
          </Typography>
        </Box>
        
        {currentWorkflow && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <WorkflowIcon sx={{ color: workflowConfig?.color || 'text.secondary', fontSize: 20 }} />
            <Typography variant="body2">
              {workflowConfig?.name || currentWorkflow}
            </Typography>
          </Box>
        )}
        
        <Divider sx={{ my: 1 }} />
        
        {sessionMetrics && (
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">Conversations:</Typography>
              <Typography variant="caption" fontWeight={600}>{sessionMetrics.total_conversations}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">Tool Calls:</Typography>
              <Typography variant="caption" fontWeight={600}>{sessionMetrics.total_tool_calls}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">Success Rate:</Typography>
              <Typography variant="caption" fontWeight={600}>
                {sessionMetrics.total_tool_calls > 0 
                  ? `${((sessionMetrics.successful_tool_calls / sessionMetrics.total_tool_calls) * 100).toFixed(1)}%`
                  : '-'
                }
              </Typography>
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

// Example queries component
const ExampleQueriesCard = ({ onQuerySelect }) => {
  return (
    <Card>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SpeedIcon color="primary" />
          Try These Examples
        </Typography>
        
        <Stack spacing={1}>
          {EXAMPLE_QUERIES.map((query, index) => (
            <Button
              key={index}
              variant="outlined"
              size="small"
              onClick={() => onQuerySelect(query.text)}
              sx={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                fontSize: '0.8rem',
                p: 1,
                borderColor: WORKFLOW_TYPES[query.workflow]?.color,
                color: WORKFLOW_TYPES[query.workflow]?.color,
                '&:hover': {
                  bgcolor: `${WORKFLOW_TYPES[query.workflow]?.color}15`,
                },
              }}
            >
              <Box>
                <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
                  {query.category} ({WORKFLOW_TYPES[query.workflow]?.name})
                </Typography>
                {query.text}
              </Box>
            </Button>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

const ChatContainer = () => {
  // State management for session and authentication
  const [sessionId, setSessionId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [error, setError] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  
  // Next-gen agent state
  const [agentState, setAgentState] = useState('ready');
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [sessionMetrics, setSessionMetrics] = useState(null);
  const [conversationTurn, setConversationTurn] = useState(0);
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize session on component mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Auto-refresh session status
  useEffect(() => {
    if (sessionId) {
      const interval = setInterval(() => {
        checkSessionStatus(sessionId);
      }, 10000); // Check every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  // Initialize session
  const initializeSession = async () => {
    setSessionLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/session/create`);
      const { session_id } = response.data;
      
      setSessionId(session_id);
      localStorage.setItem('fi_session_id', session_id);
      
      // Add welcome message
      const welcomeMessage = {
        content: `Welcome to the Next-Generation Financial Assistant! 🚀

I'm powered by advanced agent orchestration with:

✨ **Parallel Tool Execution** for faster analysis
🧠 **Intelligent Workflow Routing** based on your query  
📊 **Advanced Context Management** for personalized advice
🔄 **Multi-step Reasoning** for complex financial tasks

Try asking about your portfolio, market analysis, or financial planning!`,
        isUser: false,
        timestamp: Date.now(),
        metadata: {
          workflow: 'simple_response'
        }
      };
      
      setMessages([welcomeMessage]);
      
      // Check authentication and get status
      await checkSessionStatus(session_id);
      
      console.log('✅ Next-gen session created:', session_id);
    } catch (error) {
      console.error('Failed to create session:', error);
      setError('Failed to create session. Please refresh the page.');
    } finally {
      setSessionLoading(false);
    }
  };

  // Check session status and authentication
  const checkSessionStatus = async (sid) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/session/${sid}/status`);
      const data = response.data;
      
      setIsAuthenticated(data.authenticated);
      setAgentState(data.agent_state || 'ready');
      setCurrentWorkflow(data.current_workflow);
      setSessionMetrics(data.metrics);
      
      if (!data.authenticated && !showAuthModal) {
        await getAuthUrl(sid);
      }
      
      return data.authenticated;
    } catch (error) {
      console.error('Failed to check session status:', error);
      return false;
    }
  };

  // Get authentication URL
  const getAuthUrl = async (sid) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/session/${sid}/auth-url`);
      setAuthUrl(response.data.auth_url);
      setShowAuthModal(true);
    } catch (error) {
      console.error('Failed to get auth URL:', error);
    }
  };

  // Send message to the agent
  const sendMessage = async () => {
    if (!inputMessage.trim() || isTyping || !sessionId) return;

    const userMessage = {
      content: inputMessage.trim(),
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setAgentState('thinking');

    try {
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/chat`, {
        message: userMessage.content,
        enable_parallel_tools: true,
        max_tool_calls: 10,
      });

      const data = response.data;
      
      // Update agent state and workflow
      setAgentState(data.agent_state);
      setCurrentWorkflow(data.workflow_used);
      setConversationTurn(data.conversation_turn);
      
      const assistantMessage = {
        content: data.response,
        isUser: false,
        timestamp: Date.now(),
        metadata: {
          workflow: data.workflow_used,
          tools: data.tools_used,
          executionSummary: data.tool_execution_summary,
          duration: data.total_duration,
          contextUpdated: data.context_updated,
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update session metrics if context was updated
      if (data.context_updated) {
        await checkSessionStatus(sessionId);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        await getAuthUrl(sessionId);
        
        const errorMessage = {
          content: 'Authentication required. Please authenticate to continue the conversation.',
          isUser: false,
          timestamp: Date.now(),
          metadata: { isError: true }
        };
        setMessages(prev => [...prev, errorMessage]);
      } else {
        const errorMessage = {
          content: 'Sorry, I encountered an error. Please try again.',
          isUser: false,
          timestamp: Date.now(),
          metadata: { isError: true }
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      
      setAgentState('error');
    } finally {
      setIsTyping(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // Handle example query selection
  const handleExampleQuery = (query) => {
    setInputMessage(query);
    inputRef.current?.focus();
  };

  // Handle authentication
  const handleAuthenticate = () => {
    window.open(authUrl, '_blank');
    setShowAuthModal(false);
  };

  if (sessionLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="white">
          Initializing Next-Gen Agent...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🚀 Next-Gen Financial Assistant
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<MemoryIcon />}
              label={`Session: ${sessionId?.substring(0, 8)}...`}
              size="small"
              color="primary"
            />
            <Tooltip title="Refresh Session">
              <IconButton onClick={() => checkSessionStatus(sessionId)}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2} sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Main Chat Area */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={2}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* Messages */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              <List sx={{ py: 0 }}>
                {messages.map((message, index) => (
                  <MessageBubble
                    key={index}
                    message={message}
                    isUser={message.isUser}
                  />
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <Fade in={isTyping}>
                    <ListItem sx={{ alignItems: 'flex-start', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        <BotIcon />
                      </Avatar>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          borderRadius: '16px 16px 16px 4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="text.secondary">
                          Agent is {agentState.replace('_', ' ')}...
                        </Typography>
                      </Paper>
                    </ListItem>
                  </Fade>
                )}
                <div ref={messagesEndRef} />
              </List>
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              {!isAuthenticated && (
                <Alert
                  severity="warning"
                  action={
                    <Button color="inherit" size="small" onClick={() => setShowAuthModal(true)}>
                      Authenticate
                    </Button>
                  }
                  sx={{ mb: 2 }}
                >
                  Authentication required for personalized financial insights
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  ref={inputRef}
                  fullWidth
                  multiline
                  maxRows={4}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your investments, market trends, financial planning..."
                  disabled={isTyping}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '&:disabled': {
                      bgcolor: 'action.disabledBackground',
                    },
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            {/* Agent Status */}
            <AgentStatusCard
              agentState={agentState}
              currentWorkflow={currentWorkflow}
              sessionMetrics={sessionMetrics}
            />
            
            {/* Example Queries */}
            <ExampleQueriesCard onQuerySelect={handleExampleQuery} />
          </Box>
        </Grid>
      </Grid>

      {/* Authentication Modal */}
      <Dialog open={showAuthModal} onClose={() => setShowAuthModal(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCodeIcon color="primary" />
          Authentication Required
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            To access your personalized financial data and get the most accurate insights,
            please authenticate your account.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can continue using general features without authentication.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAuthModal(false)}>
            Continue Without Auth
          </Button>
          <Button variant="contained" onClick={handleAuthenticate}>
            Authenticate Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Display */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
};

  // Check session status
  const checkSessionStatus = async (sessionId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/session/${sessionId}/status`);
      const { authenticated } = response.data;
      
      setSessionId(sessionId);
      setIsAuthenticated(authenticated);
      
      if (!authenticated) {
        await getAuthUrl(sessionId);
        setShowAuthModal(true);
      }
      
      console.log('✅ Session status checked:', { sessionId, authenticated });
    } catch (error) {
      console.error('Failed to check session status:', error);
      // If session check fails, create new session
      await createNewSession();
    }
  };

  // Get authentication URL
  const getAuthUrl = async (sessionId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/session/${sessionId}/auth-url`);
      const { auth_url } = response.data;
      setAuthUrl(auth_url);
    } catch (error) {
      console.error('Failed to get auth URL:', error);
    }
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: inputMessage,
        session_id: sessionId
      });

      if (response.data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: response.data.response,
          tools_used: response.data.tools_used || [],
          timestamp: new Date(response.data.timestamp)
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Handle authentication errors
        if (!response.data.session_authenticated) {
          setIsAuthenticated(false);
          setShowAuthModal(true);
        }
        
        setError(response.data.error);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  // Handle authentication refresh
  const handleAuthRefresh = async () => {
    if (sessionId) {
      await checkSessionStatus(sessionId);
      setShowAuthModal(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Render individual message
  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    const isError = message.type === 'error';

    return (
      <ListItem
        key={message.id}
        sx={{
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          mb: 2
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            maxWidth: '80%',
            flexDirection: isUser ? 'row-reverse' : 'row'
          }}
        >
          <Avatar
            sx={{
              bgcolor: isUser ? 'primary.main' : isError ? 'error.main' : 'secondary.main',
              mx: 1
            }}
          >
            {isUser ? <PersonIcon /> : <BotIcon />}
          </Avatar>
          
          <Paper
            sx={{
              p: 2,
              bgcolor: isUser ? 'primary.light' : isError ? 'error.light' : 'grey.100',
              color: isUser ? 'white' : 'text.primary'
            }}
          >
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>
            
            {/* Show tools used */}
            {message.tools_used && message.tools_used.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {message.tools_used.map((tool, index) => (
                  <Chip
                    key={index}
                    label={tool}
                    size="small"
                    icon={<AssessmentIcon />}
                    sx={{ mr: 0.5, mb: 0.5 }}
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
            
            <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
              {message.timestamp.toLocaleTimeString()}
            </Typography>
          </Paper>
        </Box>
      </ListItem>
    );
  };

  // Loading screen
  if (sessionLoading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography>Initializing Financial AI Assistant...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" component="h1">
              💰 Financial AI Assistant
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {isAuthenticated ? '✅ Authenticated and ready' : '⚠️ Authentication required'}
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={handleAuthRefresh}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ borderRadius: 0 }}
        >
          {error}
        </Alert>
      )}

      {/* Welcome Message */}
      {messages.length === 0 && (
        <Card sx={{ m: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Welcome to your Financial AI Assistant! 🚀
            </Typography>
            <Typography variant="body2" color="text.secondary">
              I can help you with:
            </Typography>
            <Box component="ul" sx={{ mt: 1 }}>
              <li>💰 Net worth analysis</li>
              <li>📊 Credit report insights</li>
              <li>🏦 EPF account details</li>
              <li>📈 Investment portfolio analysis</li>
              <li>🔍 Financial market research</li>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {isAuthenticated 
                ? "You're authenticated! Start by asking any financial question."
                : "Please authenticate first to access your financial data."
              }
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
        <List>
          {messages.map(renderMessage)}
          {isTyping && (
            <ListItem>
              <Avatar sx={{ bgcolor: 'secondary.main', mr: 1 }}>
                <BotIcon />
              </Avatar>
              <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  <Typography variant="body2">AI is thinking...</Typography>
                </Box>
              </Paper>
            </ListItem>
          )}
        </List>
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={4}
            variant="outlined"
            placeholder={
              isAuthenticated 
                ? "Ask me anything about your finances..." 
                : "Please authenticate first to start chatting"
            }
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isAuthenticated || isTyping}
            sx={{ mr: 1 }}
          />
          <IconButton
            color="primary"
            size="large"
            onClick={sendMessage}
            disabled={!inputMessage.trim() || !isAuthenticated || isTyping}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Authentication Modal */}
      <Dialog open={showAuthModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <QrCodeIcon sx={{ mr: 1 }} />
            Authentication Required
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            To access your financial data, please authenticate using the QR code below:
          </Typography>
          
          {authUrl && (
            <Box sx={{ textAlign: 'center', my: 2 }}>
              <Button
                variant="contained"
                href={authUrl}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<QrCodeIcon />}
                size="large"
              >
                Open Authentication Page
              </Button>
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body2" color="text.secondary">
            After completing authentication, click "Check Status" to continue.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAuthModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleAuthRefresh} variant="contained">
            Check Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatContainer;
