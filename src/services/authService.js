import api from './api';

export const authService = {
    login: async (login, password) => {
        console.log('Sending login request:', { login, password });
        try {
            const response = await api.post('/auth/login', { login, password });
            console.log('Login response status:', response.status);
            console.log('Login response data:', response.data);
            console.log('Token received:', response.data.token);
            return response;
        } catch (error) {
            console.error('Login error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw error;
        }
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};