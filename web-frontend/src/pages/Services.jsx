import React, { useState } from 'react';
import { Search, Wrench, Home, Paintbrush, Truck, Sparkles, MapPin, Clock, Star } from 'lucide-react';

export default function Services() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Services');
  const [sortBy, setSortBy] = useState('rating');

  const categories = [
    { name: 'All Services', icon: Sparkles, count: null },
    { name: 'Cleaning', icon: Sparkles, count: 246 },
    { name: 'Repairs', icon: Wrench, count: 198 },
    { name: 'Painting', icon: Paintbrush, count: 156 },
    { name: 'Moving', icon: Truck, count: 132 },
    { name: 'Assembly', icon: Home, count: 187 },
    { name: 'Handyman', icon: Wrench, count: 223 },
    { name: 'Gardening', icon: Home, count: 145 }
  ];

  const services = [
    {
      id: 1,
      title: 'Deep House Cleaning',
      provider: 'Sarah Johnson',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
      location: 'Downtown',
      rating: 4.9,
      reviews: 127,
      price: 45,
      responseTime: '1 hour',
      category: 'Cleaning'
    },
    {
      id: 2,
      title: 'Plumbing & Repairs',
      provider: 'Mike Chen',
      image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&h=300&fit=crop',
      location: 'Westside',
      rating: 4.8,
      reviews: 93,
      price: 65,
      responseTime: '30 mins',
      category: 'Repairs'
    },
    {
      id: 3,
      title: 'Interior Painting',
      provider: 'David Mason',
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop',
      location: 'Northside',
      rating: 5.0,
      reviews: 84,
      price: 50,
      responseTime: '2 hours',
      category: 'Painting'
    },
    {
      id: 4,
      title: 'Moving & Delivery',
      provider: 'Tom Wilson',
      image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop',
      location: 'Eastside',
      rating: 4.7,
      reviews: 156,
      price: 80,
      responseTime: '1 hour',
      category: 'Moving'
    },
    {
      id: 5,
      title: 'Furniture Assembly',
      provider: 'Lisa Anderson',
      image: 'https://images.unsplash.com/photo-1581858726788-75bc0f1a4e1a?w=400&h=300&fit=crop',
      location: 'Downtown',
      rating: 4.9,
      reviews: 112,
      price: 55,
      responseTime: '45 mins',
      category: 'Assembly'
    },
    {
      id: 6,
      title: 'Garden Maintenance',
      provider: 'John Green',
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
      location: 'Suburbs',
      rating: 4.8,
      reviews: 68,
      price: 40,
      responseTime: '2 hours',
      category: 'Gardening'
    },
    {
      id: 7,
      title: 'Electrical Repairs',
      provider: 'Alex Rodriguez',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop',
      location: 'Westside',
      rating: 5.0,
      reviews: 145,
      price: 70,
      responseTime: '1 hour',
      category: 'Repairs'
    },
    {
      id: 8,
      title: 'Window Cleaning',
      provider: 'Emma Davis',
      image: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=400&h=300&fit=crop',
      location: 'Downtown',
      rating: 4.9,
      reviews: 91,
      price: 35,
      responseTime: '30 mins',
      category: 'Cleaning'
    }
  ];

  const filteredServices = services.filter(service => 
    (selectedCategory === 'All Services' || service.category === selectedCategory) &&
    (searchQuery === '' || 
     service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     service.provider.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedServices = [...filteredServices].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0;
  });

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
                      {service.rating}
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
                    marginBottom: '16px'
                  }}>
                    {service.provider}
                  </p>

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
                      <Clock size={14} color="#9ca3af" />
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>
                        Responds in {service.responseTime}
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
                        color: '#1f2937'
                      }}>
                        ${service.price}
                      </span>
                      <span style={{
                        fontSize: '14px',
                        color: '#9ca3af',
                        marginLeft: '2px'
                      }}>
                        /hr
                      </span>
                    </div>
                    <button style={{
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