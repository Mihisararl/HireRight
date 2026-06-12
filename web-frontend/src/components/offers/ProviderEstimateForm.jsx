import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateTotalEstimatedCost } from '../../utils/serviceAgreement';

export default function ProviderEstimateForm({
  dailyRate,
  estimatedDurationDays,
  providerMessage,
  customerBudgetPerDay,
  onChange,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel,
}) {
  const { t } = useTranslation();

  const totalCost = useMemo(
    () => calculateTotalEstimatedCost(dailyRate, estimatedDurationDays),
    [dailyRate, estimatedDurationDays]
  );

  const handleField = (field, value) => {
    onChange({ dailyRate, estimatedDurationDays, providerMessage, [field]: value });
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      {customerBudgetPerDay > 0 && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '14px',
          color: '#475569',
        }}>
          {t('agreement.customerBudgetPerDay')}: <strong>Rs. {Number(customerBudgetPerDay).toLocaleString()}</strong>
        </div>
      )}

      <div>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>
          {t('agreement.dailyRate')} *
        </label>
        <input
          type="number"
          min="1"
          step="0.01"
          value={dailyRate}
          onChange={(e) => handleField('dailyRate', e.target.value)}
          style={inputStyle}
          required
        />
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>
          {t('agreement.estimatedDurationDays')} *
        </label>
        <input
          type="number"
          min="1"
          step="1"
          value={estimatedDurationDays}
          onChange={(e) => handleField('estimatedDurationDays', e.target.value)}
          style={inputStyle}
          required
        />
      </div>

      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '14px',
        color: '#1e40af',
      }}>
        {t('agreement.totalEstimatedCost')}: <strong>Rs. {totalCost.toLocaleString()}</strong>
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>
          {t('agreement.providerMessage')}
        </label>
        <textarea
          value={providerMessage}
          onChange={(e) => handleField('providerMessage', e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          placeholder={t('agreement.providerMessagePlaceholder')}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          disabled={submitting || totalCost <= 0}
          onClick={onSubmit}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            cursor: submitting || totalCost <= 0 ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            opacity: submitting || totalCost <= 0 ? 0.6 : 1,
          }}
        >
          {submitting ? t('common.sending') : (submitLabel || t('agreement.submitEstimate'))}
        </button>
      </div>
    </div>
  );
}
