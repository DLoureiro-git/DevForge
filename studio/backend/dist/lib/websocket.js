/**
 * WEBSOCKET SERVER — Real-time streaming para Feature Pipeline
 *
 * Eventos:
 * - PHASE_CHANGED: Quando muda de fase (PM → ARCHITECT → DEV_TEAM → QA → FIX_LOOP → DEPLOY)
 * - LOG_APPENDED: Quando há novo log
 * - FEATURE_UPDATED: Quando há update em status/progress/qaScore
 */
import { WebSocketServer, WebSocket } from 'ws';
import { verify } from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'devforge-secret-key';
const clients = new Map();
/**
 * Inicializar WebSocket Server
 */
export function initWebSocketServer(server) {
    const wss = new WebSocketServer({ server, path: '/ws' });
    wss.on('connection', (ws, req) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const token = url.searchParams.get('token');
        if (!token) {
            ws.close(1008, 'Authentication required');
            return;
        }
        // Validar JWT
        let userId;
        try {
            const decoded = verify(token, JWT_SECRET);
            userId = decoded.userId;
        }
        catch (error) {
            ws.close(1008, 'Invalid token');
            return;
        }
        // Gerar client ID
        const clientId = `${userId}-${Date.now()}`;
        // Registar client
        clients.set(clientId, {
            ws,
            userId,
        });
        console.log(`[WebSocket] Client connected: ${clientId}`);
        // Handle messages (subscribe to specific feature)
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                if (message.type === 'SUBSCRIBE_FEATURE') {
                    const client = clients.get(clientId);
                    if (client) {
                        client.featureId = message.featureId;
                        client.projectId = message.projectId;
                        console.log(`[WebSocket] Client ${clientId} subscribed to feature ${message.featureId}`);
                    }
                }
                if (message.type === 'UNSUBSCRIBE_FEATURE') {
                    const client = clients.get(clientId);
                    if (client) {
                        client.featureId = undefined;
                        client.projectId = undefined;
                        console.log(`[WebSocket] Client ${clientId} unsubscribed`);
                    }
                }
            }
            catch (error) {
                console.error('[WebSocket] Error parsing message:', error);
            }
        });
        // Handle disconnect
        ws.on('close', () => {
            clients.delete(clientId);
            console.log(`[WebSocket] Client disconnected: ${clientId}`);
        });
        // Send welcome message
        ws.send(JSON.stringify({
            type: 'CONNECTED',
            data: { clientId },
        }));
    });
    console.log('[WebSocket] Server initialized on /ws');
    return wss;
}
/**
 * Broadcast event to all clients subscribed to a feature
 */
export function broadcastToFeature(featureId, event) {
    let count = 0;
    for (const [clientId, client] of clients.entries()) {
        if (client.featureId === featureId && client.ws.readyState === WebSocket.OPEN) {
            try {
                client.ws.send(JSON.stringify(event));
                count++;
            }
            catch (error) {
                console.error(`[WebSocket] Error sending to ${clientId}:`, error);
            }
        }
    }
    if (count > 0) {
        console.log(`[WebSocket] Broadcasted ${event.type} to ${count} client(s) for feature ${featureId}`);
    }
}
/**
 * Broadcast event to all clients in a project
 */
export function broadcastToProject(projectId, event) {
    let count = 0;
    for (const [clientId, client] of clients.entries()) {
        if (client.projectId === projectId && client.ws.readyState === WebSocket.OPEN) {
            try {
                client.ws.send(JSON.stringify(event));
                count++;
            }
            catch (error) {
                console.error(`[WebSocket] Error sending to ${clientId}:`, error);
            }
        }
    }
    if (count > 0) {
        console.log(`[WebSocket] Broadcasted ${event.type} to ${count} client(s) for project ${projectId}`);
    }
}
/**
 * Get active connections count
 */
export function getActiveConnections() {
    return clients.size;
}
