import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { 
  pemToArrayBuffer,
  importRsaPubKey,
  generateAesKey,
  exportAesKeyRaw,
  abToBase64,
  base64ToUint8Array,
  encryptForSession,
  decryptFromSession
} from '../src/services/cryptoClient';

// Mock de WebCrypto API si es necesario
const mockSubtle = {
  importKey: vi.fn(),
  generateKey: vi.fn(),
  exportKey: vi.fn(),
  encrypt: vi.fn(),
  decrypt: vi.fn()
};

const mockCrypto = {
  subtle: mockSubtle,
  getRandomValues: vi.fn((arr) => {
    for (let i = 0; i < arr.length; i++) arr[i] = i;
    return arr;
  })
};

describe('cryptoClient', () => {
  beforeAll(() => {
    // Backup del objeto global crypto
    global._originalCrypto = global.crypto;
    global.crypto = mockCrypto;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('convierte PEM a ArrayBuffer', async () => {
    const testPem = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvTB92B0X+A3R0jJnvG05
KqfwENx2voSyGF7UHGA0Y1sj6lx9UUDk6NkFwQhmYYp4+r7vkW1rEVIlpUeI5RGR
+f37wZ5Nym/HNDFqGYENxXKaYquvDAM7
-----END PUBLIC KEY-----`;
    
    const buffer = await pemToArrayBuffer(testPem);
    expect(buffer).toBeInstanceOf(ArrayBuffer);
  });

  it('importa clave RSA pública', async () => {
    const testPem = '-----BEGIN PUBLIC KEY-----\nMIIB...';
    mockSubtle.importKey.mockResolvedValue('mocked-rsa-key');
    
    const key = await importRsaPubKey(testPem);
    expect(mockSubtle.importKey).toHaveBeenCalledWith(
      'spki',
      expect.any(ArrayBuffer),
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    );
    expect(key).toBe('mocked-rsa-key');
  });

  it('genera clave AES', async () => {
    mockSubtle.generateKey.mockResolvedValue('mocked-aes-key');
    
    const key = await generateAesKey();
    expect(mockSubtle.generateKey).toHaveBeenCalledWith(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    expect(key).toBe('mocked-aes-key');
  });

  it('cifra y descifra datos para una sesión', async () => {
    const testKey = 'mocked-aes-key';
    const testData = 'Hello, World!';
    const mockEncrypted = new Uint8Array([1, 2, 3, 4]);
    
    mockSubtle.encrypt.mockResolvedValue(mockEncrypted);
    mockSubtle.decrypt.mockResolvedValue(new TextEncoder().encode(testData));

    const encrypted = await encryptForSession(testKey, testData);
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('ciphertext');

    const decrypted = await decryptFromSession(
      testKey,
      encrypted.iv,
      encrypted.ciphertext
    );
    expect(decrypted).toBe(testData);
  });

  // Pruebas de integración local
  it('realiza un flujo completo de cifrado/descifrado', async () => {
    const testData = { message: 'test payload' };
    const aesKey = await generateAesKey();
    
    // Cifrar
    const encrypted = await encryptForSession(aesKey, JSON.stringify(testData));
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.ciphertext).toBeTruthy();
    
    // Descifrar
    const decrypted = await decryptFromSession(
      aesKey,
      encrypted.iv,
      encrypted.ciphertext
    );
    expect(JSON.parse(decrypted)).toEqual(testData);
  });
});