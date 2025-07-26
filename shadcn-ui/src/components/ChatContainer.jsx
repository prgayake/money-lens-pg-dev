import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { 
  MessageCircle, 
  Bot, 
  User, 
  Send, 
  Loader2, 
  AlertCircle,
  QrCode,
  TrendingUp,
  Zap
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8001";

const ChatContainer = ({ sessionId, onFiMoneyAuthRequired }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [isConnectingToFi, setIsConnectingToFi] = useState(false);
  const [agentState, setAgentState] = useState("ready");
  const [currentWorkflow, setCurrentWorkflow] = useState("simple_response");
  const [sessionMetrics, setSessionMetrics] = useState({
    total_conversations: 0,
    total_tool_calls: 0,
    successful_tool_calls: 0,
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (sessionId && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  }, [sessionId]);

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
          type: "assistant",
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
    setAgentState("thinking");

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

      setCurrentWorkflow(response.data.workflow_used);
      setAgentState(response.data.agent_state);

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
      setAgentState("error");

      if (error.response?.status === 401) {
        setError("Authentication required. Please use the 'Connect to Fi Money' button to authenticate.");
      } else if (error.response?.status === 404) {
        setError("Session not found. Please refresh the page.");
      } else {
        setError("Failed to send message. Please try again.");
      }
    } finally {
      setIsTyping(false);
      if (agentState !== "error") {
        setAgentState("ready");
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getAgentStatusVariant = () => {
    switch (agentState) {
      case "ready": return "success";
      case "thinking": return "warning";
      case "error": return "destructive";
      default: return "secondary";
    }
  };

  const renderMessage = (message) => {
    const isUser = message.type === "user";
    const timestamp = new Date(message.timestamp).toLocaleTimeString();

    return (
      <div key={message.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} mb-6`}>
        <Avatar className="h-8 w-8">
          <AvatarFallback className={isUser ? "bg-primary text-primary-foreground" : "bg-secondary"}>
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>

        <div className={`flex-1 max-w-[80%] ${isUser ? "flex flex-col items-end" : ""}`}>
          <Card className={`w-fit ${isUser ? "bg-primary text-primary-foreground" : ""}`}>
            <CardContent className="p-4">
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}

              {message.tools_used && message.tools_used.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {message.tools_used.map((tool, index) => (
                    <Badge
                      key={tool.execution_id || index}
                      variant={tool.success === false ? "destructive" : tool.success === true ? "success" : "secondary"}
                      className="text-xs"
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {tool.tool_name || tool.name || tool}
                      {tool.success !== undefined && (tool.success ? " ✓" : " ✗")}
                    </Badge>
                  ))}
                </div>
              )}

              {!isUser && message.workflow_used && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {message.workflow_used}
                  </Badge>
                  {message.total_duration && (
                    <Badge variant="outline" className="text-xs">
                      {message.total_duration.toFixed(2)}s
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <p className="text-xs text-muted-foreground mt-1 px-1">
            {timestamp}
            {message.context_updated && (
              <span className="ml-2 text-green-600">• Context Updated</span>
            )}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={getAgentStatusVariant()}>
                Agent: {agentState}
              </Badge>
              <Badge variant="outline">
                Workflow: {currentWorkflow}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-xs text-muted-foreground">
              Conversations: {sessionMetrics.total_conversations} | 
              Tools: {sessionMetrics.successful_tool_calls}/{sessionMetrics.total_tool_calls}
            </div>
            <Button
              onClick={connectToFiMoney}
              disabled={isConnectingToFi || !sessionId}
              className="gap-2"
              variant="default"
            >
              {isConnectingToFi ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4" />
              )}
              {isConnectingToFi ? "Connecting..." : "Connect to Fi Money"}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 border-b bg-destructive/10">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-auto h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Welcome Message */}
      {messages.length === 0 && (
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Welcome to your Financial AI Assistant! 🚀
              </CardTitle>
              <CardDescription>
                Powered by advanced agent orchestration with markdown-formatted responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Financial Analysis</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>💰 Net worth analysis with detailed breakdowns</li>
                    <li>📊 Credit report insights in structured format</li>
                    <li>🏦 EPF account details with performance metrics</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Advanced Features</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>📈 Investment portfolio analysis with tables & charts</li>
                    <li>🔍 Financial market research with formatted reports</li>
                    <li>🤖 Parallel tool execution for faster responses</li>
                  </ul>
                </div>
              </div>
              
              <Separator />
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  ✨ Try asking: "Show me my net worth" or "Analyze my portfolio performance"
                </p>
                <Button onClick={connectToFiMoney} disabled={isConnectingToFi} className="gap-2">
                  <QrCode className="h-4 w-4" />
                  Get Started with Fi Money
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map(renderMessage)}
        
        {isTyping && (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-secondary">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <Card className="w-fit">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-muted/30">
        <div className="flex gap-3">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isTyping
                ? "🤖 AI is thinking... please wait"
                : "💬 Ask me anything about your finances..."
            }
            disabled={isTyping}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isTyping}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
