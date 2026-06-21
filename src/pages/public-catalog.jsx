import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { WarningIcon, CartIcon, LockIcon, BoxIcon } from '../components/icons';
import { placeOnlineOrder, disputeTransactionPublic, trackOrderPublic } from '../services/salesService';
import { useRole } from '../hooks/useRole';

const CURATED_THEMES = {
  indigo_trust: { primary_theme_color: "#4F46E5", secondary_theme_color: "#F8FAFC", accent_theme_color: "#F59E0B" },
  emerald_organic: { primary_theme_color: "#059669", secondary_theme_color: "#F0FDF4", accent_theme_color: "#D97706" },
  rose_luxury: { primary_theme_color: "#BE185D", secondary_theme_color: "#FFF1F2", accent_theme_color: "#0D9488" }
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '79, 70, 229';
};

const getThemeMode = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 'dark';
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 165 ? 'light' : 'dark';
};

const titleCase = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.trim().split(/\s+/).map(w => w[0]?.toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const getProductEmoji = (category, name) => {
  const cat = category?.toLowerCase() || '';
  const n = name?.toLowerCase() || '';
  
  if (cat.includes('dairy') || n.includes('milk') || n.includes('cheese') || n.includes('butter')) return '🥛';
  if (cat.includes('bakery') || n.includes('bread') || n.includes('baguette') || n.includes('croissant') || n.includes('flour')) return '🍞';
  if (cat.includes('beverag') || cat.includes('drink') || n.includes('coffee') || n.includes('tea') || n.includes('juice') || n.includes('soda')) return '☕';
  if (cat.includes('snack') || n.includes('chips') || n.includes('cookie') || n.includes('candy') || n.includes('chocolate')) return '🍪';
  if (cat.includes('vitamin') || cat.includes('pharmacy') || cat.includes('health') || n.includes('pain') || n.includes('pill') || n.includes('tablet') || n.includes('relief')) return '💊';
  if (cat.includes('personal') || n.includes('soap') || n.includes('shampoo') || n.includes('perfume')) return '🧼';
  if (cat.includes('electronic') || cat.includes('accessori') || n.includes('keyboard') || n.includes('mouse') || n.includes('cable') || n.includes('charger') || n.includes('phone') || n.includes('usb')) return '💻';
  
  return '📦';
};

const getSvgFallback = (category, name) => {
  const emoji = getProductEmoji(category, name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="rgba(255,255,255,0.02)"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="40">${emoji}</text></svg>`;
  try {
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  } catch (e) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
};

const getProductImage = (imageUrl, category, name) => {
  if (imageUrl && imageUrl.trim() !== '') return imageUrl;

  const cat = category?.toLowerCase() || '';
  const n = name?.toLowerCase() || '';
  
  if (cat.includes('dairy') || n.includes('milk') || n.includes('cheese') || n.includes('butter')) {
    return 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&auto=format&fit=crop&q=60';
  }
  if (cat.includes('bakery') || n.includes('bread') || n.includes('baguette') || n.includes('croissant') || n.includes('flour')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=60';
  }
  if (cat.includes('beverag') || cat.includes('drink') || n.includes('coffee') || n.includes('tea') || n.includes('juice') || n.includes('soda')) {
    return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=60';
  }
  if (cat.includes('snack') || n.includes('chips') || n.includes('cookie') || n.includes('candy') || n.includes('chocolate')) {
    return 'https://images.unsplash.com/photo-1599490659213-e2b9527b0876?w=400&auto=format&fit=crop&q=60';
  }
  if (cat.includes('vitamin') || cat.includes('pharmacy') || cat.includes('health') || n.includes('pain') || n.includes('pill') || n.includes('tablet') || n.includes('relief')) {
    return 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&auto=format&fit=crop&q=60';
  }
  if (cat.includes('personal') || n.includes('soap') || n.includes('shampoo') || n.includes('perfume')) {
    return 'https://images.unsplash.com/photo-1607006342445-565a4c5f949c?w=400&auto=format&fit=crop&q=60';
  }
  if (cat.includes('electronic') || cat.includes('accessori') || n.includes('keyboard') || n.includes('mouse') || n.includes('cable') || n.includes('charger') || n.includes('phone') || n.includes('usb')) {
    return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=60';
  }
  
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=60';
};

const StarIcon = ({ filled, size = 18 }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill={filled ? "#F59E0B" : "none"} 
    stroke={filled ? "#D97706" : "#94A3B8"}
    strokeWidth={1.5}
    style={{ 
      width: `${size}px`, 
      height: `${size}px`, 
      display: 'inline-block',
      verticalAlign: 'middle',
      transition: 'all 0.15s ease'
    }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.15-.36.699-.36.85 0l2.08 4.09 4.544.594c.4.053.56.54.269.816l-3.376 3.12.872 4.47c.077.398-.352.709-.706.5l-4.048-2.025-4.048 2.025c-.354.21-.783-.102-.706-.5l.872-4.47-3.376-3.12c-.291-.276-.131-.763.27-.816l4.543-.594 2.08-4.09z" />
  </svg>
);

const isGibberish = (text) => {
  const cleaned = text.trim().toLowerCase();
  if (cleaned.length < 4) return false;
  
  if (/(.)\1{3,}/.test(cleaned)) return true;
  
  const vowels = cleaned.match(/[aeiouy]/g) || [];
  const letters = cleaned.match(/[a-z]/g) || [];
  if (letters.length >= 4 && (vowels.length / letters.length) < 0.15) return true;
  
  if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(cleaned)) return true;
  
  return false;
};

const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
  
  const isLocalHost = (host) => {
    return host === 'localhost' || 
           host === '127.0.0.1' || 
           host.startsWith('192.168.') || 
           host.startsWith('10.') || 
           host.startsWith('172.');
  };
  
  const currentHost = window.location.hostname;
  const currentIsLocal = isLocalHost(currentHost);

  if (envUrl) {
    try {
      const url = new URL(envUrl);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        if (currentIsLocal) {
          url.hostname = currentHost;
          return url.toString().replace(/\/$/, '');
        } else {
          return 'https://smart-retail-backend-sv1w.onrender.com';
        }
      }
      return envUrl.replace(/\/$/, '');
    } catch (e) {
      return envUrl.replace(/\/$/, '');
    }
  }

  return currentIsLocal 
    ? 'http://127.0.0.1:8000' 
    : 'https://smart-retail-backend-sv1w.onrender.com';
};

// ─── Step state machine ────────────────────────────────────────────
// "browse" → "checkout" → "paying" → "receipt"

const TOUR_STEPS = [
  {
    target: '#customer-brand-header',
    title: 'Supermarket Storefront',
    content: 'Welcome! This is the active store you are shopping from. The branding, colors, and inventory are configured specifically by this supermarket.',
    position: 'bottom'
  },
  {
    target: '#customer-search-filters',
    title: 'Browse and Search Products',
    content: 'Filter items by category or search by typing keywords to quickly locate what you need. Click "Add to Cart" to build your order.',
    position: 'bottom'
  },
  {
    target: '#customer-cart-btn',
    title: 'Your Shopping Basket',
    content: 'Open the slide-out cart drawer anytime to review your items, adjust quantities, see price totals, and proceed to checkout.',
    position: 'bottom'
  },
  {
    target: '#customer-track-order-btn',
    title: 'Track Orders & Escrow PINs',
    content: 'Click here to track your active orders. Once paid via MoMo, you can view your secure delivery verification PIN or file disputes if items are incorrect.',
    position: 'bottom'
  },
  {
    target: '#customer-review-btn',
    title: 'Submit Customer Reviews',
    content: 'Click here to rate your shopping experience, leave comments, and view testimonials from other shoppers.',
    position: 'top'
  }
];

const ChatbotCommentForm = ({ onSubmit, defaultValue }) => {
  const [comment, setComment] = useState(defaultValue || '');
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (comment.trim()) onSubmit(comment.trim()); }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <textarea
        required
        placeholder="Type your feedback here..."
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={3}
        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--input-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
      />
      <button
        type="submit"
        style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-color)', color: '#ffffff', fontWeight: '700', cursor: 'pointer', alignSelf: 'flex-end' }}
      >
        Next
      </button>
    </form>
  );
};

const ChatbotNameForm = ({ onSubmit, defaultValue }) => {
  const [name, setName] = useState(defaultValue || '');
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSubmit(name.trim()); }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input
        type="text"
        required
        placeholder="Enter your name..."
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--input-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
      />
      <button
        type="submit"
        style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-color)', color: '#ffffff', fontWeight: '700', cursor: 'pointer', alignSelf: 'flex-end' }}
      >
        Submit Review
      </button>
    </form>
  );
};

const ReviewChatbot = ({ selectedEntId, selectedEnt, fetchReviews, cartOpen }) => {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotState, setChatbotState] = useState('welcome'); // welcome | comment | name | submitting | finished
  const [chatbotRating, setChatbotRating] = useState(5);
  const [chatbotComment, setChatbotComment] = useState('');
  const [chatbotName, setChatbotName] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const API_BASE = getApiBase();

  const handleClose = () => {
    setChatbotOpen(false);
    setChatbotState('welcome');
    setChatbotRating(5);
    setChatbotComment('');
    setChatbotName('');
  };

  const handleRatingSelect = (rate) => {
    setChatbotRating(rate);
    setChatbotState('comment');
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: cartOpen ? 'auto' : '24px',
      left: cartOpen ? '24px' : 'auto',
      zIndex: 9999,
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {!chatbotOpen && (
        <button
          id="customer-review-btn"
          className="catalog-chatbot-launcher"
          onClick={() => setChatbotOpen(true)}
          style={{
            padding: '12px 20px',
            borderRadius: '30px',
            backgroundColor: 'var(--primary-color, #4F46E5)',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.35)',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            fontWeight: '700',
            fontSize: '0.86rem',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Review Store
        </button>
      )}

      {chatbotOpen && (
        <div className="catalog-chatbot-window" style={{
          position: 'relative',
          width: '350px',
          height: '450px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          <style>{`
            @keyframes slideUp {
              0% { transform: translateY(20px); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
            @keyframes fireGradient {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes fireFlickerOuter {
              0%, 100% { opacity: 0.7; }
              50% { opacity: 0.85; }
            }
            @keyframes fireFlickerMiddle {
              0%, 100% { opacity: 0.8; }
              50% { opacity: 0.95; }
            }
            @keyframes fireFlickerInner {
              0%, 100% { opacity: 0.85; }
              50% { opacity: 1.0; }
            }
            @keyframes spark-left {
              0% { transform: translate(30px, 420px) scale(0.8); opacity: 0; }
              10% { opacity: 1; }
              80% { opacity: 0.8; }
              100% { transform: translate(15px, 30px) scale(0.2); opacity: 0; }
            }
            @keyframes spark-right {
              0% { transform: translate(320px, 420px) scale(0.8); opacity: 0; }
              15% { opacity: 1; }
              85% { opacity: 0.8; }
              100% { transform: translate(335px, 30px) scale(0.2); opacity: 0; }
            }
            @keyframes spark-mid-left {
              0% { transform: translate(100px, 425px) scale(1); opacity: 0; }
              5% { opacity: 1; }
              90% { opacity: 0.6; }
              100% { transform: translate(90px, 15px) scale(0); opacity: 0; }
            }
            @keyframes spark-mid-right {
              0% { transform: translate(250px, 425px) scale(1); opacity: 0; }
              5% { opacity: 1; }
              90% { opacity: 0.6; }
              100% { transform: translate(260px, 15px) scale(0); opacity: 0; }
            }
          `}</style>
          
          {/* SVG Molten Fire Filters Definition */}
          <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
            <defs>
              {/* Outer filter: larger, slower displacement */}
              <filter id="fireFilterOuter" x="-30%" y="-30%" width="160%" height="160%">
                <feTurbulence type="fractalNoise" baseFrequency="0.01 0.02" numOctaves="3" seed="1" result="noise" />
                <feOffset dx="0" dy="0" in="noise" result="offsetNoise">
                  <animate attributeName="dy" from="0" to="-200" dur="8s" repeatCount="indefinite" />
                  <animate attributeName="dx" from="-10" to="10" dur="5s" repeatCount="indefinite" />
                </feOffset>
                <feDisplacementMap in="SourceGraphic" in2="offsetNoise" scale="18" xChannelSelector="R" yChannelSelector="G" result="displaced" />
                <feGaussianBlur in="displaced" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="displaced" />
                </feMerge>
              </filter>

              {/* Middle filter: medium displacement */}
              <filter id="fireFilterMiddle" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.02 0.04" numOctaves="3" seed="2" result="noise" />
                <feOffset dx="0" dy="0" in="noise" result="offsetNoise">
                  <animate attributeName="dy" from="0" to="-200" dur="5.5s" repeatCount="indefinite" />
                  <animate attributeName="dx" from="-15" to="15" dur="4s" repeatCount="indefinite" />
                </feOffset>
                <feDisplacementMap in="SourceGraphic" in2="offsetNoise" scale="12" xChannelSelector="R" yChannelSelector="G" result="displaced" />
                <feGaussianBlur in="displaced" stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="displaced" />
                </feMerge>
              </filter>

              {/* Inner filter: smaller, faster displacement */}
              <filter id="fireFilterInner" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.03 0.06" numOctaves="3" seed="3" result="noise" />
                <feOffset dx="0" dy="0" in="noise" result="offsetNoise">
                  <animate attributeName="dy" from="0" to="-200" dur="3.5s" repeatCount="indefinite" />
                  <animate attributeName="dx" from="-8" to="8" dur="3s" repeatCount="indefinite" />
                </feOffset>
                <feDisplacementMap in="SourceGraphic" in2="offsetNoise" scale="7" xChannelSelector="R" yChannelSelector="G" result="displaced" />
                <feGaussianBlur in="displaced" stdDeviation="0.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="displaced" />
                </feMerge>
              </filter>
            </defs>
          </svg>

          {/* Stacked Molten Fire Border Outline Layers */}
          {/* Outer red flame layer */}
          <div style={{
            position: 'absolute',
            width: '312px',
            height: '412px',
            borderRadius: '26px',
            background: 'linear-gradient(0deg, #b30000, #e25822, #b30000)',
            backgroundSize: '100% 200%',
            animation: 'fireGradient 4s linear infinite, fireFlickerOuter 0.15s infinite alternate',
            filter: 'url(#fireFilterOuter) drop-shadow(0 0 12px #b30000)',
            zIndex: 1,
            pointerEvents: 'none'
          }} />

          {/* Middle orange flame layer */}
          <div style={{
            position: 'absolute',
            width: '308px',
            height: '408px',
            borderRadius: '24px',
            background: 'linear-gradient(120deg, #e25822, #f39c12, #e25822)',
            backgroundSize: '200% 100%',
            animation: 'fireGradient 3s linear infinite, fireFlickerMiddle 0.2s infinite alternate',
            filter: 'url(#fireFilterMiddle) drop-shadow(0 0 8px #e25822)',
            zIndex: 1,
            pointerEvents: 'none'
          }} />

          {/* Inner yellow flame layer */}
          <div style={{
            position: 'absolute',
            width: '304px',
            height: '404px',
            borderRadius: '22px',
            background: 'linear-gradient(240deg, #f1c40f, #ffffff, #f1c40f)',
            backgroundSize: '150% 150%',
            animation: 'fireGradient 2s linear infinite, fireFlickerInner 0.1s infinite alternate',
            filter: 'url(#fireFilterInner) drop-shadow(0 0 4px #f1c40f)',
            zIndex: 1,
            pointerEvents: 'none'
          }} />

          {/* Floating Sparks/Embers */}
          <div style={{
            position: 'absolute',
            width: '3px',
            height: '3px',
            borderRadius: '50%',
            backgroundColor: '#ffba08',
            boxShadow: '0 0 6px #f48c06, 0 0 10px #dc2f02',
            pointerEvents: 'none',
            zIndex: 3,
            animation: 'spark-left 7s infinite linear',
            animationDelay: '1s'
          }} />
          <div style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: '#ffba08',
            boxShadow: '0 0 6px #f48c06, 0 0 10px #dc2f02',
            pointerEvents: 'none',
            zIndex: 3,
            animation: 'spark-right 8s infinite linear',
            animationDelay: '3s'
          }} />
          <div style={{
            position: 'absolute',
            width: '3px',
            height: '3px',
            borderRadius: '50%',
            backgroundColor: '#ffea00',
            boxShadow: '0 0 6px #f48c06, 0 0 10px #dc2f02',
            pointerEvents: 'none',
            zIndex: 3,
            animation: 'spark-mid-left 6s infinite linear',
            animationDelay: '0s'
          }} />
          <div style={{
            position: 'absolute',
            width: '2px',
            height: '2px',
            borderRadius: '50%',
            backgroundColor: '#ffea00',
            boxShadow: '0 0 4px #f48c06, 0 0 8px #dc2f02',
            pointerEvents: 'none',
            zIndex: 3,
            animation: 'spark-mid-right 9s infinite linear',
            animationDelay: '4.5s'
          }} />

          {/* Chatbot Card itself */}
          <div style={{
            width: '300px',
            height: '400px',
            backgroundColor: 'var(--bg-sidebar, #111827)',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 2,
            boxShadow: 'inset 0 0 20px rgba(239, 68, 68, 0.1)'
          }}>
            
            <div style={{
              backgroundColor: 'var(--primary-color)',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <strong style={{ fontSize: '0.9rem' }}>Feedback Assistant</strong>
              </div>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '85%' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Assistant</span>
                <div style={{ backgroundColor: 'var(--glass-card-bg)', border: '1px solid var(--glass-card-border)', padding: '10px 14px', borderRadius: '14px 14px 14px 0px', color: 'var(--text-primary)' }}>
                  Hi there! Thank you for choosing <strong>{selectedEnt?.name || 'our store'}</strong>. How would you rate your shopping experience today?
                </div>
              </div>

              {chatbotState === 'welcome' && (
                <div 
                  style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '12px 0' }}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  {[1, 2, 3, 4, 5].map(rate => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleRatingSelect(rate)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'transform 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        setHoveredRating(rate);
                        e.currentTarget.style.transform = 'scale(1.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <StarIcon filled={hoveredRating > 0 ? rate <= hoveredRating : rate <= chatbotRating} size={28} />
                    </button>
                  ))}
                </div>
              )}

              {['comment', 'name', 'submitting', 'finished'].includes(chatbotState) && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '85%', alignSelf: 'flex-end', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>You</span>
                    <div style={{ backgroundColor: 'var(--primary-color)', padding: '10px 14px', borderRadius: '14px 14px 0px 14px', color: '#ffffff' }}>
                      I rate it {chatbotRating} / 5 stars.
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '85%' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Assistant</span>
                    <div style={{ backgroundColor: 'var(--glass-card-bg)', border: '1px solid var(--glass-card-border)', padding: '10px 14px', borderRadius: '14px 14px 14px 0px', color: 'var(--text-primary)' }}>
                      {chatbotRating >= 4 ? "Awesome! What did you like most about your experience?" : "We're sorry to hear that. What went wrong, and how can we improve?"}
                    </div>
                  </div>
                </>
              )}

              {chatbotState === 'comment' && (
                <ChatbotCommentForm
                  defaultValue={chatbotComment}
                  onSubmit={(comment) => {
                    setChatbotComment(comment);
                    setChatbotState('name');
                  }}
                />
              )}

              {['name', 'submitting', 'finished'].includes(chatbotState) && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '85%', alignSelf: 'flex-end', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>You</span>
                    <div style={{ backgroundColor: 'var(--primary-color)', padding: '10px 14px', borderRadius: '14px 14px 0px 14px', color: '#ffffff', wordBreak: 'break-word' }}>
                      "{chatbotComment}"
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '85%' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Assistant</span>
                    <div style={{ backgroundColor: 'var(--glass-card-bg)', border: '1px solid var(--glass-card-border)', padding: '10px 14px', borderRadius: '14px 14px 14px 0px', color: 'var(--text-primary)' }}>
                      Understood! Lastly, what is your name so we can record your review?
                    </div>
                  </div>
                </>
              )}

              {chatbotState === 'name' && (
                <ChatbotNameForm
                  defaultValue={chatbotName}
                  onSubmit={async (name) => {
                    setChatbotName(name);
                    setChatbotState('submitting');
                    try {
                      await axios.post(`${API_BASE}/enterprises/${selectedEntId}/reviews`, {
                        customer_name: name.trim(),
                        rating: chatbotRating,
                        comment: chatbotComment.trim()
                      });
                      setChatbotState('finished');
                      fetchReviews();
                    } catch (err) {
                      console.error("Failed to submit review:", err);
                      alert("Failed to submit review. Please try again.");
                      setChatbotState('name');
                    }
                  }}
                />
              )}

              {chatbotState === 'submitting' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 0' }}>
                  <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Saving feedback to store...</span>
                </div>
              )}

              {chatbotState === 'finished' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '85%', alignSelf: 'flex-end', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>You</span>
                    <div style={{ backgroundColor: 'var(--primary-color)', padding: '10px 14px', borderRadius: '14px 14px 0px 14px', color: '#ffffff' }}>
                      My name is {chatbotName}.
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '85%' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Assistant</span>
                    <div style={{ backgroundColor: 'var(--glass-card-bg)', border: '1px solid var(--glass-card-border)', padding: '10px 14px', borderRadius: '14px 14px 14px 0px', color: '#10B981', fontWeight: '700' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" style={{ width: '16px', height: '16px', color: '#10B981' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span>Thank you! Your feedback has been recorded successfully. Have a nice day!</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PublicCatalog = () => {
  const { isActualTechnician, role } = useRole();
  const timerRef = useRef(null);

  // Guided Walkthrough Onboarding Tour States
  const [tourActive, setTourActive] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState(null);

  const handleFinishTour = () => {
    setTourActive(false);
    setCurrentStepIdx(0);
    localStorage.setItem('customer_tour_completed', 'true');
  };

  useEffect(() => {
    const tourCompleted = localStorage.getItem('customer_tour_completed');
    if (!tourCompleted) {
      const timer = setTimeout(() => {
        setTourActive(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!tourActive) {
      setHighlightStyle(null);
      return;
    }

    const step = TOUR_STEPS[currentStepIdx];
    if (!step) return;

    const updateSpotlight = () => {
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        setTimeout(() => {
          const updatedRect = el.getBoundingClientRect();
          let leftVal = updatedRect.left - 8;
          let topVal = updatedRect.top - 8;
          let widthVal = updatedRect.width + 16;
          let heightVal = updatedRect.height + 16;
          
          if (leftVal < 0) {
            widthVal += leftVal;
            leftVal = 0;
          }
          if (leftVal + widthVal > window.innerWidth) {
            widthVal = window.innerWidth - leftVal;
          }
          if (topVal < 0) {
            heightVal += topVal;
            topVal = 0;
          }
          if (topVal + heightVal > window.innerHeight) {
            heightVal = window.innerHeight - topVal;
          }

          setHighlightStyle({
            position: 'fixed',
            left: `${leftVal}px`,
            top: `${topVal}px`,
            width: `${widthVal}px`,
            height: `${heightVal}px`,
            borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)',
            zIndex: 100000,
            pointerEvents: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          });
        }, 300);
      } else {
        setHighlightStyle(null);
      }
    };

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    return () => window.removeEventListener('resize', updateSpotlight);
  }, [tourActive, currentStepIdx]);

  const getPopoverStyle = (step) => {
    const el = document.querySelector(step.target);
    if (!el) return { display: 'none' };
    
    const rect = el.getBoundingClientRect();
    const margin = 16;
    
    const styles = {
      position: 'fixed',
      zIndex: 100001,
      width: '280px',
      backgroundColor: 'var(--bg-sidebar, #111827)',
      border: '1px solid var(--border-sidebar, rgba(255, 255, 255, 0.15))',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), var(--shadow-lg)',
      color: 'var(--text-primary)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    let computedPosition = step.position;
    if (window.innerWidth <= 640) {
      if (computedPosition === 'left' || computedPosition === 'right' || !computedPosition) {
        const elementCenterY = rect.top + rect.height / 2;
        const viewportCenterY = window.innerHeight / 2;
        computedPosition = elementCenterY < viewportCenterY ? 'bottom' : 'top';
      }
    }

    if (computedPosition === 'bottom') {
      styles.top = `${rect.bottom + margin}px`;
      styles.left = `${rect.left + rect.width / 2 - 140}px`;
    } else if (computedPosition === 'top') {
      styles.top = `${rect.top - 190 - margin}px`;
      styles.left = `${rect.left + rect.width / 2 - 140}px`;
    } else if (computedPosition === 'left') {
      styles.top = `${rect.top + rect.height / 2 - 90}px`;
      styles.left = `${rect.left - 280 - margin}px`;
    } else if (computedPosition === 'right') {
      styles.top = `${rect.top + rect.height / 2 - 90}px`;
      styles.left = `${rect.right + margin}px`;
    }

    // Keep popover inside screen borders
    const numericLeft = parseFloat(styles.left);
    if (!isNaN(numericLeft)) {
      if (numericLeft < 12) styles.left = '12px';
      if (numericLeft + 280 > window.innerWidth - 12) {
        styles.left = `${window.innerWidth - 280 - 12}px`;
      }
    }
    const numericTop = parseFloat(styles.top);
    if (!isNaN(numericTop)) {
      if (numericTop < 12) styles.top = '12px';
      if (numericTop + 220 > window.innerHeight - 12) {
        styles.top = `${window.innerHeight - 220 - 12}px`;
      }
    }

    return styles;
  };

  const startSwiftChange = (id, delta) => {
    if (timerRef.current) return;

    const performStep = () => {
      setCart(prev => {
        const item = prev.find(i => i.id === id);
        if (!item) return prev;
        const nextQty = item.qty + delta;
        if (nextQty <= 0) {
          return prev.map(i => i.id === id ? { ...i, qty: 1 } : i);
        }
        const limit = item.stock !== undefined ? item.stock : 999;
        if (nextQty > limit) {
          return prev;
        }
        return prev.map(i => i.id === id ? { ...i, qty: nextQty } : i);
      });
    };

    performStep();

    timerRef.current = setTimeout(() => {
      timerRef.current = setInterval(performStep, 80);
    }, 350);
  };

  const stopSwiftChange = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  const handleRoleChange = (nextRole) => {
    localStorage.setItem('active_role', nextRole);
    if (nextRole === 'buyer') {
      window.location.reload();
    } else {
      window.location.href = '/storefront';
    }
  };

  const renderTechConsole = () => null;

  const [enterprises, setEnterprises] = useState([]);
  const [selectedEntId, setSelectedEntId] = useState(null);
  const [selectedEnt, setSelectedEnt] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Cart
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Checkout form
  const [step, setStep] = useState('browse'); // browse | checkout | paying | receipt
  const [form, setForm] = useState({ name: '', phone: '', address: '', note: '' });
  const [formError, setFormError] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);

  // Receipt after order
  const [completedOrder, setCompletedOrder] = useState(null);

  // Simulated MoMo Modal State
  const [showSimulatedMomoModal, setShowSimulatedMomoModal] = useState(false);
  const [simulatedMomoStep, setSimulatedMomoStep] = useState('choose_provider'); // choose_provider | sending_push | success
  const [momoProvider, setMomoProvider] = useState('mtn'); // mtn | orange
  const [momoPhoneNumber, setMomoPhoneNumber] = useState('');

  // Reviews & Testimonials States
  const [reviews, setReviews] = useState([]);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  // Sponsored Ad Popup States
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [adEnterprise, setAdEnterprise] = useState(null);

  // Order Tracking States
  const [trackDrawerOpen, setTrackDrawerOpen] = useState(false);
  const [trackReceiptNo, setTrackReceiptNo] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeTarget, setDisputeTarget] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputePic, setDisputePic] = useState(null);
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  // Lock scrolling when drawers or dispute modals are open
  useEffect(() => {
    if (cartOpen || trackDrawerOpen || showDisputeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [cartOpen, trackDrawerOpen, showDisputeModal]);

  const API_BASE = getApiBase();

  useEffect(() => {
    // If the active store is on the Free tier, show a popup ad of another store after 45 seconds
    const isFree = selectedEnt?.subscription_tier === 'free';
    if (isFree && enterprises.length > 1) {
      const otherEnts = enterprises.filter(e => e.id !== selectedEntId);
      if (otherEnts.length > 0) {
        const randomEnt = otherEnts[Math.floor(Math.random() * otherEnts.length)];
        setAdEnterprise(randomEnt);
        
        // 45 seconds timer
        const timer = setTimeout(() => {
          setShowAdPopup(true);
        }, 45000);
        
        return () => clearTimeout(timer);
      }
    } else {
      setShowAdPopup(false);
    }
  }, [selectedEntId, selectedEnt, enterprises]);

  const fetchReviews = useCallback(() => {
    if (!selectedEntId) return;
    axios.get(`${API_BASE}/enterprises/${selectedEntId}/reviews`)
      .then(res => {
        setReviews(res.data || []);
        setTestimonialIdx(0);
      })
      .catch(err => {
        console.error("Error fetching testimonials:", err);
      });
  }, [selectedEntId, API_BASE]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);



  const renderTrackDrawer = () => {
    if (!trackDrawerOpen) return null;

    const handleSearchOrder = async (e) => {
      e.preventDefault();
      if (!trackReceiptNo.trim() || !trackPhone.trim()) {
        setTrackError('Receipt number and phone number are required.');
        return;
      }
      setTrackLoading(true);
      setTrackError('');
      setTrackedOrder(null);
      try {
        const data = await trackOrderPublic(trackReceiptNo.trim(), trackPhone.trim());
        setTrackedOrder(data);
      } catch (err) {
        console.error("Order tracking failed:", err);
        setTrackError(err.response?.data?.detail || "Order not found. Check details & try again.");
      } finally {
        setTrackLoading(false);
      }
    };

    const handleCloseTracker = () => {
      setTrackDrawerOpen(false);
      setTrackReceiptNo('');
      setTrackPhone('');
      setTrackedOrder(null);
      setTrackError('');
    };

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 10005, fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* Backdrop */}
        <div onClick={handleCloseTracker} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }} />
        {/* Drawer Panel */}
        <div className="catalog-track-drawer" style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          bottom: '24px',
          width: 'calc(100% - 48px)',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-sidebar, #111827)',
          border: '1px solid var(--glass-card-border, rgba(255,255,255,0.08))',
          borderRadius: '20px',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          color: 'var(--text-primary, #ffffff)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-sidebar, rgba(255,255,255,0.08))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '20px', height: '20px', color: 'var(--accent-color)', display: 'inline-block', verticalAlign: 'middle' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.5 5.5a7.5 7.5 0 0010.5 10.5z" />
              </svg>
              Track Your Order
            </h2>
            <button onClick={handleCloseTracker} style={{ background: 'none', border: 'none', color: 'var(--text-secondary, #cbd5e1)', cursor: 'pointer', fontSize: '1.6rem', lineHeight: 1 }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {/* Lookup Form */}
            <form onSubmit={handleSearchOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Receipt ID / Order ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PDTENTA20260001 or #1"
                  value={trackReceiptNo}
                  onChange={e => setTrackReceiptNo(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--input-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Customer Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 678908765"
                  value={trackPhone}
                  onChange={e => setTrackPhone(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--input-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={trackLoading}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--primary-color, #4F46E5)',
                  color: '#ffffff',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {trackLoading ? 'Searching...' : 'Track Delivery Status'}
              </button>
            </form>

            {trackError && (
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', fontSize: '0.82rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <WarningIcon size={14} style={{ color: '#ef4444' }} /> {trackError}
              </div>
            )}

            {/* Results Details */}
            {trackedOrder && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px dashed var(--border-sidebar, rgba(255,255,255,0.08))', paddingTop: '20px' }}>
                {/* Status Indicator */}
                <div style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--glass-card-bg, rgba(255,255,255,0.02))',
                  border: '1px solid var(--glass-card-border, rgba(255,255,255,0.05))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Current Status</span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor:
                        trackedOrder.payment_status === 'completed' ? '#10b981' :
                        trackedOrder.payment_status === 'disputed' ? '#ef4444' :
                        trackedOrder.payment_status === 'refunded' ? '#64748b' :
                        '#f59e0b',
                      boxShadow: '0 0 10px rgba(0,0,0,0.2)'
                    }} />
                    <strong style={{
                      fontSize: '1.05rem',
                      color:
                        trackedOrder.payment_status === 'completed' ? '#10b981' :
                        trackedOrder.payment_status === 'disputed' ? '#ef4444' :
                        trackedOrder.payment_status === 'refunded' ? '#94a3b8' :
                        '#f59e0b'
                    }}>
                      {trackedOrder.payment_status === 'completed' ? 'Delivered & Completed' :
                       trackedOrder.payment_status === 'disputed' ? 'Disputed (Money Frozen)' :
                       trackedOrder.payment_status === 'refunded' ? 'Cancelled & Refunded' :
                       (!trackedOrder.is_confirmed ? 'Awaiting Store Dispatch' : 'Dispatched / In Transit')}
                    </strong>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {trackedOrder.payment_status === 'completed' ? 'The delivery verification code has been checked and funds have been released to the store.' :
                     trackedOrder.payment_status === 'disputed' ? 'Your payment is frozen. The system technician is resolving the issue.' :
                     trackedOrder.payment_status === 'refunded' ? 'This order has been cancelled and funds refunded back to your wallet.' :
                     (!trackedOrder.is_confirmed ? 'The cashier is reviewing and packing your order. Your payment is held securely.' : 'The rider has left with your products! Check the PIN on arrival.')}
                  </p>
                </div>

                {/* PIN Code Recovery if held in escrow */}
                {trackedOrder.payment_status === 'paid_escrow' && (
                  <div style={{ padding: '14px', backgroundColor: '#fef3c7', border: '2px dashed #d97706', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <LockIcon size={13} style={{ color: '#b45309' }} /> Delivery Verification PIN
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '0.2em', color: '#b45309', margin: '6px 0 2px' }}>
                      {trackedOrder.delivery_pin}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#78350f', lineHeight: 1.35 }}>
                      Write this verification PIN in the rider\'s delivery log upon physical receipt of your goods. Do not share it before checking your items.
                    </p>
                  </div>
                )}

                {/* Info summary */}
                <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Receipt ID:</span><strong>{trackedOrder.receipt_number || `#${trackedOrder.id}`}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Date:</span><span>{new Date(trackedOrder.created_at).toLocaleString()}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Destination:</span><span style={{ textAlign: 'right' }}>{trackedOrder.customer_name}<br/>{trackedOrder.delivery_address}</span></div>
                </div>

                {/* Items breakdown */}
                <div style={{ borderTop: '1px solid var(--border-sidebar, rgba(255,255,255,0.08))', paddingTop: '14px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Items Ordered</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    {trackedOrder.items?.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <span style={{ textTransform: 'capitalize' }}>{item.product_name || `Product #${item.product_id}`} × {item.quantity}</span>
                        <span>{(item.unit_price * item.quantity).toLocaleString()} FCFA</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '0.9rem', marginTop: '6px', borderTop: '1px dashed var(--border-sidebar, rgba(255,255,255,0.08))', paddingTop: '6px' }}>
                      <span>Total Amount</span>
                      <span style={{ color: 'var(--accent-color)' }}>{trackedOrder.total_amount.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>

                {/* Dispute Button */}
                {trackedOrder.payment_status === 'paid_escrow' && (
                  <div style={{ marginTop: '8px' }}>
                    <button
                      onClick={() => {
                        setDisputeTarget(trackedOrder);
                        setShowDisputeModal(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        color: '#ef4444',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '0.86rem',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
                    >
                      <WarningIcon size={14} style={{ color: '#ef4444' }} /> Dispute Delivery / Freeze Payment
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAdPopup = () => {
    if (!showAdPopup || !adEnterprise) return null;
    
    let adDesc = "Discover premium retail inventory, bulk order pricing, and secure online shopping options.";
    if (adEnterprise.id === 1) adDesc = "Visit Enterprise Alpha for fresh organic dairy, bakery goods, and high-quality grocery items!";
    else if (adEnterprise.id === 2) adDesc = "Check out Enterprise Beta for personal care formulas, vitamins, and local pharmacy wellness items!";
    else if (adEnterprise.id === 3) adDesc = "Browse Enterprise Gamma for precision gaming mice, mechanical keyboards, and fast-charging tech accessories!";

    return (
      <div className="catalog-ad-popup" style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        width: 'calc(100% - 48px)',
        maxWidth: '680px',
        zIndex: 10000,
        fontFamily: 'Inter, system-ui, sans-serif',
        animation: 'slideUpAd 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: 'translateX(-50%)'
      }}>
        <style>{`
          @keyframes slideUpAd {
            0% { transform: translate(-50%, 80px); opacity: 0; }
            100% { transform: translate(-50%, 0); opacity: 1; }
          }
        `}</style>
        <div style={{
          backgroundColor: 'var(--bg-sidebar, #111827)',
          border: '1px solid var(--glass-card-border, rgba(255, 255, 255, 0.08))',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), var(--shadow-lg)',
          position: 'relative',
          color: 'var(--text-primary, #ffffff)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          backdropFilter: 'blur(12px)',
          textAlign: 'left'
        }}>
          <button
            onClick={() => setShowAdPopup(false)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '12px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, rgba(255, 255, 255, 0.4))',
              cursor: 'pointer',
              fontSize: '1.2rem',
              lineHeight: 1
            }}
          >
            ×
          </button>

          {/* Left: Store Logo */}
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--glass-card-border)',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {adEnterprise.logo_url ? (
              <img src={adEnterprise.logo_url} alt={adEnterprise.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '32px', height: '32px', color: 'var(--primary-color)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
              </svg>
            )}
          </div>

          {/* Middle: Store details */}
          <div style={{ flex: 1, minWidth: '220px', paddingRight: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {adEnterprise.name}
              </h3>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                color: 'var(--accent-color, #F59E0B)',
                letterSpacing: '0.05em',
                padding: '2px 8px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                borderRadius: '20px',
                display: 'inline-block'
              }}>
                Sponsored Highlight
              </span>
            </div>
            <p style={{
              fontSize: '0.82rem',
              color: 'var(--text-secondary, #cbd5e1)',
              lineHeight: '1.45',
              margin: 0
            }}>
              {adDesc}
            </p>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => {
                setSelectedEntId(adEnterprise.id);
                setCart([]);
                localStorage.setItem('active_enterprise_id', adEnterprise.id.toString());
                const url = new URL(window.location.href);
                url.searchParams.set('enterprise_id', adEnterprise.id.toString());
                window.history.pushState({}, '', url.toString());
                setShowAdPopup(false);
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--primary-color, #4F46E5)',
                color: '#ffffff',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              Visit Store
            </button>
            <button
              onClick={() => setShowAdPopup(false)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid var(--glass-card-border, rgba(255, 255, 255, 0.08))',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary, #cbd5e1)',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Data loading ──────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const entIdParam = params.get('enterprise_id') || localStorage.getItem('active_enterprise_id');

    axios.get(`${API_BASE}/enterprises/`).then(res => {
      setEnterprises(res.data || []);
      if (res.data?.length > 0) {
        const matched = res.data.find(e => e.id.toString() === entIdParam);
        setSelectedEntId(matched ? matched.id : res.data[0].id);
      }
    }).catch(() => { setError('Failed to load supermarket listings.'); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedEntId) return;
    setLoading(true);
    axios.get(`${API_BASE}/products/public?enterprise_id=${selectedEntId}`).then(res => {
      setProducts(res.data || []);
      const ent = enterprises.find(e => e.id === selectedEntId);
      if (ent) { setSelectedEnt(ent); applyBranding(ent); }
    }).catch(() => setError('Failed to load products.')).finally(() => setLoading(false));
  }, [selectedEntId, enterprises]);

  const applyBranding = (ent) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', ent.primary_theme_color);
    root.style.setProperty('--secondary-color', ent.secondary_theme_color);
    root.style.setProperty('--accent-color', ent.accent_theme_color);
    root.style.setProperty('--primary-color-rgb', hexToRgb(ent.primary_theme_color));
    root.style.setProperty('--accent-color-rgb', hexToRgb(ent.accent_theme_color));
    root.style.setProperty('--bg-app', ent.secondary_theme_color);

    const mode = getThemeMode(ent.secondary_theme_color);
    if (mode === 'light') {
      root.style.setProperty('--bg-surface', 'rgba(255, 255, 255, 0.75)');
      root.style.setProperty('--bg-surface-border', 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--text-secondary', '#334155');
      root.style.setProperty('--text-muted', '#475569');
      root.style.setProperty('--glass-card-bg', 'rgba(0, 0, 0, 0.015)');
      root.style.setProperty('--glass-card-border', 'rgba(0, 0, 0, 0.04)');
      root.style.setProperty('--input-bg', 'rgba(255, 255, 255, 0.8)');
      root.style.setProperty('--input-border', 'rgba(0, 0, 0, 0.12)');
      root.style.setProperty('--border-sidebar', 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--bg-sidebar', 'rgba(255, 255, 255, 0.95)');
    } else {
      root.style.setProperty('--bg-surface', 'rgba(17, 24, 39, 0.7)');
      root.style.setProperty('--bg-surface-border', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#e2e8f0');
      root.style.setProperty('--text-muted', '#94a3b8');
      root.style.setProperty('--glass-card-bg', 'rgba(255, 255, 255, 0.02)');
      root.style.setProperty('--glass-card-border', 'rgba(255, 255, 255, 0.04)');
      root.style.setProperty('--input-bg', 'rgba(255, 255, 255, 0.03)');
      root.style.setProperty('--input-border', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--border-sidebar', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--bg-sidebar', 'rgba(11, 15, 25, 0.95)');
    }
  };

  // ─── Cart helpers ──────────────────────────────────────────────
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        const limit = product.stock !== undefined ? product.stock : 999;
        if (existing.qty >= limit) {
          alert(`Cannot exceed available inventory (${limit} units)`);
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const changeQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const nextQty = Math.max(1, i.qty + delta);
        const limit = i.stock !== undefined ? i.stock : 999;
        if (nextQty > limit) {
          alert(`Cannot exceed available inventory (${limit} units)`);
          return i;
        }
        return { ...i, qty: nextQty };
      }
      return i;
    }));
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // ─── Simulated payment ───────────────────────────────────────
  const handlePayWithMomo = () => {
    console.log("handlePayWithMomo clicked! Current form state:", form);
    // Validate form fields
    const nameVal = form.name.trim();
    const phoneVal = form.phone.trim();
    const addressVal = form.address.trim();

    if (!nameVal || !phoneVal || !addressVal) {
      setFormError('Please fill in your name, phone number, and delivery address.');
      return;
    }

    // Strict name validation (at least 3 characters, letters and spaces only)
    if (nameVal.length < 3) {
      setFormError('Full Name must be at least 3 characters long.');
      return;
    }
    if (!/^[a-zA-Z\s\-'\u00C0-\u00FF]+$/.test(nameVal)) {
      setFormError('Full Name can only contain letters, spaces, hyphens, and apostrophes.');
      return;
    }

    // Strict Cameroonian phone number validation (9 digits, starts with 6)
    let localPhone = phoneVal;
    if (phoneVal.startsWith('+237')) {
      localPhone = phoneVal.slice(4);
    } else if (phoneVal.startsWith('237')) {
      localPhone = phoneVal.slice(3);
    }
    localPhone = localPhone.replace(/[\s\-]/g, '');

    if (!/^\d+$/.test(localPhone)) {
      setFormError('Phone number must contain only digits.');
      return;
    }
    if (localPhone.length !== 9) {
      setFormError('Cameroonian phone numbers must be exactly 9 digits long (excluding +237).');
      return;
    }
    if (!/^6[5-9]\d{7}$/.test(localPhone)) {
      setFormError('Invalid Cameroon phone number. Must start with 6 followed by 5, 7, 8, or 9 (e.g. 6XXXXXXXX).');
      return;
    }

    // Strict address validation (at least 5 characters)
    if (addressVal.length < 5) {
      setFormError('Delivery address must be at least 5 characters long to ensure delivery.');
      return;
    }

    setFormError('');
    setMomoPhoneNumber(localPhone);
    
    // Automatically select provider based on prefix
    if (localPhone.startsWith('69') || localPhone.startsWith('655') || localPhone.startsWith('656') || localPhone.startsWith('657') || localPhone.startsWith('658') || localPhone.startsWith('659')) {
      setMomoProvider('orange');
    } else {
      setMomoProvider('mtn');
    }
    
    setSimulatedMomoStep('choose_provider');
    setShowSimulatedMomoModal(true);
  };

  const renderSimulatedMomoModal = () => {
    if (!showSimulatedMomoModal) return null;

    const handleConfirmSimulatedPayment = () => {
      setSimulatedMomoStep('sending_push');
      setTimeout(() => {
        setSimulatedMomoStep('success');
        setTimeout(async () => {
          setShowSimulatedMomoModal(false);
          setStep('paying');
          await submitOrder();
        }, 1200);
      }, 2500);
    };

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{
          backgroundColor: 'var(--bg-sidebar, #111827)',
          border: '1px solid var(--border-sidebar, rgba(255, 255, 255, 0.1))',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '380px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          color: 'var(--text-primary, #ffffff)'
        }}>
          {simulatedMomoStep !== 'sending_push' && simulatedMomoStep !== 'success' && (
            <button
              onClick={() => setShowSimulatedMomoModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, rgba(255, 255, 255, 0.4))',
                cursor: 'pointer',
                fontSize: '1.4rem'
              }}
            >
              ×
            </button>
          )}

          {simulatedMomoStep === 'choose_provider' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: '800' }}>Smart Retail MoMo Pay</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, rgba(255, 255, 255, 0.5))' }}>Select your preferred mobile payment provider</p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setMomoProvider('mtn')}
                  style={{
                    flex: 1,
                    padding: '16px 12px',
                    borderRadius: '12px',
                    border: `2px solid ${momoProvider === 'mtn' ? 'var(--accent-color, #F59E0B)' : 'var(--glass-card-border, rgba(255,255,255,0.05))'}`,
                    backgroundColor: momoProvider === 'mtn' ? 'rgba(245, 158, 11, 0.08)' : 'var(--glass-card-bg, rgba(255,255,255,0.02))',
                    color: 'var(--text-primary, #fff)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FBEB3C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#000', fontSize: '0.82rem' }}>MTN</div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>MTN MoMo</span>
                </button>

                <button
                  onClick={() => setMomoProvider('orange')}
                  style={{
                    flex: 1,
                    padding: '16px 12px',
                    borderRadius: '12px',
                    border: `2px solid ${momoProvider === 'orange' ? '#F97316' : 'var(--glass-card-border, rgba(255,255,255,0.05))'}`,
                    backgroundColor: momoProvider === 'orange' ? 'rgba(249, 115, 22, 0.08)' : 'var(--glass-card-bg, rgba(255,255,255,0.02))',
                    color: 'var(--text-primary, #fff)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FF6600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#fff', fontSize: '0.82rem' }}>Orange</div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Orange Money</span>
                </button>
              </div>

              <div style={{ backgroundColor: 'var(--glass-card-bg, rgba(255,255,255,0.02))', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-card-border, rgba(255,255,255,0.05))', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Momo Account:</span>
                  <span style={{ fontWeight: '700' }}>{momoPhoneNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Amount:</span>
                  <span style={{ fontWeight: '800', color: 'var(--accent-color, #F59E0B)' }}>{cartTotal.toLocaleString()} FCFA</span>
                </div>
              </div>

              <button
                onClick={handleConfirmSimulatedPayment}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: momoProvider === 'mtn' ? '#F59E0B' : '#F97316',
                  color: '#ffffff',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                Simulate Push Request
              </button>
            </div>
          )}

          {simulatedMomoStep === 'sending_push' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px 0', textAlign: 'center' }}>
              <div style={{
                width: '44px',
                height: '44px',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: momoProvider === 'mtn' ? '#F59E0B' : '#F97316',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: '700' }}>Waiting for Approval</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Sending Mobile Money payment prompt to account <strong>{momoPhoneNumber}</strong>.
                </p>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
                  Please dial {momoProvider === 'mtn' ? '*126#' : '#150#'} on your phone and enter your Mobile Money PIN code to approve the transaction.
                </p>
              </div>
            </div>
          )}

          {simulatedMomoStep === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0', textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="#10b981" style={{ width: '28px', height: '28px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '800', color: '#10b981' }}>Approved!</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Creating transaction receipt...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const submitOrder = async () => {
    try {
      setOrderLoading(true);
      const payload = {
        enterprise_id: selectedEntId,
        payment_method: 'mobile_money',
        source: 'online',
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        delivery_address: form.address.trim(),
        order_note: form.note.trim() || null,
        created_at: new Date().toISOString(),
        items: cart.map(i => ({ product_id: i.id, quantity: i.qty })),
      };
      const order = await placeOnlineOrder(payload);
      setCompletedOrder(order);
      setCart([]);
      setStep('receipt');
    } catch (err) {
      console.error('Order submission failed:', err);
      setStep('checkout');
      alert(err.response?.data?.detail || 'Order failed. Please try again.');
    } finally {
      setOrderLoading(false);
    }
  };

  // ─── Print receipt ─────────────────────────────────────────────
  const handlePrintReceipt = () => {
    if (!completedOrder) return;
    let container = document.getElementById('printable-receipt-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'printable-receipt-container';
      document.body.appendChild(container);
    }

    const itemsHtml = completedOrder.items?.map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.9rem; color: #000;">
        <span>${titleCase(item.product_name) || ('Product #' + item.product_id)} (${item.quantity})</span>
        <span>${(item.unit_price * item.quantity).toFixed(2)} FCFA</span>
      </div>
    `).join('') || '';

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0 0 4px 0; font-size: 1.2rem; font-weight: 800; color: #000;">
          ${selectedEnt?.name ? selectedEnt.name.toUpperCase() : 'SMART RETAIL'}
        </h2>
        <p style="margin: 0; font-size: 0.75rem; text-transform: uppercase; color: #64748b;">
          Online Delivery Receipt
        </p>
      </div>
      
      <div style="border-top: 1px dashed #000; margin: 12px 0;"></div>
      
      <p style="margin: 0 0 6px 0; font-size: 0.85rem; color: #000;"><strong>RECEIPT ID:</strong> ${completedOrder.receipt_number || ('#' + completedOrder.id)}</p>
      <p style="margin: 0 0 6px 0; font-size: 0.85rem; color: #000;"><strong>DATE:</strong> ${new Date(completedOrder.created_at).toLocaleString()}</p>
      <p style="margin: 0 0 12px 0; font-size: 0.85rem; color: #000;"><strong>PAYMENT:</strong> Mobile Money (MoMo)</p>
      
      <div style="border-top: 1px dashed #000; margin: 12px 0;"></div>
      
      <p style="margin: 0 0 4px 0; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #64748b;">Delivery Details</p>
      <p style="margin: 0 0 4px 0; font-size: 0.85rem; color: #000;"><strong>NAME:</strong> ${completedOrder.customer_name || '—'}</p>
      <p style="margin: 0 0 4px 0; font-size: 0.85rem; color: #000;"><strong>PHONE:</strong> ${completedOrder.customer_phone || '—'}</p>
      <p style="margin: 0 0 4px 0; font-size: 0.85rem; color: #000;"><strong>ADDRESS:</strong> ${completedOrder.delivery_address || '—'}</p>
      ${completedOrder.order_note ? `<p style="margin: 4px 0 0 0; font-size: 0.82rem; font-style: italic; color: #475569;">"${completedOrder.order_note}"</p>` : ''}

      <div style="border-top: 1px dashed #000; margin: 12px 0;"></div>
      
      <div style="margin: 12px 0; color: #000;">
        ${itemsHtml}
      </div>
      
      <div style="border-top: 1px dashed #000; margin: 12px 0;"></div>
      
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.05rem; margin-top: 10px; color: #000;">
        <span>TOTAL PAID</span>
        <span>${completedOrder.total_amount.toFixed(2)} FCFA</span>
      </div>
      
      <div style="border: 2px dashed #b45309; padding: 12px; margin: 16px 0; text-align: center; background-color: #fef3c7; border-radius: 4px; color: #000;">
        <span style="font-weight: bold; font-size: 0.82rem; color: #b45309; display: block; text-transform: uppercase;">Delivery Verification PIN</span>
        <p style="margin: 4px 0 8px 0; font-size: 0.74rem; color: #78350f; line-height: 1.3;">
          When the rider arrives, <strong>write this PIN in their delivery book</strong> and sign next to it. Do not say it aloud.
        </p>
        <div style="font-size: 1.5rem; font-weight: 800; letter-spacing: 0.12em; margin-top: 6px; color: #b45309;">${completedOrder.delivery_pin}</div>
        <p style="font-size: 0.7rem; color: #92400e; margin-top: 6px; line-height: 1.3;">This PIN releases your escrow. Only write it after you receive your items.</p>
      </div>
      
      <div style="border-top: 1px dashed #000; margin: 12px 0;"></div>
      
      <p style="margin-top: 30px; font-size: 0.8rem; color: #64748b; text-align: center;">Thank you for your order!<br/>Your items will arrive soon.</p>
    `;

    document.body.classList.add('is-printing-receipt');

    const cleanUp = () => {
      document.body.classList.remove('is-printing-receipt');
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };

    setTimeout(() => {
      window.print();
      setTimeout(cleanUp, 1000);
    }, 100);
  };

  // ─── Filtered products ─────────────────────────────────────────
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description?.toLowerCase().includes(search.toLowerCase())) ||
      (p.category?.toLowerCase().includes(search.toLowerCase()));
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  // ─── RECEIPT SCREEN ────────────────────────────────────────────
  if (step === 'receipt' && completedOrder) {
    return (
      <>
        {isActualTechnician && renderTechConsole()}
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app, #0f172a)', color: 'var(--text-primary, #ffffff)', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Success Banner */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.12)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#10b981" style={{ width: '32px', height: '32px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 6px 0', color: '#10b981' }}>Order Confirmed!</h1>
              <p style={{ color: 'var(--text-secondary, rgba(255,255,255,0.55))', margin: 0, fontSize: '0.9rem' }}>Payment received. Your rider is being dispatched.</p>
            </div>

            {/* Receipt Card */}
            <div style={{ backgroundColor: '#ffffff', color: '#1e293b', borderRadius: '12px', padding: '28px', fontFamily: "'Courier New', Courier, monospace", fontSize: '0.85rem', lineHeight: 1.5 }}>

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 0 2px 0' }}>{selectedEnt?.name?.toUpperCase() || 'SMART RETAIL'}</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>Online Delivery Receipt</p>
              </div>

              <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '12px' }} />

              {/* Order Info */}
              <p style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', margin: '0 0 6px 0' }}>Order Info</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span><b>Receipt:</b></span><span>{completedOrder.receipt_number || ('#' + completedOrder.id)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span><b>Date:</b></span><span>{new Date(completedOrder.created_at).toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><span><b>Payment:</b></span><span>Mobile Money</span></div>

              <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '12px' }} />

              {/* Delivery Details */}
              <p style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', margin: '0 0 6px 0' }}>Delivery Details</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span><b>Name:</b></span><span>{completedOrder.customer_name}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span><b>Phone:</b></span><span>{completedOrder.customer_phone}</span></div>
              <div style={{ marginBottom: '3px' }}><b>Address:</b> {completedOrder.delivery_address}</div>
              {completedOrder.order_note && <div style={{ marginBottom: '12px', fontStyle: 'italic', color: '#475569' }}><b>Note:</b> "{completedOrder.order_note}"</div>}

              <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '12px', marginTop: completedOrder.order_note ? 0 : '12px' }} />

              {/* Items */}
              <p style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', margin: '0 0 8px 0' }}>Items Ordered</p>
              {completedOrder.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>{titleCase(item.product_name) || `Product #${item.product_id}`} (x{item.quantity})</span>
                  <span>{(item.unit_price * item.quantity).toFixed(2)} FCFA</span>
                </div>
              ))}

              <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '12px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1rem' }}>
                <span>TOTAL PAID</span>
                <span>{completedOrder.total_amount.toFixed(2)} FCFA</span>
              </div>

              {/* PIN Box */}
              <div style={{ marginTop: '16px', padding: '14px', backgroundColor: '#fef3c7', border: '2px dashed #d97706', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <LockIcon size={13} style={{ color: '#b45309' }} /> Delivery Verification PIN
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: '900', letterSpacing: '0.2em', color: '#b45309', margin: '8px 0 4px' }}>
                  {completedOrder.delivery_pin}
                </div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#78350f', lineHeight: 1.4 }}>
                  When the rider arrives, <strong>write this PIN in their delivery book</strong> and sign. Do not say it out loud. This code releases your payment.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handlePrintReceipt}
                style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid var(--glass-card-border, rgba(255,255,255,0.08))', backgroundColor: 'var(--glass-card-bg, rgba(255,255,255,0.02))', color: 'var(--text-primary, #ffffff)', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'var(--input-bg, rgba(255,255,255,0.06))';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'var(--glass-card-bg, rgba(255,255,255,0.02))';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg>
                Save / Print Receipt
              </button>
              <button
                onClick={() => { setStep('browse'); setCompletedOrder(null); setForm({ name: '', phone: '', address: '', note: '' }); }}
                style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary-color, #4F46E5)', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
                onMouseEnter={e => {
                  e.currentTarget.style.filter = 'brightness(1.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.filter = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Back to Shop
              </button>
            </div>


            
            {completedOrder.payment_status === 'disputed' && (
              <div style={{ marginTop: '16px', padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8rem', fontWeight: '700', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <WarningIcon size={14} style={{ color: '#ef4444' }} />
                <span>This delivery is disputed. Money is frozen under Technician review.</span>
              </div>
            )}
          </div>
        </div>
    </>
  );
}

  // ─── CHECKOUT SCREEN ───────────────────────────────────────────
  if (step === 'checkout' || step === 'paying') {
    return (
      <>
        {isActualTechnician && renderTechConsole()}
        <div className="catalog-checkout-shell" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app, #0f172a)', color: 'var(--text-primary, #ffffff)', fontFamily: 'Inter, system-ui, sans-serif', padding: '40px 20px' }}>
          <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            <button onClick={() => setStep('browse')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: 0 }}>
              ← Back to catalog
            </button>

            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 4px 0' }}>Delivery Checkout</h1>
              <p style={{ color: 'var(--text-muted, rgba(255,255,255,0.5))', margin: 0, fontSize: '0.88rem' }}>Fill in your details. Payment is secured — money releases only after you confirm delivery.</p>
            </div>

            {/* Order Summary */}
            <div style={{ backgroundColor: 'var(--glass-card-bg, rgba(255,255,255,0.03))', border: '1px solid var(--glass-card-border, rgba(255,255,255,0.07))', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted, rgba(255,255,255,0.6))' }}>Your Order</h3>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '12px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    {/* Small image thumbnail in Checkout Screen summary */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '1px solid var(--glass-card-border, rgba(255,255,255,0.08))',
                      flexShrink: 0
                    }}>
                      <img 
                        src={getProductImage(item.image_url, item.category, item.name)} 
                        alt={item.name} 
                        onError={(e) => { 
                          if (!e.currentTarget.dataset.error) {
                            e.currentTarget.dataset.error = 'true';
                            e.currentTarget.src = getSvgFallback(item.category, item.name);
                          }
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} 
                      />
                    </div>
                    <span style={{ color: 'var(--text-secondary, rgba(255,255,255,0.85))', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {titleCase(item.name)} × {item.qty}
                    </span>
                  </div>
                  <span style={{ fontWeight: '600', color: 'var(--accent-color, #F59E0B)', flexShrink: 0 }}>
                    {(item.price * item.qty).toLocaleString()} FCFA
                  </span>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed var(--bg-surface-border, rgba(255,255,255,0.1))', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1rem' }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent-color, #F59E0B)' }}>{cartTotal.toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Customer Form */}
            <div style={{ backgroundColor: 'var(--glass-card-bg, rgba(255,255,255,0.03))', border: '1px solid var(--glass-card-border, rgba(255,255,255,0.07))', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted, rgba(255,255,255,0.6))' }}>Your Information</h3>

              {[
                { label: 'Full Name', key: 'name', placeholder: 'e.g. Jean-Pierre Mballa', type: 'text' },
                { label: 'Phone Number (MoMo)', key: 'phone', placeholder: 'e.g. 6XXXXXXXX', type: 'tel' },
                { label: 'Delivery Address', key: 'address', placeholder: 'Quarter, street, landmark...', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted, rgba(255,255,255,0.55))', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{field.label} *</label>
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--input-border, rgba(255,255,255,0.12))', backgroundColor: 'var(--input-bg, rgba(0,0,0,0.25))', color: 'var(--text-primary, #fff)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', transition: 'all 0.15s ease' }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                      e.currentTarget.style.backgroundColor = 'rgba(var(--primary-color-rgb), 0.03)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(var(--primary-color-rgb), 0.15)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'var(--input-border, rgba(255,255,255,0.12))';
                      e.currentTarget.style.backgroundColor = 'var(--input-bg, rgba(0,0,0,0.25))';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted, rgba(255,255,255,0.55))', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Note to Cashier (Optional)</label>
                <textarea
                  value={form.note}
                  onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Any special instructions, landmark details..."
                  rows={2}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--input-border, rgba(255,255,255,0.12))', backgroundColor: 'var(--input-bg, rgba(0,0,0,0.25))', color: 'var(--text-primary, #fff)', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'all 0.15s ease' }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                    e.currentTarget.style.backgroundColor = 'rgba(var(--primary-color-rgb), 0.03)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(var(--primary-color-rgb), 0.15)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'var(--input-border, rgba(255,255,255,0.12))';
                    e.currentTarget.style.backgroundColor = 'var(--input-bg, rgba(0,0,0,0.25))';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {formError && (
                <p style={{ margin: 0, color: '#f87171', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <WarningIcon size={14} style={{ color: '#f87171' }} />
                  {formError}
                </p>
              )}
            </div>

            {/* Escrow Info */}
            <div style={{ padding: '14px 16px', backgroundColor: 'rgba(var(--accent-color-rgb, 245,158,11),0.08)', border: '1px solid rgba(var(--accent-color-rgb, 245,158,11),0.2)', borderRadius: '10px', fontSize: '0.82rem', color: 'var(--text-secondary, rgba(255,255,255,0.7))', lineHeight: 1.5 }}>
              <LockIcon size={13} style={{ color: 'var(--accent-color, #f59e0b)', marginRight: '6px', verticalAlign: 'middle' }} />
              <strong style={{ color: 'var(--accent-color, #f59e0b)' }}>Payment Secured.</strong> Your payment is held securely. After paying, you'll receive a 4-digit PIN on your receipt. Write it in the rider's delivery book when your order arrives — that's what releases the money.
            </div>

            <button
              onClick={handlePayWithMomo}
              disabled={step === 'paying' || orderLoading}
              style={{ padding: '16px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary-color, #4F46E5)', color: '#fff', fontWeight: '700', cursor: step === 'paying' ? 'not-allowed' : 'pointer', fontSize: '1rem', opacity: step === 'paying' ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s' }}
              onMouseEnter={e => { if (step !== 'paying' && !orderLoading) e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
            >
              {step === 'paying' ? 'Processing Payment...' : `Pay ${cartTotal.toLocaleString()} FCFA via MoMo`}
            </button>
          </div>
        </div>
        {renderSimulatedMomoModal()}
      </>
    );
  }

  const renderDisputeModal = () => {
    if (!showDisputeModal || !disputeTarget) return null;

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 600;
            const MAX_HEIGHT = 600;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setDisputePic(compressedDataUrl);
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      }
    };

    const handleSelectPreset = (presetBase64) => {
      setDisputePic(presetBase64);
    };

    const mockPresets = [
      {
        name: "Damaged Box",
        data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
      },
      {
        name: "Incorrect Items",
        data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4zpD5zwAEoGQMjJDwgljNBAAPmDLb2/W64AAAAABJRU5ErkJggg=="
      },
      {
        name: "Spoiled/Expired",
        data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P8//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
      }
    ];

    const handleDisputeSubmit = async (e) => {
      e.preventDefault();
      if (!disputeReason.trim()) return;
      setDisputeSubmitting(true);
      try {
        const updated = await disputeTransactionPublic(
          disputeTarget.id,
          disputeTarget.customer_phone,
          disputeTarget.delivery_pin,
          disputeReason.trim(),
          disputePic
        );
        if (trackedOrder && trackedOrder.id === disputeTarget.id) {
          setTrackedOrder(updated);
        }
        if (completedOrder && completedOrder.id === disputeTarget.id) {
          setCompletedOrder(updated);
        }
        alert("Transaction placed in dispute. The store cashier and technician have been notified.");
        setShowDisputeModal(false);
        setDisputeReason('');
        setDisputePic(null);
      } catch (err) {
        console.error("Dispute failed:", err);
        alert(err.response?.data?.detail || "Dispute failed. Please try again.");
      } finally {
        setDisputeSubmitting(false);
      }
    };

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10010,
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-sidebar, #111827)',
          border: '1px solid var(--border-sidebar, rgba(255, 255, 255, 0.1))',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '460px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          color: 'var(--text-primary, #ffffff)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#ef4444" style={{ width: '20px', height: '20px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Dispute Transaction
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Freeze the payment for review. Please provide details and visual evidence.
            </p>
          </div>

          <form onSubmit={handleDisputeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Dispute Claim Reason *</label>
              <textarea
                required
                rows={3}
                placeholder="Explain the issue with your delivery (e.g. damaged goods, missing items)..."
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--input-border)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Evidence Picture (File Upload)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Or Use Developer Testing Presets:</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {mockPresets.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset.data)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--glass-card-border)',
                      backgroundColor: disputePic === preset.data ? 'rgba(79, 70, 229, 0.2)' : 'var(--glass-card-bg)',
                      borderColor: disputePic === preset.data ? 'var(--primary-color)' : 'var(--glass-card-border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {preset.name === "Damaged Box" && <BoxIcon size={14} />}
                    {preset.name === "Incorrect Items" && (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '14px', height: '14px', flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                    )}
                    {preset.name === "Spoiled/Expired" && (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '14px', height: '14px', flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    )}
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {disputePic && (
              <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-card-border)' }}>
                <img src={disputePic} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => setDisputePic(null)}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowDisputeModal(false);
                  setDisputeReason('');
                  setDisputePic(null);
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-card-border)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={disputeSubmitting}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.85rem'
                }}
              >
                {disputeSubmitting ? "Filing..." : "Submit Dispute Claim"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ─── BROWSE SCREEN ─────────────────────────────────────────────
  return (
    <>
      {isActualTechnician && renderTechConsole()}
      <div className="catalog-page-shell" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app, #0f172a)', color: 'var(--text-primary, #ffffff)', fontFamily: 'Inter, system-ui, sans-serif', transition: 'background-color 0.5s ease' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Header */}
          <div className="catalog-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', borderBottom: '1px solid var(--bg-surface-border)', paddingBottom: '24px' }}>
            <div id="customer-brand-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '14px',
                backgroundColor: selectedEnt?.logo_url ? 'transparent' : 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: selectedEnt?.logo_url ? '1px solid var(--bg-surface-border)' : 'none',
                boxShadow: selectedEnt?.logo_url ? 'none' : '0 4px 15px rgba(var(--primary-color-rgb, 79, 70, 229), 0.4)',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '1.6rem',
                textTransform: 'uppercase',
                flexShrink: 0
              }}>
                {selectedEnt?.logo_url ? (
                  <img src={selectedEnt.logo_url} alt={selectedEnt.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  (selectedEnt?.name || 'S').charAt(0)
                )}
              </div>
              <div>
                <h1 className="catalog-brand-title" style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                  {selectedEnt?.name || 'Shop Online'}
                </h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Browse, add to cart, and order for delivery — payment secured.</p>
              </div>
            </div>

            <div className="catalog-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {/* Help Tour button */}
              <button
                onClick={() => {
                  setTourActive(true);
                  setCurrentStepIdx(0);
                }}
                className="help-tour-btn"
                style={{
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  color: 'var(--primary-color, #4F46E5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '15px', height: '15px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
                Help Tour
              </button>

              {/* Track Order button */}
              <button
                id="customer-track-order-btn"
                onClick={() => setTrackDrawerOpen(true)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--input-border, rgba(255,255,255,0.08))',
                  backgroundColor: 'var(--input-bg, rgba(255,255,255,0.02))',
                  color: 'var(--text-primary, #ffffff)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'var(--input-bg-hover, rgba(255,255,255,0.06))';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'var(--input-bg, rgba(255,255,255,0.02))';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px', color: 'var(--accent-color)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.5 5.5a7.5 7.5 0 0010.5 10.5z" /></svg>
                Track Order
              </button>

              {/* Cart button */}
              <button
                id="customer-cart-btn"
                onClick={() => setCartOpen(true)}
                style={{ position: 'relative', padding: '10px 18px', borderRadius: '10px', border: '1px solid var(--input-border)', backgroundColor: cartCount > 0 ? 'var(--primary-color)' : 'var(--input-bg)', color: cartCount > 0 ? '#fff' : 'var(--text-primary)', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
              >
                <CartIcon size={18} />
                Cart
                {cartCount > 0 && (
                  <span style={{ position: 'absolute', top: '-8px', right: '-8px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.72rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>
                )}
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div id="customer-search-filters" className="catalog-search-filters" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-surface-border)', borderRadius: '16px', padding: '16px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '11px 16px 11px 40px', borderRadius: '10px', border: '1px solid var(--input-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
              />
              <span style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.5 5.5a7.5 7.5 0 0010.5 10.5z" /></svg>
              </span>
            </div>
            {/* Mobile Category Dropdown Select */}
            <div className="mobile-category-filter">
              <label htmlFor="mobile-public-category-select" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '6px', display: 'block' }}>Filter by Category:</label>
              <select
                id="mobile-public-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--input-border)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {categories.map(category => (
                  <option key={category} value={category} style={{ backgroundColor: 'var(--bg-sidebar, #111827)', color: '#fff' }}>
                    {category === 'All' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Category Buttons */}
            <div className="desktop-category-filters">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  style={{ padding: '7px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', backgroundColor: selectedCategory === cat ? 'var(--primary-color)' : 'var(--glass-card-bg)', color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="catalog-product-grid">
              {[1,2,3,4].map(i => <div key={i} style={{ height: '320px', borderRadius: '16px', backgroundColor: 'var(--glass-card-bg)', border: '1px solid var(--glass-card-border)' }} className="shimmer-bg" />)}
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <WarningIcon size={32} /><p>{error}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)', border: '1px dashed var(--bg-surface-border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <CartIcon size={48} style={{ color: 'var(--text-muted)' }} /><p style={{ margin: 0 }}>No products match your search.</p>
            </div>
          ) : (
            <div className="catalog-product-grid">
              {filteredProducts.map(product => {
                const outOfStock = product.stock === 0;
                const low = product.stock <= 5 && product.stock > 0;
                const inCart = cart.find(i => i.id === product.id);
                return (
                  <div 
                    key={product.id} 
                    className="catalog-product-card"
                    style={{ 
                      backgroundColor: 'var(--glass-card-bg)', 
                      border: `1px solid ${inCart ? 'var(--primary-color)' : 'var(--glass-card-border)'}`, 
                      borderRadius: '16px', 
                      overflow: 'hidden', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                      position: 'relative' 
                    }}
                    onMouseEnter={(e) => {
                      if (!outOfStock) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(var(--primary-color-rgb), 0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = inCart ? 'var(--primary-color)' : 'var(--glass-card-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {outOfStock && <span style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: 'rgba(239,68,68,0.9)', color: '#fff' }}>OUT OF STOCK</span>}
                    {low && <span style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: 'rgba(245,158,11,0.9)', color: '#fff' }}>ONLY {product.stock} LEFT</span>}
                    {inCart && <span style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: 'var(--primary-color)', color: '#fff' }}>In Cart ×{inCart.qty}</span>}

                    {/* Image */}
                    <div className="catalog-product-card-img" style={{ height: '180px', width: '100%', backgroundColor: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderBottom: '1px solid var(--glass-card-border)' }}>
                      <img 
                        src={getProductImage(product.image_url, product.category, product.name)} 
                        alt={product.name} 
                        onError={(e) => { 
                          if (!e.currentTarget.dataset.error) {
                            e.currentTarget.dataset.error = 'true';
                            e.currentTarget.src = getSvgFallback(product.category, product.name);
                          }
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: 'var(--glass-card-bg, rgba(255, 255, 255, 0.02))' }} 
                      />
                    </div>

                    {/* Details */}
                    <div className="catalog-product-card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <h3 className="catalog-product-card-title" style={{
                          fontSize: '1rem',
                          fontWeight: '700',
                          margin: 0,
                          textTransform: 'capitalize',
                          color: 'var(--text-primary)',
                          display: '-webkit-box',
                          WebkitLineClamp: '2',
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          height: '2.6em',
                          lineHeight: '1.3'
                        }}>{product.name}</h3>
                        {product.category && <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: '600', backgroundColor: 'var(--glass-card-bg)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{product.category}</span>}
                      </div>
                      <p className="catalog-product-card-desc" style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        margin: '2px 0 auto 0',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: '2',
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '2.8em'
                      }}>{product.description || 'No description available.'}</p>
                      <div className="catalog-product-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--glass-card-border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="catalog-product-card-price" style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-color)' }}>{product.price.toLocaleString()} FCFA</span>
                          <span className="catalog-product-stock-text" style={{
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            color: outOfStock ? '#ef4444' : low ? '#f59e0b' : '#10b981',
                            marginTop: '2px'
                          }}>
                            {outOfStock ? 'Out of stock' : low ? `Only ${product.stock} left` : `${product.stock} available`}
                          </span>
                        </div>
                        {inCart ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onMouseDown={() => startSwiftChange(product.id, -1)}
                              onMouseUp={stopSwiftChange}
                              onMouseLeave={stopSwiftChange}
                              onTouchStart={(e) => { e.preventDefault(); startSwiftChange(product.id, -1); }}
                              onTouchEnd={stopSwiftChange}
                              onClick={(e) => e.preventDefault()}
                              style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--input-border, rgba(255,255,255,0.08))', backgroundColor: 'var(--input-bg, rgba(255,255,255,0.02))', color: 'var(--text-primary, #fff)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold', userSelect: 'none' }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={inCart.qty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                const limit = product.stock !== undefined ? product.stock : 999;
                                setCart(prev => prev.map(i => i.id === product.id ? { ...i, qty: Math.max(1, Math.min(limit, val)) } : i));
                              }}
                              style={{ width: '38px', padding: '2px', textAlign: 'center', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '4px', fontSize: '0.82rem', color: 'var(--text-primary)', outline: 'none' }}
                            />
                            <button
                              onMouseDown={() => startSwiftChange(product.id, 1)}
                              onMouseUp={stopSwiftChange}
                              onMouseLeave={stopSwiftChange}
                              onTouchStart={(e) => { e.preventDefault(); startSwiftChange(product.id, 1); }}
                              onTouchEnd={stopSwiftChange}
                              onClick={(e) => e.preventDefault()}
                              style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--input-border, rgba(255,255,255,0.08))', backgroundColor: 'var(--input-bg, rgba(255,255,255,0.02))', color: 'var(--text-primary, #fff)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold', userSelect: 'none' }}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => !outOfStock && addToCart(product)}
                            disabled={outOfStock}
                            style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: outOfStock ? 'rgba(255,255,255,0.05)' : 'var(--primary-color)', color: outOfStock ? 'rgba(255,255,255,0.3)' : '#fff', fontWeight: '600', cursor: outOfStock ? 'not-allowed' : 'pointer', fontSize: '0.82rem', transition: 'all 0.2s' }}
                            onMouseEnter={e => { if (!outOfStock) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
                          >
                            {outOfStock ? 'Unavailable' : 'Add to Cart'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Customer Testimonials Carousel */}
          {reviews.length > 0 && (
            <div style={{
              backgroundColor: 'var(--glass-card-bg)',
              border: '1px solid var(--glass-card-border)',
              borderRadius: '16px',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginTop: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-color)', letterSpacing: '0.08em' }}>Customer Testimonials</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    disabled={reviews.length <= 1}
                    onClick={() => setTestimonialIdx(prev => (prev === 0 ? reviews.length - 1 : prev - 1))}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--input-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', transition: 'all 0.2s', opacity: reviews.length <= 1 ? 0.4 : 1 }}
                  >
                    ←
                  </button>
                  <button 
                    disabled={reviews.length <= 1}
                    onClick={() => setTestimonialIdx(prev => (prev === reviews.length - 1 ? 0 : prev + 1))}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--input-border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', transition: 'all 0.2s', opacity: reviews.length <= 1 ? 0.4 : 1 }}
                  >
                    →
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} filled={i < reviews[testimonialIdx]?.rating} size={16} />
                  ))}
                </div>
                <p style={{ margin: '0', fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  "{reviews[testimonialIdx]?.comment}"
                </p>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                  — {reviews[testimonialIdx]?.customer_name || 'Anonymous Client'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ─── Cart Sidebar ─── */}
        {cartOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
            {/* Backdrop */}
            <div onClick={() => setCartOpen(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
            {/* Panel */}
            <div className="catalog-drawer-panel" style={{ 
              position: 'absolute', 
              top: '24px', 
              right: '24px', 
              bottom: '24px', 
              width: 'calc(100% - 48px)', 
              maxWidth: '400px', 
              backgroundColor: 'var(--bg-sidebar)', 
              display: 'flex', 
              flexDirection: 'column', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              borderRadius: '20px',
              border: '1px solid var(--glass-card-border, rgba(255,255,255,0.08))',
              backdropFilter: 'blur(16px)',
              overflow: 'hidden'
            }}>
              <div className="catalog-drawer-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-sidebar)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>Your Cart ({cartCount})</h2>
                <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
              </div>

              <div className="catalog-drawer-content" style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <CartIcon size={40} /><p style={{ marginTop: '12px' }}>Your cart is empty</p>
                  </div>
                ) : cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', backgroundColor: 'var(--glass-card-bg)', borderRadius: '10px', border: '1px solid var(--glass-card-border)' }}>
                    {/* Small image thumbnail in Customer Cart drawer */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '1px solid var(--glass-card-border, rgba(255,255,255,0.08))',
                      flexShrink: 0
                    }}>
                      <img 
                        src={getProductImage(item.image_url, item.category, item.name)} 
                        alt={item.name} 
                        onError={(e) => { 
                          if (!e.currentTarget.dataset.error) {
                            e.currentTarget.dataset.error = 'true';
                            e.currentTarget.src = getSvgFallback(item.category, item.name);
                          }
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} 
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '0.88rem', textTransform: 'capitalize', color: 'var(--text-primary)' }}>{item.name}</p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--accent-color)' }}>{item.price.toLocaleString()} FCFA each</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({item.stock !== undefined ? `${item.stock} in stock` : 'available'})</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        onMouseDown={() => startSwiftChange(item.id, -1)}
                        onMouseUp={stopSwiftChange}
                        onTouchStart={(e) => { e.preventDefault(); startSwiftChange(item.id, -1); }}
                        onTouchEnd={stopSwiftChange}
                        onClick={(e) => e.preventDefault()}
                        style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--input-border, rgba(255,255,255,0.08))', backgroundColor: 'var(--input-bg, rgba(255,255,255,0.02))', color: 'var(--text-primary, #fff)', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', userSelect: 'none' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                        onMouseLeave={e => {
                          stopSwiftChange();
                          e.currentTarget.style.borderColor = 'var(--input-border, rgba(255,255,255,0.08))';
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          const limit = item.stock !== undefined ? item.stock : 999;
                          setCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: Math.max(1, Math.min(limit, val)) } : i));
                        }}
                        style={{ width: '40px', padding: '2px', textAlign: 'center', backgroundColor: 'var(--input-bg, rgba(255,255,255,0.02))', border: '1px solid var(--input-border, rgba(255,255,255,0.08))', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-primary, #fff)', outline: 'none' }}
                      />
                      <button 
                        onMouseDown={() => startSwiftChange(item.id, 1)}
                        onMouseUp={stopSwiftChange}
                        onTouchStart={(e) => { e.preventDefault(); startSwiftChange(item.id, 1); }}
                        onTouchEnd={stopSwiftChange}
                        onClick={(e) => e.preventDefault()}
                        style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--input-border, rgba(255,255,255,0.08))', backgroundColor: 'var(--input-bg, rgba(255,255,255,0.02))', color: 'var(--text-primary, #fff)', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', userSelect: 'none' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                        onMouseLeave={e => {
                          stopSwiftChange();
                          e.currentTarget.style.borderColor = 'var(--input-border, rgba(255,255,255,0.08))';
                        }}
                      >
                        +
                      </button>
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                      >✕</button>
                    </div>
                  </div>
                ))}
              </div>

              {cart.length > 0 && (
                <div className="catalog-drawer-footer" style={{ padding: '20px 24px', borderTop: '1px solid var(--border-sidebar)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.05rem' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--accent-color)' }}>{cartTotal.toLocaleString()} FCFA</span>
                  </div>
                  <button
                    onClick={() => { setCartOpen(false); setStep('checkout'); }}
                    style={{ padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary-color, #4F46E5)', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
                  >
                    Proceed to Checkout →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {renderSimulatedMomoModal()}
      {renderTrackDrawer()}
      <ReviewChatbot 
        selectedEntId={selectedEntId} 
        selectedEnt={selectedEnt} 
        fetchReviews={fetchReviews} 
        cartOpen={cartOpen} 
      />
      {renderAdPopup()}
      {renderDisputeModal()}

      {/* Guided Onboarding Walkthrough Tour Overlay & Bubble */}
      {tourActive && highlightStyle && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'none' }}>
          {/* Spotlight Mask */}
          <div style={highlightStyle} />
          
          {/* Popover Bubble */}
          <div style={{ ...getPopoverStyle(TOUR_STEPS[currentStepIdx]), pointerEvents: 'auto' }}>
            {/* Step header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Step {currentStepIdx + 1} of {TOUR_STEPS.length}
              </span>
              <button
                onClick={handleFinishTour}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Title & Description */}
            <h4 style={{ fontSize: '0.92rem', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              {TOUR_STEPS[currentStepIdx].title}
            </h4>
            <p style={{ fontSize: '0.82rem', lineHeight: '1.45', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              {TOUR_STEPS[currentStepIdx].content}
            </p>

            {/* Navigation Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleFinishTour}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                Skip
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                {currentStepIdx > 0 && (
                  <button
                    onClick={() => setCurrentStepIdx(prev => prev - 1)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                  >
                    Back
                  </button>
                )}
                
                <button
                  onClick={() => {
                    if (currentStepIdx < TOUR_STEPS.length - 1) {
                      setCurrentStepIdx(prev => prev + 1);
                    } else {
                      handleFinishTour();
                    }
                  }}
                  style={{
                    background: 'var(--primary-color)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                >
                  {currentStepIdx === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PublicCatalog;
