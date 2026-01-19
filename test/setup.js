// Test setup file
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.WebSocket = class WebSocket {
    constructor(url) {
        this.url = url;
        this.readyState = 0;
    }
    send() {}
    close() {}
};

global.RTCPeerConnection = class RTCPeerConnection {
    constructor() {
        this.localDescription = null;
        this.remoteDescription = null;
    }
    createDataChannel() {
        return {
            readyState: 'open',
            send: jest.fn(),
            close: jest.fn()
        };
    }
    async createOffer() {
        return { type: 'offer', sdp: 'mock-sdp' };
    }
    async createAnswer() {
        return { type: 'answer', sdp: 'mock-sdp' };
    }
    async setLocalDescription(desc) {
        this.localDescription = desc;
    }
    async setRemoteDescription(desc) {
        this.remoteDescription = desc;
    }
    async addIceCandidate() {}
    close() {}
};

global.RTCSessionDescription = class RTCSessionDescription {
    constructor(init) {
        this.type = init.type;
        this.sdp = init.sdp;
    }
};

global.RTCIceCandidate = class RTCIceCandidate {
    constructor(init) {
        Object.assign(this, init);
    }
};
