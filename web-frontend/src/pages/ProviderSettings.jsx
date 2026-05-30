import React, { useState, useEffect, useContext } from "react";
import api from "../utils/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getMyAvailability, updateAvailability } from "../api/provider";

const ProviderSettings = () => {
    const { user, refreshUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        address: user?.address || "",
        postalCode: user?.postalCode || "",
        profilePhoto: user?.profilePhoto || "",
        serviceCategory: user?.serviceCategory || "",
        yearsOfExperience: user?.yearsOfExperience || "",
        hourlyRate: user?.hourlyRate || "",
        professionalBio: user?.professionalBio || "",
        city: user?.city || "",
        district: user?.district || ""
    });

    const [bankData, setBankData] = useState({
        bankName: user?.bankName || "",
        accountNumber: user?.accountNumber || "",
        accountHolderName: user?.accountHolderName || "",
        branch: user?.branch || ""
    });

    const [photoPreview, setPhotoPreview] = useState(user?.profilePhoto || "");
    const [saving, setSaving] = useState(false);
    const [isAvailableToday, setIsAvailableToday] = useState(true);
    const [bookedDates, setBookedDates] = useState([]);
    const [availabilitySaving, setAvailabilitySaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                address: user.address || "",
                postalCode: user.postalCode || "",
                profilePhoto: user.profilePhoto || "",
                serviceCategory: user.serviceCategory || "",
                yearsOfExperience: user.yearsOfExperience || "",
                hourlyRate: user.hourlyRate || "",
                professionalBio: user.professionalBio || "",
                city: user.city || "",
                district: user.district || ""
            });
            setBankData({
                bankName: user.bankName || "",
                accountNumber: user.accountNumber || "",
                accountHolderName: user.accountHolderName || "",
                branch: user.branch || ""
            });
            setPhotoPreview(user.profilePhoto || "");
        }
    }, [user]);

    useEffect(() => {
        if (user?.providerStatus !== 'approved') return;
        const loadAvailability = async () => {
            try {
                const data = await getMyAvailability();
                setIsAvailableToday(Boolean(data.isAvailableToday));
                setBookedDates(data.bookedDates || []);
            } catch (err) {
                console.error('Failed to load availability', err);
            }
        };
        loadAvailability();
    }, [user?.providerStatus]);

    const handleAvailabilityToggle = async () => {
        setAvailabilitySaving(true);
        try {
            const next = !isAvailableToday;
            const data = await updateAvailability(next);
            setIsAvailableToday(Boolean(data.isAvailableToday));
            setBookedDates(data.bookedDates || []);
            await refreshUser();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update availability');
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
        try {
            await api.put("/auth/profile", {
                ...formData,
                ...bankData
            });
            await refreshUser();
            alert("Provider profile updated successfully!");
        } catch (error) {
            alert(error.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const serviceCategories = [
        'Home Cleaning',
        'Plumbing',
        'Electrical',
        'Carpentry',
        'Painting',
        'Landscaping',
        'HVAC',
        'Handyman',
        'Moving',
        'Other'
    ];

    const sriLankanDistricts = [
        'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
        'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
        'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
        'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa',
        'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'
    ];

    return (
        <div style={{ padding: "40px", maxWidth: "720px", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ margin: 0 }}>Worker Profile Settings</h2>
                <button
                    onClick={() => navigate("/provider-dashboard")}
                    style={{
                        background: "none",
                        border: "1px solid #ccc",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: 600
                    }}
                >
                    Back to Dashboard
                </button>
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
                            alt="Profile"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    ) : (
                        <span>{formData.name?.charAt(0)?.toUpperCase() || "W"}</span>
                    )}
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Profile Photo</label>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} />
                </div>
            </div>

            <h3 style={{ marginBottom: "16px", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>Basic Data</h3>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Full Name</label>
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
            </div>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Email Address</label>
                <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
            </div>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Phone Number</label>
                <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
            </div>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Street Address</label>
                <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>City</label>
                    <input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                    />
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>District</label>
                    <select
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", backgroundColor: "#fff" }}
                    >
                        <option value="">Select District</option>
                        {sriLankanDistricts.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Postal Code</label>
                <input
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
            </div>

            <h3 style={{ marginBottom: "16px", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>Professional Details</h3>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Service Category</label>
                <select
                    name="serviceCategory"
                    value={formData.serviceCategory}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", backgroundColor: "#fff" }}
                >
                    <option value="">Select Category</option>
                    {serviceCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Years of Experience</label>
                    <input
                        name="yearsOfExperience"
                        type="number"
                        value={formData.yearsOfExperience}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                    />
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Hourly Rate (Rs.)</label>
                    <input
                        name="hourlyRate"
                        type="number"
                        value={formData.hourlyRate}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                    />
                </div>
            </div>
            <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Professional Bio</label>
                <textarea
                    name="professionalBio"
                    value={formData.professionalBio}
                    onChange={handleChange}
                    rows={4}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
                />
            </div>

            {user?.providerStatus === 'approved' && (
                <>
                    <h3 style={{ marginBottom: "16px", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>Today&apos;s Availability</h3>
                    <div style={{
                        marginBottom: "24px",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#f8fafc"
                    }}>
                        <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "14px" }}>
                            You are available today by default. Mark yourself unavailable only when you cannot take new jobs today. All confirmed booking dates are listed below.
                        </p>
                        <button
                            type="button"
                            onClick={handleAvailabilityToggle}
                            disabled={availabilitySaving}
                            style={{
                                padding: "12px 24px",
                                borderRadius: "8px",
                                border: "none",
                                background: isAvailableToday ? "#10b981" : "#94a3b8",
                                color: "#fff",
                                fontWeight: 600,
                                cursor: availabilitySaving ? "wait" : "pointer",
                                opacity: availabilitySaving ? 0.7 : 1
                            }}
                        >
                            {availabilitySaving
                                ? "Updating..."
                                : isAvailableToday
                                    ? "Available today — mark unavailable"
                                    : "Not available today — mark available"}
                        </button>
                        <div style={{
                            marginTop: "16px",
                            padding: "12px",
                            borderRadius: "8px",
                            backgroundColor: bookedDates.length > 0 ? "#fff7ed" : "#f1f5f9",
                            border: `1px solid ${bookedDates.length > 0 ? "#fed7aa" : "#e2e8f0"}`,
                            color: bookedDates.length > 0 ? "#9a3412" : "#64748b",
                            fontSize: "14px"
                        }}>
                            <strong>Booked dates:</strong>{" "}
                            {bookedDates.length > 0
                                ? bookedDates.map((d) => {
                                    const parsed = new Date(`${d}T00:00:00`);
                                    return Number.isNaN(parsed.getTime())
                                        ? d
                                        : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                                }).join(", ")
                                : "No confirmed bookings yet"}
                            {!isAvailableToday && bookedDates.length > 0 && (
                                <div style={{ marginTop: "8px", color: "#64748b" }}>
                                    You are not taking new jobs today, but customers can book you on your other open dates.
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <h3 style={{ marginBottom: "16px", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>Payment / Bank Details</h3>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Bank Name</label>
                <input
                    name="bankName"
                    value={bankData.bankName}
                    onChange={handleBankChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
            </div>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Account Number</label>
                <input
                    name="accountNumber"
                    value={bankData.accountNumber}
                    onChange={handleBankChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
            </div>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Account Holder Name</label>
                <input
                    name="accountHolderName"
                    value={bankData.accountHolderName}
                    onChange={handleBankChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
            </div>
            <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Branch</label>
                <input
                    name="branch"
                    value={bankData.branch}
                    onChange={handleBankChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
            </div>
            <button
                onClick={handleSave}
                disabled={saving}
                style={{
                    background: "#3b82f6",
                    color: "#fff",
                    padding: "14px 28px",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "16px",
                    opacity: saving ? 0.7 : 1,
                    width: "100%",
                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)"
                }}
            >
                {saving ? "Saving Changes..." : "Save Changes"}
            </button>
        </div>
    );
};

export default ProviderSettings;
