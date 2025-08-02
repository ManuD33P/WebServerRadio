/**
 * Generates a cryptographically secure GUID
 * @returns A string containing a GUID in uppercase
 */
function generateGUID(): string {
  // Usar el módulo crypto de Node.js
  const crypto = require('crypto');
  // Generar 16 bytes aleatorios
  const buffer = crypto.randomBytes(16);
  
  // Convertir a string hexadecimal y asegurar que cada byte tenga 2 caracteres
  return buffer.toString('hex').toUpperCase();
}

/**
 * Obtiene la información del dispositivo en el formato requerido
 * @returns String con la información del dispositivo
 */
function getDeviceInfo(): string {
  // Formato: "Win32;Bun/1.1.3"
  return 'Win32;Bun/1.1.3';
}

export function createLogin(
  name: string,
  personalMessage?: string,
  avatar: string = '/default.png'
): string {
  const protocol = "5000";
  const guid = generateGUID();
  const deviceInfo = getDeviceInfo();
  const client = 'webchat radio';
  const message = personalMessage || 'Radio Client Web by Manu16';
  
  // Construir las partes del mensaje
  const parts = [
    protocol.length,     // 4
    guid.length,         // 32
    name.length,         // 4 (ej: 'Manu')
    deviceInfo.length,   // 15 (ej: 'Win32;Bun/1.1.3')
    client.length,       // 13 ('webchat radio')
    message.length,      // 13 (ej: 'client Postman')
    avatar.length        // 12 (ej: '/default.png')
  ];

  // Construir el string de login exactamente como se requiere
  const loginString = [
    'LOGIN:',
    parts.join(','),
    ':',
    protocol,
    guid,
    name,
    deviceInfo,
    client,
    message,
    avatar
  ].join('');

  return loginString;
}
