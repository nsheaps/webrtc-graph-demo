const request = require('supertest');
const express = require('express');
const path = require('path');

describe('Server Integration Tests', () => {
    let app;

    beforeEach(() => {
        // Create Express app
        app = express();
        app.use(express.static(path.join(__dirname, '../../public')));
    });

    describe('Static File Serving', () => {
        test('should serve index.html', async () => {
            const response = await request(app).get('/index.html');
            
            expect(response.status).toBe(200);
            expect(response.type).toMatch(/html/);
            expect(response.text).toContain('WebRTC');
        });

        test('should serve styles.css', async () => {
            const response = await request(app).get('/styles.css');
            
            expect(response.status).toBe(200);
            expect(response.type).toMatch(/css/);
        });

        test('should serve app.js', async () => {
            const response = await request(app).get('/app.js');
            
            expect(response.status).toBe(200);
            expect(response.type).toMatch(/javascript/);
        });

        test('should serve webrtc-client.js', async () => {
            const response = await request(app).get('/webrtc-client.js');
            
            expect(response.status).toBe(200);
            expect(response.type).toMatch(/javascript/);
        });

        test('should serve graph-visualizer.js', async () => {
            const response = await request(app).get('/graph-visualizer.js');
            
            expect(response.status).toBe(200);
            expect(response.type).toMatch(/javascript/);
        });

        test('should return 404 for non-existent files', async () => {
            const response = await request(app).get('/nonexistent.js');
            
            expect(response.status).toBe(404);
        });
    });

    describe('Root Path', () => {
        test('should serve index.html at root', async () => {
            const response = await request(app).get('/');
            
            expect(response.status).toBe(200);
            expect(response.type).toMatch(/html/);
        });
    });
});
