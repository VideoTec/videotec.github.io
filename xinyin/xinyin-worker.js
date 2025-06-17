import xinyin_wasm, { import_xinyin_words32, generate_xinyin_words32, sign_message } from './xinyin_wasm.js';
import { XinYinMessageCode } from './xinyin_types.js';

/**
 * @typedef { import('./xinyin_types.js').XinYinMessage } XinYinMessage
 */

const SKS_STORE_NAME = 'sks'; // 心印密钥存储文件名称

async function deleteSksStore() {
    sksSyncHandle.close();
    let opfsRoot = await navigator.storage.getDirectory();
    await opfsRoot.removeEntry(SKS_STORE_NAME);
}

const sksSyncHandle = await (async function () {
    let opfsRoot = await navigator.storage.getDirectory();
    let sksFileHandle = await opfsRoot.getFileHandle(SKS_STORE_NAME, { create: true });
    return await sksFileHandle.createSyncAccessHandle();
})();

self.onmessage = async (event) => {
    onXinYinMessage(event.data);
};

/**
 * @param { XinYinMessage } message
 */
function postMessageToMainThread(message) {
    self.postMessage(message);
}

/**
 * @param { XinYinMessage } message - The message code indicating the operation to perform.
 */
function onXinYinMessage(message) {
    switch (message.code) {
        case XinYinMessageCode.GenerateWords32:
            let words32 = generate_xinyin_words32(message.txtInHeart, message.startOf8105, message.countFrom8105);
            postMessageToMainThread({ code: XinYinMessageCode.GenerateWords32Result, words32 });
            break;
        case XinYinMessageCode.ImportWords32:
            let solanaAddress = import_xinyin_words32(message.words32, message.txtInHeart, message.startOf8105, message.countFrom8105, message.passphrase);
            postMessageToMainThread({ code: XinYinMessageCode.ImportWords32Result, solanaAddress });
            break;
        case XinYinMessageCode.SignMessage:
            let signature = sign_message(message.solanaAddress, message.messageUint8, message.passphrase);
            postMessageToMainThread({ code: XinYinMessageCode.SignMessageResult, signature });
            break;
        case XinYinMessageCode.ClearSksCache:
            // deleteSksStore();
            sksSyncHandle.truncate(0); // 清空文件内容
            break;
        default:
            console.error('Unknown message code:', message.code);
    }
}

console.log('开始初始化xinyin_wasm...');

xinyin_wasm().then(() => {
    console.log('xinyin_wasm initialized successfully');
}).catch(err => {
    console.error('error initializing xinyin_wasm:', err);
});

/**
 * @param {string} sk - (salt || nonce || encrypted sk) in base64 format
 */
export function saveEncryptedSkBase64(sk) {
    let size = sksSyncHandle.getSize();
    let buf = new TextEncoder().encode(sk + '\n'); // 添加换行符以分隔每个密钥
    sksSyncHandle.write(buf, { at: size });
    sksSyncHandle.flush();
}

/**
 * 从OPFS文件系统中加载解密后的心印密钥列表
 * @returns {string[]} - 返回解密后的心印密钥列表
 */
export function loadEncryptedSks() {
    let size = sksSyncHandle.getSize();
    let buf = new ArrayBuffer(size);

    sksSyncHandle.read(buf, { at: 0 });

    let sksTxt = new TextDecoder().decode(new Uint8Array(buf));
    let sks = sksTxt.split('\n').filter(line => line.trim() !== ''); // 过滤掉空行

    return sks;
}