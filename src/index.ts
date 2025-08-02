console.log('=== Iniciando aplicación ===');
console.log('Directorio actual:', process.cwd());
console.log('Node.js version:', process.version);

import { WebSocketServer } from './core/WebSocketServer';
import { WebSocketClient } from './core/WebSocketClient';
import { User } from './core/class/user';
import { UserList } from './core/class/userList';

console.log('Módulos importados correctamente');

// Configuración del servidor
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Obtener la instancia única del servidor WebSocket
const server = WebSocketServer.getInstance({
  port: PORT,
  hostname: HOST,
  development: process.env.NODE_ENV !== 'production'
});

// Cliente para conectarse al servidor externo
const externalWsClient = new WebSocketClient(`ws://186.137.241.231:46579`);

// Mapa de usuarios conectados: socketId -> userName
const connectedUsers = new Map<string, string>();

// Inicializar la lista de usuarios
const userList = UserList.getInstance();


// Manejar mensajes del servidor externo
externalWsClient.onMessage((data: string) => {
  try {
    console.log('Mensaje recibido del servidor externo:', data);
    // Reenviar a todos los clientes conectados exactamente como se recibió
    server.broadcast(data);
  } catch (error) {
    console.error('Error al procesar mensaje del servidor externo:', error);
  }
});

// Configurar manejadores de eventos
server
  .onConnection((ws) => {
    console.log(`Cliente conectado: ${ws.data.id}`);
    // Inicializar como invitado
    connectedUsers.set(ws.data.id, 'guest');
  })
  .onMessage((ws, message) => {
    const msg = message.toString();
    console.log(`Mensaje recibido de ${ws.data.id}:`, msg);

    // Manejar mensaje de LOGIN
    if (msg.startsWith('LOGIN:')) {
      const user = User.fromLoginMessage(msg);
      if (user) {
        // Guardar el usuario en la lista
        userList.addUser(user);
        
        // Registrar el usuario conectado
        connectedUsers.set(ws.data.id, user.name);
        
        console.log(`Usuario autenticado: ${user.name}`);
        
        // Enviar confirmación al cliente
        ws.send(`LOGIN_OK:${user.name}`);
      } else {
        ws.send('ERROR:Formato de login inválido');
      }
      return;
    }

    // Manejar mensaje PUBLIC
    if (msg.startsWith('PUBLIC:')) {
      const userName = connectedUsers.get(ws.data.id);
      if (!userName || userName === 'guest') {
        ws.send('ERROR:Debe hacer login primero');
        return;
      }
      
      // Obtener el texto después de PUBLIC:
      const messageText = msg.substring(7).trim();
      
      // Reenviar al servidor externo
      externalWsClient.send(`PUBLIC: ${userName} > ${messageText}`);
      console.log(`Mensaje público de ${userName}: ${messageText}`);
      return;
    }

    // No reenviar otros tipos de mensajes a los clientes
    console.log(`Mensaje no manejado de ${ws.data.userId || 'unknown'}:`, msg);
  })
  .onClose((ws) => {
    // Limpiar el registro del usuario
    const userName = connectedUsers.get(ws.data.id);
    if (userName) {
      connectedUsers.delete(ws.data.id);
      
      // Actualizar el estado del usuario
      const user = userList.getUser(userName);
      if (user) {
        user.connected = false;
        user.lastSeen = new Date();
        console.log(`Usuario desconectado: ${userName}`);
      }
    }
  })
  .onError((error) => {
    console.error('Error en el servidor WebSocket:', error);
  });

// Iniciar el servidor
server.start().then(() => {
  console.log(`Servidor WebSocket iniciado en ws://${HOST}:${PORT}`);
  
  // Conectar al servidor externo después de iniciar el servidor
  externalWsClient.connect();
  
}).catch((error) => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});

// Manejo de cierre de la aplicación
process.on('SIGINT', () => {
  console.log('\nDeteniendo servidor...');
  // Cerrar conexión con el servidor externo
  externalWsClient.close();
  // Detener el servidor
  server.stop();
  process.exit(0);
});