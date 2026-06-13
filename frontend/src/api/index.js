import axios from 'axios';

const BASE = 'http://localhost:8080/api';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (d) => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
};

export const productsApi = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (d) => api.post('/products', d),
  update: (id, d) => api.put(`/products/${id}`, d),
  addComponent: (id, d) => api.post(`/products/${id}/bom/components`, d),
  removeComponent: (id, cid) => api.delete(`/products/${id}/bom/components/${cid}`),
  getGraph: () => api.get('/products/graph'),
  getProductGraph: (id, depth=5) => api.get(`/products/${id}/graph?depth=${depth}`),
  simulate: (id, qty) => api.get(`/products/${id}/simulate?qty=${qty}`),
};

export const salesApi = {
  getAll: () => api.get('/sales-orders'),
  getById: (id) => api.get(`/sales-orders/${id}`),
  create: (d) => api.post('/sales-orders', d),
  confirm: (id) => api.post(`/sales-orders/${id}/confirm`),
  deliver: (id, d) => api.post(`/sales-orders/${id}/deliver`, d),
  cancel: (id) => api.post(`/sales-orders/${id}/cancel`),
};

export const purchaseApi = {
  getAll: () => api.get('/purchase-orders'),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (d) => api.post('/purchase-orders', d),
  confirm: (id) => api.post(`/purchase-orders/${id}/confirm`),
  receive: (id, d) => api.post(`/purchase-orders/${id}/receive`, d),
  cancel: (id) => api.post(`/purchase-orders/${id}/cancel`),
};

export const mfgApi = {
  getAll: () => api.get('/manufacturing-orders'),
  getById: (id) => api.get(`/manufacturing-orders/${id}`),
  create: (d) => api.post('/manufacturing-orders', d),
  confirm: (id) => api.post(`/manufacturing-orders/${id}/confirm`),
  start: (id) => api.post(`/manufacturing-orders/${id}/start`),
  completeWorkOrder: (id, wid, d) => api.post(`/manufacturing-orders/${id}/work-orders/${wid}/complete`, d),
  produce: (id) => api.post(`/manufacturing-orders/${id}/produce`),
  cancel: (id) => api.post(`/manufacturing-orders/${id}/cancel`),
};

export const vendorsApi = {
  getAll: () => api.get('/vendors'),
  create: (d) => api.post('/vendors', d),
  update: (id, d) => api.put(`/vendors/${id}`, d),
  delete: (id) => api.delete(`/vendors/${id}`),
};

export const customersApi = {
  getAll: () => api.get('/customers'),
  create: (d) => api.post('/customers', d),
};

export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

export const auditApi = {
  getAll: (page=0, size=50) => api.get(`/audit-logs?page=${page}&size=${size}`),
  getRecordHistory: (type, id) => api.get(`/audit-logs/record/${type}/${id}`),
};

export const usersApi = {
  getAll: () => api.get('/users'),
};

export default api;
