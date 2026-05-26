import api from './api';

export const consumablesService = {
    getAll: () => api.get('/consumables'),
    addIncome: (consumableId, zoneId, amount) => 
        api.post(`/consumables/income?consumableId=${consumableId}&zoneId=${zoneId}&amount=${amount}`),
    addExpense: (consumableId, zoneId, amount) => 
        api.post(`/consumables/expense?consumableId=${consumableId}&zoneId=${zoneId}&amount=${amount}`),
    getBalance: (consumableId, zoneId) => 
        api.get(`/consumables/balance?consumableId=${consumableId}&zoneId=${zoneId}`),
    exportReport: (format) => 
        api.get(`/consumables/export?format=${format}`, { responseType: 'blob' }),
};