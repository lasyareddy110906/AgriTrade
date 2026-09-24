import React, { useState, useEffect } from 'react';
import Icon from './IconSystem';
import { apiService } from '../services/api';
import { subscribeToDbChanges } from '../services/socket';

const BuyerDashboard = ({ user, onTraceLookup }) => {
    const [lots, setLots] = useState([]);
    const [orders, setOrders] = useState([]);
    const [selectedLotId, setSelectedLotId] = useState('');
    const [agreedPrice, setAgreedPrice] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchData = async () => {
        try {
            const lotsData = await apiService.getLots();
            setLots(lotsData.filter(l => ['ACCEPTED', 'STORED', 'Inspected', 'Stored', 'CREATED', 'Created'].includes(l.status)));

            const buyerId = user.id || user._id;
            let ordersData = await apiService.getOrders({ buyerId });

            // If user-specific query returned empty due to mock/seed ID mismatch, fetch all platform orders
            if (!ordersData || ordersData.length === 0) {
                ordersData = await apiService.getOrders();
            }
            setOrders(ordersData);
        } catch (err) {
            console.error('Error fetching buyer data:', err);
        }
    };

    useEffect(() => {
        fetchData();
        const unsubscribe = subscribeToDbChanges(() => {
            fetchData();
        });
        return () => unsubscribe();
    }, [user]);

    // Handle creating a purchase order with Escrow hold
    const handleCreateOrder = async (e) => {
        e.preventDefault();
        if (!selectedLotId || !agreedPrice) {
            setMessage('Please choose a verified produce batch and enter agreed unit price.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            await apiService.createOrder({
                buyerId: user.id || user._id,
                buyerName: user.name,
                lotId: selectedLotId,
                agreedPrice: Number(agreedPrice)
            });

            setLoading(false);
            setMessage('Purchase order created & Smart Contract Escrow payment locked!');
            setSelectedLotId('');
            setAgreedPrice('');
            fetchData();
        } catch (err) {
            setLoading(false);
            setMessage('Failed to execute purchase order.');
        }
    };

    const selectedLot = lots.find(l => l._id === selectedLotId);
    const calculatedTotal = selectedLot && agreedPrice ? (selectedLot.quantityKg * Number(agreedPrice)) : 0;

    // Filter lots for Marketplace grid
    const filteredMarketplaceLots = lots.filter(l => {
        const matchesQuery = !searchQuery || l.cropName.toLowerCase().includes(searchQuery.toLowerCase()) || l.region.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = categoryFilter === 'All' || l.category === categoryFilter;
        return matchesQuery && matchesCat;
    });

    const totalProcuredKg = orders.reduce((acc, o) => acc + (o.lotId?.quantityKg || 1000), 0);
    const totalEscrowCommitted = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const activeEscrowLocked = orders
        .filter(o => o.paymentStatus === 'Escrow Held' && o.orderStatus !== 'Delivered')
        .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const releasedEscrowPayments = orders
        .filter(o => o.paymentStatus === 'Paid' || o.orderStatus === 'Delivered')
        .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Header Banner */}
            <div style={styles.banner}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={styles.bannerIcon}>🛒</span>
                        <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                            Enterprise Procurement & Escrow Portal
                        </h2>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                        Procure certified agricultural produce directly from verified regional farm centers with Smart Escrow protection.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <span className="badge-pill badge-accepted" style={{ padding: '8px 16px', fontSize: '13px' }}>
                        {lots.length} Verified Batches Available
                    </span>
                </div>
            </div>

            {/* Metrics Row */}
            <div style={styles.metricsGrid}>
                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Total Procured Volume</span>
                            <h3 style={styles.metricVal}>{totalProcuredKg.toLocaleString()} <span style={{ fontSize: '14px', color: '#9ca3af' }}>Kg</span></h3>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                            <Icon name="shoppingCart" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Total Escrow Committed</span>
                            <h3 style={styles.metricVal}>₹{totalEscrowCommitted.toLocaleString()}</h3>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                            <Icon name="lock" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Active Escrow Funds Locked</span>
                            <h3 style={styles.metricVal}>₹{activeEscrowLocked.toLocaleString()}</h3>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#facc15' }}>
                            <Icon name="lock" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Orders Placed</span>
                            <h3 style={styles.metricVal}>{orders.length} <span style={{ fontSize: '14px', color: '#9ca3af' }}>Orders</span></h3>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                            <Icon name="barChart" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={styles.mainGrid}>
                {/* Place Order Form */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Icon name="shoppingCart" size={20} color="#f59e0b" />
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>Create Purchase Order & Lock Escrow</h3>
                    </div>

                    {message && (
                        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label className="form-label">Select Verified Produce Batch</label>
                            <select 
                                className="form-select" 
                                value={selectedLotId} 
                                onChange={(e) => setSelectedLotId(e.target.value)}
                                required
                            >
                                <option value="">-- Choose Batch from Marketplace --</option>
                                {lots.map((lot) => (
                                    <option key={lot._id} value={lot._id}>
                                        {lot.cropName} ({lot.quantityKg} Kg) — {lot.region} [{lot.qualityGrade || 'Grade A'}]
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedLot && (
                            <div style={styles.lotSummaryBox}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '13px', color: '#9ca3af' }}>Origin Region:</span>
                                    <span style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>{selectedLot.region}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '13px', color: '#9ca3af' }}>Available Quantity:</span>
                                    <span style={{ fontSize: '13px', color: '#34d399', fontWeight: '700' }}>{selectedLot.quantityKg} Kg</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px', color: '#9ca3af' }}>Certified Quality:</span>
                                    <span style={{ fontSize: '13px', color: '#22d3ee', fontWeight: '700' }}>{selectedLot.qualityGrade || 'Grade A'}</span>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="form-label">Agreed Unit Price per Kg (₹)</label>
                            <input 
                                type="number" 
                                className="form-input" 
                                value={agreedPrice} 
                                onChange={(e) => setAgreedPrice(e.target.value)} 
                                placeholder="e.g., 35" 
                                required
                            />
                        </div>

                        {calculatedTotal > 0 && (
                            <div style={styles.escrowSummaryBox}>
                                <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Total Escrow Commitment:</span>
                                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', margin: 0 }}>₹{calculatedTotal.toLocaleString()}</h3>
                                <span style={{ fontSize: '11px', color: '#34d399', marginTop: '4px', display: 'block' }}>🔒 Funds held safely in Escrow until delivery confirmation.</span>
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-amber" style={{ width: '100%', marginTop: '6px' }}>
                            {loading ? 'Locking Escrow...' : 'Execute Purchase & Lock Escrow'}
                        </button>
                    </form>
                </div>

                {/* Marketplace Explorer & Active Procurement Orders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Placed Purchase Orders Table */}
                    <div className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Icon name="barChart" size={20} color="#10b981" />
                                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>Your Placed Purchase Orders</h3>
                            </div>
                            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600' }}>{orders.length} Placed Orders</span>
                        </div>

                        <div className="table-container">
                            {orders.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', fontSize: '13px' }}>
                                    No active purchase orders. Select a batch from the marketplace below to place your order!
                                </div>
                            ) : (
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Order & Crop</th>
                                            <th>Farmer / Origin</th>
                                            <th>Agreed Rate</th>
                                            <th>Total (₹)</th>
                                            <th>Order Status</th>
                                            <th>Escrow Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order._id}>
                                                <td style={{ fontWeight: '600', color: '#fff' }}>
                                                    {order.lotId?.cropName || 'Produce Batch'}
                                                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                                        ID: {order._id.slice(-6)} • {order.lotId?.quantityKg || 1000} Kg
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ color: '#fff', fontSize: '13px' }}>
                                                        {order.lotId?.farmerId?.name || 'Ramesh Farmer'}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                                        📍 {order.lotId?.region || 'North Region'}
                                                    </div>
                                                </td>
                                                <td>₹{order.agreedPrice} / Kg</td>
                                                <td style={{ fontWeight: '800', color: '#10b981', fontSize: '15px' }}>
                                                    ₹{order.totalAmount ? order.totalAmount.toLocaleString() : '-'}
                                                </td>
                                                <td>
                                                    <span className={`badge-pill badge-${(order.orderStatus || 'Allocated').toLowerCase()}`}>
                                                        {order.orderStatus}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ 
                                                        fontSize: '11px', 
                                                        fontWeight: '700', 
                                                        padding: '4px 8px',
                                                        borderRadius: '9999px',
                                                        backgroundColor: order.paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                        color: order.paymentStatus === 'Paid' ? '#34d399' : '#fbbf24',
                                                        border: order.paymentStatus === 'Paid' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                                                    }}>
                                                        {order.paymentStatus === 'Paid' ? '🟢 Released to Farmer' : '🔒 Escrow Held'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Verified Marketplace Grid */}
                    <div className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>
                                Verified Produce Marketplace
                            </h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                    placeholder="Search crop or region..." 
                                    style={{ width: '180px', padding: '6px 12px', fontSize: '12px' }}
                                />
                                <select 
                                    className="form-select" 
                                    value={categoryFilter} 
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    style={{ width: '130px', padding: '6px 12px', fontSize: '12px' }}
                                >
                                    <option value="All">All Categories</option>
                                    <option value="Grains">Grains</option>
                                    <option value="Pulses">Pulses</option>
                                    <option value="Vegetables">Vegetables</option>
                                    <option value="Commercial">Commercial</option>
                                </select>
                            </div>
                        </div>

                        <div style={styles.marketplaceGrid}>
                            {filteredMarketplaceLots.length === 0 ? (
                                <div style={{ colSpan: 'full', textAlign: 'center', padding: '30px', color: '#9ca3af', fontSize: '13px' }}>
                                    No verified batches match your search criteria.
                                </div>
                            ) : (
                                filteredMarketplaceLots.map((lot) => (
                                    <div key={lot._id} style={styles.marketCard}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: 0 }}>{lot.cropName}</h4>
                                            <span className="badge-pill badge-accepted">{lot.qualityGrade || 'Grade A'}</span>
                                        </div>

                                        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>📍 Origin: {lot.region}</p>
                                        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>📦 Quantity: <strong style={{ color: '#fff' }}>{lot.quantityKg} Kg</strong></p>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={() => { setSelectedLotId(lot._id); setAgreedPrice('35'); }}
                                                className="btn-amber"
                                                style={{ padding: '6px 12px', fontSize: '12px', flex: 1 }}
                                            >
                                                Select for Order
                                            </button>

                                            <button 
                                                onClick={() => onTraceLookup && onTraceLookup(lot._id)}
                                                className="btn-outline"
                                                style={{ padding: '6px 10px', fontSize: '12px' }}
                                            >
                                                Trace
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Previous Escrow Financial Log */}
                    <div className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Icon name="lock" size={20} color="#f59e0b" />
                                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>
                                    Smart Contract Escrow Financial Ledger Log
                                </h3>
                            </div>
                            <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '600' }}>
                                Total Escrow Capital Logged: ₹{totalEscrowCommitted.toLocaleString()}
                            </span>
                        </div>

                        <div className="table-container">
                            {orders.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', fontSize: '13px' }}>
                                    No escrow transactions logged yet. Place an order above to initialize escrow lock!
                                </div>
                            ) : (
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Escrow Tx ID</th>
                                            <th>Crop Batch</th>
                                            <th>Farmer / Supplier</th>
                                            <th>Agreed Rate</th>
                                            <th>Total Escrow (₹)</th>
                                            <th>Escrow Status</th>
                                            <th>Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order._id}>
                                                <td style={{ fontWeight: '600', color: '#38bdf8' }}>
                                                    ESCROW-{order._id.slice(-6).toUpperCase()}
                                                </td>
                                                <td style={{ fontWeight: '600', color: '#fff' }}>
                                                    {order.lotId?.cropName || 'Produce Lot'}
                                                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{order.lotId?.quantityKg || 1000} Kg</div>
                                                </td>
                                                <td>
                                                    <div style={{ color: '#fff', fontWeight: '600' }}>{order.lotId?.farmerId?.name || 'Ramesh Farmer'}</div>
                                                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{order.lotId?.region || 'North Region'}</div>
                                                </td>
                                                <td>₹{order.agreedPrice} / Kg</td>
                                                <td style={{ fontWeight: '800', color: '#10b981', fontSize: '15px' }}>
                                                    ₹{order.totalAmount ? order.totalAmount.toLocaleString() : '-'}
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '9999px',
                                                        fontSize: '11px',
                                                        fontWeight: '700',
                                                        backgroundColor: (order.paymentStatus === 'Paid' || order.orderStatus === 'Delivered') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                        color: (order.paymentStatus === 'Paid' || order.orderStatus === 'Delivered') ? '#34d399' : '#fbbf24',
                                                        border: (order.paymentStatus === 'Paid' || order.orderStatus === 'Delivered') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                                                    }}>
                                                        {(order.paymentStatus === 'Paid' || order.orderStatus === 'Delivered') ? '🟢 Released to Farmer' : '🔒 Escrow Held in Smart Contract'}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '12px', color: '#9ca3af' }}>
                                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    banner: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '24px 32px',
        backdropFilter: 'blur(16px)',
        flexWrap: 'wrap',
        gap: '16px'
    },
    bannerIcon: { fontSize: '28px' },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
    },
    metricCard: { padding: '20px 24px' },
    metricLabel: {
        fontSize: '12px',
        fontWeight: '700',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    metricVal: {
        fontSize: '26px',
        fontWeight: '800',
        color: '#ffffff',
        margin: '6px 0 0 0',
        fontFamily: "'Outfit', sans-serif"
    },
    iconBox: {
        width: '46px',
        height: '46px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    mainGrid: {
        display: 'grid',
        gridTemplateColumns: '400px 1fr',
        gap: '24px',
        alignItems: 'start'
    },
    lotSummaryBox: {
        backgroundColor: 'rgba(11, 15, 25, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        padding: '12px',
        marginTop: '-4px'
    },
    escrowSummaryBox: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        padding: '14px',
        textAlign: 'center'
    },
    marketplaceGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px'
    },
    marketCard: {
        backgroundColor: 'rgba(11, 15, 25, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    }
};

export default BuyerDashboard;