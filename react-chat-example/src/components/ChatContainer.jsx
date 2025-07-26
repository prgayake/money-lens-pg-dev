// ChatContainer.jsx - Main Chat Component for Financial AI Assistant
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  Card,
  CardContent,
} from "@mui/material";
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  QrCode as QrCodeIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import axios from "axios";
import { smoothScrollIntoView } from "../utils/resizeObserverUtils";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8001";

const ChatContainer = ({
  sessionId: propSessionId,
  onFiMoneyAuthRequired,
}) => {
  // State management - use props if provided
  const [sessionId, setSessionId] = useState(propSessionId);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(!propSessionId);
  const [isConnectingToFi, setIsConnectingToFi] = useState(false);

  // Next-gen API state
  const [currentWorkflow, setCurrentWorkflow] = useState("simple_response");
  const [agentState, setAgentState] = useState("ready");
  const [sessionMetrics, setSessionMetrics] = useState({
    total_conversations: 0,
    total_tool_calls: 0,
    successful_tool_calls: 0,
  });

  // Memoized markdown components for performance
  const markdownComponents = useMemo(
    () => ({
      // Custom styling for markdown elements
      p: ({ children }) => (
        <Typography variant="body1" sx={{ mb: 1, "&:last-child": { mb: 0 } }}>
          {children}
        </Typography>
      ),
      h1: ({ children }) => (
        <Typography variant="h4" sx={{ mb: 2, mt: 1, fontWeight: "bold" }}>
          {children}
        </Typography>
      ),
      h2: ({ children }) => (
        <Typography variant="h5" sx={{ mb: 1.5, mt: 1, fontWeight: "bold" }}>
          {children}
        </Typography>
      ),
      h3: ({ children }) => (
        <Typography variant="h6" sx={{ mb: 1, mt: 1, fontWeight: "bold" }}>
          {children}
        </Typography>
      ),
      ul: ({ children }) => (
        <Box component="ul" sx={{ pl: 2, mb: 1 }}>
          {children}
        </Box>
      ),
      ol: ({ children }) => (
        <Box component="ol" sx={{ pl: 2, mb: 1 }}>
          {children}
        </Box>
      ),
      li: ({ children }) => (
        <Typography component="li" variant="body1" sx={{ mb: 0.5 }}>
          {children}
        </Typography>
      ),
      code: ({ children, className }) => (
        <Typography
          component="code"
          sx={{
            bgcolor: className ? "grey.900" : "grey.200",
            color: className ? "grey.100" : "grey.800",
            px: className ? 2 : 0.5,
            py: className ? 1 : 0,
            borderRadius: 1,
            fontFamily: "monospace",
            fontSize: "0.875rem",
            display: className ? "block" : "inline",
            whiteSpace: className ? "pre" : "pre-wrap",
            overflowX: className ? "auto" : "visible",
            mb: className ? 1 : 0,
          }}
        >
          {children}
        </Typography>
      ),
      blockquote: ({ children }) => (
        <Paper
          sx={{
            bgcolor: "grey.50",
            borderLeft: 4,
            borderColor: "primary.main",
            p: 2,
            mb: 1,
            fontStyle: "italic",
          }}
        >
          {children}
        </Paper>
      ),
      table: ({ children }) => (
        <Paper sx={{ overflow: "auto", mb: 1 }}>
          <Box
            component="table"
            sx={{ width: "100%", borderCollapse: "collapse" }}
          >
            {children}
          </Box>
        </Paper>
      ),
      th: ({ children }) => (
        <Typography
          component="th"
          sx={{
            border: 1,
            borderColor: "grey.300",
            p: 1,
            bgcolor: "grey.100",
            fontWeight: "bold",
            textAlign: "left",
          }}
        >
          {children}
        </Typography>
      ),
      td: ({ children }) => (
        <Typography
          component="td"
          sx={{
            border: 1,
            borderColor: "grey.300",
            p: 1,
          }}
        >
          {children}
        </Typography>
      ),
      strong: ({ children }) => (
        <Typography component="strong" sx={{ fontWeight: "bold" }}>
          {children}
        </Typography>
      ),
      em: ({ children }) => (
        <Typography component="em" sx={{ fontStyle: "italic" }}>
          {children}
        </Typography>
      ),
    }),
    []
  );

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Optimized scroll to bottom to prevent ResizeObserver issues
  const scrollToBottom = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (messagesEndRef.current) {
        smoothScrollIntoView(messagesEndRef.current, {
          behavior: "smooth",
          block: "end",
        });
      }
    }, 100);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Update state when props change
  useEffect(() => {
    if (propSessionId) {
      setSessionId(propSessionId);
      setSessionLoading(false); // Don't show loading if we have a session from props
    }
  }, [propSessionId]);

  // Focus input field when session is ready
  useEffect(() => {
    if (sessionId && inputRef.current && !sessionLoading) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  }, [sessionLoading, sessionId]);

  // Connect to Fi Money by sending a financial query
  const connectToFiMoney = useCallback(async () => {
    if (!sessionId) return;
    
    setIsConnectingToFi(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/session/${sessionId}/chat`,
        {
          message: "I want to check my net worth. Can you help me access my financial data?",
          use_parallel_tools: false
        },
        { timeout: 30000 }
      );

      if (response.data) {
        const responseText = response.data.response || "";
        
        // Look for Fi Money auth URL in the response
        const urlMatch = responseText.match(/https:\/\/fi\.money\/[^\s)]+/);
        if (urlMatch && onFiMoneyAuthRequired) {
          onFiMoneyAuthRequired(urlMatch[0]);
        }
        
        // Add the message to chat history
        const botMessage = {
          id: Date.now(),
          type: "bot",
          content: responseText,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Failed to connect to Fi Money:", error);
      setError("Failed to connect to Fi Money. Please try again.");
    } finally {
      setIsConnectingToFi(false);
    }
  }, [sessionId, onFiMoneyAuthRequired]);

  // Create new session
  const createNewSession = useCallback(async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/session/create`);
      const { session_id } = response.data;

      setSessionId(session_id);
      localStorage.setItem("fi_session_id", session_id);

      console.log("✅ New session created:", session_id);
    } catch (error) {
      console.error("Failed to create session:", error);
      setError("Failed to create session. Please refresh the page.");
    }
  }, []);

  // Check for existing session or create new one
  const initializeSession = useCallback(async () => {
    setSessionLoading(true);

    // Check localStorage for existing session
    const savedSessionId = localStorage.getItem("fi_session_id");

    if (savedSessionId) {
      setSessionId(savedSessionId);
      console.log("✅ Using existing session:", savedSessionId);
    } else {
      await createNewSession();
    }

    setSessionLoading(false);
  }, [createNewSession]);

  // Initialize session on component mount only if no session provided
  useEffect(() => {
    if (!propSessionId) {
      initializeSession();
    } else {
      setSessionLoading(false); // Ensure loading is false when we have props
    }
  }, [propSessionId, initializeSession]);

  // Send message to AI
  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    setError(null);
    setAgentState("thinking"); // Update agent state

    try {
      const response = await axios.post(
        `${API_BASE_URL}/session/${sessionId}/chat`,
        {
          message: inputMessage,
          enable_parallel_tools: true,
          max_tool_calls: 10,
          workflow_hint: null,
        }
      );

      // Next-gen API returns data directly, not wrapped in success/error
      const aiMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: response.data.response,
        tools_used: response.data.tools_used || [],
        workflow_used: response.data.workflow_used,
        agent_state: response.data.agent_state,
        total_duration: response.data.total_duration,
        tool_execution_summary: response.data.tool_execution_summary,
        context_updated: response.data.context_updated,
        conversation_turn: response.data.conversation_turn,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Update state with response data
      setCurrentWorkflow(response.data.workflow_used);
      setAgentState(response.data.agent_state);

      // Update session metrics if available
      if (response.data.tool_execution_summary) {
        setSessionMetrics((prev) => ({
          total_conversations: response.data.conversation_turn,
          total_tool_calls:
            prev.total_tool_calls +
            (response.data.tool_execution_summary.total_tools || 0),
          successful_tool_calls:
            prev.successful_tool_calls +
            (response.data.tool_execution_summary.successful_tools || 0),
        }));
      }
    } catch (error) {
      console.error("Chat error:", error);
      setAgentState("error"); // Update agent state on error

      // Handle specific HTTP errors
      if (error.response?.status === 401) {
        setError("Authentication required. Please use the 'Connect to Fi Money' button to authenticate.");
      } else if (error.response?.status === 404) {
        setError("Session not found. Creating new session...");
        await createNewSession();
      } else {
        setError("Failed to send message. Please try again.");
      }
    } finally {
      setIsTyping(false);
      // Reset agent state to ready if no error occurred
      if (agentState !== "error") {
        setAgentState("ready");
      }
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Render individual message
  const renderMessage = (message) => {
    const isUser = message.type === "user";
    const isError = message.type === "error";

    return (
      <ListItem
        key={message.id}
        sx={{
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
          mb: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            maxWidth: "80%",
            flexDirection: isUser ? "row-reverse" : "row",
          }}
        >
          <Avatar
            sx={{
              bgcolor: isUser
                ? "primary.main"
                : isError
                ? "error.main"
                : "secondary.main",
              mx: 1,
            }}
          >
            {isUser ? <PersonIcon /> : <BotIcon />}
          </Avatar>

          <Paper
            sx={{
              p: 2,
              bgcolor: isUser
                ? "primary.light"
                : isError
                ? "error.light"
                : "grey.100",
              color: isUser ? "white" : "text.primary",
            }}
          >
            {/* Render content with markdown support for AI responses */}
            {isUser ? (
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {message.content}
              </Typography>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            )}

            {/* Show tools used */}
            {message.tools_used && message.tools_used.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {message.tools_used.map((tool, index) => (
                  <Chip
                    key={tool.execution_id || index}
                    label={`${tool.tool_name || tool.name || tool} ${
                      tool.success !== undefined
                        ? tool.success
                          ? "✓"
                          : "✗"
                        : ""
                    }`}
                    size="small"
                    icon={<AssessmentIcon />}
                    sx={{ mr: 0.5, mb: 0.5 }}
                    color={
                      tool.success === false
                        ? "error"
                        : tool.success === true
                        ? "success"
                        : "secondary"
                    }
                    variant="outlined"
                    title={
                      tool.result_summary ||
                      `Duration: ${tool.duration?.toFixed(2)}s` ||
                      ""
                    }
                  />
                ))}
              </Box>
            )}

            {/* Show workflow and performance info for assistant messages */}
            {!isUser && message.workflow_used && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={`Workflow: ${message.workflow_used}`}
                  size="small"
                  sx={{ mr: 0.5, mb: 0.5 }}
                  color="primary"
                  variant="outlined"
                />
                {message.total_duration && (
                  <Chip
                    label={`${message.total_duration.toFixed(2)}s`}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                    color="default"
                    variant="outlined"
                  />
                )}
                {message.tool_execution_summary && (
                  <Chip
                    label={`${
                      message.tool_execution_summary.successful_tools || 0
                    }/${message.tool_execution_summary.total_tools || 0} tools`}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                    color="info"
                    variant="outlined"
                  />
                )}
              </Box>
            )}

            <Typography
              variant="caption"
              sx={{ display: "block", mt: 1, opacity: 0.7 }}
            >
              {new Date(message.timestamp).toLocaleTimeString()}
              {message.context_updated && (
                <Typography
                  component="span"
                  sx={{ ml: 1, color: "success.main" }}
                >
                  • Context Updated
                </Typography>
              )}
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
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography>Initializing Financial AI Assistant...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Paper
        sx={{ p: 2, borderRadius: 0, bgcolor: "primary.main", color: "white" }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h5" component="h1">
              💰 Financial AI Assistant
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              ✨ Chat with AI • Connect to Fi Money for financial data
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<QrCodeIcon />}
            onClick={connectToFiMoney}
            disabled={isConnectingToFi || !sessionId}
            sx={{ 
              bgcolor: "rgba(255,255,255,0.2)", 
              color: "white",
              "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }
            }}
          >
            {isConnectingToFi ? "Connecting..." : "Connect to Fi Money"}
          </Button>
        </Box>
      </Paper>

      {/* Agent Status Bar */}
      <Paper sx={{ p: 1, borderRadius: 0, bgcolor: "grey.50" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              label={`Agent: ${agentState}`}
              size="small"
              color={
                agentState === "ready"
                  ? "success"
                  : agentState === "error"
                  ? "error"
                  : "primary"
              }
              variant="outlined"
            />
            <Chip
              label={`Workflow: ${currentWorkflow}`}
              size="small"
              color="info"
              variant="outlined"
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Typography
              variant="caption"
              sx={{ display: "flex", alignItems: "center" }}
            >
              Conversations: {sessionMetrics.total_conversations} | Tools:{" "}
              {sessionMetrics.successful_tool_calls}/
              {sessionMetrics.total_tool_calls}
            </Typography>
          </Box>
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
              Welcome to your Next-Gen Financial AI Assistant! 🚀
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Powered by advanced agent orchestration with **markdown-formatted
              responses**
            </Typography>
            <Box component="ul" sx={{ mt: 1 }}>
              <li>💰 **Net worth analysis** with detailed breakdowns</li>
              <li>📊 **Credit report insights** in structured format</li>
              <li>🏦 **EPF account details** with performance metrics</li>
              <li>📈 **Investment portfolio analysis** with tables & charts</li>
              <li>🔍 **Financial market research** with formatted reports</li>
              <li>🤖 **Parallel tool execution** for faster responses</li>
            </Box>

            <Typography
              variant="body2"
              color="primary.main"
              sx={{ mt: 2, fontWeight: "bold" }}
            >
              ✨ New: AI responses now feature professional markdown formatting
              with:
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 2 }}>
              <li>📋 **Tables** for financial data</li>
              <li>🔤 **Headers** for organized sections</li>
              <li>💾 **Code blocks** for JSON responses</li>
              <li>📝 **Lists** and checkboxes</li>
              <li>🎨 **Rich text** with emphasis</li>
            </Box>

            <Typography variant="body2" color="text.secondary">
              ✨ Try asking: "Show me my net worth" or "Analyze my portfolio performance with a detailed markdown report"
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: "auto",
          px: 1,
          minHeight: 0,
          maxHeight: "calc(100vh - 280px)", // Reserve space for header, status, and input
        }}
      >
        <List>
          {messages.map(renderMessage)}
          {isTyping && (
            <ListItem>
              <Avatar sx={{ bgcolor: "secondary.main", mr: 1 }}>
                <BotIcon />
              </Avatar>
              <Paper sx={{ p: 2, bgcolor: "grey.100" }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  <Typography variant="body2">AI is thinking...</Typography>
                </Box>
              </Paper>
            </ListItem>
          )}
        </List>
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input - Fixed to bottom */}
      <Paper
        sx={{
          p: 2,
          borderRadius: 0,
          position: "sticky",
          bottom: 0,
          zIndex: 1000,
          backgroundColor: "background.paper",
          borderTop: "1px solid",
          borderTopColor: "divider",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={4}
            minRows={1}
            variant="outlined"
            placeholder={
              isTyping
                ? "🤖 AI is thinking... please wait"
                : "💬 Ask me anything about your finances..."
            }
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "background.default",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "action.hover",
                  transform: "translateY(-1px)",
                },
                "&.Mui-focused": {
                  backgroundColor: "background.paper",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                },
                "&.Mui-disabled": {
                  backgroundColor: "action.disabledBackground",
                  opacity: 0.7,
                },
              },
              "& .MuiInputBase-input": {
                fontSize: "1rem",
                lineHeight: 1.5,
                transition: "all 0.2s ease",
              },
              "& .MuiInputBase-input::placeholder": {
                fontSize: "0.95rem",
                opacity: 0.7,
                transition: "opacity 0.3s ease",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderWidth: 1,
                borderColor: "primary.light",
                transition: "border-color 0.3s ease",
              },
            }}
          />
          <IconButton
            color="primary"
            size="large"
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isTyping}
            sx={{
              backgroundColor: "primary.main",
              color: "white",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
              "&.Mui-disabled": {
                backgroundColor: "action.disabledBackground",
                color: "action.disabled",
              },
              padding: 1.5,
              minWidth: 48,
              minHeight: 48,
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatContainer;
