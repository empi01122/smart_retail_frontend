import api from './api';

export const getDashboardSummary = async () => {
  const response = await api.get('/dashboard/summary');
  return response.data;
};

export const getTopProducts = async () => {
  const response = await api.get('/dashboard/top-products');
  return response.data;
};

export const getDashboardInsights = async () => {
  const response = await api.get('/dashboard/insights');
  return response.data;
};