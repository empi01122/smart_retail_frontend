import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import { useSettings } from '../hooks/useSettings';
import { getBaseURL } from '../services/api';

export const Navbar = () => {
  const { signOut, isBypass, clerkUser } = useAuth();
  const { isAdmin, role, user, isTechnician, isActualTechnician } = useRole();
  const { settings } = useSettings();
  const navigate = useNavigate();

  console.log('[Navbar Debug] role:', role, 'isAdmin:', isAdmin, 'isTechnician:', isTechnician, 'user:', user);

  const [enterprises, setEnterprises] = useState([]);
  const [selectedEntId, setSelectedEntId] = useState(
    localStorage.getItem('active_enterprise_id') || '1'
  );

  const API_BASE = getBaseURL();

  useEffect(() => {
    if (isActualTechnician) {
      axios.get(`${API_BASE}/enterprises/`)
        .then(res => {
          setEnterprises(res.data || []);
          if (!localStorage.getItem('active_enterprise_id') && res.data.length > 0) {
            const firstId = res.data[0].id.toString();
            setSelectedEntId(firstId);
            localStorage.setItem('active_enterprise_id', firstId);
          }
        })
        .catch(err => console.error('Error fetching enterprises in nav:', err));
    }
  }, [isActualTechnician]);

  const handleEnterpriseChange = (e) => {
    const entId = e.target.value;
    setSelectedEntId(entId);
    localStorage.setItem('active_enterprise_id', entId);
    window.location.href = window.location.pathname; // reload same page cleanly
  };

  const handleRoleChange = (e) => {
    const nextRole = e.target.value;
    localStorage.setItem('active_role', nextRole);
    if (nextRole === 'buyer') {
      window.location.href = '/catalog'; // Use href instead of navigate + reload
    } else {
      window.location.href = '/storefront';
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('active_enterprise_id');
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
      roles: ['technician', 'proprietor', 'employee'] 
    },
    { 
      path: '/products', 
      name: 'Inventory Catalog', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ), 
      roles: ['technician', 'proprietor', 'employee'] 
    },
    { 
      path: '/sales', 
      name: 'Transaction Logs', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ), 
      roles: ['technician', 'proprietor', 'employee'] 
    },
    { 
      path: '/dashboard', 
      name: 'Metrics & Insights', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h4V10H4v9zM10 19h4V5h-4v14zM16 19h4V14h-4v5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 10l4 4 4-8 4 6 4-4" />
        </svg>
      ), 
      roles: ['technician', 'proprietor', 'owner', 'admin', 'employee'] 
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
      roles: ['technician', 'proprietor', 'owner', 'admin'] 
    },
  ];

  return (
    <>
      <aside className="sidebar-panel glass-panel">
        <div className="brand-logo-container" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '6px 10px 14px 10px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '12px',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: settings?.logo_url ? 'transparent' : 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            boxShadow: settings?.logo_url ? 'none' : '0 4px 10px rgba(var(--primary-color-rgb), 0.3)',
            color: '#ffffff',
            fontWeight: '800',
            flexShrink: 0,
            overflow: 'hidden',
            border: settings?.logo_url ? '1px solid var(--border-sidebar)' : 'none'
          }}>
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={settings.store_name || "Logo"} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              settings?.store_name ? settings.store_name[0].toUpperCase() : 'E'
            )}
          </div>
          <div className="brand-text" style={{ flex: 1, overflow: 'hidden' }}>
            <h2 style={{
              fontSize: '0.85rem',
              margin: 0,
              lineHeight: '1.2',
              wordBreak: 'break-word',
              color: 'var(--text-primary)'
            }}>
              {settings?.store_name || 'Smart Retail'}
            </h2>
            <span style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Enterprise Console
            </span>
          </div>
        </div>
        {isActualTechnician && (
          <div style={{
            padding: '4px 12px 10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <label style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-color)', letterSpacing: '0.05em' }}>
              Enterprise View:
            </label>
            <select
              value={selectedEntId}
              onChange={handleEnterpriseChange}
              style={{
                width: '100%',
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid var(--input-border, rgba(255, 255, 255, 0.1))',
                backgroundColor: 'var(--input-bg, rgba(255, 255, 255, 0.03))',
                color: 'var(--text-primary, #ffffff)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {enterprises.map(e => (
                <option key={e.id} value={e.id} style={{ backgroundColor: 'var(--bg-sidebar, #0f172a)', color: 'var(--text-primary, #ffffff)' }}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{
          padding: '8px 10px 12px 10px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <label style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-color)', letterSpacing: '0.05em' }}>
            Role/Workspace View:
          </label>
          <select
            value={role || 'technician'}
            onChange={handleRoleChange}
            style={{
              width: '100%',
              padding: '5px 8px',
              borderRadius: '6px',
              border: '1px solid var(--input-border, rgba(255, 255, 255, 0.1))',
              backgroundColor: 'var(--input-bg, rgba(255, 255, 255, 0.03))',
              color: 'var(--text-primary, #ffffff)',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="technician" style={{ backgroundColor: 'var(--bg-sidebar, #0f172a)', color: 'var(--text-primary, #ffffff)' }}>System Tech</option>
            <option value="proprietor" style={{ backgroundColor: 'var(--bg-sidebar, #0f172a)', color: 'var(--text-primary, #ffffff)' }}>Store Owner (Proprietor)</option>
            <option value="employee" style={{ backgroundColor: 'var(--bg-sidebar, #0f172a)', color: 'var(--text-primary, #ffffff)' }}>Cashier (Employee)</option>
            <option value="buyer" style={{ backgroundColor: 'var(--bg-sidebar, #0f172a)', color: 'var(--text-primary, #ffffff)' }}>Buyer / Consumer</option>
          </select>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {navItems.map((item) => {
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

        <div className="profile-section" style={{
          marginTop: 'auto',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div className="profile-container" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '2px 4px',
          }}>
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
              flexShrink: 0,
              overflow: 'hidden'
            }}>
              <img 
                src={clerkUser?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Staff')}&background=4F46E5&color=fff&bold=true`} 
                alt={user?.name || 'User Avatar'} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
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
              <span style={{
                display: 'inline-flex',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.62rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: '2px',
                backgroundColor: isAdmin ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: isAdmin ? 'var(--accent-color)' : 'var(--color-success)',
              }}>
                {role === 'technician' ? 'system Tech' : role === 'proprietor' ? 'owner' : 'cashier'}
              </span>
            </div>
          </div>

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

      {/* Mobile Top Utility Header */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: settings?.logo_url ? 'transparent' : 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            color: '#ffffff',
            fontWeight: '800',
            flexShrink: 0,
            overflow: 'hidden',
            border: settings?.logo_url ? '1px solid var(--border-sidebar)' : 'none'
          }}>
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              settings?.store_name ? settings.store_name[0].toUpperCase() : 'E'
            )}
          </div>
          <h2 className="mobile-store-name" style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-primary)', fontWeight: '800' }}>
            {settings?.store_name || 'Smart Retail'}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '240px' }}>
          {isActualTechnician && (
            <select
              value={selectedEntId}
              onChange={handleEnterpriseChange}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid var(--input-border, rgba(255, 255, 255, 0.1))',
                backgroundColor: 'var(--input-bg, rgba(255, 255, 255, 0.03))',
                color: 'var(--text-primary, #ffffff)',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none',
                width: '90px'
              }}
            >
              {enterprises.map(e => (
                <option key={e.id} value={e.id} style={{ backgroundColor: 'var(--bg-sidebar, #0b0f19)', color: 'var(--text-primary, #ffffff)' }}>
                  {e.name.length > 6 ? e.name.substring(0, 6) + '..' : e.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={role || 'technician'}
            onChange={handleRoleChange}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid var(--input-border, rgba(255, 255, 255, 0.1))',
              backgroundColor: 'var(--input-bg, rgba(255, 255, 255, 0.03))',
              color: 'var(--text-primary, #ffffff)',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              outline: 'none',
              width: '90px'
            }}
          >
            <option value="technician" style={{ backgroundColor: 'var(--bg-sidebar, #0b0f19)', color: 'var(--text-primary, #ffffff)' }}>Tech</option>
            <option value="proprietor" style={{ backgroundColor: 'var(--bg-sidebar, #0b0f19)', color: 'var(--text-primary, #ffffff)' }}>Owner</option>
            <option value="employee" style={{ backgroundColor: 'var(--bg-sidebar, #0b0f19)', color: 'var(--text-primary, #ffffff)' }}>Cashier</option>
            <option value="buyer" style={{ backgroundColor: 'var(--bg-sidebar, #0b0f19)', color: 'var(--text-primary, #ffffff)' }}>Buyer</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            color: 'var(--accent-color)',
            flexShrink: 0,
            overflow: 'hidden'
          }} title={user?.name || 'User'}>
            <img 
              src={clerkUser?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Staff')}&background=4F46E5&color=fff&bold=true`} 
              alt={user?.name || 'User Avatar'} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              color: 'var(--color-danger)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
            title="Sign Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          if (item.roles && !item.roles.includes(role)) return null;

          // Simplify label names for small screens
          let displayName = item.name;
          if (item.name === 'POS Checkout') displayName = 'POS';
          else if (item.name === 'Inventory Catalog') displayName = 'Inventory';
          else if (item.name === 'Transaction Logs') displayName = 'Sales';
          else if (item.name === 'Metrics & Insights') displayName = 'Metrics';
          else if (item.name === 'Store & Staff') displayName = 'Settings';

          return (
            <NavLink
              key={item.path}
              to={item.path}
              id={`mobile-nav-link-${item.path.substring(1)}`}
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
            >
              <span style={{ display: 'inline-flex' }}>{item.icon}</span>
              <span style={{ fontSize: '0.55rem', fontWeight: '700', marginTop: '2px' }}>{displayName}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default Navbar;