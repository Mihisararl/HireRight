import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const PolicyPage = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const isWorker = pathname.includes('worker-policy');
  const baseKey = isWorker ? 'policies.worker' : 'policies.customer';

  const sections = t(`${baseKey}.sections`, { returnObjects: true });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Noto Sans Sinhala', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <Link to="/" style={{ fontSize: '22px', fontWeight: '700', color: '#0066cc', textDecoration: 'none' }}>
          {t('common.appName')}
        </Link>
        <LanguageSwitcher />
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
          {t(`${baseKey}.title`)}
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '14px' }}>
          {t(`${baseKey}.lastUpdated`)}
        </p>

        {Array.isArray(sections) && sections.map((section, index) => (
          <section key={index} style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
              {section.title}
            </h2>
            {Array.isArray(section.paragraphs) && section.paragraphs.map((paragraph, pIndex) => (
              <p
                key={pIndex}
                style={{
                  color: '#475569',
                  lineHeight: 1.7,
                  marginBottom: '12px',
                  fontSize: '15px',
                }}
              >
                {paragraph}
              </p>
            ))}
            {Array.isArray(section.bullets) && (
              <ul style={{ margin: '0 0 12px', paddingLeft: '24px', color: '#475569', lineHeight: 1.7 }}>
                {section.bullets.map((bullet, bIndex) => (
                  <li key={bIndex} style={{ marginBottom: '8px' }}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
          <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>
            ← {t('policies.backToHome')}
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PolicyPage;
