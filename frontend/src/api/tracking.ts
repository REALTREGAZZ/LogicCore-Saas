import apiClient from './client';

export const trackingApi = {
    getLivePositions: async () => {
        const { data } = await apiClient.get('/tracking/drivers/live');
        return data;
    },
    postGps: async (gpsData: any) => {
        const { data } = await apiClient.post('/tracking/gps', gpsData);
        return data;
    },
};
