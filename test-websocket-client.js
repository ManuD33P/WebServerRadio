const WebSocket = require('ws');
const fs = require('fs');
const https = require('https');

// Configuración del cliente
const options = {
  hostname: '192.168.0.133',
  port: 3000,
  path: '/',
  rejectUnauthorized: false, // Ignorar errores de certificado autofirmado
  headers: {
    'Origin': 'http://localhost',
    'Sec-WebSocket-Protocol': 'chat'
  }
};

console.log('=== Iniciando cliente de prueba WebSocket ===');
console.log('Conectando a:', `wss://${options.hostname}:${options.port}${options.path}`);

const ws = new WebSocket(`https://${options.hostname}:${options.port}${options.path}`, {
  rejectUnauthorized: false,
  headers: {
    'Origin': 'http://localhost',
    'Sec-WebSocket-Protocol': 'chat'
  }
});

ws.on('open', function open() {
  console.log('✅ Conexión WebSocket establecida');
});

ws.on('message', function incoming(data) {
  console.log('Mensaje recibido del servidor:', data.toString());
});

ws.on('close', function close(code, reason) {
  console.log(`❌ Conexión cerrada - Código: ${code}, Razón: ${reason}`);
});

ws.on('error', function error(err) {
  console.error('❌ Error en la conexión WebSocket:', err);
});

// Manejar la terminación del proceso
process.on('SIGINT', () => {
  console.log('Cerrando cliente...');
  ws.close();
  process.exit(0);
});
