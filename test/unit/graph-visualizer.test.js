describe('Public Assets', () => {
    const fs = require('fs');
    const path = require('path');

    test('all required JavaScript files exist', () => {
        const files = ['app.js', 'webrtc-client.js', 'graph-visualizer.js'];
        
        files.forEach(file => {
            const filePath = path.join(__dirname, '../../public', file);
            expect(fs.existsSync(filePath)).toBe(true);
        });
    });

    test('HTML file exists and contains required elements', () => {
        const htmlPath = path.join(__dirname, '../../public/index.html');
        const content = fs.readFileSync(htmlPath, 'utf8');
        
        expect(content).toContain('<!DOCTYPE html>');
        expect(content).toContain('<canvas');
        expect(content).toContain('WebRTC');
    });

    test('CSS file exists and has styling', () => {
        const cssPath = path.join(__dirname, '../../public/styles.css');
        const content = fs.readFileSync(cssPath, 'utf8');
        
        expect(content).toContain('.container');
        expect(content.length).toBeGreaterThan(1000);
    });
});
