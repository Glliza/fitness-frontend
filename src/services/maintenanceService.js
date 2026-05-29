import api from './api';

export const maintenanceService = {
    getAllTO: (page = 0, size = 10, sortBy = 'plannedDate', sortDir = 'desc') => 
        api.get(`/maintenance/to?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),
    getAllRequests: (page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc') => 
        api.get(`/maintenance/repairs?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),
    createTO: (data) => api.post('/maintenance/to', data),
    createRepair: (data) => api.post('/maintenance/repairs', data),
    updateRequestStatus: (requestId, status, worker) => 
        api.patch(`/maintenance/repairs/${requestId}/status?status=${status}&worker=${worker}`),
    completeTO: (toId) => api.patch(`/maintenance/to/${toId}/complete`),
    getHistory: (equipmentId) => api.get(`/maintenance/history/${equipmentId}`),
    getNextTODate: (equipmentId) => api.get(`/maintenance/next-date/${equipmentId}`),
};