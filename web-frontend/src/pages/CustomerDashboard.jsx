import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Settings, LogOut, Calendar, MapPin, Edit, X, CheckCircle, Plus, FileText, Briefcase, LayoutDashboard } from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getUserServiceRequests,
  updateServiceRequest,
  acceptProviderOffer,
  rejectProviderOffer,
  confirmDirectBookingProposal,
  rejectDirectBookingProposal,
  completeServiceRequestByCustomer,
} from '../api/service';
import CustomerEstimateReview from '../components/offers/CustomerEstimateReview';
import CustomerDashboardAnalytics from '../components/customer/CustomerDashboardAnalytics';
import { getEstimateFromRequest, isPendingCustomerConfirmation } from '../utils/serviceAgreement';
import { getUserPayments } from '../api/payment';
import { getUserComplaints } from '../api/complaint';
import { createReview, getUserReviews } from '../api/review';
import { AuthContext } from "../context/AuthContext";
import LocationPicker from '../components/location/LocationPicker';
import CustomerProviderTracking from '../components/location/CustomerProviderTracking';
import ProviderOfferProfile from '../components/offers/ProviderOfferProfile';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { formatLocationDisplay, hasCoordinates, getRequestDailyBudget, getRequestPayableAmount, getRequestDisplayAmount } from '../utils/locationHelpers';
import {
  formatLkr,
  getPaymentBreakdown,
  getSettlementTypeLabel,
  isPaymentSettled,
} from '../utils/paymentHelpers';
import '../styles/CustomerDashboard.css';

const isPendingProviderOffer = (request) => isPendingCustomerConfirmation(request);

const CustomerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("overview");
  const [serviceRequests, setServiceRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewThanks, setReviewThanks] = useState('');
  const [highlightBookingId, setHighlightBookingId] = useState(null);
  const bookingCardRefs = useRef({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState({});
  const previousOfferCountRef = useRef(0);

  const refreshServiceRequests = useCallback(async () => {
    try {
      const requests = await getUserServiceRequests();
      setServiceRequests(requests);
      return requests;
    } catch (error) {
      console.error('Failed to fetch service requests:', error);
      return null;
    }
  }, []);

  const getStatusDisplay = (status) => {
    const statusMap = {
      'Accepted': t('customer.status.confirmed'),
      'OfferSent': t('customer.status.offerReceived'),
      'Pending': t('customer.status.pending'),
      'Completed': t('customer.status.completed'),
      'Rejected': t('customer.status.rejected')
    };
    return statusMap[status] || status;
  };

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state?.tab]);

  const refreshPayments = useCallback(async () => {
    try {
      const paymentList = await getUserPayments();
      setPayments(paymentList || []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      const requests = await refreshServiceRequests();
      if (!requests) return;

      try {
        await refreshPayments();
        const complaintList = await getUserComplaints();
        setComplaints(complaintList || []);
        const reviewList = await getUserReviews();
        setReviews(reviewList || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    loadDashboardData();
  }, [refreshServiceRequests, refreshPayments]);

  useEffect(() => {
    if (!location.state?.paymentSuccess) return;

    refreshPayments();
    setActiveTab(location.state?.tab || 'overview');
    navigate(location.pathname, { replace: true, state: { tab: location.state?.tab || 'active' } });
  }, [location.state?.paymentSuccess, location.pathname, location.state?.tab, navigate, refreshPayments]);

  useEffect(() => {
    const pollOffers = async () => {
      await refreshServiceRequests();
      await refreshPayments();
    };

    const intervalId = setInterval(pollOffers, 30000);
    const handleFocus = () => pollOffers();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshServiceRequests, refreshPayments]);

  useEffect(() => {
    const refreshComplaints = async () => {
      try {
        const complaintList = await getUserComplaints();
        setComplaints(complaintList || []);
      } catch (error) {
        console.error('Failed to refresh complaints:', error);
      }
    };

    const intervalId = setInterval(refreshComplaints, 30000);
    const handleFocus = () => refreshComplaints();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleEdit = (request) => {
    setEditingRequest(request);
    const loc = request.location;
    const normalizedLocation = typeof loc === 'string'
      ? { address: loc }
      : {
        ...(loc?.lat != null && loc?.lng != null ? { lat: loc.lat, lng: loc.lng } : {}),
        address: loc?.address || '',
      };
    setFormData({ ...request, location: normalizedLocation });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (formData.location && !hasCoordinates(formData.location)) {
      alert(t('customer.alerts.selectMapLocation'));
      return;
    }
    try {
      const payload = { ...formData };
      delete payload.estimatedDuration;
      if (payload.dailyBudget !== undefined && payload.dailyBudget !== '') {
        payload.dailyBudget = Number(payload.dailyBudget);
      }
      delete payload.budget;
      await updateServiceRequest(editingRequest._id, payload);
      setServiceRequests(serviceRequests.map(req =>
        req._id === editingRequest._id ? { ...req, ...payload } : req
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
      const requests = await refreshServiceRequests();
      if (requests) setServiceRequests(requests);
      alert(t('customer.alerts.offerAccepted'));
    } catch (error) {
      console.error('Failed to accept offer:', error);
      alert(t('customer.alerts.failedAcceptOffer'));
    }
  };

  const handleRejectOffer = async (requestId) => {
    try {
      await rejectProviderOffer(requestId);
      const requests = await refreshServiceRequests();
      if (requests) setServiceRequests(requests);
      alert(t('customer.alerts.offerRejected'));
    } catch (error) {
      console.error('Failed to reject offer:', error);
      alert(t('customer.alerts.failedRejectOffer'));
    }
  };

  const handleConfirmDirectProposal = async (requestId) => {
    try {
      await confirmDirectBookingProposal(requestId);
      const requests = await refreshServiceRequests();
      if (requests) setServiceRequests(requests);
      alert(t('customer.alerts.bookingConfirmed'));
    } catch (error) {
      console.error('Failed to confirm booking:', error);
      alert(error.response?.data?.message || t('customer.alerts.failedAcceptOffer'));
    }
  };

  const handleRejectDirectProposal = async (requestId) => {
    try {
      await rejectDirectBookingProposal(requestId);
      const requests = await refreshServiceRequests();
      if (requests) setServiceRequests(requests);
      alert(t('customer.alerts.offerRejected'));
    } catch (error) {
      console.error('Failed to reject booking proposal:', error);
      alert(t('customer.alerts.failedRejectOffer'));
    }
  };

  const handleCompleteBooking = async (requestId) => {
    try {
      await completeServiceRequestByCustomer(requestId);
      const requests = await getUserServiceRequests();
      setServiceRequests(requests);
      alert(t('customer.alerts.completionRecorded'));
    } catch (error) {
      console.error('Failed to complete request:', error);
      alert(error.response?.data?.message || t('customer.alerts.failedComplete'));
    }
  };

  const activeBookings = serviceRequests.filter((request) => (
    request.status === 'Accepted' || request.status === 'Confirmed'
  ));

  const completedBookings = serviceRequests.filter((request) => request.status === 'Completed');

  const pendingOffers = serviceRequests.filter(isPendingProviderOffer);
  const pendingOfferCount = pendingOffers.length;

  const totalSpent = completedBookings.reduce((sum, request) => {
    const payment = payments.find((item) => String(item.serviceRequestId) === String(request._id));
    return sum + getRequestDisplayAmount(request, payment);
  }, 0);

  const stats = [
    { key: 'active', label: t('customer.stats.active'), value: String(activeBookings.length) },
    { key: 'completed', label: t('customer.stats.completed'), value: String(completedBookings.length) },
    { key: 'spent', label: t('customer.stats.totalSpent'), value: `Rs.${totalSpent.toLocaleString()}` },
    { key: 'offers', label: t('customer.analytics.offers'), value: String(pendingOfferCount) },
  ];

  const tabDescriptions = {
    overview: t('customer.tabDesc.overview'),
    active: t('customer.tabDesc.active'),
    completed: t('customer.tabDesc.completed'),
    posts: t('customer.tabDesc.posts'),
  };

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'CU';

  const renderAvatar = (className) => (
    user?.profilePhoto ? (
      <img src={user.profilePhoto} alt={user?.name || 'Profile'} />
    ) : (
      userInitials
    )
  );

  const toBookingCard = (request) => {
    const providerName = request.providerId?.name || t('customer.providerFallback');
    const statusLabel = getStatusDisplay(request.status);
    const isConfirmed = request.status === 'Accepted' || request.status === 'Confirmed';
    const isCompleted = request.status === 'Completed';
    const isPayableStatus = isConfirmed || isCompleted;
    const providerCompleted = Boolean(request.providerCompleted);
    const customerCompleted = Boolean(request.customerCompleted);
    const payment = payments.find((item) => String(item.serviceRequestId) === String(request._id));
    const isPaid = Boolean(payment);
    const payableAmount = getRequestPayableAmount(request);
    const displayAmount = getRequestDisplayAmount(request, payment);
    const amountForCard = isCompleted || isPaid
      ? displayAmount
      : payableAmount;
    const paymentSettled = isPaymentSettled(payment);
    const paymentReleased = payment?.payoutStatus === 'paid';
    const paymentBreakdown = payment ? getPaymentBreakdown(payment) : null;
    const complaint = complaints.find((item) => String(item.serviceRequestId) === String(request._id));
    return {
      id: request._id,
      orderId: request._id,
      providerUserId: request.providerId?._id || null,
      provider: providerName,
      phone: request.providerId?.phone || '',
      service: request.serviceTitle,
      status: statusLabel,
      statusColor: isCompleted ? "#059669" : isConfirmed ? "#1d4ed8" : "#ca8a04",
      statusBg: isCompleted ? "#d1fae5" : isConfirmed ? "#dbeafe" : "#fef3c7",
      date: `${request.preferredDate} at ${request.preferredTime}`,
      location: formatLocationDisplay(request.location),
      customerLocation: request.location,
      amount: `Rs.${amountForCard.toLocaleString()}`,
      amountValue: amountForCard,
      canPayNow: isPayableStatus && !isPaid && payableAmount > 0,
      isPaid,
      canComplete: isConfirmed && !customerCompleted,
      customerCompleted,
      providerCompleted,
      awaitingProviderConfirmation: customerCompleted && !providerCompleted && isConfirmed,
      canReport: !paymentSettled,
      complaintStatus: complaint?.status || null,
      paymentReleased,
      paymentSettled,
      paymentBreakdown,
    };
  };

  const handleReviewSubmit = async () => {
    if (!reviewTarget) return;
    setReviewSaving(true);
    try {
      await createReview({
        serviceRequestId: reviewTarget.id,
        rating: reviewRating,
        comment: reviewComment
      });
      const reviewList = await getUserReviews();
      setReviews(reviewList || []);
      setReviewModalOpen(false);
      setReviewTarget(null);
      setReviewThanks(t('customer.reviewThanks'));
      setTimeout(() => setReviewThanks(''), 4000);
    } catch (error) {
      alert(error.response?.data?.message || t('customer.alerts.failedReview'));
    } finally {
      setReviewSaving(false);
    }
  };

  const handleReviewRemindLater = () => {
    if (reviewTarget) {
      const remindUntil = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem(`review_remind_${reviewTarget.id}`, String(remindUntil));
    }
    setReviewModalOpen(false);
    setReviewTarget(null);
  };

  const bookings = activeBookings.map(toBookingCard);
  const completedCards = completedBookings.map(toBookingCard);
  const pendingPosts = serviceRequests.filter((request) => (
    request.status === 'Pending' || request.status === 'OfferSent' || request.status === 'ProviderRejected'
  ));
  const offersInitializedRef = useRef(false);

  const scrollToBooking = (bookingId) => {
    setTimeout(() => {
      bookingCardRefs.current[bookingId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const handlePaymentDueClick = () => {
    const dueBookings = [...bookings, ...completedCards].filter((b) => b.canPayNow);
    if (dueBookings.length === 0) {
      setActiveTab('active');
      return;
    }
    if (dueBookings.length === 1) {
      navigate('/payment', { state: { booking: dueBookings[0], fromDashboard: true } });
      return;
    }
    const firstDue = dueBookings[0];
    const onCompletedTab = completedCards.some((c) => String(c.id) === String(firstDue.id));
    setActiveTab(onCompletedTab ? 'completed' : 'active');
    setHighlightBookingId(dueBookings[0].id);
    scrollToBooking(dueBookings[0].id);
    setTimeout(() => setHighlightBookingId(null), 4000);
  };

  const handleReviewClick = () => {
    const reviewedIds = new Set(reviews.map((review) => String(review.serviceRequestId)));
    const target = completedCards.find((card) => (
      card.paymentReleased && !reviewedIds.has(String(card.id))
    ));
    setActiveTab('completed');
    if (!target) return;
    scrollToBooking(target.id);
    setReviewTarget(target);
    setReviewRating(5);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  const handleComplaintClick = () => {
    const openComplaint = complaints.find((c) => c.status === 'open');
    if (!openComplaint) {
      setActiveTab('active');
      return;
    }
    const serviceRequestId = String(openComplaint.serviceRequestId?._id || openComplaint.serviceRequestId);
    const activeMatch = bookings.find((b) => String(b.id) === serviceRequestId);
    const completedMatch = completedCards.find((b) => String(b.id) === serviceRequestId);
    const target = activeMatch || completedMatch;
    if (target) {
      setActiveTab(activeMatch ? 'active' : 'completed');
      setHighlightBookingId(target.id);
      scrollToBooking(target.id);
      setTimeout(() => setHighlightBookingId(null), 4000);
      return;
    }
    setActiveTab('active');
  };

  const sectionTitles = {
    overview: t('customer.sidebar.dashboard'),
    active: t('customer.activeBookings'),
    completed: t('customer.sidebar.completedTasks'),
    posts: t('customer.myPosts'),
  };

  useEffect(() => {
    const baseTitle = t('customer.dashboardTitle');
    document.title = pendingOfferCount > 0
      ? t('customer.dashboardTitleWithOffers', { count: pendingOfferCount })
      : baseTitle;
    return () => {
      document.title = t('common.appName');
    };
  }, [pendingOfferCount, t]);

  useEffect(() => {
    if (!offersInitializedRef.current) {
      offersInitializedRef.current = true;
      previousOfferCountRef.current = pendingOfferCount;
      return;
    }
    if (pendingOfferCount > previousOfferCountRef.current) {
      setActiveTab('posts');
    }
    previousOfferCountRef.current = pendingOfferCount;
  }, [pendingOfferCount]);

  useEffect(() => {
    if (reviewModalOpen) return;
    const reviewedIds = new Set(reviews.map((review) => String(review.serviceRequestId)));
    const remindKey = (id) => `review_remind_${id}`;
    const now = Date.now();

    const pending = completedCards.find((card) => {
      if (!card.paymentReleased) return false;
      if (reviewedIds.has(String(card.id))) return false;
      const reminder = localStorage.getItem(remindKey(card.id));
      if (!reminder) return true;
      const remindUntil = Number(reminder);
      return Number.isNaN(remindUntil) || now > remindUntil;
    });

    if (pending) {
      setReviewTarget(pending);
      setReviewRating(5);
      setReviewComment('');
      setReviewModalOpen(true);
    }
  }, [completedCards, reviews, reviewModalOpen]);

  return (
    <div className="dashboard-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

        .dashboard-page {
          min-height: 100vh;
          background: #f1f5f9;
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #1e293b;
        }

        .dashboard-page::before,
        .dashboard-page::after {
          display: none;
        }

        .dashboard-header {
          background-color: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          padding: 16px 48px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 22px;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
          overflow: hidden;
        }

        .logo-icon-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .logo-text {
          font-size: 22px;
          font-weight: 800;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .icon-btn {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .icon-btn:hover {
          transform: translateY(-2px);
          background-color: #f8fafc;
          border-color: #cbd5e1;
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
        }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          background-color: #ef4444;
          border-radius: 50%;
          border: 2px solid #fff;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
          background-color: #ffffff;
          border: 1px solid #fee2e2;
          color: #ef4444;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.05);
        }

        .logout-btn:hover {
          background-color: #ef4444;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }

        .dashboard-container {
          max-width: none;
          margin: 0;
          padding: 24px 28px 40px;
          position: relative;
          z-index: 1;
        }

        .user-section-card {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 32px;
          padding: 28px;
          background: linear-gradient(#ffffff, #ffffff) padding-box,
            linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(14, 165, 233, 0.4)) border-box;
          border: 1px solid transparent;
          border-radius: 24px;
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
        }

        .user-avatar {
          width: 76px;
          height: 76px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 20px;
          color: white;
          font-size: 30px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 800;
          box-shadow: 0 12px 30px rgba(37, 99, 235, 0.3);
          transform: rotate(-3deg);
          transition: all 0.3s ease;
          border: 3px solid rgba(255, 255, 255, 0.9);
          overflow: hidden;
        }

        .user-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 18px;
        }

        .user-section-card:hover .user-avatar {
          transform: rotate(0deg) scale(1.05);
        }

        .user-name-title {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .user-role-badge {
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
          background: #f1f5f9;
          padding: 4px 12px;
          border-radius: 20px;
          display: inline-block;
        }

        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .stat-card-item {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          padding: 24px;
          border-radius: 20px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
          position: relative;
          overflow: hidden;
        }

        .stat-card-item::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.6), rgba(14, 165, 233, 0.6));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .stat-card-item:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.12);
          border-color: rgba(59, 130, 246, 0.2);
        }

        .stat-card-item:hover::after {
          opacity: 1;
        }

        .stat-card-inner-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-info-col {
          flex: 1;
        }

        .stat-card-label {
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .stat-card-value {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
        }

        .stat-icon-badge {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 24px;
          color: white;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
        }

        .post-request-btn {
          background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%);
          color: #fff;
          padding: 16px 36px;
          border-radius: 18px;
          font-weight: 700;
          font-size: 16px;
          border: none;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          margin-bottom: 36px;
          box-shadow: 0 10px 26px rgba(37, 99, 235, 0.28);
          transition: all 0.3s ease;
          letter-spacing: 0.2px;
        }

        .post-request-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        }

        .post-request-btn:active {
          transform: translateY(0);
        }

        .tabs-navigation {
          margin-bottom: 32px;
        }

        .tabs-nav-box {
          display: inline-flex;
          gap: 6px;
          padding: 6px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(226, 232, 240, 0.7));
          backdrop-filter: blur(10px);
          border-radius: 18px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
        }

        .tab-nav-button {
          padding: 12px 28px;
          border-radius: 12px;
          background: transparent;
          color: #64748b;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .tab-nav-button:hover {
          color: #0f172a;
        }

        .tab-nav-button-active {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #fff !important;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
        }

        .tab-nav-button-wrap {
          position: relative;
          display: inline-flex;
        }

        .tab-notification-dot {
          position: absolute;
          top: 6px;
          right: 8px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: #ef4444;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.45);
          animation: offerPulse 1.6s ease-in-out infinite;
        }

        .tab-nav-button-active .tab-notification-dot {
          border-color: #2563eb;
        }

        .notification-bell-btn {
          position: relative;
          cursor: pointer;
        }

        .notification-bell-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.45);
        }

        .offer-alert-banner {
          margin-bottom: 20px;
          padding: 14px 18px;
          border-radius: 14px;
          background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
          border: 1px solid #fdba74;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          cursor: pointer;
          animation: fadeUp 0.35s ease;
        }

        .offer-alert-banner:hover {
          box-shadow: 0 8px 20px rgba(249, 115, 22, 0.15);
        }

        .offer-alert-title {
          font-size: 15px;
          font-weight: 700;
          color: #9a3412;
          margin-bottom: 4px;
        }

        .offer-alert-text {
          font-size: 13px;
          color: #c2410c;
        }

        .offer-alert-action {
          background: #ea580c;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .item-card-has-offer {
          border: 2px solid #fb923c !important;
          box-shadow: 0 12px 28px rgba(249, 115, 22, 0.18) !important;
        }

        .offer-new-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ef4444;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.4px;
          padding: 4px 10px;
          border-radius: 999px;
          margin-bottom: 8px;
          animation: offerPulse 1.6s ease-in-out infinite;
        }

        .offer-new-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #fff;
        }

        @keyframes offerPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.92; }
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 28px;
        }

        .item-card {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          padding: 28px;
          border-radius: 24px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .item-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 55%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .item-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
          border-color: rgba(59, 130, 246, 0.2);
        }

        .item-card:hover::before {
          opacity: 1;
        }

        .item-card-title {
          color: #0f172a;
          font-weight: 800;
          font-size: 20px;
          line-height: 1.4;
          margin-bottom: 8px;
          letter-spacing: -0.3px;
        }

        .item-card-category {
          display: inline-block;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 700;
          border-radius: 20px;
          background: #eff6ff;
          color: #2563eb;
          margin-bottom: 16px;
          text-transform: capitalize;
        }

        .item-card-desc {
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .item-details-list {
          background-color: #f8fafc;
          padding: 16px;
          border-radius: 16px;
          margin-bottom: 20px;
          border: 1px solid #f1f5f9;
        }

        .item-detail-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: #475569;
          margin-bottom: 10px;
          font-weight: 500;
        }

        .item-detail-row:last-child {
          margin-bottom: 0;
        }

        .item-card-footer-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 18px;
          border-top: 1px solid #f1f5f9;
        }

        .item-budget-box {
          display: flex;
          flex-direction: column;
        }

        .item-budget-lbl {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
        }

        .item-budget-val {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          background: linear-gradient(135deg, #10b981, #22c55e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .item-status-badge {
          padding: 6px 14px;
          font-size: 12px;
          border-radius: 20px;
          font-weight: 700;
          background: #f1f5f9;
          color: #475569;
        }

        .provider-profile-flex {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
          padding-bottom: 18px;
          border-bottom: 1px solid #f1f5f9;
        }

        .provider-avatar-circle {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #1e40af;
          border-radius: 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 800;
          font-size: 18px;
        }

        .provider-info-box {
          flex: 1;
        }

        .provider-name-txt {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .provider-phone-txt {
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
        }

        .card-status-badge {
          padding: 6px 14px;
          font-size: 12px;
          border-radius: 20px;
          font-weight: 700;
        }

        .booking-amount-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 18px;
          margin-bottom: 18px;
          border-bottom: 1px solid #f1f5f9;
        }

        .booking-amount-lbl {
          color: #64748b;
          font-weight: 600;
          font-size: 14px;
        }

        .booking-amount-val {
          font-weight: 800;
          font-size: 24px;
          background: linear-gradient(135deg, #2563eb, #0ea5e9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .btn-actions-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .primary-action-btn {
          flex: 1;
          background: linear-gradient(135deg, #3b82f6 0%, #155eef 100%);
          color: #fff;
          padding: 12px 18px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .primary-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
        }

        .primary-action-btn:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .secondary-action-btn {
          flex: 1;
          background-color: #ffffff;
          color: #475569;
          padding: 12px 18px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .secondary-action-btn:hover {
          background-color: #f8fafc;
          color: #0f172a;
          border-color: #94a3b8;
          transform: translateY(-2px);
        }

        .secondary-action-btn:disabled {
          opacity: 0.7;
          cursor: default;
          transform: none;
          background-color: #f1f5f9;
        }

        .danger-action-btn {
          width: 100%;
          background-color: #fff5f5;
          color: #e53e3e;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #fed7d7;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .danger-action-btn:hover {
          background-color: #e53e3e;
          color: #ffffff;
          border-color: #e53e3e;
          transform: translateY(-2px);
        }

        .edit-icon-btn {
          background-color: #f8fafc;
          color: #3b82f6;
          border: 1px solid #e2e8f0;
          padding: 8px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .edit-icon-btn:hover {
          background-color: #3b82f6;
          color: #ffffff;
          border-color: #3b82f6;
          transform: translateY(-2px);
        }

        .offer-card-section {
          margin-top: 20px;
          padding: 20px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border-radius: 16px;
          border: 1.5px solid #bfdbfe;
        }

        .offer-title-lbl {
          font-size: 15px;
          font-weight: 800;
          color: #1e3a8a;
          margin-bottom: 12px;
        }

        .offer-msg-bubble {
          font-size: 13.5px;
          color: #1e40af;
          margin-bottom: 12px;
          font-style: italic;
          background: rgba(255, 255, 255, 0.6);
          padding: 10px 14px;
          border-radius: 12px;
          border-left: 4px solid #3b82f6;
        }

        .offer-details-row {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .offer-btn-accept {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .offer-btn-accept:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
        }

        .offer-btn-reject {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          border: 2px solid #ef4444;
          background: white;
          color: #ef4444;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .offer-btn-reject:hover {
          background: #ef4444;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* HEADER */}
      <div className="dashboard-header">
        <div className="logo-container">
          <div className="logo-icon">
            {user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user?.name || 'Profile'}
                className="logo-icon-img"
              />
            ) : (
              user?.name
                ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : 'H'
            )}
          </div>
          <span className="logo-text">HireRight</span>
        </div>

        <div className="header-right">
          <LanguageSwitcher style={{ marginRight: 4 }} />

          <div
            className="icon-btn notification-bell-btn"
            onClick={() => setActiveTab('overview')}
            title={pendingOfferCount > 0 ? t('customer.newProviderOffers') : t('customer.notifications')}
          >
            <Bell size={20} color={pendingOfferCount > 0 ? '#ea580c' : '#64748b'} />
            {pendingOfferCount > 0 && (
              <span className="notification-bell-dot">
                {pendingOfferCount > 9 ? '9+' : pendingOfferCount}
              </span>
            )}
          </div>

          <div onClick={() => navigate('/login')} className="logout-btn">
            <LogOut size={18} />
            <span>{t('logout')}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar-brand">
            <span className="dashboard-sidebar-brand-text">{t('customer.sidebar.title')}</span>
          </div>
          <nav className="dashboard-sidebar-nav">
            <button
              type="button"
              className={`dashboard-sidebar-link ${activeTab === 'overview' ? 'dashboard-sidebar-link-active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <LayoutDashboard size={20} />
              <span>{t('customer.sidebar.dashboard')}</span>
            </button>
            <button
              type="button"
              className={`dashboard-sidebar-link ${activeTab === 'active' ? 'dashboard-sidebar-link-active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              <Briefcase size={20} />
              <span>{t('customer.activeBookings')}</span>
              {bookings.length > 0 && (
                <span className="dashboard-sidebar-badge">{bookings.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`dashboard-sidebar-link ${activeTab === 'completed' ? 'dashboard-sidebar-link-active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              <CheckCircle size={20} />
              <span>{t('customer.sidebar.completedTasks')}</span>
              {completedCards.length > 0 && (
                <span className="dashboard-sidebar-badge">{completedCards.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`dashboard-sidebar-link ${activeTab === 'posts' ? 'dashboard-sidebar-link-active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <FileText size={20} />
              <span>{t('customer.myPosts')}</span>
              {pendingOfferCount > 0 && (
                <span className="dashboard-sidebar-badge dashboard-sidebar-badge-alert">
                  {pendingOfferCount > 9 ? '9+' : pendingOfferCount}
                </span>
              )}
            </button>
            <button
              type="button"
              className="dashboard-sidebar-link"
              onClick={() => navigate('/customer-settings')}
            >
              <Settings size={20} />
              <span>{t('customer.sidebar.settings')}</span>
            </button>
          </nav>
          <div className="dashboard-sidebar-user">
            <div className="dashboard-sidebar-avatar">{renderAvatar()}</div>
            <div className="dashboard-sidebar-user-info">
              <div className="dashboard-sidebar-user-name">{user?.name}</div>
              <div className="dashboard-sidebar-user-email">{user?.email}</div>
            </div>
          </div>
        </aside>

        <div className="dashboard-main">
      {/* CONTAINER */}
      <div className="dashboard-container">
        {reviewThanks && (
          <div style={{
            marginBottom: '20px',
            padding: '14px 16px',
            borderRadius: '12px',
            background: '#ecfdf5',
            border: '1px solid #bbf7d0',
            color: '#166534',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {reviewThanks}
          </div>
        )}

        {pendingOfferCount > 0 && activeTab === 'overview' && (
          <div
            className="offer-alert-banner"
            onClick={() => setActiveTab('posts')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setActiveTab('posts')}
          >
            <div>
              <div className="offer-alert-title">
                {pendingOfferCount === 1
                  ? t('customer.offers.newOfferWaiting')
                  : t('customer.offers.newOffersWaiting', { count: pendingOfferCount })}
              </div>
              <div className="offer-alert-text">
                {pendingOffers[0]?.providerProfile?.fullName || pendingOffers[0]?.providerId?.name
                  ? t('customer.offers.providerSentOffer', {
                      provider: pendingOffers[0].providerProfile?.fullName || pendingOffers[0].providerId.name,
                      title: pendingOffers[0].serviceTitle,
                    })
                  : t('customer.offers.openPostsHint')}
              </div>
            </div>
            <button type="button" className="offer-alert-action" onClick={(e) => { e.stopPropagation(); setActiveTab('posts'); }}>
              {t('customer.offers.viewOffers')}
            </button>
          </div>
        )}
        {activeTab === 'overview' && (
          <>
        {/* HERO — welcome, quick stats, primary action */}
        <div className="dashboard-hero">
          <div className="dashboard-hero-left">
            <div className="dashboard-hero-avatar">{renderAvatar()}</div>
            <div>
              <h1 className="dashboard-hero-title">
                {t('customer.welcome', { name: user?.name?.split(' ')[0] || t('customer.welcomeFallback') })}
              </h1>
              <p className="dashboard-hero-subtitle">{t('customer.heroSubtitle')}</p>
            </div>
          </div>
          <div className="dashboard-hero-right">
            <div className="dashboard-hero-kpis">
              {stats.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className="dashboard-hero-kpi"
                  onClick={() => setActiveTab(
                    s.key === 'spent' ? 'completed' : s.key === 'offers' ? 'posts' : s.key
                  )}
                >
                  <span className="dashboard-hero-kpi-value">{s.value}</span>
                  <span className="dashboard-hero-kpi-label">{s.label}</span>
                </button>
              ))}
            </div>
            <button type="button" className="dashboard-primary-btn" onClick={() => navigate('/service-request')}>
              <Plus size={18} />
              {t('customer.newRequest')}
            </button>
          </div>
        </div>

        <CustomerDashboardAnalytics
          t={t}
          serviceRequests={serviceRequests}
          payments={payments}
          complaints={complaints}
          reviews={reviews}
          bookings={bookings}
          completedCards={completedCards}
          pendingOfferCount={pendingOfferCount}
          onTabChange={setActiveTab}
          onNavigate={navigate}
          onPaymentDueClick={handlePaymentDueClick}
          onReviewClick={handleReviewClick}
          onComplaintClick={handleComplaintClick}
        />
          </>
        )}

        {/* MAIN CONTENT — list views only (no charts) */}
        {activeTab !== 'overview' && (
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">{sectionTitles[activeTab]}</h2>
            <p className="dashboard-section-desc">{tabDescriptions[activeTab]}</p>
          </div>

        {/* BOOKINGS GRID */}
        {activeTab === 'posts' && pendingPosts.length === 0 && (
          <div className="dashboard-empty">
            <div className="dashboard-empty-icon">📝</div>
            <h3 className="dashboard-empty-title">{t('customer.empty.noOpenPosts')}</h3>
            <p className="dashboard-empty-text">
              {t('customer.empty.noOpenPostsText')}
            </p>
            <div className="dashboard-empty-actions">
              <button type="button" className="dashboard-primary-btn" onClick={() => navigate('/service-request')}>
                <Plus size={16} />
                {t('customer.empty.postRequest')}
              </button>
              <button type="button" className="dashboard-secondary-btn" onClick={() => navigate('/services')}>
                {t('customer.empty.browseProviders')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'active' && bookings.length === 0 && (
          <div className="dashboard-empty">
            <div className="dashboard-empty-icon">📋</div>
            <h3 className="dashboard-empty-title">{t('customer.empty.noActiveBookings')}</h3>
            <p className="dashboard-empty-text">
              {t('customer.empty.noActiveBookingsText')}
            </p>
            <div className="dashboard-empty-actions">
              <button type="button" className="dashboard-secondary-btn" onClick={() => setActiveTab('posts')}>
                {t('customer.empty.checkMyPosts')}
              </button>
              <button type="button" className="dashboard-primary-btn" onClick={() => navigate('/services')}>
                {t('customer.empty.bookProvider')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'completed' && completedCards.length === 0 && (
          <div className="dashboard-empty">
            <div className="dashboard-empty-icon">✓</div>
            <h3 className="dashboard-empty-title">{t('customer.empty.noCompletedJobs')}</h3>
            <p className="dashboard-empty-text">
              {t('customer.empty.noCompletedJobsText')}
            </p>
          </div>
        )}

        {activeTab === "posts" && pendingPosts.length > 0 ? (
          <div className="dashboard-grid">
            {pendingPosts.map((request) => (
              <div
                key={request._id}
                className={`item-card ${isPendingProviderOffer(request) ? 'item-card-has-offer' : ''}`}
              >
                {isPendingProviderOffer(request) && (
                  <div className="offer-new-badge">
                    <span className="offer-new-badge-dot" />
                    {t('customer.offers.newOfferBadge')}
                  </div>
                )}
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div className="item-card-title">{request.serviceTitle}</div>
                  {request.userId === user?.id && (
                    <button onClick={() => handleEdit(request)} className="edit-icon-btn">
                      <Edit size={16} />
                    </button>
                  )}
                </div>

                {/* CATEGORY BADGE */}
                <div className="item-card-category">{request.serviceCategory}</div>

                {/* DESCRIPTION */}
                <div className="item-card-desc">{request.description}</div>

                {/* DETAILS */}
                <div className="item-details-list">
                  <div className="item-detail-row">
                    <Calendar size={16} color="#3b82f6" />
                    <span>{request.preferredDate} at {request.preferredTime}</span>
                  </div>
                  <div className="item-detail-row">
                    <MapPin size={16} color="#3b82f6" />
                    <span>{formatLocationDisplay(request.location)}</span>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="item-card-footer-flex">
                  <div className="item-budget-box">
                    <span className="item-budget-lbl">{t('customer.dailyBudget')}</span>
                    <span className="item-budget-val">Rs.{getRequestDailyBudget(request).toLocaleString()} {t('customer.perDay')}</span>
                  </div>
                  <div className="item-status-badge" style={isPendingProviderOffer(request) ? {
                    background: '#ffedd5',
                    color: '#c2410c',
                    fontWeight: 800,
                  } : undefined}>
                    {getStatusDisplay(request.status)}
                  </div>
                </div>

                {/* PROVIDER OFFER SECTION (post requests) */}
                {request.bookingType !== 'direct' && request.status === 'OfferSent' && request.providerOffer && (
                  <div className="offer-card-section">
                    <div className="offer-title-lbl">
                      🎯 {t('customer.offers.receivedTitle')}
                    </div>

                    <ProviderOfferProfile
                      providerUser={request.providerId}
                      providerProfile={request.providerProfile}
                    />

                    <CustomerEstimateReview
                      request={request}
                      showActions={request.providerOffer.customerResponse === 'pending'}
                      onAccept={() => handleAcceptOffer(request._id)}
                      onReject={() => handleRejectOffer(request._id)}
                    />
                  </div>
                )}

                {/* DIRECT BOOKING RESPONSE SECTION */}
                {request.bookingType === 'direct' && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: request.providerResponse?.customerConfirmation === 'accepted'
                      || request.providerResponse?.status === 'accepted'
                      ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)'
                      : request.providerResponse?.status === 'rejected'
                        ? 'linear-gradient(135deg, #fee2e2, #fecaca)'
                        : 'linear-gradient(135deg, #f3e8ff, #e9d5ff)',
                    borderRadius: '12px',
                    border: '2px solid ' + (
                      request.providerResponse?.customerConfirmation === 'accepted'
                      || request.providerResponse?.status === 'accepted'
                        ? '#10b981'
                        : request.providerResponse?.status === 'rejected'
                          ? '#ef4444'
                          : '#a78bfa'
                    )
                  }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
                      {request.providerResponse?.status === 'pending' && `⏳ ${t('customer.awaitingProviderEstimate')}`}
                      {request.providerResponse?.status === 'estimated'
                        && request.providerResponse?.customerConfirmation === 'pending'
                        && `📋 ${t('customer.reviewBookingProposal')}`}
                      {(request.providerResponse?.customerConfirmation === 'accepted'
                        || request.providerResponse?.status === 'accepted') && `✓ ${t('customer.bookingConfirmed')}`}
                      {request.providerResponse?.status === 'rejected' && `✗ ${t('customer.bookingRejected')}`}
                    </div>

                    {request.providerResponse?.status === 'estimated' && (
                      <CustomerEstimateReview
                        request={request}
                        showActions={request.providerResponse?.customerConfirmation === 'pending'}
                        onAccept={() => handleConfirmDirectProposal(request._id)}
                        onReject={() => handleRejectDirectProposal(request._id)}
                      />
                    )}

                    {request.agreedTotalAmount > 0 && (
                      <div style={{ fontSize: '14px', color: '#166534', marginTop: '10px', fontWeight: '600' }}>
                        {t('agreement.agreedTotal')}: Rs. {Number(request.agreedTotalAmount).toLocaleString()}
                      </div>
                    )}

                    {request.providerResponse?.status === 'rejected' && (
                      <button
                        onClick={() => navigate('/services')}
                        style={{
                          width: '100%',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        {t('customer.bookAnotherProvider')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : activeTab !== 'posts' && (activeTab === 'active' ? bookings.length > 0 : completedCards.length > 0) ? (
          <div className="dashboard-grid">
            {(activeTab === 'active' ? bookings : completedCards).map((b) => (
              <div
                key={b.id}
                ref={(el) => { bookingCardRefs.current[b.id] = el; }}
                className={`item-card ${highlightBookingId === b.id ? 'item-card-highlight' : ''}`}
              >
                {/* PROVIDER */}
                <div className="provider-profile-flex">
                  <div className="provider-avatar-circle">
                    {b.provider.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="provider-info-box">
                    <div className="provider-name-txt">{b.provider}</div>
                    {b.phone && (
                      <div className="provider-phone-txt">
                        <span>📞 {b.phone}</span>
                      </div>
                    )}
                  </div>
                  <div
                    className="card-status-badge"
                    style={{
                      color: b.statusColor,
                      backgroundColor: b.statusBg,
                    }}
                  >
                    {b.status}
                  </div>
                </div>

                {/* SERVICE TITLE */}
                <div className="item-card-title" style={{ color: '#2563eb', marginBottom: '16px' }}>{b.service}</div>

                {/* DETAILS */}
                <div className="item-details-list">
                  <div className="item-detail-row">
                    <Calendar size={16} color="#3b82f6" />
                    <span>{b.date}</span>
                  </div>
                  <div className="item-detail-row">
                    <MapPin size={16} color="#3b82f6" />
                    <span>{b.location}</span>
                  </div>
                </div>

                {/* AMOUNT */}
                <div className="booking-amount-flex">
                  <span className="booking-amount-lbl">{t('customer.totalAmount')}</span>
                  <span className="booking-amount-val">{b.amount}</span>
                </div>

                {/* ACTION BUTTONS */}
                <div className="btn-actions-row">
                  {b.canComplete && (
                    <button className="secondary-action-btn" onClick={() => handleCompleteBooking(b.id)}>
                      {t('customer.markTaskCompleted')}
                    </button>
                  )}
                  {b.awaitingProviderConfirmation && (
                    <button className="secondary-action-btn" style={{ opacity: 0.7, cursor: 'default' }} disabled>
                      {t('customer.awaitingProvider')}
                    </button>
                  )}
                  {b.providerCompleted && !b.customerCompleted && b.canComplete && (
                    <button className="secondary-action-btn" style={{ opacity: 0.85, cursor: 'default' }} disabled>
                      {t('customer.providerMarkedComplete')}
                    </button>
                  )}
                  {b.isPaid && b.paymentSettled && b.paymentBreakdown && (
                    <div style={{
                      width: '100%',
                      marginTop: '10px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: '13px',
                      color: '#475569',
                    }}>
                      <div><strong>{t('customer.originalPayment')}:</strong> {formatLkr(b.paymentBreakdown.serviceAmount)}</div>
                      <div><strong>{t('customer.settlementOutcome')}:</strong> {getSettlementTypeLabel(b.paymentBreakdown.settlementType)}</div>
                      {b.paymentBreakdown.refundAmount > 0 && (
                        <div style={{ color: '#16a34a', marginTop: '4px' }}>
                          <strong>{t('customer.refundAmount')}:</strong> {formatLkr(b.paymentBreakdown.refundAmount)}
                        </div>
                      )}
                    </div>
                  )}
                  {b.canPayNow ? (
                    <button
                      onClick={() => navigate('/payment', {
                        state: {
                          booking: b,
                          fromDashboard: true
                        }
                      })}
                      className="primary-action-btn"
                    >
                      {t('customer.payNow')}
                    </button>
                  ) : b.isPaid ? (
                    <button className="primary-action-btn" style={{ background: '#10b981', color: 'white', opacity: 0.9, cursor: 'default', boxShadow: 'none' }} disabled>
                      ✓ {t('customer.paid')}
                    </button>
                  ) : null}
                  {activeTab === 'completed' && b.paymentReleased && !reviews.some((r) => String(r.serviceRequestId) === String(b.id)) && (
                    <button
                      type="button"
                      className="secondary-action-btn"
                      style={{ marginTop: '10px', borderColor: '#c4b5fd', color: '#7c3aed', background: '#f5f3ff' }}
                      onClick={() => {
                        setReviewTarget(b);
                        setReviewRating(5);
                        setReviewComment('');
                        setReviewModalOpen(true);
                      }}
                    >
                      ★ {t('customer.analytics.leaveReview')}
                    </button>
                  )}
                </div>
                {b.canReport && (
                  <button
                    className="danger-action-btn"
                    onClick={() => navigate("/report-issue", { state: { booking: b } })}
                  >
                    {b.complaintStatus === 'resolved' ? t('customer.issueResolved') : t('customer.reportIssue')}
                  </button>
                )}
                {activeTab === 'active' && b.providerUserId && (
                  <CustomerProviderTracking
                    providerUserId={b.providerUserId}
                    customerLocation={b.customerLocation}
                    enabled
                  />
                )}
              </div>
            ))}
          </div>
        ) : null}
        </div>
        )}
      </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditing && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{t('customer.editRequest')}</h2>
              <button onClick={handleCancel} style={styles.closeBtn}>
                <X size={24} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('customer.serviceTitle')}</label>
                <input
                  type="text"
                  value={formData.serviceTitle || ''}
                  onChange={(e) => setFormData({ ...formData, serviceTitle: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('customer.serviceCategory')}</label>
                <input
                  type="text"
                  value={formData.serviceCategory || ''}
                  onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('customer.description')}</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={styles.textarea}
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>{t('customer.preferredDate')}</label>
                  <input
                    type="date"
                    value={formData.preferredDate || ''}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>{t('customer.preferredTime')}</label>
                  <input
                    type="time"
                    value={formData.preferredTime || ''}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('customer.dailyBudget')}</label>
                <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#64748b' }}>{t('customer.dailyBudgetHint')}</p>
                <input
                  type="number"
                  min="1"
                  value={formData.dailyBudget ?? formData.budget ?? ''}
                  onChange={(e) => setFormData({ ...formData, dailyBudget: e.target.value, budget: undefined })}
                  style={styles.input}
                />
              </div>
              <LocationPicker
                value={formData.location || { address: '' }}
                onChange={(location) => setFormData((prev) => ({ ...prev, location }))}
              />
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('customer.specificRequirements')}</label>
                <textarea
                  value={formData.specificRequirements || ''}
                  onChange={(e) => setFormData({ ...formData, specificRequirements: e.target.value })}
                  style={styles.textarea}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={handleCancel} style={styles.cancelBtn}>{t('common.cancel')}</button>
              <button onClick={handleSave} style={styles.saveBtn}>{t('common.saveChanges')}</button>
            </div>
          </div>
        </div>
      )}

      {reviewModalOpen && reviewTarget && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{t('customer.rateProvider')}</h2>
              <button onClick={handleReviewRemindLater} style={styles.closeBtn}>
                <X size={24} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ marginBottom: '12px', fontWeight: 600 }}>
                {reviewTarget.provider}
              </div>
              <div style={{ marginBottom: '16px', color: '#64748b' }}>
                {reviewTarget.service}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setReviewRating(value)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      background: value <= reviewRating ? '#fbbf24' : '#fff',
                      color: value <= reviewRating ? '#fff' : '#94a3b8',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    type="button"
                  >
                    ★
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>{t('customer.review')}</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  style={styles.textarea}
                  placeholder={t('customer.reviewPlaceholder')}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={handleReviewRemindLater} style={styles.cancelBtn}>
                {t('customer.remindLater')}
              </button>
              <button onClick={handleReviewSubmit} style={styles.saveBtn} disabled={reviewSaving}>
                {reviewSaving ? t('customer.submitting') : t('customer.submitReview')}
              </button>
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