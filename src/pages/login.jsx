import React, { useEffect } from 'react';
import { SignIn, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import Button from '../components/button';
import { WrenchIcon } from '../components/icons';

export const Login = () => {
  const { isAuthenticated, loginBypass, loading } = useAuth();
  const { settings } = useSettings();
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

  // Only show full-page loading spinner if we are authenticated and loading the profile
  if (loading && isAuthenticated) {
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
              backgroundColor: settings?.logo_url ? 'transparent' : 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: '800',
              boxShadow: settings?.logo_url ? 'none' : '0 4px 15px rgba(var(--primary-color-rgb), 0.4)',
              overflow: 'hidden',
              border: settings?.logo_url ? '1px solid var(--bg-surface-border)' : 'none'
            }}>
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt={settings.store_name || "Logo"} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                settings?.store_name ? settings.store_name[0].toUpperCase() : 'S'
              )}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>{settings?.store_name || 'Smart Retail'}</h2>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(79, 70, 229, 0.1)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(79, 70, 229, 0.2)', flexShrink: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '24px', height: '24px', color: 'var(--primary-color)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px' }}>Real-time POS Checkout</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Quick search items, process baskets, and automatically sync stock records.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)', flexShrink: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '24px', height: '24px', color: 'var(--accent-color)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096M9 21h3m-3 0H6m9.813-5.096A4.001 4.001 0 0015 8H9a4.001 4.001 0 00-5.813 2.904L2 15h14l-1.187-4.096z" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px' }}>Gemini AI Store Insights</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Receive machine-learning summaries of sales, revenue statistics and stock health warnings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Screen: Login Cards */}
      <div className="login-right-pane">
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Clerk Login Interface wrapper */}
          <div style={{ marginBottom: '24px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!clerkAuth.isLoaded || clerkAuth.isSignedIn ? (
              <div style={{ textAlign: 'center' }}>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid rgba(255,255,255,0.1)',
                  borderTopColor: 'var(--primary-color)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px auto'
                }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {clerkAuth.isSignedIn ? "Syncing session..." : "Loading Clerk..."}
                </p>
              </div>
            ) : (
              <SignIn
                routing="path"
                path="/login"
                afterSignInUrl="/storefront"
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
            )}
          </div>



        </div>
      </div>
    </div>
  );
};

export default Login;