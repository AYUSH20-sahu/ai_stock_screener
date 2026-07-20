export interface HealthQueryPayload {
    include?: string;
}

export const validateHealthQuery = (query: Record<string, unknown>) => {
    const { include } = query;

    if (include !== undefined && typeof include !== 'string') {
        const error = new Error('Query parameter "include" must be a string');
        (error as Error & { statusCode?: number }).statusCode = 400;
        throw error;
    }
};
