import api from './api';

export const equipmentService = {
    getAll: () => api.get('/equipment'),
    getById: (id) => api.get(`/equipment/${id}`),
    create: (data) => api.post('/equipment', data),
    update: (id, data) => api.put(`/equipment/${id}`, data),
    delete: (id) => api.delete(`/equipment/${id}`),
    changeStatus: (id, status) => api.patch(`/equipment/${id}/status?status=${status}`),
    getByZone: (zoneId) => api.get(`/equipment/zone/${zoneId}`),
    getByStatus: (status) => api.get(`/equipment/status/${status}`),
};