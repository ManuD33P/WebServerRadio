import { WebSocket } from 'ws';
import {createLogin} from './class/loginSocket';

type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000; // 3 segundos
  private isConnected: boolean = false;
  private autoReconnect: boolean = true;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Conecta al servidor WebSocket
   */
  public connect(): void {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws = null;
    }

    console.log(`Conectando a ${this.url}...`);
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      console.log('Conexión WebSocket establecida');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectionHandlers.forEach(handler => handler());
      this.ws?.send(createLogin("RadioWeb","Radio Web by Manu16"));

    });

    this.ws.on('message', (data: string | Buffer) => {
      try {
        const newData = data.toString();
        if(newData.startsWith("ACK")){
          this.pingInterval = setInterval(() => {
            this.send("PING:");
          }, 13000);
          this.send("PING:")
        }
        
      } catch (error) {
        
      }
    });

    this.ws.on('close', () => {
      console.log('Conexión WebSocket cerrada');
      this.isConnected = false;
      this.handleReconnect();
      if(this.pingInterval){
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
    });

    this.ws.on('error', (error: Error) => {
      console.error('Error en la conexión WebSocket:', error);
      this.isConnected = false;
      this.handleReconnect();
    });
  }

  /**
   * Maneja la reconexión automática
   */
  private handleReconnect(): void {
    if (!this.autoReconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Número máximo de intentos de reconexión alcanzado');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * this.reconnectAttempts;
    
    console.log(`Reconectando en ${delay / 1000} segundos... (Intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Envía un mensaje al servidor WebSocket
   */
  public send(message: string): void {
    if (this.ws && this.isConnected) {
      this.ws.send(message);
    } else {
      console.error('No hay conexión WebSocket activa');
    }
  }

  /**
   * Cierra la conexión WebSocket
   */
  public close(): void {
    this.autoReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Registra un manejador para mensajes entrantes
   */
  public onMessage(handler: MessageHandler): void {
    this.messageHandlers.add(handler);
  }

  /**
   * Registra un manejador para eventos de conexión
   */
  public onConnection(handler: ConnectionHandler): void {
    this.connectionHandlers.add(handler);
  }

  /**
   * Elimina un manejador de mensajes
   */
  public offMessage(handler: MessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  /**
   * Elimina un manejador de conexión
   */
  public offConnection(handler: ConnectionHandler): void {
    this.connectionHandlers.delete(handler);
  }

  /**
   * Verifica si hay conexión activa
   */
  public get connected(): boolean {
    return this.isConnected;
  }
}
