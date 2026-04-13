import apiClient from './client';

export const authApi = {
    login: async (credentials: any) => {
        const { data } = await apiClient.post('/auth/login', credentials);
        return data;
    },
    register: async (tenantData: any) => {
        const { data } = await apiClient.post('/auth/register', tenantData);
        return data;
    },
};
