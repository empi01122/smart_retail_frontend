import React, { useState, useEffect } from 'react';
import { getStoreSettings, updateStoreSettings, getThemes, applyTheme, getInspiration } from '../services/settingsService';
import { getStaff, syncStaff, deleteStaff } from '../services/staffService';
import { useRole } from '../hooks/useRole';
import { useSettings } from '../hooks/useSettings';
import Card from '../components/card';
import Button from '../components/button';
import Table from '../components/table';

export const Settings = () => {
  const { isAdmin, user: loggedInUser } = useRole();
  const { settings: currentSettings, refreshSettings } = useSettings();
  
  // Tab states
  const [activeTab, setActiveTab] = useState('branding'); // 'branding' or 'staff'
  
  // Branding Form states
  const [brandingForm, setBrandingForm] = useState({
    store_name: '',
    primary_theme_color: '',
    secondary_theme_color: '',
    accent_theme_color: ''
  });
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState(false);

  // Themes & Inspiration states
  const [curatedThemes, setCuratedThemes] = useState([]);
  const [inspirations, setInspirations] = useState([]);
  const [themesLoading, setThemesLoading] = useState(true);

  // Staff states
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [addStaffForm, setAddStaffForm] = useState({
    name: '',
    email: '',
    role: 'employee'
  });
  const [addStaffLoading, setAddStaffLoading] = useState(false);

  // Initialize branding form with current global values
  useEffect(() => {
    if (currentSettings) {
      setBrandingForm({
        store_name: currentSettings.store_name || '',
        primary_theme_color: currentSettings.primary_theme_color || '',
        secondary_theme_color: currentSettings.secondary_theme_color || '',
        accent_theme_color: currentSettings.accent_theme_color || ''
      });
    }
  }, [currentSettings]);

  // Load theme presets and design tools
  useEffect(() => {
    const loadThemesAndTools = async () => {
      try {
        setThemesLoading(true);
        const [themesData, inspData] = await Promise.all([
          getThemes(),
          getInspiration()
        ]);
        setCuratedThemes(themesData || []);
        setInspirations(inspData || []);
      } catch (error) {
        console.error('Error loading customization resources:', error);
      } finally {
        setThemesLoading(false);
      }
    };

    loadThemesAndTools();
  }, []);

  // Load staff records (Admin Only)
  const fetchStaff = async () => {
    if (!isAdmin) return;
    try {
      setStaffLoading(true);
      const data = await getStaff();
      setStaffList(data || []);
    } catch (error) {
      console.error('Error fetching staff members:', error);
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'staff') {
      fetchStaff();
    }
  }, [activeTab, isAdmin]);

  // Branding updates
  const handleBrandingChange = (e) => {
    const { name, value } = e.target;
    setBrandingForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setBrandingLoading(true);
    setBrandingSuccess(false);

    try {
      await updateStoreSettings(brandingForm);
      await refreshSettings();
      setBrandingSuccess(true);
      setTimeout(() => setBrandingSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update store settings:', error);
      alert('Failed to save customization details.');
    } finally {
      setBrandingLoading(false);
    }
  };

  // Precurated themes applier
  const handleApplyPreset = async (themeId) => {
    if (!confirm('Apply this brand theme preset globally? This will immediately transform the colors of all screens.')) {
      return;
    }
    
    try {
      setBrandingLoading(true);
      await applyTheme(themeId);
      await refreshSettings();
      setBrandingSuccess(true);
      setTimeout(() => setBrandingSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to apply preset theme:', error);
      alert('Error applying theme.');
    } finally {
      setBrandingLoading(false);
    }
  };

  // Staff creation
  const handleAddStaffChange = (e) => {
    const { name, value } = e.target;
    setAddStaffForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!addStaffForm.name || !addStaffForm.email) {
      alert('Please fill out Name and Email.');
      return;
    }

    setAddStaffLoading(true);
    try {
      const payload = {
        name: addStaffForm.name,
        email: addStaffForm.email,
        role: addStaffForm.role,
        clerk_id: null, // Set to null for Pre-Authorization flow!
        created_by_id: loggedInUser?.id || null
      };

      await syncStaff(payload);
      setAddStaffForm({ name: '', email: '', role: 'employee' });
      alert('Staff pre-authorization successful! The employee can now register/sign-in using this email address.');
      await fetchStaff();
    } catch (error) {
      console.error('Staff creation failed:', error);
      alert(error.response?.data?.detail || 'Failed to register employee account.');
    } finally {
      setAddStaffLoading(false);
    }
  };

  // Staff deletion
  const handleDeleteStaff = async (id, staffName) => {
    if (id === loggedInUser?.id) {
      alert('Cannot delete your own active administrator profile.');
      return;
    }

    if (!confirm(`Revoke store access and permanently delete employee "${staffName}"?`)) {
      return;
    }

    try {
      await deleteStaff(id);
      await fetchStaff();
    } catch (error) {
      console.error('Error deleting staff member:', error);
      alert('Failed to revoke access.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      
      {/* Settings Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>System Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Customize store branding colors, manage staff accounts, and authorize roles.
        </p>
      </div>

      {/* Tabs Menu Selection */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        gap: '10px'
      }}>
        <button
          id="tab-branding-btn"
          onClick={() => setActiveTab('branding')}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'branding' ? '3px solid var(--primary-color)' : '3px solid transparent',
            color: activeTab === 'branding' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            fontSize: '0.92rem'
          }}
        >
          🎨 Custom Store Branding
        </button>
        {isAdmin && (
          <button
            id="tab-staff-btn"
            onClick={() => setActiveTab('staff')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'staff' ? '3px solid var(--primary-color)' : '3px solid transparent',
              color: activeTab === 'staff' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              fontSize: '0.92rem'
            }}
          >
            👥 Staff Accounts Panel
          </button>
        )}
      </div>

      {/* TAB A: BRANDING CUSTOMIZATION */}
      {activeTab === 'branding' && (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }} className="animate-fade-in">
          
          {/* Custom Theme configuration form */}
          <div style={{ flex: 1.2, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card title="Custom Colors & Identity" subtitle="Define custom colors matching your exact corporate signature.">
              {brandingSuccess && (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  color: 'var(--color-success)',
                  fontSize: '0.82rem',
                  marginBottom: '16px'
                }}>
                  ✅ Branding configuration saved and applied globally!
                </div>
              )}

              <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label htmlFor="store_name">Store Name</label>
                  <input
                    id="settings-store-name"
                    type="text"
                    name="store_name"
                    value={brandingForm.store_name}
                    onChange={handleBrandingChange}
                    placeholder="Smart Retail Shop"
                    disabled={!isAdmin}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                  <div>
                    <label htmlFor="primary_theme_color">Primary Brand Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="settings-color-primary-picker"
                        type="color"
                        name="primary_theme_color"
                        value={brandingForm.primary_theme_color}
                        onChange={handleBrandingChange}
                        disabled={!isAdmin}
                        style={{ width: '40px', height: '40px', padding: '2px', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <input
                        id="settings-color-primary-hex"
                        type="text"
                        name="primary_theme_color"
                        value={brandingForm.primary_theme_color}
                        onChange={handleBrandingChange}
                        disabled={!isAdmin}
                        placeholder="#000000"
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="secondary_theme_color">Secondary Background</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="settings-color-secondary-picker"
                        type="color"
                        name="secondary_theme_color"
                        value={brandingForm.secondary_theme_color}
                        onChange={handleBrandingChange}
                        disabled={!isAdmin}
                        style={{ width: '40px', height: '40px', padding: '2px', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <input
                        id="settings-color-secondary-hex"
                        type="text"
                        name="secondary_theme_color"
                        value={brandingForm.secondary_theme_color}
                        onChange={handleBrandingChange}
                        disabled={!isAdmin}
                        placeholder="#000000"
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="accent_theme_color">Highlight Accent</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="settings-color-accent-picker"
                        type="color"
                        name="accent_theme_color"
                        value={brandingForm.accent_theme_color}
                        onChange={handleBrandingChange}
                        disabled={!isAdmin}
                        style={{ width: '40px', height: '40px', padding: '2px', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <input
                        id="settings-color-accent-hex"
                        type="text"
                        name="accent_theme_color"
                        value={brandingForm.accent_theme_color}
                        onChange={handleBrandingChange}
                        disabled={!isAdmin}
                        placeholder="#000000"
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <Button
                      id="save-branding-submit"
                      type="submit"
                      variant="primary"
                      loading={brandingLoading}
                    >
                      Save Branding Configurations
                    </Button>
                  </div>
                )}
              </form>
            </Card>

            {/* Curated Theme Presets */}
            <Card title="Pre-Curated Color Presets" subtitle="Instantly apply premium color psychology visual themes.">
              {themesLoading ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[1, 2, 3].map(i => <div key={i} className="shimmer-bg" style={{ flex: 1, height: '80px', borderRadius: '10px' }} />)}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '12px'
                }}>
                  {curatedThemes.map((t) => (
                    <div
                      key={t.id}
                      id={`theme-preset-${t.id}`}
                      onClick={() => isAdmin && handleApplyPreset(t.id)}
                      style={{
                        padding: '14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        cursor: isAdmin ? 'pointer' : 'default',
                        transition: 'var(--transition-fast)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                      onMouseEnter={(e) => {
                        if (isAdmin) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.borderColor = 'rgba(var(--primary-color-rgb), 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                    >
                      <h4 style={{ fontSize: '0.85rem', margin: 0 }}>{t.name.split('(')[0].trim()}</h4>
                      
                      {/* Presets preview bubbles */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: t.primary_theme_color, border: '1px solid rgba(255,255,255,0.1)' }} />
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: t.secondary_theme_color, border: '1px solid rgba(255,255,255,0.1)' }} />
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: t.accent_theme_color, border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                      
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.3', margin: 0 }}>
                        {t.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Side: Visual Design inspiration links */}
          <div style={{ flex: 0.8, minWidth: '280px' }}>
            <Card title="Design Resources & Inspiration" subtitle="Discover premium external theme tools.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {inspirations.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      borderRadius: '10px'
                    }}
                  >
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{item.name}</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--primary-color)',
                          fontWeight: '600'
                        }}
                      >
                        Launch 🔗
                      </a>
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

        </div>
      )}

      {/* TAB B: STAFF ACCOUNTS & PERMISSIONS (Admin Only) */}
      {activeTab === 'staff' && isAdmin && (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }} className="animate-fade-in">
          
          {/* Add Staff form */}
          <div style={{ flex: 0.9, minWidth: '300px' }}>
            <Card title="Pre-Authorize Employee Profile" subtitle="Pre-authorize email addresses for secure login.">
              <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label htmlFor="staff-name">Name</label>
                  <input
                    id="staff-form-name"
                    type="text"
                    name="name"
                    value={addStaffForm.name}
                    onChange={handleAddStaffChange}
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="staff-email">Authorized Email</label>
                  <input
                    id="staff-form-email"
                    type="email"
                    name="email"
                    value={addStaffForm.email}
                    onChange={handleAddStaffChange}
                    placeholder="john@store.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="staff-role">Role Permissions</label>
                  <select
                    id="staff-form-role"
                    name="role"
                    value={addStaffForm.role}
                    onChange={handleAddStaffChange}
                  >
                    <option value="employee">Staff / Cashier</option>
                    <option value="admin">Store Owner / Admin</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <Button
                    id="add-staff-submit"
                    type="submit"
                    variant="primary"
                    loading={addStaffLoading}
                  >
                    Pre-Authorize Staff
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Staff List Table */}
          <div style={{ flex: 1.3, minWidth: '350px' }}>
            <Card title="Authorized Staff Members" subtitle="Profiles linked and pre-authorized to access this terminal.">
              <Table
                headers={['Profile Details', 'Role', 'Status', 'Actions']}
                loading={staffLoading}
                emptyMessage="No staff profiles authorized yet."
              >
                {staffList.map((staff) => {
                  const isActive = !!staff.clerk_id;
                  
                  return (
                    <tr
                      key={staff.id}
                      id={`staff-row-${staff.id}`}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                        transition: 'var(--transition-fast)'
                      }}
                      className="table-row-hover"
                    >
                      {/* Name & Email details */}
                      <td style={{ padding: '16px 20px' }}>
                        <div>
                          <h4 style={{ fontSize: '0.9rem', margin: 0 }}>{staff.name}</h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{staff.email}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          backgroundColor: staff.role === 'admin' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: staff.role === 'admin' ? 'var(--accent-color)' : 'var(--color-success)',
                        }}>
                          {staff.role === 'admin' ? 'Store Owner' : 'Staff'}
                        </span>
                      </td>

                      {/* Status indicator */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: isActive ? 'var(--color-success)' : 'var(--color-warning)',
                            boxShadow: `0 0 6px ${isActive ? 'var(--color-success)' : 'var(--color-warning)'}`
                          }} />
                          <span style={{ fontSize: '0.78rem', color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {isActive ? 'Synced' : 'Pending'}
                          </span>
                        </div>
                      </td>

                      {/* Deletion triggers */}
                      <td style={{ padding: '16px 20px' }}>
                        {staff.id !== loggedInUser?.id ? (
                          <Button
                            id={`revoke-staff-${staff.id}`}
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteStaff(staff.id, staff.name)}
                          >
                            Revoke Access
                          </Button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>Active Self</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </Table>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
};

export default Settings;