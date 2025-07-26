"""
Web Search Module for Fi MCP Client
Provides comprehensive web search functionality using multiple APIs and fallback strategies.
"""

import os
import requests
from urllib.parse import quote
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Enhanced search availability flag
ENHANCED_SEARCH_AVAILABLE = False

# Try to import enhanced financial search if available
try:
    from financial_search import enhanced_financial_search
    ENHANCED_SEARCH_AVAILABLE = True
except ImportError:
    # Define a placeholder function if not available
    def enhanced_financial_search(query: str) -> str:
        return f"Enhanced financial search not available for: {query}"

# Web Search Tool Definition
WEB_SEARCH_TOOL_DEFINITION = {
    "name": "web_search",
    "description": "Search the web for latest real-time information including current interest rates, market trends, financial news, current events, policy updates, and any information that requires up-to-date data. Use this when you need current information that is not available in the user's personal financial data.",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query for finding current information. Examples: 'current home loan interest rates India', 'latest RBI policy rates', 'current inflation rate India', 'stock market news today', etc."
            }
        },
        "required": ["query"]
    }
}


def execute_web_search(console, query: str) -> Dict[str, Any]:
    """
    Performs a comprehensive web search using Google Custom Search API as primary source.
    This function is synchronous and should be run in a separate thread.
    
    Args:
        console: Rich console object for logging (can be None)
        query: Search query string
        
    Returns:
        Dict containing search results in MCP-compatible format
    """
    try:
        if not query:
            return {"error": "No search query provided"}
        
        if console:
            console.print(f"[dim]Searching the web for: {query}[/dim]")
        
        # Strategy 1: Google Custom Search (Primary - Your preferred API)
        google_result = _try_google_search(query)
        if google_result:
            return {
                "content": [
                    {
                        "type": "text",
                        "text": google_result
                    }
                ]
            }
        
        # Strategy 2: SerpAPI (Secondary - Fallback option)
        serp_result = _try_serp_search(query)
        if serp_result:
            return {
                "content": [
                    {
                        "type": "text", 
                        "text": serp_result
                    }
                ]
            }
        
        # Strategy 3: Enhanced financial search for financial queries
        if ENHANCED_SEARCH_AVAILABLE and _is_financial_query(query):
            try:
                result_text = enhanced_financial_search(query)
                if result_text and len(result_text.strip()) > 50:
                    return {
                        "content": [
                            {
                                "type": "text",
                                "text": result_text
                            }
                        ]
                    }
            except Exception as e:
                if console:
                    console.print(f"[yellow]Enhanced financial search failed: {e}[/yellow]")
        
        # Strategy 4: Create helpful response based on query type
        result_text = _create_comprehensive_search_response(query)
        
        return {
            "content": [
                {
                    "type": "text",
                    "text": result_text
                }
            ]
        }
        
    except Exception as e:
        if console:
            console.print(f"[bold red]Unexpected error during web search: {e}[/bold red]")
        return {"error": f"Unexpected error: {str(e)}"}


def _is_financial_query(query: str) -> bool:
    """Check if query is specifically about financial markets/stocks."""
    financial_keywords = ['stock', 'share', 'ticker', 'mutual fund', 'mf', 'nav', 'nifty', 'sensex', 'trading']
    return any(keyword in query.lower() for keyword in financial_keywords)


def _try_google_search(query: str) -> str:
    """Try Google Custom Search API if credentials are available."""
    try:
        google_api_key = os.getenv("GOOGLE_SEARCH_API_KEY")
        google_cse_id = os.getenv("GOOGLE_CSE_ID")
        
        if not google_api_key or not google_cse_id:
            # Provide demo content when API keys aren't configured
            return _provide_demo_search_result(query)
        
        search_url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": google_api_key,
            "cx": google_cse_id,
            "q": query,
            "num": 5,
            "dateRestrict": "m1"  # Prefer results from last month for freshness
        }
        
        response = requests.get(search_url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        if "items" in data and len(data["items"]) > 0:
            result_text = f"🔍 Current Web Search Results for: '{query}'\n"
            result_text += f"📅 Search performed on: {data.get('searchInformation', {}).get('formattedSearchTime', 'N/A')} seconds\n\n"
            
            for i, item in enumerate(data["items"][:4], 1):  # Show top 4 results
                title = item.get('title', 'No title')
                snippet = item.get('snippet', 'No description available')
                link = item.get('link', '#')
                
                # Clean up the snippet
                snippet = snippet.replace('\n', ' ').strip()
                if len(snippet) > 200:
                    snippet = snippet[:200] + "..."
                
                result_text += f"{i}. **{title}**\n"
                result_text += f"   {snippet}\n"
                result_text += f"   🔗 Source: {link}\n\n"
            
            # Add search metadata
            search_info = data.get('searchInformation', {})
            total_results = search_info.get('formattedTotalResults', 'Unknown')
            result_text += f"📊 Total results found: {total_results}\n"
            result_text += "⚡ This is real-time web search data from Google\n"
            result_text += "💡 For most current information, click on the source links above"
            
            return result_text
        
        return ""
    except requests.RequestException as e:
        # Return a helpful message instead of None for API errors
        return f"⚠️ Google Search API temporarily unavailable: {str(e)}\nTrying alternative search methods..."
    except Exception as e:
        # Return a helpful message for other errors
        return f"⚠️ Search temporarily unavailable: {str(e)}\nPlease try rephrasing your query."


def _try_serp_search(query: str) -> str:
    """Try SerpAPI for search results."""
    try:
        serp_api_key = os.getenv("SERP_API_KEY")
        if not serp_api_key:
            return ""
        
        search_url = "https://serpapi.com/search"
        params = {
            "api_key": serp_api_key,
            "q": query,
            "engine": "google",
            "num": 5,
            "gl": "in",  # Country: India
            "hl": "en"   # Language: English
        }
        
        response = requests.get(search_url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        if "organic_results" in data and len(data["organic_results"]) > 0:
            result_text = f"🔍 Web Search Results for: '{query}'\n"
            result_text += "🌐 Powered by SerpAPI\n\n"
            
            for i, item in enumerate(data["organic_results"][:4], 1):
                title = item.get('title', 'No title')
                snippet = item.get('snippet', 'No description available')
                link = item.get('link', '#')
                
                # Clean up snippet
                snippet = snippet.replace('\n', ' ').strip()
                if len(snippet) > 200:
                    snippet = snippet[:200] + "..."
                
                result_text += f"{i}. **{title}**\n"
                result_text += f"   {snippet}\n"
                result_text += f"   🔗 {link}\n\n"
            
            result_text += "⚡ Real-time search results\n"
            result_text += "📍 Results localized for India"
            return result_text
        
        return ""
    except requests.RequestException as e:
        return f"⚠️ SerpAPI temporarily unavailable: {str(e)}"
    except Exception as e:
        return f"⚠️ Search error: {str(e)}"


def _create_comprehensive_search_response(query: str) -> str:
    """Create a comprehensive response for any type of query when APIs are not available."""
    
    query_lower = query.lower()
    result = f"Search Results for: {query}\n\n"
    
    # Interest rates queries
    if any(word in query_lower for word in ['interest rate', 'loan rate', 'home loan', 'personal loan', 'fd rate', 'fixed deposit']):
        result += "🏦 For Current Interest Rates:\n"
        result += "• Bank websites: SBI, HDFC, ICICI, Axis Bank for latest rates\n"
        result += "• RBI website (rbi.org.in) for policy rates\n"
        result += "• BankBazaar (bankbazaar.com) for rate comparison\n"
        result += "• PaisaBazaar (paisabazaar.com) for loan rates\n"
        result += "• Economic Times Banking section for rate updates\n\n"
    
    # RBI/Policy queries
    elif any(word in query_lower for word in ['rbi', 'policy', 'repo rate', 'monetary policy', 'inflation']):
        result += "🏛️ For RBI Policy & Economic Data:\n"
        result += "• RBI Official Website: rbi.org.in\n"
        result += "• RBI Press Releases for latest policy decisions\n"
        result += "• Economic Times Policy section\n"
        result += "• Ministry of Statistics (mospi.gov.in) for inflation data\n"
        result += "• Bloomberg India for policy analysis\n\n"
    
    # Stock/Market queries  
    elif any(word in query_lower for word in ['stock', 'share', 'market', 'nifty', 'sensex']):
        result += "📈 For Stock Market Information:\n"
        result += "• NSE India (nseindia.com) for real-time data\n"
        result += "• BSE India (bseindia.com) for market updates\n"
        result += "• MoneyControl (moneycontrol.com) for analysis\n"
        result += "• Economic Times Markets section\n"
        result += "• Yahoo Finance for global perspective\n\n"
    
    # Mutual Fund queries
    elif any(word in query_lower for word in ['mutual fund', 'mf', 'fund', 'nav']):
        result += "📊 For Mutual Fund Information:\n"
        result += "• AMFI (amfiindia.com) for official NAV data\n"
        result += "• Value Research (valueresearchonline.com) for analysis\n"
        result += "• Morningstar India (morningstar.in) for ratings\n"
        result += "• Fund house websites for detailed information\n\n"
    
    # Tax queries
    elif any(word in query_lower for word in ['tax', 'income tax', 'gst', 'tds']):
        result += "💰 For Tax Information:\n"
        result += "• Income Tax Department (incometax.gov.in)\n"
        result += "• GST Portal (gst.gov.in)\n"
        result += "• ClearTax (cleartax.in) for tax guidance\n"
        result += "• Economic Times Tax section\n\n"
    
    # Insurance queries
    elif any(word in query_lower for word in ['insurance', 'health insurance', 'life insurance', 'term insurance']):
        result += "🛡️ For Insurance Information:\n"
        result += "• IRDAI (irdai.gov.in) for regulations\n"
        result += "• PolicyBazaar (policybazaar.com) for comparison\n"
        result += "• Insurance company websites\n"
        result += "• Economic Times Insurance section\n\n"
    
    # General financial news
    elif any(word in query_lower for word in ['news', 'latest', 'current', 'today', 'update']):
        result += "📰 For Latest Financial News:\n"
        result += "• Economic Times (economictimes.indiatimes.com)\n"
        result += "• Business Standard (business-standard.com)\n"
        result += "• Mint (livemint.com)\n"
        result += "• MoneyControl News section\n"
        result += "• Bloomberg India for global perspective\n\n"
    
    # General queries
    else:
        result += "🔍 For General Information:\n"
        result += "• Use specific financial terms for better guidance\n"
        result += "• Include keywords like 'current', 'latest', 'today' for recent data\n"
        result += "• Specify location (India/Mumbai/Delhi) for localized information\n"
        result += "• Check official websites for authoritative information\n\n"
    
    result += f"Search Query: {query}\n\n"
    result += "⚡ Note: For real-time results, your Google Custom Search API is configured.\n"
    result += "The system will attempt to use it for live search results when possible.\n\n"
    result += "💡 Pro Tip: Be specific in your queries for better results:\n"
    result += "• 'Current home loan interest rates in India'\n"
    result += "• 'Latest RBI repo rate 2025'\n"
    result += "• 'Best mutual funds to invest today'\n"
    result += "• 'Current inflation rate India January 2025'"
    
    return result


def _try_financial_scraping(query: str) -> Optional[str]:
    """Try to scrape financial websites for specific data."""
    try:
        # Extract potential ticker symbols
        query_words = query.upper().split()
        
        # Common financial data patterns
        if any(word in query.lower() for word in ['stock', 'share', 'price', 'market']):
            # Try to find ticker-like patterns (3-5 uppercase letters)
            potential_tickers = [word for word in query_words if len(word) >= 2 and len(word) <= 5 and word.isalpha()]
            
            if potential_tickers:
                ticker = potential_tickers[0]
                return _scrape_yahoo_finance(ticker, query)
        
        # For mutual fund queries
        if any(word in query.lower() for word in ['mutual fund', 'mf', 'fund', 'nav']):
            return _search_mutual_fund_info(query)
        
        # For general market queries
        if any(word in query.lower() for word in ['nifty', 'sensex', 'index', 'market']):
            return _get_market_index_info(query)
        
        return None
    except Exception:
        return None


def _scrape_yahoo_finance(ticker: str, original_query: str) -> Optional[str]:
    """Scrape basic info from Yahoo Finance."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Try Yahoo Finance
        url = f"https://finance.yahoo.com/quote/{ticker}"
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            # Basic parsing - in production, you'd use BeautifulSoup
            content = response.text
            
            result_text = f"Financial information for {ticker} (from {original_query}):\n\n"
            
            # Look for price patterns (very basic - in production use proper HTML parsing)
            if "regularMarketPrice" in content:
                result_text += f"• Found price data for {ticker}\n"
            
            result_text += f"• Current data available at: {url}\n"
            result_text += f"• Search was for: {original_query}\n"
            result_text += f"• Symbol analyzed: {ticker}\n\n"
            result_text += "Note: For real-time accurate prices, please visit the financial website directly or use a dedicated financial API."
            
            return result_text
        
        return None
    except Exception:
        return None


def _search_mutual_fund_info(query: str) -> str:
    """Search for mutual fund information."""
    result_text = f"Mutual Fund Search Results for: {query}\n\n"
    result_text += "Mutual fund information searched. For detailed NAV, performance, and fund details:\n\n"
    result_text += "• Visit AMFI website (www.amfiindia.com) for official NAV data\n"
    result_text += "• Check fund house websites for detailed performance\n"
    result_text += "• Use Morningstar India or ValueResearch for ratings and analysis\n"
    result_text += "• Your broker/investment platform for personalized data\n\n"
    result_text += f"Search query: {query}\n"
    result_text += "Note: Mutual fund data requires real-time feeds from official sources."
    
    return result_text


def _get_market_index_info(query: str) -> str:
    """Get market index information."""
    result_text = f"Market Index Information for: {query}\n\n"
    result_text += "Market index data searched. Current market information:\n\n"
    result_text += "• NSE website (www.nseindia.com) for Nifty indices\n"
    result_text += "• BSE website (www.bseindia.com) for Sensex data\n"
    result_text += "• Financial news websites for market commentary\n"
    result_text += "• Trading platforms for real-time index values\n\n"
    result_text += f"Search query: {query}\n"
    result_text += "Note: Market indices require real-time data feeds for accurate values."
    
    return result_text


def _try_duckduckgo_search(query: str) -> Optional[str]:
    """Enhanced DuckDuckGo search with better result parsing."""
    try:
        search_url = "https://api.duckduckgo.com/"
        params = {
            "q": query,
            "format": "json",
            "no_html": "1",
            "skip_disambig": "1"
        }
        
        response = requests.get(search_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        result_text = f"Search results for '{query}':\n\n"
        found_content = False
        
        # Check for instant answer
        if data.get("Abstract"):
            result_text += f"Summary: {data['Abstract']}\n\n"
            found_content = True
        
        # Check for definition
        if data.get("Definition"):
            result_text += f"Definition: {data['Definition']}\n\n"
            found_content = True
        
        # Check for related topics with better formatting
        if data.get("RelatedTopics"):
            topics = data["RelatedTopics"][:3]
            if topics:
                result_text += "Related Information:\n"
                for i, topic in enumerate(topics, 1):
                    if isinstance(topic, dict) and topic.get("Text"):
                        result_text += f"{i}. {topic['Text']}\n"
                result_text += "\n"
                found_content = True
        
        if found_content:
            result_text += f"Search completed for: {query}"
            return result_text
        
        return None
    except Exception:
        return None


def _provide_demo_search_result(query: str) -> str:
    """Provide a demonstration of web search capabilities when APIs aren't configured."""
    
    # Demo responses for common financial queries
    demo_responses = {
        "fd": "🔍 **Current Fixed Deposit Interest Rates in India (Demo)**\n\n**Top Banks FD Rates:**\n• SBI: 6.8% - 7.0% (1-2 years)\n• HDFC Bank: 7.0% - 7.25% (1-2 years)\n• ICICI Bank: 7.0% - 7.1% (1-2 years)\n• Axis Bank: 7.25% - 7.5% (1-2 years)\n• Yes Bank: 7.75% - 8.0% (1-2 years)\n\n📅 Rates as of July 2025\n💡 **Note**: This is demo data. Real web search would fetch live rates from bank websites.",
        
        "interest": "🔍 **Current Interest Rates in India (Demo)**\n\n**RBI Policy Rates:**\n• Repo Rate: 6.5%\n• Reverse Repo Rate: 3.35%\n• CRR: 4.5%\n• SLR: 18.0%\n\n**Lending Rates:**\n• Home Loans: 8.5% - 9.5%\n• Personal Loans: 10.5% - 24%\n• Car Loans: 8.5% - 12%\n\n📅 Updated July 2025\n💡 **Note**: This is demo data showing web search capability.",
        
        "gold": "🔍 **Current Gold Prices in India (Demo)**\n\n**Today's Gold Rates:**\n• 24K Gold: ₹6,845 per gram\n• 22K Gold: ₹6,275 per gram\n• 18K Gold: ₹5,134 per gram\n\n**Gold ETF Performance:**\n• 1 Year Return: +12.5%\n• 6 Month Return: +8.2%\n• YTD Return: +15.3%\n\n📅 Rates as of July 21, 2025\n💡 **Note**: This is demo data. Real search would fetch live gold prices.",
        
        "stock": "🔍 **Indian Stock Market Update (Demo)**\n\n**Market Indices:**\n• Nifty 50: 24,650 (+125 pts, +0.5%)\n• Sensex: 81,200 (+400 pts, +0.5%)\n• Bank Nifty: 52,800 (+200 pts, +0.4%)\n\n**Top Gainers:**\n• Reliance: +2.3%\n• TCS: +1.8%\n• HDFC Bank: +1.5%\n\n📅 Market data for July 21, 2025\n💡 **Note**: Demo market data showing web search integration."
    }
    
    # Find the most relevant demo response
    query_lower = query.lower()
    
    if any(word in query_lower for word in ['fd', 'fixed deposit', 'deposit rate']):
        return demo_responses['fd']
    elif any(word in query_lower for word in ['interest rate', 'repo rate', 'policy rate']):
        return demo_responses['interest']
    elif any(word in query_lower for word in ['gold', 'gold price', 'gold etf']):
        return demo_responses['gold']
    elif any(word in query_lower for word in ['stock', 'market', 'nifty', 'sensex']):
        return demo_responses['stock']
    else:
        # Generic demo response
        return f"🔍 **Web Search Demo for: '{query}'**\n\n📊 **Search Results:**\n1. **Current Information Found**\n   Latest data related to your query would appear here\n   🔗 Source: Live web search results\n\n2. **Real-time Updates**\n   Fresh information from reliable sources\n   🔗 Source: Financial news websites\n\n3. **Expert Analysis**\n   Professional insights and recommendations\n   🔗 Source: Industry reports\n\n⚡ **This demonstrates web search capability**\nReal searches would fetch live data from:\n• Financial websites\n• News sources  \n• Government portals\n• Bank websites\n\n💡 **Note**: Configure GOOGLE_SEARCH_API_KEY and GOOGLE_CSE_ID for live web search."
