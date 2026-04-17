import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Lock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const PaymentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [name, setName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Get booking details from navigation state or default
    const booking = location.state?.booking || {
        provider: "Sarah Johnson",
        service: "House Cleaning",
        amount: "Rs8500.00",
        date: "Dec 2, 2024 at 2:00 PM"
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        alert('Payment successful!');
        navigate('/customer-dashboard', { state: { paymentSuccess: true } });
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0; i < match.length; i += 4) parts.push(match.substring(i, i + 4));
        return parts.length ? parts.join(' ') : value;
    };

    const handleCardNumberChange = (e) => setCardNumber(formatCardNumber(e.target.value));

    const handleExpiryChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
        setExpiry(value);
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backButton}>
                    <ArrowLeft size={20} />
                    <span>Back to Dashboard</span>
                </button>
                <div style={styles.logo}>
                    <div style={styles.logoIcon}>H</div>
                    <span style={styles.logoText}>HireRight</span>
                </div>
            </div>

            <div style={styles.container}>
                <div style={styles.content}>
                    {/* Left Column - Payment Form */}
                    <div style={styles.leftColumn}>
                        <div style={styles.sectionHeader}>
                            <CreditCard size={24} color="#3b82f6" />
                            <h1 style={styles.title}>Payment Details</h1>
                        </div>

                        <form onSubmit={handleSubmit} style={styles.form}>
                            {/* Service Info */}
                            <div style={styles.serviceInfo}>
                                <div style={styles.serviceInfoRow}>
                                    <span>Service:</span>
                                    <span style={styles.serviceInfoValue}>{booking.service}</span>
                                </div>
                                <div style={styles.serviceInfoRow}>
                                    <span>Provider:</span>
                                    <span style={styles.serviceInfoValue}>{booking.provider}</span>
                                </div>
                                <div style={styles.serviceInfoRow}>
                                    <span>Date:</span>
                                    <span style={styles.serviceInfoValue}>{booking.date}</span>
                                </div>
                                <div style={styles.serviceInfoRow}>
                                    <span>Amount:</span>
                                    <span style={styles.amount}>{booking.amount}</span>
                                </div>
                            </div>

                            {/* Card Details */}
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Card Number</label>
                                <input
                                    type="text"
                                    placeholder="1234 5678 9012 3456"
                                    value={cardNumber}
                                    onChange={handleCardNumberChange}
                                    maxLength={19}
                                    style={styles.input}
                                    required
                                />
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Expiry Date</label>
                                    <input
                                        type="text"
                                        placeholder="MM/YY"
                                        value={expiry}
                                        onChange={handleExpiryChange}
                                        maxLength={5}
                                        style={styles.input}
                                        required
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>CVC</label>
                                    <input
                                        type="text"
                                        placeholder="123"
                                        value={cvc}
                                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        maxLength={4}
                                        style={styles.input}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Name on Card</label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={styles.input}
                                    required
                                />
                            </div>

                            <button type="submit" style={styles.submitButton} disabled={isProcessing}>
                                {isProcessing ? 'Processing...' : `Pay ${booking.amount}`}
                                <Lock size={16} />
                            </button>

                            <div style={styles.securityNote}>
                                <Lock size={14} color="#64748b" />
                                <span>Your payment is secured with 256-bit SSL encryption</span>
                            </div>
                        </form>
                    </div>

                    {/* Right Column - Summary */}
                    <div style={styles.rightColumn}>
                        <div style={styles.summaryCard}>
                            <h2 style={styles.summaryTitle}>Order Summary</h2>
                            <div style={styles.summaryItem}>
                                <span>Service Fee</span>
                                <span>{booking.amount}</span>
                            </div>
                            <div style={styles.summaryItem}>
                                <span>Platform Fee</span>
                                <span>Rs.0.00</span>
                            </div>
                            <div style={styles.summaryItem}>
                                <span>Tax</span>
                                <span>Rs.0</span>
                            </div>
                            <div style={styles.summaryDivider}></div>
                            <div style={styles.summaryTotal}>
                                <span>Total Amount</span>
                                <span style={styles.totalAmount}>
                                    Rs.{(parseFloat(booking.amount.replace('Rs', '2300')) + 0 + 0).toFixed(2)}
                                </span>
                            </div>
                            <div style={styles.features}>
                                <div style={styles.feature}>
                                    <div style={styles.featureIcon}>✓</div>
                                    <span>100% Secure Payment</span>
                                </div>
                                <div style={styles.feature}>
                                    <div style={styles.featureIcon}>✓</div>
                                    <span>Money-Back Guarantee</span>
                                </div>
                                <div style={styles.feature}>
                                    <div style={styles.featureIcon}>✓</div>
                                    <span>24/7 Customer Support</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    header: {
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: '#f1f5f9',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: '500',
        color: '#475569',
        fontSize: '14px',
        transition: 'all 0.2s ease',
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    logoIcon: {
        width: '40px',
        height: '40px',
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontSize: '20px',
        fontWeight: '700',
    },
    logoText: {
        fontSize: '20px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '48px 32px',
    },
    content: {
        display: 'flex',
        gap: '48px',
        alignItems: 'flex-start',
    },
    leftColumn: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: '32px',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '32px',
    },
    title: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#0f172a',
        margin: 0,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },
    serviceInfo: {
        backgroundColor: '#f8fafc',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
    },
    serviceInfoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '12px',
        fontSize: '14px',
        color: '#475569',
    },
    serviceInfoValue: {
        fontWeight: '600',
        color: '#0f172a',
    },
    amount: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#3b82f6',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    formRow: {
        display: 'flex',
        gap: '16px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#334155',
    },
    input: {
        padding: '14px 16px',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        fontSize: '16px',
        fontFamily: 'inherit',
        transition: 'all 0.2s ease',
        outline: 'none',
    },
    submitButton: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: '#fff',
        padding: '16px',
        borderRadius: '12px',
        border: 'none',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
        marginTop: '8px',
    },
    securityNote: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '12px',
        color: '#64748b',
        marginTop: '12px',
    },
    rightColumn: {
        width: '350px',
    },
    summaryCard: {
        backgroundColor: '#ffffff',
        padding: '32px',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
    },
    summaryTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: '24px',
    },
    summaryItem: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '16px',
        color: '#64748b',
        fontSize: '14px',
    },
    summaryDivider: {
        height: '1px',
        backgroundColor: '#e2e8f0',
        margin: '20px 0',
    },
    summaryTotal: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
    },
    totalAmount: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#3b82f6',
    },
    features: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    feature: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        color: '#475569',
    },
    featureIcon: {
        width: '24px',
        height: '24px',
        backgroundColor: '#dbeafe',
        color: '#1e40af',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: '600',
    },
};

export default PaymentPage;