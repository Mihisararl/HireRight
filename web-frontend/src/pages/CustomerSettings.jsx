// src/pages/CustomerSettings.jsx
import React, { useState, useEffect } from "react";

const CustomerSettings = () => {
    const [formData, setFormData] = useState({
        name: "John Doe",
        email: "john@example.com",
        phone: "123-456-7890",
        // add other fields you need
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        // Call your API to update profile here
        console.log("Profile updated:", formData);
        alert("Profile updated successfully!");
    };

    return (
        <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
            <h2 style={{ marginBottom: "24px" }}>Profile Settings</h2>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>Name</label>
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                />
            </div>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>Email</label>
                <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                />
            </div>
            <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>Phone</label>
                <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                />
            </div>
            <button
                onClick={handleSave}
                style={{
                    background: "#3b82f6",
                    color: "#fff",
                    padding: "12px 24px",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                }}
            >
                Save Changes
            </button>
        </div>
    );
};

export default CustomerSettings;
