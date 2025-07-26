import asyncio
import json
import os
import textwrap
import requests
import uuid
import secrets
from typing import Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool

from web_search import execute_web_search, WEB_SEARCH_TOOL_DEFINITION
from financial_tools import (
    execute_stock_analysis, 
    execute_mutual_fund_analysis,
    execute_stock_symbol_search,
    STOCK_ANALYSIS_TOOL_DEFINITION,
    STOCK_SYMBOL_SEARCH_TOOL_DEFINITION,
    MUTUAL_FUND_TOOL_DEFINITION
)

# Load environment variables
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Configuration
MCP_SERVER_BASE_URL = "https://fi-mcp-service-709038576402.us-central1.run.app/mcp/stream"

# Tool definitions from Fi MCP server
FI_TOOL_DEFINITIONS = [
    {
        "name": "fetch_net_worth",
        "description": "Calculate comprehensive net worth using actual data from connected accounts, including assets and liabilities.",
    },
    {
        "name": "fetch_credit_report", 
        "description": "Retrieve comprehensive credit report information, including credit scores, loan details, and date of birth.",
    },
    {
        "name": "fetch_epf_details",
        "description": "Access Employee Provident Fund (EPF) account information, including balance and contributions.",
    },
    {
        "name": "fetch_mf_transactions",
        "description": "Retrieve mutual funds transaction history for portfolio analysis.",
    },
]

# Global storage for sessions
sessions: Dict[str, Dict[str, Any]] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("💰 Financial Assistant API started successfully! 🚀")
    print("📍 API available at: https://fi-mcp-service-709038576402.us-central1.run.app")
    print("📋 Available Endpoints:")
    print("  • POST /session/create - Create new session")
    print("  • GET  /session/{session_id}/status - Check authentication status")
    print("  • GET  /session/{session_id}/auth-url - Get authentication URL")
    print("  • POST /session/{session_id}/prefetch - Prefetch financial data")
    print("  • POST /session/{session_id}/chat - Chat with AI assistant")
    print("  • DELETE /session/{session_id} - Delete session")
    print("  • GET  /health - Health check")
    print("=" * 60)
    yield
    # Shutdown
    print("👋 Financial Assistant API shutting down...")

app = FastAPI(
    title="Financial Assistant API", 
    description="Clean API for intelligent financial advisory with session management",
    lifespan=lifespan,
    version="1.0.0"
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Thread pool for synchronous operations
executor = ThreadPoolExecutor(max_workers=10)

# Pydantic models
class CreateSessionResponse(BaseModel):
    session_id: str
    status: str
    message: str
    mcp_session_id: Optional[str] = None

class AuthStatusResponse(BaseModel):
    session_id: str
    authenticated: bool
    mcp_session_id: Optional[str]
    message: str

class AuthUrlResponse(BaseModel):
    session_id: str
    auth_url: str
    instructions: str

class PrefetchResponse(BaseModel):
    session_id: str
    success: bool
    data_loaded: list
    failed_tools: list
    message: str

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    session_id: str
    response: str
    tools_used: list

class HealthResponse(BaseModel):
    status: str
    message: str
    active_sessions: int

# Helper functions
def is_login_required(result):
    """Check if a result indicates login is required"""
    if isinstance(result, dict):
        if result.get("status") == "login_required":
            return True
        if "content" in result:
            content = result.get("content", [])
            if isinstance(content, list) and len(content) > 0:
                first_content = content[0]
                if isinstance(first_content, dict) and "text" in first_content:
                    try:
                        text_data = json.loads(first_content["text"])
                        if isinstance(text_data, dict) and text_data.get("status") == "login_required":
                            return True
                    except (json.JSONDecodeError, KeyError):
                        pass
    return False

def define_gemini_tools() -> Tool:
    """Creates a Gemini Tool object from our tool definitions."""
    gemini_tool_declarations = []
    
    # Add Fi MCP server tools
    for tool_def in FI_TOOL_DEFINITIONS:
        declaration = FunctionDeclaration(
            name=tool_def["name"],
            description=tool_def["description"],
            parameters={"type": "object", "properties": {}},
        )
        gemini_tool_declarations.append(declaration)
    
    # Add Web Search tool
    web_search_declaration = FunctionDeclaration(
        name=WEB_SEARCH_TOOL_DEFINITION["name"],
        description=WEB_SEARCH_TOOL_DEFINITION["description"],
        parameters={
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query to execute"
                }
            },
            "required": ["query"]
        }
    )
    gemini_tool_declarations.append(web_search_declaration)
    
    # Add Stock Symbol Search tool
    stock_symbol_search_declaration = FunctionDeclaration(
        name=STOCK_SYMBOL_SEARCH_TOOL_DEFINITION["name"],
        description=STOCK_SYMBOL_SEARCH_TOOL_DEFINITION["description"],
        parameters=STOCK_SYMBOL_SEARCH_TOOL_DEFINITION["parameters"]
    )
    gemini_tool_declarations.append(stock_symbol_search_declaration)
    
    # Add Stock Analysis tool
    stock_analysis_declaration = FunctionDeclaration(
        name=STOCK_ANALYSIS_TOOL_DEFINITION["name"],
        description=STOCK_ANALYSIS_TOOL_DEFINITION["description"],
        parameters=STOCK_ANALYSIS_TOOL_DEFINITION["parameters"]
    )
    gemini_tool_declarations.append(stock_analysis_declaration)
    
    # Add Mutual Fund Analysis tool
    mf_analysis_declaration = FunctionDeclaration(
        name=MUTUAL_FUND_TOOL_DEFINITION["name"],
        description=MUTUAL_FUND_TOOL_DEFINITION["description"],
        parameters=MUTUAL_FUND_TOOL_DEFINITION["parameters"]
    )
    gemini_tool_declarations.append(mf_analysis_declaration)
    
    return Tool(function_declarations=gemini_tool_declarations)

def initialize_mcp_session(session_id: str) -> Optional[str]:
    """Initialize MCP session for a client session"""
    initialize_request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "clientInfo": {"name": "fi-mcp-client", "version": "1.0.0"}
        }
    }
    
    try:
        # Create session with proper cookies
        http_session = requests.Session()
        http_session.cookies.set("client_session_id", session_id, domain="https://fi-mcp-service-709038576402.us-central1.run.app")
        
        headers = {"Content-Type": "application/json", "Mcp-Session-Id": session_id}
        
        response = http_session.post(
            MCP_SERVER_BASE_URL,
            json=initialize_request,
            headers=headers
        )
        
        response.raise_for_status()
        data = response.json()
        
        if "error" in data:
            return None
            
        mcp_session_id = response.headers.get('Mcp-Session-Id', session_id)
        
        # Store the session info
        sessions[session_id].update({
            "mcp_session_id": mcp_session_id,
            "http_session": http_session,
            "authenticated": False,
            "financial_data": {},
            "chat_history": [],
            "user_context": "",
            "last_updated": asyncio.get_event_loop().time()
        })
        
        return mcp_session_id
        
    except Exception as e:
        print(f"Failed to initialize MCP session: {e}")
        return None

def execute_mcp_tool(session_id: str, tool_name: str, skip_auth_retry: bool = False) -> dict:
    """Execute a tool call on the MCP server"""
    if session_id not in sessions:
        return {"error": "Session not found"}
        
    session_data = sessions[session_id]
    http_session = session_data["http_session"]
    mcp_session_id = session_data["mcp_session_id"]
    
    print(f"🔧 MCP Tool Call - Session ID: {session_id}, MCP Session ID: {mcp_session_id}, Tool: {tool_name}")
    
    try:
        call_tool_request = {
            "jsonrpc": "2.0", 
            "id": 2,
            "method": "tools/call",
            "params": {"name": tool_name, "arguments": {}}
        }
        
        headers = {
            "Content-Type": "application/json",
            "Mcp-Session-Id": mcp_session_id
        }
        
        print(f"🌐 Making MCP request to {MCP_SERVER_BASE_URL} with headers: {headers}")
        
        response = http_session.post(
            MCP_SERVER_BASE_URL,
            json=call_tool_request,
            headers=headers
        )
        
        print(f"📋 MCP Response status: {response.status_code}")
        
        if response.status_code == 401:
            if not skip_auth_retry:
                return {"status": "login_required"}
            else:
                return {"error": "Authentication required"}
        
        response.raise_for_status()
        result_data = response.json()
        
        print(f"📦 MCP Response data: {result_data}")
        
        if "result" in result_data:
            result = result_data["result"]
            if is_login_required(result):
                if not skip_auth_retry:
                    return {"status": "login_required"}
                else:
                    return {"status": "login_required"}
            return result
        elif "error" in result_data:
            return {"error": result_data["error"]}
        else:
            return {"error": "No valid response received from MCP server"}

    except requests.exceptions.RequestException as e:
        return {"error": str(e)}
    except json.JSONDecodeError:
        return {"error": "Invalid JSON response from server"}

async def auto_load_financial_data(session_id: str):
    """Automatically load user's financial data in background after authentication"""
    try:
        if session_id not in sessions:
            return
        
        print(f"🔄 Starting auto-load of financial data for session: {session_id}")
        
        # Prefetch data in a separate thread
        result = await asyncio.get_event_loop().run_in_executor(
            executor, prefetch_all_user_data, session_id
        )
        
        if result["success"]:
            # Update user context
            session_data = sessions[session_id]
            session_data["user_context"] = create_user_financial_context(session_data["financial_data"])
            session_data["last_updated"] = asyncio.get_event_loop().time()
            print(f"✅ Auto-loaded {len(result['loaded_data'])} financial data sources for session: {session_id}")
        else:
            print(f"⚠️ Auto-load failed for session: {session_id}")
            
    except Exception as e:
        print(f"❌ Error auto-loading financial data for session {session_id}: {e}")

def create_user_financial_context(financial_data: dict) -> str:
    """Create comprehensive user context from financial data for Gemini"""
    if not financial_data:
        return "The user has not yet loaded their financial data. Encourage them to authenticate to access personalized insights."
    
    context_parts = []
    context_parts.append("=== USER'S CURRENT FINANCIAL PROFILE ===")
    context_parts.append("You have access to the following verified financial information about this user:")
    context_parts.append("")
    
    # Process each financial data source
    for tool_name, data in financial_data.items():
        if is_login_required(data) or "error" in data:
            continue
            
        if tool_name == "fetch_net_worth":
            context_parts.append("💰 NET WORTH & ASSETS:")
            context_parts.append(f"  - {format_financial_data_for_context(data)}")
            context_parts.append("")
            
        elif tool_name == "fetch_credit_report":
            context_parts.append("📊 CREDIT PROFILE:")
            context_parts.append(f"  - {format_financial_data_for_context(data)}")
            context_parts.append("")
            
        elif tool_name == "fetch_epf_details":
            context_parts.append("🏛️ RETIREMENT SAVINGS (EPF):")
            context_parts.append(f"  - {format_financial_data_for_context(data)}")
            context_parts.append("")
            
        elif tool_name == "fetch_mf_transactions":
            context_parts.append("📈 INVESTMENT PORTFOLIO:")
            context_parts.append(f"  - {format_financial_data_for_context(data)}")
            context_parts.append("")
    
    context_parts.append("=== IMPORTANT CONTEXT GUIDELINES ===")
    context_parts.append("- This financial data is CURRENT and VERIFIED")
    context_parts.append("- Use this data to provide PERSONALIZED advice")
    context_parts.append("- Reference specific numbers and details when relevant")
    context_parts.append("- Consider their complete financial picture when giving recommendations")
    context_parts.append("- If asked about 'my' finances, use this data directly")
    context_parts.append("- Maintain conversation context across multiple interactions")
    context_parts.append("")
    
    return "\n".join(context_parts)

def format_financial_data_for_context(data: dict) -> str:
    """Format financial data for context"""
    if not data:
        return "No data available"
    
    # Handle MCP response format
    if isinstance(data, dict) and "content" in data:
        content = data.get("content", [])
        if isinstance(content, list) and len(content) > 0:
            first_content = content[0]
            if isinstance(first_content, dict) and "text" in first_content:
                try:
                    text_data = json.loads(first_content["text"])
                    return str(text_data)
                except (json.JSONDecodeError, KeyError):
                    return first_content.get("text", str(first_content))
    
    return str(data)

def check_session_authentication(session_id: str, force_check: bool = False) -> bool:
    """Check if a session is currently authenticated by testing MCP connection"""
    if session_id not in sessions:
        return False
    
    session_data = sessions[session_id]
    current_time = asyncio.get_event_loop().time()
    
    # Use cached authentication status if it's recent (within 5 minutes) and not forced
    last_auth_check = session_data.get("last_auth_check", 0)
    cached_auth_status = session_data.get("authenticated", False)
    
    if not force_check and (current_time - last_auth_check < 300) and cached_auth_status:
        print(f"✅ Using cached authentication status for session {session_id}: {cached_auth_status}")
        return cached_auth_status
    
    try:
        # Quick authentication test using a lightweight call
        test_result = execute_mcp_tool(session_id, "fetch_net_worth", skip_auth_retry=True)
        print(f"🔍 Auth check for session {session_id}: {test_result}")
        
        is_authenticated = not is_login_required(test_result) and "error" not in test_result
        
        # Update the cached authentication status and timestamp
        session_data["authenticated"] = is_authenticated
        session_data["last_auth_check"] = current_time
        print(f"✅ Authentication status for session {session_id}: {is_authenticated}")
        
        return is_authenticated
    except Exception as e:
        print(f"❌ Auth check exception for session {session_id}: {e}")
        session_data["authenticated"] = False
        session_data["last_auth_check"] = current_time
        return False

def prefetch_all_user_data(session_id: str) -> dict:
    """Pre-fetch all available user data from MCP server"""
    if session_id not in sessions:
        return {"error": "Session not found"}
    
    user_data = {}
    failed_tools = []
    
    for tool_def in FI_TOOL_DEFINITIONS:
        tool_name = tool_def["name"]
        
        try:
            result = execute_mcp_tool(session_id, tool_name, skip_auth_retry=True)
            
            if is_login_required(result) or result.get("status") == "login_required":
                failed_tools.append(tool_name)
            elif "error" not in result:
                user_data[tool_name] = result
                # Cache in session
                sessions[session_id]["financial_data"][tool_name] = result
            else:
                failed_tools.append(tool_name)
        except Exception as e:
            failed_tools.append(tool_name)
    
    return {
        "loaded_data": user_data,
        "failed_tools": failed_tools,
        "success": len(user_data) > 0
    }

# API Endpoints

@app.post("/session/create", response_model=CreateSessionResponse)
async def create_session():
    """Create a new session with unique ID"""
    session_id = str(uuid.uuid4())
    
    # Initialize session storage
    sessions[session_id] = {
        "created_at": asyncio.get_event_loop().time(),
        "authenticated": False,
        "financial_data": {},
        "chat_history": [],
        "user_context": "",
        "last_updated": asyncio.get_event_loop().time()
    }
    
    # Initialize MCP session
    mcp_session_id = initialize_mcp_session(session_id)
    
    if mcp_session_id:
        return CreateSessionResponse(
            session_id=session_id,
            status="success",
            message="Session created successfully. Use this session_id for all subsequent requests.",
            mcp_session_id=mcp_session_id
        )
    else:
        # Clean up failed session
        if session_id in sessions:
            del sessions[session_id]
        raise HTTPException(status_code=500, detail="Failed to initialize MCP session")

@app.get("/session/{session_id}/status", response_model=AuthStatusResponse)
async def get_session_status(session_id: str):
    """Check authentication status of a session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = sessions[session_id]
    
    # Use the new authentication checker
    authenticated = check_session_authentication(session_id)
    
    # If user just got authenticated and has no financial data, auto-load it
    if authenticated and not session_data.get("financial_data"):
        print(f"🔄 Auto-loading financial data for newly authenticated session: {session_id}")
        # Pre-fetch financial data in background
        data_loading_task = asyncio.create_task(auto_load_financial_data(session_id))
        # Store task reference to prevent garbage collection
        session_data["_data_loading_task"] = data_loading_task
    
    return AuthStatusResponse(
        session_id=session_id,
        authenticated=authenticated,
        mcp_session_id=session_data.get("mcp_session_id"),
        message="Authenticated and ready" if authenticated else "Authentication required"
    )

@app.get("/session/{session_id}/auth-url", response_model=AuthUrlResponse)
async def get_auth_url(session_id: str):
    """Get authentication URL for a session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = sessions[session_id]
    mcp_session_id = session_data.get("mcp_session_id")
    
    # Use the MCP session ID for authentication URL
    auth_url = f"https://fi-mcp-service-709038576402.us-central1.run.app/mockWebPage?sessionId={mcp_session_id}"
    
    return AuthUrlResponse(
        session_id=session_id,
        auth_url=auth_url,
        instructions="Open this URL in your browser to complete authentication, then check status."
    )

@app.get("/session/{session_id}/quick-auth-check")
async def quick_auth_check(session_id: str):
    """Quick authentication check without heavy operations"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    is_authenticated = check_session_authentication(session_id)
    
    return {
        "session_id": session_id,
        "authenticated": is_authenticated,
        "timestamp": asyncio.get_event_loop().time(),
        "message": "Ready for requests" if is_authenticated else "Authentication required"
    }

@app.post("/session/{session_id}/prefetch", response_model=PrefetchResponse)
async def prefetch_financial_data(session_id: str):
    """Prefetch all financial data for a session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check authentication in real-time
    if not check_session_authentication(session_id):
        raise HTTPException(status_code=401, detail="Session not authenticated. Get auth URL first.")
    
    # Prefetch data in a separate thread
    result = await asyncio.get_event_loop().run_in_executor(
        executor, prefetch_all_user_data, session_id
    )
    
    return PrefetchResponse(
        session_id=session_id,
        success=result["success"],
        data_loaded=list(result["loaded_data"].keys()),
        failed_tools=result["failed_tools"],
        message=f"Successfully loaded {len(result['loaded_data'])} financial data sources"
    )

def build_conversation_context(chat_history: list) -> str:
    """Build conversation context from chat history"""
    if not chat_history:
        return "This is the beginning of the conversation with the user."
    
    context_parts = ["PREVIOUS CONVERSATION SUMMARY:"]
    
    # Show last 5 exchanges to maintain context without overwhelming the prompt
    recent_history = chat_history[-5:] if len(chat_history) > 5 else chat_history
    
    for i, exchange in enumerate(recent_history, 1):
        user_msg = exchange.get("user", "")
        assistant_msg = exchange.get("assistant", "")
        tools_used = exchange.get("tools_used", [])
        
        context_parts.append(f"Exchange {i}:")
        context_parts.append(f"  User: {user_msg[:200]}{'...' if len(user_msg) > 200 else ''}")
        context_parts.append(f"  Assistant: {assistant_msg[:200]}{'...' if len(assistant_msg) > 200 else ''}")
        if tools_used:
            context_parts.append(f"  Tools used: {', '.join(tools_used)}")
        context_parts.append("")
    
    context_parts.append("Remember to maintain continuity with this conversation history.")
    return "\n".join(context_parts)


def restore_conversation_context(chat, chat_history: list):
    """Restore conversation context by replaying recent exchanges"""
    if not chat_history:
        return
    
    # Replay last 3 exchanges to restore context
    recent_exchanges = chat_history[-3:] if len(chat_history) > 3 else chat_history
    
    try:
        for exchange in recent_exchanges:
            user_msg = exchange.get("user", "")
            assistant_msg = exchange.get("assistant", "")
            
            if user_msg and assistant_msg:
                # Send user message and assistant response to restore context
                # This helps Gemini understand the conversation flow
                context_restore_msg = f"[CONTEXT RESTORE] Previous exchange - User: {user_msg[:150]}{'...' if len(user_msg) > 150 else ''}"
                chat.send_message(context_restore_msg)
                
        print(f"✅ Restored context with {len(recent_exchanges)} previous exchanges")
    except Exception as e:
        print(f"⚠️ Could not restore full conversation context: {e}")


def invalidate_chat_session(session_id: str):
    """Invalidate chat session to force recreation with updated context"""
    if session_id in sessions and "chat_instance" in sessions[session_id]:
        del sessions[session_id]["chat_instance"]
        sessions[session_id]["last_context_update"] = 0
        print(f"🔄 Chat session invalidated for session {session_id}")


@app.post("/session/{session_id}/chat", response_model=ChatResponse)
async def chat_with_ai(session_id: str, request: ChatRequest):
    """Chat with AI assistant using session context with persistent conversation"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = sessions[session_id]
    
    # Check authentication with caching (only force check if no recent auth)
    if not check_session_authentication(session_id, force_check=False):
        raise HTTPException(status_code=401, detail="Session not authenticated")
    
    try:
        # Check if we have an existing chat session
        if "chat_instance" not in session_data:
            print(f"🆕 Creating new chat instance for session {session_id}")
            # Initialize Gemini model with tools
            fi_tools = define_gemini_tools()
            
            # Create comprehensive user context from financial data
            user_context = create_user_financial_context(session_data.get("financial_data", {}))
            
            # Build conversation history context
            conversation_context = build_conversation_context(session_data.get("chat_history", []))
            
            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                tools=[fi_tools],
                system_instruction=textwrap.dedent(f"""
                    You are an intelligent financial advisor with access to real-time financial data and comprehensive analysis tools.
                    
                    {user_context}
                    
                    CONVERSATION CONTEXT:
                    {conversation_context}
                    
                    AVAILABLE TOOLS:
                    1. Fi MCP Server Tools: fetch_net_worth, fetch_credit_report, fetch_epf_details, fetch_mf_transactions
                    2. Web Search: For current market information, news, and research
                    3. Stock Analysis: Comprehensive stock analysis using real-time data
                    4. Mutual Fund Analysis: Indian mutual fund analysis and comparison
                    
                    INTELLIGENT RESPONSE FRAMEWORK:
                    
                    STEP 1: ANALYZE THE QUESTION
                    - Understand the user's intent and context
                    - Determine what type of response they need
                    - Consider previous conversations and context
                    
                    STEP 2: GATHER RELEVANT DATA
                    - If question involves personal finances → Use cached financial data or fetch if needed
                    - If question needs stock analysis → Use stock_analysis tool
                    - If question needs mutual fund analysis → Use mutual_fund_analysis tool
                    - If question needs current information → Use web search
                    - If question is educational → Use web search for comprehensive info
                    
                    STEP 3: CONTEXTUALIZE WITH USER'S SITUATION
                    - For financial questions: Always relate advice to their actual financial position
                    - For general questions: Provide direct answers
                    - Reference previous conversations when relevant
                    
                    STEP 4: PROVIDE COMPREHENSIVE RESPONSE
                    - Be conversational and natural
                    - Provide actionable insights
                    - Use actual data when available
                    - Reference previous conversations and maintain context
                    - Remember user's preferences and previous questions
                    
                    CONVERSATION GUIDELINES:
                    - Maintain conversation continuity across messages
                    - Reference previous discussions when relevant
                    - Remember user's financial goals and concerns
                    - Build upon previous recommendations
                    - Ask follow-up questions when appropriate
                    
                    Remember: Focus on being genuinely helpful with accurate, relevant responses. 
                    Always consider the user's complete financial profile and conversation history when giving advice.
                """)
            )
            
            # Start chat and store in session
            chat = model.start_chat()
            session_data["chat_instance"] = chat
            
            # If we have previous conversation history, replay it to maintain context
            if session_data.get("chat_history"):
                print(f"🔄 Restoring conversation context with {len(session_data['chat_history'])} previous messages")
                restore_conversation_context(chat, session_data["chat_history"])
        else:
            print(f"📞 Using existing chat instance for session {session_id}")
            chat = session_data["chat_instance"]
            
            # Update financial context if it has changed
            current_time = asyncio.get_event_loop().time()
            last_context_update = session_data.get("last_context_update", 0)
            
            # Refresh context every 10 minutes or if financial data was updated
            if (current_time - last_context_update > 600) or (session_data.get("last_updated", 0) > last_context_update):
                print(f"🔄 Refreshing financial context for session {session_id}")
                user_context = create_user_financial_context(session_data.get("financial_data", {}))
                
                # Send a context update message (this won't be shown to user)
                context_update_message = f"""
                [SYSTEM CONTEXT UPDATE]
                Updated Financial Context:
                {user_context}
                
                Please use this updated information for subsequent responses.
                """
                chat.send_message(context_update_message)
                session_data["last_context_update"] = current_time
        
        # Send message to Gemini with the existing chat instance
        tools_used = []
        response = chat.send_message(request.message)
        
        # Handle tool calls efficiently with better loop control
        max_rounds = 3
        current_round = 0
        
        while current_round < max_rounds:
            current_round += 1
            
            function_calls = []
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'function_call') and part.function_call:
                        function_calls.append(part.function_call)
            
            if not function_calls:
                print(f"🔧 Round {current_round}: No function calls found, breaking loop")
                break
                
            print(f"🔧 Processing {len(function_calls)} tool calls in round {current_round}")
            
            # Process function calls
            tool_responses = []
            for function_call in function_calls:
                tool_name = function_call.name
                tools_used.append(tool_name)
                
                print(f"🔧 Executing tool: {tool_name}")
                print(f"📋 Function call object: {function_call}")
                print(f"📋 Function call args: {getattr(function_call, 'args', 'No args attribute')}")
                
                # Initialize tool_result
                tool_result = None
            
            try:
                if tool_name == WEB_SEARCH_TOOL_DEFINITION["name"]:
                    # Handle web search
                    query = ""
                    if hasattr(function_call, 'args') and function_call.args:
                        if hasattr(function_call.args, 'query'):
                            query = function_call.args.query
                        elif hasattr(function_call.args, 'get'):
                            query = function_call.args.get('query', '')
                        elif isinstance(function_call.args, dict):
                            query = function_call.args.get('query', '')
                    
                    if not query:
                        query = request.message
                    
                    tool_result = await asyncio.get_event_loop().run_in_executor(
                        executor, execute_web_search, None, query
                    )
                
                elif tool_name == STOCK_SYMBOL_SEARCH_TOOL_DEFINITION["name"]:
                    # Handle stock symbol search with improved parameter extraction
                    company_name = ""
                    market = "AUTO"
                    
                    # Debug: Print the args structure
                    print(f"🔍 Debug - function_call.args type: {type(getattr(function_call, 'args', None))}")
                    print(f"🔍 Debug - function_call.args content: {getattr(function_call, 'args', None)}")
                    
                    # Extract parameters with multiple approaches
                    if hasattr(function_call, 'args') and function_call.args:
                        args = function_call.args
                        
                        # Approach 1: Direct attribute access
                        if hasattr(args, 'company_name'):
                            company_name = args.company_name or ""
                            print(f"🔍 Found company_name via attribute: {company_name}")
                        
                        # Approach 2: Dictionary access
                        elif isinstance(args, dict):
                            company_name = args.get('company_name', '')
                            market = args.get('market', 'AUTO')
                            print(f"🔍 Found company_name via dict: {company_name}")
                        
                        # Approach 3: Check if args has items/keys
                        elif hasattr(args, 'items'):
                            for key, value in args.items():
                                if key == 'company_name':
                                    company_name = value or ""
                                elif key == 'market':
                                    market = value or "AUTO"
                            print(f"🔍 Found company_name via items: {company_name}")
                        
                        # Approach 4: String conversion and JSON parsing as fallback
                        elif hasattr(args, '__dict__'):
                            args_dict = args.__dict__
                            company_name = args_dict.get('company_name', '')
                            market = args_dict.get('market', 'AUTO')
                            print(f"🔍 Found company_name via __dict__: {company_name}")
                    
                    # If still no company name, try to extract from the user's message
                    if not company_name:
                        # Simple extraction from user message
                        user_msg = request.message.lower()
                        if any(word in user_msg for word in ['apple', 'aapl']):
                            company_name = "Apple Inc"
                        elif any(word in user_msg for word in ['reliance', 'ril']):
                            company_name = "Reliance Industries"
                        elif any(word in user_msg for word in ['tcs', 'tata consultancy']):
                            company_name = "Tata Consultancy Services"
                        elif any(word in user_msg for word in ['microsoft', 'msft']):
                            company_name = "Microsoft"
                        elif any(word in user_msg for word in ['google', 'alphabet', 'googl']):
                            company_name = "Alphabet Inc"
                        else:
                            # Extract company name from message more intelligently
                            words = request.message.split()
                            for i, word in enumerate(words):
                                if word.lower() in ['for', 'of', 'symbol'] and i + 1 < len(words):
                                    company_name = ' '.join(words[i+1:])
                                    break
                        
                        if company_name:
                            print(f"🔍 Extracted company_name from message: {company_name}")
                    
                    if not company_name:
                        tool_result = {
                            "content": [{
                                "type": "text", 
                                "text": "❌ No company name provided. Please specify a company name to search for its stock symbol. For example: 'Find stock symbol for Apple' or 'Get symbol for Reliance Industries'"
                            }]
                        }
                    else:
                        print(f"🔍 Searching stock symbol for: {company_name} (market: {market})")
                        tool_result = await asyncio.get_event_loop().run_in_executor(
                            executor, execute_stock_symbol_search, None, company_name, market
                        )
                    
                elif tool_name == STOCK_ANALYSIS_TOOL_DEFINITION["name"]:
                    # Handle stock analysis with improved parameter extraction
                    symbols = []
                    analysis_type = "basic"
                    period = "1y"
                    
                    try:
                        if hasattr(function_call, 'args') and function_call.args:
                            # Extract symbols
                            if hasattr(function_call.args, 'symbols'):
                                symbols = function_call.args.symbols or []
                            elif isinstance(function_call.args, dict):
                                symbols = function_call.args.get('symbols', [])
                            
                            # Extract analysis type
                            if hasattr(function_call.args, 'analysis_type'):
                                analysis_type = function_call.args.analysis_type or "basic"
                            elif isinstance(function_call.args, dict):
                                analysis_type = function_call.args.get('analysis_type', 'basic')
                            
                            # Extract period
                            if hasattr(function_call.args, 'period'):
                                period = function_call.args.period or "1y"
                            elif isinstance(function_call.args, dict):
                                period = function_call.args.get('period', '1y')
                        
                        # Validate symbols
                        if not symbols:
                            tool_result = {
                                "content": [{
                                    "type": "text", 
                                    "text": "❌ No stock symbols provided. Please specify stock symbols to analyze (e.g., ['AAPL', 'GOOGL'])."
                                }]
                            }
                        else:
                            print(f"🔍 Analyzing stocks: {symbols} (type: {analysis_type}, period: {period})")
                            # Execute stock analysis with proper error handling
                            tool_result = await asyncio.get_event_loop().run_in_executor(
                                executor, execute_stock_analysis, None, symbols, analysis_type, period
                            )
                            
                    except Exception as e:
                        print(f"❌ Stock analysis error: {e}")
                        tool_result = {
                            "content": [{
                                "type": "text", 
                                "text": f"❌ Stock analysis failed: {str(e)}. Please check the stock symbols and try again."
                            }]
                        }
                    
                elif tool_name == MUTUAL_FUND_TOOL_DEFINITION["name"]:
                    # Handle mutual fund analysis with improved error handling
                    action = "search"
                    fund_codes = None
                    search_term = None
                    period_days = 365
                    
                    try:
                        if hasattr(function_call, 'args') and function_call.args:
                            if hasattr(function_call.args, 'action'):
                                action = function_call.args.action or "search"
                            elif isinstance(function_call.args, dict):
                                action = function_call.args.get('action', 'search')
                            
                            if hasattr(function_call.args, 'fund_codes'):
                                fund_codes = function_call.args.fund_codes
                            elif isinstance(function_call.args, dict):
                                fund_codes = function_call.args.get('fund_codes')
                            
                            if hasattr(function_call.args, 'search_term'):
                                search_term = function_call.args.search_term
                            elif isinstance(function_call.args, dict):
                                search_term = function_call.args.get('search_term')
                            
                            if hasattr(function_call.args, 'period_days'):
                                period_days = function_call.args.period_days or 365
                            elif isinstance(function_call.args, dict):
                                period_days = function_call.args.get('period_days', 365)
                        
                        print(f"🔍 Mutual fund analysis: {action} (codes: {fund_codes}, search: {search_term})")
                        tool_result = await asyncio.get_event_loop().run_in_executor(
                            executor, execute_mutual_fund_analysis, None, action, fund_codes, search_term, period_days
                        )
                        
                    except Exception as e:
                        print(f"❌ Mutual fund analysis error: {e}")
                        tool_result = {
                            "content": [{
                                "type": "text", 
                                "text": f"❌ Mutual fund analysis failed: {str(e)}. Please check the parameters and try again."
                            }]
                        }
                else:
                    # Handle Fi MCP tools
                    # Check cached data first
                    if tool_name in session_data["financial_data"]:
                        tool_result = session_data["financial_data"][tool_name]
                    else:
                        tool_result = await asyncio.get_event_loop().run_in_executor(
                            executor, execute_mcp_tool, session_id, tool_name
                        )
                        
                        # Cache if successful
                        if "error" not in tool_result and not is_login_required(tool_result):
                            session_data["financial_data"][tool_name] = tool_result
                
            except Exception as tool_execution_error:
                print(f"❌ Error executing tool {tool_name}: {tool_execution_error}")
                tool_result = {
                    "content": [{
                        "type": "text", 
                        "text": f"❌ Tool execution failed: {str(tool_execution_error)}"
                    }]
                }
            
            # Add tool response with proper format conversion
            try:
                print(f"🔄 Raw tool result for {tool_name}: {tool_result}")
                
                # Ensure tool_result is properly formatted for Gemini
                if isinstance(tool_result, dict):
                    # Convert dict to a simple format that Gemini can handle
                    if "content" in tool_result and isinstance(tool_result["content"], list):
                        # Extract text from MCP-style content
                        text_content = ""
                        for content_item in tool_result["content"]:
                            if isinstance(content_item, dict) and "text" in content_item:
                                text_content += content_item["text"] + "\n"
                        formatted_result = {"result": text_content.strip()}
                    elif "error" in tool_result:
                        formatted_result = {"error": str(tool_result["error"])}
                    else:
                        # Convert complex dict to string representation
                        formatted_result = {"result": str(tool_result)}
                else:
                    # For non-dict results, wrap in a simple structure
                    formatted_result = {"result": str(tool_result)}
                
                print(f"✅ Formatted result for {tool_name}: {formatted_result}")
                
                tool_responses.append(
                    genai.protos.Part(
                        function_response=genai.protos.FunctionResponse(
                            name=tool_name,
                            response=formatted_result,
                        )
                    )
                )
            except Exception as format_error:
                print(f"❌ Error formatting tool response for {tool_name}: {format_error}")
                # Fallback to simple string response
                fallback_result = {"result": f"Tool {tool_name} executed but response formatting failed: {str(tool_result)[:500]}"}
                tool_responses.append(
                    genai.protos.Part(
                        function_response=genai.protos.FunctionResponse(
                            name=tool_name,
                            response=fallback_result,
                        )
                    )
                )
            
            # Send tool results back to Gemini and update response for next iteration
            response = chat.send_message(tool_responses)
            print(f"🔧 Round {current_round}: Sent {len(tool_responses)} tool responses back to Gemini")
        
        # Extract final response text after all tool calls are processed
        response_text = ""
        if hasattr(response, 'text') and response.text:
            response_text = response.text
        elif response.candidates and response.candidates[0].content.parts:
            text_parts = []
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'text') and part.text:
                    text_parts.append(part.text)
            response_text = '\n'.join(text_parts)
        
        print(f"🔧 Final response text: {response_text[:200]}{'...' if len(response_text) > 200 else ''}")
        
        # Store enhanced chat history with context
        session_data["chat_history"].append({
            "user": request.message,
            "assistant": response_text,
            "tools_used": tools_used,
            "timestamp": asyncio.get_event_loop().time(),
            "financial_context_available": bool(session_data.get("financial_data"))
        })
        
        # Update user context if new financial data was fetched
        if any(tool in tools_used for tool in [t["name"] for t in FI_TOOL_DEFINITIONS]):
            session_data["user_context"] = create_user_financial_context(session_data["financial_data"])
            session_data["last_updated"] = asyncio.get_event_loop().time()
            # Invalidate chat session to refresh context with new financial data
            if "chat_instance" in session_data:
                invalidate_chat_session(session_id)
                print(f"🔄 Chat context refreshed due to new financial data for session {session_id}")
        
        return ChatResponse(
            session_id=session_id,
            response=response_text,
            tools_used=tools_used
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session and cleanup resources"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Cleanup session data
    session_data = sessions[session_id]
    if "http_session" in session_data:
        session_data["http_session"].close()
    
    # Remove from storage
    del sessions[session_id]
    
    return {
        "session_id": session_id,
        "status": "deleted",
        "message": "Session deleted successfully"
    }

@app.get("/")
async def serve_frontend():
    """Serve the main authentication page"""
    return FileResponse('static/login.html')

@app.get("/api")
async def root():
    """Root endpoint - API information"""
    return {
        "message": "💰 Financial Assistant API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "sessions_list": "/sessions",
            "session_create": "POST /session/create",
            "session_status": "GET /session/{session_id}/status",
            "auth_url": "GET /session/{session_id}/auth-url",
            "prefetch": "POST /session/{session_id}/prefetch",
            "chat": "POST /session/{session_id}/chat",
            "delete_session": "DELETE /session/{session_id}"
        },
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/sessions")
async def list_sessions():
    """List all active sessions - simple debug endpoint"""
    return {
        "total_sessions": len(sessions),
        "sessions": {
            session_id: {
                "created": data.get("created", "unknown"),
                "mcp_session_id": data.get("mcp_session_id", "none"),
                "authenticated": data.get("authenticated", False),
                "has_financial_data": len(data.get("financial_data", {})) > 0
            }
            for session_id, data in sessions.items()
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="Financial Assistant API is running",
        active_sessions=len(sessions)
    )

# Frontend-expected endpoints
@app.post("/create-session")
async def create_session_post():
    """Create session endpoint for frontend - POST"""
    print("🔥 CREATE SESSION POST called!")
    response = await create_session()
    result = {
        "success": True,
        "session_id": response.session_id,
        "message": response.message,
        "mcp_session_id": response.mcp_session_id
    }
    print(f"🔥 Returning: {result}")
    return result

@app.get("/create-session")
async def create_session_get():
    """Create session endpoint for frontend - GET (for debugging)"""
    print("🔥 CREATE SESSION GET called!")
    response = await create_session()
    result = {
        "success": True,
        "session_id": response.session_id,
        "message": response.message,
        "mcp_session_id": response.mcp_session_id
    }
    print(f"🔥 Returning: {result}")
    return result

# User login endpoint
@app.post("/login")
async def user_login(request: dict):
    """Handle user login with email/password"""
    email = request.get("email")
    password = request.get("password")
    
    # Simple validation - in production, use proper authentication
    if email and password:
        # Mock authentication - in production, verify against database
        import secrets
        token = secrets.token_urlsafe(32)
        return {
            "success": True,
            "token": token,
            "message": "Login successful"
        }
    else:
        return {
            "success": False,
            "message": "Invalid email or password"
        }

@app.get("/quick-auth-check")
async def quick_auth_check_frontend(session_id: str):
    """Quick auth check for frontend"""
    return await quick_auth_check(session_id)

@app.get("/fetch_net_worth")
async def fetch_net_worth_frontend(session_id: str):
    """Fetch net worth for frontend"""
    if session_id not in sessions:
        return {"success": False, "error": "Session not found"}
    
    result = await asyncio.get_event_loop().run_in_executor(
        executor, execute_mcp_tool, session_id, "fetch_net_worth"
    )
    
    if "error" in result or is_login_required(result):
        return {"success": False, "data": result}
    
    return {"success": True, "data": result}

@app.get("/fetch_epf_details")
async def fetch_epf_details_frontend(session_id: str):
    """Fetch EPF details for frontend"""
    if session_id not in sessions:
        return {"success": False, "error": "Session not found"}
    
    result = await asyncio.get_event_loop().run_in_executor(
        executor, execute_mcp_tool, session_id, "fetch_epf_details"
    )
    
    if "error" in result or is_login_required(result):
        return {"success": False, "data": result}
    
    return {"success": True, "data": result}

@app.get("/fetch_mf_transactions")
async def fetch_mf_transactions_frontend(session_id: str):
    """Fetch MF transactions for frontend"""
    if session_id not in sessions:
        return {"success": False, "error": "Session not found"}
    
    result = await asyncio.get_event_loop().run_in_executor(
        executor, execute_mcp_tool, session_id, "fetch_mf_transactions"
    )
    
    if "error" in result or is_login_required(result):
        return {"success": False, "data": result}
    
    return {"success": True, "data": result}

@app.get("/fetch_bank_transactions")
async def fetch_bank_transactions_frontend(session_id: str):
    """Fetch bank transactions for frontend"""
    if session_id not in sessions:
        return {"success": False, "error": "Session not found"}
    
    result = await asyncio.get_event_loop().run_in_executor(
        executor, execute_mcp_tool, session_id, "fetch_bank_transactions"
    )
    
    if "error" in result or is_login_required(result):
        return {"success": False, "data": result}
    
    return {"success": True, "data": result}

@app.get("/fetch_credit_report")
async def fetch_credit_report_frontend(session_id: str):
    """Fetch credit report for frontend"""
    if session_id not in sessions:
        return {"success": False, "error": "Session not found"}
    
    result = await asyncio.get_event_loop().run_in_executor(
        executor, execute_mcp_tool, session_id, "fetch_credit_report"
    )
    
    if "error" in result or is_login_required(result):
        return {"success": False, "data": result}
    
    return {"success": True, "data": result}

# Enhanced chat endpoint for React frontend
class EnhancedChatRequest(BaseModel):
    message: str
    session_id: str

class EnhancedChatResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    tools_used: Optional[list] = None
    error: Optional[str] = None
    session_authenticated: bool
    timestamp: str

@app.post("/api/chat", response_model=EnhancedChatResponse)
async def enhanced_chat_endpoint(request: EnhancedChatRequest):
    """Enhanced chat endpoint for React frontend with authentication checking"""
    from datetime import datetime
    
    try:
        # Check if session exists
        if request.session_id not in sessions:
            return EnhancedChatResponse(
                success=False,
                error="Session not found. Please create a new session.",
                session_authenticated=False,
                timestamp=datetime.now().isoformat()
            )
        
        # Check authentication
        is_authenticated = check_session_authentication(request.session_id)
        
        if not is_authenticated:
            return EnhancedChatResponse(
                success=False,
                error="Session not authenticated. Please authenticate first.",
                session_authenticated=False,
                timestamp=datetime.now().isoformat()
            )
        
        # Process chat request
        chat_request = ChatRequest(message=request.message)
        response = await chat_with_ai(request.session_id, chat_request)
        
        return EnhancedChatResponse(
            success=True,
            response=response.response,
            tools_used=response.tools_used,
            session_authenticated=True,
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException as e:
        return EnhancedChatResponse(
            success=False,
            error=f"HTTP Error: {e.detail}",
            session_authenticated=False,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        return EnhancedChatResponse(
            success=False,
            error=f"Unexpected error: {str(e)}",
            session_authenticated=False,
            timestamp=datetime.now().isoformat()
        )

@app.post("/chat")
async def chat_frontend(request: ChatRequest, session_id: str):
    """Chat endpoint for frontend"""
    if session_id not in sessions:
        return {"success": False, "error": "Session not found"}
    
    try:
        response = await chat_with_ai(session_id, request)
        return {
            "success": True,
            "response": response.response,
            "tools_used": response.tools_used
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# Additional endpoints for React frontend
@app.get("/api/session/{session_id}/financial-context")
async def get_financial_context(session_id: str):
    """Get user's financial context and summary"""
    if session_id not in sessions:
        return {"success": False, "error": "Session not found"}
    
    session_data = sessions[session_id]
    financial_data = session_data.get("financial_data", {})
    
    return {
        "success": True,
        "session_id": session_id,
        "has_financial_data": bool(financial_data),
        "financial_summary": create_user_financial_context(financial_data) if financial_data else None,
        "last_updated": session_data.get("last_updated"),
        "chat_message_count": len(session_data.get("chat_history", []))
    }

@app.post("/api/session/{session_id}/refresh-context")
async def refresh_financial_context(session_id: str):
    """Manually refresh user's financial context and conversation context"""
    if session_id not in sessions:
        return {"success": False, "error": "Session not found"}
    
    # Check authentication
    if not check_session_authentication(session_id):
        return {"success": False, "error": "Session not authenticated"}
    
    try:
        # Prefetch data
        result = await asyncio.get_event_loop().run_in_executor(
            executor, prefetch_all_user_data, session_id
        )
        
        if result["success"]:
            # Update context
            session_data = sessions[session_id]
            session_data["user_context"] = create_user_financial_context(session_data["financial_data"])
            session_data["last_updated"] = asyncio.get_event_loop().time()
            
            # Invalidate chat session to refresh conversation context
            invalidate_chat_session(session_id)
            
            return {
                "success": True,
                "session_id": session_id,
                "data_loaded": result["data_loaded"],
                "failed_tools": result["failed_tools"],
                "message": f"Successfully refreshed {len(result['data_loaded'])} financial data sources and conversation context"
            }
        else:
            return {
                "success": False,
                "error": "Failed to refresh financial data",
                "failed_tools": result.get("failed_tools", [])
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Error refreshing context: {str(e)}"
        }

@app.get("/api/session/{session_id}/chat-history")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    if session_id not in sessions:
        return {"success": False, "error": "Session not found"}
    
    session_data = sessions[session_id]
    chat_history = session_data.get("chat_history", [])
    
    return {
        "success": True,
        "session_id": session_id,
        "chat_history": chat_history,
        "message_count": len(chat_history)
    }

@app.delete("/api/session/{session_id}/chat-history")
async def clear_chat_history(session_id: str):
    """Clear chat history for a session and reset conversation context"""
    if session_id not in sessions:
        return {"success": False, "error": "Session not found"}
    
    # Clear chat history
    sessions[session_id]["chat_history"] = []
    
    # Invalidate chat instance to force fresh start
    invalidate_chat_session(session_id)
    
    return {
        "success": True,
        "session_id": session_id,
        "message": "Chat history cleared and conversation context reset successfully"
    }

@app.get("/api/health")
async def api_health():
    """API health check for frontend"""
    return {
        "status": "healthy",
        "message": "Financial Assistant API is running",
        "version": "1.0.0",
        "active_sessions": len(sessions),
        "endpoints": {
            "chat": "/api/chat",
            "session_create": "/session/create",
            "session_status": "/session/{session_id}/status",
            "auth_url": "/session/{session_id}/auth-url",
            "prefetch": "/session/{session_id}/prefetch",
            "chat_history": "/api/session/{session_id}/chat-history"
        }
    }

@app.post("/ask-fi")
async def ask_fi_frontend(request: dict):
    """Ask Fi endpoint for dashboard frontend"""
    session_id = request.get("session_id")
    question = request.get("question")
    
    if not session_id or not question:
        return {"success": False, "error": "Session ID and question are required"}
    
    if session_id not in sessions:
        return {"success": False, "error": "Session not found"}
    
    try:
        chat_request = ChatRequest(message=question)
        response = await chat_with_ai(session_id, chat_request)
        return {
            "success": True,
            "response": response.response,
            "tools_used": response.tools_used
        }
    except Exception as e:
        print(f"❌ Chat error: {e}")
        return {"success": False, "error": f"Chat error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
