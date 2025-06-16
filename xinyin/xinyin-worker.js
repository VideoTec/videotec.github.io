import xinyin, { import_xinyin_words32, generate_xinyin_words32, sign_message } from './xinyin_wasm.js';
// import bs58 from 'bs58';
// import bs58 from './bs58.js';

let opfsRoot = await navigator.storage.getDirectory();
let walletsFile = await opfsRoot.getFileHandle('wallets', { create: true });
let walletsFileSync = await walletsFile.createSyncAccessHandle();

self.onmessage = async (event) => {
    const { message_code, message } = event.data;
    processMessage(message_code, message);
}

function processMessage(message_code, message) {
    switch (message_code) {
        case 'generate_xinyin_words32':
            let words32_generated = generate_xinyin_words32(message.txt_in_heart, message.start, message.count);
            self.postMessage({ message_code: 'words32_generated', message: { words32: words32_generated } });
            break;
        case 'import_xinyin_words32':
            let solana_address = import_xinyin_words32(message.words32, message.txt_in_heart, message.start, message.count, message.passphrase);
            self.postMessage({ message_code: 'solana_address_imported', message: { solana_address: solana_address } });
            break;
        case 'sign_message':
            let signature = sign_message(message.publicKey, message.messageUint8, message.passphrase);
            self.postMessage({ message_code: 'message_signed', message: { signature: signature } });
            break;
        default:
            console.error('Unknown message code:', message_code);
    }
}

console.log('开始初始化xinyin wasm...');

xinyin().then(() => {
    console.log('xinyin wasm initialized successfully');
    // let words32 = generate_xinyin_words32("不立文字", 100, 1983);
    // console.log('生成的32个密钥字：', words32);
    // console.log('-------------------------');
    // console.log('开始导入Solana地址...');
    // // 7tWEmKfxBwm517CQtbEVNNMGRQeZSN2gwuZWzmxkumTc
    // let words32_import = "坑节托专血且仙尘韧份似再日危勾戒忆导凤亿吁礼叮日市凹在扭宅电记从"
    // console.log('导入的32个密钥字：', words32_import);
    // let solana_address = import_xinyin_words32(words32_import, "不立文字", 6, 666, "local-encrypt-passphrase11");
    // console.log('导入的Solana地址：', solana_address);
    // console.log('开始签名消息...');
    // let message = "Hello, this is a test message.";
    // let encoder = new TextEncoder();
    // let messageUint8 = encoder.encode(message);
    // let signature = sign_message("7tWEmKfxBwm517CQtbEVNNMGRQeZSN2gwuZWzmxkumTc", messageUint8, "local-encrypt-passphrase9");
    // console.log('签名的消息：', message);
    // console.log('签名结果：', signature);
    // console.log('签名的消息长度：', signature.length);

    // // let publicKeyBase58 = "7tWEmKfxBwm517CQtbEVNNMGRQeZSN2gwuZWzmxkumTc";
    // // 假设 import_xinyin_words32 返回的 solana_address 包含公钥信息
    // // 你需要将 base58 公钥转为 Uint8Array

    // console.log('开始验证签名...');
    // let publicKeyUint8 = bs58('7tWEmKfxBwm517CQtbEVNNMGRQeZSN2gwuZWzmxkumTc');

    // // 签名通常是 base64 或 hex 编码，这里假设 signature 是 Uint8Array，如果不是请转换
    // // messageUint8 已经是 Uint8Array

    // (async () => {
    //     // 导入公钥为 CryptoKey
    //     let cryptoKey = await crypto.subtle.importKey(
    //         "raw",
    //         publicKeyUint8,
    //         {
    //             name: "Ed25519",
    //         },
    //         false,
    //         ["verify"]
    //     );

    //     let isValid = await crypto.subtle.verify(
    //         {
    //             name: "Ed25519"
    //         },
    //         cryptoKey,
    //         signature,
    //         messageUint8
    //     );

    //     console.log('签名验证结果：', isValid);
    // })();
}).catch(err => {
    console.error('Error initializing xinyin:', err);
});

export function saveEncryptedSkBase64(sk) {
    let size = walletsFileSync.getSize();
    let buf = new TextEncoder().encode(sk + '\n'); // 添加换行符以分隔每个密钥
    walletsFileSync.write(buf, { at: size });
    walletsFileSync.flush();
}

export function loadEncryptedSks() {
    let size = walletsFileSync.getSize();
    let buf = new ArrayBuffer(size);

    walletsFileSync.read(buf, { at: 0 });

    let sksTxt = new TextDecoder().decode(new Uint8Array(buf));
    let sks = sksTxt.split('\n').filter(line => line.trim() !== ''); // 过滤掉空行

    // console.log('加载的密钥列表：', sks);

    return sks;
}