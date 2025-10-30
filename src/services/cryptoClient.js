// Helpers WebCrypto for hybrid encryption (RSA-OAEP + AES-GCM)
export async function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----.*-----/g, '').replace(/\s+/g, '');
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}

export async function importRsaPubKey(pem) {
  const spki = await pemToArrayBuffer(pem);
  return await window.crypto.subtle.importKey(
    'spki',
    spki,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
}

export async function generateAesKey() {
  return await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportAesKeyRaw(key) {
  const raw = await window.crypto.subtle.exportKey('raw', key);
  return new Uint8Array(raw);
}

export function abToBase64(buf) {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToUint8Array(b64) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

export async function initSession(apiBase = '') {
  // 1. fetch pubkey
  console.log('cryptoClient.initSession: fetching public key from', `${apiBase}/api/crypto/pubkey`);
  const pubResp = await fetch(`${apiBase}/api/crypto/pubkey`);
  const pubPem = await pubResp.text();
  console.log('cryptoClient.initSession: received public key (length)', pubPem.length);
  const rsaKey = await importRsaPubKey(pubPem);

  // 2. generate AES key
  console.log('cryptoClient.initSession: generating AES key');
  const aesKey = await generateAesKey();
  const rawAes = await exportAesKeyRaw(aesKey);
  console.log('cryptoClient.initSession: AES key generated (raw length)', rawAes.length);

  // 3. Encrypt AES raw with RSA-OAEP
  const encrypted = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, rsaKey, rawAes);
  const encryptedB64 = abToBase64(encrypted);
  console.log('cryptoClient.initSession: encrypted AES key length (base64)', encryptedB64.length);

  // 4. Send encrypted to server to create session
  // Include Authorization header if token present in localStorage
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const resp = await fetch(`${apiBase}/api/crypto/session`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ encryptedKey: encryptedB64 })
  });
  const json = await resp.json();
  if (!json.sessionId) throw new Error(json.error || 'Failed to create session');
  console.log('cryptoClient.initSession: session created on server', json.sessionId);
  return { sessionId: json.sessionId, aesKey };
}

export async function encryptForSession(aesKey, plaintext, aad = null) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad ? new TextEncoder().encode(aad) : undefined },
    aesKey,
    new TextEncoder().encode(plaintext)
  );
  return { iv: abToBase64(iv), ciphertext: abToBase64(enc) };
}

export async function decryptFromSession(aesKey, ivB64, ctB64, aad = null) {
  const iv = base64ToUint8Array(ivB64);
  const ct = base64ToUint8Array(ctB64);
  const dec = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: aad ? new TextEncoder().encode(aad) : undefined },
    aesKey,
    ct
  );
  return new TextDecoder().decode(dec);
}
