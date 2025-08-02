console.log('=== Iniciando aplicación ===');
console.log('Directorio actual:', process.cwd());
console.log('Node.js version:', process.version);

import { createLogin } from './core/class/loginSocket';
import { WebSocketServer } from './core/WebSocketServer';
import { WebSocketClient } from './core/WebSocketClient';

console.log('Módulos importados correctamente');

// Configuración del servidor
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Crear instancia del servidor WebSocket
const server = new WebSocketServer({
  port: PORT,
  hostname: HOST,
  development: process.env.NODE_ENV !== 'production'
});

const webSocketClient = new WebSocketClient(`ws://186.137.241.231:46579`);
webSocketClient.connect();

// Configurar manejadores de eventos
server
  .onConnection((ws) => {
    console.log(`Cliente conectado: ${ws.data.id}`);
  })
  .onMessage((ws, message) => {
    console.log(`Mensaje recibido de ${ws.data.id}:`, message.toString());
    // Reenviar el mensaje a todos los clientes
    server.broadcast({
      from: ws.data.id,
      message: message.toString(),
      timestamp: new Date().toISOString()
    });
  })
  .onError((error) => {
    console.error('Error en el servidor WebSocket:', error);
  });

// Iniciar el servidor
server.start().then(() => {
  console.log(`Servidor WebSocket iniciado en ws://${HOST}:${PORT}`);
}).catch((error) => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});

// Manejo de cierre de la aplicación
process.on('SIGINT', () => {
  console.log('\nDeteniendo servidor...');
  server.stop();
  process.exit(0);
});