import React from 'react';
import { useTranslation } from 'react-i18next';
import { getEstimateFromRequest } from '../../utils/serviceAgreement';

export default function CustomerEstimateReview({
  request,
  onAccept,
  onReject,
  showActions = true,
}) {
  const { t } = useTranslation();
  const estimate = getEstimateFromRequest(request);

  if (!estimate) return null;

  return (
    <div style={{
      marginTop: '12px',
      padding: '14px',
      background: '#f0fdf4',
      border: '1px solid #86efac',
      borderRadius: '10px',
    }}>
      <div style={{ fontWeight: '700', marginBottom: '10px', color: '#166534' }}>
        {t('agreement.providerEstimate')}
      </div>
      <div style={{ display: 'grid', gap: '6px', fontSize: '14px', color: '#14532d' }}>
        <div>{t('agreement.dailyRate')}: <strong>Rs. {Number(estimate.dailyRate).toLocaleString()}</strong></div>
        <div>{t('agreement.estimatedDurationDays')}: <strong>{estimate.estimatedDurationDays}</strong></div>
        <div>{t('agreement.totalEstimatedCost')}: <strong>Rs. {Number(estimate.totalEstimatedCost).toLocaleString()}</strong></div>
        {estimate.providerMessage && (
          <div style={{ marginTop: '4px', fontStyle: 'italic' }}>"{estimate.providerMessage}"</div>
        )}
      </div>
      {showActions && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button type="button" onClick={onAccept} className="offer-btn-accept" style={{ flex: 1 }}>
            ✓ {t('customer.offers.acceptOffer')}
          </button>
          <button type="button" onClick={onReject} className="offer-btn-reject" style={{ flex: 1 }}>
            ✗ {t('customer.offers.rejectOffer')}
          </button>
        </div>
      )}
    </div>
  );
}
