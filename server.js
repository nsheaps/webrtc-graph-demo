const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// WebSocket signaling server
const wss = new WebSocket.Server({ server });

const clients = new Map(); // Map of clientId -> WebSocket

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'register':
          clients.set(data.clientId, ws);
          ws.clientId = data.clientId;
          console.log(`Client registered: ${data.clientId}`);
          
          // Send updated client list to all clients
          broadcastClientList();
          break;
          
        case 'signal':
          // Forward signaling messages between peers
          const targetWs = clients.get(data.targetId);
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(JSON.stringify({
              type: 'signal',
              fromId: data.fromId,
              signal: data.signal
            }));
          }
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  ws.on('close', () => {
    if (ws.clientId) {
      console.log(`Client disconnected: ${ws.clientId}`);
      clients.delete(ws.clientId);
      broadcastClientList();
    }
  });
});

function broadcastClientList() {
  const clientList = Array.from(clients.keys());
  const message = JSON.stringify({
    type: 'clientList',
    clients: clientList
  });
  
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

console.log('WebSocket signaling server ready');
