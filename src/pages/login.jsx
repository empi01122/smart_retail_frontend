import React, { useEffect } from 'react';
import { SignIn, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/button';

export const Login = () => {
  const { isAuthenticated, loginBypass, loading } = useAuth();
  const clerkAuth = useClerkAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated (either Clerk or Bypass), take them to POS Checkout
    if (isAuthenticated) {
      navigate('/storefront');
    }
  }, [isAuthenticated, navigate]);

  const handleDevBypass = () => {
    loginBypass();
    navigate('/storefront');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        color: '#ffffff'
      }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="login-container" style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#05070c',
      fontFamily: 'inherit',
      color: '#ffffff',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Background visual elements */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(79, 70, 229, 0.25) 0%, transparent 70%)',
        filter: 'blur(40px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '15%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)',
        filter: 'blur(50px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Left Screen: Info/Branding */}
      <div className="login-left-pane">
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: '800',
              boxShadow: '0 4px 15px rgba(var(--primary-color-rgb), 0.4)'
            }}>
              S
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>Smart Retail</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Management Hub</span>
            </div>
          </div>

          <h1 style={{
            fontSize: '2.8rem',
            fontWeight: '800',
            lineHeight: 1.15,
            marginBottom: '20px',
            background: 'linear-gradient(to right, #ffffff, #93c5fd, #e0f2fe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Next-Gen Point of Sale & Store Operations.
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            marginBottom: '40px'
          }}>
            Manage products inventory, track checkout sales in real time, customize your storefront branding, and query automatic business reports powered by Gemini AI.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.5rem', background: 'rgba(79, 70, 229, 0.1)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(79, 70, 229, 0.2)' }}>⚡</div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px' }}>Real-time POS Checkout</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Quick search items, process baskets, and automatically sync stock records.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>🔮</div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px' }}>Gemini AI Store Insights</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Receive machine-learning summaries of sales, revenue statistics and stock health warnings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Screen: Login Cards */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        zIndex: 1,
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Clerk Login Interface wrapper */}
          <div style={{ marginBottom: '24px' }}>
            <SignIn
              routing="hash"
              signUpUrl="#/signup"
              afterSignInUrl="#/storefront"
              appearance={{
                elements: {
                  card: 'cl-card',
                  headerTitle: 'cl-headerTitle',
                  headerSubtitle: 'cl-headerSubtitle',
                  socialButtonsBlockButton: 'cl-socialButtonsBlockButton',
                  formLabelTrue: 'cl-formLabelTrue',
                  formButtonPrimary: 'cl-formButtonPrimary',
                  footerActionLink: 'cl-footerActionLink',
                }
              }}
            />
          </div>

          {/* Dev Bypass Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)'
          }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '6px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              🛠️ Local Development Bypass
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
              Offline or running local database? Securely login as mock administrator bypassing Clerk authentications.
            </p>
            <Button
              id="dev-bypass-btn"
              variant="secondary"
              fullWidth
              size="sm"
              onClick={handleDevBypass}
            >
              Access via Mock Admin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;