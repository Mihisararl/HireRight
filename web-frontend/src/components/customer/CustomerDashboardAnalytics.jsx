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
import {
  Bell,
  CreditCard,
  FileText,
  MessageSquare,
  Star,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { isPendingCustomerConfirmation } from '../../utils/serviceAgreement';

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

const CountTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="customer-chart-tooltip">
      <p className="customer-chart-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

const CurrencyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="customer-chart-tooltip">
      <p className="customer-chart-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: Rs. {Number(entry.value || 0).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="customer-chart-tooltip">
      <p>{payload[0].name}: {payload[0].value}</p>
    </div>
  );
};

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="customer-chart-card">
      <div className="customer-chart-card-header">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="customer-chart-card-body">{children}</div>
    </div>
  );
}

function NotificationCard({ icon: Icon, title, description, count, variant, onClick, actionLabel }) {
  if (!count) return null;
  return (
    <button type="button" className={`customer-notif-card customer-notif-card--${variant}`} onClick={onClick}>
      <div className="customer-notif-card-icon">
        <Icon size={22} />
      </div>
      <div className="customer-notif-card-content">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <div className="customer-notif-card-meta">
        <span className="customer-notif-card-count">{count}</span>
        <span className="customer-notif-card-action">{actionLabel}</span>
      </div>
    </button>
  );
}

export default function CustomerDashboardAnalytics({
  t,
  serviceRequests,
  payments,
  complaints,
  reviews,
  bookings,
  completedCards,
  pendingOfferCount,
  onTabChange,
  onNavigate,
  onPaymentDueClick,
  onReviewClick,
  onComplaintClick,
}) {
  const analytics = useMemo(() => {
    const months = getLast6Months();
    const monthlyMap = Object.fromEntries(
      months.map((m) => [m.key, { name: m.label, requests: 0, spent: 0 }])
    );

    serviceRequests.forEach((request) => {
      const date = new Date(request.createdAt || request.preferredDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) monthlyMap[key].requests += 1;
    });

    payments.forEach((payment) => {
      const date = new Date(payment.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].spent += Number(payment.serviceAmount ?? payment.amount ?? 0);
      }
    });

    const requestPipeline = [
      { name: t('customer.analytics.pending'), value: serviceRequests.filter((r) => r.status === 'Pending').length, fill: '#f59e0b' },
      { name: t('customer.analytics.offers'), value: serviceRequests.filter((r) => r.status === 'OfferSent' || isPendingCustomerConfirmation(r)).length, fill: '#8b5cf6' },
      { name: t('customer.analytics.active'), value: serviceRequests.filter((r) => r.status === 'Accepted' || r.status === 'Confirmed').length, fill: '#2563eb' },
      { name: t('customer.analytics.completed'), value: serviceRequests.filter((r) => r.status === 'Completed').length, fill: '#10b981' },
      { name: t('customer.analytics.rejected'), value: serviceRequests.filter((r) => r.status === 'Rejected' || r.status === 'ProviderRejected').length, fill: '#ef4444' },
    ].filter((item) => item.value > 0);

    const paidRequestIds = new Set(payments.map((p) => String(p.serviceRequestId?._id || p.serviceRequestId)));
    const paymentDue = serviceRequests.filter((r) => (
      (r.status === 'Accepted' || r.status === 'Confirmed') && !paidRequestIds.has(String(r._id))
    )).length;

    const paymentStatus = [
      { name: t('customer.analytics.paymentDue'), value: paymentDue, fill: '#f59e0b' },
      { name: t('customer.analytics.onHold'), value: payments.filter((p) => p.payoutStatus === 'hold' || (p.status === 'pending' && p.payoutStatus !== 'paid')).length, fill: '#6366f1' },
      { name: t('customer.analytics.released'), value: payments.filter((p) => p.payoutStatus === 'paid').length, fill: '#10b981' },
      { name: t('customer.analytics.refunded'), value: payments.filter((p) => p.payoutStatus === 'refunded').length, fill: '#ef4444' },
    ].filter((item) => item.value > 0);

    const reviewedIds = new Set(reviews.map((r) => String(r.serviceRequestId)));
    const reviewsPending = completedCards.filter((c) => c.paymentReleased && !reviewedIds.has(String(c.id))).length;
    const openComplaints = complaints.filter((c) => c.status === 'open').length;
    const paymentsDueBookings = bookings.filter((b) => b.canPayNow).length;

    return {
      monthlyActivity: months.map((m) => monthlyMap[m.key]),
      requestPipeline,
      paymentStatus,
      reviewsPending,
      openComplaints,
      paymentsDueBookings,
      hasMonthlyData: months.some((m) => {
        const row = monthlyMap[m.key];
        return row.requests > 0 || row.spent > 0;
      }),
    };
  }, [serviceRequests, payments, complaints, reviews, completedCards, bookings, t]);

  const hasNotifications = (
    pendingOfferCount > 0
    || analytics.paymentsDueBookings > 0
    || analytics.openComplaints > 0
    || analytics.reviewsPending > 0
  );

  return (
    <div className="customer-analytics">
      <div className="customer-analytics-header">
        <div>
          <h2 className="customer-analytics-title">{t('customer.analytics.title')}</h2>
          <p className="customer-analytics-subtitle">{t('customer.analytics.subtitle')}</p>
        </div>
      </div>

      {hasNotifications && (
        <div className="customer-notif-grid">
          <NotificationCard
            icon={Bell}
            variant="orange"
            title={t('customer.analytics.notifOffersTitle')}
            description={t('customer.analytics.notifOffersDesc')}
            count={pendingOfferCount}
            actionLabel={t('customer.offers.viewOffers')}
            onClick={() => onTabChange('posts')}
          />
          <NotificationCard
            icon={CreditCard}
            variant="blue"
            title={t('customer.analytics.notifPaymentTitle')}
            description={t('customer.analytics.notifPaymentDesc')}
            count={analytics.paymentsDueBookings}
            actionLabel={t('customer.payNow')}
            onClick={onPaymentDueClick}
          />
          <NotificationCard
            icon={AlertCircle}
            variant="red"
            title={t('customer.analytics.notifComplaintTitle')}
            description={t('customer.analytics.notifComplaintDesc')}
            count={analytics.openComplaints}
            actionLabel={t('customer.reportIssue')}
            onClick={onComplaintClick || (() => onTabChange('active'))}
          />
          <NotificationCard
            icon={Star}
            variant="purple"
            title={t('customer.analytics.notifReviewTitle')}
            description={t('customer.analytics.notifReviewDesc')}
            count={analytics.reviewsPending}
            actionLabel={t('customer.analytics.leaveReview')}
            onClick={onReviewClick}
          />
        </div>
      )}

      <div className="customer-charts-grid">
        <ChartCard title={t('customer.analytics.requestPipeline')} subtitle={t('customer.analytics.requestPipelineDesc')}>
          {analytics.requestPipeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.requestPipeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CountTooltip />} />
                <Bar dataKey="value" name={t('customer.analytics.requests')} radius={[8, 8, 0, 0]}>
                  {analytics.requestPipeline.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="customer-chart-empty">{t('customer.analytics.noRequests')}</div>
          )}
        </ChartCard>

        <ChartCard title={t('customer.analytics.paymentOverview')} subtitle={t('customer.analytics.paymentOverviewDesc')}>
          {analytics.paymentStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={analytics.paymentStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {analytics.paymentStatus.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="customer-chart-empty">{t('customer.analytics.noPayments')}</div>
          )}
        </ChartCard>
      </div>

      <div className="customer-charts-grid">
        <ChartCard title={t('customer.analytics.monthlyRequests')} subtitle={t('customer.analytics.monthlyRequestsDesc')}>
          {analytics.hasMonthlyData ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analytics.monthlyActivity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CountTooltip />} />
                <Bar dataKey="requests" name={t('customer.analytics.posted')} fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="customer-chart-empty">{t('customer.analytics.noMonthlyData')}</div>
          )}
        </ChartCard>

        <ChartCard title={t('customer.analytics.spendingTrend')} subtitle={t('customer.analytics.spendingTrendDesc')}>
          {analytics.hasMonthlyData ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={analytics.monthlyActivity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="customerSpentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CurrencyTooltip />} />
                <Area type="monotone" dataKey="spent" name={t('customer.analytics.spent')} stroke="#10b981" fill="url(#customerSpentGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="customer-chart-empty">{t('customer.analytics.noSpending')}</div>
          )}
        </ChartCard>
      </div>

      <div className="customer-quick-insights">
        <button type="button" className="customer-insight-card" onClick={() => onTabChange('active')}>
          <Briefcase size={20} />
          <div>
            <span className="customer-insight-value">{bookings.length}</span>
            <span className="customer-insight-label">{t('customer.activeBookings')}</span>
          </div>
        </button>
        <button type="button" className="customer-insight-card" onClick={() => onTabChange('posts')}>
          <FileText size={20} />
          <div>
            <span className="customer-insight-value">{serviceRequests.filter((r) => r.status === 'Pending' || r.status === 'OfferSent').length}</span>
            <span className="customer-insight-label">{t('customer.analytics.openPosts')}</span>
          </div>
        </button>
        <button type="button" className="customer-insight-card" onClick={() => onTabChange('completed')}>
          <MessageSquare size={20} />
          <div>
            <span className="customer-insight-value">{completedCards.length}</span>
            <span className="customer-insight-label">{t('customer.completed')}</span>
          </div>
        </button>
        <button type="button" className="customer-insight-card customer-insight-card--action" onClick={() => onNavigate('/service-request')}>
          <span className="customer-insight-plus">+</span>
          <span className="customer-insight-label">{t('customer.newRequest')}</span>
        </button>
      </div>
    </div>
  );
}
