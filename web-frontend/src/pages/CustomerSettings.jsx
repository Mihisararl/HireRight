import React, { useState, useEffect, useContext, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Hash,
  Camera,
  CreditCard,
  Save,
} from "lucide-react";
import api from "../utils/api";
import { AuthContext } from "../context/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import "../styles/CustomerSettings.css";

const CustomerSettings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    postalCode: user?.postalCode || "",
    profilePhoto: user?.profilePhoto || "",
  });
  const [bankData, setBankData] = useState({
    bankName: user?.bankName || "",
    accountNumber: user?.accountNumber || "",
    accountHolderName: user?.accountHolderName || "",
    branch: user?.branch || "",
  });
  const [photoPreview, setPhotoPreview] = useState(user?.profilePhoto || "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        postalCode: user.postalCode || "",
        profilePhoto: user.profilePhoto || "",
      });
      setBankData({
        bankName: user.bankName || "",
        accountNumber: user.accountNumber || "",
        accountHolderName: user.accountHolderName || "",
        branch: user.branch || "",
      });
      setPhotoPreview(user.profilePhoto || "");
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBankChange = (e) => {
    setBankData({ ...bankData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      setFormData((prev) => ({ ...prev, profilePhoto: result }));
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await api.put("/auth/profile", {
        ...formData,
        ...bankData,
      });
      await refreshUser();
      setStatus({ type: "success", message: t("customer.settings.profileUpdated") });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || t("customer.settings.failedUpdateProfile"),
      });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (name, label, type = "text", icon = null, placeholder = "") => (
    <div className="customer-settings-field">
      <label htmlFor={name}>{label}</label>
      <div className={icon ? "customer-settings-input-wrap" : undefined}>
        {icon && <span className="customer-settings-input-icon">{icon}</span>}
        <input
          id={name}
          name={name}
          type={type}
          value={formData[name] || ""}
          onChange={handleChange}
          placeholder={placeholder}
          className={icon ? "customer-settings-input--icon" : undefined}
        />
      </div>
    </div>
  );

  const renderBankField = (name, label, placeholder = "") => (
    <div className="customer-settings-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        value={bankData[name] || ""}
        onChange={handleBankChange}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="customer-settings-page">
      <div className="customer-settings-shell">
        <div className="customer-settings-topbar">
          <button
            type="button"
            className="customer-settings-back"
            onClick={() => navigate("/customer-dashboard")}
          >
            <ArrowLeft size={18} />
            {t("customer.settings.backToDashboard")}
          </button>
          <LanguageSwitcher />
        </div>

        <section className="customer-settings-hero">
          <div className="customer-settings-avatar-wrap">
            <div className="customer-settings-avatar">
              {photoPreview ? (
                <img src={photoPreview} alt={t("profile")} />
              ) : (
                <span>{formData.name?.charAt(0)?.toUpperCase() || "U"}</span>
              )}
            </div>
          </div>
          <div className="customer-settings-hero-text">
            <h1>{t("customer.settings.title")}</h1>
            <p>{formData.email || t("customer.welcomeFallback")}</p>
          </div>
          <div className="customer-settings-hero-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="customer-settings-upload-input"
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              className="customer-settings-upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={16} />
              {t("customer.settings.profilePhoto")}
            </button>
          </div>
        </section>

        {status && (
          <div
            className={`customer-settings-status customer-settings-status--${status.type}`}
            role="alert"
          >
            {status.message}
          </div>
        )}

        <section className="customer-settings-card">
          <div className="customer-settings-card-header">
            <div className="customer-settings-card-icon customer-settings-card-icon--profile">
              <User size={20} />
            </div>
            <div>
              <h2>{t("customer.settings.basicData")}</h2>
              <p>{t("customer.settings.basicDataHint")}</p>
            </div>
          </div>
          <div className="customer-settings-grid">
            {renderField("name", t("common.name"), "text", <User size={16} />, t("auth.fullName"))}
            {renderField("email", t("common.email"), "email", <Mail size={16} />, "you@example.com")}
            {renderField("phone", t("common.phone"), "tel", <Phone size={16} />, "+94 ...")}
            {renderField("postalCode", t("auth.postalCode"), "text", <Hash size={16} />, "10100")}
            <div className="customer-settings-grid--full customer-settings-field">
              <label htmlFor="address">{t("customer.settings.address")}</label>
              <div className="customer-settings-input-wrap">
                <span className="customer-settings-input-icon customer-settings-input-icon--top">
                  <MapPin size={16} />
                </span>
                <input
                  id="address"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  placeholder={t("customer.settings.addressPlaceholder")}
                  className="customer-settings-input--icon"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="customer-settings-card">
          <div className="customer-settings-card-header">
            <div className="customer-settings-card-icon customer-settings-card-icon--bank">
              <CreditCard size={20} />
            </div>
            <div>
              <h2>{t("customer.settings.paymentBankDetails")}</h2>
              <p>{t("customer.settings.bankHint")}</p>
            </div>
          </div>
          <div className="customer-settings-grid">
            {renderBankField("bankName", t("customer.settings.bankName"), "Commercial Bank")}
            {renderBankField("branch", t("customer.settings.branch"), "Colombo Main")}
            {renderBankField("accountNumber", t("customer.settings.accountNumber"), "XXXXXXXXXX")}
            {renderBankField("accountHolderName", t("customer.settings.accountHolderName"), t("auth.fullName"))}
          </div>
        </section>

        <div className="customer-settings-actions">
          <button
            type="button"
            className="customer-settings-cancel"
            onClick={() => navigate("/customer-dashboard")}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="customer-settings-save"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={18} />
            {saving ? t("common.saving") : t("common.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerSettings;
