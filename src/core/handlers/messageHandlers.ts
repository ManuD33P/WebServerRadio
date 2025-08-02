import { User } from '../class/user';
import { UserList } from '../class/userList';
import { WebSocketClient } from '../WebSocketClient';

import type { CustomWebSocket } from '../WebSocketServer';

export type SocketWithId = CustomWebSocket;

export class MessageHandlers {
  private socketClients: Map<string, string>;
  private userList: UserList;
  
  constructor(socketClients: Map<string, string>) {
    this.socketClients = socketClients;
    this.userList = UserList.getInstance();
  }

  /**
   * Maneja los mensajes entrantes del WebSocket
   */
  public handleMessage(socket: SocketWithId, message: string): void {
    if (message.startsWith('LOGIN')) {
      this.handleLogin(socket, message);
    } else if (message.startsWith('PUBLIC')) {
      this.handlePublicMessage(socket, message);
    }
  }

  /**
   * Maneja los mensajes de login
   */
  private handleLogin(socket: SocketWithId, message: string): void {
    const user = User.fromLoginMessage(message);
    if (user) {
      console.log('Usuario autenticado:', user);
      this.socketClients.set(socket.id, user.name);
      
      // Notificar a todos los clientes
      const clientInstance = WebSocketClient.getInstance();
      clientInstance.send(`PUBLIC: ${user.name} se ha unido al chat`);
      
      // Enviar la lista de usuarios conectados al nuevo cliente
      this.sendConnectedUsersList(socket);
    }
  }

  /**
   * Maneja los mensajes públicos
   */
  /**
   * Envía la lista de usuarios conectados a un socket específico
   */
  private sendConnectedUsersList(socket: SocketWithId): void {
    const users = this.userList.getUsers();
    users.forEach(user => {
      // Enviar la información de cada usuario en formato USERINFO
      const userInfo = `USERINFO:${user.guid},${user.level || 0},${user.points || 0}:${user.name},${user.avatar},${user.personalMessage || ''}`;
      socket.send(userInfo);
    });
  }

  private handlePublicMessage(socket: SocketWithId, message: string): void {
    const text = message.split(':')[1];
    const name = this.socketClients.get(socket.id);
    
    if (name) {
      const clientInstance = WebSocketClient.getInstance();
      clientInstance.send(`PUBLIC: ${name}> ${text}`);
    }
  }
}

export default MessageHandlers;
