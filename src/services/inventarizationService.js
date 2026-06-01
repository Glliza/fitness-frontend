import api from './api';

export const inventarizationService = {
    start: (zoneId) => api.post(`/inventarization/start?zoneId=${zoneId}`),
    startAll: () => api.post('/inventarization/start-all'),
    performStep: (invId, actualCount) => api.post(`/inventarization/step?invId=${invId}&actualCount=${actualCount}`),
    finish: (zoneId) => api.post(`/inventarization/finish?zoneId=${zoneId}`),
    finishAll: () => api.post('/inventarization/finish-all'),
    getHistory: (page = 0, size = 10) => api.get(`/inventarization/history?page=${page}&size=${size}`),
};