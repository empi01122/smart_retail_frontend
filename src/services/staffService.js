import api from './api';

export const getStaff = async () => {
  const response = await api.get('/users/staff');
  return response.data;
};

export const syncStaff = async (staffData) => {
  const response = await api.post('/users/staff', staffData);
  return response.data;
};

export const deleteStaff = async (id) => {
  const response = await api.delete(`/users/staff/${id}`);
  return response.data;
};