import bs58 from 'https://cdn.jsdelivr.net/npm/bs58@6.0.0/+esm'

import { XinYinMessageCode } from './xinyin_types.js'

/** 
 * @typedef { import('./xinyin_types.js').XinYinMessage } XinYinMessage
 */

console.log('Initializing xinyin worker...');

const xinyin_worker = new Worker('./xinyin-worker.js', {
    type: 'module',
    name: 'xinyin-worker'
});

xinyin_worker.onmessage = (event) => {
    onXinyinMessage(event.data);
};

/** 
 * @param { XinYinMessage } message 
 */
function postMessageToXinyinWorker(message) {
    xinyin_worker.postMessage(message);
}

/**
 * @param {string} id
 * @returns {HTMLInputElement}
 */
function getInput(id) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLInputElement)) {
        throw new Error(`Element #${id} is not an input`);
    }
    return el;
}

/**
 * @param { XinYinMessage } message
 */
function onXinyinMessage(message) {
    switch (message.code) {
        case XinYinMessageCode.GenerateWords32Result:
            console.log('生成的心印助记字:', message.words32);
            break;
        case XinYinMessageCode.ImportWords32Result:
            console.log('导入的Solana地址:', message.solanaAddress);
            break;
        case XinYinMessageCode.SignMessageResult:
            console.log('签名的消息:', message.signature);
            let address = getInput('sign_address').value;
            let signMessage = getInput('sign_message').value;
            verifySignature(address, message.signature, signMessage)
                .then(isValid => {
                    console.log('签名验证结果:', isValid);
                })
                .catch(err => {
                    console.error('签名验证失败:', err);
                });
            break;
        default:
            console.error('Unknown message code:', message.code);
    }
}

async function verifySignature(publicKey, signature, message) {
    const publicKeyUint8 = bs58.decode(publicKey);
    const signatureUint8 = new Uint8Array(signature);

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        publicKeyUint8,
        { name: "Ed25519" },
        false,
        ["verify"]
    );
    return await crypto.subtle.verify(
        { name: "Ed25519" },
        cryptoKey,
        signatureUint8,
        new TextEncoder().encode(message)
    );
}


document.getElementById('list_sks').addEventListener('click', async function (event) {
    console.log('列出OPFS文件系统中的心印密钥...');
    let opfs = await navigator.storage.getDirectory();
    for await (const [key, value] of opfs.entries()) {
        if (value.kind === 'file') {
            let file = await value.getFile();
            console.log(`文件(${file.name})内容:\n${await file.text()}`);
        } else if (value.kind === 'directory') {
            console.log(`目录: ${key}`);
        }
    }
});

document.getElementById('generate_words32').addEventListener('click', async function (event) {
    let txtInHeart = getInput('txt_in_heart').value;
    let start = parseInt(getInput('start').value);
    let count = parseInt(getInput('count').value);
    if (isNaN(start) || isNaN(count) || start < 0 || count <= 0) {
        alert('请输入有效的起始位置和生成数量');
        return;
    }
    postMessageToXinyinWorker({
        code: XinYinMessageCode.GenerateWords32,
        txtInHeart: txtInHeart,
        startOf8105: start,
        countFrom8105: count
    });
});

document.getElementById('import_words32').addEventListener('click', async function (event) {
    postMessageToXinyinWorker({
        code: XinYinMessageCode.ImportWords32,
        words32: getInput('words32_input').value,
        txtInHeart: getInput('txt_in_heart').value,
        startOf8105: parseInt(getInput('start').value),
        countFrom8105: parseInt(getInput('count').value),
        passphrase: getInput('passphrase').value
    });
});

document.getElementById('sign').addEventListener('click', async function (event) {
    let address = getInput('sign_address').value;
    let message = getInput('sign_message').value;
    postMessageToXinyinWorker({
        code: XinYinMessageCode.SignMessage,
        solanaAddress: address,
        messageUint8: new TextEncoder().encode(message),
        passphrase: getInput('passphrase').value
    });
});

document.getElementById('delete_sks_store').addEventListener('click', async function (event) {
    postMessageToXinyinWorker({ code: XinYinMessageCode.ClearSksCache });
});