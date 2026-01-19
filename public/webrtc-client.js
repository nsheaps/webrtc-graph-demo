// WebRTC Client using Trystero for serverless signaling
// Uses Nostr relays for peer discovery and signaling - no server required

// Configuration constants
const ANNOUNCE_DELAY_MS = 1000; // Delay before announcing client ID to room

class WebRTCClient {
    constructor() {
        this.clientId = this.generateClientId();
        this.room = null;
        this.peers = new Map(); // peerId -> connection info
        this.dataChannels = new Map(); // peerId -> { sendChat, sendRelay, sendRoute }
        this.availablePeers = new Set();
        this.isHub = false;
        this.hubId = null;
        this.scenario = 'direct';
        this.roomName = null;

        this.onPeersUpdate = null;
        this.onConnectionsUpdate = null;
        this.onMessage = null;
        this.onStatusChange = null;

        // Trystero actions will be initialized when joining a room
        this.sendChat = null;
        this.sendRelay = null;
        this.sendRoute = null;
    }

    generateClientId() {
        return 'client-' + Math.random().toString(36).substring(2, 11);
    }

    async connect(roomName = 'webrtc-graph-demo-default') {
        this.roomName = roomName;

        try {
            // Dynamic import of Trystero from CDN
            const { joinRoom } = await import('https://esm.run/trystero');

            // Join room with unique app ID
            const config = {
                appId: 'webrtc-graph-demo-v1'
            };

            this.room = joinRoom(config, roomName);

            // Set up peer event handlers
            this.room.onPeerJoin(this.handlePeerJoin.bind(this));
            this.room.onPeerLeave(this.handlePeerLeave.bind(this));

            // Create actions for different message types
            [this.sendChat, this.receiveChat] = this.room.makeAction('chat');
            [this.sendRelay, this.receiveRelay] = this.room.makeAction('relay');
            [this.sendRoute, this.receiveRoute] = this.room.makeAction('route');
            [this.sendMeta, this.receiveMeta] = this.room.makeAction('meta');

            // Set up message receivers
            this.receiveChat((data, peerId) => this.handleChatMessage(peerId, data));
            this.receiveRelay((data, peerId) => this.handleRelayMessage(peerId, data));
            this.receiveRoute((data, peerId) => this.handleRouteMessage(peerId, data));
            this.receiveMeta((data, peerId) => this.handleMetaMessage(peerId, data));

            console.log('Connected to room:', roomName);

            if (this.onStatusChange) {
                this.onStatusChange('connected');
            }

            // Broadcast our client ID to the room after a short delay
            // to allow connections to stabilize
            setTimeout(() => {
                if (this.sendMeta) {
                    this.sendMeta({ type: 'announce', clientId: this.clientId });
                }
            }, ANNOUNCE_DELAY_MS);

        } catch (error) {
            console.error('Failed to connect:', error);
            if (this.onStatusChange) {
                this.onStatusChange('disconnected');
            }
        }
    }

    handlePeerJoin(peerId) {
        console.log('Peer joined:', peerId);
        this.availablePeers.add(peerId);
        this.peers.set(peerId, { connected: true });
        this.dataChannels.set(peerId, true); // Mark as connected

        if (this.onPeersUpdate) {
            this.onPeersUpdate(Array.from(this.availablePeers));
        }

        this.updateConnections();

        // Send our client ID to the new peer
        if (this.sendMeta) {
            this.sendMeta({ type: 'announce', clientId: this.clientId }, peerId);
        }
    }

    handlePeerLeave(peerId) {
        console.log('Peer left:', peerId);
        this.availablePeers.delete(peerId);
        this.peers.delete(peerId);
        this.dataChannels.delete(peerId);

        if (this.onPeersUpdate) {
            this.onPeersUpdate(Array.from(this.availablePeers));
        }

        this.updateConnections();
    }

    handleMetaMessage(peerId, data) {
        if (data.type === 'announce') {
            console.log('Peer announced:', data.clientId, 'from', peerId);
            // Store the friendly client ID mapping if needed
        }
    }

    handleChatMessage(fromId, message) {
        if (this.onMessage) {
            this.onMessage({
                from: fromId,
                text: message.text,
                broadcast: message.broadcast || false
            });
        }
    }

    handleRelayMessage(fromId, message) {
        if (this.isHub) {
            // Hub relays messages to all other connected peers
            this.availablePeers.forEach(peerId => {
                if (peerId !== fromId) {
                    this.sendChat({
                        text: message.text,
                        from: fromId,
                        broadcast: true
                    }, peerId);
                }
            });
        }
    }

    handleRouteMessage(fromId, message) {
        if (message.path && message.path.length > 0) {
            const nextHop = message.path[0];
            const newPath = message.path.slice(1);

            // Check if the message is for us (we're the next hop and no more hops left)
            if (nextHop === this.room?.selfId && newPath.length === 0) {
                // Message reached destination
                if (this.onMessage) {
                    this.onMessage({
                        from: message.originalFrom,
                        text: message.text,
                        broadcast: false,
                        routed: true
                    });
                }
            } else if (this.availablePeers.has(nextHop)) {
                // Forward to next hop
                this.sendRoute({
                    text: message.text,
                    originalFrom: message.originalFrom,
                    path: newPath
                }, nextHop);
            }
        }
    }

    // Connect to a specific peer - in Trystero, peers are automatically connected
    // This is kept for API compatibility
    async connectToPeer(peerId) {
        if (this.dataChannels.has(peerId)) {
            console.log('Already connected to', peerId);
            return;
        }

        console.log('Connection to peer', peerId, 'is automatic in Trystero');
        this.updateConnections();
    }

    sendMessage(text, targetId = null, path = null) {
        if (this.scenario === 'hub' && !this.isHub) {
            // Client in hub-spoke sends to hub
            if (this.hubId && this.availablePeers.has(this.hubId)) {
                this.sendRelay({
                    text: text,
                    from: this.room?.selfId
                }, this.hubId);
            }
        } else if (path && path.length > 0) {
            // Multi-hop routing
            const firstHop = path[0];
            if (this.availablePeers.has(firstHop)) {
                this.sendRoute({
                    text: text,
                    originalFrom: this.room?.selfId,
                    path: path
                }, firstHop);
            }
        } else if (targetId) {
            // Direct message to specific peer
            if (this.availablePeers.has(targetId)) {
                this.sendChat({
                    text: text,
                    from: this.room?.selfId,
                    broadcast: false
                }, targetId);
            }
        } else {
            // Broadcast to all connected peers
            this.sendChat({
                text: text,
                from: this.room?.selfId,
                broadcast: true
            });
        }
    }

    updateConnections() {
        if (this.onConnectionsUpdate) {
            const connections = Array.from(this.availablePeers);
            this.onConnectionsUpdate(connections);
        }
    }

    disconnectAll() {
        if (this.room) {
            this.room.leave();
            this.room = null;
        }
        this.peers.clear();
        this.dataChannels.clear();
        this.availablePeers.clear();
        this.isHub = false;
        this.hubId = null;
        this.updateConnections();

        if (this.onStatusChange) {
            this.onStatusChange('disconnected');
        }
    }

    setScenario(scenario) {
        this.scenario = scenario;
    }

    becomeHub() {
        this.isHub = true;
        console.log('This client is now a hub');
    }

    getConnectedPeers() {
        return Array.from(this.availablePeers);
    }

    // Get the room's self ID (Trystero peer ID)
    getSelfId() {
        return this.room?.selfId || this.clientId;
    }
}

// Export for ES modules
if (typeof window !== 'undefined') {
    window.WebRTCClient = WebRTCClient;
}
