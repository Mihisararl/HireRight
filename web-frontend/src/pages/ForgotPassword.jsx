import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { requestPasswordReset } from '../api/auth';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AuthHomeLink from '../components/AuthHomeLink';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const data = await requestPasswordReset(email);
      setMessage(data.message || t('auth.resetEmailSent'));
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.resetRequestFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <AuthHomeLink />
      </div>
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <LanguageSwitcher />
      </div>

      <div style={cardStyle}>
        <h2 style={titleStyle}>{t('auth.forgotPasswordTitle')}</h2>
        <p style={subtitleStyle}>{t('auth.forgotPasswordSubtitle')}</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelStyle}>{t('common.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? t('common.sending') : t('auth.sendResetLink')}
          </button>

          {message && <p style={successStyle}>{message}</p>}
          {error && <p style={errorStyle}>{error}</p>}
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
          <Link to="/login" style={{ color: '#4169ff', textDecoration: 'none', fontWeight: 600 }}>
            {t('auth.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
}

const pageStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #a8d5ff 0%, #b8e0ff 100%)',
  padding: 20,
  position: 'relative',
};

const cardStyle = {
  width: '100%',
  maxWidth: 440,
  padding: '48px 40px',
  borderRadius: 20,
  backgroundColor: '#fff',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
};

const titleStyle = {
  textAlign: 'center',
  marginBottom: 12,
  fontSize: 28,
  fontWeight: 'bold',
  color: '#000',
};

const subtitleStyle = {
  textAlign: 'center',
  marginBottom: 32,
  fontSize: 15,
  color: '#64748b',
  lineHeight: 1.5,
};

const labelStyle = {
  display: 'block',
  marginBottom: 8,
  fontSize: 15,
  fontWeight: 600,
  color: '#333',
};

const inputStyle = {
  width: '100%',
  padding: 14,
  borderRadius: 10,
  border: 'none',
  fontSize: 15,
  backgroundColor: '#e8e8e8',
  outline: 'none',
  boxSizing: 'border-box',
};

const buttonStyle = {
  width: '100%',
  padding: 16,
  borderRadius: 30,
  backgroundColor: '#4169ff',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 600,
};

const successStyle = {
  color: '#16a34a',
  textAlign: 'center',
  margin: 0,
  fontSize: 14,
  lineHeight: 1.5,
};

const errorStyle = {
  color: '#dc3545',
  textAlign: 'center',
  margin: 0,
  fontSize: 14,
};
