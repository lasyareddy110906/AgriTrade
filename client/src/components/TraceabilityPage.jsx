import React, { useState, useEffect } from 'react';
import Icon from './IconSystem';
import { apiService } from '../services/api';

const TraceabilityPage = ({ lotId, onBack }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!lotId) return;
        setLoading(true);
        setError('');

        apiService.getTraceability(lotId)
            .then(resData => {
                setData(resData);
                setLoading(false);
            })
            .catch(err => {
                console.error('Provenance fetch error:', err);
                setError('Invalid or expired QR code / Lot ID.');
                setLoading(false);
            });
    }, [lotId]);

    if (loading) {
        return (
            <div className="animate-fade-in" style={styles.centerContainer}>
                <div style={styles.spinner} />
                <h3 style={{ color: '#fff', fontSize: '18px', marginTop: '16px' }}>
                    Verifying Supply Chain Ledger & Provenance...
                </h3>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="animate-fade-in" style={styles.centerContainer}>
                <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
                    <Icon name="alertTriangle" size={32} />
                </div>
                <h3 style={{ color: '#fff', fontSize: '20px', marginTop: '16px' }}>
                    Traceability Record Not Found
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '6px' }}>{error}</p>
                <button onClick={onBack} className="btn-emerald" style={{ marginTop: '20px' }}>
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const historyTimeline = data.history && data.history.length > 0 ? data.history : [
        { stage: 'CREATED', timestamp: data.harvestDate, actorName: data.farmerName || 'Farmer', actorRole: 'Farmer', notes: 'Harvest batch initialized on supply chain ledger.' },
        { stage: 'INSPECTED', timestamp: data.inspectionDetails?.inspectionDate, actorName: data.inspectionDetails?.inspectorName || 'Certified Inspector', actorRole: 'Quality Inspector', notes: `Grade assigned: ${data.qualityGrade}` },
        { stage: 'DISPATCHED', timestamp: data.logisticsSummary?.estimatedDeliveryDate, actorName: 'Logistics Team', actorRole: 'Logistics Coordinator', notes: `Dispatched via ${data.logisticsSummary?.vehicleNumber || 'KA-01-HH-9988'}` }
    ];

    return (
        <div className="animate-fade-in" style={styles.pageContainer}>
            {/* Top Navigation Bar */}
            <div style={styles.topBar}>
                <button onClick={onBack} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    &larr; Back to Dashboard
                </button>
                <span className="badge-pill badge-delivered" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    ✓ Immutable Ledger Verified
                </span>
            </div>

            {/* Main Provenance Certificate Card */}
            <div className="glass-card" style={styles.certCard}>
                {/* Certificate Header */}
                <div style={styles.certHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={styles.certBadgeIcon}>
                            <Icon name="wheat" size={32} color="#10b981" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                                    {data.cropName}
                                </h2>
                                <span className={`badge-pill badge-${(data.currentStatus || 'CREATED').toLowerCase()}`}>
                                    {data.currentStatus}
                                </span>
                            </div>
                            <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0 0 0' }}>
                                QR String: <strong style={{ color: '#10b981' }}>{data.qrCodeString || data.lotId}</strong>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div style={styles.detailsGrid}>
                    <div style={styles.detailBox}>
                        <span style={styles.detailLabel}>Category & Volume</span>
                        <h4 style={styles.detailVal}>{data.category} — {data.quantityKg} Kg</h4>
                    </div>

                    <div style={styles.detailBox}>
                        <span style={styles.detailLabel}>Origin Region & Hub</span>
                        <h4 style={styles.detailVal}>📍 {data.region}</h4>
                    </div>

                    <div style={styles.detailBox}>
                        <span style={styles.detailLabel}>Registered Producer</span>
                        <h4 style={styles.detailVal}>👨‍🌾 {data.farmerName}</h4>
                    </div>

                    <div style={styles.detailBox}>
                        <span style={styles.detailLabel}>Quality Grade Certification</span>
                        <h4 style={{ ...styles.detailVal, color: data.qualityGrade === 'Grade A' ? '#34d399' : '#fbbf24' }}>
                            🏅 {data.qualityGrade}
                        </h4>
                    </div>

                    {data.moistureContentPercent && (
                        <div style={styles.detailBox}>
                            <span style={styles.detailLabel}>Certified Moisture Content</span>
                            <h4 style={styles.detailVal}>💧 {data.moistureContentPercent}%</h4>
                        </div>
                    )}

                    {data.defectsFound && (
                        <div style={styles.detailBox}>
                            <span style={styles.detailLabel}>Defect Assessment</span>
                            <h4 style={styles.detailVal}>🔍 {data.defectsFound}</h4>
                        </div>
                    )}
                </div>

                {/* Journey Timeline */}
                <div style={{ marginTop: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="activity" size={20} color="#06b6d4" />
                        <span>Supply Chain Provenance Audit Log</span>
                    </h3>

                    <div style={styles.timelineList}>
                        {historyTimeline.map((item, index) => (
                            <div key={index} style={styles.timelineStep}>
                                <div style={styles.timelineDot}>
                                    <Icon name={item.stage === 'DELIVERED' ? 'checkCircle' : item.stage === 'DISPATCHED' ? 'truck' : item.stage === 'INSPECTED' ? 'shieldCheck' : 'wheat'} size={14} color="#10b981" />
                                </div>
                                <div style={styles.timelineCard}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#10b981' }}>[{item.stage}]</span>
                                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{new Date(item.timestamp || Date.now()).toLocaleString()}</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#f9fafb', margin: '4px 0' }}>{item.notes}</p>
                                    <span style={{ fontSize: '11px', color: '#06b6d4' }}>Actor: {item.actorName} ({item.actorRole})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    pageContainer: {
        maxWidth: '850px',
        margin: '0 auto',
        padding: '24px',
        width: '100%'
    },
    topBar: {
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
    },
    centerContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '40px'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid rgba(16, 185, 129, 0.2)',
        borderTopColor: '#10b981',
        borderRadius: '50%',
        animation: 'fadeIn 0.6s linear infinite'
    },
    iconBadge: {
        width: '64px',
        height: '64px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    certCard: {
        padding: '36px'
    },
    certHeader: {
        paddingBottom: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '24px'
    },
    certBadgeIcon: {
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    detailsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
    },
    detailBox: {
        backgroundColor: 'rgba(11, 15, 25, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '16px'
    },
    detailLabel: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'block',
        marginBottom: '4px'
    },
    detailVal: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#ffffff',
        margin: 0
    },
    timelineList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        paddingLeft: '24px',
        borderLeft: '2px solid rgba(16, 185, 129, 0.2)'
    },
    timelineStep: {
        position: 'relative'
    },
    timelineDot: {
        position: 'absolute',
        left: '-32px',
        top: '12px',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: '#111827',
        border: '2px solid #10b981',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    timelineCard: {
        backgroundColor: 'rgba(11, 15, 25, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '14px 18px'
    }
};

export default TraceabilityPage;