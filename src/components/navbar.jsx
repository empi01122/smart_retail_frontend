import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import { useSettings } from '../hooks/useSettings';

export const Navbar = () => {
  const { signOut, isBypass } = useAuth();
  const { isAdmin, role, user } = useRole();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { 
      path: '/storefront', 
      name: 'POS Checkout', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
      ), 
      roles: ['admin', 'employee'] 
    },
    { 
      path: '/products', 
      name: 'Inventory Catalog', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ), 
      roles: ['admin', 'employee'] 
    },
    { 
      path: '/sales', 
      name: 'Transaction Logs', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ), 
      roles: ['admin', 'employee'] 
    },
    { 
      path: '/dashboard', 
      name: 'Metrics & Insights', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.25c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 18.375v-5.25zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-9.75zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v14.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ), 
      roles: ['admin', 'employee'] 
    },
    { 
      path: '/settings', 
      name: 'Store & Staff', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ), 
      roles: ['admin'] 
    },
  ];

  return (
    <aside className="sidebar-panel glass-panel">
      {/* Brand logo & Store name */}
      <div className="brand-logo-container" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px 24px 12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        marginBottom: '20px',
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          backgroundColor: settings?.logo_url ? 'transparent' : 'var(--primary-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.35rem',
          boxShadow: settings?.logo_url ? 'none' : '0 4px 12px rgba(var(--primary-color-rgb), 0.3)',
          color: '#ffffff',
          fontWeight: '800',
          flexShrink: 0,
          overflow: 'hidden',
          border: settings?.logo_url ? '1px solid var(--border-sidebar)' : 'none'
        }}>
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={settings.store_name || "Logo"} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            settings?.store_name ? settings.store_name[0].toUpperCase() : 'S'
          )}
        </div>
        <div className="brand-text" style={{ flex: 1, overflow: 'hidden' }}>
          <h2 style={{
            fontSize: '0.95rem',
            margin: 0,
            lineHeight: '1.3',
            wordBreak: 'break-word',
            color: 'var(--text-primary)'
          }}>
            {settings?.store_name || 'Smart Retail'}
          </h2>
          <span style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Store Terminal
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {navItems.map((item) => {
          // If the item has roles filter and the user role is not in the list, skip rendering
          if (item.roles && !item.roles.includes(role)) return null;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              id={`nav-link-${item.path.substring(1)}`}
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Profile & Logout Box */}
      <div className="profile-section" style={{
        marginTop: 'auto',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        <div className="profile-container" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 6px',
        }}>
          {/* Avatar Bubble */}
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            fontWeight: 'bold',
            color: 'var(--accent-color)',
            flexShrink: 0
          }}>
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="profile-details" style={{ overflow: 'hidden', flex: 1 }}>
            <h4 style={{
              fontSize: '0.85rem',
              margin: 0,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}>
              {user?.name || 'Staff User'}
            </h4>
            {/* Role Badge */}
            <span style={{
              display: 'inline-flex',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.62rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '4px',
              backgroundColor: isAdmin ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: isAdmin ? 'var(--accent-color)' : 'var(--color-success)',
            }}>
              {role === 'admin' ? 'Store Owner' : 'Staff'}
            </span>
          </div>
        </div>

        {/* Logout Trigger */}
        <button
          id="logout-btn"
          className="logout-btn"
          onClick={handleLogout}
        >
          <span className="logout-btn-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </span>
          <span className="logout-btn-text">
            Sign Out {isBypass && <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>(Dev Bypass)</span>}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Navbar;