/**
 * @enum { string }
 */
export const XinYinMessageCode = {
    /** 生成随机密钥，返回心印助记字（32个汉字） */
    GenerateWords32: 'generate-words32',
    GenerateWords32Result: 'words32-generated-result',
    /** 导入心印助记字，返回Solana地址 */
    ImportWords32: 'import-words32',
    ImportWords32Result: 'words32-imported-result',
    /** 签名消息，返回签名结果 */
    SignMessage: 'sign-message',
    SignMessageResult: 'message-signed-result',
    ClearSksCache: 'clear-sks-cache',
};

/**
 * @typedef { Object } XinYinMessage
 * @property { XinYinMessageCode } code - The message code.
 * @property { string } [txtInHeart] - 心印文本.
 * @property { number } [startOf8105] - The starting index for charset-8105.
 * @property { number } [countFrom8105] - The count of chars retrieved from charset-8105.
 * @property { string } [words32] - 心印助记字（32个汉字）.
 * @property { string } [passphrase] - The passphrase for encryption.
 * @property { string } [solanaAddress] - The Solana address.
 * @property { Uint8Array } [messageUint8] - The message to be signed, as a Uint8Array.
 * @property { Uint8Array } [signature] - The signature of the message, as a Uint8Array.
 * @property { string } [errorMessage] - The error message, if any.
 */