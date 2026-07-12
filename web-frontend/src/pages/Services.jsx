import React, { useState, useEffect, useContext } from 'react';
import { Search, Wrench, Home, Paintbrush, Truck, Sparkles, MapPin, Phone, Star, X } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getApprovedProviders, getProvidersByCategory } from '../api/provider';
import { createServiceRequest } from '../api/service';
import LocationPicker from '../components/location/LocationPicker';
import { hasCoordinates } from '../utils/locationHelpers';
import {
  formatProviderRateLong,
  getProviderRateAmount,
  getProviderRateTitle,
} from '../utils/providerRate';

export default function Services() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('All Services');
  const [sortBy, setSortBy] = useState('rating');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingModal, setBookingModal] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    serviceTitle: '',
    description: '',
    preferredDate: '',
    preferredTime: '',
    location: { address: '' },
    specificRequirements: ''
  });

  const categories = [
    { name: 'All Services', icon: Sparkles, count: null },
    { name: 'Home Cleaning', icon: Sparkles, count: null },
    { name: 'Plumbing', icon: Wrench, count: null },
    { name: 'Electrical', icon: Wrench, count: null },
    { name: 'Carpentry', icon: Wrench, count: null },
    { name: 'Painting', icon: Paintbrush, count: null },
    { name: 'Landscaping', icon: Home, count: null },
    { name: 'HVAC', icon: Home, count: null },
    { name: 'Handyman', icon: Wrench, count: null },
    { name: 'Moving', icon: Truck, count: null },
    { name: 'Other', icon: Sparkles, count: null }
  ];

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Fetch providers on component mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const data = await getApprovedProviders();
        setProviders(data);
      } catch (error) {
        console.error('Failed to fetch providers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  useEffect(() => {
    if (location.state?.bookingIntent && user) {
      handleBook(location.state.bookingIntent);
      navigate('/services', { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, user]);

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Transform providers to service format
  const services = providers.map((provider) => {
    const bookedDates = provider.bookedDates || [];

    return {
      id: provider._id,
      providerId: provider.userId,
      title: `${provider.serviceCategory} Service`,
      provider: `${provider.firstName} ${provider.lastName}`,
      image: provider.portfolioPhoto || provider.profilePhoto || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
      location: `${provider.city}`,
      rating: provider.rating,
      reviews: provider.totalReviews,
      rateType: provider.rateType || 'hourly',
      hourlyRate: provider.hourlyRate,
      dailyRate: provider.dailyRate,
      price: getProviderRateAmount(provider) ?? 0,
      priceLabel: formatProviderRateLong(provider) || 'Rate not set',
      rateTitle: getProviderRateTitle(provider),
      responseTime: '1 hour',
      category: provider.serviceCategory,
      experience: provider.yearsOfExperience,
      bio: provider.professionalBio,
      email: provider.email,
      phone: provider.phone,
      district: provider.district,
      isAvailableToday: Boolean(provider.isAvailableToday),
      bookedDates,
      bookedToday: Boolean(provider.bookedToday)
    };
  });

  const filteredServices = services.filter(service =>
    (selectedCategory === 'All Services' || service.category === selectedCategory) &&
    (searchQuery === '' ||
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const sortedServices = [...filteredServices].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0;
  });

  const handleBook = (service) => {
    if (!user) {
      // Not logged in, redirect to login
      navigate('/login', { state: { from: '/services', message: 'Please login to book a service', bookingIntent: service } });
      return;
    }

    // If customer, open booking modal
    if (user.role === 'customer') {
      setBookingModal(service);
      setBookingForm({
        serviceTitle: service.title,
        description: `Booking ${service.provider} for ${service.category}`,
        preferredDate: '',
        preferredTime: '',
        location: { address: '' },
        specificRequirements: ''
      });
    } else {
      alert('Only customers can book services');
    }
  };

  const handleSubmitBooking = async () => {
    if (!bookingForm.preferredDate || !bookingForm.preferredTime) {
      alert('Please fill in all required fields');
      return;
    }

    if (!hasCoordinates(bookingForm.location) || !String(bookingForm.location.address || '').trim()) {
      alert('Please select your location on the map and enter an address.');
      return;
    }

    try {
      const providerRate = Number(bookingModal.price);
      const payload = {
        userId: user.id,
        serviceCategory: bookingModal.category,
        serviceTitle: bookingForm.serviceTitle,
        description: bookingForm.description,
        preferredDate: bookingForm.preferredDate,
        preferredTime: bookingForm.preferredTime,
        dailyBudget: Number.isFinite(providerRate) && providerRate > 0 ? providerRate : 1,
        location: bookingForm.location,
        specificRequirements: bookingForm.specificRequirements,
        providerId: bookingModal.providerId,
        bookingType: 'direct'
      };

      await createServiceRequest(payload);
      alert('Service request sent successfully! The provider will review your booking request.');
      navigate('/customer-dashboard', { state: { tab: 'posts' } });
      setBookingModal(null);
      setBookingForm({
        serviceTitle: '',
        description: '',
        preferredDate: '',
        preferredTime: '',
        location: { address: '' },
        specificRequirements: ''
      });
    } catch (error) {
      console.error('Failed to book service:', error);
      alert('Failed to send service request. Please try again.');
    }
  };

  const closeBookingModal = () => {
    setBookingModal(null);
    setBookingForm({
      serviceTitle: '',
      description: '',
      preferredDate: '',
      preferredTime: '',
      location: { address: '' },
      specificRequirements: ''
    });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 50px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#0066cc',
          letterSpacing: '-0.5px'
        }}>
          Hire Right
        </div>

        <nav style={{ display: 'flex', gap: '35px', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none', color: '#333', fontSize: '16px', fontWeight: '500' }}>Home</a>
          <a href="/services" style={{ textDecoration: 'none', color: '#0066ff', fontSize: '16px', fontWeight: '500' }}>Services</a>
          <a href="/how-it-works" style={{ textDecoration: 'none', color: '#333', fontSize: '16px', fontWeight: '500' }}>How It Works</a>
          <a href="/become-a-worker" style={{ textDecoration: 'none', color: '#333', fontSize: '16px', fontWeight: '500' }}>Become a Worker</a>
          <a href="/login" style={{
            textDecoration: 'none',
            backgroundColor: '#0066ff',
            color: '#fff',
            padding: '12px 28px',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            marginLeft: '20px'
          }}>
            Login
          </a>
          <a href="/signup" style={{
            textDecoration: 'none',
            backgroundColor: '#0066ff',
            color: '#fff',
            padding: '12px 28px',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            Sign Up
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #4299e1 0%, #0066ff 100%)',
        padding: '80px 50px',
        textAlign: 'center',
        color: '#fff'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          marginBottom: '16px',
          letterSpacing: '-0.5px'
        }}>
          Browse All Services
        </h1>
        <p style={{
          fontSize: '20px',
          marginBottom: '40px',
          opacity: 0.95
        }}>
          Find the perfect professional for any task
        </p>

        {/* Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#fff',
          borderRadius: '50px',
          padding: '8px 8px 8px 24px',
          maxWidth: '650px',
          margin: '0 auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
        }}>
          <Search size={20} color="#999" style={{ marginRight: '12px' }} />
          <input
            type="text"
            placeholder="Search services or providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              color: '#333',
              backgroundColor: 'transparent'
            }}
          />
          <button style={{
            backgroundColor: '#0066ff',
            color: '#fff',
            border: 'none',
            borderRadius: '50px',
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Search
          </button>
        </div>
      </section>

      {/* Filter Section */}
      <section style={{
        backgroundColor: '#fff',
        padding: '30px 50px',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: '73px',
        zIndex: 999
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', marginRight: '15px' }}>
              Filter by Category
            </span>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.name;
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: isSelected ? '#0066ff' : '#f3f4f6',
                    color: isSelected ? '#fff' : '#374151',
                    border: 'none',
                    borderRadius: '25px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icon size={16} />
                  <span>{category.name}</span>
                  {category.count && (
                    <span style={{
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {category.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section style={{
        padding: '50px 50px 80px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Results Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: 0
            }}>
              Showing {sortedServices.length} services
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  color: '#374151',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="rating">Rating</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Service Cards Grid */}
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '18px', marginBottom: '16px' }}>Loading providers...</div>
              <div style={{
                display: 'inline-block',
                width: '40px',
                height: '40px',
                border: '4px solid #e5e7eb',
                borderTop: '4px solid #0066ff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}>
              </div>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : sortedServices.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '18px' }}>No providers found in this category</div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '25px'
            }}>
              {sortedServices.map((service) => (
                <div
                  key={service.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  }}
                >
                  {/* Image */}
                  <div style={{
                    position: 'relative',
                    height: '200px',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={service.image}
                      alt={service.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: '#fff',
                      borderRadius: '20px',
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}>
                      <Star size={14} fill="#fbbf24" color="#fbbf24" />
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                        {service.reviews > 0 ? service.rating : 'New'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '20px' }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '8px'
                    }}>
                      {service.title}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '12px'
                    }}>
                      {service.provider}
                    </p>

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '16px'
                    }}>
                      {service.isAvailableToday && (
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          backgroundColor: '#dcfce7',
                          color: '#166534'
                        }}>
                          Available today
                        </span>
                      )}
                      {!service.isAvailableToday && (
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          backgroundColor: '#fef2f2',
                          color: '#b91c1c'
                        }}>
                          Not available today
                        </span>
                      )}
                    </div>
                    {service.bookedDates.length > 0 && (
                      <p style={{
                        fontSize: '12px',
                        color: '#9a3412',
                        margin: '0 0 12px',
                        lineHeight: 1.5
                      }}>
                        <strong>All booked dates:</strong>{' '}
                        {service.bookedDates.map(formatDisplayDate).join(' · ')}
                        {service.isAvailableToday && service.bookedToday && (
                          <span style={{ color: '#059669', display: 'block', marginTop: '4px' }}>
                            Still available today for other time slots — booked dates shown above
                          </span>
                        )}
                        {!service.isAvailableToday && (
                          <span style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>
                            Available on other days — not taking new jobs today
                          </span>
                        )}
                      </p>
                    )}

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="#9ca3af" />
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                          {service.location}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} color="#9ca3af" />
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                          {service.phone || 'Not provided'}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '16px',
                      borderTop: '1px solid #f3f4f6'
                    }}>
                      <div>
                        <span style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: '#1f2937',
                          whiteSpace: 'nowrap'
                        }}>
                          {service.priceLabel}
                        </span>
                      </div>
                      <button
                        onClick={() => handleBook(service)}
                        style={{
                          backgroundColor: '#0066ff',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 20px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}>
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#1a202c',
        color: '#fff',
        padding: '60px 50px 30px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          marginBottom: '40px'
        }}>
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#0066ff' }}>
              Hire Right
            </h3>
            <p style={{ fontSize: '14px', color: '#a0aec0', lineHeight: '1.6' }}>
              Your trusted platform for finding skilled professionals for all your daily tasks.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>Company</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>About Us</a></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>Careers</a></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>Press</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>Support</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>Help Center</a></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>Safety</a></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>Privacy Policy</a></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>Terms of Service</a></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div style={{
          borderTop: '1px solid #2d3748',
          paddingTop: '30px',
          textAlign: 'center',
          color: '#718096',
          fontSize: '14px'
        }}>
          © 2025 Hire Right. All rights reserved.
        </div>
      </footer>

      {/* Booking Modal */}
      {bookingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0
              }}>
                Request Service from {bookingModal.provider}
              </h2>
              <button
                onClick={closeBookingModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <X size={24} color="#6b7280" />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {/* Service Info */}
              <div style={{
                backgroundColor: '#f3f4f6',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Provider</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                  {bookingModal.provider}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Service Category</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                  {bookingModal.category}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>{bookingModal.rateTitle}</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', whiteSpace: 'nowrap' }}>
                  {bookingModal.priceLabel}
                </div>
              </div>

              {/* Form Fields */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', display: 'block', marginBottom: '8px' }}>
                  Service Title *
                </label>
                <input
                  type="text"
                  value={bookingForm.serviceTitle}
                  onChange={(e) => setBookingForm({ ...bookingForm, serviceTitle: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', display: 'block', marginBottom: '8px' }}>
                  Description
                </label>
                <textarea
                  value={bookingForm.description}
                  onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    minHeight: '80px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', display: 'block', marginBottom: '8px' }}>
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    value={bookingForm.preferredDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', display: 'block', marginBottom: '8px' }}>
                    Preferred Time *
                  </label>
                  <input
                    type="time"
                    value={bookingForm.preferredTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, preferredTime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <LocationPicker
                value={bookingForm.location}
                onChange={(location) => setBookingForm((prev) => ({ ...prev, location }))}
              />

              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', display: 'block', marginBottom: '8px' }}>
                  Specific Requirements
                </label>
                <textarea
                  placeholder="Any special requests or requirements..."
                  value={bookingForm.specificRequirements}
                  onChange={(e) => setBookingForm({ ...bookingForm, specificRequirements: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    minHeight: '60px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '24px',
                borderTop: '1px solid #e5e7eb',
                paddingTop: '24px'
              }}>
                <button
                  onClick={closeBookingModal}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitBooking}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    backgroundColor: '#0066ff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}