import React, { useState, useEffect } from 'react';
import Icon from './IconSystem';
import { subscribeToSocketStatus, subscribeToDbChanges } from '../services/socket';

const Navbar = ({ user, onLogout, onTraceLookup }) => {
  const [qrQuery, setQrQuery] = useState('');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [showCompassModal, setShowCompassModal] = useState(false);
  const [lastSyncEvent, setLastSyncEvent] = useState(null);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    const unsubscribeStatus = subscribeToSocketStatus((status) => {
      setIsLiveConnected(status);
    });

    const unsubscribeChanges = subscribeToDbChanges((data) => {
      setLastSyncEvent(data);
      setEventCount(prev => prev + 1);
    });

    return () => {
      unsubscribeStatus();
      unsubscribeChanges();
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (qrQuery.trim() && onTraceLookup) {
      onTraceLookup(qrQuery.trim());
      setQrQuery('');
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Farmer': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'Quality Inspector': return { bg: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' };
      case 'Buyer': return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'Logistics Coordinator': return { bg: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: 'rgba(139, 92, 246, 0.3)' };
      case 'Platform Admin': return { bg: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: 'rgba(244, 63, 94, 0.3)' };
      default: return { bg: 'rgba(255, 255, 255, 0.1)', color: '#9ca3af', border: 'rgba(255, 255, 255, 0.2)' };
    }
  };

  const badgeStyle = getRoleBadgeStyle(user?.role);

  return (
    <>
      <header style={styles.header}>
        <div style={styles.navContainer}>
          {/* Brand Logo */}
          <div style={styles.logoGroup} onClick={() => window.location.reload()}>
            <div style={styles.logoIconBg}>
              <Icon name="wheat" size={24} color="#10b981" />
            </div>
            <div>
              <h1 style={styles.logoText}>
                Agri<span style={{ color: '#10b981' }}>Trade</span> <span style={styles.aiTag}>AI</span>
              </h1>
              <p style={styles.tagline}>Smart Real-Time Supply Chain</p>
            </div>
          </div>

          {/* Real-Time Database Connection Badge */}
          <div 
            style={{
              ...styles.realtimeBadge,
              backgroundColor: isLiveConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              borderColor: isLiveConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
            }}
            onClick={() => setShowCompassModal(true)}
            title="Click for MongoDB Compass Connection Info"
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isLiveConnected ? '#10b981' : '#ef4444',
              boxShadow: isLiveConnected ? '0 0 10px #10b981' : 'none',
              display: 'inline-block'
            }} />
            <span style={{ color: isLiveConnected ? '#34d399' : '#f87171', fontSize: '12px', fontWeight: '700' }}>
              {isLiveConnected ? 'MongoDB Compass Sync Live' : 'Offline / Standalone Mode'}
            </span>
            {eventCount > 0 && (
              <span style={styles.eventCountBadge}>
                {eventCount} updates
              </span>
            )}
          </div>

          {/* Header Search for QR Provenance Lookup */}
          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            <Icon name="qrCode" size={18} color="#9ca3af" style={styles.searchIcon} />
            <input 
              type="text" 
              value={qrQuery} 
              onChange={(e) => setQrQuery(e.target.value)}
              placeholder="Trace Lot ID or QR Code..." 
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchBtn}>Verify</button>
          </form>

          {/* User Info & Actions */}
          {user && (
            <div style={styles.userSection}>
              <div style={styles.userInfo}>
                <span style={styles.userName}>{user.name}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ 
                    ...styles.roleBadge, 
                    backgroundColor: badgeStyle.bg, 
                    color: badgeStyle.color,
                    borderColor: badgeStyle.border 
                  }}>
                    {user.role}
                  </span>
                  <span style={styles.regionTag}>📍 {user.region}</span>
                </div>
              </div>

              <button onClick={onLogout} style={styles.logoutBtn} title="Log Out">
                <Icon name="logOut" size={16} color="#f43f5e" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MongoDB Compass Integration Details Modal */}
      {showCompassModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCompassModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🍃</span>
                <div>
                  <h3 style={{ margin: 0, color: '#f9fafb', fontSize: '18px', fontWeight: '700' }}>
                    MongoDB Compass Real-Time Database Connection
                  </h3>
                  <p style={{ margin: '2px 0 0', color: '#9ca3af', fontSize: '12px' }}>
                    Live synchronization between MongoDB Compass & user dashboards
                  </p>
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowCompassModal(false)}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.infoCard}>
                <div style={styles.cardRow}>
                  <span style={styles.cardLabel}>MongoDB Connection URI:</span>
                  <code style={styles.cardCode}>mongodb://127.0.0.1:27017/agritrade</code>
                </div>
                <div style={styles.cardRow}>
                  <span style={styles.cardLabel}>Database Name:</span>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>agritrade</span>
                </div>
                <div style={styles.cardRow}>
                  <span style={styles.cardLabel}>Monitored Collections:</span>
                  <span style={{ color: '#cbd5e1' }}>users, lots, orders, inspections, shipments</span>
                </div>
                <div style={styles.cardRow}>
                  <span style={styles.cardLabel}>Real-Time Sync Engine:</span>
                  <span style={{ color: '#34d399', fontWeight: '600' }}>
                    {isLiveConnected ? '⚡ WebSocket ChangeStream & Polling Active' : '⚠️ Offline'}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 8px', color: '#f3f4f6', fontSize: '14px' }}>
                  How to test live sync with MongoDB Compass:
                </h4>
                <ol style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
                  <li>Open <strong>MongoDB Compass</strong> desktop app.</li>
                  <li>Connect to <code>mongodb://127.0.0.1:27017</code>.</li>
                  <li>Select the <code>agritrade</code> database and navigate to any collection (e.g., <code>lots</code> or <code>orders</code>).</li>
                  <li>Insert or update any document (e.g. change <code>status</code> or add a new lot).</li>
                  <li>Observe that <strong>all logged-in user dashboards update instantly in real time!</strong></li>
                </ol>
              </div>

              {lastSyncEvent && (
                <div style={styles.lastEventBox}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>
                    LAST REAL-TIME DB EVENT BROADCAST:
                  </div>
                  <pre style={{ margin: 0, fontSize: '11px', color: '#38bdf8', overflowX: 'auto' }}>
                    {JSON.stringify(lastSyncEvent, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button 
                style={styles.actionBtn}
                onClick={() => setShowCompassModal(false)}
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  header: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    padding: '12px 24px'
  },
  navContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    flexWrap: 'wrap'
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer'
  },
  logoIconBg: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoText: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '-0.5px',
    fontFamily: "'Outfit', sans-serif"
  },
  aiTag: {
    fontSize: '11px',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: '#06b6d4',
    color: '#0b0f19',
    marginLeft: '4px',
    verticalAlign: 'middle'
  },
  tagline: {
    margin: 0,
    fontSize: '11px',
    color: '#9ca3af',
    fontWeight: '500'
  },
  realtimeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  eventCountBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    color: '#38bdf8',
    fontSize: '10px',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '10px'
  },
  searchForm: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: '0 1 320px'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none'
  },
  searchInput: {
    width: '100%',
    padding: '9px 75px 9px 38px',
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    color: '#f9fafb',
    fontSize: '13px',
    outline: 'none'
  },
  searchBtn: {
    position: 'absolute',
    right: '4px',
    padding: '5px 12px',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    color: '#34d399',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  userInfo: {
    textAlign: 'right'
  },
  userName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#f9fafb',
    display: 'block'
  },
  roleBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '9999px',
    borderWidth: '1px',
    borderStyle: 'solid',
    textTransform: 'uppercase'
  },
  regionTag: {
    fontSize: '11px',
    color: '#9ca3af'
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    border: '1px solid rgba(244, 63, 94, 0.3)',
    color: '#fb7185',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#111827',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '16px',
    maxWidth: '560px',
    width: '100%',
    padding: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: '18px',
    cursor: 'pointer'
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  infoCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px'
  },
  cardLabel: {
    color: '#9ca3af',
    fontWeight: '500'
  },
  cardCode: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: '3px 8px',
    borderRadius: '6px',
    color: '#38bdf8',
    fontFamily: 'monospace',
    fontSize: '12px'
  },
  lastEventBox: {
    marginTop: '12px',
    backgroundColor: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    borderRadius: '8px',
    padding: '12px'
  },
  modalFooter: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  actionBtn: {
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: '#064e3b',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer'
  }
};

export default Navbar;
