
type WebSocketData = {
  id: string;
  [key: string]: any;
};

type WebSocketHandler = (ws: Bun.ServerWebSocket<WebSocketData>) => void;
type MessageHandler = (ws: Bun.ServerWebSocket<WebSocketData>, message: string | Buffer) => void;

interface WebSocketServerOptions {
  port?: number;
  hostname?: string;
  development?: boolean;
}

export class WebSocketServer {
  private server: Bun.Serve | null = null;
  private clients: Map<string, Bun.ServerWebSocket<WebSocketData>> = new Map();
  private options: Required<WebSocketServerOptions>;
  private onConnectionHandler: WebSocketHandler = () => {};
  private onMessageHandler: MessageHandler = () => {};
  private onCloseHandler: WebSocketHandler = () => {};
  private onErrorHandler: (error: Error) => void = () => {};

  constructor(options: WebSocketServerOptions = {}) {
    this.options = {
      port: options.port || 3000,
      hostname: options.hostname || '0.0.0.0',
      development: options.development || process.env.NODE_ENV !== 'production'
    };
  }

  /**
   * Inicia el servidor WebSocket
   */
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const { port, hostname, development } = this.options;
        
        // Configuración del servidor
        this.server = Bun.serve({
          port,
          hostname,
          fetch: this.handleUpgrade.bind(this),
          websocket: {
            open: (ws:  Bun.ServerWebSocket<WebSocketData>) => this.handleOpen(ws),
            message: (ws: Bun.ServerWebSocket<WebSocketData>, message: string | Buffer) => 
              this.handleMessage(ws, message),
            close: (ws: Bun.ServerWebSocket<WebSocketData>) => this.handleClose(ws),
            drain: (ws: Bun.ServerWebSocket<WebSocketData>) => {},
            perMessageDeflate: true
          }
        });

        console.log(`🚀 Servidor WebSocket iniciado en:
  - URL: ws://${hostname === '0.0.0.0' ? 'localhost' : hostname}:${port}
  - Entorno: ${development ? 'Desarrollo' : 'Producción'}
  - Modo: Detrás de ISS (SSL manejado externamente)`);

        resolve();
      } catch (error) {
        console.error('❌ Error al iniciar el servidor WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Detiene el servidor WebSocket
   */
  public stop(): void {
    if (this.server) {
      this.server = null;
      this.clients.clear();
      console.log('🛑 Servidor WebSocket detenido');
    }
  }

  /**
   * Maneja la actualización de conexión HTTP a WebSocket
   */
  private handleUpgrade(req: Request, server: any): Response | undefined {
    const url = new URL(req.url);
    
    // Aquí puedes agregar lógica de autenticación o validación
    console.log(`🔌 Nueva solicitud de conexión: ${req.method} ${url.pathname}`);
    
    // Aceptar la conexión WebSocket
    const success = server.upgrade(req);
    if (!success) {
      return new Response('Upgrade failed', { status: 400 });
    }
  }

  /**
   * Maneja la apertura de una nueva conexión WebSocket
   */
  private handleOpen(ws: Bun.ServerWebSocket<WebSocketData>): void {
    const clientId = Math.random().toString(36).substring(2, 15);
    ws.data = { id: clientId };
    this.clients.set(clientId, ws);
    
    console.log(`➕ Cliente conectado [${clientId}] - Total: ${this.clients.size}`);
    
    // Enviar mensaje de bienvenida
    ws.send(JSON.stringify({
      type: 'connection',
      status: 'connected',
      clientId,
      timestamp: new Date().toISOString()
    }));
    
    // Llamar al manejador de conexión
    this.onConnectionHandler(ws);
  }

  /**
   * Maneja los mensajes recibidos
   */
  private handleMessage(ws: Bun.ServerWebSocket<WebSocketData>, message: string | Buffer): void {
    try {
      // Llamar al manejador de mensajes
      this.onMessageHandler(ws, message);
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      this.onErrorHandler(error as Error);
    }
  }

  /**
   * Maneja el cierre de una conexión WebSocket
   */
  private handleClose(ws: Bun.ServerWebSocket<WebSocketData>): void {
    if (ws.data?.id) {
      this.clients.delete(ws.data.id);
      console.log(`➖ Cliente desconectado [${ws.data.id}] - Total: ${this.clients.size}`);
      this.onCloseHandler(ws);
    }
  }

  // Métodos para configurar manejadores de eventos
  public onConnection(handler: WebSocketHandler): this {
    this.onConnectionHandler = handler;
    return this;
  }

  public onMessage(handler: MessageHandler): this {
    this.onMessageHandler = handler;
    return this;
  }

  public onClose(handler: WebSocketHandler): this {
    this.onCloseHandler = handler;
    return this;
  }

  public onError(handler: (error: Error) => void): this {
    this.onErrorHandler = handler;
    return this;
  }

  /**
   * Envía un mensaje a todos los clientes conectados
   */
  public broadcast(message: string | object): void {
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    
    this.clients.forEach(client => {
      if (client.readyState === 1) { // 1 = OPEN
        client.send(messageString);
      }
    });
  }

  /**
   * Envía un mensaje a un cliente específico
   */
  public sendToClient(clientId: string, message: string | object): boolean {
    const client = this.clients.get(clientId);
    if (client && client.readyState === 1) {
      client.send(typeof message === 'string' ? message : JSON.stringify(message));
      return true;
    }
    return false;
  }


}
