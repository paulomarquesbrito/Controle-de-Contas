const ITERATIONS = 250000;
const KEY_LENGTH = 256;

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function deriveKey(password, salt) {
  const encodedPassword = new TextEncoder().encode(password);
  const baseKey = await crypto.subtle.importKey('raw', encodedPassword, 'PBKDF2', false, ['deriveKey']);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptJson(payload, password) {
  if (!window.isSecureContext) {
    throw new Error('Criptografia exige contexto seguro. Use HTTPS ou localhost.');
  }
  if (!password || password.length < 8) {
    throw new Error('Use uma senha do cofre com pelo menos 8 caracteres.');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const plainText = new TextEncoder().encode(JSON.stringify(payload));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plainText);

  return {
    app: 'Meu Controle Financeiro',
    type: 'encrypted-family-vault',
    version: 1,
    algorithm: 'AES-GCM',
    kdf: 'PBKDF2-SHA-256',
    iterations: ITERATIONS,
    createdAt: new Date().toISOString(),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(encrypted)),
  };
}

export async function decryptJson(encryptedPayload, password) {
  if (!encryptedPayload || encryptedPayload.type !== 'encrypted-family-vault') {
    throw new Error('O arquivo remoto não parece ser um cofre criptografado válido.');
  }
  if (!password) {
    throw new Error('Informe a senha do cofre.');
  }

  try {
    const salt = base64ToBytes(encryptedPayload.salt);
    const iv = base64ToBytes(encryptedPayload.iv);
    const encrypted = base64ToBytes(encryptedPayload.data);
    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (error) {
    throw new Error('Não foi possível abrir o cofre. Verifique se a senha está correta.');
  }
}
