import React, { useState, useEffect } from 'react';
import {
  Search,
  Briefcase,
  Clock,
  History as HistoryIcon,
  DollarSign,
  MapPin,
  Calendar,
  User,
  CheckCircle,
  LogOut
} from 'lucide-react';
import {
  getAvailableServiceRequests,
  acceptServiceRequest,
  getProviderServiceRequests,
  completeServiceRequest
} from '../api/service';

const ProviderDashboard = () => {
  const [activeSection, setActiveSection] = useState('findWork');
  const [availableRequests, setAvailableRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [regStep, setRegStep] = useState(1);
  const [regForm, setRegForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    serviceCategory: '',
    yearsOfExperience: '',
    hourlyRate: '',
    professionalBio: '',
    portfolioPhoto: null,
    city: '',
    district: '',
    idDocument: null,
    agreedToBackgroundCheck: false
  });
  const [regErrors, setRegErrors] = useState({});

  useEffect(() => {
    if (activeSection === 'findWork') {
      loadAvailableRequests();
    } else if (['myRequests', 'upcoming', 'history', 'earnings'].includes(activeSection)) {
      loadMyRequests();
    }
  }, [activeSection]);

  const loadAvailableRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAvailableServiceRequests();
      setAvailableRequests(data);
    } catch (err) {
      setError('Failed to load available requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProviderServiceRequests();
      setMyRequests(data);
    } catch (err) {
      setError('Failed to load your requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (requestId, budget, preferredDate) => {
    try {
      // Simple prompt for offer details - can be enhanced with a modal later
      const message = prompt('Add a message for the customer (optional):');
      const proposedPriceStr = prompt(`Enter your proposed price (Rs.):`, budget);
      const proposedDate = prompt(`Enter proposed date:`, preferredDate);

      if (proposedPriceStr === null) return; // User cancelled

      const proposedPrice = Number(proposedPriceStr) || budget;

      await acceptServiceRequest(requestId, {
        message: message || '',
        proposedPrice,
        proposedDate: proposedDate || preferredDate
      });

      loadAvailableRequests();
      alert('Offer sent to customer successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to send offer';
      alert(errorMsg);
      console.error(err);
    }
  };

  const handleCompleteJob = async (requestId) => {
    try {
      await completeServiceRequest(requestId);
      loadMyRequests();
      alert('Job marked as completed!');
    } catch (err) {
      alert('Failed to complete job');
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const upcomingRequests = myRequests.filter(req => req.status === 'Accepted');
  const historyRequests = myRequests.filter(req => req.status === 'Completed');
  const totalEarnings = historyRequests.reduce((sum, req) => sum + (req.budget || 0), 0);

  const handleRegChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (regErrors[name]) setRegErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRegForm(prev => ({ ...prev, portfolioPhoto: file }));
    }
  };

  const handleIdUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRegForm(prev => ({ ...prev, idDocument: file }));
      if (regErrors.idDocument) {
        setRegErrors(prev => ({ ...prev, idDocument: '' }));
      }
    }
  };

  const validateRegStep1 = () => {
    const errs = {};
    if (!regForm.firstName.trim()) errs.firstName = 'First name is required';
    if (!regForm.lastName.trim()) errs.lastName = 'Last name is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regForm.email.trim()) {
      errs.email = 'Email is required';
    } else if (!emailRegex.test(regForm.email)) {
      errs.email = 'Please enter a valid email';
    }
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!regForm.phoneNumber.trim()) {
      errs.phoneNumber = 'Phone number is required';
    } else if (!phoneRegex.test(regForm.phoneNumber)) {
      errs.phoneNumber = 'Please enter a valid phone number';
    }
    if (!regForm.password) {
      errs.password = 'Password is required';
    } else if (regForm.password.length < 8) {
      errs.password = 'Must be at least 8 characters';
    }
    return errs;
  };

  const validateRegStep2 = () => {
    const errs = {};
    if (!regForm.serviceCategory) errs.serviceCategory = 'Service category is required';
    if (!regForm.yearsOfExperience) {
      errs.yearsOfExperience = 'Years of experience is required';
    } else if (regForm.yearsOfExperience < 0) {
      errs.yearsOfExperience = 'Must be a positive number';
    }
    if (!regForm.hourlyRate) {
      errs.hourlyRate = 'Hourly rate is required';
    } else if (regForm.hourlyRate < 0) {
      errs.hourlyRate = 'Must be a positive number';
    }
    return errs;
  };

  const validateRegStep3 = () => {
    const errs = {};
    if (!regForm.city.trim()) errs.city = 'City is required';
    if (!regForm.district.trim()) errs.district = 'District is required';
    if (!regForm.idDocument) {
      errs.idDocument = 'ID document (NIC/Driving License) is required';
    }
    if (!regForm.agreedToBackgroundCheck) {
      errs.agreedToBackgroundCheck = 'You must agree to the background check';
    }
    return errs;
  };

  const handleRegContinue = () => {
    let errs = {};
    if (regStep === 1) {
      errs = validateRegStep1();
    } else if (regStep === 2) {
      errs = validateRegStep2();
    }

    setRegErrors(errs);
    if (Object.keys(errs).length === 0 && regStep < 3) {
      setRegStep(regStep + 1);
    }
  };

  const handleRegBack = () => {
    if (regStep > 1) {
      setRegStep(regStep - 1);
    }
  };

  const handleRegSubmit = (e) => {
    if (e) e.preventDefault();
    const errs = validateRegStep3();
    setRegErrors(errs);
    if (Object.keys(errs).length === 0) {
      console.log('Registration submitted:', regForm);
      alert('Registration submitted — we will review and contact you.');
      setIsModalOpen(false);
      setRegStep(1);
      setRegForm({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        serviceCategory: '',
        yearsOfExperience: '',
        hourlyRate: '',
        professionalBio: '',
        portfolioPhoto: null,
        city: '',
        district: '',
        agreedToBackgroundCheck: false
      });
      setRegErrors({});
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #64748b;
          font-size: 15px;
          font-weight: 500;
        }
        
        .sidebar-item:hover {
          background-color: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        
        .sidebar-item-active {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }
        
        .sidebar-item-active:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
        }
        
        .request-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          border: 1px solid #e2e8f0;
        }
        
        .request-card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .btn-success {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-success:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
        }
        
        @media (max-width: 768px) {
          .dashboard-container {
            flex-direction: column !important;
          }
          .sidebar {
            width: 100% !important;
            margin-bottom: 20px;
          }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #e0e7ff 100%)',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: '20px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: '700',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                H
              </div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                  Hire Right
                </h1>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                  Provider Dashboard
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => setIsModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f6573b, #cc3737)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Create Worker Profile
              </button>

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#64748b',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>

          {/* Main Dashboard Container */}
          <div className="dashboard-container" style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start'
          }}>
            {/* Sidebar */}
            <div className="sidebar" style={{
              width: '260px',
              background: 'white',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
              position: 'sticky',
              top: '20px'
            }}>
              <div style={{ marginBottom: '10px', paddingLeft: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                  Navigation
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  className={`sidebar-item ${activeSection === 'findWork' ? 'sidebar-item-active' : ''}`}
                  onClick={() => setActiveSection('findWork')}
                >
                  <Search size={20} />
                  <span>Find Work</span>
                </div>

                <div
                  className={`sidebar-item ${activeSection === 'myRequests' ? 'sidebar-item-active' : ''}`}
                  onClick={() => setActiveSection('myRequests')}
                >
                  <Briefcase size={20} />
                  <span>My Requests</span>
                </div>

                <div
                  className={`sidebar-item ${activeSection === 'upcoming' ? 'sidebar-item-active' : ''}`}
                  onClick={() => setActiveSection('upcoming')}
                >
                  <Clock size={20} />
                  <span>Upcoming</span>
                </div>

                <div
                  className={`sidebar-item ${activeSection === 'history' ? 'sidebar-item-active' : ''}`}
                  onClick={() => setActiveSection('history')}
                >
                  <HistoryIcon size={20} />
                  <span>History</span>
                </div>

                <div
                  className={`sidebar-item ${activeSection === 'earnings' ? 'sidebar-item-active' : ''}`}
                  onClick={() => setActiveSection('earnings')}
                >
                  <DollarSign size={20} />
                  <span>Earnings</span>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1 }}>
              {/* Find Work Section */}
              {activeSection === 'findWork' && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                      Find Work
                    </h2>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>
                      Browse and accept available service requests
                    </p>
                  </div>

                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Loading...
                    </div>
                  ) : error ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                      {error}
                    </div>
                  ) : availableRequests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No available service requests at the moment.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {availableRequests.map((request) => (
                        <div key={request._id} className="request-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ flex: 1 }}>
                              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                                {request.serviceTitle}
                              </h3>
                              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
                                {request.description}
                              </p>
                            </div>
                            <div style={{
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: 'white',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '16px',
                              fontWeight: '700',
                              marginLeft: '16px'
                            }}>
                              Rs. {request.budget?.toLocaleString()}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <User size={16} color="#64748b" />
                              <span style={{ fontSize: '14px', color: '#475569' }}>
                                {request.userId?.name || 'Customer'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <MapPin size={16} color="#64748b" />
                              <span style={{ fontSize: '14px', color: '#475569' }}>
                                {request.location}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Calendar size={16} color="#64748b" />
                              <span style={{ fontSize: '14px', color: '#475569' }}>
                                {request.preferredDate}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{
                              backgroundColor: '#e0f2fe',
                              color: '#0284c7',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}>
                              {request.serviceCategory}
                            </div>

                            <button
                              className="btn-primary"
                              onClick={() => handleAcceptJob(request._id, request.budget, request.preferredDate)}
                            >
                              Send Offer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* My Requests Section */}
              {activeSection === 'myRequests' && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                      My Requests
                    </h2>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>
                      All service requests you've accepted
                    </p>
                  </div>

                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Loading...
                    </div>
                  ) : error ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                      {error}
                    </div>
                  ) : myRequests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      You haven't accepted any requests yet.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {myRequests.map((request) => (
                        <div key={request._id} className="request-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                                  {request.serviceTitle}
                                </h3>
                                <div style={{
                                  backgroundColor: request.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                                  color: request.status === 'Completed' ? '#16a34a' : '#d97706',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  {request.status}
                                </div>
                              </div>
                              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
                                {request.description}
                              </p>
                            </div>
                            <div style={{
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: 'white',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '16px',
                              fontWeight: '700',
                              marginLeft: '16px'
                            }}>
                              Rs. {request.budget?.toLocaleString()}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <User size={16} color="#64748b" />
                              <span style={{ fontSize: '14px', color: '#475569' }}>
                                {request.userId?.name || 'Customer'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <MapPin size={16} color="#64748b" />
                              <span style={{ fontSize: '14px', color: '#475569' }}>
                                {request.location}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Calendar size={16} color="#64748b" />
                              <span style={{ fontSize: '14px', color: '#475569' }}>
                                {request.preferredDate}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{
                              backgroundColor: '#e0f2fe',
                              color: '#0284c7',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}>
                              {request.serviceCategory}
                            </div>

                            {request.status === 'Accepted' && (
                              <button
                                className="btn-success"
                                onClick={() => handleCompleteJob(request._id)}
                              >
                                <CheckCircle size={16} style={{ marginRight: '6px', display: 'inline' }} />
                                Mark Complete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Upcoming Section */}
              {activeSection === 'upcoming' && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                      Upcoming Jobs
                    </h2>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>
                      Accepted jobs that are not yet completed
                    </p>
                  </div>

                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Loading...
                    </div>
                  ) : upcomingRequests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No upcoming jobs.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {upcomingRequests
                        .sort((a, b) => new Date(a.preferredDate) - new Date(b.preferredDate))
                        .map((request) => (
                          <div key={request._id} className="request-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                              <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                                  {request.serviceTitle}
                                </h3>
                                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
                                  {request.description}
                                </p>
                              </div>
                              <div style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '700',
                                marginLeft: '16px'
                              }}>
                                Rs. {request.budget?.toLocaleString()}
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <User size={16} color="#64748b" />
                                <span style={{ fontSize: '14px', color: '#475569' }}>
                                  {request.userId?.name || 'Customer'}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MapPin size={16} color="#64748b" />
                                <span style={{ fontSize: '14px', color: '#475569' }}>
                                  {request.location}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={16} color="#64748b" />
                                <span style={{ fontSize: '14px', color: '#475569' }}>
                                  {request.preferredDate} at {request.preferredTime}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{
                                backgroundColor: '#e0f2fe',
                                color: '#0284c7',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '600'
                              }}>
                                {request.serviceCategory}
                              </div>

                              <button
                                className="btn-success"
                                onClick={() => handleCompleteJob(request._id)}
                              >
                                <CheckCircle size={16} style={{ marginRight: '6px', display: 'inline' }} />
                                Mark Complete
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* History Section */}
              {activeSection === 'history' && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                      Job History
                    </h2>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>
                      Completed service requests
                    </p>
                  </div>

                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Loading...
                    </div>
                  ) : historyRequests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No completed jobs yet.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {historyRequests.map((request) => (
                        <div key={request._id} className="request-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                                  {request.serviceTitle}
                                </h3>
                                <div style={{
                                  backgroundColor: '#dcfce7',
                                  color: '#16a34a',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  Completed
                                </div>
                              </div>
                              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
                                {request.description}
                              </p>
                            </div>
                            <div style={{
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: 'white',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '16px',
                              fontWeight: '700',
                              marginLeft: '16px'
                            }}>
                              Rs. {request.budget?.toLocaleString()}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <User size={16} color="#64748b" />
                              <span style={{ fontSize: '14px', color: '#475569' }}>
                                {request.userId?.name || 'Customer'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <MapPin size={16} color="#64748b" />
                              <span style={{ fontSize: '14px', color: '#475569' }}>
                                {request.location}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Calendar size={16} color="#64748b" />
                              <span style={{ fontSize: '14px', color: '#475569' }}>
                                Completed: {request.completedAt ? new Date(request.completedAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>

                          <div style={{
                            backgroundColor: '#e0f2fe',
                            color: '#0284c7',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            display: 'inline-block'
                          }}>
                            {request.serviceCategory}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Earnings Section */}
              {activeSection === 'earnings' && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                      Earnings
                    </h2>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>
                      Your earnings from completed jobs
                    </p>
                  </div>

                  {/* Earnings Summary Card */}
                  <div className="stat-card" style={{ marginBottom: '24px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <DollarSign size={32} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                          Total Earnings
                        </p>
                        <h2 style={{ fontSize: '36px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                          Rs. {totalEarnings.toLocaleString()}
                        </h2>
                        <p style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                          {historyRequests.length} completed {historyRequests.length === 1 ? 'job' : 'jobs'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Earnings List */}
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Loading...
                    </div>
                  ) : historyRequests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No earnings yet. Complete jobs to start earning!
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {historyRequests.map((request) => (
                        <div key={request._id} style={{
                          background: 'white',
                          borderRadius: '10px',
                          padding: '16px',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                              {request.serviceTitle}
                            </h4>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MapPin size={14} color="#64748b" />
                                <span style={{ fontSize: '13px', color: '#64748b' }}>
                                  {request.location}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} color="#64748b" />
                                <span style={{ fontSize: '13px', color: '#64748b' }}>
                                  {request.completedAt ? new Date(request.completedAt).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#10b981',
                            marginLeft: '16px'
                          }}>
                            Rs. {request.budget?.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
          <div style={{ width: '650px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: '16px', padding: '0', boxShadow: '0 20px 60px rgba(2,6,23,0.4)' }}>

            {/* Progress Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #f8fafc, #e0f2fe)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>Worker Registration</h2>
                <button onClick={() => { setIsModalOpen(false); setRegStep(1); setRegErrors({}); }} style={{ border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                <span>Step {regStep} of 3</span>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #2563eb)', width: `${(regStep / 3) * 100}%`, transition: 'width 0.3s ease' }}></div>
              </div>

              {/* Step Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                {[1, 2, 3].map((step) => (
                  <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      fontSize: '14px',
                      background: regStep >= step ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#e2e8f0',
                      color: regStep >= step ? 'white' : '#94a3b8',
                      transition: 'all 0.3s ease'
                    }}>
                      {step}
                    </div>
                    <span style={{ fontSize: '11px', marginTop: '6px', color: regStep >= step ? '#3b82f6' : '#94a3b8', fontWeight: 500 }}>
                      {step === 1 ? 'Personal' : step === 2 ? 'Professional' : 'Location'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Step 1: Personal Information */}
              {regStep === 1 && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Personal Information</h3>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>Let's start with your basic details</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                          First Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input name="firstName" value={regForm.firstName} onChange={handleRegChange} placeholder="Kasun" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${regErrors.firstName ? '#fca5a5' : '#e2e8f0'}`, fontSize: '14px', outline: 'none', transition: 'border 0.2s' }} />
                        {regErrors.firstName && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{regErrors.firstName}</div>}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                          Last Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input name="lastName" value={regForm.lastName} onChange={handleRegChange} placeholder="Silva" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${regErrors.lastName ? '#fca5a5' : '#e2e8f0'}`, fontSize: '14px', outline: 'none' }} />
                        {regErrors.lastName && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{regErrors.lastName}</div>}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                        Email Address <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input name="email" type="email" value={regForm.email} onChange={handleRegChange} placeholder="you@example.com" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${regErrors.email ? '#fca5a5' : '#e2e8f0'}`, fontSize: '14px', outline: 'none' }} />
                      {regErrors.email && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{regErrors.email}</div>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                        Phone Number <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input name="phoneNumber" type="tel" value={regForm.phoneNumber} onChange={handleRegChange} placeholder="+94 77 123 4567" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${regErrors.phoneNumber ? '#fca5a5' : '#e2e8f0'}`, fontSize: '14px', outline: 'none' }} />
                      {regErrors.phoneNumber && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{regErrors.phoneNumber}</div>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                        Password <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input name="password" type="password" value={regForm.password} onChange={handleRegChange} placeholder="••••••••" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${regErrors.password ? '#fca5a5' : '#e2e8f0'}`, fontSize: '14px', outline: 'none' }} />
                      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>Must be at least 8 characters</p>
                      {regErrors.password && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{regErrors.password}</div>}
                    </div>
                  </div>

                  <button onClick={handleRegContinue} style={{ width: '100%', marginTop: '24px', padding: '14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'transform 0.2s' }}>
                    Continue to Professional Details
                  </button>
                </div>
              )}

              {/* Step 2: Professional Details */}
              {regStep === 2 && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Professional Details</h3>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>Tell us about your expertise</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                        Service Category <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select name="serviceCategory" value={regForm.serviceCategory} onChange={handleRegChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${regErrors.serviceCategory ? '#fca5a5' : '#e2e8f0'}`, fontSize: '14px', outline: 'none' }}>
                        <option value="">Select a category</option>
                        {serviceCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      {regErrors.serviceCategory && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{regErrors.serviceCategory}</div>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                          Years of Experience <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input name="yearsOfExperience" type="number" value={regForm.yearsOfExperience} onChange={handleRegChange} placeholder="5" min="0" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${regErrors.yearsOfExperience ? '#fca5a5' : '#e2e8f0'}`, fontSize: '14px', outline: 'none' }} />
                        {regErrors.yearsOfExperience && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{regErrors.yearsOfExperience}</div>}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                          Hourly Rate (Rs.) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input name="hourlyRate" type="number" value={regForm.hourlyRate} onChange={handleRegChange} placeholder="1200" min="0" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${regErrors.hourlyRate ? '#fca5a5' : '#e2e8f0'}`, fontSize: '14px', outline: 'none' }} />
                        {regErrors.hourlyRate && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{regErrors.hourlyRate}</div>}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                        Professional Bio <span style={{ fontSize: '11px', color: '#94a3b8' }}>(Optional)</span>
                      </label>
                      <textarea name="professionalBio" value={regForm.professionalBio} onChange={handleRegChange} placeholder="Tell customers about your skills, experience, and what makes you great..." rows="4" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>This will be shown to potential customers</p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                        Portfolio Photo <span style={{ fontSize: '11px', color: '#94a3b8' }}>(Optional)</span>
                      </label>
                      <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '32px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                        <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFileUpload} style={{ display: 'none' }} id="portfolio-upload-modal" />
                        <label htmlFor="portfolio-upload-modal" style={{ cursor: 'pointer', display: 'block' }}>
                          {regForm.portfolioPhoto ? (
                            <p style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500', margin: 0 }}>{regForm.portfolioPhoto.name}</p>
                          ) : (
                            <>
                              <svg style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p style={{ fontSize: '14px', color: '#475569', fontWeight: '500', marginBottom: '4px' }}>Click to upload or drag and drop</p>
                              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>PNG, JPG or JPEG (max 5MB)</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button onClick={handleRegBack} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '2px solid #e2e8f0', background: 'white', color: '#475569', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                      Back
                    </button>
                    <button onClick={handleRegContinue} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                      Continue to Location
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Location & Verification */}
              {regStep === 3 && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Location & Verification</h3>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>Almost done! Just a few more details</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                        City <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input name="city" value={regForm.city} onChange={handleRegChange} placeholder="Colombo" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${regErrors.city ? '#fca5a5' : '#e2e8f0'}`, fontSize: '14px', outline: 'none' }} />
                      {regErrors.city && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{regErrors.city}</div>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                        District <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select name="district" value={regForm.district} onChange={handleRegChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `2px solid ${regErrors.district ? '#fca5a5' : '#e2e8f0'}`, fontSize: '14px', outline: 'none' }}>
                        <option value="">Select district</option>
                        {sriLankanDistricts.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                      </select>
                      {regErrors.district && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{regErrors.district}</div>}
                    </div>

                    {/* ID Document Upload Section */}
                    <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '2px solid #93c5fd', borderRadius: '12px', padding: '20px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flexShrink: 0 }}>
                          <svg style={{ width: '24px', height: '24px', color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', marginBottom: '8px' }}>
                            ID Verification Document <span style={{ color: '#ef4444' }}>*</span>
                          </h4>
                          <p style={{ fontSize: '13px', color: '#1e40af', marginBottom: '12px' }}>
                            Please upload a clear photo of your NIC (National Identity Card) or Driving License for identity verification.
                          </p>

                          <div style={{ border: `2px dashed ${regErrors.idDocument ? '#fca5a5' : '#93c5fd'}`, borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: 'white', transition: 'all 0.3s' }}>
                            <input type="file" accept="image/png,image/jpeg,image/jpg,application/pdf" onChange={handleIdUpload} style={{ display: 'none' }} id="id-upload-modal" />
                            <label htmlFor="id-upload-modal" style={{ cursor: 'pointer', display: 'block' }}>
                              {regForm.idDocument ? (
                                <p style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500', margin: 0 }}>{regForm.idDocument.name}</p>
                              ) : (
                                <>
                                  <svg style={{ width: '40px', height: '40px', margin: '0 auto 8px', color: '#60a5fa' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                  <p style={{ fontSize: '13px', color: '#475569', fontWeight: '500', marginBottom: '4px' }}>Click to upload ID document</p>
                                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>NIC or Driving License (PNG, JPG, or PDF - max 5MB)</p>
                                </>
                              )}
                            </label>
                          </div>
                          {regErrors.idDocument && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>{regErrors.idDocument}</div>}
                        </div>
                      </div>
                    </div>

                    {/* Background Check Section */}
                    <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '2px solid #86efac', borderRadius: '12px', padding: '20px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flexShrink: 0 }}>
                          <svg style={{ width: '24px', height: '24px', color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#166534', marginBottom: '8px' }}>Background Check & Verification</h4>
                          <p style={{ fontSize: '13px', color: '#15803d', marginBottom: '12px' }}>
                            To ensure the safety of our community, all workers must complete a background check. This process is handled by our trusted partner and takes 2-3 business days.
                          </p>

                          <div style={{ display: 'flex', gap: '12px', padding: '12px', background: 'white', borderRadius: '8px', border: `2px solid ${regErrors.agreedToBackgroundCheck ? '#fca5a5' : '#86efac'}` }}>
                            <input type="checkbox" name="agreedToBackgroundCheck" checked={regForm.agreedToBackgroundCheck} onChange={handleRegChange} style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }} id="bg-check-modal" />
                            <label htmlFor="bg-check-modal" style={{ fontSize: '13px', color: '#1e293b', cursor: 'pointer', lineHeight: '1.5' }}>
                              I consent to a background check and agree to the <a href="#" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: '500' }}>Terms of Service</a> and <a href="#" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: '500' }}>Privacy Policy</a>
                            </label>
                          </div>
                          {regErrors.agreedToBackgroundCheck && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>{regErrors.agreedToBackgroundCheck}</div>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button onClick={handleRegBack} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '2px solid #e2e8f0', background: 'white', color: '#475569', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                      Back
                    </button>
                    <button onClick={handleRegSubmit} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                      Complete Registration
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default ProviderDashboard;
