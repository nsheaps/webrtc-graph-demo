describe('Project Files', () => {
    const fs = require('fs');
    const path = require('path');

    test('server.js should exist and be valid', () => {
        const serverPath = path.join(__dirname, '../../server.js');
        expect(fs.existsSync(serverPath)).toBe(true);
        
        const content = fs.readFileSync(serverPath, 'utf8');
        expect(content).toContain('express');
        expect(content).toContain('WebSocket');
    });

    test('webrtc-client.js should exist', () => {
        const clientPath = path.join(__dirname, '../../public/webrtc-client.js');
        expect(fs.existsSync(clientPath)).toBe(true);
        
        const content = fs.readFileSync(clientPath, 'utf8');
        expect(content).toContain('class WebRTCClient');
        expect(content).toContain('RTCPeerConnection');
    });

    test('graph-visualizer.js should exist', () => {
        const vizPath = path.join(__dirname, '../../public/graph-visualizer.js');
        expect(fs.existsSync(vizPath)).toBe(true);
        
        const content = fs.readFileSync(vizPath, 'utf8');
        expect(content).toContain('class GraphVisualizer');
        expect(content).toContain('canvas');
    });

    test('app.js should exist', () => {
        const appPath = path.join(__dirname, '../../public/app.js');
        expect(fs.existsSync(appPath)).toBe(true);
        
        const content = fs.readFileSync(appPath, 'utf8');
        expect(content).toContain('WebRTCClient');
        expect(content).toContain('GraphVisualizer');
    });

    test('index.html should exist', () => {
        const htmlPath = path.join(__dirname, '../../public/index.html');
        expect(fs.existsSync(htmlPath)).toBe(true);
        
        const content = fs.readFileSync(htmlPath, 'utf8');
        expect(content).toContain('WebRTC');
        expect(content).toContain('canvas');
    });

    test('styles.css should exist', () => {
        const cssPath = path.join(__dirname, '../../public/styles.css');
        expect(fs.existsSync(cssPath)).toBe(true);
        
        const content = fs.readFileSync(cssPath, 'utf8');
        expect(content.length).toBeGreaterThan(100);
    });
});
