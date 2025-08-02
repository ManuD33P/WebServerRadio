import {WebSocketServer, WebSocket} from 'ws';
import { UserList } from './class/userList';
import { User } from './class/user';
import { generateGUID } from './class/loginSocket';
import { MessageHandlers } from './handlers/messageHandlers';

export interface CustomWebSocket extends WebSocket {
  id: string;
}

export class ServerSocket {
    private static instance: ServerSocket;
    private port: number = 3000;
    private server: WebSocketServer;
    private socketClients: Map<string, string> = new Map();
    private listUser : UserList = UserList.getInstance();
    private messageHandlers: MessageHandlers;
  
    private constructor(){        
        this.server = new WebSocketServer({ port: this.port });
        this.messageHandlers = new MessageHandlers(this.socketClients);
    }

    public static getInstance(): ServerSocket {
        if (!ServerSocket.instance) {
            ServerSocket.instance = new ServerSocket();
        }
        return ServerSocket.instance;
    }

    start(): void {
      this.server.on('listening', () => {
        console.log('Servidor WebSocket escuchando en el puerto', this.port);
      });
      this.server.on('error', (error) => {
        console.log('Error', error);
      });
      
      this.server.on('connection', (socket: CustomWebSocket) => {
        const id = generateGUID();
        socket.id = id;
        console.log('Cliente conectado', socket.id);

        socket.on('message', (message: Buffer) => {
          try {
            const newMessage = message.toString();
            this.messageHandlers.handleMessage(socket, newMessage);
          } catch (error) {
            console.error('Error al procesar mensaje:', error);
          }
        });

        socket.on('close', () => {
          console.log('Cliente desconectado', socket.id);
          this.socketClients.delete(socket.id);
        });

        socket.on('error', (error) => {
          console.error('Error en la conexión:', error);
        });
      });
    }

    send(message: string): void {
      this.server.clients.forEach((client) => {
        client.send(message);
      });
    }

    public sendToClient(clientId: string, message: string): void {
      const socket = this.server.clients as Set<CustomWebSocket>;
      for (const client of socket) {
        if (client.id === clientId) {
          client.send(message);
          break;
        }
      }
    }

    /**
     * Envía un mensaje a todos los clientes conectados
     * @param message Mensaje a enviar
     */
    public broadcast(message: string): void {
      const clients = this.server.clients as Set<CustomWebSocket>;
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
}
