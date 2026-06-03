import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Home as HomeIcon, Camera, Paintbrush, Truck, Sparkles, FileText, Handshake, DollarSign } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const goToServicesSearch = (query) => {
    const trimmed = String(query || '').trim();
    if (trimmed) {
      navigate(`/services?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/services');
    }
  };

  const handleSearch = () => {
    goToServicesSearch(searchQuery);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const popularServices = [
    { name: 'Home Repair', icon: Wrench, color: '#10b981', bgColor: '#d1fae5' },
    { name: 'Plumbing', icon: Wrench, color: '#3b82f6', bgColor: '#dbeafe' },
    { name: 'Out-Door Help', icon: HomeIcon, color: '#6366f1', bgColor: '#e0e7ff' },
    { name: 'Photography', icon: Camera, color: '#10b981', bgColor: '#d1fae5' },
    { name: 'Household Help', icon: Sparkles, color: '#3b82f6', bgColor: '#dbeafe' },
    { name: 'Trending', icon: Sparkles, color: '#6366f1', bgColor: '#e0e7ff' }
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Post a Task',
      description: 'Describe what you need done and when you need it. It\'s quick and easy.',
      icon: FileText,
      color: '#10b981'
    },
    {
      step: '2',
      title: 'Get Matched',
      description: 'Get profiles, ratings, and prices. Then choose the right person for the job.',
      icon: Handshake,
      color: '#3b82f6'
    },
    {
      step: '3',
      title: 'Pay Securely',
      description: 'Payment is cashless and secure. When the task is done, you can leave a review.',
      icon: DollarSign,
      color: '#6366f1'
    }
  ];

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
          <a href="/services" style={{ textDecoration: 'none', color: '#333', fontSize: '16px', fontWeight: '500' }}>Services</a>
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
            marginLeft: '20px',
            transition: 'all 0.3s'
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
            fontWeight: '600',
            transition: 'all 0.3s'
          }}>
            Signup
          </a>
          <a href="/admin-login" style={{
            textDecoration: 'none',
            backgroundColor: '#0a2b5e',
            color: '#fff',
            padding: '12px 28px',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.3s'
          }}>
            Administrator
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 20px 80px',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #e1f5fe 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(66,153,225,0.15) 0%, transparent 70%)',
          top: '-200px',
          right: '-100px',
          pointerEvents: 'none'
        }}></div>
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(66,153,225,0.1) 0%, transparent 70%)',
          bottom: '-150px',
          left: '-100px',
          pointerEvents: 'none'
        }}></div>
        <h1 style={{
          fontSize: '56px',
          fontWeight: 'bold',
          color: '#1a202c',
          marginBottom: '24px',
          maxWidth: '900px',
          textAlign: 'center',
          lineHeight: '1.1',
          position: 'relative',
          zIndex: 1
        }}>
          Find trusted help for your daily tasks
        </h1>

        <p style={{
          fontSize: '22px',
          color: '#4a5568',
          marginBottom: '50px',
          textAlign: 'center',
          maxWidth: '700px',
          lineHeight: '1.6',
          position: 'relative',
          zIndex: 1
        }}>
          Hire skilled professionals for home and personal services — quick, safe, and affordable.
        </p>

        {/* Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#fff',
          borderRadius: '50px',
          padding: '8px 8px 8px 28px',
          boxShadow: '0 10px 40px rgba(66,153,225,0.25)',
          width: '100%',
          maxWidth: '700px',
          marginBottom: '35px',
          position: 'relative',
          zIndex: 1,
          border: '2px solid rgba(255,255,255,0.8)'
        }}>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" style={{ marginRight: '14px' }}>
            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            placeholder="What do you need help with?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '17px',
              color: '#333',
              backgroundColor: 'transparent'
            }}
          />
          <button type="button" onClick={handleSearch} style={{
            backgroundColor: '#0066ff',
            color: '#fff',
            border: 'none',
            borderRadius: '50px',
            padding: '16px 38px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            marginLeft: '10px',
            transition: 'all 0.3s',
            boxShadow: '0 4px 15px rgba(0,102,255,0.3)'
          }}
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 6px 20px rgba(0,102,255,0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 15px rgba(0,102,255,0.3)';
            }}>
            Search
          </button>
        </div>

        {/* Popular Tags */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <span style={{ color: '#5a6c7d', fontSize: '16px', fontWeight: '500' }}>Popular:</span>
          {['Cleaning', 'Repairs', 'Moving', 'Painting', 'Photography'].map((service) => (
            <button
              key={service}
              type="button"
              onClick={() => goToServicesSearch(service)}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '25px',
                padding: '10px 22px',
                fontSize: '15px',
                color: '#333',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontWeight: '500',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
              onMouseOver={(e) => {
                e.target.style.borderColor = '#0066ff';
                e.target.style.color = '#0066ff';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0,102,255,0.2)';
              }}
              onMouseOut={(e) => {
                e.target.style.borderColor = '#ddd';
                e.target.style.color = '#333';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
              }}
            >
              {service}
            </button>
          ))}
        </div>
      </section>

      {/* Popular Services Section */}
      <section style={{
        padding: '80px 50px',
        backgroundColor: '#fff'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '42px',
            fontWeight: 'bold',
            color: '#1a202c',
            textAlign: 'center',
            marginBottom: '12px'
          }}>
            Popular Services
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#718096',
            textAlign: 'center',
            marginBottom: '60px'
          }}>
            Whatever you need, we've got you covered
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {popularServices.map((service, idx) => {
              const Icon = service.icon;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '20px',
                    padding: '40px 30px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  }}
                >
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: service.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <Icon size={36} color={service.color} strokeWidth={2} />
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#2d3748',
                    margin: 0
                  }}>
                    {service.name}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{
        padding: '80px 50px',
        backgroundColor: 'linear-gradient(135deg, #e8f0f8 0%, #f0f4f8 100%)',
        background: 'linear-gradient(135deg, #e8f0f8 0%, #f0f4f8 100%)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '42px',
            fontWeight: 'bold',
            color: '#1a202c',
            textAlign: 'center',
            marginBottom: '12px'
          }}>
            How It Works
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#718096',
            textAlign: 'center',
            marginBottom: '70px'
          }}>
            Getting help is simple. Just follow these three easy steps.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '50px',
            maxWidth: '1100px',
            margin: '0 auto'
          }}>
            {howItWorks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  style={{
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    backgroundColor: item.color + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 30px',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      {item.step}
                    </div>
                    <Icon size={50} color={item.color} strokeWidth={2} />
                  </div>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#2d3748',
                    marginBottom: '15px'
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontSize: '16px',
                    color: '#4a5568',
                    lineHeight: '1.6',
                    maxWidth: '280px',
                    margin: '0 auto'
                  }}>
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section style={{
        padding: '80px 50px',
        backgroundColor: '#0066ff',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '42px',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}>
            Ready to get started?
          </h2>
          <p style={{
            fontSize: '20px',
            marginBottom: '40px',
            opacity: 0.95
          }}>
            Join thousands of happy customers who trust Hire Right for their daily tasks
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
              backgroundColor: '#fff',
              color: '#0066ff',
              border: 'none',
              borderRadius: '30px',
              padding: '16px 40px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}>
              Post a Task
            </button>
            <button
              type="button"
              onClick={() => navigate('/become-a-worker')}
              style={{
              backgroundColor: 'transparent',
              color: '#fff',
              border: '2px solid #fff',
              borderRadius: '30px',
              padding: '16px 40px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}>
              Become a Worker
            </button>
          </div>
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
    </div>
  );
}