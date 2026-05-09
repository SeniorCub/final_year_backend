import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.AES_SECRET || 'default_secret_key_32_characters_long_!!';
const IV_LENGTH = 16;

export function encrypt(text: string): string {
     const iv = crypto.randomBytes(IV_LENGTH);
     const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY.padEnd(32).slice(0, 32)), iv);
     let encrypted = cipher.update(text);
     encrypted = Buffer.concat([encrypted, cipher.final()]);
     return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
     const textParts = text.split(':');
     const iv = Buffer.from(textParts.shift()!, 'hex');
     const encryptedText = Buffer.from(textParts.join(':'), 'hex');
     const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY.padEnd(32).slice(0, 32)), iv);
     let decrypted = decipher.update(encryptedText);
     decrypted = Buffer.concat([decrypted, decipher.final()]);
     return decrypted.toString();
}
