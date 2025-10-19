import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          🚸 DismissalPro
        </div>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: 'white',
            border: '2px solid white',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center'
        }}>
          {/* Left Column - Content */}
          <div style={{ color: 'white' }}>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              lineHeight: '1.2'
            }}>
              Streamline Your School's Dismissal Process
            </h1>

            <p style={{
              fontSize: '1.25rem',
              marginBottom: '2rem',
              opacity: 0.9,
              lineHeight: '1.6'
            }}>
              Simple, secure, and affordable dismissal management that runs itself.
              No training required, no servers to manage, no headaches.
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>✅</span>
                <span style={{ fontSize: '1.1rem' }}>Real-time car tracking and cone management</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>✅</span>
                <span style={{ fontSize: '1.1rem' }}>Privacy-focused student data protection</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>✅</span>
                <span style={{ fontSize: '1.1rem' }}>Bulk student import and car assignment</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>✅</span>
                <span style={{ fontSize: '1.1rem' }}>Works offline, syncs automatically</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => navigate('/register')}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: '#ffd700',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                Start Free Trial
              </button>
              <button
                onClick={() => {
                  const demoSection = document.getElementById('demo');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: '2px solid white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: '500'
                }}
              >
                See How It Works
              </button>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <span style={{ fontWeight: 'bold', color: '#333' }}>Car 45</span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '0.875rem'
                }}>
                  Cone 3
                </span>
              </div>
              <div style={{ color: '#666', fontSize: '0.875rem', paddingLeft: '1rem' }}>
                Emma K., Jake M., Sarah L.
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <span style={{ fontWeight: 'bold', color: '#333' }}>Car 12</span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#ffc107',
                  color: '#212529',
                  borderRadius: '12px',
                  fontSize: '0.875rem'
                }}>
                  Cone 1
                </span>
              </div>
              <div style={{ color: '#666', fontSize: '0.875rem', paddingLeft: '1rem' }}>
                Michael R., Anna T.
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#e7f3ff',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#004085'
              }}>
                <strong>🎯 Real-time updates across all devices</strong>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Pricing Section */}
      <section id="demo" style={{
        backgroundColor: 'white',
        padding: '4rem 2rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: '#333'
          }}>
            Simple, Transparent Pricing
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: '#666',
            marginBottom: '3rem'
          }}>
            One price, all features. No setup fees, no hidden costs.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {/* Monthly Plan */}
            <div style={{
              padding: '2rem',
              border: '2px solid #e9ecef',
              borderRadius: '12px',
              backgroundColor: 'white'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#333'
              }}>
                Monthly
              </h3>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: '#667eea',
                marginBottom: '1rem'
              }}>
                $39
                <span style={{ fontSize: '1rem', color: '#666' }}>/month</span>
              </div>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '1.5rem 0',
                textAlign: 'left'
              }}>
                <li style={{ padding: '0.5rem 0', color: '#333' }}>✓ Unlimited students</li>
                <li style={{ padding: '0.5rem 0', color: '#333' }}>✓ Unlimited cars</li>
                <li style={{ padding: '0.5rem 0', color: '#333' }}>✓ Real-time updates</li>
                <li style={{ padding: '0.5rem 0', color: '#333' }}>✓ Data export</li>
                <li style={{ padding: '0.5rem 0', color: '#333' }}>✓ Email support</li>
              </ul>
            </div>

            {/* Annual Plan */}
            <div style={{
              padding: '2rem',
              border: '2px solid #667eea',
              borderRadius: '12px',
              backgroundColor: '#f8f9ff',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#667eea',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 'bold'
              }}>
                Best Value
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#333'
              }}>
                Annual
              </h3>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: '#667eea',
                marginBottom: '1rem'
              }}>
                $29
                <span style={{ fontSize: '1rem', color: '#666' }}>/month</span>
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#28a745',
                marginBottom: '1rem',
                fontWeight: 'bold'
              }}>
                Save $120/year
              </div>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '1.5rem 0',
                textAlign: 'left'
              }}>
                <li style={{ padding: '0.5rem 0', color: '#333' }}>✓ Everything in Monthly</li>
                <li style={{ padding: '0.5rem 0', color: '#333' }}>✓ Priority support</li>
                <li style={{ padding: '0.5rem 0', color: '#333' }}>✓ Advanced analytics</li>
                <li style={{ padding: '0.5rem 0', color: '#333' }}>✓ Custom training</li>
              </ul>
            </div>
          </div>

          <div style={{ marginTop: '3rem' }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                padding: '1rem 3rem',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              Start Your Free 14-Day Trial
            </button>
            <p style={{
              fontSize: '0.875rem',
              color: '#666',
              marginTop: '1rem'
            }}>
              No credit card required • Cancel anytime • Full access during trial
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#343a40',
        color: 'white',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Product</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <a href="#" style={{ color: '#adb5bd', textDecoration: 'none' }}>Features</a>
                <a href="#" style={{ color: '#adb5bd', textDecoration: 'none' }}>Pricing</a>
                <a href="#" style={{ color: '#adb5bd', textDecoration: 'none' }}>Security</a>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Support</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <a href="#" style={{ color: '#adb5bd', textDecoration: 'none' }}>Help Center</a>
                <a href="#" style={{ color: '#adb5bd', textDecoration: 'none' }}>Contact Us</a>
                <a href="#" style={{ color: '#adb5bd', textDecoration: 'none' }}>Training</a>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: '1rem' }}>Legal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <a href="#" style={{ color: '#adb5bd', textDecoration: 'none' }}>Privacy Policy</a>
                <a href="#" style={{ color: '#adb5bd', textDecoration: 'none' }}>Terms of Service</a>
                <a href="#" style={{ color: '#adb5bd', textDecoration: 'none' }}>COPPA Compliance</a>
              </div>
            </div>
          </div>
          <div style={{
            borderTop: '1px solid #495057',
            paddingTop: '1rem',
            color: '#adb5bd'
          }}>
            © 2024 DismissalPro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;