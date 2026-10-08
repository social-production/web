/**
 * Production server. Adapter-node does not forward WebSocket upgrades, and the
 * /api fetch proxy cannot carry a call signal. This attaches that one upgrade
 * path to the FastAPI process. Local `vite dev` proxies /messages itself.
 */
import http from 'node:http';
import https from 'node:https';
import { server } from './build/index.js';

const CALL_SOCKET_PATH = '/api/messages/calls/ws';
const target = (process.env.API_PROXY_TARGET || process.env.VITE_API_URL || '').replace(/\/$/, '');
const httpServer = server?.server;

if (httpServer && target) {
  const upstream = new URL(target);
  const transport = upstream.protocol === 'https:' ? https : http;

  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = (request.url || '/').split('?')[0];
    if (pathname !== CALL_SOCKET_PATH) {
      socket.destroy();
      return;
    }

    const headers = { ...request.headers, host: upstream.host };
    const proxyRequest = transport.request({
      protocol: upstream.protocol,
      hostname: upstream.hostname,
      port: upstream.port || (upstream.protocol === 'https:' ? 443 : 80),
      path: `/messages/calls/ws${(request.url || '').includes('?') ? request.url.slice(request.url.indexOf('?')) : ''}`,
      method: 'GET',
      headers,
    });

    proxyRequest.on('upgrade', (proxyResponse, proxySocket, proxyHead) => {
      const headerLines = Object.entries(proxyResponse.headers).flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map((item) => `${key}: ${item}`);
        }
        return value ? [`${key}: ${value}`] : [];
      });
      socket.write(
        `HTTP/1.1 ${proxyResponse.statusCode} ${proxyResponse.statusMessage}\r\n${headerLines.join('\r\n')}\r\n\r\n`
      );
      if (proxyHead?.length) {
        socket.write(proxyHead);
      }
      if (head?.length) {
        proxySocket.write(head);
      }
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
      proxySocket.on('error', () => socket.destroy());
      socket.on('error', () => proxySocket.destroy());
    });

    proxyRequest.on('error', () => socket.destroy());
    proxyRequest.end();
  });
}
