// src/pages/ReportIssue.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createComplaint, getComplaintByServiceRequest, reopenComplaint } from "../api/complaint";

const ReportIssue = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { booking } = location.state || {}; // get booking info if passed

    const [description, setDescription] = useState("");
    const [existingComplaint, setExistingComplaint] = useState(null);
    const [loadingComplaint, setLoadingComplaint] = useState(true);
    const providerName = booking?.provider || "";
    const providerPhone = booking?.phone || "";

    useEffect(() => {
        const loadComplaint = async () => {
            if (!booking?.id && !booking?.orderId) {
                setLoadingComplaint(false);
                return;
            }

            try {
                const id = booking?.id || booking?.orderId;
                const data = await getComplaintByServiceRequest(id);
                setExistingComplaint(data || null);
            } catch (error) {
                setExistingComplaint(null);
            } finally {
                setLoadingComplaint(false);
            }
        };

        loadComplaint();
    }, [booking]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createComplaint({
                serviceRequestId: booking?.id || booking?.orderId || undefined,
                providerName,
                providerPhone,
                subject: booking?.service || 'Service Issue',
                message: description
            });
            alert("Report submitted successfully!");
            navigate("/customer-dashboard");
        } catch (error) {
            console.error('Failed to submit report:', error);
            alert(error.response?.data?.message || 'Failed to submit report');
        }
    };

    const handleReopen = async () => {
        if (!existingComplaint?._id) return;
        try {
            await reopenComplaint(existingComplaint._id);
            alert('Complaint reopened.');
            const id = booking?.id || booking?.orderId;
            const data = await getComplaintByServiceRequest(id);
            setExistingComplaint(data || null);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to reopen complaint');
        }
    };

    const reopenAvailable = existingComplaint?.status === 'resolved' && existingComplaint?.reopenUntil
        ? Date.now() <= new Date(existingComplaint.reopenUntil).getTime()
        : false;

    return (
        <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
            <h2 style={{ marginBottom: "24px" }}>Report an Issue</h2>
            {loadingComplaint ? (
                <div>Loading complaint status...</div>
            ) : existingComplaint ? (
                <div style={{ marginBottom: "24px", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                    <div style={{ fontWeight: 600, marginBottom: "8px" }}>
                        Current Complaint Status: {existingComplaint.status === 'resolved' ? 'Resolved' : 'Open'}
                    </div>
                    {existingComplaint.status === 'resolved' && existingComplaint.reopenUntil && (
                        <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
                            Reopen available until: {new Date(existingComplaint.reopenUntil).toLocaleString()}
                        </div>
                    )}
                    {existingComplaint.status === 'resolved' && reopenAvailable && (
                        <button
                            type="button"
                            onClick={handleReopen}
                            style={{
                                background: "#f59e0b",
                                color: "#fff",
                                padding: "10px 18px",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: 600
                            }}
                        >
                            Reopen Complaint
                        </button>
                    )}
                    {existingComplaint.status === 'open' && (
                        <div style={{ fontSize: "13px", color: "#ef4444" }}>
                            Complaint is open. Please wait for admin resolution.
                        </div>
                    )}
                </div>
            ) : null}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                        Provider Name
                    </label>
                    <input
                        type="text"
                        value={providerName}
                        disabled
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                    />
                </div>
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                        Provider Phone
                    </label>
                    <input
                        type="text"
                        value={providerPhone}
                        disabled
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                    />
                </div>
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
                    disabled={Boolean(existingComplaint) && existingComplaint.status === 'open'}
                    style={{
                        background: "#3b82f6",
                        color: "#fff",
                        padding: "12px 24px",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: 600,
                        opacity: Boolean(existingComplaint) && existingComplaint.status === 'open' ? 0.7 : 1
                    }}
                >
                    Submit Report
                </button>
            </form>
        </div>
    );
};

export default ReportIssue;
