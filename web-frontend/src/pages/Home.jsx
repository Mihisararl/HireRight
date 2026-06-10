import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wrench, Home as HomeIcon, Camera, Paintbrush, Sparkles, FileText, Handshake, DollarSign } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  const popularTags = useMemo(() => [
    { key: 'cleaning', query: t('home.tags.cleaning') },
    { key: 'repairs', query: t('home.tags.repairs') },
    { key: 'moving', query: t('home.tags.moving') },
    { key: 'painting', query: t('home.tags.painting') },
    { key: 'photography', query: t('home.tags.photography') },
  ], [t]);

  const popularServices = useMemo(() => [
    { name: t('home.popularServices.homeRepair'), icon: Wrench, color: '#10b981', bgColor: '#d1fae5' },
    { name: t('home.popularServices.plumbing'), icon: Wrench, color: '#3b82f6', bgColor: '#dbeafe' },
    { name: t('home.popularServices.outdoorHelp'), icon: HomeIcon, color: '#6366f1', bgColor: '#e0e7ff' },
    { name: t('home.popularServices.photography'), icon: Camera, color: '#10b981', bgColor: '#d1fae5' },
    { name: t('home.popularServices.householdHelp'), icon: Sparkles, color: '#3b82f6', bgColor: '#dbeafe' },
    { name: t('home.popularServices.trending'), icon: Sparkles, color: '#6366f1', bgColor: '#e0e7ff' },
  ], [t]);

  const howItWorks = useMemo(() => [
    {
      step: '1',
      title: t('home.howItWorks.step1Title'),
      description: t('home.howItWorks.step1Desc'),
      icon: FileText,
      color: '#10b981',
    },
    {
      step: '2',
      title: t('home.howItWorks.step2Title'),
      description: t('home.howItWorks.step2Desc'),
      icon: Handshake,
      color: '#3b82f6',
    },
    {
      step: '3',
      title: t('home.howItWorks.step3Title'),
      description: t('home.howItWorks.step3Desc'),
      icon: DollarSign,
      color: '#6366f1',
    },
  ], [t]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: "'Noto Sans Sinhala', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
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
        zIndex: 1000,
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#0066cc',
          letterSpacing: '-0.5px',
        }}>
          {t('common.appName')}
        </div>

        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <LanguageSwitcher />
          <a href="/" style={{ textDecoration: 'none', color: '#333', fontSize: '16px', fontWeight: '500' }}>{t('home.nav.home')}</a>
          <a href="/services" style={{ textDecoration: 'none', color: '#333', fontSize: '16px', fontWeight: '500' }}>{t('home.nav.services')}</a>
          <a href="/how-it-works" style={{ textDecoration: 'none', color: '#333', fontSize: '16px', fontWeight: '500' }}>{t('home.nav.howItWorks')}</a>
          <a href="/become-a-worker" style={{ textDecoration: 'none', color: '#333', fontSize: '16px', fontWeight: '500' }}>{t('home.nav.becomeWorker')}</a>
          <a href="/login" style={{
            textDecoration: 'none',
            backgroundColor: '#0066ff',
            color: '#fff',
            padding: '12px 28px',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.3s',
          }}>
            {t('home.nav.login')}
          </a>
          <a href="/signup" style={{
            textDecoration: 'none',
            backgroundColor: '#0066ff',
            color: '#fff',
            padding: '12px 28px',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.3s',
          }}>
            {t('home.nav.signup')}
          </a>
          <a href="/admin-login" style={{
            textDecoration: 'none',
            backgroundColor: '#0a2b5e',
            color: '#fff',
            padding: '12px 28px',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.3s',
          }}>
            {t('home.nav.administrator')}
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
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(66,153,225,0.15) 0%, transparent 70%)',
          top: '-200px',
          right: '-100px',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(66,153,225,0.1) 0%, transparent 70%)',
          bottom: '-150px',
          left: '-100px',
          pointerEvents: 'none',
        }} />
        <h1 style={{
          fontSize: '56px',
          fontWeight: 'bold',
          color: '#1a202c',
          marginBottom: '24px',
          maxWidth: '900px',
          textAlign: 'center',
          lineHeight: '1.1',
          position: 'relative',
          zIndex: 1,
        }}>
          {t('home.hero.title')}
        </h1>

        <p style={{
          fontSize: '22px',
          color: '#4a5568',
          marginBottom: '50px',
          textAlign: 'center',
          maxWidth: '700px',
          lineHeight: '1.6',
          position: 'relative',
          zIndex: 1,
        }}>
          {t('home.hero.subtitle')}
        </p>

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
          border: '2px solid rgba(255,255,255,0.8)',
        }}>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" style={{ marginRight: '14px' }}>
            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            placeholder={t('home.hero.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '17px',
              color: '#333',
              backgroundColor: 'transparent',
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
            boxShadow: '0 4px 15px rgba(0,102,255,0.3)',
          }}>
            {t('home.hero.search')}
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          <span style={{ color: '#5a6c7d', fontSize: '16px', fontWeight: '500' }}>{t('home.hero.popular')}</span>
          {popularTags.map((tag) => (
            <button
              key={tag.key}
              type="button"
              onClick={() => goToServicesSearch(tag.query)}
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
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              {tag.query}
            </button>
          ))}
        </div>
      </section>

      {/* Popular Services Section */}
      <section style={{ padding: '80px 50px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '42px',
            fontWeight: 'bold',
            color: '#1a202c',
            textAlign: 'center',
            marginBottom: '12px',
          }}>
            {t('home.popularServices.title')}
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#718096',
            textAlign: 'center',
            marginBottom: '60px',
          }}>
            {t('home.popularServices.subtitle')}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
            maxWidth: '1000px',
            margin: '0 auto',
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
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
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
                    margin: '0 auto 20px',
                  }}>
                    <Icon size={36} color={service.color} strokeWidth={2} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748', margin: 0 }}>
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
        background: 'linear-gradient(135deg, #e8f0f8 0%, #f0f4f8 100%)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '42px',
            fontWeight: 'bold',
            color: '#1a202c',
            textAlign: 'center',
            marginBottom: '12px',
          }}>
            {t('home.howItWorks.title')}
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#718096',
            textAlign: 'center',
            marginBottom: '70px',
          }}>
            {t('home.howItWorks.subtitle')}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '50px',
            maxWidth: '1100px',
            margin: '0 auto',
          }}>
            {howItWorks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} style={{ textAlign: 'center', position: 'relative' }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    backgroundColor: item.color + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 30px',
                    position: 'relative',
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
                      fontWeight: 'bold',
                    }}>
                      {item.step}
                    </div>
                    <Icon size={50} color={item.color} strokeWidth={2} />
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#2d3748', marginBottom: '15px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '16px', color: '#4a5568', lineHeight: '1.6', maxWidth: '280px', margin: '0 auto' }}>
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
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '42px', fontWeight: 'bold', marginBottom: '20px' }}>
            {t('home.cta.title')}
          </h2>
          <p style={{ fontSize: '20px', marginBottom: '40px', opacity: 0.95 }}>
            {t('home.cta.subtitle')}
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
              }}
            >
              {t('home.cta.postTask')}
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
              }}
            >
              {t('home.cta.becomeWorker')}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1a202c', color: '#fff', padding: '60px 50px 30px' }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          marginBottom: '40px',
        }}>
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#0066ff' }}>
              {t('common.appName')}
            </h3>
            <p style={{ fontSize: '14px', color: '#a0aec0', lineHeight: '1.6' }}>
              {t('home.footer.tagline')}
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>{t('home.footer.company')}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>{t('home.footer.aboutUs')}</a></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>{t('home.footer.careers')}</a></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>{t('home.footer.press')}</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>{t('home.footer.support')}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>{t('home.footer.helpCenter')}</a></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>{t('home.footer.safety')}</a></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>{t('home.footer.contact')}</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>{t('home.footer.legal')}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '10px' }}><Link to="/privacy-policy" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>{t('home.footer.privacy')}</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/worker-policy" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>{t('policies.worker.linkText')}</Link></li>
              <li style={{ marginBottom: '10px' }}><a href="#" style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>{t('home.footer.cookies')}</a></li>
            </ul>
          </div>
        </div>
        <div style={{
          borderTop: '1px solid #2d3748',
          paddingTop: '30px',
          textAlign: 'center',
          color: '#718096',
          fontSize: '14px',
        }}>
          {t('home.footer.copyright')}
        </div>
      </footer>
    </div>
  );
}
