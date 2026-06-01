// src/pages/CustomerSettings.jsx
import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { AuthContext } from "../context/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";

const CustomerSettings = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, refreshUser } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        address: user?.address || "",
        postalCode: user?.postalCode || "",
        profilePhoto: user?.profilePhoto || ""
    });
    const [bankData, setBankData] = useState({
        bankName: "",
        accountNumber: "",
        accountHolderName: "",
        branch: ""
    });
    const [photoPreview, setPhotoPreview] = useState(user?.profilePhoto || "");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                address: user.address || "",
                postalCode: user.postalCode || "",
                profilePhoto: user.profilePhoto || ""
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
        try {
            await api.put("/auth/profile", {
                ...formData,
                ...bankData
            });
            await refreshUser();
            alert(t("customer.settings.profileUpdated"));
            setBankData({
                bankName: "",
                accountNumber: "",
                accountHolderName: "",
                branch: ""
            });
        } catch (error) {
            alert(error.response?.data?.message || t("customer.settings.failedUpdateProfile"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: "40px", maxWidth: "720px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <button
                        type="button"
                        onClick={() => navigate("/customer-dashboard")}
                        style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 0, marginBottom: "8px", fontWeight: 600 }}
                    >
                        ← {t("customer.settings.backToDashboard")}
                    </button>
                    <h2 style={{ margin: 0 }}>{t("customer.settings.title")}</h2>
                </div>
                <LanguageSwitcher />
            </div>

            <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "16px",
                    backgroundColor: "#e2e8f0",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: "#475569"
                }}>
                    {photoPreview ? (
                        <img
                            src={photoPreview}
                            alt={t("profile")}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    ) : (
                        <span>{formData.name?.charAt(0)?.toUpperCase() || "U"}</span>
                    )}
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>{t("customer.settings.profilePhoto")}</label>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} />
                </div>
            </div>

            <h3 style={{ marginBottom: "16px" }}>{t("customer.settings.basicData")}</h3>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>{t("common.name")}</label>
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                />
            </div>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>{t("common.email")}</label>
                <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                />
            </div>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>{t("common.phone")}</label>
                <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                />
            </div>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>{t("customer.settings.address")}</label>
                <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                />
            </div>
            <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>{t("auth.postalCode")}</label>
                <input
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                />
            </div>

            <h3 style={{ marginBottom: "16px" }}>{t("customer.settings.paymentBankDetails")}</h3>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>{t("customer.settings.bankName")}</label>
                <input
                    name="bankName"
                    value={bankData.bankName}
                    onChange={handleBankChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                />
            </div>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>{t("customer.settings.accountNumber")}</label>
                <input
                    name="accountNumber"
                    value={bankData.accountNumber}
                    onChange={handleBankChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                />
            </div>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>{t("customer.settings.accountHolderName")}</label>
                <input
                    name="accountHolderName"
                    value={bankData.accountHolderName}
                    onChange={handleBankChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                />
            </div>
            <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>{t("customer.settings.branch")}</label>
                <input
                    name="branch"
                    value={bankData.branch}
                    onChange={handleBankChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                />
            </div>
            <button
                onClick={handleSave}
                disabled={saving}
                style={{
                    background: "#3b82f6",
                    color: "#fff",
                    padding: "12px 24px",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    opacity: saving ? 0.7 : 1
                }}
            >
                {saving ? t("common.saving") : t("common.saveChanges")}
            </button>
        </div>
    );
};

export default CustomerSettings;
