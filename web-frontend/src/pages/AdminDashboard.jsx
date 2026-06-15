import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import {
  SETTLEMENT_TYPES,
  calculateSettlement,
  formatLkr,
  getPaymentBreakdown,
  getPaymentStatusLabel,
  getSettlementTypeLabel,
  isPaymentSettled,
} from '../utils/paymentHelpers';
import AdminOverviewCharts from '../components/admin/AdminOverviewCharts';
import '../components/admin/AdminDashboard.css';

export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    totalTransactions: 0,
    totalCommissionEarned: 0,
    totalReleasedPayments: 0,
    totalPendingPayments: 0,
    totalRefundedAmount: 0,
    totalPartialSettlements: 0,
  });
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankDetails, setBankDetails] = useState(null);
  const [bankUser, setBankUser] = useState(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [nicModalOpen, setNicModalOpen] = useState(false);
  const [nicProvider, setNicProvider] = useState(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolveSettlementType, setResolveSettlementType] = useState(SETTLEMENT_TYPES.FULL_RELEASE);
  const [resolveSettlementAmount, setResolveSettlementAmount] = useState('');
  const [resolveSubmitting, setResolveSubmitting] = useState(false);

  const getProviderDisplayName = (provider) => {
    const fullName = [provider?.firstName, provider?.lastName].filter(Boolean).join(' ').trim();
    return fullName || provider?.name || '-';
  };

  const isPdfDocument = (doc) => {
    if (!doc || typeof doc !== 'string') return false;
    return doc.startsWith('data:application/pdf') || doc.toLowerCase().includes('.pdf');
  };

  const openNicModal = (provider) => {
    setNicProvider(provider);
    setNicModalOpen(true);
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin-login');
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [uRes, pRes, payRes, statsRes, cRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/provider-requests'),
        api.get('/admin/payments'),
        api.get('/admin/payments/stats'),
        api.get('/admin/complaints')
      ]);

      setUsers(uRes.data || []);
      setProviders(pRes.data || []);
      setPayments(payRes.data || []);
      setPaymentStats(statsRes.data || {
        totalTransactions: 0,
        totalCommissionEarned: 0,
        totalReleasedPayments: 0,
        totalPendingPayments: 0,
      });
      setComplaints(cRes.data || []);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  const approveProvider = async (id) => {
    try {
      await api.post(`/admin/provider-requests/${id}/approve`);
      setProviders((prev) => prev.map((p) => (p._id === id ? { ...p, status: 'approved', approvedAt: new Date().toISOString() } : p)));
    } catch (err) {
      setError('Failed to approve provider');
    }
  };

  const rejectProvider = async (id) => {
    try {
      await api.post(`/admin/provider-requests/${id}/reject`);
      setProviders((prev) => prev.map((p) => (p._id === id ? { ...p, status: 'rejected', rejectedAt: new Date().toISOString() } : p)));
    } catch (err) {
      setError('Failed to reject provider');
    }
  };

  const approvePayment = async (id) => {
    try {
      const response = await api.post(`/admin/payments/${id}/approve`);
      const releasedPayment = response.data?.payment;
      setPayments((prev) => prev.map((p) => (
        p._id === id ? { ...p, ...releasedPayment } : p
      )));
      const statsRes = await api.get('/admin/payments/stats');
      setPaymentStats(statsRes.data || paymentStats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to release payment');
    }
  };

  const getPaymentForComplaint = (complaint) => {
    if (!complaint?.serviceRequestId) return null;
    const serviceRequestId = complaint.serviceRequestId._id || complaint.serviceRequestId;
    return payments.find((p) => String(p.serviceRequestId?._id || p.serviceRequestId) === String(serviceRequestId));
  };

  const openResolveModal = (complaint) => {
    setResolveTarget(complaint);
    setResolveSettlementType(SETTLEMENT_TYPES.FULL_RELEASE);
    const linkedPayment = getPaymentForComplaint(complaint);
    const total = linkedPayment?.serviceAmount ?? linkedPayment?.amount ?? 0;
    setResolveSettlementAmount(total ? String(Math.round(total * 0.6)) : '');
    setResolveModalOpen(true);
  };

  const resolveComplaint = async () => {
    if (!resolveTarget) return;
    setResolveSubmitting(true);
    setError('');
    try {
      const payload = { settlementType: resolveSettlementType };
      if (resolveSettlementType === SETTLEMENT_TYPES.PARTIAL_RELEASE) {
        payload.settlementAmount = Number(resolveSettlementAmount);
      }
      const response = await api.post(`/admin/complaints/${resolveTarget._id}/resolve`, payload);
      const updated = response.data?.complaint;
      setComplaints((prev) => prev.map((c) => (c._id === resolveTarget._id ? { ...c, ...updated } : c)));
      setResolveModalOpen(false);
      setResolveTarget(null);
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve complaint');
    } finally {
      setResolveSubmitting(false);
    }
  };

  const openBankDetails = async (userItem) => {
    setBankUser(userItem);
    setBankDetails(null);
    setBankModalOpen(true);
    setBankLoading(true);
    try {
      const response = await api.get(`/admin/users/${userItem._id}/bank-details`);
      setBankDetails(response.data || null);
    } catch (err) {
      setBankDetails({ hasDetails: false });
    } finally {
      setBankLoading(false);
    }
  };

  const Badge = ({ children, variant = 'default' }) => {
    const badgeColors = {
      pending: { bg: '#fee2e2', text: '#991b1b' },
      approved: { bg: '#d1fae5', text: '#065f46' },
      rejected: { bg: '#fee2e2', text: '#991b1b' },
      open: { bg: '#dbeafe', text: '#1e40af' },
      resolved: { bg: '#d1fae5', text: '#065f46' },
      default: { bg: '#e5e7eb', text: '#374151' }
    };
    const colors = badgeColors[variant] || badgeColors.default;

    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: colors.bg,
        color: colors.text
      }}>
        {children}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading dashboard...</p>
      </div>
    );
  }

  const pendingProviders = providers.filter(p => p.status === 'pending').length;
  const pendingPayments = paymentStats.totalPendingPayments
    || payments.filter((p) => p.payoutStatus === 'hold' && p.status === 'pending').length;
  const openComplaints = complaints.filter(c => c.status === 'open').length;

  const resolveLinkedPayment = resolveTarget ? getPaymentForComplaint(resolveTarget) : null;
  const resolveTotalAmount = Number(resolveLinkedPayment?.serviceAmount ?? resolveLinkedPayment?.amount ?? 0);
  const resolvePreview = resolveTotalAmount > 0
    ? calculateSettlement({
      totalAmount: resolveTotalAmount,
      settlementType: resolveSettlementType,
      settlementAmountInput: resolveSettlementType === SETTLEMENT_TYPES.PARTIAL_RELEASE
        ? Number(resolveSettlementAmount)
        : null,
      commissionRatePercent: resolveLinkedPayment?.commissionRate ?? 5,
    })
    : null;

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarContent}>
          <div style={styles.brandSection}>
            <h2 style={styles.brand}>HireRight</h2>
            <p style={styles.brandSubtitle}>Admin Portal</p>
          </div>

          <nav style={styles.nav}>
            <button
              style={{ ...styles.navLink, ...(activeTab === 'overview' ? styles.navLinkActive : {}) }}
              onClick={() => setActiveTab('overview')}
            >
              <svg style={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Overview
            </button>
            <button
              style={{ ...styles.navLink, ...(activeTab === 'users' ? styles.navLinkActive : {}) }}
              onClick={() => setActiveTab('users')}
            >
              <svg style={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Users
              <span style={styles.badge}>{users.length}</span>
            </button>
            <button
              style={{ ...styles.navLink, ...(activeTab === 'providers' ? styles.navLinkActive : {}) }}
              onClick={() => setActiveTab('providers')}
            >
              <svg style={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Provider Requests
              {pendingProviders > 0 && <span style={styles.badgeAlert}>{pendingProviders}</span>}
            </button>
            <button
              style={{ ...styles.navLink, ...(activeTab === 'payments' ? styles.navLinkActive : {}) }}
              onClick={() => setActiveTab('payments')}
            >
              <svg style={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Payments
              {pendingPayments > 0 && <span style={styles.badgeAlert}>{pendingPayments}</span>}
            </button>
            <button
              style={{ ...styles.navLink, ...(activeTab === 'complaints' ? styles.navLinkActive : {}) }}
              onClick={() => setActiveTab('complaints')}
            >
              <svg style={styles.navIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Complaints
              {openComplaints > 0 && <span style={styles.badgeAlert}>{openComplaints}</span>}
            </button>
          </nav>

          <div style={styles.adminUser}>
            <div style={styles.adminAvatar}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={styles.adminInfo}>
              <div style={styles.adminName}>{user?.name}</div>
              <div style={styles.adminEmail}>{user?.email}</div>
            </div>
            <button style={styles.logoutBtn} onClick={handleLogout}>
              <svg style={styles.logoutIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.content}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'users' && 'Registered Users'}
              {activeTab === 'providers' && 'Service Provider Requests'}
              {activeTab === 'payments' && 'Payment Approvals'}
              {activeTab === 'complaints' && 'Complaints & Reports'}
            </h1>
            <p style={styles.pageSubtitle}>
              {activeTab === 'overview'
                ? 'Platform analytics, revenue insights, and quick actions'
                : 'Manage your platform from here'}
            </p>
          </div>
          <button style={styles.refreshBtn} onClick={loadAll}>
            Refresh
          </button>
        </header>

        {error && (
          <div style={styles.errorBox}>
            <svg style={styles.errorIcon} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
            <button style={styles.errorClose} onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <AdminOverviewCharts
            users={users}
            providers={providers}
            payments={payments}
            paymentStats={paymentStats}
            complaints={complaints}
            pendingProviders={pendingProviders}
            pendingPayments={pendingPayments}
            openComplaints={openComplaints}
            onNavigate={setActiveTab}
          />
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>All Registered Users</h3>
              <div style={styles.cardSubtitle}>{users.length} total users</div>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Photo</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>District</th>
                    <th style={styles.th}>Postal Code</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={styles.emptyCell}>No users found</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u._id} style={styles.tableRow}>
                        <td style={styles.td}>
                          {u.profilePhoto ? (
                            <img
                              src={u.profilePhoto}
                              alt={u.name || 'User'}
                              style={styles.userPhoto}
                            />
                          ) : (
                            <div style={styles.miniAvatar}>{u.name?.charAt(0).toUpperCase()}</div>
                          )}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.userCell}>
                            <div style={styles.miniAvatar}>{u.name?.charAt(0).toUpperCase()}</div>
                            {u.name}
                          </div>
                        </td>
                        <td style={styles.td}>{u.email}</td>
                        <td style={styles.td}>{u.phone}</td>
                        <td style={styles.td}>{u.district || '-'}</td>
                        <td style={styles.td}>{u.postalCode || '-'}</td>
                        <td style={styles.td}>
                          <Badge variant={u.role === 'admin' ? 'approved' : 'default'}>
                            {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </Badge>
                        </td>
                        <td style={styles.td}>
                          <button
                            style={styles.btnSecondary}
                            onClick={() => openBankDetails(u)}
                          >
                            Bank Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Providers Tab */}
        {activeTab === 'providers' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Service Provider Requests</h3>
              <div style={styles.cardSubtitle}>{pendingProviders} pending</div>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Service</th>
                    <th style={styles.th}>Location</th>
                    <th style={styles.th}>Experience</th>
                    <th style={styles.th}>Rate</th>
                    <th style={styles.th}>NIC</th>
                    <th style={styles.th}>Verification</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.length === 0 ? (
                    <tr>
                      <td colSpan="11" style={styles.emptyCell}>No provider requests</td>
                    </tr>
                  ) : (
                    providers.map((p) => (
                      <tr
                        key={p._id}
                        style={{
                          ...styles.tableRow,
                          ...(p.status === 'pending' ? styles.tableRowPending : {})
                        }}
                      >
                        <td style={styles.td}>
                          <div style={styles.userCell}>
                            <div style={{
                              ...styles.miniAvatar,
                              ...(p.status === 'pending' ? styles.miniAvatarPending : {})
                            }}>
                              {getProviderDisplayName(p).charAt(0).toUpperCase()}
                            </div>
                            <span style={p.status === 'pending' ? styles.pendingText : undefined}>
                              {getProviderDisplayName(p)}
                            </span>
                          </div>
                        </td>
                        <td style={{ ...styles.td, ...(p.status === 'pending' ? styles.pendingCell : {}) }}>{p.email}</td>
                        <td style={{ ...styles.td, ...(p.status === 'pending' ? styles.pendingCell : {}) }}>{p.phone || '-'}</td>
                        <td style={{ ...styles.td, ...(p.status === 'pending' ? styles.pendingCell : {}) }}>{p.serviceCategory || '-'}</td>
                        <td style={{ ...styles.td, ...(p.status === 'pending' ? styles.pendingCell : {}) }}>{[p.city, p.district].filter(Boolean).join(', ') || '-'}</td>
                        <td style={{ ...styles.td, ...(p.status === 'pending' ? styles.pendingCell : {}) }}>{p.yearsOfExperience ?? '-'} years</td>
                        <td style={{ ...styles.td, ...(p.status === 'pending' ? styles.pendingCell : {}) }}>Rs. {p.hourlyRate ?? '-'}</td>
                        <td style={{ ...styles.td, ...(p.status === 'pending' ? styles.pendingCell : {}) }}>
                          {p.nicNumber || '-'}
                        </td>
                        <td style={{ ...styles.td, ...(p.status === 'pending' ? styles.pendingCell : {}) }}>
                          {p.idDocument ? (
                            <button type="button" style={styles.btnCheckNic} onClick={() => openNicModal(p)}>
                              Check NIC
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td style={styles.td}>
                          <Badge variant={p.status}>{p.status === 'pending' ? 'Pending' : p.status}</Badge>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionButtons}>
                            {p.status === 'pending' ? (
                              <>
                                <button style={styles.btnApprove} onClick={() => approveProvider(p._id)}>
                                  <svg style={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Approve
                                </button>
                                <button style={styles.btnReject} onClick={() => rejectProvider(p._id)}>
                                  <svg style={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span style={styles.emptyCell}>{p.status}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Payment Approvals</h3>
              <div style={styles.cardSubtitle}>{pendingPayments} pending</div>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>From</th>
                    <th style={styles.th}>To</th>
                    <th style={styles.th}>Original Amount</th>
                    <th style={styles.th}>Settlement</th>
                    <th style={styles.th}>Commission</th>
                    <th style={styles.th}>Provider</th>
                    <th style={styles.th}>Refund</th>
                    <th style={styles.th}>Task Completion</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Release Date</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="11" style={styles.emptyCell}>No payment records</td>
                    </tr>
                  ) : (
                    payments.map((p) => {
                      const breakdown = getPaymentBreakdown(p);
                      const linkedComplaint = complaints.find((c) => {
                        const srId = p.serviceRequestId?._id || p.serviceRequestId;
                        const cSrId = c.serviceRequestId?._id || c.serviceRequestId;
                        return srId && cSrId && String(srId) === String(cSrId);
                      });
                      const pendingSettlement = !isPaymentSettled(p)
                        && linkedComplaint?.status === 'resolved'
                        && linkedComplaint?.settlementType;
                      const displayBreakdown = pendingSettlement
                        ? calculateSettlement({
                          totalAmount: breakdown.serviceAmount,
                          settlementType: linkedComplaint.settlementType,
                          settlementAmountInput: linkedComplaint.settlementAmount,
                          commissionRatePercent: breakdown.commissionRate,
                        })
                        : breakdown;
                      const isReadyForApproval = p.serviceRequestId
                        ? (p.serviceRequestId.customerCompleted && p.serviceRequestId.providerCompleted)
                        : true;
                      const statusLabel = getPaymentStatusLabel(p);
                      const isSettled = isPaymentSettled(p);

                      return (
                        <tr key={p._id} style={styles.tableRow}>
                          <td style={styles.td}>
                            {p.userId?.name
                              || p.serviceRequestId?.userId?.name
                              || '-'}
                          </td>
                          <td style={styles.td}>
                            {(() => {
                              const provider = p.providerId;
                              const providerName = provider
                                ? `${provider.firstName || ''} ${provider.lastName || ''}`.trim()
                                : '';
                              if (providerName) return providerName;
                              const fallbackUser = p.serviceRequestId?.providerId;
                              if (fallbackUser?.name) return fallbackUser.name;
                              return '-';
                            })()}
                          </td>
                          <td style={styles.td}>
                            <span style={styles.amountText}>{formatLkr(displayBreakdown.serviceAmount)}</span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ fontSize: '13px' }}>
                              {getSettlementTypeLabel(displayBreakdown.settlementType || SETTLEMENT_TYPES.FULL_RELEASE)}
                              {displayBreakdown.settlementType === SETTLEMENT_TYPES.PARTIAL_RELEASE && (
                                <div style={{ color: '#64748b', marginTop: '4px' }}>
                                  {formatLkr(displayBreakdown.settlementAmount)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: '#0d9488', fontWeight: '600' }}>
                              {formatLkr(displayBreakdown.commissionAmount)}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: '#16a34a', fontWeight: '600' }}>
                              {formatLkr(displayBreakdown.providerAmount)}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: displayBreakdown.refundAmount > 0 ? '#dc2626' : '#94a3b8', fontWeight: '600' }}>
                              {displayBreakdown.refundAmount > 0 ? formatLkr(displayBreakdown.refundAmount) : '—'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {p.serviceRequestId ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                  <span style={{ color: '#64748b', minWidth: '70px', fontWeight: '500' }}>Receiver:</span>
                                  <Badge variant={p.serviceRequestId.customerCompleted ? 'approved' : 'pending'}>
                                    {p.serviceRequestId.customerCompleted ? 'Completed' : 'Pending'}
                                  </Badge>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                  <span style={{ color: '#64748b', minWidth: '70px', fontWeight: '500' }}>Provider:</span>
                                  <Badge variant={p.serviceRequestId.providerCompleted ? 'approved' : 'pending'}>
                                    {p.serviceRequestId.providerCompleted ? 'Completed' : 'Pending'}
                                  </Badge>
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>N/A</span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <Badge variant={isSettled ? 'approved' : p.status}>{statusLabel}</Badge>
                          </td>
                          <td style={styles.td}>
                            {p.releasedAt
                              ? new Date(p.releasedAt).toLocaleString()
                              : <span style={{ color: '#94a3b8' }}>—</span>}
                          </td>
                          <td style={styles.td}>
                            {!isSettled && (
                              <button
                                style={{
                                  ...styles.btnApprove,
                                  ...(!isReadyForApproval ? { opacity: 0.5, cursor: 'not-allowed', background: '#94a3b8' } : {})
                                }}
                                disabled={!isReadyForApproval}
                                onClick={() => {
                                  if (!isReadyForApproval) {
                                    alert('Cannot release payment. Both the Service Receiver and Provider must mark the task as completed first.');
                                    return;
                                  }
                                  approvePayment(p._id);
                                }}
                              >
                                <svg style={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Release Payment
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Complaints Tab */}
        {activeTab === 'complaints' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Complaints & Reports</h3>
              <div style={styles.cardSubtitle}>{openComplaints} open</div>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>From</th>
                    <th style={styles.th}>Provider</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Message</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Settlement</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={styles.emptyCell}>No complaints</td>
                    </tr>
                  ) : (
                    complaints.map((c) => (
                      <tr key={c._id} style={styles.tableRow}>
                        <td style={styles.td}>{c.userId?.name || '-'}</td>
                        <td style={styles.td}>{c.providerName || '-'}</td>
                        <td style={styles.td}>{c.providerPhone || '-'}</td>
                        <td style={styles.td}>
                          <div style={styles.subjectCell}>{c.subject}</div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.messageCell}>{c.message}</div>
                        </td>
                        <td style={styles.td}>
                          <Badge variant={c.status}>{c.status}</Badge>
                        </td>
                        <td style={styles.td}>
                          {c.settlementType ? (
                            <span style={{ fontSize: '13px', fontWeight: '600' }}>
                              {getSettlementTypeLabel(c.settlementType)}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          {c.status === 'open' && (
                            <button style={styles.btnResolve} onClick={() => openResolveModal(c)}>
                              <svg style={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {resolveModalOpen && resolveTarget && (
          <div style={styles.modalOverlay} onClick={() => setResolveModalOpen(false)}>
            <div
              style={{ ...styles.modalCard, maxWidth: '560px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={styles.modalTitle}>Resolve Complaint</h3>
                  <p style={styles.modalSubtitle}>{resolveTarget.subject}</p>
                </div>
                <button style={styles.modalClose} onClick={() => setResolveModalOpen(false)}>×</button>
              </div>

              <div style={styles.modalBodyScrollable}>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                  {resolveTarget.message}
                </p>

                {resolveTotalAmount > 0 && (
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    fontSize: '14px',
                  }}>
                    <strong>Original Payment:</strong> {formatLkr(resolveTotalAmount)}
                  </div>
                )}

                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#1e293b' }}>
                  Settlement Decision
                </h4>

                <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                  {[
                    { value: SETTLEMENT_TYPES.FULL_RELEASE, label: 'Full Release', desc: 'Release full payment to provider (5% commission)' },
                    { value: SETTLEMENT_TYPES.PARTIAL_RELEASE, label: 'Partial Release', desc: 'Provider receives partial amount; remainder refunded' },
                    { value: SETTLEMENT_TYPES.FULL_REFUND, label: 'Full Refund', desc: 'Refund entire payment to customer' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        padding: '12px',
                        border: `2px solid ${resolveSettlementType === option.value ? '#2563eb' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: resolveSettlementType === option.value ? '#eff6ff' : '#fff',
                      }}
                    >
                      <input
                        type="radio"
                        name="settlementType"
                        value={option.value}
                        checked={resolveSettlementType === option.value}
                        onChange={() => setResolveSettlementType(option.value)}
                        style={{ marginTop: '3px' }}
                      />
                      <span>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{option.label}</div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{option.desc}</div>
                      </span>
                    </label>
                  ))}
                </div>

                {resolveSettlementType === SETTLEMENT_TYPES.PARTIAL_RELEASE && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                      Settlement Amount (provider share before commission)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={resolveTotalAmount || undefined}
                      step="0.01"
                      value={resolveSettlementAmount}
                      onChange={(e) => setResolveSettlementAmount(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '15px',
                      }}
                    />
                  </div>
                )}

                {resolvePreview && (
                  <div style={{
                    background: '#ecfdf5',
                    border: '1px solid #86efac',
                    borderRadius: '8px',
                    padding: '14px',
                    marginBottom: '16px',
                  }}>
                    <div style={{ fontWeight: '700', marginBottom: '10px', color: '#166534' }}>Settlement Preview</div>
                    <div style={{ display: 'grid', gap: '6px', fontSize: '14px', color: '#14532d' }}>
                      <div>Commission (5%): <strong>{formatLkr(resolvePreview.commissionAmount)}</strong></div>
                      <div>Provider Receives: <strong>{formatLkr(resolvePreview.providerAmount)}</strong></div>
                      <div>Customer Refund: <strong>{formatLkr(resolvePreview.refundAmount)}</strong></div>
                    </div>
                  </div>
                )}

                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: 0 }}>
                  After resolving, a 48-hour window allows the customer to reopen the complaint before payment settlement.
                </p>
              </div>

              <div style={styles.modalFooter}>
                <button
                  style={{
                    ...styles.btnResolve,
                    width: '100%',
                    justifyContent: 'center',
                    opacity: resolveSubmitting ? 0.7 : 1,
                  }}
                  disabled={resolveSubmitting}
                  onClick={resolveComplaint}
                >
                  {resolveSubmitting ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </div>
          </div>
        )}

        {nicModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalCard, maxWidth: '720px' }}>
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={styles.modalTitle}>NIC Verification</h3>
                  <p style={styles.modalSubtitle}>{getProviderDisplayName(nicProvider)}</p>
                </div>
                <button
                  style={styles.modalClose}
                  onClick={() => setNicModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>NIC Number</span>
                  <span style={styles.detailValue}>{nicProvider?.nicNumber || 'Not provided'}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Email</span>
                  <span style={styles.detailValue}>{nicProvider?.email || '-'}</span>
                </div>
                <div style={styles.detailDivider}></div>

                {nicProvider?.idDocument ? (
                  isPdfDocument(nicProvider.idDocument) ? (
                    <div>
                      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
                        NIC document uploaded as PDF
                      </p>
                      <iframe
                        title="NIC document"
                        src={nicProvider.idDocument}
                        style={styles.nicPreviewFrame}
                      />
                      <a
                        href={nicProvider.idDocument}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.nicOpenLink}
                      >
                        Open in new tab
                      </a>
                    </div>
                  ) : (
                    <img
                      src={nicProvider.idDocument}
                      alt="NIC document"
                      style={styles.nicPreviewImage}
                    />
                  )
                ) : (
                  <p style={{ color: '#94a3b8' }}>No NIC document uploaded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {bankModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={styles.modalTitle}>Bank Details</h3>
                  <p style={styles.modalSubtitle}>{bankUser?.name || 'User'}</p>
                </div>
                <button
                  style={styles.modalClose}
                  onClick={() => setBankModalOpen(false)}
                >
                  ×
                </button>
              </div>

              {bankLoading ? (
                <div style={styles.modalBody}>Loading...</div>
              ) : bankDetails?.hasDetails ? (
                <div style={styles.modalBody}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Account Holder</span>
                    <span style={styles.detailValue}>{bankDetails.bank?.accountHolderName || '-'}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Bank Name</span>
                    <span style={styles.detailValue}>{bankDetails.bank?.bankName || '-'}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Account Number</span>
                    <span style={styles.detailValue}>{bankDetails.bank?.accountNumber || '-'}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Branch</span>
                    <span style={styles.detailValue}>{bankDetails.bank?.branch || '-'}</span>
                  </div>
                  <div style={styles.detailDivider}></div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Email</span>
                    <span style={styles.detailValue}>{bankDetails.user?.email || '-'}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Phone</span>
                    <span style={styles.detailValue}>{bankDetails.user?.phone || '-'}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Address</span>
                    <span style={styles.detailValue}>{bankDetails.user?.address || '-'}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Postal Code</span>
                    <span style={styles.detailValue}>{bankDetails.user?.postalCode || '-'}</span>
                  </div>
                </div>
              ) : (
                <div style={styles.modalBody}>No bank details available.</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f1f5f9',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },

  // Sidebar Styles
  sidebar: {
    width: '280px',
    backgroundColor: '#0f172a',
    borderRight: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    boxShadow: '4px 0 24px rgba(15, 23, 42, 0.15)'
  },
  sidebarContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '24px 0'
  },
  brandSection: {
    padding: '0 24px',
    marginBottom: '32px',
    textAlign: 'center'
  },
  brandIcon: {
    width: '56px',
    height: '56px',
    margin: '0 auto 12px',
    backgroundColor: '#2563eb',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandSvg: {
    width: '28px',
    height: '28px',
    color: '#ffffff'
  },
  brand: {
    margin: '0 0 4px 0',
    fontSize: '24px',
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: '-0.5px'
  },
  brandSubtitle: {
    margin: 0,
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '500'
  },
  nav: {
    flex: 1,
    padding: '0 16px'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 16px',
    marginBottom: '4px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#94a3b8',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
    position: 'relative'
  },
  navLinkActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    color: '#60a5fa',
    fontWeight: '600'
  },
  navIcon: {
    width: '20px',
    height: '20px',
    flexShrink: 0
  },
  badge: {
    marginLeft: 'auto',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: '#e0e7ff',
    color: '#3b82f6',
    borderRadius: '10px'
  },
  badgeAlert: {
    marginLeft: 'auto',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '10px'
  },
  adminUser: {
    margin: '24px 24px 0',
    padding: '16px',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  adminAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
    flexShrink: 0
  },
  adminInfo: {
    flex: 1,
    minWidth: 0
  },
  adminName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  adminEmail: {
    fontSize: '12px',
    color: '#94a3b8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  logoutBtn: {
    width: '36px',
    height: '36px',
    padding: 0,
    backgroundColor: 'transparent',
    border: '1px solid #334155',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    flexShrink: 0
  },
  logoutIcon: {
    width: '18px',
    height: '18px',
    color: '#94a3b8'
  },

  // Content Styles
  content: {
    flex: 1,
    padding: '32px',
    overflowY: 'auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px'
  },
  pageTitle: {
    margin: '0 0 4px 0',
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: '-0.5px'
  },
  pageSubtitle: {
    margin: 0,
    fontSize: '15px',
    color: '#64748b'
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#ffffff',
    border: '1px solid #e0e7ff',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  refreshIcon: {
    width: '18px',
    height: '18px'
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '32px'
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '28px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 1px 3px rgba(37, 99, 235, 0.1)',
    border: '1px solid #f1f5f9',
    transition: 'all 0.3s'
  },
  statIconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  statIcon: {
    width: '28px',
    height: '28px',
    color: 'inherit'
  },
  statContent: {
    flex: 1
  },
  statTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
    marginTop: '4px'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: '1.2'
  },
  statSubtitle: {
    fontSize: '12px',
    color: '#94a3b8'
  },

  // Quick Actions
  quickActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '32px'
  },
  quickActionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '28px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    border: '1px solid #f1f5f9',
    position: 'relative',
    overflow: 'hidden'
  },
  quickActionTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b'
  },
  quickActionDesc: {
    margin: 0,
    fontSize: '14px',
    color: '#64748b'
  },
  quickActionArrow: {
    position: 'absolute',
    top: '28px',
    right: '28px',
    fontSize: '24px',
    color: '#cbd5e1',
    transition: 'all 0.3s'
  },

  // Card Styles
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(37, 99, 235, 0.1)',
    border: '1px solid #f1f5f9',
    overflow: 'hidden'
  },
  cardHeader: {
    padding: '28px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b'
  },
  cardSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500'
  },

  // Table Styles
  tableWrap: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '18px 28px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #f1f5f9'
  },
  td: {
    padding: '18px 28px',
    fontSize: '14px',
    color: '#334155',
    borderBottom: '1px solid #f1f5f9'
  },
  tableRow: {
    transition: 'background-color 0.2s'
  },
  tableRowPending: {
    backgroundColor: '#fef2f2',
    borderLeft: '4px solid #ef4444'
  },
  pendingText: {
    color: '#b91c1c',
    fontWeight: '600'
  },
  pendingCell: {
    color: '#991b1b'
  },
  miniAvatarPending: {
    backgroundColor: '#fee2e2',
    color: '#dc2626'
  },
  btnCheckNic: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid #93c5fd',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s, border-color 0.15s'
  },
  nicPreviewImage: {
    width: '100%',
    maxHeight: '420px',
    objectFit: 'contain',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc'
  },
  nicPreviewFrame: {
    width: '100%',
    height: '420px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    backgroundColor: '#f8fafc'
  },
  nicOpenLink: {
    display: 'inline-block',
    marginTop: '12px',
    color: '#2563eb',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none'
  },
  emptyCell: {
    padding: '60px 28px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '15px'
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  miniAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#dbeafe',
    color: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    flexShrink: 0
  },
  userPhoto: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    objectFit: 'cover',
    border: '1px solid #e2e8f0'
  },
  subjectCell: {
    fontWeight: '500',
    color: '#1e293b'
  },
  messageCell: {
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#64748b'
  },
  amountText: {
    fontWeight: '600',
    color: '#10b981',
    fontSize: '15px'
  },

  // Button Styles
  actionButtons: {
    display: 'flex',
    gap: '8px'
  },
  btnApprove: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  btnReject: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#ef4444',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  btnSecondary: {
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#1d4ed8',
    backgroundColor: '#e0f2fe',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    cursor: 'pointer'
  },
  btnResolve: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  btnIcon: {
    width: '16px',
    height: '16px'
  },

  // Error Box
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    marginBottom: '24px',
    color: '#dc2626',
    fontSize: '14px',
    position: 'relative'
  },
  errorIcon: {
    width: '20px',
    height: '20px',
    flexShrink: 0
  },
  errorClose: {
    marginLeft: 'auto',
    width: '24px',
    height: '24px',
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
    color: '#dc2626',
    fontSize: '20px',
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Loading Styles
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f4ff'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e0e7ff',
    borderTop: '4px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#64748b'
  },

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 999,
    padding: '24px 16px',
    overflowY: 'auto',
  },
  modalCard: {
    width: '90%',
    maxWidth: '520px',
    maxHeight: 'calc(100vh - 48px)',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    margin: 'auto 0',
    flexShrink: 0,
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b'
  },
  modalSubtitle: {
    margin: '4px 0 0',
    fontSize: '13px',
    color: '#64748b'
  },
  modalClose: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: '18px',
    color: '#64748b'
  },
  modalBody: {
    padding: '20px 24px',
    fontSize: '14px',
    color: '#475569'
  },
  modalBodyScrollable: {
    padding: '20px 24px',
    fontSize: '14px',
    color: '#475569',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
    WebkitOverflowScrolling: 'touch',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #f1f5f9',
    backgroundColor: '#ffffff',
    flexShrink: 0,
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '8px 0'
  },
  detailLabel: {
    fontWeight: '600',
    color: '#64748b'
  },
  detailValue: {
    fontWeight: '600',
    color: '#0f172a'
  },
  detailDivider: {
    height: '1px',
    backgroundColor: '#e2e8f0',
    margin: '12px 0'
  }
};

// Add hover styles via CSS
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }

  .statCard:hover {
    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.15) !important;
    transform: translateY(-2px);
  }

  .quickActionCard:hover {
    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.15) !important;
    border-color: #dbeafe !important;
    transform: translateY(-2px);
  }

  .quickActionCard:hover .quickActionArrow {
    color: #2563eb !important;
    transform: translateX(4px);
  }

  .navLink:hover {
    background-color: #f8fafc !important;
  }

  .logoutBtn:hover {
    background-color: #fee2e2 !important;
    border-color: #fecaca !important;
  }

  .logoutBtn:hover svg {
    color: #dc2626 !important;
  }

  .refreshBtn:hover {
    background-color: #dbeafe !important;
    border-color: #2563eb !important;
  }

  tbody tr:hover {
    background-color: #f8fafc !important;
  }

  .btnApprove:hover:not(:disabled) {
    background-color: #1d4ed8 !important;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }

  .btnReject:hover {
    background-color: #dc2626 !important;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }

  .btnResolve:hover {
    background-color: #1d4ed8 !important;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }
`;
document.head.appendChild(styleSheet);