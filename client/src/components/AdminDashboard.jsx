import React, { useState, useEffect } from 'react';
import { 
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, 
    PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import Icon from './IconSystem';
import { apiService } from '../services/api';
import { subscribeToDbChanges } from '../services/socket';

const PIE_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#f43f5e'];

const AdminDashboard = ({ user, onTraceLookup }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = () => {
        apiService.getAnalytics()
            .then(data => {
                setAnalytics(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading analytics:', err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchAnalytics();
        const unsubscribe = subscribeToDbChanges(() => {
            fetchAnalytics();
        });
        return () => unsubscribe();
    }, []);


    const metrics = analytics?.metrics || {
        totalLots: 18,
        activeFarmers: 14,
        registeredBuyers: 9,
        certifiedInspectors: 6,
        logisticsCoordinators: 5,
        totalProduceVolumeKg: 48500,
        totalTradeRevenue: 2165000,
        activeShipmentsInTransit: 4
    };

    const monthlyData = analytics?.monthlyRevenue || [
        { month: 'May', revenue: 185000, volumeKg: 5200 },
        { month: 'Jun', revenue: 290000, volumeKg: 8400 },
        { month: 'Jul', revenue: 410000, volumeKg: 12100 },
        { month: 'Aug', revenue: 560000, volumeKg: 16500 },
        { month: 'Sep', revenue: 720000, volumeKg: 21000 }
    ];

    const gradeData = analytics?.gradeDistribution || [
        { name: 'Grade A', value: 8 },
        { name: 'Grade B', value: 5 },
        { name: 'Grade C', value: 3 },
        { name: 'Rejected', value: 2 }
    ];

    const categoryData = analytics?.categoryBreakdown || [
        { category: 'Grains', volumeKg: 24000 },
        { category: 'Pulses', volumeKg: 11000 },
        { category: 'Vegetables', volumeKg: 8500 },
        { category: 'Commercial', volumeKg: 5000 }
    ];

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Header Banner */}
            <div style={styles.banner}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={styles.bannerIcon}>🛡️</span>
                        <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                            Executive Analytics & Platform Control Center
                        </h2>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                        Real-time cross-regional supply chain metrics, financial trade volume, quality assurance metrics, and fleet status.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <span className="badge-pill badge-delivered" style={{ padding: '8px 16px', fontSize: '13px' }}>
                        System Status: OPTIMAL
                    </span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div style={styles.metricsGrid}>
                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Total Trade Revenue</span>
                            <h3 style={styles.metricVal}>₹{metrics.totalTradeRevenue.toLocaleString()}</h3>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                            <Icon name="dollarSign" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Total Produce Volume</span>
                            <h3 style={styles.metricVal}>{metrics.totalProduceVolumeKg.toLocaleString()} <span style={{ fontSize: '14px', color: '#9ca3af' }}>Kg</span></h3>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
                            <Icon name="wheat" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Platform Ecosystem</span>
                            <h3 style={styles.metricVal}>{metrics.activeFarmers + metrics.registeredBuyers} <span style={{ fontSize: '14px', color: '#9ca3af' }}>Users</span></h3>
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>{metrics.activeFarmers} Farmers | {metrics.registeredBuyers} Buyers</span>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                            <Icon name="users" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Active Fleet In Transit</span>
                            <h3 style={styles.metricVal}>{metrics.activeShipmentsInTransit} <span style={{ fontSize: '14px', color: '#9ca3af' }}>Shipments</span></h3>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                            <Icon name="truck" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Charts Row 1: Line Chart & Pie Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Revenue Growth Line Chart */}
                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Icon name="trendingUp" size={20} color="#10b981" />
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>
                                Monthly Platform Trade & Revenue Growth (₹)
                            </h3>
                        </div>
                    </div>
                    
                    <div style={{ width: '100%', height: 320 }}>
                        <ResponsiveContainer>
                            <LineChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                                <XAxis dataKey="month" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#fff' }}
                                    formatter={(val) => [`₹${val.toLocaleString()}`, 'Revenue']}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quality Grade Distribution Pie Chart */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Icon name="shieldCheck" size={20} color="#06b6d4" />
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>
                            Quality Grade Share
                        </h3>
                    </div>

                    <div style={{ width: '100%', height: 260, display: 'flex', justifyContent: 'center' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie 
                                    data={gradeData} 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={55} 
                                    outerRadius={85} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {gradeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#fff' }}
                                />
                                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2: Category Breakdown Bar Chart & Audit Activity Stream */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Category Bar Chart */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Icon name="barChart" size={20} color="#f59e0b" />
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>
                            Produce Category Volume (Kg)
                        </h3>
                    </div>

                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                                <XAxis dataKey="category" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#fff' }}
                                    formatter={(val) => [`${val.toLocaleString()} Kg`, 'Volume']}
                                />
                                <Bar dataKey="volumeKg" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* System Audit Event Feed */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Icon name="activity" size={20} color="#8b5cf6" />
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>
                            Supply Chain Lifecycle Audit Stream
                        </h3>
                    </div>

                    <div style={styles.auditStream}>
                        <div style={styles.auditItem}>
                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>[DELIVERED]</span>
                            <span style={{ fontSize: '13px', color: '#f9fafb' }}>Shipment delivered to SuperMart Warehouse. Escrow released.</span>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Just now</span>
                        </div>
                        <div style={styles.auditItem}>
                            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>[DISPATCHED]</span>
                            <span style={{ fontSize: '13px', color: '#f9fafb' }}>Vehicle KA-01-HH-9988 dispatched with 1,000 Kg Organic Wheat.</span>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>12 mins ago</span>
                        </div>
                        <div style={styles.auditItem}>
                            <span style={{ fontSize: '11px', color: '#c084fc', fontWeight: '700' }}>[ALLOCATED]</span>
                            <span style={{ fontSize: '13px', color: '#f9fafb' }}>Purchase Order #9912 created. Escrow locked at ₹35,000.</span>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>45 mins ago</span>
                        </div>
                        <div style={styles.auditItem}>
                            <span style={{ fontSize: '11px', color: '#22d3ee', fontWeight: '700' }}>[INSPECTED]</span>
                            <span style={{ fontSize: '13px', color: '#f9fafb' }}>Quality Inspector assigned Grade A (Moisture 11.2%).</span>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>1 hr ago</span>
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
        justify: 'space-between',
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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
        justifycontent: 'center'
    },
    auditStream: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    auditItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        padding: '12px',
        backgroundColor: 'rgba(11, 15, 25, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px'
    }
};

export default AdminDashboard;
