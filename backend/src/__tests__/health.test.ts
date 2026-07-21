import request from 'supertest';
import { createApp } from '../app';

describe('Health API', () => {
    let app: ReturnType<typeof createApp>;

    beforeAll(() => {
        app = createApp();
    });

    describe('GET /api/health', () => {
        it('should return health status', async () => {
            const response = await request(app).get('/api/health').expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: 'Backend is healthy',
                service: 'ai-stock-screener-backend',
            });

            expect(response.body.timestamp).toBeDefined();
            expect(new Date(response.body.timestamp).getTime()).not.toBeNaN();
        });

        it('should return JSON content type', async () => {
            const response = await request(app).get('/api/health').expect(200);

            expect(response.headers['content-type']).toMatch(/application\/json/);
        });
    });
});