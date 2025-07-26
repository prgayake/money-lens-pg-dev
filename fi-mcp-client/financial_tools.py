"""
Financial Tools Module for Fi MCP Client
Provides comprehensive financial data tools for stocks and mutual funds analysis.
"""

import os
import requests
import yfinance as yf
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv
from datetime import datetime, timedelta
import pandas as pd
import json

# Load environment variables
load_dotenv()

# Stock Symbol Search Tool Definition
STOCK_SYMBOL_SEARCH_TOOL_DEFINITION = {
    "name": "stock_symbol_search",
    "description": "Search for stock symbols by company name. Use this when users ask for stock symbols by company name (e.g., 'get stock symbol for Apple' or 'find symbol for Reliance Industries'). This tool helps find the correct ticker symbols before analyzing stocks.",
    "parameters": {
        "type": "object",
        "properties": {
            "company_name": {
                "type": "string",
                "description": "The company name to search for (e.g., 'Apple Inc', 'Reliance Industries', 'Vintron Informatics')"
            },
            "market": {
                "type": "string",
                "enum": ["US", "IN", "AUTO"],
                "description": "Market to search in: 'US' for US stocks, 'IN' for Indian stocks, 'AUTO' to search both (default: 'AUTO')"
            }
        },
        "required": ["company_name"]
    }
}

# Stock Analysis Tool Definition
STOCK_ANALYSIS_TOOL_DEFINITION = {
    "name": "stock_analysis",
    "description": "Analyze individual stocks or multiple stocks using yfinance. Get current prices, historical data, financial metrics, company information, and performance analysis. Use this when users ask about stock performance, stock prices, financial ratios, or want to analyze their stock portfolio. If you need to find stock symbols first, use stock_symbol_search tool.",
    "parameters": {
        "type": "object",
        "properties": {
            "symbols": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of stock symbols to analyze (e.g., ['RELIANCE.NS', 'TCS.NS', 'AAPL']). Use .NS suffix for Indian stocks, .BO for BSE stocks."
            },
            "analysis_type": {
                "type": "string",
                "enum": ["basic", "detailed", "historical", "comparison", "portfolio"],
                "description": "Type of analysis: 'basic' for current price & basic info, 'detailed' for comprehensive analysis, 'historical' for price trends, 'comparison' for multiple stocks, 'portfolio' for portfolio analysis"
            },
            "period": {
                "type": "string",
                "enum": ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"],
                "description": "Time period for historical data analysis (default: '1y')"
            }
        },
        "required": ["symbols", "analysis_type"]
    }
}

# Mutual Fund Analysis Tool Definition
MUTUAL_FUND_TOOL_DEFINITION = {
    "name": "mutual_fund_analysis",
    "description": "Analyze mutual funds using Indian mutual fund data. Get NAV history, fund information, performance metrics, and compare multiple funds. Use this when users ask about mutual fund performance, NAV values, fund details, or want to analyze their MF portfolio.",
    "parameters": {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": ["search", "get_nav", "fund_details", "compare", "portfolio_analysis"],
                "description": "Action to perform: 'search' to find funds by name, 'get_nav' for NAV data, 'fund_details' for comprehensive info, 'compare' for multiple funds, 'portfolio_analysis' for user's MF portfolio"
            },
            "fund_codes": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of mutual fund scheme codes (e.g., ['120503', '119551']). Use search action first to find codes."
            },
            "search_term": {
                "type": "string",
                "description": "Search term to find mutual funds (e.g., 'SBI', 'HDFC', 'Axis Bank', 'Large Cap')"
            },
            "period_days": {
                "type": "integer",
                "description": "Number of days for historical NAV data (default: 365, max: 1825 for 5 years)"
            }
        },
        "required": ["action"]
    }
}

def execute_stock_symbol_search(console, company_name: str, market: str = "AUTO") -> Dict[str, Any]:
    """
    Search for stock symbols by company name
    """
    try:
        results = []
        
        # Common Indian company mappings
        indian_companies = {
            "reliance industries": "RELIANCE.NS",
            "reliance": "RELIANCE.NS", 
            "tata consultancy services": "TCS.NS",
            "tcs": "TCS.NS",
            "infosys": "INFY.NS",
            "hdfc bank": "HDFCBANK.NS",
            "icici bank": "ICICIBANK.NS",
            "state bank of india": "SBIN.NS",
            "sbi": "SBIN.NS",
            "bharti airtel": "BHARTIARTL.NS",
            "airtel": "BHARTIARTL.NS",
            "wipro": "WIPRO.NS",
            "maruti suzuki": "MARUTI.NS",
            "maruti": "MARUTI.NS",
            "asian paints": "ASIANPAINT.NS",
            "mahindra": "M&M.NS",
            "vintron informatics": "VINTRON.NS",
            "vintron": "VINTRON.NS"
        }
        
        # Common US company mappings
        us_companies = {
            "apple": "AAPL",
            "apple inc": "AAPL",
            "microsoft": "MSFT",
            "microsoft corporation": "MSFT",
            "google": "GOOGL",
            "alphabet": "GOOGL",
            "amazon": "AMZN",
            "amazon.com": "AMZN",
            "tesla": "TSLA",
            "tesla inc": "TSLA",
            "meta": "META",
            "facebook": "META",
            "netflix": "NFLX",
            "nvidia": "NVDA",
            "nvidia corporation": "NVDA"
        }
        
        company_lower = company_name.lower().strip()
        
        # Search in appropriate market
        if market in ["IN", "AUTO"]:
            if company_lower in indian_companies:
                symbol = indian_companies[company_lower]
                results.append({
                    "symbol": symbol,
                    "company_name": company_name,
                    "market": "NSE (India)",
                    "confidence": "high"
                })
        
        if market in ["US", "AUTO"]:
            if company_lower in us_companies:
                symbol = us_companies[company_lower]
                results.append({
                    "symbol": symbol,
                    "company_name": company_name,
                    "market": "NASDAQ/NYSE (US)",
                    "confidence": "high"
                })
        
        # If no exact match found, try partial matching
        if not results:
            for name, symbol in indian_companies.items():
                if company_lower in name or name in company_lower:
                    results.append({
                        "symbol": symbol,
                        "company_name": name.title(),
                        "market": "NSE (India)",
                        "confidence": "medium"
                    })
                    break
            
            for name, symbol in us_companies.items():
                if company_lower in name or name in company_lower:
                    results.append({
                        "symbol": symbol,
                        "company_name": name.title(),
                        "market": "NASDAQ/NYSE (US)",
                        "confidence": "medium"
                    })
                    break
        
        if results:
            result_text = f"🔍 **Stock Symbol Search Results for '{company_name}'**\\n\\n"
            for i, result in enumerate(results, 1):
                result_text += f"**{i}. {result['symbol']}** - {result['company_name']}\\n"
                result_text += f"   📍 Market: {result['market']}\\n"
                result_text += f"   🎯 Confidence: {result['confidence']}\\n\\n"
            
            result_text += "💡 **Next Steps:** Use the stock_analysis tool with the symbol(s) above to get detailed analysis.\\n"
            result_text += f"Example: Analyze {results[0]['symbol']} for detailed stock information."
        else:
            result_text = f"❌ **No stock symbols found for '{company_name}'**\\n\\n"
            result_text += "💡 **Suggestions:**\\n"
            result_text += "• Try using the full company name\\n"
            result_text += "• Check spelling and try variations\\n"
            result_text += "• For Indian stocks, try adding 'Limited' or 'Ltd'\\n"
            result_text += "• For US stocks, try adding 'Inc' or 'Corporation'\\n\\n"
            result_text += "📝 **Common symbols:**\\n"
            result_text += "• Indian: RELIANCE.NS, TCS.NS, INFY.NS, HDFCBANK.NS\\n"
            result_text += "• US: AAPL, MSFT, GOOGL, AMZN, TSLA"
        
        return {
            "content": [{
                "type": "text",
                "text": result_text
            }]
        }
        
    except Exception as e:
        error_msg = f"❌ Error searching for stock symbol: {str(e)}"
        return {
            "content": [{
                "type": "text",
                "text": error_msg
            }]
        }

def execute_stock_analysis(console, symbols: List[str], analysis_type: str, period: str = "1y") -> Dict[str, Any]:
    """
    Analyze stocks using yfinance library.
    
    Args:
        console: Rich console object for logging (can be None)
        symbols: List of stock symbols to analyze
        analysis_type: Type of analysis to perform
        period: Time period for historical data
        
    Returns:
        Dict containing analysis results in MCP-compatible format
    """
    try:
        if not symbols:
            return {"error": "No stock symbols provided"}
        
        if console:
            console.print(f"[dim]Analyzing stocks: {', '.join(symbols)}[/dim]")
        
        # Clean and validate symbols
        clean_symbols = [symbol.strip().upper() for symbol in symbols if symbol.strip()]
        
        if analysis_type == "basic":
            result_text = _get_basic_stock_info(clean_symbols)
        elif analysis_type == "detailed":
            result_text = _get_detailed_stock_analysis(clean_symbols)
        elif analysis_type == "historical":
            result_text = _get_historical_stock_data(clean_symbols, period)
        elif analysis_type == "comparison":
            result_text = _compare_stocks(clean_symbols, period)
        elif analysis_type == "portfolio":
            result_text = _analyze_stock_portfolio(clean_symbols, period)
        else:
            result_text = _get_basic_stock_info(clean_symbols)
        
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
            console.print(f"[bold red]Error in stock analysis: {e}[/bold red]")
        return {"error": f"Stock analysis error: {str(e)}"}


def execute_mutual_fund_analysis(console, action: str, fund_codes: List[str] = None, 
                                search_term: str = None, period_days: int = 365) -> Dict[str, Any]:
    """
    Analyze mutual funds using mfapi.in API.
    
    Args:
        console: Rich console object for logging (can be None)
        action: Action to perform
        fund_codes: List of fund scheme codes
        search_term: Search term for finding funds
        period_days: Number of days for historical data
        
    Returns:
        Dict containing analysis results in MCP-compatible format
    """
    try:
        if console:
            console.print(f"[dim]Mutual fund analysis: {action}[/dim]")
        
        if action == "search":
            if not search_term:
                return {"error": "Search term is required for search action"}
            result_text = _search_mutual_funds(search_term)
        elif action == "get_nav":
            if not fund_codes:
                return {"error": "Fund codes are required for NAV data"}
            result_text = _get_nav_data(fund_codes, period_days)
        elif action == "fund_details":
            if not fund_codes:
                return {"error": "Fund codes are required for fund details"}
            result_text = _get_fund_details(fund_codes)
        elif action == "compare":
            if not fund_codes or len(fund_codes) < 2:
                return {"error": "At least 2 fund codes are required for comparison"}
            result_text = _compare_mutual_funds(fund_codes, period_days)
        elif action == "portfolio_analysis":
            if not fund_codes:
                return {"error": "Fund codes are required for portfolio analysis"}
            result_text = _analyze_mf_portfolio(fund_codes, period_days)
        else:
            result_text = f"❌ Invalid action: {action}. Use: search, get_nav, fund_details, compare, or portfolio_analysis"
        
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
            console.print(f"[bold red]Error in mutual fund analysis: {e}[/bold red]")
        return {"error": f"Mutual fund analysis error: {str(e)}"}


def _get_basic_stock_info(symbols: List[str]) -> str:
    """Get basic stock information including current price and key metrics."""
    try:
        result_text = "📈 **Stock Analysis - Basic Information**\n\n"
        
        for symbol in symbols:
            try:
                stock = yf.Ticker(symbol)
                info = stock.info
                hist = stock.history(period="5d")
                
                if hist.empty:
                    result_text += f"❌ **{symbol}**: No data available\n\n"
                    continue
                
                current_price = hist['Close'].iloc[-1] if not hist.empty else 0
                prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
                change = current_price - prev_close
                change_pct = (change / prev_close * 100) if prev_close != 0 else 0
                
                change_icon = "🟢" if change >= 0 else "🔴"
                
                result_text += f"**{symbol}** {change_icon}\n"
                result_text += f"• Current Price: ₹{current_price:.2f}\n"
                result_text += f"• Change: {change:+.2f} ({change_pct:+.2f}%)\n"
                
                # Add company info if available
                if 'longName' in info:
                    result_text += f"• Company: {info.get('longName', 'N/A')}\n"
                if 'marketCap' in info:
                    market_cap = info.get('marketCap', 0)
                    if market_cap:
                        result_text += f"• Market Cap: ₹{market_cap/10000000:.2f} Cr\n"
                if 'sector' in info:
                    result_text += f"• Sector: {info.get('sector', 'N/A')}\n"
                
                result_text += "\n"
                
            except Exception as e:
                result_text += f"❌ **{symbol}**: Error fetching data - {str(e)}\n\n"
        
        result_text += f"📅 Data as of: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        result_text += "💡 Use 'detailed' analysis for comprehensive metrics"
        
        return result_text
        
    except Exception as e:
        return f"❌ Error in basic stock analysis: {str(e)}"


def _get_detailed_stock_analysis(symbols: List[str]) -> str:
    """Get detailed stock analysis with financial metrics and ratios."""
    try:
        result_text = "📊 **Detailed Stock Analysis**\n\n"
        
        for symbol in symbols:
            try:
                stock = yf.Ticker(symbol)
                info = stock.info
                hist = stock.history(period="1y")
                
                if hist.empty:
                    result_text += f"❌ **{symbol}**: No data available\n\n"
                    continue
                
                current_price = hist['Close'].iloc[-1]
                year_high = hist['High'].max()
                year_low = hist['Low'].min()
                avg_volume = hist['Volume'].mean()
                
                result_text += f"## **{symbol} - {info.get('longName', 'N/A')}**\n\n"
                
                # Price Information
                result_text += "### 💰 **Price Information**\n"
                result_text += f"• Current Price: ₹{current_price:.2f}\n"
                result_text += f"• 52W High: ₹{year_high:.2f}\n"
                result_text += f"• 52W Low: ₹{year_low:.2f}\n"
                result_text += f"• Price Position: {((current_price - year_low) / (year_high - year_low) * 100):.1f}% of 52W range\n\n"
                
                # Financial Metrics
                result_text += "### 📈 **Financial Metrics**\n"
                if 'marketCap' in info and info['marketCap']:
                    result_text += f"• Market Cap: ₹{info['marketCap']/10000000:.2f} Cr\n"
                if 'trailingPE' in info and info['trailingPE']:
                    result_text += f"• P/E Ratio: {info['trailingPE']:.2f}\n"
                if 'priceToBook' in info and info['priceToBook']:
                    result_text += f"• P/B Ratio: {info['priceToBook']:.2f}\n"
                if 'dividendYield' in info and info['dividendYield']:
                    result_text += f"• Dividend Yield: {info['dividendYield']*100:.2f}%\n"
                if 'beta' in info and info['beta']:
                    result_text += f"• Beta: {info['beta']:.2f}\n"
                
                result_text += f"• Avg Daily Volume: {avg_volume:,.0f}\n\n"
                
                # Company Information
                result_text += "### 🏢 **Company Info**\n"
                result_text += f"• Sector: {info.get('sector', 'N/A')}\n"
                result_text += f"• Industry: {info.get('industry', 'N/A')}\n"
                result_text += f"• Country: {info.get('country', 'N/A')}\n"
                if 'fullTimeEmployees' in info:
                    result_text += f"• Employees: {info['fullTimeEmployees']:,}\n"
                
                result_text += "\n---\n\n"
                
            except Exception as e:
                result_text += f"❌ **{symbol}**: Error in detailed analysis - {str(e)}\n\n"
        
        result_text += f"📅 Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        return result_text
        
    except Exception as e:
        return f"❌ Error in detailed stock analysis: {str(e)}"


def _get_historical_stock_data(symbols: List[str], period: str) -> str:
    """Get historical stock data and trends."""
    try:
        result_text = f"📈 **Historical Stock Analysis ({period.upper()})**\n\n"
        
        for symbol in symbols:
            try:
                stock = yf.Ticker(symbol)
                hist = stock.history(period=period)
                
                if hist.empty:
                    result_text += f"❌ **{symbol}**: No historical data available\n\n"
                    continue
                
                start_price = hist['Close'].iloc[0]
                end_price = hist['Close'].iloc[-1]
                total_return = ((end_price - start_price) / start_price) * 100
                
                # Calculate volatility
                returns = hist['Close'].pct_change().dropna()
                volatility = returns.std() * (252 ** 0.5) * 100  # Annualized volatility
                
                # Find best and worst days
                best_day = returns.max() * 100
                worst_day = returns.min() * 100
                
                result_text += f"## **{symbol}**\n"
                result_text += f"• Period: {hist.index[0].strftime('%Y-%m-%d')} to {hist.index[-1].strftime('%Y-%m-%d')}\n"
                result_text += f"• Start Price: ₹{start_price:.2f}\n"
                result_text += f"• End Price: ₹{end_price:.2f}\n"
                result_text += f"• Total Return: {total_return:+.2f}%\n"
                result_text += f"• Volatility: {volatility:.2f}%\n"
                result_text += f"• Best Day: +{best_day:.2f}%\n"
                result_text += f"• Worst Day: {worst_day:.2f}%\n"
                result_text += f"• Average Volume: {hist['Volume'].mean():,.0f}\n\n"
                
            except Exception as e:
                result_text += f"❌ **{symbol}**: Error in historical analysis - {str(e)}\n\n"
        
        return result_text
        
    except Exception as e:
        return f"❌ Error in historical stock analysis: {str(e)}"


def _compare_stocks(symbols: List[str], period: str) -> str:
    """Compare multiple stocks performance."""
    try:
        result_text = f"⚖️ **Stock Comparison Analysis ({period.upper()})**\n\n"
        
        stock_data = []
        
        for symbol in symbols:
            try:
                stock = yf.Ticker(symbol)
                hist = stock.history(period=period)
                info = stock.info
                
                if not hist.empty:
                    start_price = hist['Close'].iloc[0]
                    end_price = hist['Close'].iloc[-1]
                    total_return = ((end_price - start_price) / start_price) * 100
                    
                    returns = hist['Close'].pct_change().dropna()
                    volatility = returns.std() * (252 ** 0.5) * 100
                    
                    stock_data.append({
                        'symbol': symbol,
                        'name': info.get('longName', symbol),
                        'current_price': end_price,
                        'total_return': total_return,
                        'volatility': volatility,
                        'market_cap': info.get('marketCap', 0),
                        'pe_ratio': info.get('trailingPE', 0)
                    })
                    
            except Exception as e:
                result_text += f"❌ {symbol}: Error - {str(e)}\n"
        
        if not stock_data:
            return "❌ No valid stock data found for comparison"
        
        # Sort by total return
        stock_data.sort(key=lambda x: x['total_return'], reverse=True)
        
        result_text += "### 🏆 **Performance Ranking**\n\n"
        
        for i, stock in enumerate(stock_data, 1):
            emoji = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"{i}."
            result_text += f"{emoji} **{stock['symbol']}** - {stock['total_return']:+.2f}%\n"
        
        result_text += "\n### 📊 **Detailed Comparison**\n\n"
        result_text += "| Stock | Price | Return | Volatility | P/E | Market Cap |\n"
        result_text += "|-------|-------|--------|------------|-----|------------|\n"
        
        for stock in stock_data:
            market_cap_cr = (stock['market_cap'] / 10000000) if stock['market_cap'] else 0
            pe_str = f"{stock['pe_ratio']:.1f}" if stock['pe_ratio'] else "N/A"
            result_text += f"| {stock['symbol']} | ₹{stock['current_price']:.2f} | {stock['total_return']:+.1f}% | {stock['volatility']:.1f}% | {pe_str} | ₹{market_cap_cr:.0f}Cr |\n"
        
        # Summary insights
        best_performer = stock_data[0]
        worst_performer = stock_data[-1]
        
        result_text += f"\n### 💡 **Key Insights**\n"
        result_text += f"• 🏆 Best Performer: **{best_performer['symbol']}** ({best_performer['total_return']:+.2f}%)\n"
        result_text += f"• 📉 Worst Performer: **{worst_performer['symbol']}** ({worst_performer['total_return']:+.2f}%)\n"
        result_text += f"• 📈 Performance Gap: {best_performer['total_return'] - worst_performer['total_return']:.2f}%\n"
        
        return result_text
        
    except Exception as e:
        return f"❌ Error in stock comparison: {str(e)}"


def _analyze_stock_portfolio(symbols: List[str], period: str) -> str:
    """Analyze a portfolio of stocks."""
    try:
        result_text = f"💼 **Portfolio Analysis ({period.upper()})**\n\n"
        
        portfolio_data = []
        total_value = 0
        total_return = 0
        
        for symbol in symbols:
            try:
                stock = yf.Ticker(symbol)
                hist = stock.history(period=period)
                info = stock.info
                
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]
                    start_price = hist['Close'].iloc[0]
                    stock_return = ((current_price - start_price) / start_price) * 100
                    
                    portfolio_data.append({
                        'symbol': symbol,
                        'current_price': current_price,
                        'return': stock_return,
                        'market_cap': info.get('marketCap', 0)
                    })
                    
                    total_value += current_price
                    total_return += stock_return
                    
            except Exception as e:
                result_text += f"❌ {symbol}: Error - {str(e)}\n"
        
        if not portfolio_data:
            return "❌ No valid portfolio data found"
        
        avg_return = total_return / len(portfolio_data)
        
        result_text += f"### 📊 **Portfolio Overview**\n"
        result_text += f"• Total Stocks: {len(portfolio_data)}\n"
        result_text += f"• Average Return: {avg_return:+.2f}%\n"
        result_text += f"• Period: {period.upper()}\n\n"
        
        result_text += "### 📈 **Individual Stock Performance**\n\n"
        
        # Sort by performance
        portfolio_data.sort(key=lambda x: x['return'], reverse=True)
        
        gainers = [stock for stock in portfolio_data if stock['return'] > 0]
        losers = [stock for stock in portfolio_data if stock['return'] < 0]
        
        result_text += f"**🟢 Gainers ({len(gainers)} stocks):**\n"
        for stock in gainers:
            result_text += f"• {stock['symbol']}: +{stock['return']:.2f}% (₹{stock['current_price']:.2f})\n"
        
        if losers:
            result_text += f"\n**🔴 Losers ({len(losers)} stocks):**\n"
            for stock in losers:
                result_text += f"• {stock['symbol']}: {stock['return']:.2f}% (₹{stock['current_price']:.2f})\n"
        
        # Portfolio insights
        result_text += f"\n### 💡 **Portfolio Insights**\n"
        if gainers:
            best_stock = gainers[0]
            result_text += f"• 🏆 Top Performer: {best_stock['symbol']} (+{best_stock['return']:.2f}%)\n"
        
        if losers:
            worst_stock = losers[-1]
            result_text += f"• 📉 Worst Performer: {worst_stock['symbol']} ({worst_stock['return']:.2f}%)\n"
        
        result_text += f"• 📊 Win Rate: {len(gainers)}/{len(portfolio_data)} ({len(gainers)/len(portfolio_data)*100:.1f}%)\n"
        
        return result_text
        
    except Exception as e:
        return f"❌ Error in portfolio analysis: {str(e)}"


def _search_mutual_funds(search_term: str) -> str:
    """Search for mutual funds by name or AMC."""
    try:
        # Get all mutual funds
        response = requests.get("https://api.mfapi.in/mf", timeout=10)
        response.raise_for_status()
        funds_data = response.json()
        
        # Filter funds based on search term
        search_lower = search_term.lower()
        matching_funds = []
        
        for fund in funds_data:
            if search_lower in fund['schemeName'].lower():
                matching_funds.append(fund)
        
        if not matching_funds:
            return f"❌ No mutual funds found matching '{search_term}'"
        
        # Limit results to top 20 for readability
        matching_funds = matching_funds[:20]
        
        result_text = f"🔍 **Mutual Fund Search Results for '{search_term}'**\n\n"
        result_text += f"Found {len(matching_funds)} matching funds (showing top 20):\n\n"
        
        for fund in matching_funds:
            result_text += f"**{fund['schemeName']}**\n"
            result_text += f"• Scheme Code: `{fund['schemeCode']}`\n"
            result_text += f"• ISIN: {fund.get('isinGrowth', 'N/A')}\n\n"
        
        result_text += "💡 **Next Steps:**\n"
        result_text += "• Use the scheme code with 'get_nav' action for NAV data\n"
        result_text += "• Use 'fund_details' action for comprehensive information\n"
        result_text += "• Use 'compare' action to compare multiple funds"
        
        return result_text
        
    except requests.RequestException as e:
        return f"❌ Error fetching mutual fund data: {str(e)}"
    except Exception as e:
        return f"❌ Error in mutual fund search: {str(e)}"


def _get_nav_data(fund_codes: List[str], period_days: int) -> str:
    """Get NAV data for mutual funds."""
    try:
        result_text = f"📊 **Mutual Fund NAV Analysis**\n\n"
        
        for fund_code in fund_codes:
            try:
                # Get fund basic info
                fund_response = requests.get(f"https://api.mfapi.in/mf/{fund_code}", timeout=10)
                fund_response.raise_for_status()
                fund_data = fund_response.json()
                
                fund_name = fund_data['meta']['scheme_name']
                fund_category = fund_data['meta'].get('scheme_category', 'N/A')
                
                # Get NAV history
                nav_data = fund_data['data']
                
                if not nav_data:
                    result_text += f"❌ **{fund_name}**: No NAV data available\n\n"
                    continue
                
                # Filter data by period
                if period_days < len(nav_data):
                    nav_data = nav_data[:period_days]
                
                current_nav = float(nav_data[0]['nav'])
                old_nav = float(nav_data[-1]['nav'])
                total_return = ((current_nav - old_nav) / old_nav) * 100
                
                # Calculate additional metrics
                nav_values = [float(entry['nav']) for entry in nav_data]
                max_nav = max(nav_values)
                min_nav = min(nav_values)
                
                result_text += f"## **{fund_name}**\n"
                result_text += f"• **Scheme Code**: {fund_code}\n"
                result_text += f"• **Category**: {fund_category}\n"
                result_text += f"• **Current NAV**: ₹{current_nav:.4f}\n"
                result_text += f"• **Period Return**: {total_return:+.2f}% ({period_days} days)\n"
                result_text += f"• **Period High**: ₹{max_nav:.4f}\n"
                result_text += f"• **Period Low**: ₹{min_nav:.4f}\n"
                result_text += f"• **Last Updated**: {nav_data[0]['date']}\n\n"
                
                # Recent NAV trend (last 5 days)
                result_text += "**Recent NAV History:**\n"
                for i, entry in enumerate(nav_data[:5]):
                    result_text += f"• {entry['date']}: ₹{entry['nav']}\n"
                
                result_text += "\n---\n\n"
                
            except requests.RequestException as e:
                result_text += f"❌ **Fund {fund_code}**: API error - {str(e)}\n\n"
            except Exception as e:
                result_text += f"❌ **Fund {fund_code}**: Error - {str(e)}\n\n"
        
        result_text += f"📅 Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        return result_text
        
    except Exception as e:
        return f"❌ Error in NAV analysis: {str(e)}"


def _get_fund_details(fund_codes: List[str]) -> str:
    """Get detailed information about mutual funds."""
    try:
        result_text = "📋 **Mutual Fund Detailed Analysis**\n\n"
        
        for fund_code in fund_codes:
            try:
                # Get fund data
                response = requests.get(f"https://api.mfapi.in/mf/{fund_code}", timeout=10)
                response.raise_for_status()
                fund_data = response.json()
                
                meta = fund_data['meta']
                nav_data = fund_data['data']
                
                result_text += f"## **{meta['scheme_name']}**\n\n"
                
                # Basic Information
                result_text += "### 📊 **Basic Information**\n"
                result_text += f"• **Scheme Code**: {meta['scheme_code']}\n"
                result_text += f"• **Fund House**: {meta.get('fund_house', 'N/A')}\n"
                result_text += f"• **Category**: {meta.get('scheme_category', 'N/A')}\n"
                result_text += f"• **Type**: {meta.get('scheme_type', 'N/A')}\n\n"
                
                if nav_data:
                    current_nav = float(nav_data[0]['nav'])
                    result_text += f"• **Current NAV**: ₹{current_nav:.4f}\n"
                    result_text += f"• **Last Updated**: {nav_data[0]['date']}\n\n"
                    
                    # Performance analysis (if enough data)
                    if len(nav_data) >= 365:
                        # 1 year performance
                        year_ago_nav = float(nav_data[365]['nav'])
                        year_return = ((current_nav - year_ago_nav) / year_ago_nav) * 100
                        result_text += f"• **1 Year Return**: {year_return:+.2f}%\n"
                    
                    if len(nav_data) >= 30:
                        # 1 month performance
                        month_ago_nav = float(nav_data[30]['nav'])
                        month_return = ((current_nav - month_ago_nav) / month_ago_nav) * 100
                        result_text += f"• **1 Month Return**: {month_return:+.2f}%\n"
                    
                    # NAV range analysis
                    nav_values = [float(entry['nav']) for entry in nav_data[:365]]  # Last 1 year
                    if nav_values:
                        max_nav = max(nav_values)
                        min_nav = min(nav_values)
                        result_text += f"• **52W High**: ₹{max_nav:.4f}\n"
                        result_text += f"• **52W Low**: ₹{min_nav:.4f}\n"
                        result_text += f"• **Current vs High**: {((current_nav/max_nav - 1) * 100):+.2f}%\n"
                
                result_text += "\n---\n\n"
                
            except requests.RequestException as e:
                result_text += f"❌ **Fund {fund_code}**: API error - {str(e)}\n\n"
            except Exception as e:
                result_text += f"❌ **Fund {fund_code}**: Error - {str(e)}\n\n"
        
        return result_text
        
    except Exception as e:
        return f"❌ Error in fund details analysis: {str(e)}"


def _compare_mutual_funds(fund_codes: List[str], period_days: int) -> str:
    """Compare multiple mutual funds."""
    try:
        result_text = f"⚖️ **Mutual Fund Comparison ({period_days} days)**\n\n"
        
        fund_performance = []
        
        for fund_code in fund_codes:
            try:
                response = requests.get(f"https://api.mfapi.in/mf/{fund_code}", timeout=10)
                response.raise_for_status()
                fund_data = response.json()
                
                meta = fund_data['meta']
                nav_data = fund_data['data']
                
                if nav_data and len(nav_data) > period_days:
                    current_nav = float(nav_data[0]['nav'])
                    old_nav = float(nav_data[period_days]['nav'])
                    period_return = ((current_nav - old_nav) / old_nav) * 100
                    
                    fund_performance.append({
                        'code': fund_code,
                        'name': meta['scheme_name'][:50] + '...' if len(meta['scheme_name']) > 50 else meta['scheme_name'],
                        'fund_house': meta.get('fund_house', 'N/A'),
                        'category': meta.get('scheme_category', 'N/A'),
                        'current_nav': current_nav,
                        'period_return': period_return
                    })
                    
            except Exception as e:
                result_text += f"❌ Fund {fund_code}: Error - {str(e)}\n"
        
        if not fund_performance:
            return "❌ No valid fund data found for comparison"
        
        # Sort by performance
        fund_performance.sort(key=lambda x: x['period_return'], reverse=True)
        
        result_text += "### 🏆 **Performance Ranking**\n\n"
        
        for i, fund in enumerate(fund_performance, 1):
            emoji = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"{i}."
            result_text += f"{emoji} **{fund['name']}** - {fund['period_return']:+.2f}%\n"
            result_text += f"   Code: {fund['code']} | NAV: ₹{fund['current_nav']:.4f}\n\n"
        
        result_text += "### 📊 **Detailed Comparison**\n\n"
        result_text += "| Rank | Fund | Return | Current NAV | Fund House |\n"
        result_text += "|------|------|--------|-------------|------------|\n"
        
        for i, fund in enumerate(fund_performance, 1):
            short_name = fund['name'][:30] + '...' if len(fund['name']) > 30 else fund['name']
            result_text += f"| {i} | {short_name} | {fund['period_return']:+.2f}% | ₹{fund['current_nav']:.4f} | {fund['fund_house']} |\n"
        
        # Summary insights
        best_fund = fund_performance[0]
        worst_fund = fund_performance[-1]
        avg_return = sum(fund['period_return'] for fund in fund_performance) / len(fund_performance)
        
        result_text += f"\n### 💡 **Comparison Insights**\n"
        result_text += f"• 🏆 **Best Performer**: {best_fund['name']} ({best_fund['period_return']:+.2f}%)\n"
        result_text += f"• 📉 **Worst Performer**: {worst_fund['name']} ({worst_fund['period_return']:+.2f}%)\n"
        result_text += f"• 📊 **Average Return**: {avg_return:+.2f}%\n"
        result_text += f"• 📈 **Performance Spread**: {best_fund['period_return'] - worst_fund['period_return']:.2f}%\n"
        
        return result_text
        
    except Exception as e:
        return f"❌ Error in mutual fund comparison: {str(e)}"


def _analyze_mf_portfolio(fund_codes: List[str], period_days: int) -> str:
    """Analyze a portfolio of mutual funds."""
    try:
        result_text = f"💼 **Mutual Fund Portfolio Analysis ({period_days} days)**\n\n"
        
        portfolio_data = []
        total_return = 0
        
        for fund_code in fund_codes:
            try:
                response = requests.get(f"https://api.mfapi.in/mf/{fund_code}", timeout=10)
                response.raise_for_status()
                fund_data = response.json()
                
                meta = fund_data['meta']
                nav_data = fund_data['data']
                
                if nav_data and len(nav_data) > period_days:
                    current_nav = float(nav_data[0]['nav'])
                    old_nav = float(nav_data[period_days]['nav'])
                    fund_return = ((current_nav - old_nav) / old_nav) * 100
                    
                    portfolio_data.append({
                        'code': fund_code,
                        'name': meta['scheme_name'],
                        'category': meta.get('scheme_category', 'N/A'),
                        'current_nav': current_nav,
                        'return': fund_return,
                        'fund_house': meta.get('fund_house', 'N/A')
                    })
                    
                    total_return += fund_return
                    
            except Exception as e:
                result_text += f"❌ Fund {fund_code}: Error - {str(e)}\n"
        
        if not portfolio_data:
            return "❌ No valid portfolio data found"
        
        avg_return = total_return / len(portfolio_data)
        
        result_text += f"### 📊 **Portfolio Overview**\n"
        result_text += f"• **Total Funds**: {len(portfolio_data)}\n"
        result_text += f"• **Average Return**: {avg_return:+.2f}%\n"
        result_text += f"• **Analysis Period**: {period_days} days\n\n"
        
        # Categorize funds
        gainers = [fund for fund in portfolio_data if fund['return'] > 0]
        losers = [fund for fund in portfolio_data if fund['return'] < 0]
        
        # Sort by performance
        portfolio_data.sort(key=lambda x: x['return'], reverse=True)
        
        result_text += "### 📈 **Fund Performance**\n\n"
        
        if gainers:
            result_text += f"**🟢 Top Performers ({len(gainers)} funds):**\n"
            for fund in gainers[:5]:  # Show top 5
                short_name = fund['name'][:50] + '...' if len(fund['name']) > 50 else fund['name']
                result_text += f"• **{short_name}**: +{fund['return']:.2f}%\n"
                result_text += f"  NAV: ₹{fund['current_nav']:.4f} | Category: {fund['category']}\n\n"
        
        if losers:
            result_text += f"**🔴 Underperformers ({len(losers)} funds):**\n"
            for fund in losers[-5:]:  # Show bottom 5
                short_name = fund['name'][:50] + '...' if len(fund['name']) > 50 else fund['name']
                result_text += f"• **{short_name}**: {fund['return']:.2f}%\n"
                result_text += f"  NAV: ₹{fund['current_nav']:.4f} | Category: {fund['category']}\n\n"
        
        # Portfolio insights
        result_text += f"### 💡 **Portfolio Insights**\n"
        if portfolio_data:
            best_fund = portfolio_data[0]
            worst_fund = portfolio_data[-1]
            result_text += f"• 🏆 **Best Fund**: {best_fund['name'][:40]}... (+{best_fund['return']:.2f}%)\n"
            result_text += f"• 📉 **Worst Fund**: {worst_fund['name'][:40]}... ({worst_fund['return']:.2f}%)\n"
        
        result_text += f"• 📊 **Success Rate**: {len(gainers)}/{len(portfolio_data)} ({len(gainers)/len(portfolio_data)*100:.1f}%)\n"
        
        # Category analysis
        categories = {}
        for fund in portfolio_data:
            cat = fund['category']
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(fund['return'])
        
        if len(categories) > 1:
            result_text += f"\n### 🏷️ **Category Performance**\n"
            for category, returns in categories.items():
                avg_cat_return = sum(returns) / len(returns)
                result_text += f"• **{category}**: {avg_cat_return:+.2f}% avg ({len(returns)} funds)\n"
        
        return result_text
        
    except Exception as e:
        return f"❌ Error in portfolio analysis: {str(e)}"
