import { ServerSocket } from '../WebSocketServer';

interface MessageInfo {
  command: string;
  content: string;
  userName?: string;
}

export class ClientMessageHandler {
  /**
   * Procesa los mensajes recibidos del servidor remoto
   */
  public handleIncomingMessage(message: string): void {
    try {
      if (message.startsWith('PUBLIC:')) {
        this.handlePublicMessage(message);
      }
      // Aquí puedes agregar más handlers para otros tipos de mensajes
    } catch (error) {
      console.error('Error procesando mensaje del servidor:', error);
    }
  }

  /**
   * Maneja los mensajes públicos
   */
  private handlePublicMessage(message: string): void {
    // Formato esperado: PUBLIC:12,11:RadioWebChat Manu> HOLA
    const parts = message.split(':');
    if (parts.length < 3) return;

    const content = parts.slice(2).join(':');
    
    // Verificar si el mensaje viene de RadioWebChat
    if (content.startsWith('RadioWebChat')) {
      // Extraer nombre de usuario y mensaje
      const match = content.match(/^RadioWebChat\s+(.+?)>\s*(.*)$/);
      if (match) {
        const [, userName, userMessage] = match;
        // Enviar al servidor en el nuevo formato: PUBLIC:4,4ManuHOLA
        const formattedMessage = `PUBLIC:${userName.length},${userMessage.length}:${userName}${userMessage}`;
        const server = ServerSocket.getInstance();
        server.send(formattedMessage);
      }
    } else {
      // Si no es de RadioWebChat, reenviar el mensaje tal cual
      const server = ServerSocket.getInstance();
      server.send(message);
    }
  }
}

export default ClientMessageHandler;
