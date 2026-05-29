import api from './api';

export const maintenanceService = {
    getAllTO: () => api.get('/maintenance/to'),
    getAllRequests: () => api.get('/maintenance/repairs'),
    createTO: (data) => api.post('/maintenance/to', data),
    createRepair: (data) => api.post('/maintenance/repairs', data),
    updateRequestStatus: (requestId, status, worker) => 
        api.patch(`/maintenance/repairs/${requestId}/status?status=${status}&worker=${worker}`),
    completeTO: (toId) => api.patch(`/maintenance/to/${toId}/complete`),
    getHistory: (equipmentId) => api.get(`/maintenance/history/${equipmentId}`),
    getNextTODate: (equipmentId) => api.get(`/maintenance/next-date/${equipmentId}`),
};