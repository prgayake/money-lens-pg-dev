import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tooltip,
  Badge,
  CardHeader,
  ButtonGroup,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemAvatar,
  Collapse,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  AccountBalance,
  Star,
  AccountBalanceWallet,
  TrendingUp,
  Savings,
  ShowChart,
  CreditCard,
  ArrowUpward,
  ArrowDownward,
  Remove,
  Refresh,
  ExpandMore,
  Assessment,
  MonetizationOn,
  Security,
  NotificationsActive,
  TrendingDown,
  ExpandLess,
  Timeline,
  Warning,
  CheckCircle,
  Info,
  TrendingUpOutlined,
} from "@mui/icons-material";
import { motion } from "framer-motion";

// Enhanced premium color palette for robust financial UI
const COLORS = {
  primary: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe"],
  success: ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
  warning: ["#d97706", "#f59e0b", "#fbbf24", "#fcd34d", "#fef3c7"],
  error: ["#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca"],
  info: ["#0891b2", "#06b6d4", "#22d3ee", "#67e8f9", "#a5f3fc"],
  neutral: ["#374151", "#6b7280", "#9ca3af", "#d1d5db", "#f3f4f6"],
  accent: ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ede9fe"],
  dark: ["#111827", "#1f2937", "#374151", "#4b5563", "#6b7280"],
  gold: ["#f59e0b", "#fbbf24", "#fcd34d", "#fde68a", "#fef3c7"],
  emerald: ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"]
};

const CHART_COLORS = [
  "#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", 
  "#0891b2", "#065f46", "#92400e", "#7c2d12", "#581c87"
];

// Enhanced animation variants with more dynamic effects
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.6,
      ease: "easeOut"
    } 
  },
  hover: { 
    scale: 1.03, 
    y: -5,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: { 
      duration: 0.3,
      ease: "easeInOut"
    } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const FinancialDashboard = ({ sessionId }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8001/session/${sessionId}/dashboard`
      );
      const data = await response.json();

      if (response.ok && data.status === "success") {
        setDashboardData(data.dashboard);
      } else if (data.status === "login_required") {
        setError("Authentication required. Please login to view dashboard.");
      } else {
        setError(data.detail || "Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      fetchDashboardData();
    }
  }, [sessionId, fetchDashboardData]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getIconComponent = (iconName) => {
    const iconMap = {
      account_balance: AccountBalance,
      star: Star,
      account_balance_wallet: AccountBalanceWallet,
      trending_up: TrendingUp,
      savings: Savings,
      show_chart: ShowChart,
      credit_card: CreditCard,
    };
    const IconComponent = iconMap[iconName] || AccountBalance;
    return <IconComponent />;
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <ArrowUpward sx={{ color: "green", fontSize: 16 }} />;
      case "down":
        return <ArrowDownward sx={{ color: "red", fontSize: 16 }} />;
      default:
        return <Remove sx={{ color: "gray", fontSize: 16 }} />;
    }
  };

  const getCreditScoreColor = (status) => {
    const colorMap = {
      excellent: "#4caf50",
      good: "#8bc34a",
      fair: "#ff9800",
      poor: "#ff5722",
      very_poor: "#f44336",
    };
    return colorMap[status] || "#9e9e9e";
  };

  // Enhanced Premium Summary Card Component with glass morphism and premium animations
  const EnhancedSummaryCard = ({ cardData, title, index }) => {
    if (!cardData) return null;

    const getPremiumGradient = (iconName) => {
      const gradients = {
        account_balance: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        star: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        account_balance_wallet: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        trending_up: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        savings: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        show_chart: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        credit_card: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      };
      return gradients[iconName] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    };

    const getCardBackground = () => {
      if (cardData.error) {
        return 'linear-gradient(135deg, rgba(254, 202, 87, 0.9) 0%, rgba(255, 107, 107, 0.9) 100%)';
      }
      return 'rgba(255, 255, 255, 0.95)';
    };

    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        style={{ height: '100%' }}
      >
        <Card 
          elevation={0}
          sx={{ 
            height: '100%', 
            position: 'relative',
            background: getCardBackground(),
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: cardData.error ? '2px solid rgba(255, 107, 107, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              border: cardData.error ? '2px solid rgba(255, 107, 107, 0.5)' : '1px solid rgba(255, 255, 255, 0.3)'
            }
          }}
        >
          {/* Premium Background Pattern */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: getPremiumGradient(cardData.icon),
              borderRadius: '50%',
              opacity: 0.1,
              transform: 'translate(30px, -30px)'
            }}
          />
          
          <CardContent sx={{ pb: '24px !important', position: 'relative', zIndex: 1 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '18px',
                  background: cardData.error ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' : getPremiumGradient(cardData.icon),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: '18px',
                    background: 'linear-gradient(45deg, rgba(255,255,255,0.3), transparent)',
                    pointerEvents: 'none'
                  }
                }}
              >
                <Box sx={{ color: 'white', fontSize: 28 }}>
                  {getIconComponent(cardData.icon)}
                </Box>
              </Box>
              
              {cardData.change && (
                <Tooltip title={`${cardData.change.direction === 'up' ? 'Increased' : 'Decreased'} by ${Math.abs(cardData.change.percentage)}%`}>
                  <Chip
                    icon={getTrendIcon(cardData.change.direction)}
                    label={`${Math.abs(cardData.change.percentage)}%`}
                    size="small"
                    sx={{
                      background: cardData.change.direction === 'up' 
                        ? 'linear-gradient(45deg, #10b981, #059669)' 
                        : 'linear-gradient(45deg, #ef4444, #dc2626)',
                      color: 'white',
                      fontWeight: 'bold',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      '& .MuiChip-icon': {
                        color: 'white'
                      }
                    }}
                  />
                </Tooltip>
              )}
            </Box>

            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: '#64748b',
                fontWeight: 600,
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                mb: 1
              }}
            >
              {cardData.title}
            </Typography>

            {cardData.error ? (
              <Alert 
                severity="warning" 
                size="small" 
                sx={{ 
                  mt: 1,
                  borderRadius: '12px',
                  background: 'rgba(255, 152, 0, 0.1)',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  '& .MuiAlert-icon': {
                    color: '#ff9800'
                  }
                }}
              >
                Data unavailable
              </Alert>
            ) : (
              <Box>
                <Typography 
                  variant="h3" 
                  component="div" 
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.75rem', sm: '2.25rem' },
                    background: 'linear-gradient(45deg, #1e293b, #334155)',
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2
                  }}
                >
                  {cardData.formatted_value}
                </Typography>

                {cardData.status && (
                  <Chip
                    label={cardData.status.replace("_", " ").toUpperCase()}
                    size="small"
                    sx={{
                      background: `linear-gradient(45deg, ${getCreditScoreColor(cardData.status)}, ${getCreditScoreColor(cardData.status)}dd)`,
                      color: 'white',
                      fontWeight: 'bold',
                      boxShadow: `0 4px 12px ${getCreditScoreColor(cardData.status)}40`,
                      borderRadius: '8px'
                    }}
                  />
                )}

                {cardData.title === 'Credit Score' && cardData.value > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        Score Progress
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        {cardData.value}/850
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(cardData.value / 850) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(148, 163, 184, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: `linear-gradient(90deg, ${getCreditScoreColor(cardData.status)}, ${getCreditScoreColor(cardData.status)}cc)`,
                        },
                      }}
                    />
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Premium Net Worth Breakdown Chart Component with enhanced visuals
  const NetWorthBreakdownChart = ({ dashboardData }) => {
    if (!dashboardData?.summary_cards) return null;

    const prepareChartData = () => {
      const summaryCards = dashboardData.summary_cards;
      const assets = [
        { name: 'Bank Balance', value: summaryCards.bank_balance?.value || 0, color: CHART_COLORS[0] },
        { name: 'Investments', value: summaryCards.investments?.value || 0, color: CHART_COLORS[1] },
        { name: 'EPF Balance', value: summaryCards.epf_balance?.value || 0, color: CHART_COLORS[2] },
        { name: 'Indian Stocks', value: summaryCards.indian_stocks?.value || 0, color: CHART_COLORS[3] },
      ];

      const liabilities = [
        { name: 'Loans & Debts', value: summaryCards.loans_debts?.value || 0, color: CHART_COLORS[4] },
      ];

      return { assets: assets.filter(item => item.value > 0), liabilities: liabilities.filter(item => item.value > 0) };
    };

    const { assets, liabilities } = prepareChartData();
    const totalAssets = assets.reduce((sum, item) => sum + item.value, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.value, 0);
    const netWorth = totalAssets - totalLiabilities;

    const formatCurrency = (value) => {
      if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
      if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
      if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
      return `₹${value}`;
    };

    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      return percent > 0.05 ? (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      ) : null;
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Card 
          elevation={0} 
          sx={{ 
            height: '100%',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden'
          }}
        >
          <CardHeader
            avatar={
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  background: 'linear-gradient(45deg, #2563eb, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: '16px',
                    background: 'linear-gradient(45deg, rgba(255,255,255,0.3), transparent)',
                    pointerEvents: 'none'
                  }
                }}
              >
                <Assessment sx={{ color: 'white', fontSize: 28 }} />
              </Box>
            }
            title={
              <Typography variant="h5" fontWeight="700" sx={{ color: '#1e293b' }}>
                Net Worth Breakdown
              </Typography>
            }
            subheader={
              <Typography variant="subtitle1" sx={{ color: '#64748b', fontWeight: 500 }}>
                Assets vs Liabilities Distribution
              </Typography>
            }
            action={
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Net Worth
                </Typography>
                <Typography variant="h6" fontWeight="700" sx={{ 
                  color: netWorth >= 0 ? COLORS.emerald[0] : COLORS.error[0]
                }}>
                  {formatCurrency(netWorth)}
                </Typography>
              </Box>
            }
            sx={{ pb: 1 }}
          />
          <CardContent>
            <Grid container spacing={{ xs: 2, md: 4 }}>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
                  borderRadius: '16px',
                  p: 3,
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: COLORS.emerald[0], 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 3,
                    fontWeight: 700
                  }}>
                    <TrendingUpOutlined sx={{ mr: 1 }} />
                    Assets ({formatCurrency(totalAssets)})
                  </Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={assets}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={window.innerWidth < 600 ? 70 : 90}
                        fill="#8884d8"
                        dataKey="value"
                        strokeWidth={3}
                        stroke="#ffffff"
                      >
                        {assets.map((entry, index) => (
                          <Cell key={`asset-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value) => [formatCurrency(value), 'Value']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  background: liabilities.length > 0 
                    ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(185, 28, 28, 0.05))'
                    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
                  borderRadius: '16px',
                  p: 3,
                  border: liabilities.length > 0 
                    ? '1px solid rgba(220, 38, 38, 0.2)'
                    : '1px solid rgba(16, 185, 129, 0.2)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: liabilities.length > 0 ? COLORS.error[0] : COLORS.emerald[0], 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 3,
                    fontWeight: 700
                  }}>
                    {liabilities.length > 0 ? <Warning sx={{ mr: 1 }} /> : <CheckCircle sx={{ mr: 1 }} />}
                    Liabilities ({formatCurrency(totalLiabilities)})
                  </Typography>
                  
                  {liabilities.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={liabilities}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel}
                          outerRadius={window.innerWidth < 600 ? 70 : 90}
                          fill="#8884d8"
                          dataKey="value"
                          strokeWidth={3}
                          stroke="#ffffff"
                        >
                          {liabilities.map((entry, index) => (
                            <Cell key={`liability-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value) => [formatCurrency(value), 'Amount']}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: 280,
                      textAlign: 'center'
                    }}>
                      <CheckCircle sx={{ fontSize: 80, color: COLORS.emerald[0], mb: 2 }} />
                      <Typography variant="h5" sx={{ color: COLORS.emerald[0], fontWeight: 'bold', mb: 1 }}>
                        Debt Free! 🎉
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        You have no outstanding liabilities
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* Enhanced Financial Health Score */}
            <Box sx={{ 
              mt: 4, 
              p: 3, 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))',
              borderRadius: '16px',
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
              <Typography variant="h6" fontWeight="700" gutterBottom sx={{ color: COLORS.primary[0] }}>
                💎 Financial Health Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Box sx={{ width: '100%', mr: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((totalAssets / (totalAssets + totalLiabilities)) * 100, 100)}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      bgcolor: 'rgba(148, 163, 184, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 6,
                        background: 'linear-gradient(90deg, #10b981, #059669)',
                      },
                    }}
                  />
                </Box>
                <Typography variant="h6" sx={{ color: COLORS.emerald[0], fontWeight: 'bold', minWidth: 60 }}>
                  {Math.round((totalAssets / (totalAssets + totalLiabilities)) * 100)}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
                Asset to Total Value Ratio • Higher is better
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Investment Details Table Component
  // Premium Investment Details Table with Enhanced Design
  const InvestmentDetailsTable = ({ dashboardData }) => {
    const [selectedTab, setSelectedTab] = useState(0);
    
    const mfTransactions = dashboardData?.mutual_fund_transactions || [];
    const stockTransactions = dashboardData?.stock_transactions || [];
    const investmentData = dashboardData?.mutual_funds || [];
    const stockData = dashboardData?.indian_stocks || [];
    
    // Combine all investment data sources
    const allInvestments = [
      ...mfTransactions.map(mf => ({
        id: `mf-${mf.fund_name || 'Unknown'}-${Math.random()}`,
        type: 'Mutual Fund',
        name: mf.fund_name || 'Unknown Fund',
        currentValue: mf.current_value || 0,
        investedAmount: mf.invested_amount || 0,
        units: mf.units || 0,
        nav: mf.nav || 0,
        returns: (mf.current_value || 0) - (mf.invested_amount || 0),
        returnsPercentage: mf.invested_amount ? (((mf.current_value || 0) - (mf.invested_amount || 0)) / (mf.invested_amount || 1) * 100) : 0,
        category: mf.category || 'Equity',
        riskLevel: getRiskLevel(mf.category),
        lastUpdated: mf.date || new Date().toISOString().split('T')[0],
        source: 'mf_transactions'
      })),
      ...stockTransactions.map(stock => ({
        id: `stock-${stock.symbol || 'Unknown'}-${Math.random()}`,
        type: 'Stock',
        name: stock.symbol || 'Unknown Stock',
        currentValue: stock.current_value || 0,
        investedAmount: stock.invested_amount || 0,
        quantity: stock.quantity || 0,
        price: stock.current_price || 0,
        returns: (stock.current_value || 0) - (stock.invested_amount || 0),
        returnsPercentage: stock.invested_amount ? (((stock.current_value || 0) - (stock.invested_amount || 0)) / (stock.invested_amount || 1) * 100) : 0,
        category: 'Equity',
        riskLevel: 'High',
        lastUpdated: stock.date || new Date().toISOString().split('T')[0],
        source: 'stock_transactions'
      })),
      ...investmentData.map(fund => ({
        id: `legacy-mf-${fund.fund_name || 'Unknown'}-${Math.random()}`,
        type: 'Mutual Fund',
        name: fund.fund_name || 'Unknown Fund',
        currentValue: fund.current_value || 0,
        investedAmount: fund.invested_amount || 0,
        units: fund.units || 0,
        nav: fund.nav || 0,
        returns: (fund.current_value || 0) - (fund.invested_amount || 0),
        returnsPercentage: fund.invested_amount ? (((fund.current_value || 0) - (fund.invested_amount || 0)) / (fund.invested_amount || 1) * 100) : 0,
        category: fund.category || 'Equity',
        riskLevel: getRiskLevel(fund.category),
        lastUpdated: fund.date || new Date().toISOString().split('T')[0],
        source: 'mutual_funds'
      })),
      ...stockData.map(stock => ({
        id: `legacy-stock-${stock.stock_name || 'Unknown'}-${Math.random()}`,
        type: 'Stock',
        name: stock.stock_name || 'Unknown Stock',
        currentValue: stock.current_value || 0,
        investedAmount: stock.invested_amount || 0,
        quantity: stock.quantity || 0,
        price: stock.current_price || 0,
        returns: (stock.current_value || 0) - (stock.invested_amount || 0),
        returnsPercentage: stock.invested_amount ? (((stock.current_value || 0) - (stock.invested_amount || 0)) / (stock.invested_amount || 1) * 100) : 0,
        category: 'Equity',
        riskLevel: 'High',
        lastUpdated: stock.date || new Date().toISOString().split('T')[0],
        source: 'indian_stocks'
      }))
    ];

    function getRiskLevel(category) {
      const riskMap = {
        'equity': 'High',
        'debt': 'Low',
        'hybrid': 'Medium',
        'elss': 'High',
        'index': 'Medium'
      };
      return riskMap[category?.toLowerCase()] || 'Medium';
    }

    const formatCurrency = (value) => {
      if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
      if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
      if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
      return `₹${Math.abs(value)?.toFixed(0) || 0}`;
    };

    const getRiskColor = (level) => {
      const riskColors = {
        'High': COLORS.error[0],
        'Medium': COLORS.warning[0],
        'Low': COLORS.emerald[0]
      };
      return riskColors[level] || COLORS.neutral[0];
    };

    const getReturnColor = (returnValue) => {
      return returnValue >= 0 ? COLORS.emerald[0] : COLORS.error[0];
    };

    const totalInvested = allInvestments.reduce((sum, inv) => sum + inv.investedAmount, 0);
    const totalCurrent = allInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalReturns = totalCurrent - totalInvested;
    const totalReturnsPercentage = totalInvested ? (totalReturns / totalInvested * 100) : 0;

    const mutualFunds = allInvestments.filter(inv => inv.type === 'Mutual Fund');
    const stocks = allInvestments.filter(inv => inv.type === 'Stock');

    const currentInvestments = selectedTab === 0 ? mutualFunds : stocks;

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <Card 
          elevation={0} 
          sx={{ 
            height: '100%',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden'
          }}
        >
          <CardHeader
            avatar={
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  background: totalReturns >= 0 
                    ? 'linear-gradient(45deg, #10b981, #059669)' 
                    : 'linear-gradient(45deg, #ef4444, #dc2626)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: totalReturns >= 0 
                    ? '0 8px 16px rgba(16, 185, 129, 0.3)'
                    : '0 8px 16px rgba(239, 68, 68, 0.3)',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: '16px',
                    background: 'linear-gradient(45deg, rgba(255,255,255,0.3), transparent)',
                    pointerEvents: 'none'
                  }
                }}
              >
                <TrendingUp sx={{ color: 'white', fontSize: 28 }} />
              </Box>
            }
            title={
              <Typography variant="h5" fontWeight="700" sx={{ color: '#1e293b' }}>
                Investment Portfolio
              </Typography>
            }
            subheader={
              <Typography variant="subtitle1" sx={{ color: '#64748b', fontWeight: 500 }}>
                Comprehensive view of your investment holdings
              </Typography>
            }
            action={
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Portfolio Value
                </Typography>
                <Typography variant="h6" fontWeight="700" sx={{ 
                  color: getReturnColor(totalReturns)
                }}>
                  {formatCurrency(totalCurrent)}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: getReturnColor(totalReturns),
                  fontWeight: 600,
                  display: 'block'
                }}>
                  {totalReturns >= 0 ? '+' : ''}{totalReturnsPercentage.toFixed(2)}%
                </Typography>
              </Box>
            }
            sx={{ pb: 1 }}
          />
          <CardContent sx={{ p: 0 }}>
            {allInvestments.length > 0 ? (
              <>
                {/* Premium Summary Cards */}
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={4}>
                      <Card elevation={0} sx={{
                        p: 2,
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))',
                        borderRadius: '16px',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderLeft: `4px solid ${COLORS.primary[0]}`
                      }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                          Total Invested
                        </Typography>
                        <Typography variant="h5" fontWeight="700" sx={{ color: COLORS.primary[0] }}>
                          {formatCurrency(totalInvested)}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Card elevation={0} sx={{
                        p: 2,
                        background: totalReturns >= 0 
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))'
                          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))',
                        borderRadius: '16px',
                        border: `1px solid ${totalReturns >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                        borderLeft: `4px solid ${getReturnColor(totalReturns)}`
                      }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                          Total Returns
                        </Typography>
                        <Typography variant="h5" fontWeight="700" sx={{ color: getReturnColor(totalReturns) }}>
                          {totalReturns >= 0 ? '+' : ''}{formatCurrency(totalReturns)}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Card elevation={0} sx={{
                        p: 2,
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.05))',
                        borderRadius: '16px',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        borderLeft: `4px solid ${COLORS.accent[0]}`
                      }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                          Holdings Count
                        </Typography>
                        <Typography variant="h5" fontWeight="700" sx={{ color: COLORS.accent[0] }}>
                          {allInvestments.length}
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Premium Tabs */}
                  <Tabs 
                    value={selectedTab} 
                    onChange={(e, newValue) => setSelectedTab(newValue)} 
                    sx={{ 
                      borderBottom: '2px solid rgba(148, 163, 184, 0.1)', 
                      mb: 3,
                      '& .MuiTab-root': {
                        minWidth: 'auto',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#64748b',
                        '&.Mui-selected': {
                          color: COLORS.primary[0],
                          fontWeight: 700
                        }
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: COLORS.primary[0],
                        height: 3,
                        borderRadius: '2px'
                      }
                    }}
                  >
                    <Tab 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ShowChart />
                          Mutual Funds ({mutualFunds.length})
                        </Box>
                      }
                    />
                    <Tab 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUp />
                          Stocks ({stocks.length})
                        </Box>
                      }
                    />
                  </Tabs>
                </Box>

                {/* Premium Investment Table */}
                <Box sx={{ overflow: 'hidden' }}>
                  <TableContainer sx={{ 
                    maxHeight: 600,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'rgba(0,0,0,0.1)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '4px',
                    },
                  }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ 
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))',
                            backdropFilter: 'blur(10px)',
                            fontWeight: 700,
                            color: '#1e293b',
                            borderBottom: '2px solid rgba(148, 163, 184, 0.2)'
                          }}>
                            Investment
                          </TableCell>
                          <TableCell align="right" sx={{ 
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))',
                            backdropFilter: 'blur(10px)',
                            fontWeight: 700,
                            color: '#1e293b',
                            borderBottom: '2px solid rgba(148, 163, 184, 0.2)'
                          }}>
                            Current Value
                          </TableCell>
                          <TableCell align="right" sx={{ 
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))',
                            backdropFilter: 'blur(10px)',
                            fontWeight: 700,
                            color: '#1e293b',
                            borderBottom: '2px solid rgba(148, 163, 184, 0.2)'
                          }}>
                            Returns
                          </TableCell>
                          <TableCell align="center" sx={{ 
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))',
                            backdropFilter: 'blur(10px)',
                            fontWeight: 700,
                            color: '#1e293b',
                            borderBottom: '2px solid rgba(148, 163, 184, 0.2)'
                          }}>
                            Risk
                          </TableCell>
                          <TableCell align="center" sx={{ 
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))',
                            backdropFilter: 'blur(10px)',
                            fontWeight: 700,
                            color: '#1e293b',
                            borderBottom: '2px solid rgba(148, 163, 184, 0.2)'
                          }}>
                            Status
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentInvestments.map((investment, index) => (
                          <TableRow 
                            key={investment.id}
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                              },
                              borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '12px',
                                    background: investment.type === 'Mutual Fund' 
                                      ? 'linear-gradient(45deg, #3b82f6, #2563eb)'
                                      : 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                                  }}
                                >
                                  {investment.type === 'Mutual Fund' ? (
                                    <AccountBalance sx={{ color: 'white', fontSize: 20 }} />
                                  ) : (
                                    <TrendingUp sx={{ color: 'white', fontSize: 20 }} />
                                  )}
                                </Box>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#1e293b' }}>
                                    {investment.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                                    {investment.category}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#1e293b' }}>
                                {formatCurrency(investment.currentValue)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                Invested: {formatCurrency(investment.investedAmount)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography 
                                variant="subtitle2" 
                                fontWeight="700" 
                                sx={{ color: getReturnColor(investment.returns) }}
                              >
                                {investment.returns >= 0 ? '+' : ''}{formatCurrency(investment.returns)}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: getReturnColor(investment.returns),
                                  fontWeight: 600,
                                  display: 'block'
                                }}
                              >
                                {investment.returnsPercentage >= 0 ? '+' : ''}{investment.returnsPercentage.toFixed(2)}%
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={investment.riskLevel}
                                size="small"
                                sx={{
                                  backgroundColor: `${getRiskColor(investment.riskLevel)}20`,
                                  color: getRiskColor(investment.riskLevel),
                                  fontWeight: 600,
                                  border: `1px solid ${getRiskColor(investment.riskLevel)}40`
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                icon={investment.returns >= 0 ? <TrendingUp /> : <TrendingDown />}
                                label={investment.returns >= 0 ? 'Profit' : 'Loss'}
                                color={investment.returns >= 0 ? 'success' : 'error'}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  '& .MuiChip-icon': {
                                    fontSize: 16
                                  }
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                py: 8,
                px: 3
              }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <AccountBalance sx={{ fontSize: 100, color: COLORS.primary[0], mb: 3 }} />
                </motion.div>
                <Typography variant="h4" sx={{ color: COLORS.primary[0], fontWeight: 'bold', mb: 2 }}>
                  Start Your Investment Journey
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                  No investments found in your portfolio.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Begin building wealth with mutual funds and stocks!
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Premium Enhanced Liabilities Summary with Modern Bar Chart Design
  const EnhancedLiabilitiesSummary = ({ dashboardData }) => {
    const bankTransactions = dashboardData?.bank_transactions || [];
    
    // Categorize different types of loans and debts
    const categorizeLiabilities = () => {
      const categories = {
        'Home Loan': 0,
        'Car Loan': 0,
        'Personal Loan': 0,
        'Credit Card': 0,
        'Education Loan': 0,
        'Other EMI': 0
      };

      bankTransactions.forEach(transaction => {
        if (transaction.amount < 0) {
          const desc = transaction.description?.toLowerCase() || '';
          const amount = Math.abs(transaction.amount);
          
          if (desc.includes('home') || desc.includes('housing') || desc.includes('mortgage')) {
            categories['Home Loan'] += amount;
          } else if (desc.includes('car') || desc.includes('auto') || desc.includes('vehicle')) {
            categories['Car Loan'] += amount;
          } else if (desc.includes('personal') || desc.includes('pl')) {
            categories['Personal Loan'] += amount;
          } else if (desc.includes('credit card') || desc.includes('cc') || desc.includes('card')) {
            categories['Credit Card'] += amount;
          } else if (desc.includes('education') || desc.includes('student') || desc.includes('study')) {
            categories['Education Loan'] += amount;
          } else if (desc.includes('emi') || desc.includes('loan')) {
            categories['Other EMI'] += amount;
          }
        }
      });

      return Object.entries(categories)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({ name, value }));
    };

    const liabilityData = categorizeLiabilities();
    const totalLiabilities = liabilityData.reduce((sum, item) => sum + item.value, 0);

    const formatCurrency = (value) => {
      if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
      if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
      if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
      return `₹${Math.abs(value)?.toFixed(0) || 0}`;
    };

    const getBarColor = (index) => {
      const colors = [COLORS.error[0], COLORS.warning[0], COLORS.info[0], COLORS.accent[0], COLORS.neutral[0], COLORS.primary[0]];
      return colors[index % colors.length];
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <Card 
          elevation={0} 
          sx={{ 
            height: '100%',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden'
          }}
        >
          <CardHeader
            avatar={
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  background: totalLiabilities > 0 
                    ? 'linear-gradient(45deg, #ef4444, #dc2626)' 
                    : 'linear-gradient(45deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: totalLiabilities > 0 
                    ? '0 8px 16px rgba(239, 68, 68, 0.3)'
                    : '0 8px 16px rgba(16, 185, 129, 0.3)',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: '16px',
                    background: 'linear-gradient(45deg, rgba(255,255,255,0.3), transparent)',
                    pointerEvents: 'none'
                  }
                }}
              >
                {totalLiabilities > 0 ? (
                  <AccountBalanceWallet sx={{ color: 'white', fontSize: 28 }} />
                ) : (
                  <CheckCircle sx={{ color: 'white', fontSize: 28 }} />
                )}
              </Box>
            }
            title={
              <Typography variant="h5" fontWeight="700" sx={{ color: '#1e293b' }}>
                Liabilities Breakdown
              </Typography>
            }
            subheader={
              <Typography variant="subtitle1" sx={{ color: '#64748b', fontWeight: 500 }}>
                {totalLiabilities > 0 ? 'Detailed analysis of your debt obligations' : 'Debt-free financial status'}
              </Typography>
            }
            action={
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Total Debt
                </Typography>
                <Typography variant="h6" fontWeight="700" sx={{ 
                  color: totalLiabilities > 0 ? COLORS.error[0] : COLORS.emerald[0]
                }}>
                  {formatCurrency(totalLiabilities)}
                </Typography>
              </Box>
            }
            sx={{ pb: 1 }}
          />
          <CardContent>
            {totalLiabilities > 0 ? (
              <>
                {/* Premium Bar Chart */}
                <Box sx={{ 
                  mb: 4,
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(220, 38, 38, 0.02))',
                  borderRadius: '16px',
                  p: 3,
                  border: '1px solid rgba(239, 68, 68, 0.1)'
                }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    color: COLORS.error[0],
                    fontWeight: 700,
                    mb: 3
                  }}>
                    <Assessment />
                    Liability Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={liabilityData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        fontSize={12}
                        fontWeight={600}
                        stroke="#64748b"
                      />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value)}
                        fontSize={12}
                        fontWeight={600}
                        stroke="#64748b"
                      />
                      <RechartsTooltip 
                        formatter={(value) => [formatCurrency(value), 'Amount']}
                        labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[8, 8, 0, 0]}
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {liabilityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>

                {/* Premium Summary Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {liabilityData.map((liability, index) => (
                    <Grid item xs={12} sm={6} md={4} key={liability.name}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Card 
                          elevation={0}
                          sx={{ 
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderLeft: `4px solid ${getBarColor(index)}`,
                            p: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)'
                            }
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#1e293b', mb: 1 }}>
                            {liability.name}
                          </Typography>
                          <Typography variant="h5" fontWeight="800" sx={{ color: getBarColor(index), mb: 1 }}>
                            {formatCurrency(liability.value)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                            {((liability.value / totalLiabilities) * 100).toFixed(1)}% of total debt
                          </Typography>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>

                {/* Premium Financial Health Insights */}
                <Box sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))',
                  borderRadius: '16px', 
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <Typography variant="h6" fontWeight="700" gutterBottom sx={{ color: COLORS.error[0] }}>
                    💡 Debt Management Insights
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        Highest Liability
                      </Typography>
                      <Typography variant="body1" fontWeight="700" sx={{ color: COLORS.error[0] }}>
                        {liabilityData.length > 0 ? liabilityData.reduce((max, curr) => max.value > curr.value ? max : curr).name : 'None'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        Debt Categories
                      </Typography>
                      <Typography variant="body1" fontWeight="700" sx={{ color: COLORS.error[0] }}>
                        {liabilityData.length} Active
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                py: 8,
                textAlign: 'center'
              }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <CheckCircle sx={{ fontSize: 100, color: COLORS.emerald[0], mb: 3 }} />
                </motion.div>
                <Typography variant="h4" sx={{ color: COLORS.emerald[0], fontWeight: 'bold', mb: 2 }}>
                  Debt Free! 🎉
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  Congratulations! You have no outstanding debt obligations.
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Keep up the excellent financial discipline!
                </Typography>
                
                {/* Success celebration card */}
                <Box sx={{
                  mt: 4,
                  p: 3,
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
                  borderRadius: '16px',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  maxWidth: 400
                }}>
                  <Typography variant="subtitle1" fontWeight="700" sx={{ color: COLORS.emerald[0], mb: 1 }}>
                    🏆 Financial Achievement
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Being debt-free puts you in an excellent position to build wealth and achieve your financial goals.
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Alerts and Recommendations Component
  const AlertsAndRecommendations = ({ dashboardData }) => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
      const generateAlerts = () => {
        const newAlerts = [];
        const summaryCards = dashboardData?.summary_cards || {};
        const creditData = dashboardData?.credit_report || {};
        const bankTransactions = dashboardData?.bank_transactions || [];

        // Low bank balance alert
        if (summaryCards.bank_balance?.value < 50000) {
          newAlerts.push({
            id: 1,
            type: 'warning',
            title: 'Low Bank Balance',
            message: 'Your bank balance is below ₹50,000. Consider building an emergency fund.',
            icon: <Warning />,
            priority: 'high'
          });
        }

        // Credit score improvement
        if (creditData.credit_score < 700) {
          newAlerts.push({
            id: 2,
            type: 'info',
            title: 'Credit Score Improvement',
            message: 'Your credit score can be improved. Pay bills on time and reduce credit utilization.',
            icon: <Info />,
            priority: 'medium'
          });
        }

        // Investment diversification
        const totalInvestments = (summaryCards.investments?.value || 0) + (summaryCards.indian_stocks?.value || 0);
        const totalAssets = summaryCards.bank_balance?.value || 0;
        if (totalInvestments < totalAssets * 0.3) {
          newAlerts.push({
            id: 3,
            type: 'success',
            title: 'Investment Opportunity',
            message: 'Consider diversifying your portfolio with more investments for better returns.',
            icon: <TrendingUp />,
            priority: 'low'
          });
        }

        // Unusual spending alert
        const recentTransactions = bankTransactions.slice(0, 10);
        const avgTransactionAmount = recentTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / recentTransactions.length;
        const highSpendingTransactions = recentTransactions.filter(t => Math.abs(t.amount) > avgTransactionAmount * 2);
        
        if (highSpendingTransactions.length > 0) {
          newAlerts.push({
            id: 4,
            type: 'warning',
            title: 'Unusual Spending Detected',
            message: `${highSpendingTransactions.length} high-value transactions detected. Review your recent spending.`,
            icon: <Warning />,
            priority: 'medium'
          });
        }

        // Positive alerts
        if (creditData.credit_score >= 750) {
          newAlerts.push({
            id: 5,
            type: 'success',
            title: 'Excellent Credit Score!',
            message: 'Your credit score is excellent. You qualify for the best loan rates.',
            icon: <CheckCircle />,
            priority: 'low'
          });
        }

        setAlerts(newAlerts);
      };

      if (dashboardData) {
        generateAlerts();
      }
    }, [dashboardData]);

    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'high': return 'error';
        case 'medium': return 'warning';
        case 'low': return 'info';
        default: return 'info';
      }
    };

    return (
      <Card elevation={4}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: COLORS.info[0] }}>
              <NotificationsActive />
            </Avatar>
          }
          title="Smart Alerts & Recommendations"
          subheader="Personalized insights for your financial health"
          action={
            <Chip
              label={`${alerts.length} Active`}
              color="primary"
              variant="outlined"
            />
          }
        />
        <CardContent>
          {alerts.length > 0 ? (
            <List>
              {alerts.map((alert) => (
                <ListItem key={alert.id} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `${getPriorityColor(alert.priority)}.main` }}>
                      {alert.icon}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {alert.title}
                        </Typography>
                        <Chip
                          label={alert.priority}
                          size="small"
                          color={getPriorityColor(alert.priority)}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {alert.message}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <CheckCircle sx={{ fontSize: 60, color: COLORS.success[0], mb: 2 }} />
              <Typography variant="h6" color="success.main" fontWeight="bold" gutterBottom>
                All Good!
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No alerts at the moment. Your finances look healthy!
              </Typography>
            </Box>
          )}

          {/* Quick Action Recommendations */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary.main">
              💡 Quick Recommendations
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <Chip label="Track Expenses" size="small" variant="outlined" color="primary" />
              <Chip label="Build Emergency Fund" size="small" variant="outlined" color="primary" />
              <Chip label="Review Investments" size="small" variant="outlined" color="primary" />
              <Chip label="Monitor Credit Score" size="small" variant="outlined" color="primary" />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const RecentTransactions = ({ transactions }) => {
    if (!transactions || transactions.length === 0) {
      return <Alert severity="info">No recent transactions available</Alert>;
    }

    return (
      <List>
        {transactions.map((txn, index) => (
          <React.Fragment key={index}>
            <ListItem>
              <ListItemIcon>
                {txn.type === "credit" ? (
                  <ArrowUpward sx={{ color: "green" }} />
                ) : (
                  <ArrowDownward sx={{ color: "red" }} />
                )}
              </ListItemIcon>
              <ListItemText primary={txn.description} secondary={txn.date} />
              <Typography
                variant="body2"
                color={txn.type === "credit" ? "green" : "red"}
                fontWeight="bold"
              >
                {txn.type === "credit" ? "+" : "-"}₹
                {Math.abs(txn.amount).toLocaleString()}
              </Typography>
            </ListItem>
            {index < transactions.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    );
  };

  const AssetDistributionChart = () => {
    if (!dashboardData?.summary_cards) return null;

    const chartData = Object.entries(dashboardData.summary_cards)
      .filter(([key, data]) => data.value > 0 && !data.error)
      .map(([key, data]) => ({
        name: data.title,
        value: data.value,
        formatted: data.formatted_value,
      }));

    if (chartData.length === 0) {
      return <Alert severity="info">No asset data available for chart</Alert>;
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              chartData.find((d) => d.name === name)?.formatted || value,
              name,
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const NetWorthOverview = () => {
    if (!dashboardData?.summary_cards) return null;

    const assets = [
      dashboardData.summary_cards.bank_balance,
      dashboardData.summary_cards.investments,
      dashboardData.summary_cards.epf_balance,
      dashboardData.summary_cards.indian_stocks,
    ].filter((item) => item && item.value > 0);

    const liabilities = [dashboardData.summary_cards.loans_debts].filter(
      (item) => item && item.value > 0
    );

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Assets Breakdown
            </Typography>
            <List dense>
              {assets.map((asset, index) => (
                <ListItem key={index}>
                  <ListItemIcon>{getIconComponent(asset.icon)}</ListItemIcon>
                  <ListItemText
                    primary={asset.title}
                    secondary={asset.formatted_value}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Liabilities
            </Typography>
            <List dense>
              {liabilities.map((liability, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {getIconComponent(liability.icon)}
                  </ListItemIcon>
                  <ListItemText
                    primary={liability.title}
                    secondary={liability.formatted_value}
                  />
                </ListItem>
              ))}
              {liabilities.length === 0 && (
                <ListItem>
                  <ListItemText primary="No liabilities recorded" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading your financial dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert
          severity="error"
          action={
            <IconButton
              aria-label="retry"
              color="inherit"
              size="small"
              onClick={fetchDashboardData}
            >
              <Refresh />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">
          No dashboard data available. Please ensure you are authenticated.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'auto',
      pb: 4
    }}>
      {/* Background Pattern Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)`,
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <Container 
        maxWidth="xl" 
        sx={{ 
          py: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 3, md: 4 },
          position: 'relative',
          zIndex: 1
        }}
      >
      {/* Premium Header with Glass Morphism Effect */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            p: { xs: 3, md: 4 },
            mb: { xs: 3, md: 4 },
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={{ xs: 2, sm: 0 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 16px rgba(255, 215, 0, 0.3)'
                }}
              >
                <AccountBalance sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Box>
                <Typography 
                  variant={{ xs: 'h5', sm: 'h4' }} 
                  component="h1" 
                  fontWeight="700"
                  sx={{
                    background: 'linear-gradient(45deg, #ffffff, #f8fafc)',
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textAlign: { xs: 'center', sm: 'left' }
                  }}
                >
                  Money Lens Dashboard
                </Typography>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: 500,
                    textAlign: { xs: 'center', sm: 'left' }
                  }}
                >
                  Your Comprehensive Financial Overview
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip
                label="Live Data"
                sx={{
                  background: 'linear-gradient(45deg, #10b981, #059669)',
                  color: 'white',
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: 'white' }
                }}
                icon={<CheckCircle sx={{ fontSize: 16 }} />}
              />
              <IconButton 
                onClick={fetchDashboardData} 
                disabled={loading}
                sx={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                    transform: 'scale(1.05)'
                  },
                  '&:disabled': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.5)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Refresh />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* Enhanced Summary Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={{ xs: 2, sm: 3 }} mb={{ xs: 3, md: 4 }}>
          {dashboardData.summary_cards &&
            Object.entries(dashboardData.summary_cards).map(([key, cardData]) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
                <EnhancedSummaryCard cardData={cardData} title={key} />
              </Grid>
            ))}
        </Grid>
      </motion.div>

      {/* Modern Dashboard Components */}
      <Grid container spacing={{ xs: 2, sm: 3 }} mb={{ xs: 3, md: 4 }}>
        <Grid item xs={12}>
          <NetWorthBreakdownChart dashboardData={dashboardData} />
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 2, sm: 3 }} mb={{ xs: 3, md: 4 }}>
        <Grid item xs={12}>
          <InvestmentDetailsTable dashboardData={dashboardData} />
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 2, sm: 3 }} mb={{ xs: 3, md: 4 }}>
        <Grid item xs={12} md={6}>
          <EnhancedLiabilitiesSummary dashboardData={dashboardData} />
        </Grid>
        <Grid item xs={12} md={6}>
          <AlertsAndRecommendations dashboardData={dashboardData} />
        </Grid>
      </Grid>

      {/* Detailed Views */}
      <Paper sx={{ width: "100%", mb: { xs: 3, md: 4 } }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="dashboard tabs"
          >
            <Tab label="Overview" />
            <Tab label="Net Worth" />
            <Tab label="Transactions" />
            <Tab label="Investments" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Typography variant="h6" gutterBottom>
                Asset Distribution
              </Typography>
              <AssetDistributionChart />
            </Grid>
            <Grid item xs={12} lg={6}>
              <Typography variant="h6" gutterBottom>
                Quick Summary
              </Typography>
              <Box>
                {dashboardData.summary_cards?.total_net_worth && (
                  <Typography variant="body1" paragraph>
                    Your total net worth is{" "}
                    <strong>
                      {
                        dashboardData.summary_cards.total_net_worth
                          .formatted_value
                      }
                    </strong>
                  </Typography>
                )}
                {dashboardData.summary_cards?.credit_score && (
                  <Typography variant="body1" paragraph>
                    Credit Score:{" "}
                    <strong>
                      {dashboardData.summary_cards.credit_score.formatted_value}
                    </strong>
                    {dashboardData.summary_cards.credit_score.status && (
                      <Chip
                        label={dashboardData.summary_cards.credit_score.status.replace(
                          "_",
                          " "
                        )}
                        size="small"
                        sx={{
                          ml: 1,
                          bgcolor: getCreditScoreColor(
                            dashboardData.summary_cards.credit_score.status
                          ),
                          color: "white",
                        }}
                      />
                    )}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <NetWorthOverview />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Recent Transactions
          </Typography>
          <RecentTransactions
            transactions={dashboardData.recent_transactions}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Investment Portfolio
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Mutual Funds
                </Typography>
                <Typography variant="h5">
                  {dashboardData.summary_cards?.investments?.formatted_value ||
                    "Not Available"}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Indian Stocks
                </Typography>
                <Typography variant="h5">
                  {dashboardData.summary_cards?.indian_stocks
                    ?.formatted_value || "Not Available"}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Footer */}
      <Box mt={4} textAlign="center">
        <Typography variant="caption" color="textSecondary">
          {dashboardData.metadata?.last_updated &&
            `Last updated: ${new Date(
              dashboardData.metadata.last_updated
            ).toLocaleString()}`}
        </Typography>
      </Box>
    </Container>
    </Box>
  );
};

export default FinancialDashboard;
