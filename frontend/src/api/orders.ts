import apiClient from './client';

export const ordersApi = {
    list: async (params?: any) => {
        const { data } = await apiClient.get('/orders/', { params });
        return data;
    },
    getOne: async (id: string) => {
        const { data } = await apiClient.get(`/orders/${id}`);
        return data;
    },
    create: async (orderData: any) => {
        const { data } = await apiClient.post('/orders/', orderData);
        return data;
    },
    dispatch: async (id: string) => {
        const { data } = await apiClient.post(`/orders/${id}/dispatch`);
        return data;
    },
    optimizeRoutes: async (req: any) => {
        const { data } = await apiClient.post('/orders/optimize-routes', req);
        return data;
    },
};
