describe('Project Files', () => {
    const fs = require('fs');
    const path = require('path');

    test('webrtc-client.js should exist and use Trystero', () => {
        const clientPath = path.join(__dirname, '../../public/webrtc-client.js');
        expect(fs.existsSync(clientPath)).toBe(true);

        const content = fs.readFileSync(clientPath, 'utf8');
        expect(content).toContain('class WebRTCClient');
        expect(content).toContain('trystero');
        expect(content).toContain('joinRoom');
    });

    test('webrtc-client.js should NOT contain WebSocket signaling', () => {
        const clientPath = path.join(__dirname, '../../public/webrtc-client.js');
        const content = fs.readFileSync(clientPath, 'utf8');

        // Should not use direct WebSocket for signaling
        expect(content).not.toContain('new WebSocket(');
    });

    test('graph-visualizer.js should exist', () => {
        const vizPath = path.join(__dirname, '../../public/graph-visualizer.js');
        expect(fs.existsSync(vizPath)).toBe(true);

        const content = fs.readFileSync(vizPath, 'utf8');
        expect(content).toContain('class GraphVisualizer');
        expect(content).toContain('canvas');
    });

    test('app.js should exist and have room-based UI', () => {
        const appPath = path.join(__dirname, '../../public/app.js');
        expect(fs.existsSync(appPath)).toBe(true);

        const content = fs.readFileSync(appPath, 'utf8');
        expect(content).toContain('WebRTCClient');
        expect(content).toContain('GraphVisualizer');
        expect(content).toContain('joinRoom');
        expect(content).toContain('leaveRoom');
    });

    test('index.html should exist and include room controls', () => {
        const htmlPath = path.join(__dirname, '../../public/index.html');
        expect(fs.existsSync(htmlPath)).toBe(true);

        const content = fs.readFileSync(htmlPath, 'utf8');
        expect(content).toContain('WebRTC');
        expect(content).toContain('canvas');
        expect(content).toContain('roomInput');
        expect(content).toContain('joinRoomBtn');
        expect(content).toContain('Trystero');
    });

    test('styles.css should exist and include room styles', () => {
        const cssPath = path.join(__dirname, '../../public/styles.css');
        expect(fs.existsSync(cssPath)).toBe(true);

        const content = fs.readFileSync(cssPath, 'utf8');
        expect(content.length).toBeGreaterThan(100);
        expect(content).toContain('.room-section');
    });

    test('server.js should NOT exist (serverless app)', () => {
        const serverPath = path.join(__dirname, '../../server.js');
        expect(fs.existsSync(serverPath)).toBe(false);
    });
});

describe('WebRTCClient Class Structure', () => {
    const fs = require('fs');
    const path = require('path');

    let clientContent;

    beforeAll(() => {
        const clientPath = path.join(__dirname, '../../public/webrtc-client.js');
        clientContent = fs.readFileSync(clientPath, 'utf8');
    });

    test('should have generateClientId method', () => {
        expect(clientContent).toContain('generateClientId()');
    });

    test('should have connect method', () => {
        expect(clientContent).toContain('async connect(');
    });

    test('should have sendMessage method', () => {
        expect(clientContent).toContain('sendMessage(');
    });

    test('should have disconnectAll method', () => {
        expect(clientContent).toContain('disconnectAll()');
    });

    test('should have setScenario method', () => {
        expect(clientContent).toContain('setScenario(');
    });

    test('should have becomeHub method', () => {
        expect(clientContent).toContain('becomeHub()');
    });

    test('should have getConnectedPeers method', () => {
        expect(clientContent).toContain('getConnectedPeers()');
    });

    test('should handle chat messages', () => {
        expect(clientContent).toContain('handleChatMessage');
    });

    test('should handle relay messages for hub scenario', () => {
        expect(clientContent).toContain('handleRelayMessage');
    });

    test('should handle route messages for complex scenario', () => {
        expect(clientContent).toContain('handleRouteMessage');
    });
});
