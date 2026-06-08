import React, { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from '../utils/api';
import LocationPicker from '../components/location/LocationPicker';
import { hasCoordinates } from '../utils/locationHelpers';

const ServiceRequestPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    serviceCategory: "",
    serviceTitle: "",
    description: "",
    preferredDate: "",
    preferredTime: "",
    dailyBudget: "",
    location: { address: '' },
    specificRequirements: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasCoordinates(formData.location) || !String(formData.location.address || '').trim()) {
      alert('Please select your location on the map and enter an address.');
      return;
    }

    try {
      const payload = {
        ...formData,
        dailyBudget: Number(formData.dailyBudget),
      };
      delete payload.budget;
      delete payload.estimatedDuration;

      await api.post("/services", payload);
      alert("Service request posted successfully ✅");
      navigate("/customer-dashboard", { state: { tab: 'posts' } });
      setFormData({
        serviceCategory: "",
        serviceTitle: "",
        description: "",
        preferredDate: "",
        preferredTime: "",
        dailyBudget: "",
        location: { address: '' },
        specificRequirements: "",
      });
    } catch (error) {
      console.error("Error posting service request:", error);
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to post service request. Please try again.";
      alert(msg);
    }
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '40px 16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
        gap: '24px'
      }}>

        {/* ================= MAIN FORM ================= */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '32px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '24px',
            color: '#1f2937'
          }}>
            Post a Service Request
          </h2>

          <div onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>

            {/* Service Category */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>Service Category *</label>
              <select
                name="serviceCategory"
                value={formData.serviceCategory}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
                required
              >
                <option value="">Select a service</option>
                <option value="cleaning">Cleaning</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="carpentry">Carpentry</option>
                <option value="painting">Painting</option>
                <option value="moving">Moving</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Title */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>Service Title *</label>
              <input
                type="text"
                name="serviceTitle"
                value={formData.serviceTitle}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="e.g. Fix kitchen sink leakage"
                required
              />
            </div>

            {/* Description */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>Description *</label>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                placeholder="Explain the task clearly..."
                required
              />
            </div>

            {/* Date & Time */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth >= 768 ? '1fr 1fr' : '1fr',
              gap: '16px'
            }}>
              <div style={{ position: 'relative' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Preferred Date *</label>
                <Calendar style={{
                  position: 'absolute',
                  left: '12px',
                  top: '38px',
                  color: '#9ca3af',
                  pointerEvents: 'none'
                }} size={18} />
                <input
                  type="date"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Preferred Time *</label>
                <Clock style={{
                  position: 'absolute',
                  left: '12px',
                  top: '38px',
                  color: '#9ca3af',
                  pointerEvents: 'none'
                }} size={18} />
                <input
                  type="time"
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
            </div>

            {/* Daily budget */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>Budget per day (LKR) *</label>
              <p style={{
                margin: '0 0 8px',
                fontSize: '13px',
                color: '#6b7280',
                lineHeight: 1.5
              }}>
                Enter how much you are willing to pay for one day of work.
              </p>
              <input
                type="number"
                name="dailyBudget"
                min="1"
                step="1"
                value={formData.dailyBudget}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="e.g. 5000"
                required
              />
            </div>

            <LocationPicker
              value={formData.location}
              onChange={(location) => setFormData((prev) => ({ ...prev, location }))}
            />

            {/* Optional */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>Specific Requirements</label>
              <textarea
                name="specificRequirements"
                rows="3"
                value={formData.specificRequirements}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                placeholder="Any tools, skills, notes..."
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              style={{
                width: '100%',
                backgroundColor: '#2563eb',
                color: '#fff',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
            >
              Post Service Request
            </button>
          </div>
        </div>

        {/* ================= SIDEBAR ================= */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>

          <div style={{
            backgroundColor: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#1f2937'
            }}>How It Works</h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <li style={{ fontSize: '14px', color: '#4b5563' }}>• Post your request</li>
              <li style={{ fontSize: '14px', color: '#4b5563' }}>• Receive offers</li>
              <li style={{ fontSize: '14px', color: '#4b5563' }}>• Choose & pay securely</li>
              <li style={{ fontSize: '14px', color: '#4b5563' }}>• Job completed & review</li>
            </ul>
          </div>

          <div style={{
            backgroundColor: '#eff6ff',
            padding: '24px',
            borderRadius: '12px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#1f2937'
            }}>Tips for Success 💡</h3>
            <ul style={{
              fontSize: '14px',
              color: '#374151',
              lineHeight: '1.6',
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li>• Be detailed</li>
              <li>• Set a fair daily budget</li>
              <li>• Respond quickly</li>
            </ul>
          </div>

          <div style={{
            backgroundColor: '#fff7ed',
            padding: '24px',
            borderRadius: '12px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1f2937'
            }}>Trust & Safety 🔒</h3>
            <p style={{
              fontSize: '14px',
              color: '#374151',
              marginTop: '8px',
              lineHeight: '1.5',
              margin: 0
            }}>
              Payments are protected and released only after job completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestPage;