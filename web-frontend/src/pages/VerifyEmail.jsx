import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { verifyEmailToken } from '../api/auth';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AuthHomeLink from '../components/AuthHomeLink';

export default function VerifyEmail() {
  const { t } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setError(t('auth.invalidVerificationLink'));
        setVerifying(false);
        return;
      }

      try {
        const data = await verifyEmailToken(token);
        setSuccess(true);
        setError('');
        setTimeout(() => {
          navigate('/login', {
            replace: true,
            state: { message: data.message || t('auth.emailVerified') }
          });
        }, 2000);
      } catch (err) {
        setError(err.response?.data?.message || t('auth.invalidVerificationLink'));
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [token, t, navigate]);

  return (
    <div style={pageStyle}>
      <div style={{ position: 'absolute', top: 20, left: 20 }}>
        <AuthHomeLink />
      </div>
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <LanguageSwitcher />
      </div>

      <div style={cardStyle}>
        <h2 style={titleStyle}>{t('common.appName')}</h2>

        {verifying && (
          <p style={messageStyle}>{t('auth.verifyingEmail')}</p>
        )}

        {!verifying && success && (
          <>
            <p style={{ ...messageStyle, color: '#16a34a' }}>{t('auth.emailVerified')}</p>
            <p style={messageStyle}>{t('auth.redirectingToLogin')}</p>
          </>
        )}

        {!verifying && !success && (
          <>
            <p style={{ ...messageStyle, color: '#dc2626' }}>{error}</p>
            <Link to="/login" style={linkStyle}>{t('auth.backToLogin')}</Link>
          </>
        )}
      </div>
    </div>
  );
}

const pageStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #e8f0f8 0%, #d0e4f7 100%)',
  padding: '20px',
  position: 'relative',
};

const cardStyle = {
  width: '100%',
  maxWidth: '420px',
  padding: '40px 35px',
  borderRadius: '15px',
  backgroundColor: '#fff',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  textAlign: 'center',
};

const titleStyle = {
  color: '#0066cc',
  fontSize: '28px',
  fontWeight: 'bold',
  marginBottom: '20px',
};

const messageStyle = {
  color: '#64748b',
  fontSize: '15px',
  lineHeight: 1.6,
  margin: '0 0 16px',
};

const linkStyle = {
  color: '#0066cc',
  fontWeight: '600',
  textDecoration: 'none',
};
