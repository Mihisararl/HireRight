import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError(t("auth.passwordsNoMatch"));
      return;
    }

    try {
      await API.post('/auth/register', {
        name,
        email,
        phone,
        district,
        postalCode,
        password,
        role,
      });

      setSuccess(t("auth.registrationSuccess"));
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || t("auth.registrationFailed"));
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e8f0f8 0%, #d0e4f7 100%)",
        padding: "20px",
        position: "relative",
      }}
    >
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <LanguageSwitcher />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "40px 35px",
          borderRadius: "15px",
          backgroundColor: "#fff",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "30px",
            color: "#0066cc",
            fontSize: "28px",
            fontWeight: "bold",
          }}
        >
          {t("common.appName")}
        </h2>

        <form style={{ display: "flex", flexDirection: "column", gap: "15px" }} onSubmit={handleSubmit}>
          <input type="text" placeholder={t("auth.fullName")} value={name}
            onChange={(e) => setName(e.target.value)} required style={inputStyle} />

          <input type="email" placeholder={t("common.email")} value={email}
            onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />

          <input type="tel" placeholder={t("common.phone")} value={phone}
            onChange={(e) => setPhone(e.target.value)} required style={inputStyle} />

          <input type="text" placeholder={t("auth.district")} value={district}
            onChange={(e) => setDistrict(e.target.value)} style={inputStyle} />

          <input type="text" placeholder={t("auth.postalCode")} value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)} style={inputStyle} />

          <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
            <option value="customer">{t("auth.serviceReceiver")}</option>
            <option value="provider">{t("auth.serviceProvider")}</option>
          </select>

          <input type="password" placeholder={t("auth.createPassword")} value={password}
            onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />

          <input type="password" placeholder={t("auth.confirmPassword")} value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} required style={inputStyle} />

          <button type="submit" style={buttonStyle}>{t("register")}</button>

          {error && (
            <p style={{ color: "#dc3545", textAlign: "center", margin: "0", fontSize: "14px" }}>
              {error}
            </p>
          )}

          {success && (
            <p style={{ color: '#28a745', textAlign: 'center', margin: '0', fontSize: '14px' }}>
              {success}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "14px",
  borderRadius: "8px",
  border: "1px solid #e0e0e0",
  fontSize: "15px",
  backgroundColor: "#f5f5f5",
  outline: "none",
};

const buttonStyle = {
  padding: "14px",
  borderRadius: "25px",
  backgroundColor: "#0066ff",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "600",
  marginTop: "10px",
  transition: "background-color 0.3s",
};
