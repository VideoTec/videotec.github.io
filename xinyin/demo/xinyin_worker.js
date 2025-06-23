import xinyin_wasm, {
  import_xinyin_words32,
  generate_xinyin_words32,
  sign_message,
} from "./xinyin_wasm.js";

import { XinYinMessageCode } from "./xinyin_types.js";

xinyin_wasm()
  .then(() => {
    console.log("xinyin_wasm initialized successfully");
  })
  .catch((err) => {
    console.error("error initializing xinyin_wasm:", err);
  });

/**
 * @typedef { import('./xinyin_types.js').XinYinMessage } XinYinMessage
 */

self.onmessage = async (/** @type {{data: XinYinMessage}} */ event) => {
  onXinYinMessage(event.data);
};

/**
 * @param { XinYinMessage } message
 */
function onXinYinMessage(message) {
  /** @type { XinYinMessage } */
  let responseMsg = {
    code: XinYinMessageCode.Unknown,
    requestId: message.requestId,
  };

  switch (message.code) {
    case XinYinMessageCode.GenerateWords32: {
      responseMsg.code = XinYinMessageCode.GenerateWords32Result;
      try {
        responseMsg.words32 = generate_xinyin_words32(
          message.txtInHeart,
          message.startOf8105,
          message.countFrom8105
        );
      } catch (error) {
        responseMsg.errorMessage = error;
      }
      break;
    }

    case XinYinMessageCode.ImportWords32: {
      responseMsg.code = XinYinMessageCode.ImportWords32Result;
      try {
        responseMsg.solanaAddress = import_xinyin_words32(
          message.words32,
          message.txtInHeart,
          message.startOf8105,
          message.countFrom8105,
          message.passphrase
        );
      } catch (error) {
        responseMsg.errorMessage = error;
      }
      break;
    }

    case XinYinMessageCode.SignMessage: {
      responseMsg.code = XinYinMessageCode.SignMessageResult;
      try {
        responseMsg.signature = sign_message(
          message.solanaAddress,
          message.messageUint8,
          message.passphrase
        );
      } catch (error) {
        responseMsg.errorMessage = error;
      }
      break;
    }

    case XinYinMessageCode.ClearSksCache: {
      responseMsg.code = XinYinMessageCode.ClearSksCacheResult;
      gSksSyncHandle.truncate(0); // 清空文件内容
      break;
    }

    case XinYinMessageCode.ListSks: {
      responseMsg.code = XinYinMessageCode.ListSksResult;
      try {
        responseMsg.sks = loadEncryptedSks();
      } catch (error) {
        responseMsg.errorMessage = error;
      }
      break;
    }

    default: {
      responseMsg.errorMessage = `未知的消息类型: ${message.code}`;
    }
  }

  self.postMessage(responseMsg);
}

/**
 * @constant
 * @type { string }
 * @description 心印密钥存储文件名称
 */
const SKS_STORE_NAME = "sks";

/**
 * @type { FileSystemSyncAccessHandle }
 * @description 用于同步访问OPFS文件系统中的心印密钥存储文件
 */
const gSksSyncHandle = await (async function () {
  let opfsRoot = await navigator.storage.getDirectory();
  let sksFileHandle = await opfsRoot.getFileHandle(SKS_STORE_NAME, {
    create: true,
  });
  return await sksFileHandle.createSyncAccessHandle();
})();

/**
 * @param {string} sk - (salt || nonce || encrypted sk) in base64 format
 */
export function saveEncryptedSkBase64(sk) {
  let size = gSksSyncHandle.getSize();
  let buf = new TextEncoder().encode(sk + "\n"); // 添加换行符以分隔每个密钥
  gSksSyncHandle.write(buf, { at: size });
  gSksSyncHandle.flush();
}

/**
 * 从OPFS文件系统中加载解密后的心印密钥列表
 * @returns {string[]} - 返回解密后的心印密钥列表
 */
export function loadEncryptedSks() {
  let size = gSksSyncHandle.getSize();
  let buf = new ArrayBuffer(size);

  gSksSyncHandle.read(buf, { at: 0 });

  let sksTxt = new TextDecoder().decode(new Uint8Array(buf));
  let sks = sksTxt.split("\n").filter((line) => line.trim() !== ""); // 过滤掉空行

  return sks;
}
