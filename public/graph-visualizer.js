class GraphVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodes = new Map(); // clientId -> {x, y, vx, vy}
        this.edges = new Set(); // Set of "id1-id2" strings
        this.myClientId = null;
        this.animationFrame = null;
        
        // Physics parameters
        this.repulsionForce = 5000;
        this.attractionForce = 0.01;
        this.damping = 0.8;
        this.centerForce = 0.002;
        
        // Display settings
        this.labelMaxLength = 10;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }
    
    setMyClient(clientId) {
        this.myClientId = clientId;
    }
    
    updateGraph(allClients, connections, myClientId) {
        this.myClientId = myClientId;
        
        // Add new nodes
        allClients.forEach(clientId => {
            if (!this.nodes.has(clientId)) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 50;
                this.nodes.set(clientId, {
                    x: this.centerX + Math.cos(angle) * radius,
                    y: this.centerY + Math.sin(angle) * radius,
                    vx: 0,
                    vy: 0
                });
            }
        });
        
        // Remove disconnected nodes
        const allClientsSet = new Set(allClients);
        this.nodes.forEach((_, clientId) => {
            if (!allClientsSet.has(clientId)) {
                this.nodes.delete(clientId);
            }
        });
        
        // Update edges
        this.edges.clear();
        connections.forEach(conn => {
            const edge = [conn.from, conn.to].sort().join('-');
            this.edges.add(edge);
        });
        
        // Start animation if not running
        if (!this.animationFrame) {
            this.animate();
        }
    }
    
    animate() {
        this.updatePhysics();
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    updatePhysics() {
        const nodes = Array.from(this.nodes.entries());
        
        // Apply forces
        nodes.forEach(([id1, node1]) => {
            let fx = 0;
            let fy = 0;
            
            // Repulsion from other nodes
            nodes.forEach(([id2, node2]) => {
                if (id1 !== id2) {
                    const dx = node1.x - node2.x;
                    const dy = node1.y - node2.y;
                    const distSq = dx * dx + dy * dy + 1;
                    const force = this.repulsionForce / distSq;
                    fx += (dx / Math.sqrt(distSq)) * force;
                    fy += (dy / Math.sqrt(distSq)) * force;
                }
            });
            
            // Attraction along edges
            this.edges.forEach(edge => {
                const [a, b] = edge.split('-');
                let otherId = null;
                if (a === id1) otherId = b;
                if (b === id1) otherId = a;
                
                if (otherId && this.nodes.has(otherId)) {
                    const other = this.nodes.get(otherId);
                    const dx = other.x - node1.x;
                    const dy = other.y - node1.y;
                    fx += dx * this.attractionForce;
                    fy += dy * this.attractionForce;
                }
            });
            
            // Center force
            const dx = this.centerX - node1.x;
            const dy = this.centerY - node1.y;
            fx += dx * this.centerForce;
            fy += dy * this.centerForce;
            
            // Update velocity and position
            node1.vx = (node1.vx + fx) * this.damping;
            node1.vy = (node1.vy + fy) * this.damping;
            node1.x += node1.vx;
            node1.y += node1.vy;
            
            // Keep within bounds
            const margin = 30;
            node1.x = Math.max(margin, Math.min(this.canvas.width - margin, node1.x));
            node1.y = Math.max(margin, Math.min(this.canvas.height - margin, node1.y));
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw edges
        this.ctx.strokeStyle = '#cbd5e1';
        this.ctx.lineWidth = 2;
        this.edges.forEach(edge => {
            const [id1, id2] = edge.split('-');
            const node1 = this.nodes.get(id1);
            const node2 = this.nodes.get(id2);
            
            if (node1 && node2) {
                this.ctx.beginPath();
                this.ctx.moveTo(node1.x, node1.y);
                this.ctx.lineTo(node2.x, node2.y);
                this.ctx.stroke();
            }
        });
        
        // Draw nodes
        this.nodes.forEach((node, clientId) => {
            const isMe = clientId === this.myClientId;
            const radius = isMe ? 20 : 15;
            
            // Node circle
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = isMe ? '#667eea' : '#10b981';
            this.ctx.fill();
            this.ctx.strokeStyle = isMe ? '#5568d3' : '#059669';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Label
            this.ctx.fillStyle = '#1f2937';
            this.ctx.font = '11px sans-serif';
            this.ctx.textAlign = 'center';
            const label = clientId.substring(0, this.labelMaxLength);
            this.ctx.fillText(label, node.x, node.y + radius + 14);
        });
    }
    
    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
}
