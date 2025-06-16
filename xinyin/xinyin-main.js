
// import { get, set } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6.2.2/+esm';

// set('hello', 'world');

console.log('Initializing xinyin worker...2');

const xinyin_worker = new Worker('xinyin-worker.js', {
    type: 'module',
    name: 'xinyin-worker'
});

xinyin_worker.onmessage = (event) => {
    const { message_code, message } = event.data;
    processMessage(message_code, message);
};

function processMessage(message_code, message) {
    switch (message_code) {
        case 'words32_generated':
            console.log('生成的心印助记字:', message.words32);
            xinyin_worker.postMessage({
                message_code: 'import_xinyin_words32',
                message: { words32: message.words32, txt_in_heart: '你好，世界！', start: 6, count: 666, passphrase: 'local-encrypt-passphrase11' }
            });
            break;
        case 'solana_address_imported':
            console.log('导入的Solana地址:', message.solana_address);
            xinyin_worker.postMessage({
                message_code: 'sign_message',
                message: {
                    publicKey: message.solana_address,
                    messageUint8: new TextEncoder().encode('Hello, this is a test message.'),
                    passphrase: 'local-encrypt-passphrase11'
                }
            });
            break;
        case 'message_signed':
            console.log('签名的消息:', message.signature);
            break;
        default:
            console.error('Unknown message code:', message_code);
    }
}

export { xinyin_worker };