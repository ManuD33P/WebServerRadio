export interface UserData {
  guid: string;
  name: string;
  deviceInfo: string;
  client: string;
  personalMessage: string;
  avatar: string;
  connected: boolean;
  level?: number;
  points?: number;
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
  public level: number;
  public points: number;
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
    this.level = data.level || 0;
    this.points = data.points || 0;
    this.lastSeen = data.lastSeen || new Date();
  }

  /**
   * Crea una instancia de User a partir de un mensaje de login
   * @param loginMessage Mensaje de login en formato: "LOGIN:4,32,4,15,13,13,12:5000,<GUID>,<name>,<deviceInfo>,<client>,<message>,<avatar>"
   * @returns Una nueva instancia de User
   */
  static fromLoginMessage(loginMessage: string): User | null {
    try {
      console.log('Mensaje de login completo:', loginMessage);
      
      // Formato: "LOGIN:4,32,12,15,13,24,12:5000<GUID>name..."
      const [header, data] = loginMessage.split(':');
      if (!data) return null;
      
      // Extraer las longitudes
      const lengthStr = data.split(':')[0];
      const lengths = lengthStr.split(',').map(Number);
      
      // Tomar solo la parte después del segundo ':'
      const dataPart = loginMessage.split(':').slice(2).join(':');
      
      // Extraer cada campo según su longitud
      let position = 0;
      const fields = [];
      for (const length of lengths) {
        const value = dataPart.substring(position, position + length);
        position += length;
        fields.push(value);
      }
      
      // Mapear los campos manualmente en el orden correcto
      const [
        protocol,
        guid,
        name,
        deviceInfo,
        client,
        personalMessage,
        avatar
      ] = fields;
      
      console.log('Campos extraídos:', {
        protocol,
        guid,
        name,
        deviceInfo,
        client,
        personalMessage,
        avatar
      });
      
      if (!name || !guid) {
        console.error('Faltan campos obligatorios (nombre o guid)');
        return null;
      }
      
      return new User({
        guid: guid.trim(),
        name: name.trim(),
        deviceInfo: (deviceInfo || '').trim(),
        client: (client || 'webchat radio').trim(),
        personalMessage: (personalMessage || '').trim(),
        avatar: (avatar || '/default.png').trim(),
        connected: true,
        lastSeen: new Date()
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