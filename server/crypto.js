const CryptoJS = require("crypto-js");

const KEY = "3+Lhz8XaOli6bHIoYPGuq9Y8SZxEjX6eN7AFPZuLCLs=";
const IV = "IvUScqUudyxBTBU9ZCyjow==";

const decrypt = (inputString) => {
  const urlDecoded = decodeURIComponent(inputString);

  const key = CryptoJS.enc.Base64.parse(KEY);
  const iv = CryptoJS.enc.Base64.parse(IV);

  const decrypted = CryptoJS.AES.decrypt(
    {
      ciphertext: CryptoJS.enc.Base64.parse(urlDecoded),
    },
    key,
    {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );

  return decrypted.toString(CryptoJS.enc.Utf8);
};

const encrypt = (inputString) => {
  const key = CryptoJS.enc.Base64.parse(KEY);
  const iv = CryptoJS.enc.Base64.parse(IV);

  const encrypted = CryptoJS.AES.encrypt(inputString, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const base64Encoded = encrypted.ciphertext.toString(CryptoJS.enc.Base64);

  const urlEncoded = encodeURIComponent(base64Encoded);

  return urlEncoded;
};

module.exports = {
  decrypt,
  encrypt,
};