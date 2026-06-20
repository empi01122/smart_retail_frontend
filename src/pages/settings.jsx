import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getStoreSettings, updateStoreSettings, getThemes, applyTheme, getInspiration, upgradeEnterpriseSubscription } from '../services/settingsService';
import { getStaff, syncStaff, deleteStaff } from '../services/staffService';
import { useRole } from '../hooks/useRole';
import { useSettings } from '../hooks/useSettings';
import { getBaseURL } from '../services/api';
import Card from '../components/card';
import Button from '../components/button';
import Table from '../components/table';
import Modal from '../components/modal';
import { WarningIcon } from '../components/icons';

export const Settings = () => {
  const { isAdmin, isTechnician, isActualTechnician, user: loggedInUser } = useRole();
  const isSystemTech = isTechnician || isActualTechnician;
  const { settings: currentSettings, refreshSettings, applyThemeStyles } = useSettings();
  const API_BASE = getBaseURL();
  
  // Tab states
  const [activeTab, setActiveTab] = useState('branding'); // 'branding' or 'staff'
  
  // Branding Form states
  const [brandingForm, setBrandingForm] = useState({
    store_name: '',
    logo_url: '',
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

  // Subscription States
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState(''); // 'pro' or 'ultra'
  const [upgradePhone, setUpgradePhone] = useState('');
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeStep, setUpgradeStep] = useState('input'); // 'input' | 'processing' | 'success'

  // Staff states
  const [staffList, setStaffList] = useState([]);

  // Derived settings and limits (placed after state declarations to avoid ReferenceErrors)
  const subTier = isSystemTech ? 'ultra' : (currentSettings?.subscription_tier || 'free');
  const themeChangesCount = currentSettings?.theme_changes_count || 0;
  const isBrandingDisabled = !isAdmin || (!isSystemTech && (subTier === 'free' || (subTier === 'pro' && themeChangesCount >= 1)));
  
  const staffCount = staffList.filter(s => s.role === 'employee').length;
  const isStaffDisabled = !isAdmin || (!isSystemTech && ((subTier === 'free' && staffCount >= 1) || (subTier === 'pro' && staffCount >= 2)));

  const [staffLoading, setStaffLoading] = useState(false);
  const [enterprisesList, setEnterprisesList] = useState([]);
  const [addStaffForm, setAddStaffForm] = useState({
    name: '',
    email: '',
    role: 'employee',
    enterprise_id: ''
  });
  const [addStaffLoading, setAddStaffLoading] = useState(false);

  // Initialize branding form with current global values
  useEffect(() => {
    if (currentSettings) {
      setBrandingForm({
        store_name: currentSettings.store_name || '',
        logo_url: currentSettings.logo_url || '',
        primary_theme_color: currentSettings.primary_theme_color || '',
        secondary_theme_color: currentSettings.secondary_theme_color || '',
        accent_theme_color: currentSettings.accent_theme_color || ''
      });
    }
  }, [currentSettings]);

  // Reset theme styles back to saved settings if unmounted (discarding unsaved picker previews)
  useEffect(() => {
    return () => {
      if (currentSettings && applyThemeStyles) {
        applyThemeStyles(currentSettings);
      }
    };
  }, [currentSettings, applyThemeStyles]);

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

  // Load enterprises (System Tech Only)
  useEffect(() => {
    if (isSystemTech && activeTab === 'staff') {
      axios.get(`${API_BASE}/enterprises/`)
        .then(res => {
          setEnterprisesList(res.data || []);
          setAddStaffForm(prev => {
            if (!prev.enterprise_id && res.data.length > 0) {
              return { ...prev, enterprise_id: res.data[0].id.toString() };
            }
            return prev;
          });
        })
        .catch(err => console.error('Error fetching enterprises in settings:', err));
    }
  }, [isSystemTech, activeTab, API_BASE]);

  // Branding updates
  const handleBrandingChange = (e) => {
    const { name, value } = e.target;
    setBrandingForm(prev => {
      const updated = { ...prev, [name]: value };
      if (applyThemeStyles) {
        applyThemeStyles(updated);
      }
      return updated;
    });
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400; // Keep logo size compact
          const MAX_HEIGHT = 400;
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

          // Compress to lightweight JPEG data URL
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setBrandingForm(prev => {
            const updated = { ...prev, logo_url: compressedDataUrl };
            if (applyThemeStyles) {
              applyThemeStyles(updated);
            }
            return updated;
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setBrandingLoading(true);
    setBrandingSuccess(false);

    try {
      const activeEntId = localStorage.getItem('active_enterprise_id');
      await updateStoreSettings(brandingForm, activeEntId);
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

  // Subscription handlers
  const handleOpenUpgradeModal = (tier) => {
    setUpgradeTier(tier);
    setUpgradePhone('');
    setUpgradeError('');
    setUpgradeStep('input');
    setShowUpgradeModal(true);
  };

  const handleUpgradeSubscription = async (e) => {
    if (e) e.preventDefault();
    const phoneVal = upgradePhone.trim();
    if (!phoneVal) {
      setUpgradeError('Please enter a Cameroonian Mobile Money number.');
      return;
    }

    // Cameroon MoMo phone number validation (starts with 6, exactly 9 digits)
    let localPhone = phoneVal;
    if (phoneVal.startsWith('+237')) {
      localPhone = phoneVal.slice(4);
    } else if (phoneVal.startsWith('237')) {
      localPhone = phoneVal.slice(3);
    }
    localPhone = localPhone.replace(/[\s\-]/g, '');

    if (!/^\d+$/.test(localPhone)) {
      setUpgradeError('Phone number must contain only digits.');
      return;
    }
    if (localPhone.length !== 9) {
      setUpgradeError('Cameroon phone number must be exactly 9 digits.');
      return;
    }
    if (!/^6[5-9]\d{7}$/.test(localPhone)) {
      setUpgradeError('Invalid Cameroon phone number. Must start with 6 followed by 5, 7, 8, or 9.');
      return;
    }

    setUpgradeError('');
    setUpgradeStep('processing');

    try {
      // Simulate payment delay (2.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const activeEntId = localStorage.getItem('active_enterprise_id');
      await upgradeEnterpriseSubscription(activeEntId, localPhone, upgradeTier);
      
      setUpgradeStep('success');
      await refreshSettings();
      
      setTimeout(() => {
        setShowUpgradeModal(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      setUpgradeStep('input');
      setUpgradeError(error.response?.data?.detail || 'Failed to complete simulated payment. Please try again.');
    }
  };

  // Precurated themes applier
  const handleApplyPreset = async (themeId) => {
    if (!confirm('Apply this brand theme preset globally? This will immediately transform the colors of all screens.')) {
      return;
    }
    
    try {
      setBrandingLoading(true);
      const theme = curatedThemes.find(t => t.id === themeId);
      if (theme && applyThemeStyles) {
        applyThemeStyles(theme);
      }
      const activeEntId = localStorage.getItem('active_enterprise_id');
      await applyTheme(themeId, activeEntId);
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
    if (isSystemTech && !addStaffForm.enterprise_id) {
      alert('Please select an Enterprise.');
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

      if (isSystemTech && addStaffForm.enterprise_id) {
        payload.enterprise_id = parseInt(addStaffForm.enterprise_id);
      }

      await syncStaff(payload);
      setAddStaffForm(prev => ({
        name: '',
        email: '',
        role: 'employee',
        enterprise_id: prev.enterprise_id
      }));
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
        borderBottom: '1px solid var(--border-sidebar)',
        gap: '10px',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        scrollbarWidth: 'none', /* Firefox */
        msOverflowStyle: 'none', /* IE 10+ */
        paddingBottom: '2px'
      }}>
        <button
          id="tab-branding-btn"
          onClick={() => setActiveTab('branding')}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'branding' ? '3px solid var(--primary-color)' : '3px solid transparent',
            color: activeTab === 'branding' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M4.098 19.902a3.75 3.75 0 015.304 0l6.401-6.402M4.098 19.902l1.498-1.498m5.304 5.304l-1.498-1.498m1.498-5.304l-1.498-1.498m10.158-1.472a1.5 1.5 0 11-2.122-2.122l.504-.504a1.5 1.5 0 112.122 2.122l-.504.504z" />
          </svg>
          <span>Store Branding</span>
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
              color: activeTab === 'staff' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <span>Staff Accounts</span>
          </button>
        )}
      </div>

      {/* TAB A: BRANDING CUSTOMIZATION */}
      {activeTab === 'branding' && (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }} className="animate-fade-in">
          
          {/* Custom Theme configuration form */}
          <div style={{ flex: 1.2, minWidth: 'min(320px, 100%)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card title="Custom Colors & Identity" subtitle="Define custom colors matching your exact corporate signature.">
              {subTier === 'free' && (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '8px',
                  color: '#f59e0b',
                  fontSize: '0.8rem',
                  marginBottom: '16px',
                  lineHeight: 1.4
                }}>
                   <strong>Premium Branding Locked:</strong> Custom branding colors are locked on the Free Trial. Please upgrade to Pro or Ultra in the subscription panel.
                </div>
              )}
              {subTier === 'pro' && themeChangesCount >= 1 && (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  marginBottom: '16px',
                  lineHeight: 1.4
                }}>
                   <strong>Branding Customization Limit Reached:</strong> Pro subscriptions are limited to exactly 1 custom theme branding edit, which you have already used. Upgrade to Ultra for unlimited theme edits.
                </div>
              )}

              {brandingSuccess && (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  color: 'var(--color-success)',
                  fontSize: '0.82rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '14px', height: '14px', color: 'var(--color-success)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>Branding configuration saved and applied globally!</span>
                </div>
              )}

              <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
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
                  <div>
                    <label>Store Logo</label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div 
                        onClick={() => isAdmin && document.getElementById('logo-file-input').click()}
                        style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '10px',
                          border: '2px dashed rgba(255, 255, 255, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isAdmin ? 'pointer' : 'default',
                          overflow: 'hidden',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          transition: 'var(--transition-fast)',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => { if (isAdmin) e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                        onMouseLeave={(e) => { if (isAdmin) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
                      >
                        {brandingForm.logo_url ? (
                          <img 
                            src={brandingForm.logo_url} 
                            alt="Logo Preview" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '24px', height: '24px', color: 'var(--text-muted)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                          </svg>
                        )}
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
                        {isAdmin && (
                          <>
                            <input 
                              id="logo-file-input"
                              type="file" 
                              accept="image/*"
                              onChange={handleLogoFileChange}
                              style={{ display: 'none' }}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => document.getElementById('logo-file-input').click()}
                              icon={
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '12px', height: '12px' }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              }
                              style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              Choose Logo File
                            </Button>
                          </>
                        )}
                        <input
                          id="settings-store-logo"
                          type="text"
                          name="logo_url"
                          value={brandingForm.logo_url}
                          onChange={handleBrandingChange}
                          placeholder="Or paste direct image URL here..."
                          disabled={!isAdmin}
                          style={{ fontSize: '0.85rem', margin: 0 }}
                        />
                      </div>
                    </div>
                  </div>
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
                        disabled={isBrandingDisabled}
                        style={{ width: '40px', height: '40px', padding: '2px', cursor: isBrandingDisabled ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                      />
                      <input
                        id="settings-color-primary-hex"
                        type="text"
                        name="primary_theme_color"
                        value={brandingForm.primary_theme_color}
                        onChange={handleBrandingChange}
                        disabled={isBrandingDisabled}
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
                        disabled={isBrandingDisabled}
                        style={{ width: '40px', height: '40px', padding: '2px', cursor: isBrandingDisabled ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                      />
                      <input
                        id="settings-color-secondary-hex"
                        type="text"
                        name="secondary_theme_color"
                        value={brandingForm.secondary_theme_color}
                        onChange={handleBrandingChange}
                        disabled={isBrandingDisabled}
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
                        disabled={isBrandingDisabled}
                        style={{ width: '40px', height: '40px', padding: '2px', cursor: isBrandingDisabled ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                      />
                      <input
                        id="settings-color-accent-hex"
                        type="text"
                        name="accent_theme_color"
                        value={brandingForm.accent_theme_color}
                        onChange={handleBrandingChange}
                        disabled={isBrandingDisabled}
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
                      disabled={isBrandingDisabled}
                    >
                      Save Branding Configurations
                    </Button>
                  </div>
                )}
              </form>
            </Card>

            {/* Curated Theme Presets */}
            <Card title="Pre-Curated Color Presets" subtitle="Instantly apply premium color psychology visual themes.">
              {subTier === 'free' && (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '8px',
                  color: '#f59e0b',
                  fontSize: '0.8rem',
                  marginBottom: '16px',
                  lineHeight: 1.4
                }}>
                   <strong>Premium Themes Locked:</strong> Curved palettes and curated theme templates require a Pro or Ultra subscription.
                </div>
              )}
              {subTier === 'pro' && themeChangesCount >= 1 && (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  marginBottom: '16px',
                  lineHeight: 1.4
                }}>
                   <strong>Presets Locked:</strong> You have already used your 1 custom theme branding edit. Upgrade to Ultra for unlimited theme edits.
                </div>
              )}

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
                      onClick={() => !isBrandingDisabled && handleApplyPreset(t.id)}
                      style={{
                        padding: '14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        cursor: isBrandingDisabled ? 'not-allowed' : 'pointer',
                        opacity: isBrandingDisabled ? 0.6 : 1,
                        transition: 'var(--transition-fast)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                      onMouseEnter={(e) => {
                        if (!isBrandingDisabled) {
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

          {/* Right Side: My Subscription & Inspiration links */}
          <div style={{ flex: 0.8, minWidth: 'min(280px, 100%)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card title="My Subscription" subtitle="Manage your retail store plan.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Current Plan:</span>
                  <span style={{
                    display: 'inline-flex',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: isSystemTech ? '#10B981' : (subTier === 'ultra' ? '#8b5cf6' : subTier === 'pro' ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.08)'),
                    color: '#fff',
                  }}>
                    {isSystemTech ? 'Technician Bypass' : (subTier === 'ultra' ? 'Ultra Plan' : subTier === 'pro' ? 'Pro Plan' : 'Free Trial')}
                  </span>
                </div>
                
                {!isSystemTech && subTier !== 'ultra' && isAdmin && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    {subTier === 'free' && (
                      <Button
                        id="upgrade-pro-btn"
                        variant="primary"
                        fullWidth
                        onClick={() => handleOpenUpgradeModal('pro')}
                      >
                        Upgrade to Pro (10,000 FCFA/mo)
                      </Button>
                    )}
                    <Button
                      id="upgrade-ultra-btn"
                      variant="secondary"
                      fullWidth
                      style={{
                        backgroundColor: '#8b5cf6',
                        borderColor: '#8b5cf6',
                        color: '#fff'
                      }}
                      onClick={() => handleOpenUpgradeModal('ultra')}
                    >
                      Upgrade to Ultra (25,000 FCFA/mo)
                    </Button>
                  </div>
                )}
                
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', lineHeight: 1.4 }}>
                  <span style={{ fontWeight: '700', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.03em' }}>Tier Features:</span>
                  {subTier === 'free' && (
                    <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <li>Max 1 staff member</li>
                      <li>Max 15 catalog products</li>
                      <li>Standard theme colors only</li>
                      <li>Analytics dashboard locked</li>
                    </ul>
                  )}
                  {subTier === 'pro' && (
                    <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <li>Max 2 staff members</li>
                      <li>Unlimited catalog products</li>
                      <li>Theme customization (1 edit allowed)</li>
                      <li>Basic Sales Analytics charts</li>
                    </ul>
                  )}
                  {subTier === 'ultra' && (
                    <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <li>Unlimited staff members & products</li>
                      <li>Unlimited theme customization edits</li>
                      <li>Deep Analytics (Predictive & Low-Stock)</li>
                      <li>Customer Testimonials & Chatbot reviews</li>
                      <li>Pinned Featured store recommendations</li>
                    </ul>
                  )}
                  {isSystemTech && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10B981', fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>✓</span>
                      <span>System Technician Mode: All premium limits bypassed.</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

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
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Launch
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '11px', height: '11px' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
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
          <div style={{ flex: 0.9, minWidth: 'min(300px, 100%)' }}>
            <Card title="Pre-Authorize Employee Profile" subtitle="Pre-authorize email addresses for secure login.">
              {subTier === 'free' && staffCount >= 1 && (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '8px',
                  color: '#f59e0b',
                  fontSize: '0.8rem',
                  marginBottom: '16px',
                  lineHeight: 1.4
                }}>
                   <strong>Staff Limit Reached:</strong> Free Trial accounts are limited to exactly 1 staff member. Please upgrade to Pro or Ultra in the branding tab to add more employees.
                </div>
              )}
              {subTier === 'pro' && staffCount >= 2 && (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '8px',
                  color: '#f59e0b',
                  fontSize: '0.8rem',
                  marginBottom: '16px',
                  lineHeight: 1.4
                }}>
                   <strong>Staff Limit Reached:</strong> Pro accounts are limited to exactly 2 staff members. Please upgrade to Ultra in the branding tab to add more employees.
                </div>
              )}

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
                    disabled={isStaffDisabled}
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
                    disabled={isStaffDisabled}
                    required
                  />
                </div>

                {isSystemTech && (
                  <div>
                    <label htmlFor="staff-enterprise">Enterprise Scope</label>
                    <select
                      id="staff-form-enterprise"
                      name="enterprise_id"
                      value={addStaffForm.enterprise_id}
                      onChange={handleAddStaffChange}
                      disabled={isStaffDisabled}
                      required
                    >
                      <option value="">-- Select Enterprise --</option>
                      {enterprisesList.map(ent => (
                        <option key={ent.id} value={ent.id}>{ent.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="staff-role">Role Permissions</label>
                  <select
                    id="staff-form-role"
                    name="role"
                    value={addStaffForm.role}
                    onChange={handleAddStaffChange}
                    disabled={isStaffDisabled}
                  >
                    <option value="employee">Staff / Cashier</option>
                    <option value="proprietor">Store Owner / Admin</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <Button
                    id="add-staff-submit"
                    type="submit"
                    variant="primary"
                    loading={addStaffLoading}
                    disabled={isStaffDisabled}
                  >
                    Pre-Authorize Staff
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Staff List Table */}
          <div style={{ flex: 1.3, minWidth: 'min(280px, 100%)' }}>
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
                      {/* Name & Email details with avatar */}
                      <td data-label="Profile Details" style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}>
                            <img 
                              src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(staff.email)}`}
                              alt={staff.name} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name)}&background=random&color=fff`;
                              }}
                            />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '0.9rem', margin: 0 }}>{staff.name}</h4>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{staff.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td data-label="Role" style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          backgroundColor: (staff.role === 'proprietor' || staff.role === 'technician') ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: (staff.role === 'proprietor' || staff.role === 'technician') ? 'var(--accent-color)' : 'var(--color-success)',
                        }}>
                          {staff.role === 'technician' ? 'System Tech' : staff.role === 'proprietor' ? 'Store Owner' : 'Staff'}
                        </span>
                      </td>

                      {/* Status indicator */}
                      <td data-label="Status" style={{ padding: '16px 20px' }}>
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
                      <td data-label="Actions" style={{ padding: '16px 20px' }}>
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

      {/* ─── Subscription Billing Upgrade Modal ─── */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => upgradeStep !== 'processing' && setShowUpgradeModal(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px', color: 'var(--primary-color)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H3m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25c.621 0 1.125.504 1.125 1.125v13.5c0 .621-.504 1.125-1.125 1.125H3.75A1.125 1.125 0 012.25 18M3.75 4.5h16.5M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            <span>Upgrade to {upgradeTier === 'ultra' ? 'Ultra' : 'Pro'} Plan</span>
          </div>
        }
        footer={
          upgradeStep === 'input' ? (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={() => setShowUpgradeModal(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleUpgradeSubscription} variant="primary">
                Pay via Mobile Money
              </Button>
            </div>
          ) : null
        }
      >
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        {upgradeStep === 'input' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Enter your Cameroonian Mobile Money phone number. We will send a payment prompt to authorize this monthly plan.
            </p>
            
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Tier:</span>
                <span style={{ fontWeight: '700', textTransform: 'capitalize' }}>{upgradeTier} Plan</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount Due:</span>
                <span style={{ fontWeight: '800', color: 'var(--accent-color)' }}>
                  {upgradeTier === 'ultra' ? '25,000 FCFA' : '10,000 FCFA'}
                </span>
              </div>
            </div>

            <form onSubmit={handleUpgradeSubscription} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="momo-phone-upgrade" style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                MoMo Phone Number *
              </label>
              <input
                id="momo-phone-upgrade"
                type="tel"
                placeholder="e.g. 6XXXXXXXX"
                value={upgradePhone}
                onChange={(e) => setUpgradePhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--input-border)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
              {upgradeError && (
                <p style={{ margin: '6px 0 0 0', color: '#f87171', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <WarningIcon size={14} style={{ color: '#f87171' }} />
                  {upgradeError}
                </p>
              )}
            </form>
          </div>
        )}

        {upgradeStep === 'processing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px 0', textAlign: 'center' }}>
            <div style={{
              width: '44px',
              height: '44px',
              border: '3px solid rgba(255, 255, 255, 0.1)',
              borderTopColor: 'var(--primary-color)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: '700' }}>Waiting for Payment Authorization</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                A simulated push notification prompt has been sent to <strong>{upgradePhone}</strong>.
              </p>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.45 }}>
                Please check your phone, enter your Mobile Money PIN code, and approve the transaction.
              </p>
            </div>
          </div>
        )}

        {upgradeStep === 'success' && (
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
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: '800', color: '#10b981' }}>Subscription Activated!</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Your {upgradeTier === 'ultra' ? 'Ultra' : 'Pro'} features have been unlocked successfully.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Settings;