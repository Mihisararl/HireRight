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
  Briefcase,
  Calendar,
  DollarSign,
  Search,
  Star,
} from 'lucide-react';
import { formatLkr, getPaymentBreakdown } from '../../utils/paymentHelpers';

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
    <div className="provider-chart-tooltip">
      <p className="provider-chart-tooltip-label">{label}</p>
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
    <div className="provider-chart-tooltip">
      <p className="provider-chart-tooltip-label">{label}</p>
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
    <div className="provider-chart-tooltip">
      <p>{payload[0].name}: {payload[0].value}</p>
    </div>
  );
};

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="provider-chart-card">
      <div className="provider-chart-card-header">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="provider-chart-card-body">{children}</div>
    </div>
  );
}

function NotificationCard({ icon: Icon, title, description, count, variant, onClick, actionLabel }) {
  if (!count) return null;
  return (
    <button type="button" className={`provider-notif-card provider-notif-card--${variant}`} onClick={onClick}>
      <div className="provider-notif-card-icon">
        <Icon size={22} />
      </div>
      <div className="provider-notif-card-content">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <div className="provider-notif-card-meta">
        <span className="provider-notif-card-count">{count}</span>
        <span className="provider-notif-card-action">{actionLabel}</span>
      </div>
    </button>
  );
}

function HeroKpi({ label, value, sublabel, gradient, onClick }) {
  return (
    <button type="button" className="provider-hero-kpi" style={{ background: gradient }} onClick={onClick}>
      <div className="provider-hero-kpi-label">{label}</div>
      <div className="provider-hero-kpi-value">{value}</div>
      {sublabel && <div className="provider-hero-kpi-sub">{sublabel}</div>}
    </button>
  );
}

export default function ProviderDashboardAnalytics({
  t,
  availableRequests,
  bookingRequests,
  myRequests,
  upcomingRequests,
  historyRequests,
  payments,
  reviews,
  totalEarnings,
  averageRating,
  onSectionChange,
}) {
  const analytics = useMemo(() => {
    const months = getLast6Months();
    const monthlyMap = Object.fromEntries(
      months.map((m) => [m.key, { name: m.label, earnings: 0 }])
    );

    payments
      .filter((p) => p.payoutStatus === 'paid' && p.status === 'approved')
      .forEach((payment) => {
        const date = new Date(payment.releasedAt || payment.updatedAt || payment.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap[key]) return;
        const { providerAmount } = getPaymentBreakdown(payment);
        monthlyMap[key].earnings += providerAmount;
      });

    const jobPipeline = [
      { name: t('provider.analytics.available'), value: availableRequests.length, fill: '#2563eb' },
      { name: t('provider.analytics.bookings'), value: bookingRequests.length, fill: '#f59e0b' },
      { name: t('provider.analytics.upcoming'), value: upcomingRequests.length, fill: '#8b5cf6' },
      { name: t('provider.analytics.completed'), value: historyRequests.length, fill: '#10b981' },
    ].filter((item) => item.value > 0);

    const paymentStatus = [
      { name: t('provider.analytics.released'), value: payments.filter((p) => p.payoutStatus === 'paid').length, fill: '#10b981' },
      { name: t('provider.analytics.onHold'), value: payments.filter((p) => p.payoutStatus === 'hold' || (p.status === 'pending' && p.payoutStatus !== 'paid')).length, fill: '#6366f1' },
      { name: t('provider.analytics.pending'), value: payments.filter((p) => p.payoutStatus === 'pending').length, fill: '#f59e0b' },
    ].filter((item) => item.value > 0);

    const ratingBuckets = [1, 2, 3, 4, 5].map((rating) => ({
      name: `${rating}★`,
      value: reviews.filter((r) => r.rating === rating).length,
      fill: rating >= 4 ? '#10b981' : rating === 3 ? '#f59e0b' : '#ef4444',
    })).filter((b) => b.value > 0);

    const monthlyEarnings = months.map((m) => monthlyMap[m.key]);
    const hasEarningsData = monthlyEarnings.some((m) => m.earnings > 0);

    return { jobPipeline, paymentStatus, ratingBuckets, monthlyEarnings, hasEarningsData };
  }, [availableRequests, bookingRequests, upcomingRequests, historyRequests, payments, reviews, t]);

  const hasNotifications = (
    bookingRequests.length > 0
    || availableRequests.length > 0
    || upcomingRequests.length > 0
  );

  return (
    <div className="provider-analytics">
      <div className="provider-hero-grid">
        <HeroKpi
          label={t('provider.totalEarnings')}
          value={formatLkr(totalEarnings)}
          sublabel={t('provider.analytics.netPayouts')}
          gradient="linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)"
          onClick={() => onSectionChange('earnings')}
        />
        <HeroKpi
          label={t('provider.upcomingJobs')}
          value={upcomingRequests.length}
          sublabel={t('provider.analytics.activeJobs')}
          gradient="linear-gradient(135deg, #4338ca 0%, #6366f1 100%)"
          onClick={() => onSectionChange('upcoming')}
        />
        <HeroKpi
          label={t('provider.history')}
          value={historyRequests.length}
          sublabel={t('provider.analytics.jobsDone')}
          gradient="linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)"
          onClick={() => onSectionChange('history')}
        />
        <HeroKpi
          label={t('provider.reviews')}
          value={averageRating}
          sublabel={t('provider.analytics.avgRating', { count: reviews.length })}
          gradient="linear-gradient(135deg, #b45309 0%, #f59e0b 100%)"
          onClick={() => onSectionChange('reviews')}
        />
      </div>

      {hasNotifications && (
        <div className="provider-notif-grid">
          <NotificationCard
            icon={Briefcase}
            variant="orange"
            title={t('provider.analytics.notifBookingsTitle')}
            description={t('provider.analytics.notifBookingsDesc')}
            count={bookingRequests.length}
            actionLabel={t('provider.bookingRequests')}
            onClick={() => onSectionChange('bookingRequests')}
          />
          <NotificationCard
            icon={Search}
            variant="blue"
            title={t('provider.analytics.notifWorkTitle')}
            description={t('provider.analytics.notifWorkDesc')}
            count={availableRequests.length}
            actionLabel={t('provider.findWork')}
            onClick={() => onSectionChange('findWork')}
          />
          <NotificationCard
            icon={Calendar}
            variant="purple"
            title={t('provider.analytics.notifUpcomingTitle')}
            description={t('provider.analytics.notifUpcomingDesc')}
            count={upcomingRequests.length}
            actionLabel={t('provider.upcoming')}
            onClick={() => onSectionChange('upcoming')}
          />
        </div>
      )}

      <div className="provider-charts-grid">
        <ChartCard title={t('provider.analytics.jobPipeline')} subtitle={t('provider.analytics.jobPipelineDesc')}>
          {analytics.jobPipeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.jobPipeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CountTooltip />} />
                <Bar dataKey="value" name={t('provider.analytics.jobs')} radius={[8, 8, 0, 0]}>
                  {analytics.jobPipeline.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="provider-chart-empty">{t('provider.analytics.noJobs')}</div>
          )}
        </ChartCard>

        <ChartCard title={t('provider.analytics.paymentOverview')} subtitle={t('provider.analytics.paymentOverviewDesc')}>
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
            <div className="provider-chart-empty">{t('provider.analytics.noPayments')}</div>
          )}
        </ChartCard>
      </div>

      <div className="provider-charts-grid">
        <ChartCard title={t('provider.analytics.earningsTrend')} subtitle={t('provider.analytics.earningsTrendDesc')}>
          {analytics.hasEarningsData ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={analytics.monthlyEarnings} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="providerEarnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CurrencyTooltip />} />
                <Area type="monotone" dataKey="earnings" name={t('provider.earnings')} stroke="#10b981" fill="url(#providerEarnGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="provider-chart-empty">{t('provider.analytics.noEarnings')}</div>
          )}
        </ChartCard>

        <ChartCard title={t('provider.analytics.ratingBreakdown')} subtitle={t('provider.analytics.ratingBreakdownDesc')}>
          {analytics.ratingBuckets.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analytics.ratingBuckets} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CountTooltip />} />
                <Bar dataKey="value" name={t('provider.reviews')} radius={[8, 8, 0, 0]}>
                  {analytics.ratingBuckets.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="provider-chart-empty">{t('provider.noReviews')}</div>
          )}
        </ChartCard>
      </div>

      <div className="provider-quick-insights">
        <button type="button" className="provider-insight-card" onClick={() => onSectionChange('findWork')}>
          <Search size={20} />
          <div>
            <span className="provider-insight-value">{availableRequests.length}</span>
            <span className="provider-insight-label">{t('provider.findWork')}</span>
          </div>
        </button>
        <button type="button" className="provider-insight-card" onClick={() => onSectionChange('myRequests')}>
          <Briefcase size={20} />
          <div>
            <span className="provider-insight-value">{myRequests.length}</span>
            <span className="provider-insight-label">{t('provider.myRequests')}</span>
          </div>
        </button>
        <button type="button" className="provider-insight-card" onClick={() => onSectionChange('earnings')}>
          <DollarSign size={20} />
          <div>
            <span className="provider-insight-value">{formatLkr(totalEarnings)}</span>
            <span className="provider-insight-label">{t('provider.earnings')}</span>
          </div>
        </button>
        <button type="button" className="provider-insight-card" onClick={() => onSectionChange('reviews')}>
          <Star size={20} />
          <div>
            <span className="provider-insight-value">{averageRating}</span>
            <span className="provider-insight-label">{t('provider.reviews')}</span>
          </div>
        </button>
      </div>
    </div>
  );
}
