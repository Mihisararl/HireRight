import React, { useMemo } from 'react';
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

function getPaymentRequestId(payment) {
  return String(payment?.serviceRequestId?._id || payment?.serviceRequestId || '');
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`provider-chart-card ${className}`}>
      <div className="provider-chart-card-header">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="provider-chart-card-body">{children}</div>
    </div>
  );
}

function SimpleBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="simple-bar-chart" role="img" aria-label="Job pipeline chart">
      {data.map((item) => {
        const heightPct = item.value > 0 ? Math.max((item.value / max) * 100, 14) : 4;
        return (
          <div key={item.key || item.name} className="simple-bar-chart-item">
            <span className="simple-bar-chart-value">{item.value}</span>
            <div className="simple-bar-chart-track">
              <div
                className="simple-bar-chart-fill"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: item.value > 0 ? item.fill : '#cbd5e1',
                }}
                title={`${item.name}: ${item.value}`}
              />
            </div>
            <span className="simple-bar-chart-label">{item.name}</span>
          </div>
        );
      })}
    </div>
  );
}

function SimpleDonutChart({ data, centerLabel, formatValue }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return null;

  let cumulative = 0;
  const gradientStops = data.map((item) => {
    const start = cumulative;
    cumulative += (item.value / total) * 100;
    return `${item.fill} ${start}% ${cumulative}%`;
  }).join(', ');

  const formatDisplay = formatValue || ((value) => value);

  return (
    <div className="simple-donut-chart">
      <div
        className="simple-donut-chart-ring"
        style={{ background: `conic-gradient(${gradientStops})` }}
      >
        <div className="simple-donut-chart-hole">
          <span className="simple-donut-chart-total">{formatDisplay(total)}</span>
          <span className="simple-donut-chart-total-label">{centerLabel}</span>
        </div>
      </div>
      <div className="simple-donut-legend">
        {data.map((item) => (
          <div key={item.name} className="simple-donut-legend-item">
            <span className="simple-donut-legend-dot" style={{ backgroundColor: item.fill }} />
            <span className="simple-donut-legend-name">{item.name}</span>
            <strong>{formatDisplay(item.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleEarningsChart({ data, formatValue }) {
  const max = Math.max(...data.map((d) => d.earnings), 1);
  const width = 640;
  const height = 220;
  const pad = { top: 24, right: 24, bottom: 36, left: 52 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const points = data.map((d, i) => {
    const x = pad.left + (data.length <= 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
    const y = pad.top + chartH - (d.earnings / max) * chartH;
    return { ...d, x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(pad.top + chartH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(pad.top + chartH).toFixed(1)} Z`
    : '';

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="simple-earnings-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="simple-earnings-chart-svg" role="img" aria-label="Earnings trend chart">
        {gridLines.map((ratio) => {
          const y = pad.top + chartH * (1 - ratio);
          const val = max * ratio;
          return (
            <g key={ratio}>
              <line
                x1={pad.left}
                y1={y}
                x2={width - pad.right}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                {val >= 1000 ? `${Math.round(val / 1000)}k` : Math.round(val)}
              </text>
            </g>
          );
        })}
        {areaPath && <path d={areaPath} fill="rgba(16, 185, 129, 0.18)" />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {points.map((p) => (
          <g key={p.name}>
            <circle
              cx={p.x}
              cy={p.y}
              r={p.earnings > 0 ? 5 : 3}
              fill={p.earnings > 0 ? '#10b981' : '#cbd5e1'}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <text x={p.x} y={height - 10} textAnchor="middle" fontSize="11" fill="#64748b">
              {p.name}
            </text>
          </g>
        ))}
      </svg>
      <div className="simple-earnings-chart-summary">
        {data.filter((d) => d.earnings > 0).map((d) => (
          <div key={d.name} className="simple-earnings-chart-pill">
            <span>{d.name}</span>
            <strong>{formatValue(d.earnings)}</strong>
          </div>
        ))}
      </div>
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

    historyRequests.forEach((request) => {
      const payment = payments.find((p) => getPaymentRequestId(p) === String(request._id));
      if (!payment || payment.payoutStatus !== 'paid') return;

      const date = new Date(
        payment.releasedAt
        || payment.paidAt
        || payment.updatedAt
        || request.completedAt
        || request.updatedAt
        || request.createdAt
      );
      if (Number.isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) return;

      const { providerAmount } = getPaymentBreakdown(payment);
      monthlyMap[key].earnings += providerAmount;
    });

    const addPaymentToMonth = (payment) => {
      const date = new Date(payment.releasedAt || payment.paidAt || payment.updatedAt || payment.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) return;
      const { providerAmount } = getPaymentBreakdown(payment);
      monthlyMap[key].earnings += providerAmount;
    };

    if (!Object.values(monthlyMap).some((m) => m.earnings > 0)) {
      payments
        .filter((payment) => payment.payoutStatus === 'paid')
        .forEach(addPaymentToMonth);
    }

    const jobPipeline = [
      { key: 'available', name: t('provider.analytics.available'), value: availableRequests.length, fill: '#2563eb' },
      { key: 'bookings', name: t('provider.analytics.bookings'), value: bookingRequests.length, fill: '#f59e0b' },
      { key: 'upcoming', name: t('provider.analytics.upcoming'), value: upcomingRequests.length, fill: '#8b5cf6' },
      { key: 'completed', name: t('provider.analytics.completed'), value: historyRequests.length, fill: '#10b981' },
    ];

    const paymentBuckets = { released: 0, onHold: 0, pending: 0 };
    payments.forEach((payment) => {
      const { providerAmount } = getPaymentBreakdown(payment);
      if (payment.payoutStatus === 'paid') {
        paymentBuckets.released += providerAmount;
      } else if (payment.payoutStatus === 'hold') {
        paymentBuckets.onHold += providerAmount;
      } else {
        paymentBuckets.pending += providerAmount;
      }
    });

    const paymentStatus = [
      { name: t('provider.analytics.released'), value: paymentBuckets.released, fill: '#10b981' },
      { name: t('provider.analytics.onHold'), value: paymentBuckets.onHold, fill: '#6366f1' },
      { name: t('provider.analytics.pending'), value: paymentBuckets.pending, fill: '#f59e0b' },
    ].filter((item) => item.value > 0);

    const monthlyEarnings = months.map((m) => monthlyMap[m.key]);
    const hasEarningsData = monthlyEarnings.some((m) => m.earnings > 0);
    const hasJobData = jobPipeline.some((item) => item.value > 0);
    const hasPaymentData = paymentStatus.length > 0;

    return {
      jobPipeline,
      paymentStatus,
      monthlyEarnings,
      hasEarningsData,
      hasJobData,
      hasPaymentData,
    };
  }, [availableRequests, bookingRequests, upcomingRequests, historyRequests, payments, t]);

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
          {analytics.hasJobData ? (
            <SimpleBarChart data={analytics.jobPipeline} />
          ) : (
            <div className="provider-chart-empty">{t('provider.analytics.noJobs')}</div>
          )}
        </ChartCard>

        <ChartCard title={t('provider.analytics.paymentOverview')} subtitle={t('provider.analytics.paymentOverviewDesc')}>
          {analytics.hasPaymentData ? (
            <SimpleDonutChart
              data={analytics.paymentStatus}
              centerLabel={t('provider.analytics.paymentsTotal')}
              formatValue={formatLkr}
            />
          ) : (
            <div className="provider-chart-empty">{t('provider.analytics.noPayments')}</div>
          )}
        </ChartCard>
      </div>

      <ChartCard
        title={t('provider.analytics.earningsTrend')}
        subtitle={t('provider.analytics.earningsTrendDesc')}
        className="provider-chart-card--full"
      >
        {analytics.hasEarningsData ? (
          <SimpleEarningsChart data={analytics.monthlyEarnings} formatValue={formatLkr} />
        ) : (
          <div className="provider-chart-empty">{t('provider.analytics.noEarnings')}</div>
        )}
      </ChartCard>

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
