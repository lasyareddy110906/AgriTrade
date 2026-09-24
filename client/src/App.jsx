import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import FarmerDashboard from './components/FarmerDashboard';
import QualityInspectorDashboard from './components/QualityInspectorDashboard';
import BuyerDashboard from './components/BuyerDashboard';
import LogisticsDashboard from './components/LogisticsDashboard';
import AdminDashboard from './components/AdminDashboard';
import TraceabilityPage from './components/TraceabilityPage';
import { subscribeToDbChanges } from './services/socket';

function App() {
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [traceLotId, setTraceLotId] = useState(null);
  const [realtimeToast, setRealtimeToast] = useState(null);

  // Check URL query parameters for public QR trace lookup e.g. ?trace=LOT-xxx
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('trace') || urlParams.get('lotId');
    if (q) {
      setTraceLotId(q);
    }
  }, []);

  // Listen for real-time DB change notifications from Socket.io / MongoDB Compass
  useEffect(() => {
    const unsubscribe = subscribeToDbChanges((data) => {
      const collName = data.collection ? data.collection.toUpperCase() : 'DATABASE';
      const action = data.operationType || 'UPDATE';
      
      setRealtimeToast({
        title: `⚡ Real-Time DB Event: ${collName}`,
        message: `Database changed via MongoDB Compass / API (${action}). All user dashboards updated.`,
        timestamp: new Date().toLocaleTimeString()
      });

      // Auto dismiss toast after 4.5 seconds
      const timer = setTimeout(() => {
        setRealtimeToast(null);
      }, 4500);

      return () => clearTimeout(timer);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setTraceLotId(null);
  };

  const handleTraceLookup = (idOrQr) => {
    setTraceLotId(idOrQr);
  };

  // 1. If public QR traceability lookup is active, show TraceabilityPage
  if (traceLotId) {
    return (
      <div className="app-container">
        <Navbar user={currentUser} onLogout={handleLogout} onTraceLookup={handleTraceLookup} />
        <main className="main-content">
          <TraceabilityPage lotId={traceLotId} onBack={() => setTraceLotId(null)} />
        </main>
      </div>
    );
  }

  // 2. If user is not authenticated, show Login & Registration screen
  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // 3. Authenticated Role-Based Dashboard View
  const renderDashboardByRole = () => {
    switch (currentUser.role) {
      case 'Farmer':
        return <FarmerDashboard user={currentUser} onTraceLookup={handleTraceLookup} />;
      case 'Quality Inspector':
        return <QualityInspectorDashboard user={currentUser} onTraceLookup={handleTraceLookup} />;
      case 'Buyer':
        return <BuyerDashboard user={currentUser} onTraceLookup={handleTraceLookup} />;
      case 'Logistics Coordinator':
        return <LogisticsDashboard user={currentUser} onTraceLookup={handleTraceLookup} />;
      case 'Platform Admin':
        return <AdminDashboard user={currentUser} onTraceLookup={handleTraceLookup} />;
      default:
        return <AdminDashboard user={currentUser} onTraceLookup={handleTraceLookup} />;
    }
  };

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      <Navbar user={currentUser} onLogout={handleLogout} onTraceLookup={handleTraceLookup} />
      <main className="main-content">
        {renderDashboardByRole()}
      </main>

      {/* Floating Real-Time DB Change Toast */}
      {realtimeToast && (
        <div style={toastStyles.container}>
          <div style={toastStyles.header}>
            <span>{realtimeToast.title}</span>
            <span style={toastStyles.time}>{realtimeToast.timestamp}</span>
          </div>
          <div style={toastStyles.body}>{realtimeToast.message}</div>
        </div>
      )}
    </div>
  );
}

const toastStyles = {
  container: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '14px 18px',
    maxWidth: '380px',
    zIndex: 9999,
    animation: 'slideIn 0.3s ease-out'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    fontWeight: '700',
    color: '#34d399',
    marginBottom: '4px'
  },
  time: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '400'
  },
  body: {
    fontSize: '12px',
    color: '#e2e8f0',
    lineHeight: '1.4'
  }
};

export default App;