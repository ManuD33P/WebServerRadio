export interface UserData {
  guid: string;
  name: string;
  deviceInfo: string;
  client: string;
  personalMessage: string;
  avatar: string;
  connected: boolean;
  lastSeen?: Date;
}

export class User {
  public readonly guid: string;
  public readonly name: string;
  public readonly deviceInfo: string;
  public readonly client: string;
  public personalMessage: string;
  public avatar: string;
  public connected: boolean;
  public lastSeen: Date;
  public socketId?: string; // ID de la conexión WebSocket

  constructor(data: Partial<UserData> & { name: string }) {
    this.guid = data.guid || '';
    this.name = data.name;
    this.deviceInfo = data.deviceInfo || '';
    this.client = data.client || 'webchat radio';
    this.personalMessage = data.personalMessage || '';
    this.avatar = data.avatar || '/default.png';
    this.connected = data.connected ?? false;
    this.lastSeen = data.lastSeen || new Date();
  }

  /**
   * Crea una instancia de User a partir de un mensaje de login
   * @param loginMessage Mensaje de login en formato: "LOGIN:4,32,4,15,13,13,12:5000,<GUID>,<name>,<deviceInfo>,<client>,<message>,<avatar>"
   * @returns Una nueva instancia de User
   */
  static fromLoginMessage(loginMessage: string): User | null {
    try {
      // Extraer la parte de los datos después del segundo ":"
      const dataPart = loginMessage.split(':').slice(2).join(':');
      if (!dataPart) return null;
      
      // Dividir los datos por comas
      const [protocol, guid, name, deviceInfo, client, message, avatar] = dataPart.split(',');
      
      if (!name || !guid) return null;
      
      return new User({
        guid,
        name,
        deviceInfo,
        client,
        personalMessage: message,
        avatar: avatar || '/default.png',
        connected: true
      });
    } catch (error) {
      console.error('Error al parsear mensaje de login:', error);
      return null;
    }
  }

  /**
   * Actualiza los datos del usuario
   */
  update(data: Partial<UserData>): void {
    if (data.personalMessage !== undefined) this.personalMessage = data.personalMessage;
    if (data.avatar !== undefined) this.avatar = data.avatar;
    if (data.connected !== undefined) this.connected = data.connected;
    this.lastSeen = new Date();
  }

  /**
   * Convierte el usuario a un objeto plano
   */
  toJSON(): UserData {
    return {
      guid: this.guid,
      name: this.name,
      deviceInfo: this.deviceInfo,
      client: this.client,
      personalMessage: this.personalMessage,
      avatar: this.avatar,
      connected: this.connected,
      lastSeen: this.lastSeen
    };
  }
}