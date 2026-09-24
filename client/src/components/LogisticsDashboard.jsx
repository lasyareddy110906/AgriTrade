import React, { useState, useEffect } from 'react';
import Icon from './IconSystem';
import { apiService } from '../services/api';
import { subscribeToDbChanges } from '../services/socket';

const LogisticsDashboard = ({ user, onTraceLookup }) => {
    const [orders, setOrders] = useState([]);
    const [shipments, setShipments] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [driverName, setDriverName] = useState('');
    const [sourceLocation, setSourceLocation] = useState(`${user.region || 'North Region'} Collection Hub`);
    const [destinationLocation, setDestinationLocation] = useState('Central SuperMart Distribution Warehouse');
    const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchData = async () => {
        try {
            const ordersData = await apiService.getOrders();
            setOrders(ordersData.filter(o => ['Allocated', 'Pending', 'Confirmed'].includes(o.orderStatus)));

            const shipmentsData = await apiService.getShipments();
            setShipments(shipmentsData);
        } catch (err) {
            console.error('Error fetching logistics data:', err);
        }
    };

    useEffect(() => {
        fetchData();
        const unsubscribe = subscribeToDbChanges(() => {
            fetchData();
        });
        return () => unsubscribe();
    }, [user]);


    // Handle Dispatch Shipment
    const handleDispatchShipment = async (e) => {
        e.preventDefault();
        if (!selectedOrderId || !vehicleNumber || !driverName) {
            setMessage('Please enter vehicle registration number, driver name, and select order.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            await apiService.createShipment({
                orderId: selectedOrderId,
                logisticsCoordinatorId: user.id || user._id,
                coordinatorName: user.name,
                vehicleNumber,
                driverName,
                sourceLocation,
                destinationLocation,
                estimatedDeliveryDate
            });

            setLoading(false);
            setMessage('Shipment dispatched! Transit telemetry & GPS tracking activated.');
            setSelectedOrderId('');
            setVehicleNumber('');
            setDriverName('');
            fetchData();
        } catch (err) {
            setLoading(false);
            setMessage('Failed to dispatch shipment.');
        }
    };

    // Update shipment delivery status
    const handleStatusUpdate = async (shipmentId, newStatus) => {
        try {
            await apiService.updateShipmentStatus(shipmentId, {
                shipmentStatus: newStatus,
                coordinatorName: user.name
            });
            fetchData();
        } catch (err) {
            console.error('Failed to update shipment status:', err);
        }
    };

    const activeInTransit = shipments.filter(s => s.shipmentStatus === 'Dispatched' || s.shipmentStatus === 'In Transit').length;
    const deliveredCount = shipments.filter(s => s.shipmentStatus === 'Delivered').length;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Header Banner */}
            <div style={styles.banner}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={styles.bannerIcon}>🚚</span>
                        <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                            Smart Fleet & Transport Logistics Command
                        </h2>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                        Logistics Lead: <strong style={{ color: '#fff' }}>{user.name}</strong> | Transport Hub: <strong style={{ color: '#c084fc' }}>{user.region}</strong>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <span className="badge-pill badge-dispatched" style={{ padding: '8px 16px', fontSize: '13px' }}>
                        {activeInTransit} Vehicles In Transit
                    </span>
                </div>
            </div>

            {/* Metrics */}
            <div style={styles.metricsGrid}>
                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Shipments In Transit</span>
                            <h3 style={styles.metricVal}>{activeInTransit} <span style={{ fontSize: '14px', color: '#9ca3af' }}>Trucks</span></h3>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }}>
                            <Icon name="truck" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Awaiting Dispatch</span>
                            <h3 style={styles.metricVal}>{orders.length} <span style={{ fontSize: '14px', color: '#9ca3af' }}>Orders</span></h3>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                            <Icon name="barChart" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={styles.metricCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={styles.metricLabel}>Completed Deliveries</span>
                            <h3 style={styles.metricVal}>{deliveredCount} <span style={{ fontSize: '14px', color: '#9ca3af' }}>Delivered</span></h3>
                        </div>
                        <div style={{ ...styles.iconBox, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                            <Icon name="checkCircle" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={styles.mainGrid}>
                {/* Dispatch Form Card */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Icon name="truck" size={20} color="#c084fc" />
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>Dispatch New Shipment</h3>
                    </div>

                    {message && (
                        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleDispatchShipment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label className="form-label">Select Allocated Purchase Order</label>
                            <select 
                                className="form-select" 
                                value={selectedOrderId} 
                                onChange={(e) => setSelectedOrderId(e.target.value)} 
                                required
                            >
                                <option value="">-- Choose Order to Dispatch ({orders.length} Ready) --</option>
                                {orders.map((order) => (
                                    <option key={order._id} value={order._id}>
                                        Order #{order._id.slice(-6)} — {order.lotId?.cropName} ({order.lotId?.quantityKg} Kg) — ₹{order.totalAmount}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label className="form-label">Vehicle Registration No.</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={vehicleNumber} 
                                    onChange={(e) => setVehicleNumber(e.target.value)} 
                                    placeholder="e.g., KA-01-HH-9988" 
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">Driver Name</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={driverName} 
                                    onChange={(e) => setDriverName(e.target.value)} 
                                    placeholder="e.g., Suresh Kumar" 
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Origin Collection Hub</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                value={sourceLocation} 
                                onChange={(e) => setSourceLocation(e.target.value)} 
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label">Destination Warehouse / Facility</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                value={destinationLocation} 
                                onChange={(e) => setDestinationLocation(e.target.value)} 
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label">Estimated Delivery Date</label>
                            <input 
                                type="date" 
                                className="form-input" 
                                value={estimatedDeliveryDate} 
                                onChange={(e) => setEstimatedDeliveryDate(e.target.value)} 
                                required
                            />
                        </div>

                        <button type="submit" disabled={loading} className="btn-emerald" style={{ width: '100%', marginTop: '6px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                            {loading ? 'Dispatching Fleet...' : 'Dispatch Vehicle & Start Telemetry'}
                        </button>
                    </form>
                </div>

                {/* Fleet Transit Tracking Table Card */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Icon name="truck" size={20} color="#38bdf8" />
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>Active Fleet Transit Monitor</h3>
                        </div>
                    </div>

                    <div className="table-container">
                        {shipments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>
                                No active shipments in transport pipeline. Use the dispatch form to launch a shipment!
                            </div>
                        ) : (
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Vehicle & Driver</th>
                                        <th>Route</th>
                                        <th>Telemetry</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shipments.map((shipment) => (
                                        <tr key={shipment._id}>
                                            <td>
                                                <div style={{ fontWeight: '700', color: '#fff' }}>{shipment.vehicleNumber}</div>
                                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Driver: {shipment.driverName}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '12px', color: '#f9fafb' }}>{shipment.sourceLocation}</div>
                                                <div style={{ fontSize: '11px', color: '#38bdf8' }}>&rarr; {shipment.destinationLocation}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '11px', color: '#34d399' }}>🌡️ {shipment.telemetry?.temperatureC || 21.4}°C | 💧 {shipment.telemetry?.humidityPercent || 55}%</div>
                                                <div style={{ fontSize: '10px', color: '#9ca3af' }}>📍 {shipment.telemetry?.gpsCoordinates || '17.3850 N, 78.4867 E'}</div>
                                            </td>
                                            <td>
                                                <span className={`badge-pill badge-${(shipment.shipmentStatus || 'Dispatched').toLowerCase()}`}>
                                                    {shipment.shipmentStatus}
                                                </span>
                                            </td>
                                            <td>
                                                {shipment.shipmentStatus !== 'Delivered' ? (
                                                    <button 
                                                        onClick={() => handleStatusUpdate(shipment._id, 'Delivered')}
                                                        className="btn-emerald"
                                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                                    >
                                                        Confirm Delivery
                                                    </button>
                                                ) : (
                                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#10b981' }}>
                                                        ✓ Escrow Released
                                                    </span>
                                                )}
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
        gridTemplateColumns: '400px 1fr',
        gap: '24px',
        alignItems: 'start'
    }
};

export default LogisticsDashboard;