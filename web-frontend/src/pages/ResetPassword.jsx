import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPasswordWithToken, validatePasswordResetToken } from '../api/auth';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function ResetPassword() {
  const { t } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setTokenError(t('auth.invalidResetLink'));
        setValidating(false);
        return;
      }

      try {
        const data = await validatePasswordResetToken(token);
        if (data.valid) {
          setTokenValid(true);
          setEmail(data.email || '');
        } else {
          setTokenError(data.message || t('auth.invalidResetLink'));
        }
      } catch (err) {
        setTokenError(err.response?.data?.message || t('auth.invalidResetLink'));
      } finally {
        setValidating(false);
      }
    };

    checkToken();
  }, [token, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordsNoMatch'));
      return;
    }

    setLoading(true);
    try {
      const data = await resetPasswordWithToken({ token, password, confirmPassword });
      alert(data.message || t('auth.passwordResetSuccess'));
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t('auth.passwordResetFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <p style={{ textAlign: 'center', color: '#64748b' }}>{t('auth.validatingResetLink')}</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div style={pageStyle}>
        <div style={{ position: 'absolute', top: 20, right: 20 }}>
          <LanguageSwitcher />
        </div>
        <div style={cardStyle}>
          <h2 style={titleStyle}>{t('auth.resetLinkExpiredTitle')}</h2>
          <p style={subtitleStyle}>{tokenError}</p>
          <Link to="/forgot-password" style={linkButtonStyle}>
            {t('auth.requestNewResetLink')}
          </Link>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
            <Link to="/login" style={{ color: '#4169ff', textDecoration: 'none', fontWeight: 600 }}>
              {t('auth.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <LanguageSwitcher />
      </div>

      <div style={cardStyle}>
        <h2 style={titleStyle}>{t('auth.resetPasswordTitle')}</h2>
        <p style={subtitleStyle}>
          {email ? t('auth.resetPasswordSubtitle', { email }) : t('auth.resetPasswordSubtitleGeneric')}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelStyle}>{t('auth.newPassword')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('auth.confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? t('common.saving') : t('auth.updatePassword')}
          </button>

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

const linkButtonStyle = {
  display: 'block',
  textAlign: 'center',
  padding: '14px 20px',
  borderRadius: 30,
  backgroundColor: '#4169ff',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
};

const errorStyle = {
  color: '#dc3545',
  textAlign: 'center',
  margin: 0,
  fontSize: 14,
};
