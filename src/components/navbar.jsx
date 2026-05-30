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
    { path: '/storefront', name: 'POS Checkout', icon: '🛒', roles: ['admin', 'employee'] },
    { path: '/products', name: 'Inventory Catalog', icon: '📦', roles: ['admin', 'employee'] },
    { path: '/sales', name: 'Transaction Logs', icon: '🧾', roles: ['admin', 'employee'] },
    { path: '/dashboard', name: 'Metrics & Insights', icon: '📊', roles: ['admin', 'employee'] },
    { path: '/settings', name: 'Store & Staff', icon: '⚙️', roles: ['admin'] },
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
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          backgroundColor: 'var(--primary-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          boxShadow: '0 4px 12px rgba(var(--primary-color-rgb), 0.3)',
          color: '#ffffff',
          fontWeight: '800',
          flexShrink: 0
        }}>
          S
        </div>
        <div className="brand-text" style={{ overflow: 'hidden' }}>
          <h2 style={{
            fontSize: '1rem',
            margin: 0,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
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
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 16px',
                borderRadius: '12px',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.92rem',
                transition: 'var(--transition-fast)',
                boxShadow: isActive ? '0 4px 15px rgba(var(--primary-color-rgb), 0.25)' : 'none',
              })}
              onMouseEnter={(e) => {
                const isActive = e.currentTarget.classList.contains('active');
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                const isActive = e.currentTarget.classList.contains('active');
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <span style={{ fontSize: '1.1rem', display: 'inline-flex', flexShrink: 0 }}>{item.icon}</span>
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
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            color: 'var(--color-danger)',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-danger)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
            e.currentTarget.style.color = 'var(--color-danger)';
          }}
        >
          <span>🚪</span>
          <span className="logout-btn-text">
            Sign Out {isBypass && <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>(Dev Bypass)</span>}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Navbar;