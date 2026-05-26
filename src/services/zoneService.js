import api from './api';

export const zoneService = {
    getAll: () => api.get('/zones'),
    getById: (id) => api.get(`/zones/${id}`),
    create: (data) => api.post('/zones', data),
    update: (id, data) => api.put(`/zones/${id}`, data),
    delete: (id) => api.delete(`/zones/${id}`),
};