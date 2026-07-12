import React, { useState, useEffect, useContext } from "react";
import { Bell, Settings, LogOut, Calendar, Clock, MapPin, Edit, X } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { getUserServiceRequests, updateServiceRequest, acceptProviderOffer, rejectProviderOffer } from '../api/service';
import { AuthContext } from "../context/AuthContext";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("active");
  const [serviceRequests, setServiceRequests] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState({});

  // Helper function to display the correct status label
  const getStatusDisplay = (status) => {
    const statusMap = {
      'Accepted': 'Confirmed',
      'OfferSent': 'Offer Received',
      'Pending': 'Pending',
      'Completed': 'Completed',
      'Rejected': 'Rejected'
    };
    return statusMap[status] || status;
  };

  useEffect(() => {
    const fetchServiceRequests = async () => {
      try {
        const requests = await getUserServiceRequests();
        setServiceRequests(requests);
      } catch (error) {
        console.error('Failed to fetch service requests:', error);
      }
    };

    fetchServiceRequests();
  }, []);

  const handleEdit = (request) => {
    setEditingRequest(request);
    setFormData({ ...request });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateServiceRequest(editingRequest._id, formData);
      setServiceRequests(serviceRequests.map(req =>
        req._id === editingRequest._id ? { ...req, ...formData } : req
      ));
      setIsEditing(false);
      setEditingRequest(null);
    } catch (error) {
      console.error('Failed to update service request:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingRequest(null);
    setFormData({});
  };

  const handleAcceptOffer = async (requestId) => {
    try {
      await acceptProviderOffer(requestId);
      // Refresh service requests
      const requests = await getUserServiceRequests();
      setServiceRequests(requests);
      alert('Provider offer accepted successfully!');
    } catch (error) {
      console.error('Failed to accept offer:', error);
      alert('Failed to accept offer');
    }
  };

  const handleRejectOffer = async (requestId) => {
    try {
      await rejectProviderOffer(requestId);
      // Refresh service requests
      const requests = await getUserServiceRequests();
      setServiceRequests(requests);
      alert('Provider offer rejected. Request is now available for other providers.');
    } catch (error) {
      console.error('Failed to reject offer:', error);
      alert('Failed to reject offer');
    }
  };

  const activeBookings = serviceRequests.filter((request) => (
    request.status === 'Accepted' || request.status === 'Confirmed'
  ));

  const completedBookings = serviceRequests.filter((request) => request.status === 'Completed');

  const totalSpent = completedBookings.reduce((sum, request) => sum + (Number(request.budget) || 0), 0);

  const stats = [
    { label: "Active Requests", value: String(activeBookings.length), icon: "📋", bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    { label: "Completed", value: String(completedBookings.length), icon: "✓", bg: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)" },
    { label: "Total Spent", value: `Rs.${totalSpent}`, icon: "💳", bg: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" },
  ];

  const toBookingCard = (request) => {
    const providerName = request.providerId?.name || 'Provider';
    const statusLabel = getStatusDisplay(request.status);
    const isConfirmed = request.status === 'Accepted' || request.status === 'Confirmed';
    return {
      id: request._id,
      orderId: request._id,
      providerUserId: request.providerId?._id || null,
      provider: providerName,
      phone: request.providerId?.phone || '',
      service: request.serviceTitle,
      status: statusLabel,
      statusColor: isConfirmed ? "#1d4ed8" : "#ca8a04",
      statusBg: isConfirmed ? "#dbeafe" : "#fef3c7",
      date: `${request.preferredDate} at ${request.preferredTime}`,
      duration: request.estimatedDuration || 'N/A',
      location: request.location,
      amount: `Rs.${request.budget || 0}`,
      amountValue: Number(request.budget) || 0,
      canPayNow: request.status === 'Accepted' || request.status === 'Confirmed',
      canComplete: request.status === 'Accepted' || request.status === 'Confirmed',
      canReport: true,
    };
  };

  const bookings = activeBookings.map(toBookingCard);
  const completedCards = completedBookings.map(toBookingCard);

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>H</div>
            <span style={styles.logoText}>HireRight</span>
          </div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.iconWrapper}>
            <Bell size={20} color="#64748b" />
            <div style={styles.notificationDot}></div>
          </div>
          <div
            style={styles.iconButton}
            onClick={() => navigate("/customer-settings")}
          >
            <Settings size={20} color="#64748b" />
          </div>

          <div onClick={() => navigate('/login')} style={styles.logoutButton}>
            <LogOut size={18} />
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* CONTAINER */}
      <div style={styles.container}>
        {/* USER INFO */}
        <div style={styles.userSection}>
          <div style={styles.avatar}>JD</div>
          <div>
            <div style={styles.userName}>John Doe</div>
            <div style={styles.userRole}>Customer Account</div>
          </div>
        </div>

        {/* STATS */}
        <div style={styles.statsGrid}>
          {stats.map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={styles.statCardInner}>
                <div style={styles.statContent}>
                  <div style={styles.statLabel}>{s.label}</div>
                  <div style={styles.statValue}>{s.value}</div>
                </div>
                <div style={{ ...styles.statIcon, background: s.bg }}>
                  <span style={styles.statEmoji}>{s.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* POST BUTTON */}
        <button onClick={() => navigate('/service-request')} style={styles.postButton}>
          <span style={styles.postButtonIcon}>+</span>
          <span>Post New Service Request</span>
        </button>

        {/* TABS */}
        <div style={styles.tabsContainer}>
          <div style={styles.tabs}>
            <button
              onClick={() => setActiveTab("active")}
              style={activeTab === "active" ? { ...styles.tab, ...styles.activeTab } : styles.tab}
            >
              Active Bookings
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              style={activeTab === "completed" ? { ...styles.tab, ...styles.activeTab } : styles.tab}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveTab("posts")}
              style={activeTab === "posts" ? { ...styles.tab, ...styles.activeTab } : styles.tab}
            >
              My Posts
            </button>
          </div>
        </div>

        {/* BOOKINGS GRID */}
        {activeTab === "posts" ? (
          <div style={styles.bookingsGrid}>
            {serviceRequests.map((request) => (
              <div key={request._id} style={styles.postCard}>
                {/* HEADER */}
                <div style={styles.postCardHeader}>
                  <div style={styles.serviceTitle}>{request.serviceTitle}</div>
                  <button onClick={() => handleEdit(request)} style={styles.editBtn}>
                    <Edit size={16} />
                  </button>
                </div>

                {/* CATEGORY BADGE */}
                <div style={styles.categoryBadge}>{request.serviceCategory}</div>

                {/* DESCRIPTION */}
                <div style={styles.description}>{request.description}</div>

                {/* DETAILS */}
                <div style={styles.detailsList}>
                  <div style={styles.detailRow}>
                    <Calendar size={16} color="#3b82f6" />
                    <span>{request.preferredDate} at {request.preferredTime}</span>
                  </div>
                  {request.estimatedDuration && (
                    <div style={styles.detailRow}>
                      <Clock size={16} color="#3b82f6" />
                      <span>{request.estimatedDuration}</span>
                    </div>
                  )}
                  <div style={styles.detailRow}>
                    <MapPin size={16} color="#3b82f6" />
                    <span>{request.location}</span>
                  </div>
                </div>

                {/* FOOTER */}
                <div style={styles.postCardFooter}>
                  <div style={styles.budgetSection}>
                    <span style={styles.budgetLabel}>Budget</span>
                    <span style={styles.budgetValue}>Rs.{request.budget}</span>
                  </div>
                  <div style={styles.statusBadge}>{getStatusDisplay(request.status)}</div>
                </div>

                {/* PROVIDER OFFER SECTION */}
                {request.status === 'OfferSent' && request.providerOffer && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #e0f2fe, #dbeafe)',
                    borderRadius: '12px',
                    border: '2px solid #3b82f6'
                  }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', marginBottom: '12px' }}>
                      🎯 Provider Offer Received!
                    </div>

                    {request.providerOffer.message && (
                      <div style={{ fontSize: '14px', color: '#1e40af', marginBottom: '8px', fontStyle: 'italic' }}>
                        "{request.providerOffer.message}"
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '14px' }}>
                      <div>
                        <span style={{ color: '#64748b' }}>Proposed Price: </span>
                        <span style={{ fontWeight: '700', color: '#1e293b' }}>Rs.{request.providerOffer.proposedPrice}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Proposed Date: </span>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{request.providerOffer.proposedDate}</span>
                      </div>
                    </div>

                    {request.providerOffer.customerResponse === 'pending' && (
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => handleAcceptOffer(request._id)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                          ✓ Accept Offer
                        </button>
                        <button
                          onClick={() => handleRejectOffer(request._id)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            border: '2px solid #ef4444',
                            background: 'white',
                            color: '#ef4444',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                          ✗ Reject Offer
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* DIRECT BOOKING RESPONSE SECTION */}
                {request.bookingType === 'direct' && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: request.providerResponse?.status === 'accepted'
                      ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)'
                      : request.providerResponse?.status === 'rejected'
                        ? 'linear-gradient(135deg, #fee2e2, #fecaca)'
                        : 'linear-gradient(135deg, #f3e8ff, #e9d5ff)',
                    borderRadius: '12px',
                    border: '2px solid ' + (
                      request.providerResponse?.status === 'accepted'
                        ? '#10b981'
                        : request.providerResponse?.status === 'rejected'
                          ? '#ef4444'
                          : '#a78bfa'
                    )
                  }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
                      {request.providerResponse?.status === 'pending' && '⏳ Provider Reviewing...'}
                      {request.providerResponse?.status === 'accepted' && '✓ Booking Confirmed!'}
                      {request.providerResponse?.status === 'rejected' && '✗ Booking Rejected'}
                    </div>

                    {request.providerResponse?.responseMessage && (
                      <div style={{ fontSize: '14px', color: '#374151', fontStyle: 'italic', marginBottom: '8px' }}>
                        "{request.providerResponse.responseMessage}"
                      </div>
                    )}

                    {request.providerResponse?.respondedAt && (
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Responded at: {new Date(request.providerResponse.respondedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.bookingsGrid}>
            {(activeTab === 'active' ? bookings : completedCards).map((b) => (
              <div key={b.id} style={styles.bookingCard}>
                {/* PROVIDER */}
                <div style={styles.providerRow}>
                  <div style={styles.providerAvatar}>
                    {b.provider.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div style={styles.providerInfo}>
                    <div style={styles.providerName}>{b.provider}</div>
                    {b.phone && (
                      <div style={styles.ratingRow}>
                        <span style={styles.ratingText}>{b.phone}</span>
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      ...styles.statusTag,
                      color: b.statusColor,
                      backgroundColor: b.statusBg,
                    }}
                  >
                    {b.status}
                  </div>
                </div>

                {/* SERVICE TITLE */}
                <div style={styles.serviceTitle}>{b.service}</div>

                {/* DETAILS */}
                <div style={styles.detailsList}>
                  <div style={styles.detailRow}>
                    <Calendar size={16} color="#3b82f6" />
                    <span>{b.date}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <Clock size={16} color="#3b82f6" />
                    <span>{b.duration}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <MapPin size={16} color="#3b82f6" />
                    <span>{b.location}</span>
                  </div>
                </div>

                {/* AMOUNT */}
                <div style={styles.amountRow}>
                  <span style={styles.amountLabel}>Total Amount</span>
                  <span style={styles.amountValue}>{b.amount}</span>
                </div>

                {/* ACTION BUTTONS */}
                <div style={styles.actionButtons}>
                  {b.canComplete && (
                    <button style={styles.completeBtn}>Mark Task Completed</button>
                  )}
                  {b.canPayNow && (
                    <button
                      onClick={() => navigate('/payment', {
                        state: {
                          booking: b,
                          fromDashboard: true
                        }
                      })}
                      style={styles.payNow}
                    >
                      Pay Now
                    </button>
                  )}
                </div>
                {b.canReport && (
                  <button
                    style={styles.reportBtn}
                    onClick={() => navigate("/report-issue", { state: { booking: b } })}
                  >
                    Report Issue
                  </button>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {isEditing && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Service Request</h2>
              <button onClick={handleCancel} style={styles.closeBtn}>
                <X size={24} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Service Title</label>
                <input
                  type="text"
                  value={formData.serviceTitle || ''}
                  onChange={(e) => setFormData({ ...formData, serviceTitle: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Service Category</label>
                <input
                  type="text"
                  value={formData.serviceCategory || ''}
                  onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={styles.textarea}
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Preferred Date</label>
                  <input
                    type="date"
                    value={formData.preferredDate || ''}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Preferred Time</label>
                  <input
                    type="time"
                    value={formData.preferredTime || ''}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Estimated Duration</label>
                <input
                  type="text"
                  value={formData.estimatedDuration || ''}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Budget</label>
                <input
                  type="number"
                  value={formData.budget || ''}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Location</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Specific Requirements</label>
                <textarea
                  value={formData.specificRequirements || ''}
                  onChange={(e) => setFormData({ ...formData, specificRequirements: e.target.value })}
                  style={styles.textarea}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={handleCancel} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSave} style={styles.saveBtn}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------ INLINE STYLES ------------------------------ */
const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  /* HEADER */
  header: {
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    padding: "16px 48px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoIcon: {
    width: "40px",
    height: "40px",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: "700",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconWrapper: {
    position: "relative",
    padding: "10px",
    borderRadius: "10px",
    cursor: "pointer",
    backgroundColor: "#f1f5f9",
    transition: "all 0.2s ease",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: "#3b82f6",
    borderRadius: "50%",
    border: "2px solid #fff",
  },
  iconButton: {
    padding: "10px",
    borderRadius: "10px",
    backgroundColor: "#f1f5f9",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    borderRadius: "10px",
    backgroundColor: "#f1f5f9",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    color: "#475569",
    border: "none",
    transition: "all 0.2s ease",
  },

  /* CONTAINER */
  container: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "48px 32px",
  },

  /* USER */
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "40px",
    padding: "24px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  avatar: {
    width: "72px",
    height: "72px",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    borderRadius: "50%",
    color: "white",
    fontSize: "28px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 700,
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
  },
  userName: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "4px",
  },
  userRole: {
    color: "#64748b",
    fontSize: "15px",
    fontWeight: "500",
  },

  /* STATS GRID */
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },
  statCard: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    transition: "all 0.3s ease",
  },
  statCardInner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "8px",
  },
  statValue: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#0f172a",
  },
  statIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "14px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "24px",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)",
  },
  statEmoji: {
    fontSize: "28px",
    filter: "brightness(0) invert(1)",
  },

  /* POST BUTTON */
  postButton: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#fff",
    padding: "16px 32px",
    borderRadius: "12px",
    fontWeight: "600",
    border: "none",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    marginBottom: "32px",
    boxShadow: "0 4px 16px rgba(59, 130, 246, 0.3)",
    fontSize: "16px",
    transition: "all 0.3s ease",
  },
  postButtonIcon: {
    fontSize: "20px",
    fontWeight: "600",
  },

  /* TABS */
  tabsContainer: {
    marginBottom: "32px",
  },
  tabs: {
    display: "inline-flex",
    gap: "8px",
    padding: "6px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  tab: {
    padding: "12px 24px",
    borderRadius: "8px",
    background: "transparent",
    color: "#64748b",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },
  activeTab: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
  },

  /* BOOKINGS GRID */
  bookingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
    gap: "24px",
  },

  /* POST CARD */
  postCard: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    transition: "all 0.3s ease",
  },
  postCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  categoryBadge: {
    display: "inline-block",
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: "600",
    borderRadius: "8px",
    background: "#dbeafe",
    color: "#1e40af",
    marginBottom: "16px",
  },
  description: {
    color: "#475569",
    fontSize: "14px",
    lineHeight: "1.6",
    marginBottom: "16px",
  },
  postCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "16px",
    borderTop: "1px solid #e2e8f0",
  },
  budgetSection: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  budgetLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
  },
  budgetValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#3b82f6",
  },

  /* BOOKING CARD */
  bookingCard: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    transition: "all 0.3s ease",
  },
  providerRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "20px",
    paddingBottom: "20px",
    borderBottom: "1px solid #f1f5f9",
  },
  providerAvatar: {
    width: "52px",
    height: "52px",
    background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
    color: "#1e40af",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 700,
    fontSize: "18px",
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "4px",
  },
  ratingRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
  },
  ratingText: {
    color: "#64748b",
    fontWeight: "600",
  },
  statusTag: {
    padding: "6px 14px",
    fontSize: "12px",
    borderRadius: "8px",
    fontWeight: "600",
  },
  serviceTitle: {
    color: "#3b82f6",
    fontWeight: 700,
    fontSize: "18px",
    marginBottom: "16px",
  },
  detailsList: {
    marginBottom: "20px",
  },
  detailRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    color: "#475569",
    marginBottom: "10px",
    fontWeight: "500",
  },
  amountRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "20px",
    marginBottom: "20px",
    borderBottom: "1px solid #f1f5f9",
  },
  amountLabel: {
    color: "#64748b",
    fontWeight: "500",
    fontSize: "14px",
  },
  amountValue: {
    fontWeight: 700,
    color: "#3b82f6",
    fontSize: "24px",
  },
  actionButtons: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
  },
  payNow: {
    flex: 1,
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#fff",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
  },
  completeBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    color: "#475569",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },
  reportBtn: {
    width: "100%",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #fecaca",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },

  /* EDIT BUTTON */
  editBtn: {
    backgroundColor: "#f1f5f9",
    color: "#3b82f6",
    border: "1px solid #e2e8f0",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },

  /* STATUS BADGE */
  statusBadge: {
    padding: "6px 14px",
    fontSize: "12px",
    borderRadius: "8px",
    fontWeight: "600",
    background: "#dbeafe",
    color: "#1e40af",
  },

  /* MODAL */
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "540px",
    maxHeight: "85vh",
    overflow: "auto",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.2)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px",
    borderBottom: "1px solid #e2e8f0",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    padding: "4px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
  },
  modalBody: {
    padding: "24px",
  },
  formGroup: {
    marginBottom: "20px",
    flex: 1,
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#334155",
    fontSize: "14px",
  },
  formRow: {
    display: "flex",
    gap: "16px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "inherit",
    transition: "all 0.2s ease",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "inherit",
    minHeight: "100px",
    resize: "vertical",
    transition: "all 0.2s ease",
    outline: "none",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "24px",
    borderTop: "1px solid #e2e8f0",
  },
  cancelBtn: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    padding: "12px 24px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },
  saveBtn: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#fff",
    padding: "12px 24px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
    transition: "all 0.2s ease",
  },
};

export default CustomerDashboard;