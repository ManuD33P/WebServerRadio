import { WebSocket } from 'ws';
import { ServerSocket } from './WebSocketServer';
import { createLogin } from './class/loginSocket';
import { ClientMessageHandler } from './handlers/clientMessageHandler';

export class WebSocketClient{
  private static instance: WebSocketClient;
  private client: WebSocket | null = null;
  private intervalPing: NodeJS.Timeout | 0 = 0;
  private messageHandler: ClientMessageHandler;
  
  private constructor(){
    this.messageHandler = new ClientMessageHandler();
    
  }

  public static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
        WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }

  connect(): void {
      this.client = new WebSocket('ws://186.137.241.231:46579');
      if (!this.client) return;
      this.client.on('open', () => {
        console.log('Cliente conectado');
        const login = createLogin('RadioWebChat', 'Radio Web Chat by Manu16')
        this.send(login);
      });
      this.client.on('message', (message: Buffer) => {
        const newMessage = message.toString();
        console.log('Mensaje recibido del servidor remoto:', newMessage);
        
        if (newMessage.startsWith('ACK')) {
          if (!this.intervalPing) {
            this.intervalPing = setInterval(() => {
              this.client?.send('PING:');
            }, 13000);
          }
        } else {
          // Procesar el mensaje con el manejador
          this.messageHandler.handleIncomingMessage(newMessage);
        }
      });
      this.client.on('close', () => {
        this.close();
        console.log('Cliente desconectado');
      });
      this.client.on('error', (error) => {
        this.close();
        console.log('Error', error);
      });
  }

  send(message: string): void {
    console.log('Enviando mensaje', message);
    if (!this.client) return;
    this.client.send(message);
  }

  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async close(): Promise<void> {
    if (!this.client) return;
  
    this.client.close();
  
    console.log('Esperando para reconectar...');
    await this.sleep(5000); // ✅ ahora sí podés usar await
  
    WebSocketClient.getInstance().connect();
  }
  
}