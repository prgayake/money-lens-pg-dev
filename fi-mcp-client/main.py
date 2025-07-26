import asyncio
import json
import os
import textwrap
import requests
import uuid

from dotenv import load_dotenv
import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
from rich.console import Console
from rich.markdown import Markdown
from web_search import execute_web_search, WEB_SEARCH_TOOL_DEFINITION
from financial_tools import (
    execute_stock_analysis, 
    execute_mutual_fund_analysis,
    STOCK_ANALYSIS_TOOL_DEFINITION,
    MUTUAL_FUND_TOOL_DEFINITION
)

# --- Configuration ---
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
# Point to our server's MCP streaming endpoint
MCP_SERVER_BASE_URL = "https://fi-mcp-service-709038576402.us-central1.run.app/mcp/stream"

# --- Tool Definitions ---
# Since we cannot discover tools from the server via a simple API,
# we define them here based on the mcp-docs/README.md.
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

def define_gemini_tools() -> Tool:
    """Creates a Gemini Tool object from our hardcoded definitions."""
    gemini_tool_declarations = []
    
    # Add Fi MCP server tools
    for tool_def in FI_TOOL_DEFINITIONS:
        declaration = FunctionDeclaration(
            name=tool_def["name"],
            description=tool_def["description"],
            # The fi-mcp-server tools are simple and don't require parameters
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


def is_login_required(result):
    """Check if a result indicates login is required, handling various response formats."""
    if isinstance(result, dict):
        # Direct status check
        if result.get("status") == "login_required":
            return True
        
        # Check nested content structure
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


# Global variables to store MCP session ID and user data
mcp_session_id = None
user_financial_data = {}

def initialize_mcp_session(console: Console, http_session: requests.Session, force_client_session_id: str = None) -> str:
    """Initialize MCP session once at startup"""
    global mcp_session_id
    
    initialize_request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {}
            },
            "clientInfo": {
                "name": "fi-mcp-client",
                "version": "1.0.0"
            }
        }
    }
    
    try:
        console.print("[dim]Initializing MCP session...[/dim]")
        
        # Create headers - if force_client_session_id is provided, try to use it
        headers = {"Content-Type": "application/json"}
        if force_client_session_id:
            headers["Mcp-Session-Id"] = force_client_session_id
        
        # Include client session ID in cookies for the MCP initialization
        init_response = http_session.post(
            MCP_SERVER_BASE_URL,
            json=initialize_request,
            headers=headers
        )
        
        init_response.raise_for_status()
        init_data = init_response.json()
        
        if "error" in init_data:
            console.print(f"[bold red]Initialize error: {init_data['error']}[/bold red]")
            return None
        
        # Extract and store MCP session ID - use forced ID if it worked
        mcp_session_id = init_response.headers.get('Mcp-Session-Id')
        if not mcp_session_id and force_client_session_id:
            # If server didn't return a session ID but we forced one, assume it worked
            mcp_session_id = force_client_session_id
            
        if mcp_session_id:
            console.print(f"[green]✓ MCP Session initialized: {mcp_session_id}[/green]")
            return mcp_session_id
        else:
            console.print("[bold red]No MCP Session ID received[/bold red]")
            return None
            
    except Exception as e:
        console.print(f"[bold red]Failed to initialize MCP session: {e}[/bold red]")
        return None


async def main():
    """Main function to run the chat client."""
    global user_financial_data, mcp_session_id
    
    console = Console()
    console.print("[bold green]Welcome to the Fi MCP Gemini Client![/bold green]")
    console.print("This version connects directly to the server's simple API.")
    console.print("[dim]After authentication, your financial data will be automatically loaded.[/dim]")
    console.print("\n[bold cyan]Available Commands:[/bold cyan]")
    console.print("• Type any financial question to get instant answers")
    console.print("• 'login' or 'auth' - Manually authenticate your account")
    console.print("• 'dashboard' or 'summary' - Show your financial overview")
    console.print("• 'refresh' - Update your financial data")
    console.print("• 'exit' or 'quit' - End the session")
    console.print("-" * 60)

    try:
        # Use a requests.Session to automatically manage cookies for auth
        http_session = requests.Session()

        # Set a unique session ID for this client instance
        client_session_id = str(uuid.uuid4())
        http_session.cookies.set("client_session_id", client_session_id, domain="https://fi-mcp-service-709038576402.us-central1.run.app")
        
        console.print(f"Client Session ID created: {client_session_id}")

        # Initialize MCP session once at startup
        mcp_session_id = initialize_mcp_session(console, http_session)
        if not mcp_session_id:
            console.print("[bold red]Failed to initialize MCP session. Exiting.[/bold red]")
            return

        # 1. Define tools for Gemini
        fi_tools = define_gemini_tools()
        console.print(f"[bold green]✓ Loaded {len(FI_TOOL_DEFINITIONS) + 3} tool definitions (Fi MCP: {len(FI_TOOL_DEFINITIONS)}, Web Search: 1, Stock Analysis: 1, Mutual Fund Analysis: 1).[/bold green]")
        
        # 1.5. Always do login flow first - redirect user to login page
        console.print("[cyan]🔐 Please log in to access your financial data...[/cyan]")
        
        if mcp_session_id:
            login_url = f"https://fi-mcp-service-709038576402.us-central1.run.app/mockWebPage?sessionId={mcp_session_id}"
            console.print(f"\n[bold blue]👉 LOGIN URL: {login_url}[/bold blue]")
            console.print("\n[yellow]Please complete the login process in your browser[/yellow]")
    
            
            # Open browser automatically
            import webbrowser
            try:
                webbrowser.open(login_url)
                console.print("[green]✓ Login page opened in your browser[/green]")
            except:
                console.print("[yellow]Please manually open the URL above in your browser[/yellow]")
            
            # Wait for user to complete login
            input("--> Press Enter after you have completed login in your browser...")
            
            # Add a small delay to ensure session is established
            import time
            console.print("[dim]Waiting for session to be established...[/dim]")
            time.sleep(2)
            
            # Verify authentication works
            console.print("[cyan]🔄 Verifying authentication and loading your financial data...[/cyan]")
            verification_result = execute_mcp_tool(console, http_session, "fetch_net_worth", skip_auth_retry=True)
            
            if not is_login_required(verification_result) and "error" not in verification_result:
                console.print("[bold green]✅ Authentication successful! Loading all your financial data...[/bold green]")
                user_financial_data = prefetch_all_user_data(console, http_session)
            else:
                console.print("[bold red]❌ Authentication failed. Please restart and try again.[/bold red]")
                return
        else:
            console.print("[bold red]❌ No MCP session ID found. Please restart the application.[/bold red]")
            return
        
        # 2. Configure and start the Gemini chat model with user's financial context
        user_context = create_detailed_user_context(user_financial_data) if user_financial_data else ""
        
        model = genai.GenerativeModel(
            model_name="gemini-2.5-pro",
            tools=[fi_tools],
            system_instruction=textwrap.dedent(f"""
                You are an intelligent financial advisor with access to real-time financial data and web search capabilities.
                
                {user_context}
                
                INTELLIGENT RESPONSE FRAMEWORK:
                
                STEP 1: ANALYZE THE QUESTION
                - Understand the user's intent and context
                - Determine what type of response they need
                - Identify if it's financial, general, educational, or mixed
                
                STEP 2: GATHER RELEVANT DATA
                - If question involves personal finances ("my portfolio", "should I invest", "can I afford") → Fetch their financial data
                - If question needs current information ("latest rates", "market trends", "current news") → Use web search
                - If question is educational ("how does X work") → Use web search for comprehensive info
                - If question is mixed → Use both financial data and web search as needed
                
                STEP 3: CONTEXTUALIZE WITH USER'S SITUATION
                - For financial questions: Always relate advice to their actual financial position
                - For general questions: Provide direct answers, optionally relate to their situation if relevant
                - For educational questions: Explain clearly, then show how it applies to them if applicable
                
                STEP 4: PROVIDE COMPREHENSIVE RESPONSE
                Based on question type, structure your response appropriately:
                
                🏦 PERSONAL FINANCIAL QUESTIONS:
                - Their current financial situation (using actual data)
                - Analysis of how this relates to their question
                - Specific recommendations with exact numbers/amounts
                - Actionable next steps (only when appropriate and relevant)
                
                🌍 GENERAL/CURRENT EVENTS QUESTIONS:
                - Direct, accurate answer to their question
                - Additional context or background information
                - Related implications or considerations
                - Optional: How this might relate to their financial situation if relevant
                
                📚 EDUCATIONAL/LEARNING QUESTIONS:
                - Clear explanation of the concept
                - Real-world examples and applications
                - How it works in practice
                - Optional: How this applies to their specific situation if relevant
                
                📊 MARKET/INVESTMENT QUESTIONS:
                - Current market information (from web search)
                - Their relevant holdings or position (from financial data, if applicable)
                - Analysis of impact on their situation
                - Specific recommendations based on their portfolio (if they have one)
                
                CORE PRINCIPLES:
                
                ✅ ALWAYS USE THE USER'S FINANCIAL CONTEXT when available in your system instructions
                ✅ When they ask about "my portfolio", "my investments", "my net worth" etc., refer to their actual data
                ✅ Provide personalized advice based on their real financial situation
                ✅ Reference specific numbers, accounts, and holdings from their profile
                ✅ Always be relevant to the specific question asked
                ✅ Use actual user data when their personal situation is relevant
                ✅ Provide direct answers without unnecessary fluff
                ✅ Be contextually intelligent - don't force financial data into non-financial questions
                ✅ Give comprehensive information that truly helps answer their question
                ✅ Adapt your response structure to match the question type
                ✅ Only provide structured formats when they enhance clarity
                ✅ Be natural and conversational, not robotic
                
                SMART TOOL USAGE:
                - Fetch financial data ONLY when the question involves their personal finances
                - Use web search for current information, trends, news, educational content
                - Combine tools intelligently when questions need both personal context and current info
                - Don't over-fetch data for simple questions
                
                RESPONSE STYLE:
                - Be conversational and natural
                - Adapt tone to question type (advisory, informational, educational)
                - Use simple language for complex concepts
                - Be accurate and up-to-date
                - Focus on being genuinely helpful rather than following rigid templates
                - Answer the question directly and comprehensively
                
                Remember: Your goal is to provide the most helpful, relevant, and accurate response to whatever the user is asking, using the right combination of their personal data and current information to give them exactly what they need.
            """)
        )
        chat = model.start_chat()

        # Initialize chat with user's financial context if available
        if user_financial_data:
            context_message = create_chat_context_message(user_financial_data)
            # Send an initial context message to establish the user's financial profile
            console.print("[dim]Setting up your financial context for AI assistant...[/dim]")
            chat.send_message(context_message)

        # Start the dots animation task in background
        global dots
        dots = ""
        asyncio.create_task(update_dots())

        # Show initial financial summary if data is available
        if user_financial_data:
            console.print("\n" + "=" * 60)
            console.print("[bold green]📊 YOUR FINANCIAL DASHBOARD[/bold green]")
            console.print("=" * 60)
            financial_summary = create_financial_summary_context(user_financial_data)
            console.print(Markdown(financial_summary))
            console.print("=" * 60)
            console.print("[dim]You can now ask any questions about your finances![/dim]")

        # 3. Main chat loop
        while True:
            prompt = console.input("\n[bold yellow]You: [/bold yellow]")
            
            # Check for exit commands first, before any processing
            if prompt.lower() in ["exit", "quit"]:
                console.print("[bold red]Goodbye![/bold red]")
                break
            
            # Special command for manual login/refresh authentication
            if prompt.lower() in ["login", "authenticate", "auth"]:
                console.print("[cyan]🔐 Refreshing authentication...[/cyan]")
                # Clear cached data first
                user_financial_data.clear()
                # Re-run authentication check
                test_result = execute_mcp_tool(console, http_session, "fetch_net_worth", skip_auth_retry=True)
                if not is_login_required(test_result) and "error" not in test_result:
                    console.print("[green]✅ Authentication successful![/green]")
                    user_financial_data = prefetch_all_user_data(console, http_session)
                    if user_financial_data:
                        # Update Gemini's context with fresh financial data
                        context_message = create_chat_context_message(user_financial_data)
                        chat.send_message(f"My financial data has been updated. Here's my current financial profile: {context_message}")
                        
                        financial_summary = create_financial_summary_context(user_financial_data)
                        console.print("\n" + "=" * 60)
                        console.print("[bold green]📊 YOUR FINANCIAL DASHBOARD[/bold green]")
                        console.print("=" * 60)
                        console.print(Markdown(financial_summary))
                        console.print("=" * 60)
                else:
                    console.print("[red]❌ Authentication failed. Please restart the application.[/red]")
                continue
            
            # Special command to refresh financial data
            if prompt.lower() in ["refresh", "refresh data", "update data"]:
                console.print("[cyan]🔄 Refreshing your financial data...[/cyan]")
                user_financial_data = prefetch_all_user_data(console, http_session)
                if user_financial_data:
                    # Update Gemini's context with fresh financial data
                    context_message = create_chat_context_message(user_financial_data)
                    chat.send_message(f"My financial data has been refreshed. Here's my updated financial profile: {context_message}")
                    
                    financial_summary = create_financial_summary_context(user_financial_data)
                    console.print("\n" + "=" * 60)
                    console.print("[bold green]📊 UPDATED FINANCIAL DASHBOARD[/bold green]")
                    console.print("=" * 60)
                    console.print(Markdown(financial_summary))
                    console.print("=" * 60)
                continue
            
            # Special command to show current dashboard
            if prompt.lower() in ["dashboard", "summary", "show data"]:
                if user_financial_data:
                    financial_summary = create_financial_summary_context(user_financial_data)
                    console.print("\n" + "=" * 60)
                    console.print("[bold green]📊 YOUR FINANCIAL DASHBOARD[/bold green]")
                    console.print("=" * 60)
                    console.print(Markdown(financial_summary))
                    console.print("=" * 60)
                else:
                    console.print("[yellow]No financial data available. Please complete authentication first.[/yellow]")
                continue
            
            console.print("[cyan]Gemini is thinking...[/cyan]", end="")
            response = chat.send_message(prompt)
            console.print(f"\r[cyan]Gemini is thinking... {dots}[/cyan]")

            # 4. Handle tool calls from Gemini (iteratively in case there are multiple rounds)
            max_tool_rounds = 3  # Prevent infinite loops
            current_round = 0
            
            while current_round < max_tool_rounds:
                current_round += 1
                
                # Check for function calls in the current response
                function_calls = []
                if response.candidates and response.candidates[0].content.parts:
                    for part in response.candidates[0].content.parts:
                        if hasattr(part, 'function_call') and part.function_call:
                            function_calls.append(part.function_call)

                if not function_calls:
                    break  # No more function calls to process
                    
                console.print(f"[cyan]Gemini wants to call {len(function_calls)} tool(s)[/cyan]")
                
                # Process each function call
                tool_responses = []
                for function_call in function_calls:
                    tool_name = function_call.name
                    console.print(f"[cyan]Calling tool: {tool_name}[/cyan]")

                    # Handle web search tool separately
                    if tool_name == WEB_SEARCH_TOOL_DEFINITION["name"]:
                        # Extract query from function call args
                        try:
                            query = ""
                            # Try to get the query parameter from the function call
                            if hasattr(function_call, 'args') and function_call.args:
                                # For Gemini function calls, args might be a dict-like object
                                if hasattr(function_call.args, 'query'):
                                    query = function_call.args.query
                                elif hasattr(function_call.args, 'get'):
                                    query = function_call.args.get('query', '')
                                elif isinstance(function_call.args, dict):
                                    query = function_call.args.get('query', '')
                            
                            # If no query found, use the user's original prompt as fallback
                            if not query:
                                query = prompt
                                
                            console.print(f"[cyan]Searching the web for: {query}[/cyan]")
                            # Run web search in a separate thread to avoid blocking asyncio
                            tool_result = await asyncio.to_thread(execute_web_search, console, query)
                        except Exception as e:
                            console.print(f"[red]Error with web search: {e}[/red]")
                            tool_result = {"error": f"Web search error: {str(e)}"}
                    
                    # Handle stock analysis tool
                    elif tool_name == STOCK_ANALYSIS_TOOL_DEFINITION["name"]:
                        try:
                            # Extract parameters from function call args
                            symbols = []
                            analysis_type = "basic"
                            period = "1y"
                            
                            if hasattr(function_call, 'args') and function_call.args:
                                if hasattr(function_call.args, 'symbols'):
                                    symbols = function_call.args.symbols or []
                                elif hasattr(function_call.args, 'get'):
                                    symbols = function_call.args.get('symbols', [])
                                elif isinstance(function_call.args, dict):
                                    symbols = function_call.args.get('symbols', [])
                                
                                if hasattr(function_call.args, 'analysis_type'):
                                    analysis_type = function_call.args.analysis_type or "basic"
                                elif hasattr(function_call.args, 'get'):
                                    analysis_type = function_call.args.get('analysis_type', 'basic')
                                elif isinstance(function_call.args, dict):
                                    analysis_type = function_call.args.get('analysis_type', 'basic')
                                
                                if hasattr(function_call.args, 'period'):
                                    period = function_call.args.period or "1y"
                                elif hasattr(function_call.args, 'get'):
                                    period = function_call.args.get('period', '1y')
                                elif isinstance(function_call.args, dict):
                                    period = function_call.args.get('period', '1y')
                            
                            console.print(f"[cyan]Analyzing stocks: {symbols} ({analysis_type})[/cyan]")
                            # Run stock analysis in a separate thread to avoid blocking asyncio
                            tool_result = await asyncio.to_thread(execute_stock_analysis, console, symbols, analysis_type, period)
                        except Exception as e:
                            console.print(f"[red]Error with stock analysis: {e}[/red]")
                            tool_result = {"error": f"Stock analysis error: {str(e)}"}
                    
                    # Handle mutual fund analysis tool
                    elif tool_name == MUTUAL_FUND_TOOL_DEFINITION["name"]:
                        try:
                            # Extract parameters from function call args
                            action = "search"
                            fund_codes = None
                            search_term = None
                            period_days = 365
                            
                            if hasattr(function_call, 'args') and function_call.args:
                                if hasattr(function_call.args, 'action'):
                                    action = function_call.args.action or "search"
                                elif hasattr(function_call.args, 'get'):
                                    action = function_call.args.get('action', 'search')
                                elif isinstance(function_call.args, dict):
                                    action = function_call.args.get('action', 'search')
                                
                                if hasattr(function_call.args, 'fund_codes'):
                                    fund_codes = function_call.args.fund_codes
                                elif hasattr(function_call.args, 'get'):
                                    fund_codes = function_call.args.get('fund_codes')
                                elif isinstance(function_call.args, dict):
                                    fund_codes = function_call.args.get('fund_codes')
                                
                                if hasattr(function_call.args, 'search_term'):
                                    search_term = function_call.args.search_term
                                elif hasattr(function_call.args, 'get'):
                                    search_term = function_call.args.get('search_term')
                                elif isinstance(function_call.args, dict):
                                    search_term = function_call.args.get('search_term')
                                
                                if hasattr(function_call.args, 'period_days'):
                                    period_days = function_call.args.period_days or 365
                                elif hasattr(function_call.args, 'get'):
                                    period_days = function_call.args.get('period_days', 365)
                                elif isinstance(function_call.args, dict):
                                    period_days = function_call.args.get('period_days', 365)
                            
                            console.print(f"[cyan]Mutual fund analysis: {action}[/cyan]")
                            # Run mutual fund analysis in a separate thread to avoid blocking asyncio
                            tool_result = await asyncio.to_thread(execute_mutual_fund_analysis, console, action, fund_codes, search_term, period_days)
                        except Exception as e:
                            console.print(f"[red]Error with mutual fund analysis: {e}[/red]")
                            tool_result = {"error": f"Mutual fund analysis error: {str(e)}"}
                    
                    else:
                        # Handle Fi MCP tools
                        # First check if we already have valid cached data (not login_required)
                        if tool_name in user_financial_data and not is_login_required(user_financial_data[tool_name]):
                            console.print(f"[green]Using cached data for {tool_name}[/green]")
                            tool_result = user_financial_data[tool_name]
                        else:
                            console.print(f"[cyan]Calling {tool_name}...[/cyan]", end="")
                            # Run the synchronous HTTP call in a separate thread to avoid blocking asyncio
                            tool_result = await asyncio.to_thread(
                                execute_mcp_tool, console, http_session, tool_name
                            )
                            # Cache the result for future use (only if it's not a login_required response)
                            if "error" not in tool_result and not is_login_required(tool_result):
                                user_financial_data[tool_name] = tool_result
                            console.print(f"\r[cyan]Calling {tool_name}... {dots}[/cyan]")

                    # Add the tool response
                    tool_responses.append(
                        genai.protos.Part(
                            function_response=genai.protos.FunctionResponse(
                                name=tool_name,
                                response=tool_result,
                            )
                        )
                    )

                # Send all tool results back to Gemini
                console.print("[cyan]Gemini is processing tool results...[/cyan]", end="")
                response = chat.send_message(tool_responses)
                console.print(f"\r[cyan]Gemini is processing tool results... {dots}[/cyan]")

            # 6. Print Gemini's final response
            console.print("\n[bold magenta]Gemini:[/bold magenta]")
            try:
                # Try to get text response
                if hasattr(response, 'text') and response.text:
                    console.print(Markdown(response.text))
                elif response.candidates and response.candidates[0].content.parts:
                    # Try to extract text from content parts
                    text_parts = []
                    for part in response.candidates[0].content.parts:
                        if hasattr(part, 'text') and part.text:
                            text_parts.append(part.text)
                    
                    if text_parts:
                        console.print(Markdown('\n'.join(text_parts)))
                    else:
                        console.print("[yellow]Gemini provided a response but no text content was found.[/yellow]")
                else:
                    console.print("[yellow]Gemini provided a response but it couldn't be displayed as text.[/yellow]")
            except Exception as display_error:
                console.print(f"[red]Error displaying response: {display_error}[/red]")
                console.print("[yellow]Gemini provided a response but there was an issue displaying it.[/yellow]")
            console.print("-" * 20)

    except Exception as e:
        console.print(f"[bold red]An error occurred: {e}[/bold red]")
        console.print("Please ensure the modified fi-mcp-dev server is running.")

async def update_dots():
    global dots
    while True:
        dots += "."
        if len(dots) > 3:
            dots = ""
        await asyncio.sleep(0.5)  # Adjust for speed of dots


def execute_mcp_tool(console: Console, http_session: requests.Session, tool_name: str, skip_auth_retry: bool = False) -> dict:
    """
    Calls a tool on the MCP server using the stored MCP session.
    This function is synchronous and should be run in a separate thread.
    
    Args:
        skip_auth_retry: If True, don't trigger automatic login retry on auth failure
    """
    global mcp_session_id
    import json
    
    try:
        # Use the stored MCP session ID
        if not mcp_session_id:
            return {"error": "No MCP session available. Please restart the client."}
        
        # Send the tool call request
        call_tool_request = {
            "jsonrpc": "2.0", 
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": {}
            }
        }
        
        # We need to use the MCP session ID for MCP protocol communication
        # but ensure the client session is authenticated via cookies
        headers = {
            "Content-Type": "application/json",
            "Mcp-Session-Id": mcp_session_id
        }
        
        tool_response = http_session.post(
            MCP_SERVER_BASE_URL,
            json=call_tool_request,
            headers=headers
        )
        
        if tool_response.status_code == 401:
            if not skip_auth_retry:
                console.print("\n[bold yellow]🔐 AUTHENTICATION REQUIRED[/bold yellow]")
                console.print("[cyan]You need to authenticate to access your financial data.[/cyan]")
                return handle_login_and_retry(console, http_session, tool_name)
            else:
                return {"error": "Authentication required"}
        
        tool_response.raise_for_status()
        result_data = tool_response.json()
        
        if "result" in result_data:
            result = result_data["result"]
            # Check if result contains login_required status using helper function
            if is_login_required(result):
                if not skip_auth_retry:
                    console.print("\n[bold yellow]🔐 AUTHENTICATION REQUIRED[/bold yellow]")
                    console.print("[cyan]You need to authenticate to access your financial data.[/cyan]")
                    return handle_login_and_retry(console, http_session, tool_name)
                else:
                    return {"status": "login_required"}
            
            return result
        elif "error" in result_data:
            return {"error": result_data["error"]}
        else:
            return {"error": "No valid response received from MCP server"}

    except requests.exceptions.RequestException as e:
        console.print(f"[bold red]Error calling tool {tool_name}: {e}[/bold red]")
        return {"error": str(e)}
    except json.JSONDecodeError:
        console.print(f"[bold red]Error: Server response was not valid JSON.[/bold red]")
        return {"error": "Invalid JSON response from server."}


def create_detailed_user_context(user_data: dict) -> str:
    """Create detailed user context for Gemini's system instruction."""
    if not user_data:
        return ""
    
    context_parts = []
    
    # Check if any data is available and not login_required
    has_valid_data = False
    for tool_name, data in user_data.items():
        if not is_login_required(data) and "error" not in data:
            has_valid_data = True
            break
    
    if not has_valid_data:
        return ""
    
    context_parts.append("=== USER'S CURRENT FINANCIAL PROFILE ===")
    context_parts.append("You have access to the following verified financial information about this user:")
    context_parts.append("")
    
    # Process each financial data source
    for tool_name, data in user_data.items():
        if is_login_required(data) or "error" in data:
            continue
            
        if tool_name == "fetch_net_worth":
            context_parts.append("💰 NET WORTH & ASSETS:")
            context_parts.append(format_financial_data(data, "net_worth"))
            context_parts.append("")
            
        elif tool_name == "fetch_credit_report":
            context_parts.append("📊 CREDIT PROFILE:")
            context_parts.append(format_financial_data(data, "credit"))
            context_parts.append("")
            
        elif tool_name == "fetch_epf_details":
            context_parts.append("🏛️ RETIREMENT SAVINGS (EPF):")
            context_parts.append(format_financial_data(data, "epf"))
            context_parts.append("")
            
        elif tool_name == "fetch_mf_transactions":
            context_parts.append("📈 INVESTMENT PORTFOLIO:")
            context_parts.append(format_financial_data(data, "investments"))
            context_parts.append("")
    
    context_parts.append("=== IMPORTANT CONTEXT GUIDELINES ===")
    context_parts.append("- This financial data is CURRENT and VERIFIED")
    context_parts.append("- Use this data to provide PERSONALIZED advice")
    context_parts.append("- Reference specific numbers and details when relevant")
    context_parts.append("- Consider their complete financial picture when giving recommendations")
    context_parts.append("- If asked about 'my' finances, use this data directly")
    context_parts.append("- Don't ask for financial information you already have")
    context_parts.append("")
    
    return "\n".join(context_parts)


def create_chat_context_message(user_data: dict) -> str:
    """Create a context message to establish user's financial profile in chat."""
    if not user_data:
        return "I'm ready to help with your financial questions. Please note that I don't have access to your current financial data yet."
    
    context_parts = []
    context_parts.append("I now have access to your complete financial profile. Here's a summary of your current situation:")
    context_parts.append("")
    
    # Process each financial data source
    for tool_name, data in user_data.items():
        if is_login_required(data) or "error" in data:
            continue
            
        if tool_name == "fetch_net_worth":
            context_parts.append("💰 Your Net Worth & Assets:")
            context_parts.append(format_financial_data_simple(data))
            context_parts.append("")
            
        elif tool_name == "fetch_credit_report":
            context_parts.append("📊 Your Credit Profile:")
            context_parts.append(format_financial_data_simple(data))
            context_parts.append("")
            
        elif tool_name == "fetch_epf_details":
            context_parts.append("🏛️ Your EPF Account:")
            context_parts.append(format_financial_data_simple(data))
            context_parts.append("")
            
        elif tool_name == "fetch_mf_transactions":
            context_parts.append("📈 Your Investment Portfolio:")
            context_parts.append(format_financial_data_simple(data))
            context_parts.append("")
    
    context_parts.append("I'm ready to help you with personalized financial advice based on your actual data. What would you like to know?")
    
    return "\n".join(context_parts)


def format_financial_data_simple(data: dict) -> str:
    """Simple formatting for chat context message."""
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
                    if isinstance(text_data, dict):
                        return f"  {text_data}"
                    else:
                        return f"  {text_data}"
                except (json.JSONDecodeError, KeyError):
                    return f"  {first_content['text']}"
    
    # Handle direct dict format
    elif isinstance(data, dict):
        return f"  {data}"
    
    return f"  {data}"


def format_financial_data(data: dict, data_type: str) -> str:
    """Format financial data for better context understanding."""
    if not data:
        return "- No data available"
    
    # Handle different response formats
    formatted_lines = []
    
    # If data has 'content' structure (MCP response format)
    if isinstance(data, dict) and "content" in data:
        content = data.get("content", [])
        if isinstance(content, list) and len(content) > 0:
            first_content = content[0]
            if isinstance(first_content, dict) and "text" in first_content:
                try:
                    # Try to parse JSON from text
                    text_data = json.loads(first_content["text"])
                    if isinstance(text_data, dict):
                        for key, value in text_data.items():
                            formatted_lines.append(f"  - {key}: {value}")
                    else:
                        formatted_lines.append(f"  - {text_data}")
                except (json.JSONDecodeError, KeyError):
                    # If not JSON, use the text as-is
                    formatted_lines.append(f"  - {first_content['text']}")
            else:
                formatted_lines.append(f"  - {first_content}")
    # Handle direct dict format
    elif isinstance(data, dict):
        for key, value in data.items():
            if key not in ["content", "error", "status"]:
                formatted_lines.append(f"  - {key}: {value}")
    # Handle other formats
    else:
        formatted_lines.append(f"  - {data}")
    
    return "\n".join(formatted_lines) if formatted_lines else "  - Data available but format unclear"


def create_financial_summary_context(user_data: dict) -> str:
    """Create a comprehensive financial summary from pre-fetched data."""
    if not user_data:
        return "No financial data available yet. Please complete authentication to access your financial information."
    
    summary_parts = []
    login_required = False
    
    # Net Worth Summary
    if "fetch_net_worth" in user_data:
        net_worth_data = user_data["fetch_net_worth"]
        if is_login_required(net_worth_data):
            login_required = True
        else:
            summary_parts.append("💰 **NET WORTH OVERVIEW:**")
            if isinstance(net_worth_data, dict):
                for key, value in net_worth_data.items():
                    summary_parts.append(f"- {key}: {value}")
            else:
                summary_parts.append(f"- {net_worth_data}")
    
    # Credit Report Summary
    if "fetch_credit_report" in user_data:
        credit_data = user_data["fetch_credit_report"]
        if is_login_required(credit_data):
            login_required = True
        else:
            summary_parts.append("\n📊 **CREDIT REPORT OVERVIEW:**")
            if isinstance(credit_data, dict):
                for key, value in credit_data.items():
                    summary_parts.append(f"- {key}: {value}")
            else:
                summary_parts.append(f"- {credit_data}")
    
    # EPF Details Summary
    if "fetch_epf_details" in user_data:
        epf_data = user_data["fetch_epf_details"]
        if is_login_required(epf_data):
            login_required = True
        else:
            summary_parts.append("\n🏛️ **EPF ACCOUNT OVERVIEW:**")
            if isinstance(epf_data, dict):
                for key, value in epf_data.items():
                    summary_parts.append(f"- {key}: {value}")
            else:
                summary_parts.append(f"- {epf_data}")
    
    # Mutual Funds Summary
    if "fetch_mf_transactions" in user_data:
        mf_data = user_data["fetch_mf_transactions"]
        if is_login_required(mf_data):
            login_required = True
        else:
            summary_parts.append("\n📈 **MUTUAL FUNDS OVERVIEW:**")
            if isinstance(mf_data, dict):
                for key, value in mf_data.items():
                    summary_parts.append(f"- {key}: {value}")
            else:
                summary_parts.append(f"- {mf_data}")
    
    if login_required:
        return "🔐 **AUTHENTICATION REQUIRED**\n\nPlease type 'login' to authenticate and access your financial data."
    
    return "\n".join(summary_parts) if summary_parts else "Financial data is being loaded..."


def prefetch_all_user_data(console: Console, http_session: requests.Session) -> dict:
    """Pre-fetch all available user data from MCP server after login."""
    console.print("[cyan]📊 Pre-fetching all your financial data...[/cyan]")
    
    user_data = {}
    failed_tools = []
    
    for tool_def in FI_TOOL_DEFINITIONS:
        tool_name = tool_def["name"]
        console.print(f"[dim]Fetching {tool_name}...[/dim]")
        
        try:
            result = execute_mcp_tool(console, http_session, tool_name, skip_auth_retry=True)
            # Check if result indicates login is required
            if is_login_required(result) or result.get("status") == "login_required":
                failed_tools.append(tool_name)
                console.print(f"[yellow]⚠ {tool_name}: Login required[/yellow]")
            elif "error" not in result:
                user_data[tool_name] = result
                console.print(f"[green]✓ {tool_name} data loaded[/green]")
            else:
                failed_tools.append(tool_name)
                console.print(f"[yellow]⚠ {tool_name}: {result.get('error', 'Unknown error')}[/yellow]")
        except Exception as e:
            failed_tools.append(tool_name)
            console.print(f"[red]✗ {tool_name} failed: {str(e)}[/red]")
    
    if user_data:
        console.print(f"[bold green]✅ Successfully loaded data from {len(user_data)} sources[/bold green]")
    
    if failed_tools:
        console.print(f"[yellow]⚠ Could not load data from: {', '.join(failed_tools)}[/yellow]")
    
    return user_data


def handle_login_and_retry(console: Console, http_session: requests.Session, tool_name: str) -> dict:
    """Handles the interactive login flow and retries the tool call using MCP protocol."""
    import webbrowser
    
    try:
        # Get session ID from cookies
        session_id = None
        for cookie in http_session.cookies:
            if cookie.name == "client_session_id":
                session_id = cookie.value
                break
        
        if not session_id:
            return {"error": "No session ID found. Please restart the client."}
        
        # Construct login URL using the original client session ID, not MCP session ID
        login_url = f"https://fi-mcp-service-709038576402.us-central1.run.app/mockWebPage?sessionId={session_id}"

        console.print("\n" + "🔐" * 25)
        console.print("[bold yellow]AUTHENTICATION REQUIRED[/bold yellow]")
        console.print("🔐" * 25)
        console.print("\n[bold red]YOU MUST LOGIN TO ACCESS YOUR FINANCIAL DATA[/bold red]")
        console.print(f"\n[bold blue]👉 LOGIN URL: {login_url}[/bold blue]")
        console.print("\n[yellow]Instructions:[/yellow]")
        console.print("1. Click the URL above or copy-paste it into your browser")
        console.print("2. Complete the login process")
        console.print("3. Return here and press Enter")
        console.print("\n" + "🔐" * 25 + "\n")
        
        # Optionally open browser automatically
        try:
            webbrowser.open(login_url)
            console.print("[green]✓ Login page opened in your browser[/green]")
        except:
            console.print("[yellow]Please manually open the URL above in your browser[/yellow]")
        
        input("--> Press Enter after you have logged in using the URL above...")

        # Clear cached data that might contain login_required responses
        global user_financial_data
        user_financial_data.clear()
        
        # Retry the original tool call with skip_auth_retry to avoid infinite loop
        console.print(f"[cyan]Retrying tool call: {tool_name}[/cyan]")
        result = execute_mcp_tool(console, http_session, tool_name, skip_auth_retry=True)
        
        # If still login required, return the login_required status
        if is_login_required(result):
            return {"status": "login_required", "message": "Login verification failed"}
        
        # Pre-fetch all user data on successful authentication
        if "error" not in result and not is_login_required(result):
            console.print("[green]✅ Authentication successful! Loading all financial data...[/green]")
            user_financial_data = prefetch_all_user_data(console, http_session)
        
        return result

    except Exception as e:
        console.print(f"[bold red]Error during login/retry: {e}[/bold red]")
        return {"error": str(e)}


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nExiting...")
