import React, { useEffect, useMemo, useState, useContext } from 'react';
import { ArrowLeft, CreditCard, Lock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getPayhereHash } from '../api/payment';

const PaymentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPayhereReady, setIsPayhereReady] = useState(false);
    const { user } = useContext(AuthContext);

    // Get booking details from navigation state or default
    const booking = location.state?.booking || {
        orderId: 'order_001',
        provider: 'Provider',
        providerUserId: null,
        service: 'Service',
        amount: 'Rs.0.00',
        date: 'N/A'
    };

    const amountValue = useMemo(() => {
        if (typeof booking.amountValue === 'number') return booking.amountValue;
        if (typeof booking.amount === 'number') return booking.amount;
        const cleaned = String(booking.amount || '').replace(/[^0-9.]/g, '');
        return Number(cleaned || 0);
    }, [booking.amount, booking.amountValue]);

    const customerName = user?.name || 'Customer';
    const [firstName, ...restName] = customerName.split(' ');
    const lastName = restName.join(' ') || 'Customer';

    useEffect(() => {
        const setupPayhereHandlers = () => {
            if (!window.payhere) return;

            window.payhere.onCompleted = function onCompleted(orderId) {
                alert(`Payment completed. Order: ${orderId}`);
                navigate('/customer-dashboard', { state: { paymentSuccess: true } });
            };

            window.payhere.onDismissed = function onDismissed() {
                alert('Payment dismissed');
            };

            window.payhere.onError = function onError(error) {
                alert(`Payment error: ${error}`);
            };
        };

        if (window.payhere) {
            setIsPayhereReady(true);
            setupPayhereHandlers();
            return;
        }

        const scriptUrls = [
            'https://www.payhere.lk/lib/payhere.js',
            'https://sandbox.payhere.lk/lib/payhere.js'
        ];

        let currentIndex = 0;

        const loadNext = () => {
            if (currentIndex >= scriptUrls.length) {
                setIsPayhereReady(false);
                return;
            }

            const script = document.createElement('script');
            script.src = scriptUrls[currentIndex];
            script.async = true;
            script.onload = () => {
                setIsPayhereReady(Boolean(window.payhere));
                setupPayhereHandlers();
            };
            script.onerror = () => {
                currentIndex += 1;
                loadNext();
            };
            document.body.appendChild(script);
        };

        loadNext();
    }, [navigate]);

    const handlePayNow = async () => {
        try {
            setIsProcessing(true);

            if (!window.payhere) {
                alert('Payment system is still loading. Please try again in a moment.');
                return;
            }

            const orderId = booking.orderId || booking.id || 'order_001';
            const currency = 'LKR';

            const { merchant_id, hash, notify_url } = await getPayhereHash({
                order_id: orderId,
                amount: amountValue.toFixed(2),
                currency
            });

            const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const payment = {
                sandbox: true,
                merchant_id,
                return_url: `${window.location.origin}/customer-dashboard`,
                cancel_url: `${window.location.origin}/customer-dashboard`,
                notify_url: notify_url || `${apiBaseUrl}/api/payment/notify`,
                order_id: orderId,
                items: booking.service,
                amount: amountValue.toFixed(2),
                currency,
                hash,
                first_name: firstName,
                last_name: lastName,
                email: user?.email || 'customer@example.com',
                phone: user?.phone || '',
                address: booking.location || 'N/A',
                city: booking.location || 'N/A',
                country: 'Sri Lanka',
                custom_1: user?.id || '',
                custom_2: booking.providerUserId || ''
            };

            window.payhere.startPayment(payment);
        } catch (error) {
            console.error('Payment error:', error);
            alert('Failed to start payment');
        } finally {
            setIsProcessing(false);
        }
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

                        <div style={styles.form}>
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
                                    <span style={styles.amount}>Rs.{amountValue.toFixed(2)}</span>
                                </div>
                            </div>

                            <button type="button" onClick={handlePayNow} style={styles.submitButton} disabled={isProcessing || !isPayhereReady}>
                                {isProcessing ? 'Processing...' : `Pay Rs.${amountValue.toFixed(2)}`}
                                <Lock size={16} />
                            </button>
                            {!isPayhereReady && (
                                <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b' }}>
                                    Loading payment system...
                                </div>
                            )}

                            <div style={styles.securityNote}>
                                <Lock size={14} color="#64748b" />
                                <span>Your payment is secured with 256-bit SSL encryption</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Summary */}
                    <div style={styles.rightColumn}>
                        <div style={styles.summaryCard}>
                            <h2 style={styles.summaryTitle}>Order Summary</h2>
                            <div style={styles.summaryItem}>
                                <span>Service Fee</span>
                                <span>Rs.{amountValue.toFixed(2)}</span>
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
                                    Rs.{amountValue.toFixed(2)}
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