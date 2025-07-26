# Next-Gen Financial Assistant React Frontend

A modern React frontend for the Next-Generation Financial Assistant API with advanced agent orchestration, parallel tool execution, and intelligent workflow routing.

## ✨ Features

### 🚀 Advanced Agent Integration
- **Real-time Agent State Monitoring**: Visual indicators for agent states (Ready, Thinking, Executing Tools, Evaluating, Responding, Error)
- **Workflow Type Display**: Shows which workflow pattern is being used (Simple Response, Parallelization, Orchestrator-Workers, Prompt Chaining)
- **Tool Execution Tracking**: Real-time display of parallel tool executions with success/failure indicators
- **Context Awareness**: Visual feedback when financial context is updated

### 🎨 Enhanced UI/UX
- **Material-UI v5**: Modern, responsive design with custom theming
- **Gradient Backgrounds**: Beautiful visual design matching the next-gen theme
- **Real-time Status Updates**: Live agent state and session metrics
- **Collapsible Tool Details**: Expandable view of tool execution details
- **Example Query Suggestions**: Pre-built queries categorized by workflow type
- **📝 Markdown Formatting**: Professional formatted AI responses with tables, headers, code blocks, and rich text

### 📊 Session Management
- **Automatic Session Creation**: Seamless session initialization
- **Authentication Flow**: Integrated authentication modal and status tracking
- **Session Persistence**: Maintains session across browser sessions
- **Metrics Display**: Real-time conversation and tool execution statistics

### 🔧 Technical Features
- **Parallel Tool Visualization**: Shows when tools are executed in parallel
- **Error Handling**: Graceful error handling with user feedback
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Auto-scroll**: Smart message scrolling and focus management

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Next-Gen Financial Assistant API server running on port 8001

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Configuration
Create a `.env` file in the root directory:
```env
REACT_APP_API_BASE_URL=http://localhost:8001
```

### Running with the API Server
1. Start the Next-Gen API server:
   ```bash
   cd ../fi-mcp-client
   ./start_nextgen.sh
   ```

2. Start the React frontend:
   ```bash
   npm start
   ```

3. Open http://localhost:3000 in your browser

## 🎯 Usage Examples

### Workflow-Specific Queries

#### Simple Response
- "What is my current net worth?"
- "Show me my EPF balance"
- "What's my credit score?"

#### Parallelization (Multiple tools simultaneously)
- "Compare Apple, Microsoft, and Google stock performance"
- "Analyze multiple mutual funds: VTIAX, FXNAX, SWTSX"
- "Get current prices for Tesla, Amazon, and Netflix"

#### Orchestrator-Workers (Multi-step analysis)
- "Analyze my complete financial portfolio and provide optimization recommendations"
- "Create a diversified investment strategy based on my risk profile"
- "Review my financial health and suggest improvements"

#### Prompt Chaining (Sequential tasks)
- "What are the latest market trends affecting tech stocks?"
- "Research the impact of recent Fed decisions on my investments"
- "Find current investment opportunities in renewable energy"

## 📝 Markdown Formatting Support

The AI assistant now responds with **beautifully formatted markdown** for enhanced readability:

### Example Formatted Response
When you ask for portfolio analysis, you'll receive responses like:

```markdown
# 📊 Portfolio Analysis Report

## Current Holdings Overview
Your portfolio shows **strong performance** this quarter.

| Stock | Current Value | Change | Status |
|-------|---------------|--------|--------|
| AAPL  | $185.42      | +2.3%  | ✅ Buy |
| TSLA  | $242.15      | -1.8%  | ⚠️ Hold |

### Top Performers 🚀
1. **Apple Inc. (AAPL)** - *+15.2%* 
2. **Microsoft Corp. (MSFT)** - *+8.7%*

> **Recommendation:** Your portfolio is well-positioned. 
> Consider adding defensive positions before Q4.
```

### Supported Markdown Features
- ✅ **Headers** (H1, H2, H3) for organized sections
- ✅ **Tables** for financial data presentation
- ✅ **Bold/Italic** text for emphasis
- ✅ **Code blocks** for JSON responses and data
- ✅ **Lists** (ordered/unordered) for recommendations
- ✅ **Blockquotes** for key insights
- ✅ **Task lists** with checkboxes
- ✅ **Emoji** support for visual indicators

## 🏗️ Architecture

### Component Structure
```
src/
├── App.js                 # Main app with enhanced theming
├── components/
│   └── ChatContainer.jsx  # Main chat interface
└── ...
```

### Key Components

#### `ChatContainer`
- Main chat interface with agent orchestration support
- Real-time agent state monitoring
- Tool execution visualization
- Session management and authentication

#### `MessageBubble`
- Individual message display with metadata
- Tool execution details with expand/collapse
- Workflow type indicators
- Timestamp and status information

#### `AgentStatusCard`
- Real-time agent state display
- Current workflow information
- Session metrics and statistics
- Visual state indicators

#### `ExampleQueriesCard`
- Pre-built example queries
- Workflow-specific categorization
- One-click query insertion

## 🎨 Theming and Styling

### Custom Theme
- **Primary Colors**: Gradient from #667eea to #764ba2
- **Workflow Colors**: Specific colors for each workflow type
- **Agent State Colors**: Visual indicators for different agent states
- **Tool Category Colors**: Color-coded tool categories

### Workflow Type Colors
- **Simple Response**: Blue (#3b82f6)
- **Parallelization**: Yellow (#f59e0b)
- **Orchestrator-Workers**: Purple (#8b5cf6)
- **Prompt Chaining**: Green (#10b981)
- **Routing**: Indigo (#6366f1)

### Agent State Colors
- **Ready**: Green (#10b981)
- **Thinking**: Blue (#3b82f6)
- **Executing Tools**: Yellow (#f59e0b)
- **Evaluating**: Purple (#8b5cf6)
- **Responding**: Indigo (#6366f1)
- **Error**: Red (#ef4444)

## 📡 API Integration

### Endpoint Usage
- `POST /session/create` - Session initialization
- `POST /session/{id}/chat` - Enhanced chat with workflow routing
- `GET /session/{id}/status` - Real-time status and metrics
- `GET /session/{id}/auth-url` - Authentication flow

### Enhanced Request Format
```json
{
  "message": "Analyze my portfolio",
  "enable_parallel_tools": true,
  "max_tool_calls": 10,
  "workflow_hint": "orchestrator_workers"
}
```

### Enhanced Response Format
```json
{
  "session_id": "abc123",
  "response": "Analysis response...",
  "workflow_used": "orchestrator_workers",
  "agent_state": "ready",
  "tools_used": [
    {
      "execution_id": "tool_001",
      "tool_name": "fetch_net_worth",
      "category": "financial_data",
      "duration": 1.23,
      "success": true,
      "result_summary": "Net worth: $125,000"
    }
  ],
  "tool_execution_summary": {
    "total_tools": 3,
    "successful_tools": 3,
    "parallel_groups": 1,
    "avg_tool_duration": 1.15
  },
  "context_updated": true,
  "conversation_turn": 5
}
```

## � Customization

### Adding New Workflow Types
1. Update `WORKFLOW_TYPES` configuration
2. Add corresponding icons and colors
3. Update example queries

### Adding New Tool Categories
1. Update `TOOL_CATEGORIES` configuration
2. Add appropriate icons and colors
3. Update tool display logic

### Styling Customization
- Modify theme configuration in `App.js`
- Update component styles in `ChatContainer.jsx`
- Add custom CSS for animations and transitions

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
```env
REACT_APP_API_BASE_URL=https://your-api-domain.com
```

### Docker Support
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Follow React best practices
2. Maintain component modularity
3. Add proper TypeScript types
4. Update documentation for new features
5. Test with all workflow types

## � Dependencies

### Core Dependencies
- **React 18**: Latest React with concurrent features
- **Material-UI v5**: Modern component library
- **Axios**: HTTP client for API communication
- **Framer Motion**: Smooth animations and transitions
- **React Markdown**: Full markdown rendering support with GitHub Flavored Markdown
- **Remark GFM**: Tables, task lists, and enhanced markdown features

### Development Dependencies
- **React Scripts**: Create React App tooling
- **Testing Libraries**: Jest and React Testing Library

## � Troubleshooting

### Common Issues

#### API Connection Issues
- Ensure the Next-Gen API server is running on port 8001
- Check CORS configuration
- Verify environment variables

#### Authentication Problems
- Clear browser localStorage
- Check authentication URL generation
- Verify session status endpoint

#### Workflow Display Issues
- Check API response format
- Verify workflow type mappings
- Ensure tool execution metadata

### Debug Mode
Enable debug logging by setting:
```env
REACT_APP_DEBUG=true
```

---

**Built for next-generation financial intelligence with advanced agent orchestration** 🚀
