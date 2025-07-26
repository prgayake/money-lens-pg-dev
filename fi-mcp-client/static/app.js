class MoneyLensApp {
    constructor() {
        this.apiUrl = 'http://localhost:8000';
        this.sessionId = null;
        this.currentPage = 'authPage';
        this.isAuthenticated = false;
        this.authCheckInterval = null;
        this.financialData = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingSession();
    }

    setupEventListeners() {
        // Authentication
        document.getElementById('authenticateBtn').addEventListener('click', () => {
            this.startAuthentication();
        });

        // Navigation
        document.getElementById('navDashboard')?.addEventListener('click', () => {
            this.showPage('dashboardPage');
        });
        
        document.getElementById('navChat')?.addEventListener('click', () => {
            this.showPage('chatPage');
        });
        
        document.getElementById('navDashboard2')?.addEventListener('click', () => {
            this.showPage('dashboardPage');
        });
        
        document.getElementById('navChat2')?.addEventListener('click', () => {
            this.showPage('chatPage');
        });
        
        document.getElementById('navLogout')?.addEventListener('click', () => {
            this.logout();
        });
        
        document.getElementById('navLogout2')?.addEventListener('click', () => {
            this.logout();
        });

        // Dashboard
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.refreshDashboard();
        });

        // Chat
        document.getElementById('messageInput')?.addEventListener('input', (e) => {
            const sendBtn = document.getElementById('sendBtn');
            sendBtn.disabled = !e.target.value.trim();
        });

        document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        document.getElementById('sendBtn')?.addEventListener('click', () => {
            this.sendMessage();
        });

        // Quick action buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const message = e.currentTarget.dataset.message;
                document.getElementById('messageInput').value = message;
                this.sendMessage();
            });
        });
    }

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show selected page
        document.getElementById(pageId).classList.add('active');
        this.currentPage = pageId;
        
        // Update navigation
        this.updateNavigation();
        
        // Load data if needed
        if (pageId === 'dashboardPage' && this.isAuthenticated) {
            this.loadDashboardData();
        }
    }

    updateNavigation() {
        // Update active nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        if (this.currentPage === 'dashboardPage') {
            document.getElementById('navDashboard')?.classList.add('active');
            document.getElementById('navDashboard2')?.classList.add('active');
        } else if (this.currentPage === 'chatPage') {
            document.getElementById('navChat')?.classList.add('active');
            document.getElementById('navChat2')?.classList.add('active');
        }
    }

    async startAuthentication() {
        try {
            this.showLoading('Creating secure session...');
            this.showAuthProgress('step1');
            
            // Create session
            const response = await fetch(`${this.apiUrl}/create-session`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error('Failed to create session');
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.sessionId = data.session_id;
                this.hideAuthProgress('step1');
                this.showAuthProgress('step2');
                
                // Open Fi authentication
                const authUrl = `http://localhost:8080/login?session_id=${this.sessionId}`;
                window.open(authUrl, '_blank');
                
                this.showAuthWaiting();
                this.startAuthPolling();
                
            } else {
                throw new Error(data.message || 'Session creation failed');
            }
        } catch (error) {
            console.error('Authentication failed:', error);
            this.showToast('Authentication failed. Please try again.', 'error');
            this.hideLoading();
        }
    }

    showAuthProgress(stepId) {
        document.getElementById('authProgress').style.display = 'block';
        document.getElementById(stepId).style.display = 'flex';
        document.getElementById('authenticateBtn').style.display = 'none';
    }

    hideAuthProgress(stepId) {
        document.getElementById(stepId).style.display = 'none';
    }

    showAuthWaiting() {
        document.getElementById('authProgress').style.display = 'none';
        document.getElementById('authWaiting').style.display = 'block';
        this.hideLoading();
    }

    startAuthPolling() {
        this.authCheckInterval = setInterval(async () => {
            const isAuth = await this.checkAuthentication();
            if (isAuth) {
                clearInterval(this.authCheckInterval);
                this.isAuthenticated = true;
                
                this.showAuthProgress('step3');
                document.getElementById('authWaiting').style.display = 'none';
                
                await this.loadFinancialData();
                
                this.showToast('Authentication successful! Welcome to Money Lens.', 'success');
                setTimeout(() => {
                    this.showPage('dashboardPage');
                }, 1000);
            }
        }, 2000);

        // Stop polling after 5 minutes
        setTimeout(() => {
            if (this.authCheckInterval) {
                clearInterval(this.authCheckInterval);
                this.showToast('Authentication timeout. Please try again.', 'error');
                this.resetAuthUI();
            }
        }, 300000);
    }

    async checkAuthentication() {
        if (!this.sessionId) return false;
        
        try {
            const response = await fetch(`${this.apiUrl}/quick-auth-check?session_id=${this.sessionId}`);
            const data = await response.json();
            return data.authenticated === true;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }

    async checkExistingSession() {
        // Check for existing session
        const savedSession = localStorage.getItem('money_lens_session');
        if (savedSession) {
            this.sessionId = savedSession;
            const isAuth = await this.checkAuthentication();
            if (isAuth) {
                this.isAuthenticated = true;
                await this.loadFinancialData();
                this.showPage('dashboardPage');
                this.showToast('Welcome back! Your session is active.', 'success');
                return;
            } else {
                localStorage.removeItem('money_lens_session');
            }
        }
        
        this.showPage('authPage');
    }

    async loadFinancialData() {
        if (!this.sessionId) return;

        try {
            const endpoints = [
                'fetch_net_worth',
                'fetch_epf_details', 
                'fetch_mf_transactions',
                'fetch_bank_transactions',
                'fetch_credit_report'
            ];

            const promises = endpoints.map(endpoint => 
                fetch(`${this.apiUrl}/${endpoint}?session_id=${this.sessionId}`)
                    .then(res => res.json())
                    .then(data => ({ endpoint, data }))
                    .catch(error => ({ endpoint, error }))
            );

            const results = await Promise.all(promises);
            
            results.forEach(result => {
                if (result.data && result.data.success) {
                    const key = result.endpoint.replace('fetch_', '');
                    this.financialData[key] = result.data.data;
                }
            });

            // Save session
            localStorage.setItem('money_lens_session', this.sessionId);
            
        } catch (error) {
            console.error('Failed to load financial data:', error);
        }
    }

    loadDashboardData() {
        this.updateNetWorthCard();
        this.updateStatsCard();
        this.loadCharts();
        this.generateInsights();
        this.loadRecentActivity();
    }

    updateNetWorthCard() {
        const netWorthData = this.financialData.net_worth;
        if (!netWorthData) return;

        let totalAssets = 0;
        let totalLiabilities = 0;

        // Calculate assets
        if (netWorthData.assets) {
            Object.values(netWorthData.assets).forEach(value => {
                if (typeof value === 'number') totalAssets += value;
                else if (typeof value === 'object') {
                    Object.values(value).forEach(v => {
                        if (typeof v === 'number') totalAssets += v;
                    });
                }
            });
        }

        // Calculate liabilities
        if (netWorthData.liabilities) {
            Object.values(netWorthData.liabilities).forEach(value => {
                if (typeof value === 'number') totalLiabilities += value;
            });
        }

        const netWorth = totalAssets - totalLiabilities;

        document.getElementById('netWorthAmount').textContent = this.formatCurrency(netWorth);
        document.getElementById('totalAssets').textContent = this.formatCurrency(totalAssets);
        document.getElementById('totalLiabilities').textContent = this.formatCurrency(totalLiabilities);
        
        // Mock change percentage
        document.getElementById('netWorthChange').textContent = '+5.2% this month';
    }

    updateStatsCard() {
        const netWorthData = this.financialData.net_worth;
        const epfData = this.financialData.epf_details;
        const creditData = this.financialData.credit_report;

        if (netWorthData && netWorthData.assets) {
            // Savings (bank accounts)
            const savings = netWorthData.assets.bank_accounts || 0;
            document.getElementById('savingsAmount').textContent = this.formatCurrency(savings);

            // Investments (MF + stocks)
            const mf = netWorthData.assets.mutual_funds || 0;
            const stocks = netWorthData.assets.stocks || 0;
            document.getElementById('investmentsAmount').textContent = this.formatCurrency(mf + stocks);
        }

        if (epfData && epfData.account_balance) {
            document.getElementById('epfAmount').textContent = this.formatCurrency(epfData.account_balance);
        }

        if (creditData && creditData.credit_score) {
            document.getElementById('creditScore').textContent = creditData.credit_score;
        }
    }

    loadCharts() {
        this.createPortfolioChart();
        this.createDistributionChart();
    }

    createPortfolioChart() {
        const ctx = document.getElementById('portfolioChart');
        if (!ctx) return;

        // Sample portfolio performance data
        const data = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Portfolio Value',
                data: [500000, 520000, 510000, 535000, 545000, 560000],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        };

        new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '₹' + (value/100000).toFixed(1) + 'L';
                            }
                        }
                    }
                }
            }
        });
    }

    createDistributionChart() {
        const ctx = document.getElementById('distributionChart');
        if (!ctx) return;

        const netWorthData = this.financialData.net_worth;
        if (!netWorthData || !netWorthData.assets) return;

        const labels = [];
        const data = [];
        const colors = ['#667eea', '#764ba2', '#22c55e', '#f59e0b', '#ef4444'];

        Object.entries(netWorthData.assets).forEach(([key, value], index) => {
            if (typeof value === 'number' && value > 0) {
                labels.push(this.formatLabel(key));
                data.push(value);
            }
        });

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    generateInsights() {
        const insights = [
            {
                icon: 'fa-chart-line',
                title: 'Portfolio Performance',
                text: 'Your portfolio has grown by 12% this year, outperforming the market.',
                type: 'positive'
            },
            {
                icon: 'fa-piggy-bank',
                title: 'Savings Goal',
                text: 'You\'re 80% towards your emergency fund target. Keep it up!',
                type: 'info'
            },
            {
                icon: 'fa-lightbulb',
                title: 'Investment Tip',
                text: 'Consider diversifying into international funds for better risk management.',
                type: 'suggestion'
            }
        ];

        const container = document.getElementById('insightsList');
        container.innerHTML = insights.map(insight => `
            <div class="insight-item ${insight.type}">
                <div class="insight-icon">
                    <i class="fas ${insight.icon}"></i>
                </div>
                <div class="insight-content">
                    <h4>${insight.title}</h4>
                    <p>${insight.text}</p>
                </div>
            </div>
        `).join('');
    }

    loadRecentActivity() {
        const activities = [
            { type: 'SIP', amount: 5000, date: '2025-01-15', desc: 'Monthly SIP - HDFC Top 100' },
            { type: 'Dividend', amount: 1200, date: '2025-01-10', desc: 'Dividend received - TCS' },
            { type: 'Purchase', amount: 15000, date: '2025-01-05', desc: 'Stock Purchase - Reliance' }
        ];

        const container = document.getElementById('recentActivity');
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-info">
                    <div class="activity-desc">${activity.desc}</div>
                    <div class="activity-date">${activity.date}</div>
                </div>
                <div class="activity-amount">₹${activity.amount.toLocaleString()}</div>
            </div>
        `).join('');
    }

    async refreshDashboard() {
        const btn = document.getElementById('refreshBtn');
        const originalHtml = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
        btn.disabled = true;
        
        await this.loadFinancialData();
        this.loadDashboardData();
        
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        
        this.showToast('Dashboard refreshed successfully!', 'success');
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        document.getElementById('sendBtn').disabled = true;
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await fetch(`${this.apiUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    session_id: this.sessionId
                })
            });
            
            const data = await response.json();
            
            this.hideTypingIndicator();
            
            if (data.success) {
                this.addMessage(data.response, 'ai');
            } else {
                this.addMessage('Sorry, I encountered an error processing your request.', 'ai');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I\'m having trouble connecting right now.', 'ai');
        }
    }

    addMessage(content, sender) {
        const container = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i>
            </div>
            <div class="message-content">
                <p>${this.formatMessage(content)}</p>
            </div>
        `;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    showTypingIndicator() {
        const container = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typingIndicator';
        typingDiv.className = 'message ai-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span>•</span><span>•</span><span>•</span>
                </div>
            </div>
        `;
        
        container.appendChild(typingDiv);
        container.scrollTop = container.scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    formatMessage(content) {
        return content.replace(/\n/g, '<br>');
    }

    logout() {
        this.isAuthenticated = false;
        this.sessionId = null;
        this.financialData = {};
        
        localStorage.removeItem('money_lens_session');
        
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
        }
        
        this.resetAuthUI();
        this.showPage('authPage');
        this.showToast('Logged out successfully', 'info');
    }

    resetAuthUI() {
        document.getElementById('authProgress').style.display = 'none';
        document.getElementById('authWaiting').style.display = 'none';
        document.getElementById('authenticateBtn').style.display = 'block';
        
        document.querySelectorAll('.progress-step').forEach(step => {
            step.style.display = 'none';
        });
    }

    formatCurrency(amount) {
        if (typeof amount !== 'number') return '₹0';
        
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatLabel(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    showLoading(text) {
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${iconMap[type]}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Hide and remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.moneyLensApp = new MoneyLensApp();
});

// Add some additional CSS for better animations
const additionalStyles = `
<style>
.typing-dots {
    display: flex;
    gap: 4px;
}

.typing-dots span {
    animation: typingDot 1.5s infinite;
    font-size: 1.2rem;
    color: #667eea;
}

.typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes typingDot {
    0%, 60%, 100% { opacity: 0.3; }
    30% { opacity: 1; }
}

.activity-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: rgba(102, 126, 234, 0.05);
    border-radius: 10px;
    margin-bottom: 10px;
    border: 1px solid rgba(102, 126, 234, 0.1);
}

.activity-desc {
    font-weight: 500;
    color: #333;
    margin-bottom: 5px;
}

.activity-date {
    font-size: 0.85rem;
    color: #666;
}

.activity-amount {
    font-weight: 600;
    color: #667eea;
}

.insight-item {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    padding: 15px;
    background: rgba(102, 126, 234, 0.05);
    border-radius: 10px;
    margin-bottom: 15px;
    border: 1px solid rgba(102, 126, 234, 0.1);
    transition: all 0.3s ease;
}

.insight-item:hover {
    background: rgba(102, 126, 234, 0.1);
    transform: translateY(-2px);
}

.insight-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
}

.insight-content h4 {
    margin: 0 0 8px 0;
    color: #333;
    font-size: 1rem;
}

.insight-content p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
    line-height: 1.5;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);
