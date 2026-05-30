import api from './api';

export const getStoreSettings = async () => {
  const response = await api.get('/settings/');
  return response.data;
};

export const updateStoreSettings = async (settingsData) => {
  const response = await api.put('/settings/', settingsData);
  return response.data;
};

export const getThemes = async () => {
  const response = await api.get('/settings/themes');
  return response.data;
};

export const applyTheme = async (themeId) => {
  const response = await api.post(`/settings/themes/${themeId}/apply`);
  return response.data;
};

export const getInspiration = async () => {
  const response = await api.get('/settings/inspiration');
  return response.data;
};