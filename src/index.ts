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

// Inicializar la lista de usuarios
const userList = UserList.getInstance();

// Mapa para mantener el seguimiento de los clientes autenticados
const authenticatedClients = new Map<string, string>(); // socketId -> username

// Conectar al servidor externo
externalWsClient.connect();

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
    // Inicializar datos del cliente
    ws.data.authenticated = false;
    ws.data.username = null;
  })
  .onMessage((ws, message) => {
    const msg = message.toString();
    console.log(`Mensaje recibido de ${ws.data.id}:`, msg);

    // Manejar mensaje de LOGIN
    if (msg.startsWith('LOGIN:')) {
      try {
        const user = User.fromLoginMessage(msg);
        if (user) {
          // Asignar el ID de socket al usuario
          user.socketId = ws.data.id;
          
          // Guardar el usuario en la lista
          userList.addUser(user);
          
          // Registrar el cliente como autenticado
          ws.data.authenticated = true;
          ws.data.username = user.name;
          authenticatedClients.set(ws.data.id, user.name);
          
          console.log(`Usuario autenticado: ${user.name} (socket: ${ws.data.id})`);
          
          // Enviar confirmación al cliente
          ws.send(`LOGIN_OK:${user.name}`);
        } else {
          ws.send('ERROR:Formato de login inválido');
        }
      } catch (error) {
        console.error('Error en el proceso de login:', error);
        ws.send('ERROR:Error en el proceso de autenticación');
      }
      return;
    }

    // Manejar mensaje PUBLIC
    if (msg.startsWith('PUBLIC:')) {
      // Verificar si el usuario está autenticado
      if (!ws.data.authenticated || !ws.data.username) {
        ws.send('ERROR:Debe hacer login primero');
        return;
      }
      
      try {
        // Obtener el texto después de PUBLIC:
        const messageText = msg.substring(7).trim();
        const username = ws.data.username;
        
        // Reenviar al servidor externo en el formato requerido
        externalWsClient.send(`PUBLIC: ${username} > ${messageText}`);
        
        console.log(`Mensaje público de ${username}: ${messageText}`);
      } catch (error) {
        console.error('Error al procesar mensaje público:', error);
        ws.send('ERROR:Error al enviar el mensaje');
      }
      return;
    }

    // No reenviar otros tipos de mensajes a los clientes
    console.log(`Mensaje no manejado de ${ws.data.userId || 'unknown'}:`, msg);
  })
  .onClose((ws) => {
    // Limpiar el registro del cliente autenticado si existe
    if (ws.data.authenticated && ws.data.username) {
      const username = ws.data.username;
      authenticatedClients.delete(ws.data.id);
      
      // Actualizar el estado del usuario
      const user = userList.getUser(username);
      if (user) {
        user.connected = false;
        user.lastSeen = new Date();
        console.log(`Usuario desconectado: ${username}`);
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