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
  Briefcase,
  CalendarCheck,
  Building2,
  Clock,
  DollarSign,
  FileText,
} from "lucide-react";
import api from "../utils/api";
import { AuthContext } from "../context/AuthContext";
import { getMyAvailability, updateAvailability } from "../api/provider";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { buildRatePayload, userToRateForm } from "../utils/providerRate";
import "../styles/CustomerSettings.css";
import "../styles/ProviderSettings.css";

const serviceCategories = [
  "Home Cleaning",
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "Landscaping",
  "HVAC",
  "Handyman",
  "Moving",
  "Other",
];

const sriLankanDistricts = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa",
  "Badulla", "Monaragala", "Ratnapura", "Kegalle",
];

const ProviderSettings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  const initialRate = userToRateForm(user);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    postalCode: user?.postalCode || "",
    profilePhoto: user?.profilePhoto || "",
    serviceCategory: user?.serviceCategory || "",
    yearsOfExperience: user?.yearsOfExperience || "",
    rateType: initialRate.rateType,
    rateAmount: initialRate.rateAmount,
    professionalBio: user?.professionalBio || "",
    city: user?.city || "",
    district: user?.district || "",
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
  const [isAvailableToday, setIsAvailableToday] = useState(true);
  const [bookedDates, setBookedDates] = useState([]);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);

  useEffect(() => {
    if (user) {
      const rate = userToRateForm(user);
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        postalCode: user.postalCode || "",
        profilePhoto: user.profilePhoto || "",
        serviceCategory: user.serviceCategory || "",
        yearsOfExperience: user.yearsOfExperience || "",
        rateType: rate.rateType,
        rateAmount: rate.rateAmount,
        professionalBio: user.professionalBio || "",
        city: user.city || "",
        district: user.district || "",
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

  useEffect(() => {
    if (user?.providerStatus !== "approved") return;
    const loadAvailability = async () => {
      try {
        const data = await getMyAvailability();
        setIsAvailableToday(Boolean(data.isAvailableToday));
        setBookedDates(data.bookedDates || []);
      } catch (err) {
        console.error("Failed to load availability", err);
      }
    };
    loadAvailability();
  }, [user?.providerStatus]);

  const handleAvailabilityToggle = async () => {
    setAvailabilitySaving(true);
    setStatus(null);
    try {
      const next = !isAvailableToday;
      const data = await updateAvailability(next);
      setIsAvailableToday(Boolean(data.isAvailableToday));
      setBookedDates(data.bookedDates || []);
      await refreshUser();
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || t("provider.alerts.failedUpdateAvailability"),
      });
    } finally {
      setAvailabilitySaving(false);
    }
  };

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
        ...buildRatePayload(formData.rateType, formData.rateAmount),
      });
      await refreshUser();
      setStatus({ type: "success", message: t("provider.settingsPage.profileUpdated") });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || t("provider.settingsPage.failedUpdateProfile"),
      });
    } finally {
      setSaving(false);
    }
  };

  const formatBookedDate = (d) => {
    const parsed = new Date(`${d}T00:00:00`);
    return Number.isNaN(parsed.getTime())
      ? d
      : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
          value={formData[name] ?? ""}
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
    <div className="customer-settings-page provider-settings-page">
      <div className="customer-settings-shell">
        <div className="customer-settings-topbar">
          <button
            type="button"
            className="customer-settings-back"
            onClick={() => navigate("/provider-dashboard")}
          >
            <ArrowLeft size={18} />
            {t("provider.settingsPage.backToDashboard")}
          </button>
          <LanguageSwitcher />
        </div>

        <section className="customer-settings-hero provider-settings-hero">
          <div className="customer-settings-avatar-wrap">
            <div className="customer-settings-avatar">
              {photoPreview ? (
                <img src={photoPreview} alt={t("provider.profile")} />
              ) : (
                <span>{formData.name?.charAt(0)?.toUpperCase() || "W"}</span>
              )}
            </div>
          </div>
          <div className="customer-settings-hero-text">
            <h1>{t("provider.settingsPage.title")}</h1>
            <p>{formData.email || t("provider.providerFallback")}</p>
            {formData.serviceCategory && (
              <span className="provider-settings-badge">{formData.serviceCategory}</span>
            )}
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
              {t("provider.settingsPage.profilePhoto")}
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
              <h2>{t("provider.settingsPage.basicData")}</h2>
              <p>{t("provider.settingsPage.basicDataHint")}</p>
            </div>
          </div>
          <div className="customer-settings-grid">
            {renderField("name", t("provider.settingsPage.fullName"), "text", <User size={16} />)}
            {renderField("email", t("provider.settingsPage.emailAddress"), "email", <Mail size={16} />, "you@example.com")}
            {renderField("phone", t("provider.settingsPage.phoneNumber"), "tel", <Phone size={16} />, "+94 ...")}
            <div className="customer-settings-field">
              <label htmlFor="city">{t("provider.settingsPage.city")}</label>
              <div className="customer-settings-input-wrap">
                <span className="customer-settings-input-icon"><Building2 size={16} /></span>
                <input
                  id="city"
                  name="city"
                  value={formData.city || ""}
                  onChange={handleChange}
                  placeholder={t("provider.settingsPage.cityPlaceholder")}
                  className="customer-settings-input--icon"
                />
              </div>
            </div>
            <div className="customer-settings-field">
              <label htmlFor="district">{t("provider.settingsPage.district")}</label>
              <select id="district" name="district" value={formData.district} onChange={handleChange}>
                <option value="">{t("provider.settingsPage.selectDistrict")}</option>
                {sriLankanDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            {renderField("postalCode", t("provider.settingsPage.postalCode"), "text", <Hash size={16} />, "10100")}
            <div className="customer-settings-grid--full customer-settings-field">
              <label htmlFor="address">{t("provider.settingsPage.streetAddress")}</label>
              <div className="customer-settings-input-wrap">
                <span className="customer-settings-input-icon customer-settings-input-icon--top">
                  <MapPin size={16} />
                </span>
                <input
                  id="address"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  placeholder={t("provider.settingsPage.addressPlaceholder")}
                  className="customer-settings-input--icon"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="customer-settings-card">
          <div className="customer-settings-card-header">
            <div className="customer-settings-card-icon customer-settings-card-icon--professional">
              <Briefcase size={20} />
            </div>
            <div>
              <h2>{t("provider.settingsPage.professionalInfo")}</h2>
              <p>{t("provider.settingsPage.professionalHint")}</p>
            </div>
          </div>
          <div className="customer-settings-grid">
            <div className="customer-settings-grid--full customer-settings-field">
              <label htmlFor="serviceCategory">{t("provider.settingsPage.serviceCategory")}</label>
              <select
                id="serviceCategory"
                name="serviceCategory"
                value={formData.serviceCategory}
                onChange={handleChange}
              >
                <option value="">{t("provider.settingsPage.selectCategory")}</option>
                {serviceCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="customer-settings-field">
              <label htmlFor="yearsOfExperience">{t("provider.settingsPage.yearsOfExperience")}</label>
              <div className="customer-settings-input-wrap">
                <span className="customer-settings-input-icon"><Clock size={16} /></span>
                <input
                  id="yearsOfExperience"
                  name="yearsOfExperience"
                  type="number"
                  min="0"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  placeholder="0"
                  className="customer-settings-input--icon"
                />
              </div>
            </div>
            <div className="customer-settings-field">
              <label htmlFor="rateType">{t("provider.settingsPage.chargeType")}</label>
              <select
                id="rateType"
                name="rateType"
                value={formData.rateType}
                onChange={handleChange}
              >
                <option value="hourly">{t("provider.settingsPage.hourlyRateOption")}</option>
                <option value="daily">{t("provider.settingsPage.dailyRateOption")}</option>
              </select>
            </div>
            <div className="customer-settings-field">
              <label htmlFor="rateAmount">
                {formData.rateType === "daily"
                  ? t("provider.settingsPage.dailyRate")
                  : t("provider.settingsPage.hourlyRate")}
              </label>
              <div className="customer-settings-input-wrap">
                <span className="customer-settings-input-icon"><DollarSign size={16} /></span>
                <input
                  id="rateAmount"
                  name="rateAmount"
                  type="number"
                  min="0"
                  value={formData.rateAmount}
                  onChange={handleChange}
                  placeholder={formData.rateType === "daily" ? "8000" : "1500"}
                  className="customer-settings-input--icon"
                />
              </div>
            </div>
            <div className="customer-settings-grid--full customer-settings-field">
              <label htmlFor="professionalBio">{t("provider.settingsPage.professionalBio")}</label>
              <div className="customer-settings-input-wrap">
                <span className="customer-settings-input-icon customer-settings-input-icon--top">
                  <FileText size={16} />
                </span>
                <textarea
                  id="professionalBio"
                  name="professionalBio"
                  value={formData.professionalBio}
                  onChange={handleChange}
                  rows={4}
                  placeholder={t("provider.settingsPage.bioPlaceholder")}
                  className="customer-settings-input--icon customer-settings-textarea"
                />
              </div>
            </div>
          </div>
        </section>

        {user?.providerStatus === "approved" && (
          <section className="customer-settings-card">
            <div className="customer-settings-card-header">
              <div className="customer-settings-card-icon customer-settings-card-icon--availability">
                <CalendarCheck size={20} />
              </div>
              <div>
                <h2>{t("provider.settingsPage.availability")}</h2>
                <p>{t("provider.settingsPage.availabilityHint")}</p>
              </div>
            </div>
            <div className="provider-settings-availability">
              <div className="provider-settings-availability-status">
                <span
                  className={`provider-settings-status-dot ${isAvailableToday ? "provider-settings-status-dot--on" : "provider-settings-status-dot--off"}`}
                  aria-hidden
                />
                <span className="provider-settings-status-label">
                  {isAvailableToday
                    ? t("provider.settingsPage.availableToday")
                    : t("provider.settingsPage.unavailableToday")}
                </span>
              </div>
              <button
                type="button"
                className={`provider-settings-availability-btn ${isAvailableToday ? "provider-settings-availability-btn--on" : "provider-settings-availability-btn--off"}`}
                onClick={handleAvailabilityToggle}
                disabled={availabilitySaving}
              >
                {availabilitySaving
                  ? t("provider.updating")
                  : isAvailableToday
                    ? t("provider.markUnavailableToday")
                    : t("provider.markAvailableToday")}
              </button>
              <div
                className={`provider-settings-booked-dates ${bookedDates.length > 0 ? "provider-settings-booked-dates--active" : ""}`}
              >
                <strong>{t("provider.bookedDates")}:</strong>{" "}
                {bookedDates.length > 0
                  ? bookedDates.map(formatBookedDate).join(", ")
                  : t("provider.notAvailable")}
              </div>
            </div>
          </section>
        )}

        <section className="customer-settings-card">
          <div className="customer-settings-card-header">
            <div className="customer-settings-card-icon customer-settings-card-icon--bank">
              <CreditCard size={20} />
            </div>
            <div>
              <h2>{t("provider.settingsPage.bankDetails")}</h2>
              <p>{t("provider.settingsPage.bankHint")}</p>
            </div>
          </div>
          <div className="customer-settings-grid">
            {renderBankField("bankName", t("provider.settingsPage.bankName"), "Commercial Bank")}
            {renderBankField("branch", t("provider.settingsPage.branch"), "Colombo Main")}
            {renderBankField("accountNumber", t("provider.settingsPage.accountNumber"), "XXXXXXXXXX")}
            {renderBankField("accountHolderName", t("provider.settingsPage.accountHolderName"), t("provider.settingsPage.fullName"))}
          </div>
        </section>

        <div className="customer-settings-actions">
          <button
            type="button"
            className="customer-settings-cancel"
            onClick={() => navigate("/provider-dashboard")}
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
            {saving ? t("provider.settingsPage.saving") : t("provider.settingsPage.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderSettings;
