import api from './api';
import axios from 'axios';

// Resolves the API base URL the same way api.js does (LAN-aware)
const getPublicBase = () => {
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


export const getAllSales = async () => {
  const response = await api.get('/sales/');
  return response.data;
};

export const recordSale = async (saleData) => {
  const response = await api.post('/sales/', saleData);
  return response.data;
};

export const releaseEscrow = async (saleId, pin) => {
  const response = await api.post(`/sales/${saleId}/release`, { pin });
  return response.data;
};

export const disputeTransaction = async (saleId) => {
  const response = await api.post(`/sales/${saleId}/dispute`);
  return response.data;
};

export const resolveDispute = async (saleId, action) => {
  const response = await api.post(`/sales/${saleId}/resolve-dispute`, { action });
  return response.data;
};

// Public endpoint — no auth token. Used by public catalog customer checkout.
export const placeOnlineOrder = async (saleData) => {
  const response = await axios.post(`${getPublicBase()}/sales/online`, saleData, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
};

// Authenticated — polls for unconfirmed online orders to show cashier notifications.
export const getPendingOnlineOrders = async () => {
  const response = await api.get('/sales/online/pending');
  return response.data;
};

// Authenticated — allows cashier to confirm/dispatch an online order.
export const confirmOnlineOrder = async (saleId) => {
  const response = await api.post(`/sales/${saleId}/confirm`);
  return response.data;
};

// Public endpoint — allows customer to dispute an online order from their receipt.
export const disputeTransactionPublic = async (saleId, phone, pin, reason, picture = null) => {
  const response = await axios.post(`${getPublicBase()}/sales/${saleId}/dispute/public`, { 
    customer_phone: phone, 
    delivery_pin: pin,
    dispute_reason: reason,
    dispute_picture: picture
  }, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
};

// Authenticated — allows cashier/store to submit a counter-complain response to a dispute.
export const submitStoreResponse = async (saleId, storeResponseText) => {
  const response = await api.post(`/sales/${saleId}/store-response`, { store_response: storeResponseText });
  return response.data;
};

// Public endpoint — tracks an online order status using receipt number and phone number.
export const trackOrderPublic = async (receiptNumber, phone) => {
  const response = await axios.get(`${getPublicBase()}/sales/public/track`, {
    params: { receipt_number: receiptNumber, customer_phone: phone }
  });
  return response.data;
};