import CryptoJS from 'crypto-js';

/**
 * AES 加密工具
 * 配合后端 AesUtils.decrypt(encodeKey, password) 使用
 */
export class AesUtils {
  /**
   * AES 加密
   * @param encodeKey 加密密钥
   * @param data 需要加密的数据
   * @returns 加密后的字符串
   */
  static encrypt(encodeKey: string, data: string): string {
    const key = CryptoJS.enc.Utf8.parse(encodeKey);
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
  }

  /**
   * AES 解密
   * @param encodeKey 解密密钥
   * @param encryptedData 加密的数据
   * @returns 解密后的字符串
   */
  static decrypt(encodeKey: string, encryptedData: string): string {
    const key = CryptoJS.enc.Utf8.parse(encodeKey);
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}

// 默认加密密钥
export const DEFAULT_ENCRYPT_KEY = 'KFCCRAZYTHURSDAY';
