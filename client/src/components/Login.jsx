import React, { useState } from 'react';
import Icon from './IconSystem';
import { apiService } from '../services/api';

const DEMO_PRESETS = [
    { role: 'Farmer', name: 'Ramesh Farmer', email: 'ramesh@farm.com', region: 'North Region', icon: 'wheat', color: '#10b981' },
    { role: 'Quality Inspector', name: 'Chief Inspector', email: 'inspector@agritrade.com', region: 'North Region', icon: 'shieldCheck', color: '#06b6d4' },
    { role: 'Buyer', name: 'SuperMart Buyer', email: 'buyer@marts.com', region: 'North Region', icon: 'shoppingCart', color: '#f59e0b' },
    { role: 'Logistics Coordinator', name: 'Logistics Lead', email: 'logistics@transport.com', region: 'North Region', icon: 'truck', color: '#8b5cf6' },
    { role: 'Platform Admin', name: 'System Admin', email: 'admin@agritrade.com', region: 'North Region', icon: 'barChart', color: '#f43f5e' }
];

const Login = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('password123');
    const [name, setName] = useState('');
    const [role, setRole] = useState('Farmer');
    const [region, setRegion] = useState('North Region');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        try {
            if (mode === 'register') {
                const res = await apiService.register({ name, email, password, role, region });
                if (res.token) {
                    localStorage.setItem('token', res.token);
                    localStorage.setItem('user', JSON.stringify(res.user));
                    setLoading(false);
                    if (onLoginSuccess) onLoginSuccess(res.user);
                } else {
                    setMode('login');
                    setSuccessMsg('Account registered successfully! Please sign in.');
                    setLoading(false);
                }
            } else {
                const res = await apiService.login(email, password);
                if (res.token) {
                    localStorage.setItem('token', res.token);
                    localStorage.setItem('user', JSON.stringify(res.user));
                    setLoading(false);
                    if (onLoginSuccess) onLoginSuccess(res.user);
                }
            }
        } catch (err) {
            setLoading(false);
            setError('Authentication failed. Please check details.');
        }
    };

    const handleQuickPreset = async (preset) => {
        setEmail(preset.email);
        setPassword('password123');
        setName(preset.name);
        setRole(preset.role);
        setRegion(preset.region);
        
        setError('');
        setLoading(true);

        try {
            const res = await apiService.login(preset.email, 'password123');
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            setLoading(false);
            if (onLoginSuccess) onLoginSuccess(res.user);
        } catch (loginErr) {
            setLoading(false);
            setError('Quick login preset failed.');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.backdropGlow} />

            <div style={styles.card}>
                {/* Brand Header */}
                <div style={styles.brandHeader}>
                    <div style={styles.logoIconBg}>
                        <Icon name="wheat" size={32} color="#10b981" />
                    </div>
                    <h2 style={styles.title}>
                        Agri<span style={{ color: '#10b981' }}>Trade</span> <span style={styles.aiTag}>AI</span>
                    </h2>
                    <p style={styles.subtitle}>Enterprise Agricultural Procurement & Supply Chain Platform</p>
                </div>

                {/* Tab Switcher */}
                <div style={styles.tabContainer}>
                    <button 
                        onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                        style={{ ...styles.tabBtn, ...(mode === 'login' ? styles.tabBtnActive : {}) }}
                    >
                        Sign In
                    </button>
                    <button 
                        onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                        style={{ ...styles.tabBtn, ...(mode === 'register' ? styles.tabBtnActive : {}) }}
                    >
                        Create Account
                    </button>
                </div>

                {error && <div style={styles.errorBox}><Icon name="alertTriangle" size={16} color="#f43f5e" /> {error}</div>}
                {successMsg && <div style={styles.successBox}><Icon name="checkCircle" size={16} color="#10b981" /> {successMsg}</div>}

                {/* Form */}
                <form onSubmit={handleAuth} style={styles.form}>
                    {mode === 'register' && (
                        <div style={styles.inputGroup}>
                            <label className="form-label">Full Name</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                placeholder="e.g., Ramesh Kumar" 
                                required
                            />
                        </div>
                    )}

                    <div style={styles.inputGroup}>
                        <label className="form-label">Email Address</label>
                        <input 
                            type="email" 
                            className="form-input" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="e.g., ramesh@farm.com" 
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label className="form-label">Password</label>
                        <input 
                            type="password" 
                            className="form-input" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••••" 
                            required
                        />
                    </div>

                    {mode === 'register' && (
                        <>
                            <div style={styles.inputGroup}>
                                <label className="form-label">Select System Role</label>
                                <select 
                                    className="form-select" 
                                    value={role} 
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value="Farmer">Farmer (Producer)</option>
                                    <option value="Quality Inspector">Quality Inspector (Grading)</option>
                                    <option value="Buyer">Buyer (Procurement Enterprise)</option>
                                    <option value="Logistics Coordinator">Logistics Coordinator (Transport)</option>
                                    <option value="Platform Admin">Platform Admin (Executive)</option>
                                </select>
                            </div>

                            <div style={styles.inputGroup}>
                                <label className="form-label">Region / Collection Hub</label>
                                <select 
                                    className="form-select" 
                                    value={region} 
                                    onChange={(e) => setRegion(e.target.value)}
                                >
                                    <option value="North Region">North Region Hub</option>
                                    <option value="South Region">South Region Hub</option>
                                    <option value="East Region">East Region Hub</option>
                                    <option value="West Region">West Region Hub</option>
                                    <option value="Central Region">Central Region Hub</option>
                                </select>
                            </div>
                        </>
                    )}

                    <button type="submit" disabled={loading} className="btn-emerald" style={{ marginTop: '10px', width: '100%' }}>
                        {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Dashboard' : 'Register Account'}
                    </button>
                </form>

                {/* Role Quick-Login Presets */}
                <div style={styles.presetsSection}>
                    <p style={styles.presetsTitle}>⚡ Demo Quick-Login by Role:</p>
                    <div style={styles.presetsGrid}>
                        {DEMO_PRESETS.map((p) => (
                            <button 
                                key={p.role} 
                                onClick={() => handleQuickPreset(p)}
                                style={styles.presetChip}
                            >
                                <Icon name={p.icon} size={14} color={p.color} />
                                <span>{p.role}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        backgroundColor: '#0b0f19'
    },
    backdropGlow: {
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.05) 50%, transparent 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none'
    },
    card: {
        width: '100%',
        maxWidth: '460px',
        backgroundColor: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        padding: '36px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        zIndex: 10
    },
    brandHeader: {
        textAlign: 'center',
        marginBottom: '24px'
    },
    logoIconBg: {
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '12px'
    },
    title: {
        fontSize: '28px',
        fontWeight: '800',
        color: '#ffffff',
        margin: '0 0 4px 0',
        fontFamily: "'Outfit', sans-serif"
    },
    aiTag: {
        fontSize: '12px',
        fontWeight: '800',
        padding: '2px 6px',
        borderRadius: '4px',
        backgroundColor: '#06b6d4',
        color: '#0b0f19',
        verticalAlign: 'middle'
    },
    subtitle: {
        fontSize: '13px',
        color: '#9ca3af',
        margin: 0
    },
    tabContainer: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px',
        backgroundColor: 'rgba(11, 15, 25, 0.7)',
        padding: '4px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
    },
    tabBtn: {
        padding: '10px',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '8px',
        color: '#9ca3af',
        fontWeight: '600',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    tabBtnActive: {
        backgroundColor: '#1f2937',
        color: '#f9fafb',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column'
    },
    errorBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        backgroundColor: 'rgba(244, 63, 94, 0.15)',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        color: '#fb7185',
        borderRadius: '8px',
        fontSize: '13px',
        marginBottom: '14px'
    },
    successBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        color: '#34d399',
        borderRadius: '8px',
        fontSize: '13px',
        marginBottom: '14px'
    },
    presetsSection: {
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
    },
    presetsTitle: {
        fontSize: '12px',
        fontWeight: '700',
        color: '#9ca3af',
        marginBottom: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    presetsGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
    },
    presetChip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '9999px',
        color: '#f9fafb',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    }
};

export default Login;