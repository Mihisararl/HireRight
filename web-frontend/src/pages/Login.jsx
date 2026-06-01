import { useState, useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";
import { loginUser } from "../api/auth";
import { useNavigate, useLocation } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Login() {
  const { t } = useTranslation();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifiedMsg, setVerifiedMsg] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("verified") === "true") {
      setVerifiedMsg(t("auth.emailVerified"));
    }
  }, [location, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(email, password);
      login(data.user, data.token);

      if (location.state?.bookingIntent) {
        if (data.user.role === "customer") {
          navigate("/services", { state: { bookingIntent: location.state.bookingIntent } });
        } else {
          alert(t("auth.onlyCustomersBook"));
          navigate("/provider-dashboard");
        }
      } else if (data.user.role === "provider") {
        navigate("/provider-dashboard");
      } else if (data.user.role === "customer") {
        navigate("/customer-dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      if (err.response?.status === 400) {
        setError(t("auth.invalidCredentials"));
      } else {
        setError(err.response?.data?.message || t("auth.loginFailed"));
      }
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
        padding: '50px 40px',
        borderRadius: '20px',
        backgroundColor: '#fff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
      }}>

        {verifiedMsg && (
          <p style={{ color: "green", textAlign: "center", marginBottom: "10px" }}>
            {verifiedMsg}
          </p>
        )}

        <h2 style={{
          textAlign: 'center',
          marginBottom: '40px',
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#000'
        }}>
          {t("auth.welcomeBack")}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '15px',
              fontWeight: '600',
              color: '#333'
            }}>
              {t("common.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '15px',
                backgroundColor: '#e8e8e8',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '15px',
              fontWeight: '600',
              color: '#333'
            }}>
              {t("common.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '15px',
                backgroundColor: '#e8e8e8',
                outline: 'none'
              }}
            />
          </div>

          <a href="/forgot-password"
            style={{ textAlign: 'left', fontSize: '14px', color: '#666' }}>
            {t("auth.forgotPassword")}
          </a>

          <button onClick={handleSubmit} style={{
            width: '100%',
            padding: '16px',
            borderRadius: '30px',
            backgroundColor: '#4169ff',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            {t("auth.logIn")}
          </button>

          {error && (
            <p style={{ color: '#dc3545', textAlign: 'center', margin: '0' }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
