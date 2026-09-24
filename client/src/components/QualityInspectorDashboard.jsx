import React, { useState, useEffect } from 'react';
import Icon from './IconSystem';
import { apiService } from '../services/api';
import { subscribeToDbChanges } from '../services/socket';

const QualityInspectorDashboard = ({ user, onTraceLookup }) => {
    const [lots, setLots] = useState([]);
    const [selectedLotId, setSelectedLotId] = useState('');
    const [grade, setGrade] = useState('Grade A');
    const [moistureContentPercent, setMoistureContentPercent] = useState('11.8');
    const [defectsFound, setDefectsFound] = useState('None');
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // AI Computer Vision Assistant State
    const [aiVerification, setAiVerification] = useState(null);
    const [aiScanning, setAiScanning] = useState(false);

    const fetchLots = async () => {
        try {
            const data = await apiService.getLots({ region: user.region });
            setLots(data);
        } catch (err) {
            console.error('Error fetching lots:', err);
        }
    };

    useEffect(() => {
        fetchLots();
        const unsubscribe = subscribeToDbChanges(() => {
            fetchLots();
        });
        return () => unsubscribe();
    }, [user]);


    // AI Computer Vision Quality Assistant
    const handleRunAiAssist = async (presetType) => {
        if (!selectedLotId) return;
        setAiScanning(true);
        setAiVerification(null);

        try {
            const targetLot = lots.find(l => l._id === selectedLotId);
            const cropName = targetLot ? targetLot.cropName.toLowerCase() : 'wheat';
            const hasDefects = defectsFound && defectsFound.toLowerCase() !== 'none' && defectsFound.toLowerCase() !== 'none detected';
            
            let filename = `${cropName}_healthy_crop.jpg`;
            if (presetType === 'bad' || hasDefects) {
                filename = `${cropName}_bad_crop_rot_decay.jpg`;
            } else if (presetType === 'blight') {
                filename = `${cropName}_leaf_spot_blight.jpg`;
            }

            const data = await apiService.analyzeCrop({ filename });

            setAiVerification(data);
            if (data.healthScore > 80) {
                setGrade('Grade A');
                setRemarks('AI Vision confirmed optimal cellular integrity & zero pathogen signature.');
            } else if (data.healthScore > 60) {
                setGrade('Grade B');
                setRemarks('AI Vision detected minor moisture variance. Standard market grade.');
            } else {
                setGrade('Rejected');
                setRemarks(`AI Vision warning: ${data.diseaseDetected} (Health score: ${data.healthScore}/100). Recommended quarantine.`);
            }
        } catch (err) {
            console.error('AI Inspection assist error:', err);
        } finally {
            setAiScanning(false);
        }
    };


    // Handle inspection submission
    const handleInspectionSubmit = async (e) => {
        e.preventDefault();
        if (!selectedLotId) {
            setMessage('Please choose a produce batch to inspect.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            await apiService.recordInspection({
                lotId: selectedLotId,
                inspectorId: user.id || user._id,
                inspectorName: user.name,
                grade,
                moistureContentPercent: Number(moistureContentPercent),
                defectsFound,
                remarks,
                aiDiagnostic: aiVerification ? {
                    disease: aiVerification.diseaseDetected,
                    confidence: aiVerification.confidencePercent,
                    recommendation: aiVerification.recommendedAction
                } : null
            });

            setLoading(false);
            setMessage(`Inspection recorded! Batch status updated to '${grade === 'Rejected' ? 'REJECTED' : 'ACCEPTED'}'.`);
            setSelectedLotId('');
            setRemarks('');
            setAiVerification(null);
            fetchLots();
        } catch (err) {
            setLoading(false);
            setMessage('Failed to submit inspection record.');
        }
    };

    const pendingLots = lots.filter(l => ['CREATED', 'RECEIVED', 'Created', 'Received'].includes(l.status));
    const inspectedCount = lots.filter(l => ['ACCEPTED', 'REJECTED', 'STORED', 'ALLOCATED', 'DISPATCHED', 'DELIVERED', 'Inspected'].includes(l.status)).length;
    const rejectedCount = lots.filter(l => l.status === 'REJECTED' || l.qualityGrade === 'Rejected').length;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Header Banner */}
            <div style={styles.banner}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={styles.bannerIcon}>🔍</span>
                        <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                            Quality Verification & Grading Center
                        </h2>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                        Certified Inspector: <strong style={{ color: '#fff' }}>{user.name}</strong> | Regional Hub: <strong style={{ color: '#06b6d4' }}>{user.region}</strong>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <span className="badge-pill badge-inspected" style={{ padding: '8px 16px', fontSize: '13px' }}>
                        Pending Queue: {pendingLots.length} Lots
                    </span>
                </div>
            </div>

            {/* Metrics */}
            <div style={styles.metricsGrid}>
                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Pending Inspection Queue</span>
                            <h3 style={styles.metricVal}>{pendingLots.length} <span style={{ fontSize: '14px', color: '#9ca3af' }}>Batches</span></h3>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
                            <Icon name="shieldCheck" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Inspected & Certified</span>
                            <h3 style={styles.metricVal}>{inspectedCount} <span style={{ fontSize: '14px', color: '#9ca3af' }}>Batches</span></h3>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                            <Icon name="checkCircle" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Quality Rejections</span>
                            <h3 style={styles.metricVal}>{rejectedCount} <span style={{ fontSize: '14px', color: '#9ca3af' }}>Batches</span></h3>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
                            <Icon name="alertTriangle" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={styles.mainGrid}>
                {/* Record Inspection Form */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Icon name="shieldCheck" size={20} color="#06b6d4" />
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>Digital Inspection Certificate</h3>
                    </div>

                    {message && (
                        <div style={{ padding: '12px 16px', backgroundColor: message.includes('REJECTED') ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: message.includes('REJECTED') ? '#fb7185' : '#34d399', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleInspectionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label className="form-label">Select Harvest Batch to Inspect</label>
                            <select 
                                className="form-select" 
                                value={selectedLotId} 
                                onChange={(e) => setSelectedLotId(e.target.value)} 
                                required
                            >
                                <option value="">-- Choose Batch from Queue ({pendingLots.length} Pending) --</option>
                                {pendingLots.map((lot) => (
                                    <option key={lot._id} value={lot._id}>
                                        {lot.cropName} ({lot.quantityKg} Kg) — ID: {lot.qrCodeString || lot._id.slice(-6)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* AI Vision Verification Assistant Trigger */}
                        {selectedLotId && (
                            <div style={styles.aiAssistBanner}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#22d3ee' }}>🤖 Computer Vision AI Diagnostic Assistant</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => handleRunAiAssist('auto')} 
                                        disabled={aiScanning}
                                        style={styles.aiScanBtn}
                                    >
                                        <Icon name="sparkles" size={14} color="#0b0f19" />
                                        <span>{aiScanning ? 'Scanning...' : 'Scan Harvest Batch'}</span>
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => handleRunAiAssist('bad')} 
                                        disabled={aiScanning}
                                        style={{ ...styles.aiScanBtn, backgroundColor: 'rgba(244, 63, 94, 0.2)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.4)' }}
                                    >
                                        🦠 Test Bad Crop Decay
                                    </button>
                                </div>


                                {aiVerification && (
                                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(6, 182, 212, 0.2)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#f9fafb' }}>
                                            <span>Diagnostic: <strong>{aiVerification.diseaseDetected}</strong></span>
                                            <span style={{ color: '#34d399' }}>{aiVerification.confidencePercent}% Confidence</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label className="form-label">Quality Grade</label>
                                <select className="form-select" value={grade} onChange={(e) => setGrade(e.target.value)}>
                                    <option value="Grade A">Grade A (Premium Export)</option>
                                    <option value="Grade B">Grade B (Standard Commercial)</option>
                                    <option value="Grade C">Grade C (Fair Quality)</option>
                                    <option value="Rejected">Rejected (Non-Compliant)</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Moisture Content (%)</label>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    className="form-input" 
                                    value={moistureContentPercent} 
                                    onChange={(e) => setMoistureContentPercent(e.target.value)} 
                                    placeholder="e.g., 11.5" 
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Defect / Pest Notes</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                value={defectsFound} 
                                onChange={(e) => setDefectsFound(e.target.value)} 
                                placeholder="e.g., Zero defects, minor discolored husks"
                            />
                        </div>

                        <div>
                            <label className="form-label">Inspector Remarks & Certification Notes</label>
                            <textarea 
                                className="form-textarea" 
                                rows={3} 
                                value={remarks} 
                                onChange={(e) => setRemarks(e.target.value)} 
                                placeholder="Enter technical evaluation notes..."
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className={grade === 'Rejected' ? 'btn-amber' : 'btn-cyan'} 
                            style={{ width: '100%', marginTop: '6px' }}
                        >
                            {loading ? 'Recording Certification...' : `Confirm & Issue ${grade}`}
                        </button>
                    </form>
                </div>

                {/* Regional Inventory Status Table Card */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Icon name="barChart" size={20} color="#10b981" />
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>Regional Inventory Inspection Log</h3>
                        </div>
                    </div>

                    <div className="table-container">
                        {lots.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>
                                No produce lots found in this region.
                            </div>
                        ) : (
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Crop</th>
                                        <th>Quantity</th>
                                        <th>Status</th>
                                        <th>Grade</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lots.map((lot) => (
                                        <tr key={lot._id}>
                                            <td>
                                                <div style={{ fontWeight: '600', color: '#fff' }}>{lot.cropName}</div>
                                                <div style={{ fontSize: '11px', color: '#9ca3af' }}>ID: {lot.qrCodeString || lot._id.slice(-6)}</div>
                                            </td>
                                            <td>{lot.quantityKg ? lot.quantityKg.toLocaleString() : '-'} Kg</td>
                                            <td>
                                                <span className={`badge-pill badge-${(lot.status || 'CREATED').toLowerCase()}`}>
                                                    {lot.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: '700', color: lot.qualityGrade === 'Grade A' ? '#34d399' : lot.qualityGrade === 'Rejected' ? '#fb7185' : '#fbbf24' }}>
                                                    {lot.qualityGrade || 'Pending'}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    onClick={() => onTraceLookup && onTraceLookup(lot._id)}
                                                    className="btn-outline"
                                                    style={{ padding: '4px 10px', fontSize: '12px' }}
                                                >
                                                    View Trace
                                                </button>
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
        gridTemplateColumns: '420px 1fr',
        gap: '24px',
        alignItems: 'start'
    },
    aiAssistBanner: {
        padding: '12px 14px',
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: '10px'
    },
    aiScanBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        backgroundColor: '#06b6d4',
        border: 'none',
        color: '#0b0f19',
        fontSize: '12px',
        fontWeight: '700',
        borderRadius: '6px',
        cursor: 'pointer'
    }
};

export default QualityInspectorDashboard;