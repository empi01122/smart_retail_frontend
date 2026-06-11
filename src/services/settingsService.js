import api from './api';

export const getStoreSettings = async (enterpriseId) => {
  const url = enterpriseId ? `/settings/?enterprise_id=${enterpriseId}` : '/settings/';
  const response = await api.get(url);
  return response.data;
};

export const updateStoreSettings = async (settingsData, enterpriseId) => {
  const url = enterpriseId ? `/settings/?enterprise_id=${enterpriseId}` : '/settings/';
  const response = await api.put(url, settingsData);
  return response.data;
};

export const getThemes = async () => {
  const response = await api.get('/settings/themes');
  return response.data;
};

export const applyTheme = async (themeId, enterpriseId) => {
  const url = enterpriseId ? `/settings/themes/${themeId}/apply?enterprise_id=${enterpriseId}` : `/settings/themes/${themeId}/apply`;
  const response = await api.post(url);
  return response.data;
};

export const getInspiration = async () => {
  const response = await api.get('/settings/inspiration');
  return response.data;
};

export const upgradeEnterpriseSubscription = async (enterpriseId, phone, tier) => {
  const url = `/enterprises/${enterpriseId}/upgrade`;
  const response = await api.post(url, { phone, tier });
  return response.data;
};