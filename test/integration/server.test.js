/**
 * Integration tests for the serverless WebRTC demo
 * Tests static file structure and content validity
 */
describe('Static Site Structure Tests', () => {
    const fs = require('fs');
    const path = require('path');

    const publicDir = path.join(__dirname, '../../public');

    describe('Static Files Exist', () => {
        test('index.html exists', () => {
            const filePath = path.join(publicDir, 'index.html');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('styles.css exists', () => {
            const filePath = path.join(publicDir, 'styles.css');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('app.js exists', () => {
            const filePath = path.join(publicDir, 'app.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('webrtc-client.js exists', () => {
            const filePath = path.join(publicDir, 'webrtc-client.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('graph-visualizer.js exists', () => {
            const filePath = path.join(publicDir, 'graph-visualizer.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });
    });

    describe('HTML Structure', () => {
        let htmlContent;

        beforeAll(() => {
            const filePath = path.join(publicDir, 'index.html');
            htmlContent = fs.readFileSync(filePath, 'utf8');
        });

        test('has proper DOCTYPE', () => {
            expect(htmlContent).toMatch(/<!DOCTYPE html>/i);
        });

        test('includes CSS link', () => {
            expect(htmlContent).toContain('href="styles.css"');
        });

        test('includes all JavaScript files', () => {
            expect(htmlContent).toContain('src="webrtc-client.js"');
            expect(htmlContent).toContain('src="graph-visualizer.js"');
            expect(htmlContent).toContain('src="app.js"');
        });

        test('has room join section', () => {
            expect(htmlContent).toContain('id="roomSection"');
            expect(htmlContent).toContain('id="roomInput"');
            expect(htmlContent).toContain('id="joinRoomBtn"');
        });

        test('has scenario buttons', () => {
            expect(htmlContent).toContain('data-scenario="direct"');
            expect(htmlContent).toContain('data-scenario="hub"');
            expect(htmlContent).toContain('data-scenario="mesh"');
            expect(htmlContent).toContain('data-scenario="complex"');
        });

        test('has canvas for graph visualization', () => {
            expect(htmlContent).toContain('id="graphCanvas"');
        });

        test('has messaging section', () => {
            expect(htmlContent).toContain('id="messageInput"');
            expect(htmlContent).toContain('id="sendBtn"');
            expect(htmlContent).toContain('id="messageLog"');
        });
    });

    describe('JavaScript Structure', () => {
        test('webrtc-client.js uses Trystero for signaling', () => {
            const filePath = path.join(publicDir, 'webrtc-client.js');
            const content = fs.readFileSync(filePath, 'utf8');

            expect(content).toContain('import');
            expect(content).toContain('trystero');
            expect(content).toContain('joinRoom');
            expect(content).toContain('makeAction');
        });

        test('app.js handles room join/leave', () => {
            const filePath = path.join(publicDir, 'app.js');
            const content = fs.readFileSync(filePath, 'utf8');

            expect(content).toContain('joinRoom');
            expect(content).toContain('leaveRoom');
            expect(content).toContain('getRoomFromUrl');
        });
    });

    describe('Serverless Architecture', () => {
        test('no server.js file exists', () => {
            const serverPath = path.join(__dirname, '../../server.js');
            expect(fs.existsSync(serverPath)).toBe(false);
        });

        test('package.json does not have express dependency', () => {
            const packagePath = path.join(__dirname, '../../package.json');
            const packageContent = fs.readFileSync(packagePath, 'utf8');
            const packageJson = JSON.parse(packageContent);

            expect(packageJson.dependencies?.express).toBeUndefined();
            expect(packageJson.dependencies?.ws).toBeUndefined();
        });

        test('package.json has serve for local testing', () => {
            const packagePath = path.join(__dirname, '../../package.json');
            const packageContent = fs.readFileSync(packagePath, 'utf8');
            const packageJson = JSON.parse(packageContent);

            expect(packageJson.devDependencies?.serve).toBeDefined();
        });
    });
});
