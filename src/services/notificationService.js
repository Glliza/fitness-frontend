import api from './api';

export const notificationService = {
    getUnread: (adminId) => api.get(`/notifications/unread/${adminId}`),
    getAll: (adminId) => api.get(`/notifications/${adminId}`),
    markAsRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
    markAllAsRead: (adminId) => api.patch(`/notifications/read-all/${adminId}`),
};