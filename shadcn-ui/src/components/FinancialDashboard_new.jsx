import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  TrendingUp, 
  PieChart, 
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Building,
  Home,
  Car,
  CreditCard,
  Landmark,
  Briefcase,
  Wallet,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Moon,
  Sun
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  AreaChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  Bar,
  Line,
  Pie,
  RadialBarChart,
  RadialBar
} from "recharts";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8001";

// Fi Money inspired color scheme
const CHART_COLORS = {
  primary: ['#00D4AA', '#1E40AF', '#7C3AED', '#DC2626', '#059669', '#EA580C', '#0891B2', '#65A30D'],
  green: ['#ECFDF5', '#D1FAE5', '#A7F3D0', '#6EE7B7', '#34D399', '#10B981', '#059669', '#047857'],
  red: ['#FEF2F2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#B91C1C', '#991B1B'],
  blue: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8'],
  fi: {
    primary: '#00D4AA',    // Fi Money primary green
    secondary: '#1E293B',  // Dark slate
    accent: '#0EA5E9',     // Sky blue
    success: '#10B981',    // Emerald
    warning: '#F59E0B',    // Amber
    error: '#EF4444',      // Red
    muted: '#64748B'       // Slate
  }
};

// Theme context for dark/light mode
const useTheme = () => {
  const [theme, setTheme] = useState('light');
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('money-lens-theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('money-lens-theme', theme);
  }, [theme]);

  return { theme, toggleTheme };
};

// Utility functions
const formatCurrency = (amount) => {
  if (amount == null) return "₹0";
  const num = Number(amount);
  if (isNaN(num)) return "₹0";
  
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(1)}Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(1)}L`;
  } else if (num >= 1000) {
    return `₹${(num / 1000).toFixed(1)}K`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
};

const formatPercentage = (value) => {
  if (value == null) return "0%";
  return `${Number(value).toFixed(1)}%`;
};

const getChangeIndicator = (value) => {
  if (!value || value === 0) return null;
  const isPositive = value > 0;
  return (
    <div className={`flex items-center text-sm ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}%
    </div>
  );
};

const getCategoryIcon = (category) => {
  const iconMap = {
    'mutual_funds': <PieChart className="w-4 h-4 text-emerald-600" />,
    'stocks': <TrendingUp className="w-4 h-4 text-blue-600" />,
    'bank_accounts': <Landmark className="w-4 h-4 text-slate-600" />,
    'real_estate': <Home className="w-4 h-4 text-amber-600" />,
    'vehicles': <Car className="w-4 h-4 text-gray-600" />,
    'epf': <Briefcase className="w-4 h-4 text-purple-600" />,
    'credit_cards': <CreditCard className="w-4 h-4 text-red-600" />,
    'loans': <Building className="w-4 h-4 text-orange-600" />,
    'insurance': <Shield className="w-4 h-4 text-indigo-600" />,
    'cash': <Wallet className="w-4 h-4 text-green-600" />,
    'Food': <DollarSign className="w-4 h-4 text-green-600" />,
    'Transportation': <Car className="w-4 h-4 text-blue-600" />,
    'Shopping': <Building className="w-4 h-4 text-purple-600" />,
    'Entertainment': <Target className="w-4 h-4 text-pink-600" />,
    'Bills': <CreditCard className="w-4 h-4 text-red-600" />,
    'Income': <ArrowUpRight className="w-4 h-4 text-emerald-600" />,
    'Finance': <Landmark className="w-4 h-4 text-blue-700" />,
    'Healthcare': <Shield className="w-4 h-4 text-red-500" />,
    'Education': <Briefcase className="w-4 h-4 text-indigo-600" />,
    'General': <DollarSign className="w-4 h-4 text-gray-600" />
  };
  return iconMap[category] || <DollarSign className="w-4 h-4 text-gray-600" />;
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${formatCurrency(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Individual Chart Components
const NetWorthChart = ({ data, theme }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
        Loading net worth data...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
        <XAxis 
          dataKey="month" 
          stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
          fontSize={12}
        />
        <YAxis 
          stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
          fontSize={12}
          tickFormatter={formatCurrency}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={CHART_COLORS.fi.primary} 
          fill={CHART_COLORS.fi.primary}
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const AssetAllocationChart = ({ data, theme }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
        Loading asset allocation...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS.primary[index % CHART_COLORS.primary.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value)} />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

const SpendingTrendsChart = ({ data, theme }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
        Loading spending trends...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
        <XAxis 
          dataKey="category" 
          stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
          fontSize={12}
        />
        <YAxis 
          stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
          fontSize={12}
          tickFormatter={formatCurrency}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="amount" fill={CHART_COLORS.fi.accent} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

const PortfolioPerformanceChart = ({ data, theme }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
        Loading portfolio performance...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
        <XAxis 
          dataKey="date" 
          stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
          fontSize={12}
        />
        <YAxis 
          stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
          fontSize={12}
          tickFormatter={formatPercentage}
        />
        <Tooltip 
          formatter={(value) => [`${value.toFixed(2)}%`, 'Returns']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Line 
          type="monotone" 
          dataKey="returns" 
          stroke={CHART_COLORS.fi.success} 
          strokeWidth={2}
          dot={{ fill: CHART_COLORS.fi.success, strokeWidth: 2, r: 3 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

const CreditScoreGauge = ({ score, theme }) => {
  if (!score) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
        Loading credit score...
      </div>
    );
  }

  const data = [
    { name: 'Score', value: score, fill: score >= 750 ? CHART_COLORS.fi.success : score >= 650 ? CHART_COLORS.fi.warning : CHART_COLORS.fi.error }
  ];

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={data} startAngle={180} endAngle={0}>
          <RadialBar dataKey="value" cornerRadius={10} fill={data[0].fill} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold" style={{ color: data[0].fill }}>{score}</div>
          <div className="text-sm text-gray-500">Credit Score</div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const FinancialDashboard = ({ sessionId }) => {
  const { theme, toggleTheme } = useTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('6M');
  const [selectedBank, setSelectedBank] = useState('all'); // Add bank filter state
  const [lastUpdated, setLastUpdated] = useState(null);

  // Categorize transaction based on description
  const categorizeTransaction = useCallback((description) => {
    if (!description) return "General";
    
    const desc = description.toLowerCase();
    
    // Food & Dining
    if (desc.includes('food') || desc.includes('restaurant') || desc.includes('dining') || 
        desc.includes('grocery') || desc.includes('zomato') || desc.includes('swiggy') || 
        desc.includes('dominos') || desc.includes('pizza') || desc.includes('cafe') || 
        desc.includes('bigbasket') || desc.includes('grofers') || desc.includes('blinkit')) {
      return "Food";
    }
    
    // Transportation
    if (desc.includes('fuel') || desc.includes('petrol') || desc.includes('transport') || 
        desc.includes('uber') || desc.includes('ola') || desc.includes('metro') || 
        desc.includes('bus') || desc.includes('taxi') || desc.includes('parking') ||
        desc.includes('indian oil') || desc.includes('hp petrol') || desc.includes('bharat petroleum')) {
      return "Transportation";
    }
    
    // Shopping
    if (desc.includes('shopping') || desc.includes('store') || desc.includes('mart') || 
        desc.includes('amazon') || desc.includes('flipkart') || desc.includes('myntra') || 
        desc.includes('ajio') || desc.includes('nykaa') || desc.includes('reliance') ||
        desc.includes('walmart') || desc.includes('clothing') || desc.includes('fashion')) {
      return "Shopping";
    }
    
    // Entertainment
    if (desc.includes('entertainment') || desc.includes('movie') || desc.includes('game') || 
        desc.includes('netflix') || desc.includes('amazon prime') || desc.includes('hotstar') || 
        desc.includes('spotify') || desc.includes('youtube') || desc.includes('cinema') ||
        desc.includes('subscription') || desc.includes('gaming')) {
      return "Entertainment";
    }
    
    // Bills & Utilities
    if (desc.includes('rent') || desc.includes('utility') || desc.includes('bill') || 
        desc.includes('electricity') || desc.includes('water') || desc.includes('gas') || 
        desc.includes('internet') || desc.includes('mobile') || desc.includes('recharge') ||
        desc.includes('jio') || desc.includes('airtel') || desc.includes('vodafone') ||
        desc.includes('bsnl') || desc.includes('tata sky') || desc.includes('dish tv')) {
      return "Bills";
    }
    
    // Income
    if (desc.includes('salary') || desc.includes('credit') || desc.includes('dividend') || 
        desc.includes('interest') || desc.includes('bonus') || desc.includes('refund') ||
        desc.includes('cashback') || desc.includes('reward') || desc.includes('transfer from')) {
      return "Income";
    }
    
    // Banking & Finance
    if (desc.includes('atm') || desc.includes('withdrawal') || desc.includes('deposit') || 
        desc.includes('loan') || desc.includes('emi') || desc.includes('insurance') ||
        desc.includes('mutual fund') || desc.includes('sip') || desc.includes('investment') ||
        desc.includes('trading') || desc.includes('zerodha') || desc.includes('upstox')) {
      return "Finance";
    }
    
    // Health & Medical
    if (desc.includes('medical') || desc.includes('hospital') || desc.includes('pharmacy') || 
        desc.includes('doctor') || desc.includes('health') || desc.includes('medicine') ||
        desc.includes('apollo') || desc.includes('clinic') || desc.includes('dental')) {
      return "Healthcare";
    }
    
    // Education
    if (desc.includes('education') || desc.includes('school') || desc.includes('college') || 
        desc.includes('university') || desc.includes('course') || desc.includes('fees') ||
        desc.includes('books') || desc.includes('training')) {
      return "Education";
    }
    
    return "General";
  }, []);

  // Analyze user behavior based on transactions
  const analyzeUserBehavior = useCallback((transactions) => {
    if (!transactions || transactions.length === 0) {
      return {
        category: "Insufficient Data",
        description: "Not enough transaction data to analyze spending behavior",
        score: 0,
        insights: ["Connect your bank account to get personalized insights"],
        recommendations: ["Start tracking your expenses", "Set spending limits"]
      };
    }

    // Calculate spending patterns
    const totalSpending = transactions
      .filter(t => t.type === 'debit' && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const avgTransaction = totalSpending / transactions.length;
    const highValueTransactions = transactions.filter(t => Math.abs(t.amount) > avgTransaction * 2).length;
    const frequentCategories = {};
    
    transactions.forEach(t => {
      const category = t.category || categorizeTransaction(t.description);
      frequentCategories[category] = (frequentCategories[category] || 0) + 1;
    });

    const topCategory = Object.keys(frequentCategories).reduce((a, b) => 
      frequentCategories[a] > frequentCategories[b] ? a : b, "General"
    );

    // Determine behavior category
    let category, description, score, insights, recommendations;

    if (highValueTransactions > transactions.length * 0.3) {
      category = "High Spender";
      description = "You tend to make frequent high-value purchases";
      score = 85;
      insights = [
        `${highValueTransactions} high-value transactions detected`,
        `Primary spending: ${topCategory}`,
        `Average transaction: ${formatCurrency(avgTransaction)}`
      ];
      recommendations = [
        "Consider setting monthly spending limits",
        "Review large purchases before making them",
        "Look for bulk purchase discounts"
      ];
    } else if (avgTransaction < 1000) {
      category = "Conservative Spender";
      description = "You prefer small, frequent transactions";
      score = 70;
      insights = [
        "Small transaction preference detected",
        `Most frequent category: ${topCategory}`,
        "Consistent spending pattern"
      ];
      recommendations = [
        "Consider consolidating purchases for better deals",
        "Look into subscription services for frequent purchases",
        "Set up automatic savings for remaining budget"
      ];
    } else if (topCategory === "Food" || topCategory === "Entertainment") {
      category = "Lifestyle Focused";
      description = "You prioritize experiences and dining";
      score = 75;
      insights = [
        `High activity in ${topCategory}`,
        "Experience-oriented spending",
        "Good work-life balance spending"
      ];
      recommendations = [
        "Consider cooking at home more often",
        "Look for group deals and discounts",
        "Balance lifestyle spending with savings"
      ];
    } else {
      category = "Balanced Spender";
      description = "You maintain a healthy spending balance";
      score = 80;
      insights = [
        "Well-distributed spending across categories",
        "Moderate transaction values",
        "Good financial discipline"
      ];
      recommendations = [
        "Continue current spending patterns",
        "Consider investing surplus funds",
        "Track spending to maintain balance"
      ];
    }

    return { category, description, score, insights, recommendations };
  }, [categorizeTransaction]);

  // Generate historical data based on current value
  const generateHistoryData = useCallback((currentValue) => {
    if (!currentValue) return [];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      value: Math.round(currentValue * (0.85 + (index * 0.03))) // Simulate growth
    }));
  }, []);

  // Generate portfolio performance data
  const generatePortfolioData = useCallback(() => [
    { date: '2024-01', returns: 8.5 },
    { date: '2024-02', returns: 9.2 },
    { date: '2024-03', returns: 7.8 },
    { date: '2024-04', returns: 10.1 },
    { date: '2024-05', returns: 11.3 },
    { date: '2024-06', returns: 12.5 }
  ], []);

  // Transform production API data to frontend format
  const transformProductionData = useCallback((productionData) => {
    const summaryCards = productionData.summary_cards || {};
    
    // Process bank transactions from the detailed_sections
    let bankTransactionData = [];
    const bankTransactionsSection = productionData.detailed_sections?.bank_transactions?.data;
    
    if (bankTransactionsSection && bankTransactionsSection.bankTransactions) {
      // Transform the bank transaction data from API format
      bankTransactionsSection.bankTransactions.forEach(bankAccount => {
        const bankName = bankAccount.bank;
        if (bankAccount.txns && Array.isArray(bankAccount.txns)) {
          bankAccount.txns.forEach(txn => {
            if (Array.isArray(txn) && txn.length >= 6) {
              const [amount, description, date, type, mode, balance] = txn;
              
              bankTransactionData.push({
                id: `${bankName}_${date}_${amount}_${Math.random().toString(36).substr(2, 9)}`,
                bank: bankName,
                amount: parseFloat(amount) || 0,
                description: description || '',
                date: date || '',
                type: type === 1 ? 'credit' : 'debit', // 1 = credit, 2 = debit
                mode: mode || '',
                balance: parseFloat(balance) || 0,
                category: categorizeTransaction(description || '')
              });
            }
          });
        }
      });
    }

    // Sort transactions by date (newest first)
    bankTransactionData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Extract key financial metrics from summary cards
    const netWorthValue = summaryCards.total_net_worth?.value || 0;
    const bankBalance = summaryCards.bank_balance?.value || 0;
    const investmentsValue = summaryCards.investments?.value || 0;
    const stocksValue = summaryCards.indian_stocks?.value || 0;
    const epfBalance = summaryCards.epf_balance?.value || 0;
    const loansValue = summaryCards.loans_debts?.value || 0;
    const creditScore = summaryCards.credit_score?.value || 0;
    
    // Calculate spending by category from bank transactions
    const spendingByCategory = {};
    let totalSpending = 0;
    let totalIncome = 0;
    
    bankTransactionData.forEach(txn => {
      if (txn.type === 'debit') {
        const amount = Math.abs(txn.amount);
        totalSpending += amount;
        
        const category = txn.category;
        spendingByCategory[category] = (spendingByCategory[category] || 0) + amount;
      } else if (txn.type === 'credit') {
        totalIncome += Math.abs(txn.amount);
      }
    });

    // Generate behavior analysis using bank transaction data
    const behaviorAnalysis = analyzeUserBehavior(bankTransactionData);

    return {
      netWorth: {
        current: netWorthValue,
        change: summaryCards.total_net_worth?.change?.percentage || 5.2,
        history: generateHistoryData(netWorthValue)
      },
      assets: [
        { 
          name: 'Bank Accounts', 
          value: bankBalance, 
          category: 'bank_accounts', 
          change: 2.1 
        },
        { 
          name: 'Investments', 
          value: investmentsValue, 
          category: 'mutual_funds', 
          change: 8.5 
        },
        { 
          name: 'Indian Stocks', 
          value: stocksValue, 
          category: 'stocks', 
          change: 12.3 
        },
        { 
          name: 'EPF Balance', 
          value: epfBalance, 
          category: 'epf', 
          change: 4.2 
        }
      ].filter(asset => asset.value > 0),
      liabilities: loansValue > 0 ? [
        { 
          name: 'Loans & Debts', 
          value: loansValue, 
          category: 'loans', 
          change: -2.1 
        }
      ] : [],
      spending: Object.entries(spendingByCategory).map(([category, amount]) => ({
        category: category,
        amount: amount,
        description: `Total ${category} spending`,
        date: new Date().toISOString().split('T')[0]
      })),
      bankTransactions: bankTransactionData,
      userBehavior: {
        score: behaviorAnalysis.score || 'Good',
        insights: behaviorAnalysis.insights || [],
        recommendations: behaviorAnalysis.recommendations || [],
        spendingTrend: 'stable',
        topCategories: Object.keys(spendingByCategory).slice(0, 3),
        monthlyAverage: totalSpending,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalSpending) / totalIncome * 100).toFixed(1) : 0
      },
      portfolio: generatePortfolioData(),
      creditScore: {
        current: creditScore,
        status: summaryCards.credit_score?.status || 'good',
        history: [
          { date: '2024-01', score: Math.max(650, creditScore - 30) },
          { date: '2024-02', score: Math.max(670, creditScore - 20) },
          { date: '2024-03', score: Math.max(680, creditScore - 15) },
          { date: '2024-04', score: Math.max(690, creditScore - 10) },
          { date: '2024-05', score: Math.max(700, creditScore - 5) },
          { date: '2024-06', score: creditScore }
        ]
      },
      goals: [
        { id: 1, name: 'Emergency Fund', target: 500000, current: bankBalance * 0.6, deadline: '2024-12-31' },
        { id: 2, name: 'Home Down Payment', target: 2000000, current: investmentsValue * 0.4, deadline: '2025-06-30' },
        { id: 3, name: 'Retirement Fund', target: 10000000, current: epfBalance + investmentsValue, deadline: '2045-12-31' }
      ]
    };
  }, [generateHistoryData, generatePortfolioData, categorizeTransaction, analyzeUserBehavior]);

  // Mock data generator for fallback
  const getMockDashboardData = useCallback(() => {
    const mockTransactions = [
      { date: '2025-01-27', description: 'Salary Credit', amount: 85000, type: 'credit' },
      { date: '2025-01-26', description: 'Rent Payment', amount: -25000, type: 'debit' },
      { date: '2025-01-25', description: 'Grocery Shopping - BigBasket', amount: -3500, type: 'debit' },
      { date: '2025-01-24', description: 'SIP Investment - Mutual Fund', amount: -15000, type: 'debit' },
      { date: '2025-01-23', description: 'Dividend Received', amount: 2500, type: 'credit' },
      { date: '2025-01-22', description: 'Restaurant - Dinner', amount: -1200, type: 'debit' },
      { date: '2025-01-21', description: 'Uber Ride', amount: -450, type: 'debit' },
      { date: '2025-01-20', description: 'Netflix Subscription', amount: -799, type: 'debit' },
      { date: '2025-01-19', description: 'Petrol - Indian Oil', amount: -2000, type: 'debit' },
      { date: '2025-01-18', description: 'Amazon Shopping', amount: -5600, type: 'debit' }
    ];

    return {
      netWorth: {
        current: 2500000,
        change: 5.2,
        history: [
          { month: 'Jan', value: 2200000 },
          { month: 'Feb', value: 2250000 },
          { month: 'Mar', value: 2300000 },
          { month: 'Apr', value: 2350000 },
          { month: 'May', value: 2400000 },
          { month: 'Jun', value: 2500000 }
        ]
      },
      assets: [
        { name: 'Mutual Funds', value: 1200000, category: 'mutual_funds', change: 8.5 },
        { name: 'Stocks', value: 800000, category: 'stocks', change: 12.3 },
        { name: 'Bank Accounts', value: 300000, category: 'bank_accounts', change: 2.1 },
        { name: 'Real Estate', value: 200000, category: 'real_estate', change: 1.5 }
      ],
      spending: [
        { category: 'Food & Dining', amount: 15000, description: 'Restaurants, Groceries', date: '2025-01-27' },
        { category: 'Transportation', amount: 8000, description: 'Uber, Petrol', date: '2025-01-26' },
        { category: 'Shopping', amount: 12000, description: 'Amazon, BigBasket', date: '2025-01-25' },
        { category: 'Entertainment', amount: 5000, description: 'Netflix, Movies', date: '2025-01-24' },
        { category: 'Bills & Utilities', amount: 18000, description: 'Rent, Electricity', date: '2025-01-23' }
      ],
      bankTransactions: mockTransactions,
      userBehavior: analyzeUserBehavior(mockTransactions),
      portfolio: [
        { date: '2024-01', returns: 8.5 },
        { date: '2024-02', returns: 9.2 },
        { date: '2024-03', returns: 7.8 },
        { date: '2024-04', returns: 10.1 },
        { date: '2024-05', returns: 11.3 },
        { date: '2024-06', returns: 12.5 }
      ],
      creditScore: 765,
      goals: [
        { id: 1, name: 'Emergency Fund', target: 500000, current: 300000, deadline: '2024-12-31' },
        { id: 2, name: 'Home Down Payment', target: 2000000, current: 800000, deadline: '2025-06-30' },
        { id: 3, name: 'Retirement Fund', target: 10000000, current: 1200000, deadline: '2045-12-31' }
      ]
    };
  }, [analyzeUserBehavior]);

  // Fetch dashboard data from backend
  const fetchDashboardData = useCallback(async () => {
    console.log("🔍 fetchDashboardData called with sessionId:", sessionId);
    console.log("🔍 API_BASE_URL:", API_BASE_URL);
    
    if (!sessionId) {
      console.warn("❌ No sessionId provided to dashboard component");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = `${API_BASE_URL}/session/${sessionId}/dashboard`;
      console.log("🔍 Making API call to:", apiUrl);
      
      // Use the correct production API endpoint format
      const response = await axios.get(apiUrl);
      
      console.log("🔍 API Response status:", response.status);
      console.log("🔍 API Response data:", response.data);
      
      if (response.data.status === 'success' && response.data.dashboard) {
        console.log("✅ Successful API response, transforming data...");
        
        // Transform production API response to frontend format
        const productionData = response.data.dashboard;
        console.log("🔍 Production data:", productionData);
        
        const transformedData = transformProductionData(productionData);
        console.log("🔍 Transformed data:", transformedData);
        
        setDashboardData(transformedData);
        setLastUpdated(new Date(response.data.metadata?.last_updated || Date.now()).toLocaleString());
        
        console.log("✅ Dashboard data set successfully");
      } else {
        console.error("❌ API response format issue:", response.data);
        throw new Error(response.data.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      console.error('❌ Error details:', err.response?.data || err.message);
      setError(err.message || 'Failed to load dashboard data');
      
      console.log("🔄 Falling back to mock data");
      // Use mock data as fallback
      setDashboardData(getMockDashboardData());
      setLastUpdated(new Date().toLocaleString());
    } finally {
      setLoading(false);
    }
  }, [sessionId, getMockDashboardData, transformProductionData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-md p-8 mx-auto text-center">
          <div className="relative mb-8">
            <div className="flex items-center justify-center w-20 h-20 mx-auto shadow-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-emerald-500/25">
              <DollarSign className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-2xl blur opacity-20 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-4 space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-0"></div>
                <div className="w-2 h-2 delay-100 rounded-full bg-emerald-500 animate-bounce"></div>
                <div className="w-2 h-2 delay-200 rounded-full bg-emerald-500 animate-bounce"></div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text">
              Loading Your Financial Dashboard
            </h2>
            <p className="leading-relaxed text-gray-600 dark:text-gray-400">
              Fetching your latest financial data and insights...
            </p>
            <div className="mt-6 space-y-2">
              <div className="h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 animate-pulse" style={{width: '60%'}}></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Analyzing your portfolio...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const data = dashboardData || getMockDashboardData();

  return (
    <div className="flex flex-col h-screen transition-all duration-300 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Header with Gradient */}
      {/* <div className="flex-shrink-0 border-b shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-gray-200/60 dark:border-gray-700/60">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text">
                    Money-Lens
                  </h1>
                  <p className="-mt-1 text-sm text-gray-500 dark:text-gray-400">Financial Intelligence</p>
                </div>
              </div>
              {lastUpdated && (
                <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Updated: {lastUpdated}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="h-10 transition-all border-gray-200 w-28 bg-white/50 dark:bg-gray-700/50 backdrop-blur dark:border-gray-600 hover:bg-white/80 dark:hover:bg-gray-700/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg">
                  <SelectItem value="1M">1 Month</SelectItem>
                  <SelectItem value="3M">3 Months</SelectItem>
                  <SelectItem value="6M">6 Months</SelectItem>
                  <SelectItem value="1Y">1 Year</SelectItem>
                  <SelectItem value="ALL">All Time</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={loading}
                className="h-10 px-4 transition-all duration-200 border-gray-200 shadow-sm bg-white/50 dark:bg-gray-700/50 backdrop-blur dark:border-gray-600 hover:bg-white/80 dark:hover:bg-gray-700/80 hover:scale-105"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="w-10 h-10 p-0 transition-all duration-200 border-gray-200 shadow-sm bg-white/50 dark:bg-gray-700/50 backdrop-blur dark:border-gray-600 hover:bg-white/80 dark:hover:bg-gray-700/80 hover:scale-105"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div> */}

      {error && (
        <div className="flex-shrink-0 px-4 pt-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="p-4 border shadow-sm bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/60 dark:border-amber-800/60 rounded-xl backdrop-blur-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-sm font-medium text-amber-800 dark:text-amber-200">
                  Demo Mode Active
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {error} - Displaying sample data for demonstration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Scrollable Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <Tabs defaultValue="overview" className="flex flex-col h-full">
            <TabsList className="grid flex-shrink-0 w-full grid-cols-4 p-1 mb-8 border shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border-gray-200/60 dark:border-gray-700/60 rounded-xl">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/25 transition-all duration-200 rounded-lg font-medium"
              >
                <PieChart className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="investments" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 transition-all duration-200 rounded-lg font-medium"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Investments
              </TabsTrigger>
              <TabsTrigger 
                value="spending" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 transition-all duration-200 rounded-lg font-medium"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Spending
              </TabsTrigger>
              <TabsTrigger 
                value="goals" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/25 transition-all duration-200 rounded-lg font-medium"
              >
                <Target className="w-4 h-4 mr-2" />
                Goals
              </TabsTrigger>
            </TabsList>

              {/* Enhanced Overview Tab */}
              <TabsContent value="overview" className="flex-1 pb-8 space-y-8 overflow-y-auto">
                {/* Modern Quick Stats Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {/* Net Worth Card */}
                  <Card className="transition-all duration-300 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-200/60 dark:border-emerald-700/40 hover:shadow-xl hover:shadow-emerald-500/10 group hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardDescription className="font-medium text-emerald-700 dark:text-emerald-300">
                          Net Worth
                        </CardDescription>
                        <div className="flex items-center justify-center w-10 h-10 transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 group-hover:shadow-emerald-500/25 group-hover:scale-110">
                          <DollarSign className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(data.netWorth?.current)}
                        </div>
                        {getChangeIndicator(data.netWorth?.change)}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Total Assets Card */}
                  <Card className="transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200/60 dark:border-blue-700/40 hover:shadow-xl hover:shadow-blue-500/10 group hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardDescription className="font-medium text-blue-700 dark:text-blue-300">
                          Total Assets
                        </CardDescription>
                        <div className="flex items-center justify-center w-10 h-10 transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 group-hover:shadow-blue-500/25 group-hover:scale-110">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                          {formatCurrency(data.assets?.reduce((sum, asset) => sum + (asset.value || 0), 0))}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          {data.assets?.length || 0} assets tracked
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Monthly Spending Card */}
                  <Card className="transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200/60 dark:border-purple-700/40 hover:shadow-xl hover:shadow-purple-500/10 group hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardDescription className="font-medium text-purple-700 dark:text-purple-300">
                          Monthly Spending
                        </CardDescription>
                        <div className="flex items-center justify-center w-10 h-10 transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 group-hover:shadow-purple-500/25 group-hover:scale-110">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                          {formatCurrency(data.spending?.reduce((sum, item) => sum + (item.amount || 0), 0))}
                        </div>
                        <div className="text-sm text-purple-600 dark:text-purple-400">
                          {data.spending?.length || 0} transactions
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Credit Score Card */}
                  <Card className="transition-all duration-300 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 border-indigo-200/60 dark:border-indigo-700/40 hover:shadow-xl hover:shadow-indigo-500/10 group hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardDescription className="font-medium text-indigo-700 dark:text-indigo-300">
                          Credit Score
                        </CardDescription>
                        <div className="flex items-center justify-center w-10 h-10 transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-indigo-500 to-indigo-600 group-hover:shadow-indigo-500/25 group-hover:scale-110">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                          {data.creditScore?.current || data.creditScore || 'N/A'}
                        </div>
                        <div className="text-sm text-indigo-600 dark:text-indigo-400">
                          {data.creditScore?.status || 'Good'} rating
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Charts Row */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <Card className="transition-all duration-300 shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 hover:shadow-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-semibold">Net Worth Trend</span>
                      </CardTitle>
                      <CardDescription>Your wealth growth over time</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="h-80">
                        <NetWorthChart data={data.netWorth?.history} theme={theme} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="transition-all duration-300 shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 hover:shadow-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                          <PieChart className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-semibold">Asset Allocation</span>
                      </CardTitle>
                      <CardDescription>Portfolio distribution breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="h-80">
                        <AssetAllocationChart data={data.assets} theme={theme} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Asset Details */}
                <Card className="shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60">
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-3 text-xl">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                            <Briefcase className="w-4 h-4 text-white" />
                          </div>
                          <span>Asset Portfolio</span>
                        </CardTitle>
                        <CardDescription className="mt-2">Your assets and their performance metrics</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700">
                        {data.assets?.length || 0} Assets
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 overflow-y-auto max-h-96">
                      {data.assets?.map((asset, index) => (
                        <div key={index} className="p-4 transition-all duration-200 border group border-gray-200/60 dark:border-gray-700/60 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-white dark:hover:from-gray-700/50 dark:hover:to-gray-800/50 hover:shadow-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0 p-2 transition-transform duration-200 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 group-hover:scale-110">
                                {getCategoryIcon(asset.category)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">{asset.name}</div>
                                <div className="text-sm text-gray-500 capitalize dark:text-gray-400">
                                  {asset.category?.replace('_', ' ')}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">
                                {formatCurrency(asset.value)}
                              </div>
                              {getChangeIndicator(asset.change)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced User Behavior Analysis */}
                {data.userBehavior && (
                  <Card className="shadow-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 border-indigo-200/60 dark:border-indigo-700/40">
                    <CardHeader className="pb-6">
                      <CardTitle className="flex items-center space-x-3 text-xl">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600">
                          <Target className="w-4 h-4 text-white" />
                        </div>
                        <span>Spending Behavior Analysis</span>
                      </CardTitle>
                      <CardDescription className="text-indigo-700 dark:text-indigo-300">
                        AI-powered insights based on your transaction patterns
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                          <div>
                            <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                              {data.userBehavior.category}
                            </h3>
                            <p className="mt-1 text-sm text-indigo-600 dark:text-indigo-400">
                              {data.userBehavior.description}
                            </p>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text">
                              {data.userBehavior.score}
                            </div>
                            <div className="text-xs font-medium text-indigo-500 dark:text-indigo-400">Score</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                            <h4 className="flex items-center mb-3 font-semibold text-indigo-900 dark:text-indigo-100">
                              <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                              Key Insights
                            </h4>
                            <ul className="space-y-2 overflow-y-auto max-h-32">
                              {data.userBehavior.insights?.map((insight, index) => (
                                <li key={index} className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span>{insight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                            <h4 className="flex items-center mb-3 font-semibold text-indigo-900 dark:text-indigo-100">
                              <Target className="w-4 h-4 mr-2 text-blue-500" />
                              Recommendations
                            </h4>
                            <ul className="space-y-2 overflow-y-auto max-h-32">
                              {data.userBehavior.recommendations?.map((rec, index) => (
                                <li key={index} className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Investments Tab */}
              <TabsContent value="investments" className="flex-1 pb-8 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Portfolio Performance</CardTitle>
                      <CardDescription>Monthly returns over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PortfolioPerformanceChart data={data.portfolio} theme={theme} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Credit Score</CardTitle>
                      <CardDescription>Your current credit score</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CreditScoreGauge score={data.creditScore?.current || data.creditScore || 750} theme={theme} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Spending Tab */}
              <TabsContent value="spending" className="flex-1 pb-8 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Spending by Category</CardTitle>
                      <CardDescription>Your monthly spending breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SpendingTrendsChart data={data.spending} theme={theme} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <div>
                        <CardTitle>Bank Transactions</CardTitle>
                        <CardDescription>Latest transactions from your bank accounts</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select value={selectedBank} onValueChange={setSelectedBank}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Bank" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Banks</SelectItem>
                            {data.bankTransactions && 
                              [...new Set(data.bankTransactions.map(t => t.bank))].map(bank => (
                                <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 overflow-y-auto max-h-80">
                        {(() => {
                          // Filter transactions based on selected bank
                          const filteredTransactions = data.bankTransactions && data.bankTransactions.length > 0 
                            ? data.bankTransactions.filter(t => selectedBank === 'all' || t.bank === selectedBank)
                            : [];

                          return filteredTransactions.length > 0 ? (
                            filteredTransactions.slice(0, 15).map((transaction, index) => {
                              const category = transaction.category || categorizeTransaction(transaction.description || '');
                              return (
                                <div key={transaction.id || index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg dark:border-gray-700">
                                  <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-full ${
                                      transaction.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                      {transaction.type === 'credit' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {transaction.description}
                                      </div>
                                      <div className="flex items-center mt-1 space-x-2">
                                        <div className="flex items-center space-x-1">
                                          {getCategoryIcon(category)}
                                          <Badge variant="secondary" className="text-xs">
                                            {category}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                                          <span>{transaction.date}</span>
                                          <span>•</span>
                                          <span className="font-medium" style={{ color: CHART_COLORS.fi.primary }}>
                                            {transaction.bank}
                                          </span>
                                        </div>
                                      </div>
                                      {transaction.balance && (
                                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                          Balance: {formatCurrency(transaction.balance)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className={`text-right font-semibold ${
                                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="py-8 text-center text-gray-500">
                              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No bank transactions available</p>
                              <p className="text-sm">
                                {selectedBank !== 'all' 
                                  ? `No transactions found for ${selectedBank}` 
                                  : 'Connect your bank account to see transactions'
                                }
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                      
                      {/* Transaction Summary for Selected Bank */}
                      {data.bankTransactions && data.bankTransactions.length > 0 && (
                        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                          {(() => {
                            const filteredTransactions = selectedBank === 'all' 
                              ? data.bankTransactions 
                              : data.bankTransactions.filter(t => t.bank === selectedBank);
                            
                            const totalCredits = filteredTransactions
                              .filter(t => t.type === 'credit')
                              .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                            
                            const totalDebits = filteredTransactions
                              .filter(t => t.type === 'debit')
                              .reduce((sum, t) => sum + Math.abs(t.amount), 0);

                            return (
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Credits</div>
                                  <div className="font-semibold text-green-600">+{formatCurrency(totalCredits)}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Debits</div>
                                  <div className="font-semibold text-red-600">-{formatCurrency(totalDebits)}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">Net Flow</div>
                                  <div className={`font-semibold ${(totalCredits - totalDebits) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {(totalCredits - totalDebits) >= 0 ? '+' : ''}{formatCurrency(totalCredits - totalDebits)}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Spending Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Spending Details</CardTitle>
                    <CardDescription>Categorized view of your expenses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 overflow-y-auto max-h-96">
                      {data.spending && data.spending.length > 0 ? (
                        data.spending.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                            <div className="flex items-center space-x-3">
                              {getCategoryIcon(item.category)}
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {item.category}
                                </div>
                                {item.description && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {item.description}
                                  </div>
                                )}
                                {item.date && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.date}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">
                                {formatCurrency(item.amount)}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-gray-500">
                          <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No spending data available</p>
                          <p className="text-sm">Make some transactions to see spending analysis</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Enhanced Goals Tab */}
              <TabsContent value="goals" className="flex-1 pb-8 space-y-8 overflow-y-auto">
                <div className="space-y-8">
                  {data.goals?.map((goal, index) => (
                    <Card key={goal.id} className={`
                      group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1
                      ${index === 0 ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-200/60 dark:border-emerald-700/40' : ''}
                      ${index === 1 ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200/60 dark:border-blue-700/40' : ''}
                      ${index === 2 ? 'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200/60 dark:border-purple-700/40' : ''}
                      ${index >= 3 ? 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 border-indigo-200/60 dark:border-indigo-700/40' : ''}
                    `}>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2 space-x-3">
                              <div className={`
                                w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200
                                ${index === 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : ''}
                                ${index === 1 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : ''}
                                ${index === 2 ? 'bg-gradient-to-r from-purple-500 to-purple-600' : ''}
                                ${index >= 3 ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' : ''}
                              `}>
                                <Target className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <CardTitle className={`
                                  text-xl font-bold
                                  ${index === 0 ? 'text-emerald-800 dark:text-emerald-200' : ''}
                                  ${index === 1 ? 'text-blue-800 dark:text-blue-200' : ''}
                                  ${index === 2 ? 'text-purple-800 dark:text-purple-200' : ''}
                                  ${index >= 3 ? 'text-indigo-800 dark:text-indigo-200' : ''}
                                `}>
                                  {goal.name}
                                </CardTitle>
                              </div>
                            </div>
                            <CardDescription className={`
                              text-sm font-medium
                              ${index === 0 ? 'text-emerald-700 dark:text-emerald-300' : ''}
                              ${index === 1 ? 'text-blue-700 dark:text-blue-300' : ''}
                              ${index === 2 ? 'text-purple-700 dark:text-purple-300' : ''}
                              ${index >= 3 ? 'text-indigo-700 dark:text-indigo-300' : ''}
                            `}>
                              Target: {formatCurrency(goal.target)} by {goal.deadline}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className={`
                              text-3xl font-bold
                              ${index === 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}
                              ${index === 1 ? 'text-blue-600 dark:text-blue-400' : ''}
                              ${index === 2 ? 'text-purple-600 dark:text-purple-400' : ''}
                              ${index >= 3 ? 'text-indigo-600 dark:text-indigo-400' : ''}
                            `}>
                              {((goal.current / goal.target) * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Complete
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm font-medium">
                            <span className={`
                              ${index === 0 ? 'text-emerald-700 dark:text-emerald-300' : ''}
                              ${index === 1 ? 'text-blue-700 dark:text-blue-300' : ''}
                              ${index === 2 ? 'text-purple-700 dark:text-purple-300' : ''}
                              ${index >= 3 ? 'text-indigo-700 dark:text-indigo-300' : ''}
                            `}>
                              Progress
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                            </span>
                          </div>
                          <div className="relative">
                            <Progress 
                              value={(goal.current / goal.target) * 100} 
                              className={`
                                h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden
                                ${index === 0 ? '[&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-emerald-600' : ''}
                                ${index === 1 ? '[&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-blue-600' : ''}
                                ${index === 2 ? '[&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-purple-600' : ''}
                                ${index >= 3 ? '[&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-indigo-600' : ''}
                              `}
                            />
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className={`
                              font-medium
                              ${index === 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}
                              ${index === 1 ? 'text-blue-600 dark:text-blue-400' : ''}
                              ${index === 2 ? 'text-purple-600 dark:text-purple-400' : ''}
                              ${index >= 3 ? 'text-indigo-600 dark:text-indigo-400' : ''}
                            `}>
                              {((goal.current / goal.target) * 100).toFixed(1)}% complete
                            </span>
                            <span className="font-medium text-gray-600 dark:text-gray-400">
                              {formatCurrency(goal.target - goal.current)} remaining
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
  );
};

export default FinancialDashboard;
