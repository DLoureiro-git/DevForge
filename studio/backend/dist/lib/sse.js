"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sseManager = void 0;
class SSEManager {
    connections = new Map();
    addConnection(projectId, res) {
        if (!this.connections.has(projectId)) {
            this.connections.set(projectId, []);
        }
        const connection = { projectId, res };
        this.connections.get(projectId).push(connection);
        // Setup SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        // Send initial connection message
        this.send(projectId, { type: 'connected', projectId });
        // Cleanup on disconnect
        res.on('close', () => {
            this.removeConnection(projectId, res);
        });
    }
    removeConnection(projectId, res) {
        const connections = this.connections.get(projectId);
        if (!connections)
            return;
        const index = connections.findIndex((conn) => conn.res === res);
        if (index !== -1) {
            connections.splice(index, 1);
        }
        if (connections.length === 0) {
            this.connections.delete(projectId);
        }
    }
    send(projectId, data) {
        const connections = this.connections.get(projectId);
        if (!connections)
            return;
        const message = `data: ${JSON.stringify(data)}\n\n`;
        for (const conn of connections) {
            try {
                conn.res.write(message);
            }
            catch (error) {
                console.error(`[SSE] Failed to send to ${projectId}:`, error);
                this.removeConnection(projectId, conn.res);
            }
        }
    }
    broadcast(data) {
        for (const projectId of this.connections.keys()) {
            this.send(projectId, data);
        }
    }
    getConnectionCount(projectId) {
        if (projectId) {
            return this.connections.get(projectId)?.length || 0;
        }
        return Array.from(this.connections.values()).reduce((sum, conns) => sum + conns.length, 0);
    }
}
exports.sseManager = new SSEManager();
