import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Readable, Transform } from 'stream';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export class EncryptionStream extends Transform {
  private cipher: any; // CipherGCM type not exported
  private iv: Buffer;

  constructor(key: Buffer) {
    super();
    this.iv = randomBytes(IV_LENGTH);
    this.cipher = createCipheriv(ALGORITHM, key, this.iv);

    // Emit IV first
    this.push(this.iv);
  }

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: () => void) {
    this.push(this.cipher.update(chunk));
    callback();
  }

  _flush(callback: () => void) {
    this.push(this.cipher.final());
    // Append auth tag
    this.push(this.cipher.getAuthTag());
    callback();
  }
}

export class DecryptionStream extends Transform {
  private decipher?: any; // DecipherGCM type not exported
  private key: Buffer;
  private iv?: Buffer;
  private buffer: Buffer = Buffer.alloc(0);

  constructor(key: Buffer) {
    super();
    this.key = key;
  }

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: () => void) {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    // Extract IV (first 16 bytes)
    if (!this.iv && this.buffer.length >= IV_LENGTH) {
      this.iv = this.buffer.subarray(0, IV_LENGTH);
      this.buffer = this.buffer.subarray(IV_LENGTH);
      this.decipher = createDecipheriv(ALGORITHM, this.key, this.iv);
    }

    if (this.decipher) {
      // Keep last 16 bytes for auth tag
      if (this.buffer.length > AUTH_TAG_LENGTH) {
        const dataLength = this.buffer.length - AUTH_TAG_LENGTH;
        const data = this.buffer.subarray(0, dataLength);
        this.buffer = this.buffer.subarray(dataLength);
        this.push(this.decipher.update(data));
      }
    }

    callback();
  }

  _flush(callback: (error?: Error) => void) {
    if (!this.decipher) {
      return callback(new Error('Decryption stream not initialized'));
    }

    try {
      // Last bytes are auth tag
      this.decipher.setAuthTag(this.buffer);
      this.push(this.decipher.final());
      callback();
    } catch (error) {
      callback(error as Error);
    }
  }
}

export function encryptStream(stream: Readable, key: string): Readable {
  const keyBuffer = Buffer.from(key, 'utf-8');
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be 32 bytes for AES-256');
  }
  const encryptionStream = new EncryptionStream(keyBuffer);
  return stream.pipe(encryptionStream);
}

export function decryptStream(stream: Readable, key: string): Readable {
  const keyBuffer = Buffer.from(key, 'utf-8');
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be 32 bytes for AES-256');
  }
  const decryptionStream = new DecryptionStream(keyBuffer);
  return stream.pipe(decryptionStream);
}
