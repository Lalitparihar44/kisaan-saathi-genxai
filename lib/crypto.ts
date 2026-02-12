import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY || 'default-secret-key';

const encodeValue = (value: any): string => 
  CryptoJS.AES.encrypt(JSON.stringify(value), SECRET_KEY).toString();

const decodeValue = (value: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(value, SECRET_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) {
      throw new Error('Failed to decrypt');
    }
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption error:', error);
    console.log('Raw value received:', value);
    // Return the value
  }
};

export { encodeValue, decodeValue };