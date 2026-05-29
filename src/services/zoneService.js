import api from './api';

export const zoneService = {
    getAll: (page = 0, size = 10, sortBy = 'id', sortDir = 'asc') => 
        api.get(`/zones?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),
    getById: (id) => api.get(`/zones/${id}`),
    create: (data) => api.post('/zones', data),
    update: (id, data) => api.put(`/zones/${id}`, data),
    delete: (id) => api.delete(`/zones/${id}`),
};