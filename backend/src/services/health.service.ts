export const healthService = {
    getHealthStatus: () => ({
        success: true,
        message: 'Backend is healthy',
        service: 'ai-stock-screener-backend',
        timestamp: new Date().toISOString(),
    }),
};
