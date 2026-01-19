// Application state
let client = null;
let visualizer = null;
let currentScenario = 'direct';

// Scenario descriptions
const scenarioDescriptions = {
    'direct': 'All peers in the room can communicate directly. Messages are sent peer-to-peer.',
    'hub': 'Multiple clients connect to a central hub that relays messages between them. One client acts as the hub.',
    'mesh': 'All clients connect to every other client, forming a full mesh network. Messages can be sent directly to any peer.',
    'complex': 'A multi-hop network where messages can be routed through intermediate peers to reach distant clients.'
};

// DOM elements - Room section
const roomSectionEl = document.getElementById('roomSection');
const mainContentEl = document.getElementById('mainContent');
const roomInputEl = document.getElementById('roomInput');
const joinRoomBtnEl = document.getElementById('joinRoomBtn');
const leaveRoomBtnEl = document.getElementById('leaveRoomBtn');
const currentRoomEl = document.getElementById('currentRoom');

// DOM elements - Main app
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
const becomeHubBtn = document.getElementById('becomeHubBtn');
const sendBtn = document.getElementById('sendBtn');

// Check for room in URL hash
function getRoomFromUrl() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        return decodeURIComponent(hash);
    }
    return null;
}

// Set room in URL hash
function setRoomInUrl(roomName) {
    window.location.hash = encodeURIComponent(roomName);
}

// Initialize and join room
async function joinRoom(roomName) {
    if (!roomName || roomName.trim() === '') {
        addSystemMessage('Please enter a room name.');
        return;
    }

    roomName = roomName.trim();
    setRoomInUrl(roomName);

    // Show loading state
    joinRoomBtnEl.textContent = 'Connecting...';
    joinRoomBtnEl.disabled = true;

    // Create new client instance
    client = new WebRTCClient();
    visualizer = new GraphVisualizer('graphCanvas');

    // Set up event handlers
    client.onStatusChange = (status) => {
        statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        statusEl.className = 'status ' + status;

        if (status === 'connected') {
            // Show main content, hide room section
            roomSectionEl.style.display = 'none';
            mainContentEl.style.display = 'flex';
            currentRoomEl.textContent = roomName;
            clientIdEl.textContent = client.getSelfId().substring(0, 12) + '...';
            visualizer.setMyClient(client.getSelfId());

            addSystemMessage('Welcome to WebRTC Graph Demo!');
            addSystemMessage(`Connected to room: ${roomName}`);
            updateScenarioInstructions();
        }
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

    // Connect to the room
    try {
        await client.connect(roomName);
    } catch (error) {
        console.error('Failed to join room:', error);
        addSystemMessage('Failed to join room. Please try again.');
        joinRoomBtnEl.textContent = 'Join Room';
        joinRoomBtnEl.disabled = false;
    }
}

// Leave room
function leaveRoom() {
    if (client) {
        client.disconnectAll();
        client = null;
    }

    // Reset UI
    roomSectionEl.style.display = 'block';
    mainContentEl.style.display = 'none';
    joinRoomBtnEl.textContent = 'Join Room';
    joinRoomBtnEl.disabled = false;
    clientIdEl.textContent = 'Not connected';
    statusEl.textContent = 'Disconnected';
    statusEl.className = 'status disconnected';
    peerCountEl.textContent = '0';
    connectionCountEl.textContent = '0';
    peerListEl.innerHTML = '';
    connectionListEl.innerHTML = '';
    messageLogEl.innerHTML = '';
    currentRoomEl.textContent = '-';

    // Clear URL hash
    window.location.hash = '';
}

// Event listeners for room section
joinRoomBtnEl.addEventListener('click', () => {
    joinRoom(roomInputEl.value);
});

roomInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinRoom(roomInputEl.value);
    }
});

leaveRoomBtnEl.addEventListener('click', leaveRoom);

// Scenario selection
document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        currentScenario = btn.dataset.scenario;
        if (client) {
            client.setScenario(currentScenario);
        }

        currentScenarioEl.textContent = btn.textContent.trim();
        scenarioDescriptionEl.textContent = scenarioDescriptions[currentScenario];

        // Show/hide hub button
        becomeHubBtn.style.display = currentScenario === 'hub' ? 'block' : 'none';

        addSystemMessage(`Switched to scenario: ${btn.textContent.trim()}`);
        updateScenarioInstructions();
    });
});

// Become hub
becomeHubBtn.addEventListener('click', () => {
    if (client) {
        client.becomeHub();
        addSystemMessage('You are now a HUB. Other peers will relay messages through you.');
    }
});

// Send message
sendBtn.addEventListener('click', sendMessage);
messageInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    if (!client) return;

    const text = messageInputEl.value.trim();
    const target = messageTargetEl.value;

    if (!text) return;

    const PATH_SEPARATOR = ' -> ';
    if (currentScenario === 'complex' && target !== 'broadcast' && target.includes(PATH_SEPARATOR)) {
        // Parse path for complex routing
        const pathStr = target.split(PATH_SEPARATOR).map(s => s.trim());
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
        peerListEl.innerHTML = '<div style="padding: 8px; color: #9ca3af; font-size: 12px;">No other peers in this room yet</div>';
        return;
    }

    peers.forEach(peerId => {
        const div = document.createElement('div');
        div.className = 'peer-item';

        const span = document.createElement('span');
        span.textContent = peerId.substring(0, 15) + '...';
        span.title = peerId;

        const statusSpan = document.createElement('span');
        statusSpan.className = 'peer-status connected';
        statusSpan.textContent = 'Connected';

        div.appendChild(span);
        div.appendChild(statusSpan);
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
        div.textContent = peerId.substring(0, 20) + '...';
        div.title = peerId;
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
        const PATH_SEPARATOR = ' -> ';
        const option = document.createElement('option');
        option.value = connections[0] + PATH_SEPARATOR + connections[1];
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
    if (broadcast) prefix = 'Broadcast - ';
    if (routed) prefix = 'Routed - ';

    const fromDisplay = from === 'You' ? from : from.substring(0, 12) + '...';
    header.textContent = prefix + fromDisplay;

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
        instructions = 'Open in 2+ tabs with the same room name. Peers auto-connect when they join the same room.';
        break;
    case 'hub':
        instructions = 'Open in 3+ tabs. Click "Become Hub" in one tab. Hub will relay messages to all other peers.';
        break;
    case 'mesh':
        instructions = 'Open in 3+ tabs. All peers auto-connect in a full mesh. Send messages to any peer.';
        break;
    case 'complex':
        instructions = 'Open in 4+ tabs. Use "Route via N hops" to send messages through intermediate peers.';
        break;
    }

    addSystemMessage(instructions);
}

function updateGraph() {
    if (!client || !visualizer) return;

    // Collect all clients and connections
    const selfId = client.getSelfId();
    const allClients = new Set([selfId]);
    client.getConnectedPeers().forEach(peer => allClients.add(peer));

    const connections = [];
    client.getConnectedPeers().forEach(peerId => {
        connections.push({
            from: selfId,
            to: peerId
        });
    });

    visualizer.updateGraph(Array.from(allClients), connections, selfId);
}

// Check if there's a room in the URL on page load
const urlRoom = getRoomFromUrl();
if (urlRoom) {
    roomInputEl.value = urlRoom;
    // Auto-join after a short delay to let the page fully load
    setTimeout(() => joinRoom(urlRoom), 100);
}
