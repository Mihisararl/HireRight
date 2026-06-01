import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ style = {} }) => {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('si') ? 'si' : 'en';

  const setLanguage = (lng) => {
    if (lng !== current) {
      i18n.changeLanguage(lng);
    }
  };

  const buttonStyle = (active) => ({
    padding: '6px 10px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    background: active ? '#2563eb' : 'transparent',
    color: active ? '#ffffff' : '#64748b',
    transition: 'all 0.2s ease',
  });

  return (
    <div
      role="group"
      aria-label="Language switcher"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        padding: '4px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        ...style,
      }}
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        style={buttonStyle(current === 'en')}
        aria-pressed={current === 'en'}
      >
        EN
      </button>
      <span style={{ color: '#cbd5e1', fontWeight: '600', userSelect: 'none' }}>|</span>
      <button
        type="button"
        onClick={() => setLanguage('si')}
        style={buttonStyle(current === 'si')}
        aria-pressed={current === 'si'}
      >
        SI
      </button>
    </div>
  );
};

export default LanguageSwitcher;
