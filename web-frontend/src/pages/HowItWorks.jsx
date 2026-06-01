import React from 'react';
import { FileText, Users, DollarSign, UserPlus, Search, CheckCircle, Shield, Clock, Star, MessageSquare } from 'lucide-react';

export default function HowItWorks() {
  const forCustomers = [
    {
      step: '1',
      title: 'Post a Task',
      description: 'Describe what you need done and when you need it. It\'s quick and easy.',
      icon: FileText,
      color: '#10b981',
      details: [
        'Describe your task clearly',
        'Set your budget and timeline',
        'Add photos if needed',
        'Publish in seconds'
      ]
    },
    {
      step: '2',
      title: 'Get Matched',
      description: 'Review profiles, ratings, and prices. Then choose the right person for the job.',
      icon: Users,
      color: '#3b82f6',
      details: [
        'Review worker profiles',
        'Compare ratings and reviews',
        'Chat with potential workers',
        'Get detailed pricing'
      ]
    },
    {
      step: '3',
      title: 'Pay Securely',
      description: 'Payment is cashless and secure. When the task is done, you can leave a review.',
      icon: DollarSign,
      color: '#6366f1',
      details: [
        'Secure payment processing',
        'Track task progress',
        'Release payment when satisfied',
        'Leave a review and rating'
      ]
    }
  ];

  const forWorkers = [
    {
      step: '1',
      title: 'Create Your Profile',
      description: 'Sign up and create a professional profile showcasing your skills and experience.',
      icon: UserPlus,
      color: '#10b981',
      details: [
        'Upload profile photo',
        'List your skills and expertise',
        'Set your service rates',
        'Complete background check'
      ]
    },
    {
      step: '2',
      title: 'Find Tasks',
      description: 'Browse available tasks, see job details, and submit proposals to clients.',
      icon: Search,
      color: '#3b82f6',
      details: [
        'Filter by skill and location',
        'View detailed job descriptions',
        'Submit competitive proposals',
        'Chat with clients directly'
      ]
    },
    {
      step: '3',
      title: 'Complete & Get Paid',
      description: 'Do the job professionally and receive secure payment directly to your account.',
      icon: CheckCircle,
      color: '#6366f1',
      details: [
        'Complete tasks on time',
        'Communicate with clients',
        'Receive secure payments',
        'Build your reputation'
      ]
    }
  ];

  const whyChoose = [
    {
      title: 'Trust & Safety',
      description: 'All workers are verified with background checks to ensure your safety and peace of mind.',
      icon: Shield,
      color: '#10b981'
    },
    {
      title: 'Save Time',
      description: 'Get matched with qualified professionals in minutes, not days. Quick and efficient service.',
      icon: Clock,
      color: '#3b82f6'
    },
    {
      title: 'Quality Guaranteed',
      description: 'Read reviews and ratings from real customers to find the best person for your job.',
      icon: Star,
      color: '#f59e0b'
    },
    {
      title: 'Easy Communication',
      description: 'Chat directly with workers through our platform. Clear communication leads to better results.',
      icon: MessageSquare,
      color: '#8b5cf6'
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
          <a href="/how-it-works" style={{ textDecoration: 'none', color: '#0066ff', fontSize: '16px', fontWeight: '600' }}>How It Works</a>
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
            Signup
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '80px 50px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #4299e1 0%, #667eea 100%)',
        color: '#fff'
      }}>
        <h1 style={{
          fontSize: '52px',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}>
          How Hire Right Works
        </h1>
        <p style={{
          fontSize: '20px',
          maxWidth: '700px',
          margin: '0 auto',
          opacity: 0.95
        }}>
          Simple, secure, and efficient. Connect with professionals or find work in just a few easy steps.
        </p>
      </section>

      {/* For Customers Section */}
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
              For Customers
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#718096'
            }}>
              Getting help is simple. Just follow these three easy steps.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '50px'
          }}>
            {forCustomers.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} style={{ textAlign: 'center' }}>
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
                      width: '45px',
                      height: '45px',
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '22px',
                      fontWeight: 'bold'
                    }}>
                      {item.step}
                    </div>
                    <Icon size={55} color={item.color} strokeWidth={2} />
                  </div>
                  
                  <h3 style={{
                    fontSize: '26px',
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
                    marginBottom: '25px'
                  }}>
                    {item.description}
                  </p>

                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    textAlign: 'left',
                    maxWidth: '280px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}>
                    {item.details.map((detail, i) => (
                      <li key={i} style={{
                        fontSize: '14px',
                        color: '#718096',
                        marginBottom: '10px',
                        paddingLeft: '25px',
                        position: 'relative'
                      }}>
                        <span style={{
                          position: 'absolute',
                          left: 0,
                          color: item.color,
                          fontWeight: 'bold'
                        }}>✓</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* For Workers Section */}
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
              For Workers
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#718096'
            }}>
              Turn your skills into income. Start earning on your own schedule.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '50px'
          }}>
            {forWorkers.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} style={{ textAlign: 'center' }}>
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
                      width: '45px',
                      height: '45px',
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '22px',
                      fontWeight: 'bold'
                    }}>
                      {item.step}
                    </div>
                    <Icon size={55} color={item.color} strokeWidth={2} />
                  </div>
                  
                  <h3 style={{
                    fontSize: '26px',
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
                    marginBottom: '25px'
                  }}>
                    {item.description}
                  </p>

                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    textAlign: 'left',
                    maxWidth: '280px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}>
                    {item.details.map((detail, i) => (
                      <li key={i} style={{
                        fontSize: '14px',
                        color: '#718096',
                        marginBottom: '10px',
                        paddingLeft: '25px',
                        position: 'relative'
                      }}>
                        <span style={{
                          position: 'absolute',
                          left: 0,
                          color: item.color,
                          fontWeight: 'bold'
                        }}>✓</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
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
              Why Choose Hire Right?
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#718096'
            }}>
              We understand the problems, fix pain points. Simple and safe to use.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '40px'
          }}>
            {whyChoose.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  style={{
                    textAlign: 'center',
                    padding: '40px 30px',
                    backgroundColor: '#fff',
                    borderRadius: '15px',
                    transition: 'all 0.3s',
                    border: '1px solid #e5e7eb'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: item.color + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 25px'
                  }}>
                    <Icon size={40} color={item.color} strokeWidth={2} />
                  </div>
                  
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '600',
                    color: '#2d3748',
                    marginBottom: '15px'
                  }}>
                    {item.title}
                  </h3>
                  
                  <p style={{
                    fontSize: '15px',
                    color: '#718096',
                    lineHeight: '1.6'
                  }}>
                    {item.description}
                  </p>
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
            Ready to get started?
          </h2>
          <p style={{
            fontSize: '20px',
            marginBottom: '40px',
            opacity: 0.95
          }}>
            Join thousands who trust Hire Right. Whether you need help or want to earn, we've got you covered.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <a
              href="/services"
              style={{
                backgroundColor: '#fff',
                color: '#0066ff',
                border: 'none',
                borderRadius: '30px',
                padding: '16px 40px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Learn More
            </a>
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
          © 2024 Hire Right. All rights reserved.
        </div>
      </footer>
    </div>
  );
}