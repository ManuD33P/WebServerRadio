import { ServerSocket } from '../WebSocketServer';
import { User } from '../class/user';

interface MessageInfo {
  command: string;
  content: string;
  userId?: string;
  userName?: string;
}

export class ClientMessageHandler {
  private users: Map<string, User> = new Map();
  private server: ServerSocket;

  constructor() {
    this.server = ServerSocket.getInstance();
  }

  /**
   * Procesa los mensajes recibidos del servidor remoto
   */
  public handleIncomingMessage(message: string): void {
    try {
      if (!message) return;

      // Extraer el comando (primera parte antes de los dos puntos)
      const commandEnd = message.indexOf(':');
      if (commandEnd === -1) return;

      const command = message.substring(0, commandEnd);
      const content = message.substring(commandEnd + 1);

      // Enrutar al manejador correspondiente
      switch (command) {
        case 'PUBLIC':
          this.handlePublicMessage(content);
          break;
        case 'AVATAR':
          this.handleAvatarUpdate(content);
          break;
        case 'PERSMSG':
          this.handlePersonalMessage(content);
          break;
        case 'JOININFO':
          this.handleJoinInfo(content);
          break;
        case 'USERINFO':
          this.handleUserInfo(content);
          break;
        case 'UPDATE':
          this.handleUserUpdate(content);
          break;
        default:
          console.log('Comando no manejado:', command);
      }
    } catch (error) {
      console.error('Error procesando mensaje del servidor:', error);
    }
  }

  /**
   * Maneja los mensajes públicos
   */
  private handlePublicMessage(message: string): void {
    // Formato esperado: 12,11:RadioWebChat Manu> HOLA
    const parts = message.split(':');
    if (parts.length < 2) return;

    const content = parts.slice(1).join(':');
    
    // Verificar si el mensaje viene de RadioWebChat
    if (content.startsWith('RadioWebChat')) {
      // Extraer nombre de usuario y mensaje
      const match = content.match(/^RadioWebChat\s+(.+?)>\s*(.*)$/);
      if (match) {
        const [, userName, userMessage] = match;
        // Enviar al servidor en el nuevo formato: PUBLIC:4,4ManuHOLA
        const formattedMessage = `PUBLIC:${userName.length},${userMessage.length}:${userName}${userMessage}`;
        this.server.send(formattedMessage);
      }
    } else {
      // Si no es de RadioWebChat, reenviar el mensaje tal cual
      this.server.send(`PUBLIC:${message}`);
    }
  }

  /**
   * Maneja actualizaciones de avatar
   * Formato: userId,imageData
   */
  private handleAvatarUpdate(content: string): void {
    const [userId, imageData] = content.split(':');
    const user = this.users.get(userId);
    if (user) {
      user.avatar = imageData;
      this.broadcastUserUpdate(user);
    }
  }

  /**
   * Maneja actualizaciones de mensaje personal
   * Formato: userId,message
   */
  private handlePersonalMessage(content: string): void {
    const [userId, message] = content.split(':');
    const user = this.users.get(userId);
    if (user) {
      user.personalMessage = message;
      this.broadcastUserUpdate(user);
    }
  }

  /**
   * Maneja información de unión a la sala
   * Formato: userId,flags,etc...
   */
  private handleJoinInfo(content: string): void {
    const [userId, ...rest] = content.split(',');
    // Aquí puedes procesar la información de unión si es necesario
    console.log(`Usuario ${userId} se unió con flags:`, rest);
  }

  /**
   * Maneja información de usuario
   * Formato: userId,level,points,etc...
   */
  private handleUserInfo(content: string): void {
    const [userId, ...userData] = content.split(',');
    // Aquí puedes procesar la información del usuario si es necesario
    console.log(`Actualizando información de usuario ${userId}:`, userData);
  }

  /**
   * Maneja actualizaciones de estado de usuario
   * Formato: userId,status
   */
  private handleUserUpdate(content: string): void {
    const [userId, status] = content.split(',');
    const user = this.users.get(userId);
    if (user) {
      user.connected = status === '1';
      this.broadcastUserUpdate(user);
    }
  }

  /**
   * Envía la actualización de un usuario a todos los clientes conectados
   */
  private broadcastUserUpdate(user: User): void {
    this.server.broadcast(JSON.stringify({
      type: 'userUpdate',
      data: {
        userId: user.guid,
        name: user.name,
        avatar: user.avatar,
        personalMessage: user.personalMessage,
        connected: user.connected,
        lastSeen: user.lastSeen?.toISOString()
      }
    }));
  }
}

export default ClientMessageHandler;
