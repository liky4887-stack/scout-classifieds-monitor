'use client';

const KEY_ENV = 'SCOUT_ENCRYPTION_KEY';
const FALLBACK_KEY = 'scout-dev-key-not-for-production';

function getKeyMaterial(): string {
  if (typeof process !== 'undefined' && process.env?.[KEY_ENV]) return process.env[KEY_ENV];
  return FALLBACK_KEY;
}

async function deriveKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = enc.encode(getKeyMaterial());
  const baseKey = await crypto.subtle.importKey('raw', keyMaterial, 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode('scout-salt'), iterations: 100_000, hash: 'SHA-256' }, baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function encryptCookies(plaintext: string): Promise<string> {
  if (!plaintext) return '';
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode.apply(null, Array.from(combined)));
}

export async function decryptCookies(ciphertextB64: string): Promise<string> {
  if (!ciphertextB64) return '';
  try {
    const key = await deriveKey();
    const combined = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch { return ''; }
}
