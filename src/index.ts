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

// Crear instancia del servidor WebSocket
const server = new WebSocketServer({
  port: PORT,
  hostname: HOST,
  development: process.env.NODE_ENV !== 'production'
});

// Cliente para conectarse al servidor externo
const externalWsClient = new WebSocketClient(`ws://186.137.241.231:46579`);

// Inicializar la lista de usuarios
const userList = UserList.getInstance();

// Conectar al servidor externo
externalWsClient.connect();

// Manejar mensajes del servidor externo
externalWsClient.onMessage((data: string) => {
  console.log('Mensaje recibido del servidor externo:', data);
  // Reenviar a todos los clientes conectados exactamente como se recibió
  server.broadcast(data);
});

// Configurar manejadores de eventos
server
  .onConnection((ws) => {
    console.log(`Cliente conectado: ${ws.data.id}`);
    // Asignar un ID temporal hasta que haga login
    ws.data.userId = `guest-${ws.data.id}`;
  })
  .onMessage((ws, message) => {
    const msg = message.toString();
    console.log(`Mensaje recibido de ${ws.data.id}:`, msg);

    // Manejar mensaje de LOGIN
    if (msg.startsWith('LOGIN:')) {
      const user = User.fromLoginMessage(msg);
      if (user) {
        // Asignar el ID del socket al usuario
        user.socketId = ws.data.id;
        
        // Guardar el usuario en la lista
        userList.addUser(user);
        
        // Actualizar el ID del usuario en el websocket
        ws.data.userId = user.name;
        
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
      const userId = ws.data.userId;
      console.log('Esta es la id del usuario: ', userId);
      // Verificar si el usuario ha hecho login
      if (userId && userId.startsWith('guest-')) {
        ws.send('ERROR:Debe hacer login primero');
        return;
      }
      
      // Obtener el texto después de PUBLIC:
      const messageText = msg.substring(7).trim();
      const user = userList.getUser(userId);
      // Reenviar al servidor externo en el formato requerido
      externalWsClient.send(`PUBLIC: ${user?.name} > ${messageText}`);
      
      console.log(`Mensaje público de ${userId}: ${messageText}`);
      return;
    }

    // No reenviar otros tipos de mensajes a los clientes
    console.log(`Mensaje no manejado de ${ws.data.userId || 'unknown'}:`, msg);
  })
  .onClose((ws) => {
    const userId = ws.data.userId;
    if (userId && !userId.startsWith('guest-')) {
      // Marcar usuario como desconectado
      const user = userList.getUser(userId);
      if (user) {
        user.connected = false;
        user.lastSeen = new Date();
        console.log(`Usuario desconectado: ${userId}`);
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