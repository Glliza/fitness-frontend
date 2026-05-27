import api from './api';

export const requestBuyService = {
    getAll: () => api.get('/purchase-requests'),
    create: (data) => api.post('/purchase-requests', data),
    updateStatus: (id, status) => api.patch(`/purchase-requests/${id}/status`, { status }),
};