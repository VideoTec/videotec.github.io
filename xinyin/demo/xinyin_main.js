import { XinYinMessageCode } from "./xinyin_types.js";

/**
 * @typedef { import('./xinyin_types.js').XinYinMessage } XinYinMessage
 */

export { generateWords32, importWords32, signMessage, clearSksCache, listSks };

const xinyin_worker = new Worker("./xinyin_worker.js", {
  type: "module",
  name: "xinyin-worker",
});

xinyin_worker.onmessage = (/** @type {{data: XinYinMessage}} */ event) => {
  onXinyinMessage(event.data);
};

/**
 *
 * @param {string} txtInHeart
 * @param {number} startOf8105
 * @param {number} countFrom8105
 * @return {Promise<string>} Returns a promise that resolves to the generated words32.
 */
function generateWords32(txtInHeart, startOf8105, countFrom8105) {
  const message = {
    code: XinYinMessageCode.GenerateWords32,
    requestId: 0,
    txtInHeart: txtInHeart,
    startOf8105: startOf8105,
    countFrom8105: countFrom8105,
  };
  return postMessageToXinyinWorker(message);
}

/**
 *
 * @param {string} words32
 * @param {string} txtInHeart
 * @param {number} startOf8105
 * @param {number} countFrom8105
 * @param {string} passphrase
 * @return {Promise<string>} Returns a promise that resolves to the imported Solana address.
 */
function importWords32(
  words32,
  txtInHeart,
  startOf8105,
  countFrom8105,
  passphrase
) {
  const message = {
    code: XinYinMessageCode.ImportWords32,
    requestId: 0,
    words32: words32,
    txtInHeart: txtInHeart,
    startOf8105: startOf8105,
    countFrom8105: countFrom8105,
    passphrase: passphrase,
  };
  return postMessageToXinyinWorker(message);
}

/**
 *
 * @param {string} solanaAddress
 * @param {ArrayBuffer} messageUint8
 * @param {string} passphrase
 * @return {Promise<ArrayBufferLike>} Returns a promise that resolves to the signature of the message.
 */
function signMessage(solanaAddress, messageUint8, passphrase) {
  const message = {
    code: XinYinMessageCode.SignMessage,
    requestId: 0,
    solanaAddress: solanaAddress,
    messageUint8: new Uint8Array(messageUint8),
    passphrase: passphrase,
  };
  return postMessageToXinyinWorker(message);
}

/**
 * Clears the SKS cache by truncating the SKS file.
 * @returns {Promise<void>} Returns a promise that resolves when the SKS cache is cleared.
 */
function clearSksCache() {
  const message = {
    code: XinYinMessageCode.ClearSksCache,
    requestId: 0,
  };
  return postMessageToXinyinWorker(message);
}

/**
 * list SKs (Secret Keys) from the SKS file.
 * @returns {Promise<Array<string>>} Returns a promise that resolves to the list of SKs.
 */
function listSks() {
  const message = {
    code: XinYinMessageCode.ListSks,
    requestId: 0,
  };
  return postMessageToXinyinWorker(message);
}

/** @type { number } - xinyin request id */
let gRequestId = 0;
/**
 * @type { Record<number, {
 *  resolve: (value: any) => void,
 *  reject: (reason?: any) => void,
 *  code: XinYinMessageCode,
 * }> } - pending requests
 */
let gPendingRequests = {};

/**
 * @param { XinYinMessage } message
 */
function postMessageToXinyinWorker(message) {
  gRequestId += 1;
  message.requestId = gRequestId;
  xinyin_worker.postMessage(message);
  return new Promise((resolve, reject) => {
    gPendingRequests[gRequestId] = { resolve, reject, code: message.code };
  });
}

/**
 * @param { XinYinMessage } message
 */
function onXinyinMessage(message) {
  let request = gPendingRequests[message.requestId];

  if (!request) {
    console.error("No pending request found for requestId:", message);
    return;
  }

  delete gPendingRequests[message.requestId];

  if (message.errorMessage) {
    request.reject(new Error(message.errorMessage));
    return;
  }

  switch (message.code) {
    case XinYinMessageCode.GenerateWords32Result: {
      if (request.code !== XinYinMessageCode.GenerateWords32) {
        request.reject(
          new Error("Unexpected message code for GenerateWords32Result")
        );
        return;
      }
      request.resolve(message.words32);
      break;
    }
    case XinYinMessageCode.ImportWords32Result: {
      if (request.code !== XinYinMessageCode.ImportWords32) {
        request.reject(
          new Error("Unexpected message code for ImportWords32Result")
        );
        return;
      }
      request.resolve(message.solanaAddress);
      break;
    }
    case XinYinMessageCode.SignMessageResult: {
      if (request.code !== XinYinMessageCode.SignMessage) {
        request.reject(
          new Error("Unexpected message code for SignMessageResult")
        );
        return;
      }
      request.resolve(message.signature);
      break;
    }
    case XinYinMessageCode.ClearSksCacheResult: {
      if (request.code !== XinYinMessageCode.ClearSksCache) {
        request.reject(
          new Error("Unexpected message code for ClearSksCacheResult")
        );
        return;
      }
      request.resolve();
      break;
    }
    case XinYinMessageCode.ListSksResult: {
      if (request.code !== XinYinMessageCode.ListSks) {
        request.reject(new Error("Unexpected message code for ListSksResult"));
        return;
      }
      request.resolve(message.sks);
      break;
    }
    default:
      console.error("Xinyin Main Received Unknown message code:", message.code);
  }
}
