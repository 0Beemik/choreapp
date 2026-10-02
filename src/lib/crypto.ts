import * as Crypto from 'expo-crypto';

export function uuid(): string {
  return Crypto.randomUUID();
}

export function sha256(text: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);
}
