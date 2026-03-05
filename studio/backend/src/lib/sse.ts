// DevForge V2 — Server-Sent Events Manager
import type { Response } from 'express';

interface SSEConnection {
  projectId: string;
  res: Response;
}

class SSEManager {
  private connections: Map<string, SSEConnection[]> = new Map();

  addConnection(projectId: string, res: Response): void {
    if (!this.connections.has(projectId)) {
      this.connections.set(projectId, []);
    }

    const connection: SSEConnection = { projectId, res };
    this.connections.get(projectId)!.push(connection);

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

  removeConnection(projectId: string, res: Response): void {
    const connections = this.connections.get(projectId);
    if (!connections) return;

    const index = connections.findIndex((conn) => conn.res === res);
    if (index !== -1) {
      connections.splice(index, 1);
    }

    if (connections.length === 0) {
      this.connections.delete(projectId);
    }
  }

  send(projectId: string, data: unknown): void {
    const connections = this.connections.get(projectId);
    if (!connections) return;

    const message = `data: ${JSON.stringify(data)}\n\n`;

    for (const conn of connections) {
      try {
        conn.res.write(message);
      } catch (error) {
        console.error(`[SSE] Failed to send to ${projectId}:`, error);
        this.removeConnection(projectId, conn.res);
      }
    }
  }

  broadcast(data: unknown): void {
    for (const projectId of this.connections.keys()) {
      this.send(projectId, data);
    }
  }

  getConnectionCount(projectId?: string): number {
    if (projectId) {
      return this.connections.get(projectId)?.length || 0;
    }
    return Array.from(this.connections.values()).reduce(
      (sum, conns) => sum + conns.length,
      0
    );
  }
}

export const sseManager = new SSEManager();
