import api from './api';

export const equipmentService = {
    getAll: (page = 0, size = 10, sortBy = 'id', sortDir = 'asc', zoneId = null, status = null) => {
        let url = `/equipment?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`;
        if (zoneId) url += `&zoneId=${zoneId}`;
        if (status) url += `&status=${encodeURIComponent(status)}`;
        return api.get(url);
    },
    getAllList: () => api.get('/equipment?page=0&size=1000'),  // ДОБАВЬТЕ ЭТОТ МЕТОД
    getById: (id) => api.get(`/equipment/${id}`),
    create: (data) => api.post('/equipment', data),
    update: (id, data) => api.put(`/equipment/${id}`, data),
    delete: (id) => api.delete(`/equipment/${id}`),
    changeStatus: (id, status) => api.patch(`/equipment/${id}/status?status=${status}`),
};