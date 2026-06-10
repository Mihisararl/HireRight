import { useState, useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";
import { loginUser, loginWithGoogle } from "../api/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { navigateAfterAuth } from "../utils/authNavigation";

export default function Login() {
  const { t } = useTranslation();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifiedMsg, setVerifiedMsg] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleRole, setGoogleRole] = useState("customer");

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
      navigateAfterAuth(navigate, data.user, location);
    } catch (err) {
      if (err.response?.status === 400) {
        setError(t("auth.invalidCredentials"));
      } else {
        setError(err.response?.data?.message || t("auth.loginFailed"));
      }
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setError("");
    setGoogleLoading(true);
    try {
      const data = await loginWithGoogle(credential, googleRole);
      login(data.user, data.token);
      navigateAfterAuth(navigate, data.user, location);
    } catch (err) {
      setError(err.response?.data?.message || t("auth.googleSignInFailed"));
    } finally {
      setGoogleLoading(false);
    }
  };

  const showGoogle = Boolean(process.env.REACT_APP_GOOGLE_CLIENT_ID);

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

          <Link to="/forgot-password"
            style={{ textAlign: 'left', fontSize: '14px', color: '#666', textDecoration: 'none' }}>
            {t("auth.forgotPassword")}
          </Link>

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

          {showGoogle && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '4px 0',
              }}>
                <div style={{ flex: 1, height: 1, backgroundColor: '#ddd' }} />
                <span style={{ fontSize: '13px', color: '#888' }}>{t("auth.orDivider")}</span>
                <div style={{ flex: 1, height: 1, backgroundColor: '#ddd' }} />
              </div>
              <p style={{ fontSize: '13px', color: '#666', margin: 0, textAlign: 'center' }}>
                {t("auth.googleSignInAs")}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setGoogleRole('customer')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: googleRole === 'customer' ? '2px solid #4169ff' : '1px solid #ddd',
                    backgroundColor: googleRole === 'customer' ? '#eef3ff' : '#f5f5f5',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {t("auth.serviceReceiver")}
                </button>
                <button
                  type="button"
                  onClick={() => setGoogleRole('provider')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: googleRole === 'provider' ? '2px solid #4169ff' : '1px solid #ddd',
                    backgroundColor: googleRole === 'provider' ? '#eef3ff' : '#f5f5f5',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {t("auth.serviceProvider")}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  onError={(msg) => setError(msg || t("auth.googleSignInFailed"))}
                  disabled={googleLoading}
                />
              </div>
            </>
          )}

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
