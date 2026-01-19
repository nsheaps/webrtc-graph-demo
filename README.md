# WebRTC Graph Demo

A **serverless** client-side demonstration application showcasing WebRTC peer-to-peer connections with multiple network topologies. No server required - uses [Trystero](https://github.com/dmotz/trystero) for peer discovery and signaling via Nostr relays.

## Features

This demo demonstrates four different WebRTC P2P connection scenarios:

### 1. Direct P2P Connection
Two clients connect directly to each other for peer-to-peer communication without any intermediaries.

### 2. Hub-and-Spoke Topology
Multiple clients connect to a central hub that relays messages between them. One client acts as the hub, and all communication flows through it.

### 3. Full Mesh Network
Every client connects to every other client, forming a complete graph where messages can be sent directly to any peer.

### 4. Complex Multi-Hop Graph
A sophisticated network topology where messages can be routed through multiple intermediate peers to reach distant clients, demonstrating multi-hop routing.

## Getting Started

### Prerequisites
- A modern web browser with WebRTC support (Chrome, Firefox, Edge, Safari)
- Node.js (v16 or higher) for local development only

### Quick Start (No Server Required!)

Simply open `public/index.html` in your browser, or deploy the `public/` folder to any static hosting service (GitHub Pages, Netlify, Vercel, etc.).

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/nsheaps/webrtc-graph-demo.git
cd webrtc-graph-demo
```

2. Install dependencies (for linting/testing only):
```bash
npm install
```

3. Start a local static server:
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
2. Enter the same room name and click "Join Room" in both tabs
3. Peers auto-connect when they join the same room
4. Send messages back and forth

#### Scenario 2: Hub-and-Spoke
1. Open the application in three or more tabs
2. Join the same room in all tabs
3. Select "2. Hub-and-Spoke" scenario
4. In one tab, click "Become Hub"
5. Send messages - the hub will relay them to all connected clients

#### Scenario 3: Full Mesh
1. Open the application in three or more tabs
2. Join the same room in all tabs
3. Select "3. Full Mesh" scenario
4. All peers auto-connect in the room
5. Every client can send messages directly to any other client

#### Scenario 4: Complex Graph
1. Open the application in four or more tabs
2. Join the same room in all tabs
3. Select "4. Complex Graph" scenario
4. Use the message target dropdown to route messages through intermediate peers
5. Messages will hop through multiple clients to reach the destination

## Features

- **Truly Serverless**: No backend server required - uses Nostr relays for signaling
- **Room-Based Connections**: Share a room name to connect with others
- **Real-time Network Visualization**: See your P2P network topology in real-time with an interactive graph
- **Multiple Connection Topologies**: Switch between different network patterns
- **Message Broadcasting**: Send messages to all connected peers
- **Direct Messaging**: Send private messages to specific peers
- **Multi-hop Routing**: Route messages through intermediate peers in complex topologies
- **URL-Based Room Sharing**: Room name is stored in URL hash for easy sharing
- **Responsive UI**: Clean, modern interface with real-time updates

## Technology Stack

- **WebRTC**: For peer-to-peer data channels
- **Trystero**: Serverless peer discovery and signaling via Nostr relays
- **Vanilla JavaScript**: Client-side logic (no framework dependencies)
- **HTML5 Canvas**: Network visualization

## Architecture

### Serverless Signaling
This demo uses [Trystero](https://github.com/dmotz/trystero) with the Nostr strategy for completely serverless peer discovery and WebRTC signaling. Trystero:
- Uses decentralized Nostr relays for signaling
- Handles WebRTC offer/answer exchange automatically
- Provides room-based peer discovery
- Requires no server infrastructure

### WebRTC Client
Each browser tab runs a WebRTC client that:
- Joins a room via Trystero for peer discovery
- Establishes peer connections automatically
- Creates data channels for messaging
- Handles different routing strategies based on the selected scenario
- Manages connection lifecycle and message relay

### Network Topologies

1. **Direct**: Simple 1-to-1 connection
2. **Hub-Spoke**: Star topology with central relay
3. **Mesh**: Complete graph with O(n²) connections
4. **Complex**: Arbitrary graph with routing through intermediaries

## Deployment

### GitHub Pages
The application automatically deploys to GitHub Pages on push to main. The site will be available at:
```
https://nsheaps.github.io/webrtc-graph-demo/
```

### Manual Deployment
Simply copy the `public/` folder to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any web server

No build step required - the files are ready to serve as-is.

## CI/CD Pipeline

This project includes a comprehensive CI/CD pipeline with the following components:

### Continuous Integration

**Linting:**
- ESLint for JavaScript code quality
- HTMLHint for HTML validation
- Stylelint for CSS standards

**Testing:**
- Jest for unit and integration tests
- Code coverage reporting
- Multiple Node.js version testing (16, 18, 20)

**Security:**
- npm audit for vulnerability scanning
- CodeQL static analysis
- Dependency review on pull requests

### Continuous Deployment

- Automatic deployment to GitHub Pages on main branch
- Static site hosting with client-side code only
- Workflow artifacts for build verification

### Available Scripts

```bash
# Serve locally
npm start               # Start local static server

# Run linters
npm run lint            # ESLint
npm run lint:fix        # Auto-fix ESLint issues
npm run lint:html       # HTMLHint
npm run lint:css        # Stylelint

# Run tests
npm test                # All tests with coverage
npm run test:watch      # Watch mode
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests only

# Run full validation
npm run validate        # Lint + test

# Security checks
npm run security:audit  # npm audit
npm run security:check  # Snyk test
```

### CI Workflows

1. **CI/CD Pipeline** (`deploy.yml`): Main pipeline running on push/PR
   - Linting
   - Testing with coverage
   - Security scanning
   - Build verification
   - GitHub Pages deployment (main branch only)

2. **Pull Request Checks** (`pr-checks.yml`): Additional PR validation
   - Full validation suite
   - Coverage reporting
   - Dependency review
   - Code quality checks

3. **Nightly Build** (`nightly.yml`): Scheduled maintenance
   - Multi-version Node.js testing
   - Dependency update detection
   - Full security audit

## License

MIT
