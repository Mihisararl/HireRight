import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { loginUser } from "../api/auth";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
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
      setVerifiedMsg("Email verified successfully! Please log in.");
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(email, password);
      login(data.user, data.token);

      if (data.user.role === "provider") {
        navigate("/provider-dashboard");
      } else if (data.user.role === "customer") {
        navigate("/customer-dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.log("Login error:", err.response);

      if (err.response?.status === 400) {
        setError("Invalid email or password");
      } else {
        setError(err.response?.data?.message || "Login failed. Try again.");
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
      padding: '20px'
    }}>
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
          Welcome Back
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
              Email Address
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
              Password
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
            Forgot password?
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
            Log In
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
