import api from './api';

export const requestBuyService = {
    getAll: (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc') => 
        api.get(`/purchase-requests?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),
    create: (data) => api.post('/purchase-requests', data),
    updateStatus: (id, status) => api.patch(`/purchase-requests/${id}/status`, { status }),
};