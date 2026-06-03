import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function CompleteProfile() {
  const { t } = useTranslation();
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState(user?.district || '');
  const [postalCode, setPostalCode] = useState(user?.postalCode || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await api.put('/auth/profile', {
        phone,
        district,
        postalCode
      });

      const token = localStorage.getItem('token');
      const updatedUser = {
        ...user,
        ...response.data.user,
        needsProfileCompletion: false
      };
      login(updatedUser, token);
      navigate(
        updatedUser.role === 'provider' ? '/provider-dashboard' : '/customer-dashboard',
        { replace: true }
      );
    } catch (err) {
      setError(err.response?.data?.message || t('auth.completeProfileFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #a8d5ff 0%, #b8e0ff 100%)',
      padding: '20px',
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <LanguageSwitcher />
      </div>

      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px 35px',
        borderRadius: '20px',
        backgroundColor: '#fff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '12px', fontSize: '26px' }}>
          {t('auth.completeProfileTitle')}
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px', fontSize: '14px' }}>
          {t('auth.completeProfileSubtitle')}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="tel"
            placeholder={t('common.phone')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="text"
            placeholder={t('auth.district')}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder={t('auth.postalCode')}
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            style={inputStyle}
          />

          <button type="submit" disabled={saving} style={buttonStyle}>
            {saving ? t('common.saving') : t('auth.completeProfileContinue')}
          </button>

          {error && (
            <p style={{ color: '#dc3545', textAlign: 'center', margin: 0, fontSize: '14px' }}>
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '14px',
  borderRadius: '10px',
  border: 'none',
  fontSize: '15px',
  backgroundColor: '#e8e8e8',
  outline: 'none',
};

const buttonStyle = {
  padding: '16px',
  borderRadius: '30px',
  backgroundColor: '#4169ff',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: '600',
};
