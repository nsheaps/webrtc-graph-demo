class WebRTCClient {
    constructor() {
        this.clientId = this.generateClientId();
        this.ws = null;
        this.peers = new Map(); // peerId -> RTCPeerConnection
        this.dataChannels = new Map(); // peerId -> RTCDataChannel
        this.availablePeers = new Set();
        this.isHub = false;
        this.hubId = null;
        this.scenario = 'direct';
        
        this.onPeersUpdate = null;
        this.onConnectionsUpdate = null;
        this.onMessage = null;
        this.onStatusChange = null;
        
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        };
    }
    
    generateClientId() {
        return 'client-' + Math.random().toString(36).substr(2, 9);
    }
    
    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to signaling server');
            this.ws.send(JSON.stringify({
                type: 'register',
                clientId: this.clientId
            }));
            
            if (this.onStatusChange) {
                this.onStatusChange('connected');
            }
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleSignalingMessage(data);
        };
        
        this.ws.onclose = () => {
            console.log('Disconnected from signaling server');
            if (this.onStatusChange) {
                this.onStatusChange('disconnected');
            }
        };
    }
    
    handleSignalingMessage(data) {
        switch (data.type) {
            case 'clientList':
                this.availablePeers = new Set(data.clients.filter(id => id !== this.clientId));
                if (this.onPeersUpdate) {
                    this.onPeersUpdate(Array.from(this.availablePeers));
                }
                break;
                
            case 'signal':
                this.handleSignal(data.fromId, data.signal);
                break;
        }
    }
    
    async handleSignal(fromId, signal) {
        if (signal.type === 'offer') {
            await this.handleOffer(fromId, signal.offer);
        } else if (signal.type === 'answer') {
            await this.handleAnswer(fromId, signal.answer);
        } else if (signal.type === 'ice-candidate') {
            await this.handleIceCandidate(fromId, signal.candidate);
        }
    }
    
    async connectToPeer(peerId) {
        if (this.peers.has(peerId)) {
            console.log('Already connected to', peerId);
            return;
        }
        
        console.log('Initiating connection to', peerId);
        
        const pc = new RTCPeerConnection(this.iceServers);
        this.peers.set(peerId, pc);
        
        // Create data channel
        const dc = pc.createDataChannel('data');
        this.setupDataChannel(peerId, dc);
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignal(peerId, {
                    type: 'ice-candidate',
                    candidate: event.candidate
                });
            }
        };
        
        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        this.sendSignal(peerId, {
            type: 'offer',
            offer: offer
        });
        
        this.updateConnections();
    }
    
    async handleOffer(fromId, offer) {
        console.log('Received offer from', fromId);
        
        const pc = new RTCPeerConnection(this.iceServers);
        this.peers.set(fromId, pc);
        
        // Handle data channel
        pc.ondatachannel = (event) => {
            this.setupDataChannel(fromId, event.channel);
        };
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignal(fromId, {
                    type: 'ice-candidate',
                    candidate: event.candidate
                });
            }
        };
        
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        this.sendSignal(fromId, {
            type: 'answer',
            answer: answer
        });
        
        this.updateConnections();
    }
    
    async handleAnswer(fromId, answer) {
        console.log('Received answer from', fromId);
        const pc = this.peers.get(fromId);
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }
    
    async handleIceCandidate(fromId, candidate) {
        const pc = this.peers.get(fromId);
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }
    
    setupDataChannel(peerId, channel) {
        this.dataChannels.set(peerId, channel);
        
        channel.onopen = () => {
            console.log('Data channel opened with', peerId);
            this.updateConnections();
        };
        
        channel.onclose = () => {
            console.log('Data channel closed with', peerId);
            this.dataChannels.delete(peerId);
            this.updateConnections();
        };
        
        channel.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleDataMessage(peerId, message);
        };
    }
    
    handleDataMessage(fromId, message) {
        if (message.type === 'relay' && this.isHub) {
            // Hub relays messages
            this.relayMessage(fromId, message);
        } else if (message.type === 'route') {
            // Multi-hop routing
            this.routeMessage(fromId, message);
        } else if (message.type === 'chat') {
            // Direct message
            if (this.onMessage) {
                this.onMessage({
                    from: fromId,
                    text: message.text,
                    broadcast: message.broadcast || false
                });
            }
        }
    }
    
    relayMessage(fromId, message) {
        // Hub relays message to all other connected peers
        this.dataChannels.forEach((channel, peerId) => {
            if (peerId !== fromId && channel.readyState === 'open') {
                channel.send(JSON.stringify({
                    type: 'chat',
                    text: message.text,
                    from: fromId,
                    broadcast: true
                }));
            }
        });
    }
    
    routeMessage(fromId, message) {
        if (message.path && message.path.length > 0) {
            const nextHop = message.path[0];
            const newPath = message.path.slice(1);
            
            if (nextHop === this.clientId && newPath.length === 0) {
                // Message reached destination
                if (this.onMessage) {
                    this.onMessage({
                        from: message.originalFrom,
                        text: message.text,
                        broadcast: false,
                        routed: true
                    });
                }
            } else if (newPath.length > 0) {
                // Forward to next hop
                const channel = this.dataChannels.get(nextHop);
                if (channel && channel.readyState === 'open') {
                    channel.send(JSON.stringify({
                        type: 'route',
                        text: message.text,
                        originalFrom: message.originalFrom,
                        path: newPath
                    }));
                }
            }
        }
    }
    
    sendMessage(text, targetId = null, path = null) {
        if (this.scenario === 'hub' && !this.isHub) {
            // Client in hub-spoke sends to hub
            if (this.hubId && this.dataChannels.has(this.hubId)) {
                const channel = this.dataChannels.get(this.hubId);
                if (channel.readyState === 'open') {
                    channel.send(JSON.stringify({
                        type: 'relay',
                        text: text,
                        from: this.clientId
                    }));
                }
            }
        } else if (path && path.length > 0) {
            // Multi-hop routing
            const firstHop = path[0];
            const channel = this.dataChannels.get(firstHop);
            if (channel && channel.readyState === 'open') {
                channel.send(JSON.stringify({
                    type: 'route',
                    text: text,
                    originalFrom: this.clientId,
                    path: path
                }));
            }
        } else if (targetId) {
            // Direct message to specific peer
            const channel = this.dataChannels.get(targetId);
            if (channel && channel.readyState === 'open') {
                channel.send(JSON.stringify({
                    type: 'chat',
                    text: text,
                    from: this.clientId,
                    broadcast: false
                }));
            }
        } else {
            // Broadcast to all connected peers
            this.dataChannels.forEach((channel, peerId) => {
                if (channel.readyState === 'open') {
                    channel.send(JSON.stringify({
                        type: 'chat',
                        text: text,
                        from: this.clientId,
                        broadcast: true
                    }));
                }
            });
        }
    }
    
    sendSignal(targetId, signal) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'signal',
                targetId: targetId,
                fromId: this.clientId,
                signal: signal
            }));
        }
    }
    
    updateConnections() {
        if (this.onConnectionsUpdate) {
            const connections = Array.from(this.dataChannels.entries())
                .filter(([_, channel]) => channel.readyState === 'open')
                .map(([peerId, _]) => peerId);
            this.onConnectionsUpdate(connections);
        }
    }
    
    disconnectAll() {
        this.peers.forEach((pc, peerId) => {
            pc.close();
        });
        this.peers.clear();
        this.dataChannels.clear();
        this.isHub = false;
        this.hubId = null;
        this.updateConnections();
    }
    
    setScenario(scenario) {
        this.scenario = scenario;
    }
    
    becomeHub() {
        this.isHub = true;
        console.log('This client is now a hub');
    }
    
    getConnectedPeers() {
        return Array.from(this.dataChannels.entries())
            .filter(([_, channel]) => channel.readyState === 'open')
            .map(([peerId, _]) => peerId);
    }
}
