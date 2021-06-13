const ws = new WebSocket('ws://localhost:9000');
let SDP = {};
let backSDP = {};
let companion = {name:'', emoji:'', content:''};
const lc = new RTCPeerConnection();
const dc = lc.createDataChannel('channel');
const username = {name:'', emoji:'', content:''};
const bits = 256;
let enc = new TextEncoder()
let dec = new TextDecoder()
let publicKey, privateKey, otherPublicKey, partial, otherPartial, fullKey, iv;

username.name = prompt('Введите имя:', 'Пётр');
const possibleEmojis = [
    '🐀','🐁','🐭','🐹','🐂','🐃','🐄','🐮','🐅','🐆','🐯','🐇','🐐','🐑','🐏','🐴',
    '🐎','🐱','🐈','🐰','🐓','🐔','🐤','🐣','🐥','🐦','🐧','🐘','🐩','🐕','🐷','🐖',
    '🐗','🐫','🐪','🐶','🐺','🐻','🐨','🐼','🐵','🙈','🙉','🙊','🐒','🐉','🐲','🐊',
    '🐍','🐢','🐸','🐋','🐳','🐬','🐙','🐟','🐠','🐡','🐚','🐌','🐛','🐜','🐝','🐞',
];
username.emoji = randomEmoji();

function randomEmoji() {
    const randomIndex = Math.floor(Math.random() * possibleEmojis.length);
    return possibleEmojis[randomIndex];
}
let otherCertificate, certificate = '-----BEGIN CERTIFICATE-----\n' +
    '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\n' +
    'fOFlGmxwQ5s+sAcsQ7NaJUTkIw==\n' +
    '-----END CERTIFICATE-----';

let PK = 'MIIEwAIBADANBgkqhkiG9w0BAQEFAASCBKowggSmAgEAAoIBAQDwxOlWO8Kk42JD\n' +
    'pXRns8BnGYZo9K3KVnRPOtesfoeetBiSSQifDA5+z2e2a5KRxa7iz5864QsF53VG\n' +
    'N8VGnngKlcafLH5jfXm00aAyY28A9lfTVRsVW9fgeiq62uZppnav7C0HorsZQRoi\n' +
    'YDDkDwFKRTecuETjJ0DyZixnvUltwG0iPhrOCnvVtZT6pNB9lhr3QU7km3qfKZ3z\n' +
    '1qr1Ak170491/l37P2ThvupxIosRi04MDDM0huUleaUzuNHTumqEGIPfVBCm860Z\n' +
    'ipwm3uQq9vw89GHFfsdroP2CGOhzLxV/NVdFjFON8U9HSJQdVT0iwV41wJILhsav\n' +
    'syLToKHpAgMBAAECggEBALUQED3WYTFpAmvG0HxwNEAUdP0XDF7+lydCJBFHciwK\n' +
    'WfQg0kfxZDE/Pkp0KVxQoo1U//Tiaky9XHc617Oc1r93FVB8wGuHX/B4OJXMKx05\n' +
    'JKD7/osYb4cTuHCez+oh0l3IKbD1UujSCZpSZlILarf0x7am6L8+tNvVtI0rTz4l\n' +
    'o0JBEZ+FhM4lTO9aCaPdoyDedaVuXkEYxkm7yk/4PH3KlqrXmzcgfntpEPta+J0z\n' +
    '08q19nbdDfhmAe22fUd+aM8vbMts0XovQUn1OhEdQU+KJHkVLBRvBScnDmxYBet2\n' +
    'G3V4X1mknbM9msfkcN6hU9G4lDL1q2M4ht54KP9D8IECgYEA+b5fS4Kt5wvMVl2a\n' +
    'JefmdVNgScHIvsCUu8EKyK429lsBQs4sKPzKxKAJN3lz/9qIcR6NGfZwxhdoFrXL\n' +
    'Rpg5vUQKP17mzJ0X1v6EAY3hqBf/0efBLZzptM6zMUdmNhoJOYF9bt8lfdlmhQ6l\n' +
    'PIxB4xFoH8SL0Xx2IzAFOFrKS7kCgYEA9sz8Ob9/8TEEWRCEC9kbPch64d4RAnu2\n' +
    'qkjZ1eJdgpgCTCDx8EUVbA9T3jZ/GB/WU8kcoTggOZxm/Yq1d2vqORET1KzBvaby\n' +
    'C2x5fvpVX8krA7ujYjvbllF3IFU9DNMpTbYsW/j9VlOi2DJLcMYvoeDfoCDR8d+3\n' +
    'jRc06at9/7ECgYEA2EFFqVAuH8wyk3KX4UzuXRfmX9fCaZK+99mP6fgZNbfV3rBC\n' +
    'wvcq6ZoegP/VN25XCYTH7/xa6N0pz8h5jdaQ4NfC+97Egddh5lQboHDoPrMRXQSO\n' +
    'XV3rbRozRm+qDRz8ceQz5kap41DWGk91O3nEL8hJ3oBGBg79CTkyu/q6A1kCgYEA\n' +
    'ugU1U32QvMXaZhs5vAhvLPlQDbCol3uR6fWxIzJUkxtqF+F5GkWn6OQArevbjd5p\n' +
    'WIusZaP9Pg8x3YbQUmvnhg3mKZXxDbaol42yYc/jy6fAITcr5d4CG+HZbWhx9Jmw\n' +
    'dx+JfeVFZezyQAxgqmbm/heV1ocGV03tdo34Vuvos3ECgYEAhRLjyhpG/1Yvv9kJ\n' +
    '5X2x0IAahD3nrB8Gr1MZ/RNTm4e3Ad/xY/00Sj1EB/s0EU1lWBdbB7aPHXJ18iXe\n' +
    'tENoK9NjzktiEQkAgNTG9jwlixHI9zJX6bUH1HKwfS/RlmcsfDD4tP1kjPyGz1he\n' +
    'XqJlHlQNXLKG8KNeOrzy585jS+I=\n';

const modExp = function (a, b, n) {
    a = a % n;
    let result = 1n;
    let x = a;
    while (b > 0) {
        let leastSignificantBit = b % 2n;
        b = b / 2n;
        if (leastSignificantBit === 1n) {
            result = result * x;
            result = result % n;
        }
        x = x * x;
        x = x % n;
    }
    return result;
};

function bnToBuf(bn) {
    let hex = BigInt(bn).toString(16);
    if (hex.length % 2) { hex = '0' + hex; }

    let len = hex.length / 2;
    let u8 = new Uint8Array(len);

    let i = 0;
    let j = 0;
    while (i < len) {
        u8[i] = parseInt(hex.slice(j, j+2), 16);
        i += 1;
        j += 2;
    }

    return u8;
}

function find() {

    companion.name = document.getElementsByClassName('username')[0].value;
    dc.onmessage = (message) => {
        console.log(message.data)
        let data = JSON.parse(message.data)
        switch (data.type) {

            case 'message':
                console.log(data.message)
                window.crypto.subtle.decrypt({
                    name: "AES-GCM",
                    iv: new Uint8Array(data.iv)
                }, fullKey, new Uint8Array(data.message).buffer).then(res => {
                    console.log(5555)
                    insertMessageToDOM({name: companion.name, emoji: companion.emoji, content:dec.decode(res)}, false);
                })
                break;

            case 'cert':
                otherCertificate = forge.pki.certificateFromPem(data.cert);
                if (otherCertificate.issuer.attributes[1].value === 'ZeroSSL') {
                    forge.prime.generateProbablePrime(bits, function(err, num) {
                        publicKey = BigInt(num)
                        forge.prime.generateProbablePrime(bits, function(err, num) {
                            privateKey = BigInt(num)
                            dc.send(JSON.stringify({type: 'public-key', pubKey: publicKey.toString()}))
                        });
                    });
                } else {
                    alert('Сертификат пользователя не зверен центром сертификации.')
                    dc.close()
                }
                break;

            case 'public-key':
                console.log('Other public key:', data.pubKey)
                otherPublicKey = BigInt(data.pubKey);
                partial = modExp(publicKey, privateKey, otherPublicKey)
                dc.send(JSON.stringify({type: 'partial', partial: partial.toString()}))
                break;

            case  'partial':
                otherPartial = BigInt(data.partial);
                fullKey = modExp(otherPartial, privateKey, otherPublicKey);
                crypto.subtle.importKey(
                    "raw",
                    bnToBuf(fullKey),
                    "AES-GCM",
                    true,
                    ["encrypt", "decrypt"]
                ).then((result) => {
                    console.log('Key was created!')
                    fullKey = result;
                    alert('Соединение установлено!')
                }).catch(err => console.log(err))
                break;
        }
    }
    dc.onopen = (e) => {
        console.log("Data Channel was opened.")
        certificate = document.getElementsByClassName('input')[0].value
        dc.send(JSON.stringify({type: 'cert', cert: certificate}))
    };

    lc.ondatachannel = e => {
        e.channel.onmessage = message => {
            let data = JSON.parse(message.data)
            switch (data.type) {

                case 'message':
                    console.log(data.message)
                    window.crypto.subtle.decrypt({
                        name: "AES-GCM",
                        iv: new Uint8Array(data.iv)
                    }, fullKey, new Uint8Array(data.message).buffer).then(res => {
                        console.log(5555)
                        insertMessageToDOM({name: companion.name, emoji: companion.emoji, content:dec.decode(res)}, false);
                    })
                    break;

                case 'cert':
                    otherCertificate = forge.pki.certificateFromPem(data.cert);
                    if (otherCertificate.issuer.attributes[1].value === 'ZeroSSL') {
                        forge.prime.generateProbablePrime(bits, function(err, num) {
                            publicKey = BigInt(num)
                            forge.prime.generateProbablePrime(bits, function(err, num) {
                                privateKey = BigInt(num)
                                dc.send(JSON.stringify({type: 'public-key', pubKey: publicKey.toString()}))
                            });
                        });
                    } else {
                        alert('Сертификат пользователя не зверен центром сертификации.')
                        dc.close()
                    }
                    break;

                case 'public-key':
                    console.log('Other public key:', data.pubKey)
                    otherPublicKey = BigInt(data.pubKey);
                    partial = modExp(publicKey, privateKey, otherPublicKey)
                    dc.send(JSON.stringify({type: 'partial', partial: partial.toString()}))
                    break;

                case  'partial':
                    otherPartial = BigInt(data.partial);
                    fullKey = modExp(otherPartial, privateKey, otherPublicKey);
                    crypto.subtle.importKey(
                        "raw",
                        bnToBuf(fullKey),
                        "AES-GCM",
                        true,
                        ["encrypt", "decrypt"]
                    ).then((result) => {
                        console.log('Key was created!')
                        fullKey = result;
                        alert('Соединение установлено!')
                    }).catch(err => console.log(err))
                    break;
            }
        }
    }

    lc.onicecandidate = (e) => {
        SDP = lc.localDescription;
        console.log("New Ice Candidate. Reprinting SDP: ", JSON.stringify(lc.localDescription));
    };
    lc.createOffer().then(sdp => {
        lc.setLocalDescription(sdp).then(()=> {
            console.log("Local Description was set.(offer)")
            console.log(SDP)
            setTimeout(()=>{
                ws.send(JSON.stringify({type:'sdp', name: companion.name, sdp: SDP, emoji:username.emoji}))
            }, 1000)

        });
    });
}

function insertMessageToDOM(options, isFromMe) {
    const template = document.querySelector('template[data-template="message"]');
    const nameEl = template.content.querySelector('.message__name');
    if (options.emoji || options.name) {
        nameEl.innerText = options.emoji + ' ' + options.name;
    }
    template.content.querySelector('.message__bubble').innerText = options.content;
    const clone = document.importNode(template.content, true);
    const messageEl = clone.querySelector('.message');
    if (isFromMe) {
        messageEl.classList.add('message--mine');
    } else {
        messageEl.classList.add('message--theirs');
    }

    const messagesEl = document.querySelector('.messages');
    messagesEl.appendChild(clone);

    // Scroll to bottom
    messagesEl.scrollTop = messagesEl.scrollHeight - messagesEl.clientHeight;
}

const form = document.querySelector('form');
form.addEventListener('submit', () => {
    let value = document.querySelectorAll('input[type="text"]')[1].value;
    document.querySelectorAll('input[type="text"]')[1].value = '';
    iv = crypto.getRandomValues(new Uint8Array(12))
    crypto.subtle.encrypt({
            name: "AES-GCM",
            iv: iv,
        },
        fullKey,
        enc.encode(value)
    ).then((res) => {
        res = new Uint8Array(res);
        res = [...res]
        dc.send(JSON.stringify({type: 'message', message: res, iv: [...iv]}));
    })

    insertMessageToDOM({name: username.name, emoji: username.emoji, content:value}, true)
});

ws.onopen = () => {
    console.log("It works!!!");

    ws.onmessage = (data) => {
        console.log(data.data)

        let message;
        try {
            message = JSON.parse(data.data)
        }
        catch (e) {
            console.log("Invalid JSON");
            message = {}
        }

        switch (message.type) {
            case 'sdp':
                backSDP = message.sdp;
                companion.name = message.name;
                companion.emoji = message.emoji;
                lc.onicecandidate = (e) => {
                    SDP = lc.localDescription;
                    console.log("New Ice Candidate. Reprinting SDP: ", JSON.stringify(lc.localDescription));
                };
                lc.ondatachannel = e => {
                    e.channel.onopen = d => {
                        console.log("Data Channel was opened successfully.")

                        certificate = document.getElementsByClassName('input')[0].value
                        e.channel.send(JSON.stringify({type: 'cert', cert: certificate}))
                    };
                    e.channel.onmessage = message => {
                        console.log(message.data);
                        let data = JSON.parse(message.data)
                        switch (data.type) {
                            case 'message':
                                window.crypto.subtle.decrypt({
                                    name: "AES-GCM",
                                    iv: new Uint8Array(data.iv)
                                }, fullKey, new Uint8Array(data.message).buffer).then(res => {
                                    insertMessageToDOM({name: companion.name, emoji: companion.emoji, content:dec.decode(res)}, false);
                                })
                                break;

                            case 'key':
                                window.crypto.subtle.importKey('spki', new Uint8Array(data.key).buffer, {
                                    name: "RSA-OAEP",
                                    modulusLength: 4096,
                                    publicExponent: new Uint8Array([1, 0, 1]),
                                    hash: "SHA-256"
                                }, true, ['encrypt']).then(res => {
                                    console.log(res)
                                    otherPublicKey = res;
                                })
                                break;

                            case 'cert':
                                otherCertificate = forge.pki.certificateFromPem(data.cert);
                                if (otherCertificate.issuer.attributes[1].value === 'ZeroSSL') {
                                    forge.prime.generateProbablePrime(bits, function(err, num) {
                                        publicKey = BigInt(num)
                                        forge.prime.generateProbablePrime(bits, function(err, num) {
                                            privateKey = BigInt(num)
                                            dc.send(JSON.stringify({type: 'public-key', pubKey: publicKey.toString()}))
                                        });
                                    });
                                } else {
                                    alert('Сертификат пользователя не зверен центром сертификации.')
                                    dc.close()
                                }
                                break;

                            case 'public-key':
                                console.log('Other public key:', data.pubKey)
                                otherPublicKey = BigInt(data.pubKey);
                                partial = modExp(otherPublicKey, privateKey, publicKey)
                                e.channel.send(JSON.stringify({type: 'partial', partial: partial.toString()}))
                                break;

                            case  'partial':
                                otherPartial = BigInt(data.partial);
                                fullKey = modExp(otherPartial, privateKey, publicKey)
                                crypto.subtle.importKey(
                                    "raw",
                                    bnToBuf(fullKey),
                                    "AES-GCM",
                                    true,
                                    ["encrypt", "decrypt"]
                                ).then((result) => {
                                    console.log('Key was created!')
                                    fullKey = result;
                                    alert('Соединение установлено!')
                                }).catch(err => console.log(err))
                                break;
                        }
                    }
                }
                lc.setRemoteDescription(message.sdp).then(a => console.log("Remote Description was set."));
                lc.createAnswer().then(sdp => {
                    SDP = sdp;
                    lc.setLocalDescription(sdp).then(a => {
                        console.log("Local Description was set.(answer)")
                        ws.send(JSON.stringify({type:'sdp-back', name: message.name, sdp: SDP, emoji: username.emoji}))
                    })
                })
                break;


            case 'sdp-back':
                companion.emoji = message.emoji;
                lc.setRemoteDescription(message.sdp).then(a => console.log('Remote Description was set.'));
                break;
        }

    };

    ws.send(JSON.stringify({type:'login', name: username.name, sdp: lc.localDescription}));
}

