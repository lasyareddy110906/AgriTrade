import React, { useState, useEffect } from 'react';
import Icon from './IconSystem';
import { apiService } from '../services/api';
import { subscribeToDbChanges } from '../services/socket';

const FarmerDashboard = ({ user, onTraceLookup }) => {
    const [lots, setLots] = useState([]);
    const [orders, setOrders] = useState([]);
    const [cropName, setCropName] = useState('');
    const [category, setCategory] = useState('Grains');
    const [quantityKg, setQuantityKg] = useState('');
    const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [aiValuation, setAiValuation] = useState(null);

    // Computer Vision Modal State
    const [visionModalOpen, setVisionModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [visionResult, setVisionResult] = useState(null);
    const [visionLoading, setVisionLoading] = useState(false);

    // QR Code Modal State
    const [qrModalLot, setQrModalLot] = useState(null);

    const fetchData = async () => {
        try {
            const farmerId = user.id || user._id;
            const lotsData = await apiService.getLots({ farmerId });
            setLots(lotsData);

            let ordersData = await apiService.getOrders({ farmerId });
            if (!ordersData || ordersData.length === 0) {
                ordersData = await apiService.getOrders();
            }
            setOrders(ordersData);
        } catch (err) {
            console.error('Error fetching farmer data:', err);
        }
    };

    useEffect(() => {
        fetchData();
        const unsubscribe = subscribeToDbChanges(() => {
            fetchData();
        });
        return () => unsubscribe();
    }, [user]);

    // Live AI Price Valuation Predictor
    const handlePredictPrice = async () => {
        if (!cropName || !quantityKg) return;
        try {
            const data = await apiService.predictPrice({
                cropName,
                category,
                quantityKg: Number(quantityKg),
                gradeScore: 3,
                region: user.region
            });
            setAiValuation(data);
        } catch (err) {
            console.error('Price regression failed:', err);
        }
    };

    // Create New Produce Lot
    const handleCreateLot = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            await apiService.createLot({
                farmerId: user.id || user._id,
                cropName,
                category,
                quantityKg: Number(quantityKg),
                harvestDate,
                region: user.region,
                actorName: user.name
            });

            setLoading(false);
            setMessage('Harvest lot registered successfully on supply chain ledger!');
            setCropName('');
            setQuantityKg('');
            setAiValuation(null);
            fetchData();
        } catch (err) {
            setLoading(false);
            setMessage('Failed to register produce lot.');
        }
    };

    // Computer Vision Image Scan Handler
    const handleRunVisionScan = async (presetFilename) => {
        setVisionLoading(true);
        setVisionResult(null);

        try {
            const formData = new FormData();
            if (presetFilename && typeof presetFilename === 'string') {
                formData.append('filename', presetFilename);
            } else if (selectedImage instanceof File) {
                formData.append('image', selectedImage);
            } else {
                formData.append('filename', 'bad_crop_rot_decay.jpg');
            }

            const data = await apiService.analyzeCrop(formData);
            setVisionResult(data);
        } catch (err) {
            console.error('Vision scan error:', err);
        } finally {
            setVisionLoading(false);
        }
    };

    // Calculate Cumulative Metrics
    const totalCropProducedKg = lots.reduce((acc, l) => acc + (l.quantityKg || 0), 0);
    const activeLotsCount = lots.filter(l => !['DELIVERED', 'REJECTED'].includes(l.status)).length;
    const totalEstValue = lots.reduce((acc, l) => acc + ((l.quantityKg || 0) * (l.aiEstimatedPricePerKg || 35)), 0);

    // Escrow Financial Calculations
    const escrowReleasedTotal = orders
        .filter(o => o.paymentStatus === 'Paid' || o.orderStatus === 'Delivered')
        .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    const escrowLockedTotal = orders
        .filter(o => o.paymentStatus === 'Escrow Held' && o.orderStatus !== 'Delivered')
        .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    // Commodity Breakdown Map
    const commodityBreakdown = lots.reduce((acc, l) => {
        const cat = l.category || 'Grains';
        acc[cat] = (acc[cat] || 0) + (l.quantityKg || 0);
        return acc;
    }, {});

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Header Banner */}
            <div style={styles.banner}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={styles.bannerIcon}>🌾</span>
                        <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                            Farmer Production & Financial Console
                        </h2>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                        Track cumulative crop production volume, manage harvest batches, and monitor real-time Smart Contract Escrow payments.
                    </p>
                </div>
                <button onClick={() => setVisionModalOpen(true)} className="btn-cyan" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="sparkles" size={18} color="#fff" />
                    <span>AI Crop Health Scanner</span>
                </button>
            </div>

            {/* Metrics Row - Total Crop Produced & Escrow Log Summary */}
            <div style={styles.metricsGrid}>
                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Total Cumulative Crop Produced</span>
                            <h3 style={styles.metricVal}>{totalCropProducedKg.toLocaleString()} <span style={{ fontSize: '14px', color: '#9ca3af' }}>Kg</span></h3>
                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>
                                Across {lots.length} registered harvest batches
                            </span>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                            <Icon name="wheat" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Active Supply Batches</span>
                            <h3 style={styles.metricVal}>{activeLotsCount} <span style={{ fontSize: '14px', color: '#9ca3af' }}>Lots</span></h3>
                            <span style={{ fontSize: '11px', color: '#06b6d4', fontWeight: '600' }}>
                                In collection, inspection, or transit
                            </span>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
                            <Icon name="activity" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Escrow Payments Released</span>
                            <h3 style={styles.metricVal}>₹{escrowReleasedTotal.toLocaleString()}</h3>
                            <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '600' }}>
                                🟢 Funds deposited to bank account
                            </span>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                            <Icon name="dollarSign" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Escrow Capital Locked</span>
                            <h3 style={styles.metricVal}>₹{escrowLockedTotal.toLocaleString()}</h3>
                            <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '600' }}>
                                🔒 Locked in Smart Contract
                            </span>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                            <Icon name="lock" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Total Production Commodity Breakdown */}
            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Icon name="barChart" size={20} color="#10b981" />
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>
                            Cumulative Crop Production Breakdown by Commodity
                        </h3>
                    </div>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>Region: {user.region}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    {Object.keys(commodityBreakdown).length === 0 ? (
                        <div style={{ color: '#9ca3af', fontSize: '13px' }}>No harvest batch volume recorded yet.</div>
                    ) : (
                        Object.entries(commodityBreakdown).map(([cat, vol]) => (
                            <div key={cat} style={styles.breakdownCard}>
                                <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>{cat}</div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8', marginTop: '4px' }}>
                                    {vol.toLocaleString()} <span style={{ fontSize: '12px', color: '#9ca3af' }}>Kg</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px' }}>
                                    {((vol / (totalCropProducedKg || 1)) * 100).toFixed(1)}% of total yield
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Form & Grid Content */}
            <div style={styles.mainGrid}>
                {/* Create Produce Lot Card */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Icon name="plus" size={20} color="#10b981" />
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>Register Produce Batch</h3>
                    </div>

                    {message && (
                        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleCreateLot} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label className="form-label">Crop Name</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                value={cropName} 
                                onChange={(e) => setCropName(e.target.value)} 
                                onBlur={handlePredictPrice}
                                placeholder="e.g., Organic Wheat, Basmati Rice, Potatoes" 
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label className="form-label">Category</label>
                                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                                    <option value="Grains">Grains & Cereals</option>
                                    <option value="Pulses">Pulses & Legumes</option>
                                    <option value="Vegetables">Fresh Vegetables</option>
                                    <option value="Fruits">Orchard Fruits</option>
                                    <option value="Spices">Spices & Herbs</option>
                                    <option value="Commercial">Commercial Crops</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Quantity (Kg)</label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    value={quantityKg} 
                                    onChange={(e) => setQuantityKg(e.target.value)} 
                                    onBlur={handlePredictPrice}
                                    placeholder="e.g., 1000" 
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Harvest Date</label>
                            <input 
                                type="date" 
                                className="form-input" 
                                value={harvestDate} 
                                onChange={(e) => setHarvestDate(e.target.value)} 
                                required
                            />
                        </div>

                        {/* Live AI Price Regression Preview Box */}
                        {aiValuation && (
                            <div style={styles.aiValuationBox}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#06b6d4', textTransform: 'uppercase' }}>🤖 AI Market Valuation Prediction</span>
                                    <span className="badge-pill badge-accepted">{aiValuation.marketTrend}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <div>
                                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>Est. Unit Price:</span>
                                        <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#10b981', margin: 0 }}>₹{aiValuation.estimatedUnitPrice} / Kg</h4>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>Total Valuation:</span>
                                        <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b', margin: 0 }}>₹{aiValuation.estimatedTotalValuation.toLocaleString()}</h4>
                                    </div>
                                </div>
                                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>{aiValuation.recommendation}</p>
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-emerald" style={{ width: '100%', marginTop: '6px' }}>
                            {loading ? 'Registering on Ledger...' : 'Submit Produce Batch'}
                        </button>
                    </form>
                </div>

                {/* Produce Lots Inventory Table Card */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Icon name="wheat" size={20} color="#06b6d4" />
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>Your Registered Crop Batches</h3>
                        </div>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>Total: {lots.length} Batches</span>
                    </div>

                    <div className="table-container">
                        {lots.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>
                                No produce batches registered yet. Use the form to submit your first harvest!
                            </div>
                        ) : (
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Crop Name</th>
                                        <th>Qty (Kg)</th>
                                        <th>Status</th>
                                        <th>Grade</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lots.map((lot) => (
                                        <tr key={lot._id}>
                                            <td>
                                                <div style={{ fontWeight: '600', color: '#fff' }}>{lot.cropName}</div>
                                                <div style={{ fontSize: '11px', color: '#9ca3af' }}>ID: {lot.qrCodeString || lot._id.slice(-6)}</div>
                                            </td>
                                            <td style={{ fontWeight: '700', color: '#38bdf8' }}>
                                                {lot.quantityKg ? lot.quantityKg.toLocaleString() : '-'} Kg
                                            </td>
                                            <td>
                                                <span className={`badge-pill badge-${(lot.status || 'CREATED').toLowerCase()}`}>
                                                    {lot.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: '700', color: lot.qualityGrade === 'Grade A' ? '#34d399' : lot.qualityGrade === 'Rejected' ? '#fb7185' : '#fbbf24' }}>
                                                    {lot.qualityGrade || 'Pending Inspection'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button 
                                                        onClick={() => setQrModalLot(lot)}
                                                        className="btn-outline"
                                                        style={{ padding: '4px 10px', fontSize: '12px' }}
                                                        title="View QR Code"
                                                    >
                                                        <Icon name="qrCode" size={14} />
                                                        <span>QR</span>
                                                    </button>

                                                    <button 
                                                        onClick={() => onTraceLookup && onTraceLookup(lot._id)}
                                                        className="btn-outline"
                                                        style={{ padding: '4px 10px', fontSize: '12px', borderColor: 'rgba(6, 182, 212, 0.4)', color: '#22d3ee' }}
                                                        title="Trace Supply Provenance"
                                                    >
                                                        <Icon name="eye" size={14} />
                                                        <span>Trace</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Smart Contract Escrow Payments Log Section */}
            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Icon name="lock" size={20} color="#f59e0b" />
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>
                            Smart Contract Escrow & Financial Payment Log
                        </h3>
                    </div>
                    <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '600' }}>
                        Total Escrow Logged: {orders.length} Transactions
                    </span>
                </div>

                <div className="table-container">
                    {orders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', fontSize: '13px' }}>
                            No active or past escrow transactions recorded yet for your crop batches.
                        </div>
                    ) : (
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Escrow Tx ID</th>
                                    <th>Crop & Batch</th>
                                    <th>Buyer Name</th>
                                    <th>Agreed Rate</th>
                                    <th>Escrow Amount (₹)</th>
                                    <th>Escrow Status</th>
                                    <th>Date</th>
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
                                            <div style={{ color: '#fff', fontWeight: '600' }}>{order.buyerId?.name || 'SuperMart Procurement'}</div>
                                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{order.buyerId?.region || 'North Region'}</div>
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
                                                {(order.paymentStatus === 'Paid' || order.orderStatus === 'Delivered') ? '🟢 Released to Farmer' : '🔒 Escrow Held'}
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

            {/* Computer Vision Diagnostic Modal */}
            {visionModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content animate-fade-in" style={{ maxWidth: '540px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Icon name="sparkles" size={24} color="#06b6d4" />
                                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', margin: 0 }}>
                                    AI Computer Vision Crop Diagnostic
                                </h3>
                            </div>
                            <button onClick={() => setVisionModalOpen(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '20px', cursor: 'pointer' }}>×</button>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>
                                QUICK PATHOLOGY PRESET SAMPLES:
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <button 
                                    type="button"
                                    onClick={() => handleRunVisionScan('bad_crop_rot_decay.jpg')} 
                                    style={{ padding: '8px 10px', backgroundColor: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fb7185', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}
                                >
                                    🦠 Bad Crop (Soft Rot & Decay)
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => handleRunVisionScan('leaf_spot_blight.jpg')} 
                                    style={{ padding: '8px 10px', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fbbf24', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}
                                >
                                    🥀 Leaf Blight & Spot
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => handleRunVisionScan('leaf_rust_yellow.jpg')} 
                                    style={{ padding: '8px 10px', backgroundColor: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)', color: '#facc15', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}
                                >
                                    🍂 Leaf Rust Spores
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => handleRunVisionScan('wheat_healthy_crop.jpg')} 
                                    style={{ padding: '8px 10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}
                                >
                                    🍃 Healthy Produce Sample
                                </button>
                            </div>
                        </div>

                        <div style={styles.uploadArea}>
                            <Icon name="uploadCloud" size={28} color="#06b6d4" />
                            <p style={{ fontSize: '13px', color: '#f9fafb', marginTop: '6px', fontWeight: '600' }}>Or Upload Custom Image File</p>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => setSelectedImage(e.target.files[0])}
                                style={{ marginTop: '6px', fontSize: '12px', color: '#9ca3af' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button onClick={() => handleRunVisionScan()} disabled={visionLoading} className="btn-cyan" style={{ flex: 1 }}>
                                {visionLoading ? 'Analyzing Pathology...' : 'Run Vision Scan on Uploaded Image'}
                            </button>
                        </div>

                        {visionResult && (
                            <div style={styles.visionResultBox}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: visionResult.healthScore > 75 ? '#34d399' : '#fb7185' }}>
                                        {visionResult.cropHealthStatus} (Score: {visionResult.healthScore}/100)
                                    </span>
                                    <span className="badge-pill badge-inspected">{visionResult.confidencePercent}% Confidence</span>
                                </div>
                                <p style={{ fontSize: '13px', color: '#f9fafb', marginBottom: '8px' }}>
                                    <strong>Pathogen Detected:</strong> {visionResult.diseaseDetected}
                                </p>
                                <div style={{ padding: '10px', backgroundColor: 'rgba(11, 15, 25, 0.6)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                    <strong style={{ fontSize: '12px', color: '#06b6d4', display: 'block', marginBottom: '4px' }}>Recommended Agronomic Action:</strong>
                                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{visionResult.recommendedAction}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* QR Code Viewer Modal */}
            {qrModalLot && (
                <div className="modal-backdrop">
                    <div className="modal-content animate-fade-in" style={{ maxWidth: '420px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>
                                Batch Provenance QR Code
                            </h3>
                            <button onClick={() => setQrModalLot(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '20px', cursor: 'pointer' }}>×</button>
                        </div>

                        <div style={styles.qrDisplayBox}>
                            <div style={styles.qrCodeGraphic}>
                                <Icon name="qrCode" size={140} color="#10b981" />
                            </div>
                            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginTop: '16px', margin: '16px 0 4px 0' }}>{qrModalLot.cropName}</h4>
                            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>QR Code: {qrModalLot.qrCodeString || qrModalLot._id}</p>
                            <span className={`badge-pill badge-${(qrModalLot.status || 'CREATED').toLowerCase()}`} style={{ marginTop: '10px' }}>
                                {qrModalLot.status}
                            </span>
                        </div>

                        <button 
                            onClick={() => { setQrModalLot(null); if (onTraceLookup) onTraceLookup(qrModalLot._id); }}
                            className="btn-emerald" 
                            style={{ width: '100%', marginTop: '20px' }}
                        >
                            Open Public Provenance Page
                        </button>
                    </div>
                </div>
            )}
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
        justifyContent: 'center'
    },
    breakdownCard: {
        backgroundColor: 'rgba(11, 15, 25, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '14px 18px'
    },
    mainGrid: {
        display: 'grid',
        gridTemplateColumns: '400px 1fr',
        gap: '24px',
        alignItems: 'start'
    },
    aiValuationBox: {
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: '12px',
        padding: '14px',
        marginTop: '6px'
    },
    uploadArea: {
        border: '2px dashed rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: 'rgba(11, 15, 25, 0.5)'
    },
    visionResultBox: {
        marginTop: '20px',
        padding: '16px',
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '12px'
    },
    qrDisplayBox: {
        backgroundColor: 'rgba(11, 15, 25, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    qrCodeGraphic: {
        width: '180px',
        height: '180px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px'
    }
};

export default FarmerDashboard;