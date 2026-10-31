import axios from 'axios';
import { API_URL } from '../config';

// Create an axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// Auth API calls
export const registerUser = async (userData) => {
  // Ensure payload contains all required fields before sending
  const required = ['name', 'email', 'password', 'role', 'aadhaarNumber', 'panNumber'];
  const missing = required.filter((field) => !userData?.[field]);
  if (missing.length) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

export const loginUser = async (userData) => {
  try {
    const response = await api.post('/auth/login', userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Unwraps the server's { success, message } error shape
const request = async (call) => {
  try {
    const response = await call();
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Server error');
  }
};

// Pins a document to IPFS through the backend and returns its CID.
// kind: "deed" | "transfer-deed" | "heir-document"
export const uploadDocument = async (file, kind) => {
  const form = new FormData();
  form.append('document', file);
  form.append('kind', kind);
  const res = await request(() =>
    api.post('/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  );
  return res.data.cid;
};

// Government approvals
export const getPendingOfficials = () => request(() => api.get('/auth/pending-officials'));
export const approveOfficial = (id) => request(() => api.put(`/auth/verify/${id}`));

// Inheritance claims
export const submitInheritanceClaim = (claim) => request(() => api.post('/inheritance/claims', claim));
export const getMyInheritanceClaims = () => request(() => api.get('/inheritance/claims/mine'));
export const getInheritanceClaims = (status) =>
  request(() => api.get('/inheritance/claims', { params: { status } }));
export const approveInheritanceClaim = (id, txHash) =>
  request(() => api.put(`/inheritance/claims/${id}/approve`, { txHash }));
export const rejectInheritanceClaim = (id, note) =>
  request(() => api.put(`/inheritance/claims/${id}/reject`, { note }));

export default api;