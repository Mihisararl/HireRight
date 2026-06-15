import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatLkr } from '../../utils/paymentHelpers';
import './AdminDashboard.css';

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#6366f1'];
const BAR_COLORS = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444', open: '#2563eb', resolved: '#10b981' };

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('default', { month: 'short' }),
    });
  }
  return months;
}

const CurrencyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="admin-chart-tooltip">
      <p className="admin-chart-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: Rs. {Number(entry.value || 0).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const CountTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="admin-chart-tooltip">
      <p className="admin-chart-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="admin-chart-tooltip">
      <p>{name}: {value}</p>
    </div>
  );
};

function HeroKpi({ label, value, sublabel, gradient }) {
  return (
    <div className="admin-hero-kpi" style={{ background: gradient }}>
      <div className="admin-hero-kpi-label">{label}</div>
      <div className="admin-hero-kpi-value">{value}</div>
      {sublabel && <div className="admin-hero-kpi-sub">{sublabel}</div>}
    </div>
  );
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`admin-chart-card ${className}`}>
      <div className="admin-chart-card-header">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="admin-chart-card-body">{children}</div>
    </div>
  );
}

export default function AdminOverviewCharts({
  users,
  providers,
  payments,
  paymentStats,
  complaints,
  pendingProviders,
  pendingPayments,
  openComplaints,
  onNavigate,
}) {
  const analytics = useMemo(() => {
    const months = getLast6Months();
    const monthlyMap = Object.fromEntries(
      months.map((m) => [m.key, { name: m.label, commission: 0, payout: 0, transactions: 0 }])
    );

    payments.forEach((payment) => {
      const date = new Date(payment.releasedAt || payment.updatedAt || payment.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) return;

      monthlyMap[key].transactions += 1;
      if (payment.payoutStatus === 'paid') {
        monthlyMap[key].commission += Number(payment.commissionAmount || 0);
        monthlyMap[key].payout += Number(payment.providerAmount || 0);
      }
    });

    const paymentStatusData = [
      { name: 'Released', value: payments.filter((p) => p.payoutStatus === 'paid').length },
      { name: 'On Hold', value: payments.filter((p) => p.payoutStatus === 'hold').length },
      { name: 'Pending', value: payments.filter((p) => p.payoutStatus === 'pending').length },
      { name: 'Refunded', value: payments.filter((p) => p.payoutStatus === 'refunded').length },
    ].filter((item) => item.value > 0);

    const roleMap = {};
    users.forEach((user) => {
      const role = (user.role || 'other').replace(/^\w/, (c) => c.toUpperCase());
      roleMap[role] = (roleMap[role] || 0) + 1;
    });
    const userRoleData = Object.entries(roleMap).map(([name, value]) => ({ name, value }));

    const providerStatusData = [
      { name: 'Pending', value: providers.filter((p) => p.status === 'pending').length, fill: BAR_COLORS.pending },
      { name: 'Approved', value: providers.filter((p) => p.status === 'approved').length, fill: BAR_COLORS.approved },
      { name: 'Rejected', value: providers.filter((p) => p.status === 'rejected').length, fill: BAR_COLORS.rejected },
    ];

    const complaintData = [
      { name: 'Open', value: complaints.filter((c) => c.status === 'open').length, fill: BAR_COLORS.open },
      { name: 'Resolved', value: complaints.filter((c) => c.status !== 'open').length, fill: BAR_COLORS.resolved },
    ];

    const platformActivity = [
      { category: 'Providers', pending: providerStatusData[0].value, approved: providerStatusData[1].value, rejected: providerStatusData[2].value },
      { category: 'Complaints', open: complaintData[0].value, resolved: complaintData[1].value },
    ];

    const recentPayments = [...payments]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const actionItems = pendingProviders + pendingPayments + openComplaints;

    return {
      monthlyRevenue: months.map((m) => monthlyMap[m.key]),
      paymentStatusData,
      userRoleData,
      providerStatusData,
      complaintData,
      platformActivity,
      recentPayments,
      actionItems,
    };
  }, [users, providers, payments, complaints, pendingProviders, pendingPayments, openComplaints]);

  const hasRevenueData = analytics.monthlyRevenue.some(
    (m) => m.commission > 0 || m.payout > 0 || m.transactions > 0
  );

  return (
    <div className="admin-overview">
      <div className="admin-hero-grid">
        <HeroKpi
          label="Total Users"
          value={users.length}
          sublabel="Registered accounts"
          gradient="linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)"
        />
        <HeroKpi
          label="Platform Revenue"
          value={formatLkr(paymentStats.totalCommissionEarned)}
          sublabel="5% commission earned"
          gradient="linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)"
        />
        <HeroKpi
          label="Transactions"
          value={paymentStats.totalTransactions}
          sublabel={`${paymentStats.totalReleasedPayments} released`}
          gradient="linear-gradient(135deg, #4338ca 0%, #6366f1 100%)"
        />
        <HeroKpi
          label="Needs Attention"
          value={analytics.actionItems}
          sublabel={`${pendingProviders} providers · ${pendingPayments} payments · ${openComplaints} complaints`}
          gradient="linear-gradient(135deg, #b45309 0%, #f59e0b 100%)"
        />
      </div>

      <div className="admin-charts-row">
        <ChartCard title="Revenue Analytics" subtitle="Commission vs provider payouts (last 6 months)">
          {hasRevenueData ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={analytics.monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="commissionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="payoutGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CurrencyTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="commission" name="Commission" stroke="#2563eb" fill="url(#commissionGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="payout" name="Provider Payout" stroke="#10b981" fill="url(#payoutGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="admin-chart-empty">No released payment data yet</div>
          )}
        </ChartCard>

        <ChartCard title="Payment Status" subtitle="Distribution by payout status">
          {analytics.paymentStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={analytics.paymentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {analytics.paymentStatusData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="admin-chart-empty">No payments recorded</div>
          )}
        </ChartCard>
      </div>

      <div className="admin-charts-row">
        <ChartCard title="User Distribution" subtitle="Breakdown by role">
          {analytics.userRoleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.userRoleData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CountTooltip />} />
                <Bar dataKey="value" name="Users" radius={[8, 8, 0, 0]}>
                  {analytics.userRoleData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="admin-chart-empty">No users yet</div>
          )}
        </ChartCard>

        <ChartCard title="Provider Applications" subtitle="Registration request status">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics.providerStatusData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CountTooltip />} />
              <Bar dataKey="value" name="Count" radius={[8, 8, 0, 0]}>
                {analytics.providerStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="admin-metrics-strip">
        <div className="admin-metric-pill">
          <span className="admin-metric-pill-label">Released</span>
          <span className="admin-metric-pill-value">{paymentStats.totalReleasedPayments}</span>
        </div>
        <div className="admin-metric-pill">
          <span className="admin-metric-pill-label">Pending</span>
          <span className="admin-metric-pill-value">{paymentStats.totalPendingPayments}</span>
        </div>
        <div className="admin-metric-pill">
          <span className="admin-metric-pill-label">Refunded</span>
          <span className="admin-metric-pill-value">{formatLkr(paymentStats.totalRefundedAmount)}</span>
        </div>
        <div className="admin-metric-pill">
          <span className="admin-metric-pill-label">Partial Settlements</span>
          <span className="admin-metric-pill-value">{paymentStats.totalPartialSettlements}</span>
        </div>
        <div className="admin-metric-pill">
          <span className="admin-metric-pill-label">Open Complaints</span>
          <span className="admin-metric-pill-value">{openComplaints}</span>
        </div>
      </div>

      <div className="admin-charts-row admin-charts-row--wide">
        <ChartCard title="Complaint Overview" subtitle="Open vs resolved issues" className="admin-chart-card--compact">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.complaintData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CountTooltip />} />
              <Bar dataKey="value" name="Count" radius={[0, 8, 8, 0]} barSize={28}>
                {analytics.complaintData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Recent Transactions" subtitle="Latest payment activity" className="admin-chart-card--table">
          {analytics.recentPayments.length > 0 ? (
            <div className="admin-recent-table-wrap">
              <table className="admin-recent-table">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentPayments.map((payment) => (
                    <tr key={payment._id}>
                      <td>{formatLkr(payment.serviceAmount ?? payment.amount)}</td>
                      <td>
                        <span className={`admin-status-badge admin-status-badge--${payment.payoutStatus || 'pending'}`}>
                          {payment.payoutStatus || 'pending'}
                        </span>
                      </td>
                      <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-chart-empty">No transactions yet</div>
          )}
        </ChartCard>
      </div>

      <div className="admin-quick-actions">
        <button type="button" className="admin-quick-action admin-quick-action--blue" onClick={() => onNavigate('providers')}>
          <div className="admin-quick-action-icon">📋</div>
          <div>
            <h4>Provider Requests</h4>
            <p>{pendingProviders} pending approval{pendingProviders !== 1 ? 's' : ''}</p>
          </div>
          <span className="admin-quick-action-arrow">→</span>
        </button>
        <button type="button" className="admin-quick-action admin-quick-action--green" onClick={() => onNavigate('payments')}>
          <div className="admin-quick-action-icon">💳</div>
          <div>
            <h4>Payment Approvals</h4>
            <p>{pendingPayments} awaiting release</p>
          </div>
          <span className="admin-quick-action-arrow">→</span>
        </button>
        <button type="button" className="admin-quick-action admin-quick-action--red" onClick={() => onNavigate('complaints')}>
          <div className="admin-quick-action-icon">⚠️</div>
          <div>
            <h4>Complaints</h4>
            <p>{openComplaints} open issue{openComplaints !== 1 ? 's' : ''}</p>
          </div>
          <span className="admin-quick-action-arrow">→</span>
        </button>
      </div>
    </div>
  );
}
