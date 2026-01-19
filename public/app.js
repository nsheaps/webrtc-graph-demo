// Application state
const client = new WebRTCClient();
const visualizer = new GraphVisualizer('graphCanvas');
let currentScenario = 'direct';

// Scenario descriptions
const scenarioDescriptions = {
    'direct': 'Two clients connect directly to each other for peer-to-peer communication.',
    'hub': 'Multiple clients connect to a central hub that relays messages between them. One client acts as the hub.',
    'mesh': 'All clients connect to every other client, forming a full mesh network. Messages can be sent directly to any peer.',
    'complex': 'A multi-hop network where messages can be routed through intermediate peers to reach distant clients.'
};

// DOM elements
const clientIdEl = document.getElementById('clientId');
const statusEl = document.getElementById('status');
const peerCountEl = document.getElementById('peerCount');
const connectionCountEl = document.getElementById('connectionCount');
const peerListEl = document.getElementById('peerList');
const connectionListEl = document.getElementById('connectionList');
const messageLogEl = document.getElementById('messageLog');
const messageInputEl = document.getElementById('messageInput');
const messageTargetEl = document.getElementById('messageTarget');
const currentScenarioEl = document.getElementById('currentScenario');
const scenarioDescriptionEl = document.getElementById('scenarioDescription');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const becomeHubBtn = document.getElementById('becomeHubBtn');
const sendBtn = document.getElementById('sendBtn');

// Initialize client
client.onStatusChange = (status) => {
    statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    statusEl.className = 'status ' + status;
};

client.onPeersUpdate = (peers) => {
    peerCountEl.textContent = peers.length;
    updatePeerList(peers);
    updateGraph();
};

client.onConnectionsUpdate = (connections) => {
    connectionCountEl.textContent = connections.length;
    updateConnectionList(connections);
    updateMessageTargets(connections);
    updateGraph();
};

client.onMessage = (message) => {
    addMessage(message.from, message.text, 'received', message.broadcast, message.routed);
};

// Set client ID and connect
clientIdEl.textContent = client.clientId;
visualizer.setMyClient(client.clientId);
client.connect();

// Scenario selection
document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentScenario = btn.dataset.scenario;
        client.setScenario(currentScenario);
        
        currentScenarioEl.textContent = btn.textContent.trim();
        scenarioDescriptionEl.textContent = scenarioDescriptions[currentScenario];
        
        // Show/hide hub button
        becomeHubBtn.style.display = currentScenario === 'hub' ? 'block' : 'none';
        
        addSystemMessage(`Switched to scenario: ${btn.textContent.trim()}`);
        updateScenarioInstructions();
    });
});

// Connect button - behavior depends on scenario
connectBtn.addEventListener('click', () => {
    const peers = Array.from(client.availablePeers);
    
    if (peers.length === 0) {
        addSystemMessage('No peers available. Open this page in another tab or browser.');
        return;
    }
    
    switch (currentScenario) {
        case 'direct':
            // Connect to first available peer
            if (peers.length > 0 && client.getConnectedPeers().length === 0) {
                client.connectToPeer(peers[0]);
                addSystemMessage(`Connecting to ${peers[0]} (Direct P2P)`);
            }
            break;
            
        case 'hub':
            if (client.isHub) {
                // Hub connects to all
                peers.forEach(peerId => {
                    if (!client.peers.has(peerId)) {
                        client.connectToPeer(peerId);
                    }
                });
                addSystemMessage('Hub connecting to all available peers');
            } else {
                // Client connects to hub - find a hub or connect to first peer
                peers.forEach(peerId => {
                    if (!client.peers.has(peerId)) {
                        client.connectToPeer(peerId);
                        client.hubId = peerId;
                        addSystemMessage(`Connecting to hub: ${peerId}`);
                    }
                });
            }
            break;
            
        case 'mesh':
            // Connect to all peers
            peers.forEach(peerId => {
                if (!client.peers.has(peerId)) {
                    client.connectToPeer(peerId);
                }
            });
            addSystemMessage('Connecting to all peers (Full Mesh)');
            break;
            
        case 'complex':
            // Selectively connect to create a graph
            peers.forEach(peerId => {
                if (!client.peers.has(peerId)) {
                    client.connectToPeer(peerId);
                }
            });
            addSystemMessage('Building complex graph topology');
            break;
    }
});

// Disconnect all
disconnectBtn.addEventListener('click', () => {
    client.disconnectAll();
    addSystemMessage('Disconnected from all peers');
});

// Become hub
becomeHubBtn.addEventListener('click', () => {
    client.becomeHub();
    addSystemMessage('You are now a HUB. Connect to peers to relay messages.');
});

// Send message
sendBtn.addEventListener('click', sendMessage);
messageInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const text = messageInputEl.value.trim();
    const target = messageTargetEl.value;
    
    if (!text) return;
    
    if (currentScenario === 'complex' && target !== 'broadcast' && target.includes('→')) {
        // Parse path for complex routing
        const pathStr = target.split('→').map(s => s.trim());
        client.sendMessage(text, null, pathStr);
        addMessage('You', text, 'sent', false, true);
    } else if (target === 'broadcast') {
        client.sendMessage(text);
        addMessage('You', text, 'sent', true);
    } else {
        client.sendMessage(text, target);
        addMessage('You', text, 'sent', false);
    }
    
    messageInputEl.value = '';
}

function updatePeerList(peers) {
    peerListEl.innerHTML = '';
    
    if (peers.length === 0) {
        peerListEl.innerHTML = '<div style="padding: 8px; color: #9ca3af; font-size: 12px;">No other clients online</div>';
        return;
    }
    
    peers.forEach(peerId => {
        const isConnected = client.peers.has(peerId);
        const div = document.createElement('div');
        div.className = 'peer-item';
        
        const span = document.createElement('span');
        span.textContent = peerId.substring(0, 15) + '...';
        
        const btn = document.createElement('button');
        btn.textContent = isConnected ? 'Connected' : 'Connect';
        btn.disabled = isConnected;
        btn.onclick = () => {
            client.connectToPeer(peerId);
            addSystemMessage(`Connecting to ${peerId}`);
        };
        
        div.appendChild(span);
        div.appendChild(btn);
        peerListEl.appendChild(div);
    });
}

function updateConnectionList(connections) {
    connectionListEl.innerHTML = '';
    
    if (connections.length === 0) {
        connectionListEl.innerHTML = '<div style="padding: 8px; color: #9ca3af; font-size: 12px;">No active connections</div>';
        return;
    }
    
    connections.forEach(peerId => {
        const div = document.createElement('div');
        div.className = 'connection-item';
        div.textContent = '🔗 ' + peerId.substring(0, 20) + '...';
        connectionListEl.appendChild(div);
    });
}

function updateMessageTargets(connections) {
    const currentValue = messageTargetEl.value;
    messageTargetEl.innerHTML = '<option value="broadcast">Broadcast to All</option>';
    
    connections.forEach(peerId => {
        const option = document.createElement('option');
        option.value = peerId;
        option.textContent = `DM: ${peerId.substring(0, 15)}...`;
        messageTargetEl.appendChild(option);
    });
    
    // Add complex routing options for scenario 4
    if (currentScenario === 'complex' && connections.length >= 2) {
        const option = document.createElement('option');
        option.value = connections[0] + ' → ' + connections[1];
        option.textContent = `Route via ${connections.length} hops`;
        messageTargetEl.appendChild(option);
    }
    
    // Restore previous selection if still valid
    const options = Array.from(messageTargetEl.options);
    if (options.some(opt => opt.value === currentValue)) {
        messageTargetEl.value = currentValue;
    }
}

function addMessage(from, text, type, broadcast = false, routed = false) {
    const div = document.createElement('div');
    div.className = `message ${type}`;
    
    const header = document.createElement('div');
    header.className = 'message-header';
    
    let prefix = '';
    if (broadcast) prefix = '📢 Broadcast - ';
    if (routed) prefix = '🔀 Routed - ';
    
    header.textContent = prefix + from;
    
    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString();
    header.appendChild(time);
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = text;
    
    div.appendChild(header);
    div.appendChild(textDiv);
    messageLogEl.appendChild(div);
    messageLogEl.scrollTop = messageLogEl.scrollHeight;
}

function addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'message system';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = text;
    
    div.appendChild(textDiv);
    messageLogEl.appendChild(div);
    messageLogEl.scrollTop = messageLogEl.scrollHeight;
}

function updateScenarioInstructions() {
    let instructions = '';
    
    switch (currentScenario) {
        case 'direct':
            instructions = 'Open in 2 tabs. Click "Connect to Peer" in one tab to establish a direct P2P connection.';
            break;
        case 'hub':
            instructions = 'Open in 3+ tabs. Click "Become Hub" in one tab, then "Connect to Peer" in others. Hub relays messages.';
            break;
        case 'mesh':
            instructions = 'Open in 3+ tabs. Click "Connect to Peer" in each tab to form a full mesh. All clients interconnected.';
            break;
        case 'complex':
            instructions = 'Open in 4+ tabs. Connect peers selectively to create multi-hop routes. Messages can jump through 3+ peers.';
            break;
    }
    
    addSystemMessage(instructions);
}

function updateGraph() {
    // Collect all clients and connections
    const allClients = new Set([client.clientId]);
    client.availablePeers.forEach(peer => allClients.add(peer));
    
    const connections = [];
    client.getConnectedPeers().forEach(peerId => {
        connections.push({
            from: client.clientId,
            to: peerId
        });
    });
    
    visualizer.updateGraph(Array.from(allClients), connections, client.clientId);
}

// Initial instructions
addSystemMessage('Welcome to WebRTC Graph Demo!');
updateScenarioInstructions();
