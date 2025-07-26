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
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </div>
  );
};

const getCategoryIcon = (category) => {
  const iconMap = {
    'mutual_funds': <PieChart className="h-4 w-4 text-emerald-600" />,
    'stocks': <TrendingUp className="h-4 w-4 text-blue-600" />,
    'bank_accounts': <Landmark className="h-4 w-4 text-slate-600" />,
    'real_estate': <Home className="h-4 w-4 text-amber-600" />,
    'vehicles': <Car className="h-4 w-4 text-gray-600" />,
    'epf': <Briefcase className="h-4 w-4 text-purple-600" />,
    'credit_cards': <CreditCard className="h-4 w-4 text-red-600" />,
    'loans': <Building className="h-4 w-4 text-orange-600" />,
    'insurance': <Shield className="h-4 w-4 text-indigo-600" />,
    'cash': <Wallet className="h-4 w-4 text-green-600" />,
    'Food': <DollarSign className="h-4 w-4 text-green-600" />,
    'Transportation': <Car className="h-4 w-4 text-blue-600" />,
    'Shopping': <Building className="h-4 w-4 text-purple-600" />,
    'Entertainment': <Target className="h-4 w-4 text-pink-600" />,
    'Bills': <CreditCard className="h-4 w-4 text-red-600" />,
    'Income': <ArrowUpRight className="h-4 w-4 text-emerald-600" />,
    'Finance': <Landmark className="h-4 w-4 text-blue-700" />,
    'Healthcare': <Shield className="h-4 w-4 text-red-500" />,
    'Education': <Briefcase className="h-4 w-4 text-indigo-600" />,
    'General': <DollarSign className="h-4 w-4 text-gray-600" />
  };
  return iconMap[category] || <DollarSign className="h-4 w-4 text-gray-600" />;
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
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
      <div className="h-48 flex items-center justify-center text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
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
      <div className="h-48 flex items-center justify-center text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
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
      <div className="h-48 flex items-center justify-center text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
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
      <div className="h-48 flex items-center justify-center text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
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
      <div className="h-48 flex items-center justify-center text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
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

  // Transform backend data to frontend format
  const transformBackendData = useCallback((backendData) => {
    const cards = backendData.summary_cards || {};
    const transactions = backendData.recent_transactions || [];
    
    // Analyze user behavior
    const behaviorAnalysis = analyzeUserBehavior(transactions);

    return {
      netWorth: {
        current: cards.total_net_worth?.value || 0,
        change: cards.total_net_worth?.change?.percentage || 0,
        history: generateHistoryData(cards.total_net_worth?.value || 0)
      },
      assets: [
        { 
          name: 'Mutual Funds', 
          value: cards.investments?.value || 0, 
          category: 'mutual_funds', 
          change: 8.5 
        },
        { 
          name: 'Stocks', 
          value: cards.indian_stocks?.value || 0, 
          category: 'stocks', 
          change: 12.3 
        },
        { 
          name: 'Bank Accounts', 
          value: cards.bank_balance?.value || 0, 
          category: 'bank_accounts', 
          change: 2.1 
        },
        { 
          name: 'EPF', 
          value: cards.epf_balance?.value || 0, 
          category: 'epf', 
          change: 5.2 
        }
      ].filter(asset => asset.value > 0), // Only show assets with value
      spending: transactions
        .filter(t => t.type === 'debit' && t.amount < 0)
        .slice(0, 10)
        .map(t => ({
          category: categorizeTransaction(t.description),
          amount: Math.abs(t.amount),
          description: t.description,
          date: t.date
        })),
      bankTransactions: transactions,
      userBehavior: behaviorAnalysis,
      portfolio: generatePortfolioData(),
      creditScore: cards.credit_score?.value || null,
      goals: [
        { id: 1, name: 'Emergency Fund', target: 500000, current: 300000, deadline: '2024-12-31' },
        { id: 2, name: 'Home Down Payment', target: 2000000, current: 800000, deadline: '2025-06-30' },
        { id: 3, name: 'Retirement Fund', target: 10000000, current: cards.epf_balance?.value || 0, deadline: '2045-12-31' }
      ]
    };
  }, [analyzeUserBehavior, categorizeTransaction, generateHistoryData, generatePortfolioData]);

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
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/session/${sessionId}/dashboard`);
      
      if (response.data.status === 'success') {
        // Transform backend data to frontend format
        const backendData = response.data.dashboard;
        const transformedData = transformBackendData(backendData);
        setDashboardData(transformedData);
        setLastUpdated(response.data.metadata?.last_updated || new Date().toLocaleString());
        
        // Set error if using demo data
        if (response.data.metadata?.demo_mode) {
          setError(response.data.metadata?.message || 'Using demo data');
        }
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      
      // Use mock data as fallback
      setDashboardData(getMockDashboardData());
      setLastUpdated(new Date().toLocaleString());
    } finally {
      setLoading(false);
    }
  }, [sessionId, transformBackendData, getMockDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-emerald-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Loading Your Financial Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">Fetching your latest financial data...</p>
        </div>
      </div>
    );
  }

  const data = dashboardData || getMockDashboardData();

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Money-Lens Dashboard</h1>
              {lastUpdated && (
                <Badge variant="outline" className="text-xs">
                  Updated: {lastUpdated}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1M">1M</SelectItem>
                  <SelectItem value="3M">3M</SelectItem>
                  <SelectItem value="6M">6M</SelectItem>
                  <SelectItem value="1Y">1Y</SelectItem>
                  <SelectItem value="ALL">All</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="flex items-center space-x-2"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 flex-shrink-0">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-yellow-800 dark:text-yellow-200">
                {error} - Showing sample data instead.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="investments">Investments</TabsTrigger>
                <TabsTrigger value="spending">Spending</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-2">
                      <CardDescription>Net Worth</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold" style={{ color: CHART_COLORS.fi.primary }}>
                          {formatCurrency(data.netWorth?.current)}
                        </div>
                        {getChangeIndicator(data.netWorth?.change)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardDescription>Total Assets</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(data.assets?.reduce((sum, asset) => sum + (asset.value || 0), 0))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                      <CardDescription>Monthly Spending</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">
                        {formatCurrency(data.spending?.reduce((sum, item) => sum + (item.amount || 0), 0))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                      <CardDescription>Credit Score</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        {data.creditScore || 'N/A'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5" style={{ color: CHART_COLORS.fi.primary }} />
                        <span>Net Worth Trend</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <NetWorthChart data={data.netWorth?.history} theme={theme} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <PieChart className="h-5 w-5" style={{ color: CHART_COLORS.fi.accent }} />
                        <span>Asset Allocation</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AssetAllocationChart data={data.assets} theme={theme} />
                    </CardContent>
                  </Card>
                </div>

                {/* Asset Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Asset Breakdown</CardTitle>
                    <CardDescription>Your assets and their performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {data.assets?.map((asset, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getCategoryIcon(asset.category)}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">{asset.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
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
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* User Behavior Analysis */}
                {data.userBehavior && (
                  <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-indigo-600" />
                        <span>Spending Behavior Analysis</span>
                      </CardTitle>
                      <CardDescription>AI-powered insights based on your transaction patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {data.userBehavior.category}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {data.userBehavior.description}
                            </p>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">
                              {data.userBehavior.score}
                            </div>
                            <div className="text-xs text-gray-500">Score</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Key Insights</h4>
                            <ul className="space-y-1 max-h-32 overflow-y-auto">
                              {data.userBehavior.insights?.map((insight, index) => (
                                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start space-x-2">
                                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{insight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Recommendations</h4>
                            <ul className="space-y-1 max-h-32 overflow-y-auto">
                              {data.userBehavior.recommendations?.map((rec, index) => (
                                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start space-x-2">
                                  <Target className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
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
              <TabsContent value="investments" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <CreditScoreGauge score={data.creditScore} theme={theme} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Spending Tab */}
              <TabsContent value="spending" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <CardHeader>
                      <CardTitle>Recent Bank Transactions</CardTitle>
                      <CardDescription>Latest transactions from your bank accounts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {data.bankTransactions && data.bankTransactions.length > 0 ? (
                          data.bankTransactions.slice(0, 15).map((transaction, index) => {
                            const category = transaction.category || categorizeTransaction(transaction.description || '');
                            return (
                              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className={`p-2 rounded-full ${
                                    transaction.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                  }`}>
                                    {transaction.type === 'credit' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                      {transaction.description}
                                    </div>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <div className="flex items-center space-x-1">
                                        {getCategoryIcon(category)}
                                        <Badge variant="secondary" className="text-xs">
                                          {category}
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {transaction.date}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className={`text-right font-semibold ${
                                  transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.type === 'credit' ? '+' : ''}{formatCurrency(transaction.amount)}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No bank transactions available</p>
                            <p className="text-sm">Connect your bank account to see transactions</p>
                          </div>
                        )}
                      </div>
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
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {data.spending && data.spending.length > 0 ? (
                        data.spending.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
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
                        <div className="text-center py-8 text-gray-500">
                          <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No spending data available</p>
                          <p className="text-sm">Make some transactions to see spending analysis</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Goals Tab */}
              <TabsContent value="goals" className="space-y-6">
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {data.goals?.map((goal) => (
                    <Card key={goal.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{goal.name}</CardTitle>
                            <CardDescription>Target: {formatCurrency(goal.target)} by {goal.deadline}</CardDescription>
                          </div>
                          <Target className="h-6 w-6 text-emerald-600" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{formatCurrency(goal.current)} / {formatCurrency(goal.target)}</span>
                          </div>
                          <Progress 
                            value={(goal.current / goal.target) * 100} 
                            className="h-2"
                          />
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>{((goal.current / goal.target) * 100).toFixed(1)}% complete</span>
                            <span>{formatCurrency(goal.target - goal.current)} remaining</span>
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
    </div>
  );
};

export default FinancialDashboard;
