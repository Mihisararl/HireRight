// src/pages/ReportIssue.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ReportIssue = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { booking } = location.state || {}; // get booking info if passed

    const [description, setDescription] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        // Call your API to submit report
        console.log("Report submitted for:", booking, "Description:", description);
        alert("Report submitted successfully!");
        navigate("/customer-dashboard");
    };

    return (
        <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
            <h2 style={{ marginBottom: "24px" }}>Report an Issue</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                        Service
                    </label>
                    <input
                        type="text"
                        value={booking?.service || ""}
                        disabled
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                    />
                </div>
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                        Issue Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows={6}
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                    />
                </div>
                <button
                    type="submit"
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
                    Submit Report
                </button>
            </form>
        </div>
    );
};

export default ReportIssue;
