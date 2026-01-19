# WebRTC Graph Demo

A client-side demonstration application showcasing WebRTC peer-to-peer connections with multiple network topologies.

## Features

This demo demonstrates four different WebRTC P2P connection scenarios:

### 1. Direct P2P Connection
Two clients connect directly to each other for peer-to-peer communication without any intermediaries.

### 2. Hub-and-Spoke Topology
Multiple clients connect to a central hub that relays messages between them. One client acts as the hub, and all communication flows through it.

### 3. Full Mesh Network
Every client connects to every other client, forming a complete graph where messages can be sent directly to any peer.

### 4. Complex Multi-Hop Graph
A sophisticated network topology where messages can be routed through multiple intermediate peers to reach distant clients, demonstrating up to 3-hop routing.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- A modern web browser with WebRTC support (Chrome, Firefox, Edge, Safari)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nsheaps/webrtc-graph-demo.git
cd webrtc-graph-demo
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Testing Scenarios

#### Scenario 1: Direct P2P
1. Open the application in two browser tabs
2. Select "1. Direct P2P" scenario
3. Click "Connect to Peer" in one tab
4. Send messages back and forth

#### Scenario 2: Hub-and-Spoke
1. Open the application in three or more tabs
2. Select "2. Hub-and-Spoke" scenario in all tabs
3. In one tab, click "Become Hub"
4. In the other tabs, click "Connect to Peer" to connect to the hub
5. Send messages - the hub will relay them to all connected clients

#### Scenario 3: Full Mesh
1. Open the application in three or more tabs
2. Select "3. Full Mesh" scenario in all tabs
3. Click "Connect to Peer" in each tab to connect to all others
4. Every client can send messages directly to any other client

#### Scenario 4: Complex Graph
1. Open the application in four or more tabs
2. Select "4. Complex Graph" scenario in all tabs
3. Connect peers selectively to create a multi-hop topology
4. Use the message target dropdown to route messages through intermediate peers
5. Messages will hop through up to 3 clients to reach the destination

## Features

- **Real-time Network Visualization**: See your P2P network topology in real-time with an interactive graph
- **Multiple Connection Topologies**: Switch between different network patterns
- **Message Broadcasting**: Send messages to all connected peers
- **Direct Messaging**: Send private messages to specific peers
- **Multi-hop Routing**: Route messages through intermediate peers in complex topologies
- **Connection Status**: Monitor active connections and available peers
- **Responsive UI**: Clean, modern interface with real-time updates

## Technology Stack

- **WebRTC**: For peer-to-peer data channels
- **WebSocket**: For signaling server coordination
- **Express**: Web server
- **Vanilla JavaScript**: Client-side logic
- **HTML5 Canvas**: Network visualization

## Architecture

### Signaling Server
A WebSocket-based signaling server coordinates the WebRTC connection establishment between peers. It:
- Registers clients and maintains a client list
- Forwards ICE candidates and SDP offers/answers between peers
- Broadcasts the updated client list to all connected clients

### WebRTC Client
Each browser tab runs a WebRTC client that:
- Establishes peer connections using RTCPeerConnection
- Creates data channels for messaging
- Handles different routing strategies based on the selected scenario
- Manages connection lifecycle and message relay

### Network Topologies

1. **Direct**: Simple 1-to-1 connection
2. **Hub-Spoke**: Star topology with central relay
3. **Mesh**: Complete graph with O(n²) connections
4. **Complex**: Arbitrary graph with routing through intermediaries

## License

MIT