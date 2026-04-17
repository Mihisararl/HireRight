import React from 'react';
import { User, FileText, Headphones, Shield, Briefcase, Code, Camera, PenTool, Mic } from 'lucide-react';
import workerImg from '../assets/worker.jpg';


export default function BecomeWorker() {
  const features = [
    {
      icon: User,
      title: "Set up Your Profile",
      description: "Create your profile and showcase your skills and experience to potential clients"
    },
    {
      icon: FileText,
      title: "Quality Schedule",
      description: "Work on your own schedule and take on projects that fit your availability"
    },
    {
      icon: Headphones,
      title: "Getting Customer Base",
      description: "Access a wide range of clients actively looking for your expertise"
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "We've prepared secure and trusted environment for your work and payments"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Sign Up & Verify",
      description: "Create your account and complete the verification process to get started"
    },
    {
      number: "02",
      title: "Build Your Profile",
      description: "Add your skills, experience, and portfolio to attract clients"
    },
    {
      number: "03",
      title: "Get Hired",
      description: "Browse projects, submit proposals, and start earning money"
    }
  ];

  const categories = [
    { icon: Code, name: "Design" },
    { icon: Briefcase, name: "Digital Professional" },
    { icon: Camera, name: "Writing & Editing" },
    { icon: PenTool, name: "Handyman Services" },
    { icon: Mic, name: "Tutoring" },
    { icon: Code, name: "Marketing" },
    { icon: Camera, name: "Fitness" },
    { icon: PenTool, name: "Art Services" },
    { icon: Mic, name: "Entertainment" },
    { icon: Briefcase, name: "Business" }
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
          <a href="/become-a-worker" style={{ textDecoration: 'none', color: '#0066ff', fontSize: '16px', fontWeight: '600' }}>Become a Worker</a>
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
            Signup
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #4299e1 0%, #667eea 100%)',
        color: '#fff',
        padding: '80px 50px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '60px',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '52px',
              fontWeight: 'bold',
              marginBottom: '25px',
              lineHeight: '1.2'
            }}>
              Turn Your Skills Into Income
            </h1>
            <p style={{
              fontSize: '20px',
              marginBottom: '35px',
              opacity: 0.95,
              lineHeight: '1.6'
            }}>
              Join thousands of professionals earning on their own terms
            </p>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' }}>
              <button style={{
                backgroundColor: '#fff',
                color: '#0066ff',
                border: 'none',
                borderRadius: '8px',
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}>
                Get Started Now
              </button>
              <button style={{
                backgroundColor: 'transparent',
                color: '#fff',
                border: '2px solid #fff',
                borderRadius: '8px',
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Learn More
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
              <div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '5px' }}>10K+</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Active Workers</div>
              </div>
              <div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '5px' }}>Rs.6500</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Avg. Hourly Rate</div>
              </div>
              <div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '5px' }}>4.9★</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Average Rating</div>
              </div>
            </div>
          </div>
          <div>
            <img 
  src={workerImg}
  alt="Worker illustration"
  style={{
    width: '100%',
    borderRadius: '15px',
    boxShadow: '0 20px 60px rgba(95, 42, 42, 0.3)'
  }}
/>

          </div>
        </div>
      </section>

      {/* Why Work With Us Section */}
      <section style={{
        padding: '80px 50px',
        backgroundColor: '#fff'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '70px' }}>
            <h2 style={{
              fontSize: '42px',
              fontWeight: 'bold',
              color: '#1a202c',
              marginBottom: '15px'
            }}>
              Why Work With Us?
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#718096'
            }}>
              Join a platform that puts your success first with powerful tools and support
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '40px'
          }}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} style={{
                  textAlign: 'center',
                  padding: '40px 30px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '15px',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 25px'
                  }}>
                    <Icon size={40} color="#0066ff" strokeWidth={2} />
                  </div>
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '600',
                    color: '#2d3748',
                    marginBottom: '15px'
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    fontSize: '15px',
                    color: '#718096',
                    lineHeight: '1.6'
                  }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section style={{
        padding: '80px 50px',
        background: 'linear-gradient(135deg, #e8f0f8 0%, #f0f4f8 100%)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '70px' }}>
            <h2 style={{
              fontSize: '42px',
              fontWeight: 'bold',
              color: '#1a202c',
              marginBottom: '15px'
            }}>
              Getting Started Is Easy
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#718096'
            }}>
              Three simple steps to start earning
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '50px'
          }}>
            {steps.map((step, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: '#0066ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 30px',
                  color: '#fff',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  boxShadow: '0 10px 30px rgba(0,102,255,0.3)'
                }}>
                  {step.number}
                </div>
                <h3 style={{
                  fontSize: '26px',
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '15px'
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: '16px',
                  color: '#4a5568',
                  lineHeight: '1.6'
                }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Service Categories */}
      <section style={{
        padding: '80px 50px',
        backgroundColor: '#fff'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '70px' }}>
            <h2 style={{
              fontSize: '42px',
              fontWeight: 'bold',
              color: '#1a202c',
              marginBottom: '15px'
            }}>
              Popular Service Categories
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#718096'
            }}>
              Choose from hundreds of service categories
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '25px'
          }}>
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div 
                  key={index} 
                  style={{
                    padding: '35px 20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    border: '1px solid #e5e7eb'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                    e.currentTarget.style.backgroundColor = '#dbeafe';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                >
                  <div style={{ marginBottom: '15px' }}>
                    <Icon size={40} color="#0066ff" strokeWidth={2} />
                  </div>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2d3748'
                  }}>
                    {category.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
            Ready to Start Earning?
          </h2>
          <p style={{
            fontSize: '20px',
            marginBottom: '40px',
            opacity: 0.95
          }}>
            Join thousands of professionals who have already made the switch
          </p>
          <button style={{
            backgroundColor: '#fff',
            color: '#0066ff',
            border: 'none',
            borderRadius: '30px',
            padding: '18px 50px',
            fontSize: '20px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
          }}>
            Sign Up Today
          </button>
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
              Connecting skilled professionals with opportunities worldwide.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>For Workers</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>Find Work</a></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>How It Works</a></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>Success Stories</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>Company</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>About Us</a></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>Contact</a></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>Support</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>Help Center</a></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>Terms of Service</a></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>Privacy Policy</a></li>
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