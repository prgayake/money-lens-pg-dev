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
  Error,
  Info,
  BusinessCenter,
  Home,
  DirectionsCar,
  CreditScore,
  AccountBalanceOutlined,
  TrendingUpOutlined,
  InsightsOutlined,
} from "@mui/icons-material";
import { motion } from "framer-motion";

// Enhanced color palette for better visual hierarchy
const COLORS = {
  primary: ["#1976d2", "#42a5f5", "#64b5f6", "#90caf9", "#bbdefb"],
  success: ["#388e3c", "#66bb6a", "#81c784", "#a5d6a7", "#c8e6c9"],
  warning: ["#f57c00", "#ffb74d", "#ffcc02", "#ffd54f", "#fff176"],
  error: ["#d32f2f", "#ef5350", "#e57373", "#ef9a9a", "#ffcdd2"],
  info: ["#0288d1", "#29b6f6", "#4fc3f7", "#81d4fa", "#b3e5fc"],
  neutral: ["#424242", "#757575", "#9e9e9e", "#bdbdbd", "#e0e0e0"],
  accent: ["#7b1fa2", "#8e24aa", "#ab47bc", "#ba68c8", "#ce93d8"],
};

const CHART_COLORS = ["#1976d2", "#388e3c", "#f57c00", "#d32f2f", "#7b1fa2", "#0288d1", "#689f38", "#fbc02d"];

// Animation variants for smooth transitions
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  hover: { scale: 1.02, transition: { duration: 0.2 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
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

  // Enhanced Summary Card Component with animations and better styling
  const EnhancedSummaryCard = ({ cardData, title, index }) => {
    if (!cardData) return null;

    const getGradientBackground = (iconName) => {
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

    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        style={{ height: '100%' }}
      >
        <Card 
          elevation={cardData.error ? 1 : 4} 
          sx={{ 
            height: '100%', 
            position: 'relative',
            background: cardData.error ? 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: cardData.error ? '1px solid #e17055' : '1px solid #e0e0e0',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: cardData.error ? 3 : 8,
              transform: 'translateY(-2px)'
            }
          }}
        >
          <CardContent sx={{ pb: '16px !important' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Avatar
                sx={{
                  background: cardData.error ? '#e17055' : getGradientBackground(cardData.icon),
                  width: 48,
                  height: 48,
                  boxShadow: 3,
                }}
              >
                {getIconComponent(cardData.icon)}
              </Avatar>
              {cardData.change && (
                <Tooltip title={`${cardData.change.direction === 'up' ? 'Increased' : 'Decreased'} by ${Math.abs(cardData.change.percentage)}%`}>
                  <Chip
                    icon={getTrendIcon(cardData.change.direction)}
                    label={`${Math.abs(cardData.change.percentage)}%`}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: cardData.change.direction === 'up' ? COLORS.success[0] : COLORS.error[0],
                      color: cardData.change.direction === 'up' ? COLORS.success[0] : COLORS.error[0],
                      fontWeight: 'bold'
                    }}
                  />
                </Tooltip>
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={500}>
              {cardData.title}
            </Typography>

            {cardData.error ? (
              <Alert severity="warning" size="small" sx={{ mt: 1 }}>
                Data unavailable
              </Alert>
            ) : (
              <Box>
                <Typography 
                  variant="h4" 
                  component="div" 
                  fontWeight="bold"
                  sx={{
                    background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {cardData.formatted_value}
                </Typography>

                {cardData.status && (
                  <Chip
                    label={cardData.status.replace("_", " ").toUpperCase()}
                    size="small"
                    sx={{
                      mt: 1,
                      bgcolor: getCreditScoreColor(cardData.status),
                      color: 'white',
                      fontWeight: 'bold',
                      boxShadow: 2,
                    }}
                  />
                )}

                {cardData.title === 'Credit Score' && cardData.value > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(cardData.value / 850) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: getCreditScoreColor(cardData.status),
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {cardData.value}/850
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Net Worth Breakdown Chart Component
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
      <Card elevation={4} sx={{ height: '100%' }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: COLORS.primary[0] }}>
              <Assessment />
            </Avatar>
          }
          title="Net Worth Breakdown"
          subheader="Assets vs Liabilities Distribution"
          action={
            <Chip 
              label={`Net Worth: ${formatCurrency(totalAssets - totalLiabilities)}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          }
        />
        <CardContent>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpOutlined sx={{ mr: 1 }} />
                Assets ({formatCurrency(totalAssets)})
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={assets}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={window.innerWidth < 600 ? 60 : 80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assets.map((entry, index) => (
                      <Cell key={`asset-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="error" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ mr: 1 }} />
                Liabilities ({formatCurrency(totalLiabilities)})
              </Typography>
              {liabilities.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={liabilities}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={window.innerWidth < 600 ? 60 : 80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {liabilities.map((entry, index) => (
                        <Cell key={`liability-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                  <CheckCircle sx={{ fontSize: 60, color: COLORS.success[0], mb: 2 }} />
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    Debt Free!
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    You have no outstanding liabilities
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>

          {/* Net Worth Progress */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Financial Health Score
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((totalAssets / (totalAssets + totalLiabilities)) * 100, 100)}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: 'grey.300',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: `linear-gradient(45deg, ${COLORS.success[0]} 30%, ${COLORS.success[1]} 90%)`,
                    },
                  }}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary" fontWeight="bold">
                  {Math.round((totalAssets / (totalAssets + totalLiabilities)) * 100)}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Asset to Total Value Ratio
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Investment Details Table Component
  const InvestmentDetailsTable = ({ dashboardData }) => {
    const investmentData = dashboardData?.mutual_funds || [];
    const stockData = dashboardData?.indian_stocks || [];

    const [selectedTab, setSelectedTab] = useState(0);
    const [expanded, setExpanded] = useState(false);

    const formatCurrency = (value) => {
      if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
      if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
      if (value >= 1000) return `₹${(value / 1000).toFixed(2)}K`;
      return `₹${value?.toFixed(2) || 0}`;
    };

    const calculateGainLoss = (current, invested) => {
      const gain = current - invested;
      const percentage = invested ? ((gain / invested) * 100) : 0;
      return { gain, percentage };
    };

    const MutualFundTable = () => (
      <TableContainer component={Paper} elevation={0} sx={{ overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Fund Name</strong></TableCell>
              <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Units</strong></TableCell>
              <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>NAV</strong></TableCell>
              <TableCell align="right"><strong>Current Value</strong></TableCell>
              <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>Invested</strong></TableCell>
              <TableCell align="right"><strong>Gain/Loss</strong></TableCell>
              <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {investmentData.map((fund, index) => {
              const { gain, percentage } = calculateGainLoss(fund.current_value, fund.invested_amount);
              return (
                <TableRow key={index} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {fund.fund_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                        {fund.fund_house}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    {fund.units?.toFixed(3)}
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {formatCurrency(fund.nav)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {formatCurrency(fund.current_value)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {formatCurrency(fund.invested_amount)}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Typography variant="body2" color={gain >= 0 ? 'success.main' : 'error.main'} fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {gain >= 0 ? '+' : ''}{formatCurrency(gain)}
                      </Typography>
                      <Typography variant="caption" color={gain >= 0 ? 'success.main' : 'error.main'}>
                        ({percentage >= 0 ? '+' : ''}{percentage.toFixed(2)}%)
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Chip
                      label={gain >= 0 ? 'Profit' : 'Loss'}
                      color={gain >= 0 ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );

    const StockTable = () => (
      <TableContainer component={Paper} elevation={0} sx={{ overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Stock Name</strong></TableCell>
              <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Quantity</strong></TableCell>
              <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>Avg. Price</strong></TableCell>
              <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>Current Price</strong></TableCell>
              <TableCell align="right"><strong>Current Value</strong></TableCell>
              <TableCell align="right"><strong>Gain/Loss</strong></TableCell>
              <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Performance</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stockData.map((stock, index) => {
              const { gain, percentage } = calculateGainLoss(stock.current_value, stock.invested_amount);
              return (
                <TableRow key={index} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {stock.stock_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                        {stock.exchange}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    {stock.quantity}
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {formatCurrency(stock.avg_price)}
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {formatCurrency(stock.current_price)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {formatCurrency(stock.current_value)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Typography variant="body2" color={gain >= 0 ? 'success.main' : 'error.main'} fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {gain >= 0 ? '+' : ''}{formatCurrency(gain)}
                      </Typography>
                      <Typography variant="caption" color={gain >= 0 ? 'success.main' : 'error.main'}>
                        ({percentage >= 0 ? '+' : ''}{percentage.toFixed(2)}%)
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Chip
                      icon={gain >= 0 ? <TrendingUp /> : <TrendingDown />}
                      label={`${percentage.toFixed(1)}%`}
                      color={gain >= 0 ? 'success' : 'error'}
                      size="small"
                      variant="filled"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );

    const totalInvestmentValue = [...investmentData, ...stockData].reduce((sum, item) => sum + (item.current_value || 0), 0);
    const totalInvested = [...investmentData, ...stockData].reduce((sum, item) => sum + (item.invested_amount || 0), 0);
    const totalGainLoss = totalInvestmentValue - totalInvested;

    return (
      <Card elevation={4}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: COLORS.info[0] }}>
              <AccountBalance />
            </Avatar>
          }
          title="Investment Portfolio"
          subheader={`Total Portfolio Value: ${formatCurrency(totalInvestmentValue)}`}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`${totalGainLoss >= 0 ? '+' : ''}${formatCurrency(totalGainLoss)}`}
                color={totalGainLoss >= 0 ? 'success' : 'error'}
                variant="filled"
              />
              <Chip
                label={`${((totalGainLoss / totalInvested) * 100).toFixed(1)}%`}
                color={totalGainLoss >= 0 ? 'success' : 'error'}
                variant="outlined"
              />
            </Box>
          }
        />
        <CardContent>
          <Tabs 
            value={selectedTab} 
            onChange={(e, newValue) => setSelectedTab(newValue)} 
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider', 
              mb: 2,
              '& .MuiTab-root': {
                minWidth: 'auto',
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }
            }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShowChart />
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Mutual Funds</Box>
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>MF</Box>
                  ({investmentData.length})
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp />
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Stocks</Box>
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>Stocks</Box>
                  ({stockData.length})
                </Box>
              }
            />
          </Tabs>

          <Collapse in={!expanded}>
            <Box sx={{ 
              maxHeight: { xs: 300, sm: 400 }, 
              overflow: 'auto',
              '& .MuiTableContainer-root': {
                overflow: 'auto'
              }
            }}>
              {selectedTab === 0 ? <MutualFundTable /> : <StockTable />}
            </Box>
          </Collapse>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            >
              {expanded ? 'Show Less' : 'Show All'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Enhanced Liabilities Summary with Bar Chart Component
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
      <Card elevation={4} sx={{ height: '100%' }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: COLORS.error[0] }}>
              <AccountBalanceWallet />
            </Avatar>
          }
          title="Liabilities Breakdown"
          subheader="Detailed analysis of your debt obligations"
          action={
            <Chip
              label={`Total: ${formatCurrency(totalLiabilities)}`}
              color="error"
              variant="filled"
              sx={{ fontWeight: 'bold' }}
            />
          }
        />
        <CardContent>
          {totalLiabilities > 0 ? (
            <>
              {/* Bar Chart */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment />
                  Liability Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={liabilityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      fontSize={12}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                      fontSize={12}
                    />
                    <RechartsTooltip 
                      formatter={(value) => [formatCurrency(value), 'Amount']}
                      labelStyle={{ color: '#000' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill={COLORS.error[0]}
                      radius={[4, 4, 0, 0]}
                    >
                      {liabilityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {liabilityData.map((liability, index) => (
                  <Grid item xs={12} sm={6} md={4} key={liability.name}>
                    <Card variant="outlined" sx={{ p: 2, borderLeft: `4px solid ${getBarColor(index)}` }}>
                      <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                        {liability.name}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="error.main">
                        {formatCurrency(liability.value)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {((liability.value / totalLiabilities) * 100).toFixed(1)}% of total debt
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Financial Health Insights */}
              <Box sx={{ p: 2, bgcolor: 'error.50', borderRadius: 2, border: '1px solid', borderColor: 'error.200' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="error.main">
                  💡 Debt Management Insights
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Highest Liability</Typography>
                    <Typography variant="body2" fontWeight="bold" color="error.main">
                      {liabilityData.length > 0 ? liabilityData.reduce((max, curr) => max.value > curr.value ? max : curr).name : 'None'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Number of Debts</Typography>
                    <Typography variant="body2" fontWeight="bold" color="error.main">
                      {liabilityData.length} Categories
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6 }}>
              <CheckCircle sx={{ fontSize: 80, color: COLORS.success[0], mb: 2 }} />
              <Typography variant="h5" color="success.main" fontWeight="bold" gutterBottom>
                Debt Free! 🎉
              </Typography>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                Congratulations! You have no outstanding debt obligations.
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                Keep up the excellent financial discipline!
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
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

    const getAlertIcon = (type) => {
      switch (type) {
        case 'warning': return <Warning />;
        case 'error': return <Error />;
        case 'success': return <CheckCircle />;
        case 'info': return <Info />;
        default: return <Info />;
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
      backgroundColor: '#f5f5f5',
      overflow: 'auto',
      pb: 4
    }}>
      <Container 
        maxWidth="xl" 
        sx={{ 
          py: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 2, md: 3 }
        }}
      >
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={{ xs: 2, md: 3 }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={{ xs: 2, sm: 0 }}
      >
        <Typography 
          variant={{ xs: 'h5', sm: 'h4' }} 
          component="h1" 
          fontWeight="bold"
          textAlign={{ xs: 'center', sm: 'left' }}
        >
          Money Lens Dashboard
        </Typography>
        <IconButton 
          onClick={fetchDashboardData} 
          disabled={loading}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&:disabled': {
              bgcolor: 'grey.300',
            }
          }}
        >
          <Refresh />
        </IconButton>
      </Box>

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
