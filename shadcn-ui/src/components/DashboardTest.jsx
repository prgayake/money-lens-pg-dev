import React from 'react';
import FinancialDashboard from './components/FinancialDashboard_new';

// Test component to verify dashboard integration
const DashboardTest = () => {
  // Use the session ID from our backend test
  const testSessionId = "fa071afe-645a-40cd-bed2-a046941ea32e";
  
  console.log("🔍 Dashboard Test Component");
  console.log("Session ID:", testSessionId);
  console.log("API Base URL:", process.env.REACT_APP_API_BASE_URL || "http://localhost:8001");
  
  return (
    <div>
      <h1>Dashboard Integration Test</h1>
      <p>Session ID: {testSessionId}</p>
      <p>API URL: {process.env.REACT_APP_API_BASE_URL || "http://localhost:8001"}</p>
      
      {/* Pass the session ID to the dashboard */}
      <FinancialDashboard sessionId={testSessionId} />
    </div>
  );
};

export default DashboardTest;
