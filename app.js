const ws = new WebSocket('ws://localhost:9000');
let SDP = {};
let backSDP = {};
let companion = {name:'', emoji:'', content:''};
const lc = new RTCPeerConnection();
const dc = lc.createDataChannel('channel');
const username = {name:'', emoji:'', content:''};
let certID, verifyInfo;
let createURL, getURL, accessKey;

accessKey = 'access_key=08ddb67f2616a0d3f0734279dc1ea3a6';
createURL = 'https://api.zerossl.com/certificates' + '?' + accessKey;
getURL = 'https://api.zerossl.com/certificates/';

username.name = prompt('Enter your name:', 'Garry');
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

function createCert() {
    let formData = new FormData();
    formData.append('certificate_domains', 'p2pmes.ru');
    formData.append('certificate_validity_days', '90');
    formData.append('certificate_csr', '-----BEGIN CERTIFICATE REQUEST-----MIICozCCAYsCAQAwXjELMAkGA1UEBhMCUlUxEjAQBgNVBAMMCXAycG1lcy5ydTEPMA0GA1UEBwwGTW9zY293MQwwCgYDVQQKDANHU0gxDzANBgNVBAgMBk1vc2NvdzELMAkGA1UECwwCSVQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCjIynGC+HEu3jqncdwJWEjM5s+9IWu1c/wYotVBpU08/emCYK0kguRo7MrmX2gvRPxwkQDX14TVmwKpuOXVcvXXs6RgxYUdU+cGwQZ/MBXP1TbbRtApVSvEjg1oJM6tt7Hr1lt+Nbw316kfybaiB4SBr5e3hxB+sJZl/Uqlhyn1L+phoTzxf1mzmDkDDna0Jy/TP5XryhjbV59kQPkGKRnMY9Loi9ii3HPehA5w+vHr3QCgqdyaFgZgmNXEUul614jUtXKSY7bu37M8qh7nFxY8eusfNcCJIWrwY7fArJu9AICfCOiNfw0RVeBViptPNpJy5aCfYvsPuPnXd/q2u39AgMBAAGgADANBgkqhkiG9w0BAQsFAAOCAQEAaoKIzIe8VIeXyYNe9KE253H56oxTBqAqMH2Esb2V8jPNTUHdOpHKrpn/1d51fqkRDnwa9YkAe+b4xu1TXDAUW7YTT4g9S7E4HmnXutslTM5ykRcFeXR5ffEo8iMVTfdEgRTiHJCRWDCKc9DnlkG+vIGHjvnQrr5eNmSEPbyLniOv5+Ogo97B+jKqbKhaCZJ/tUyt0JJNUTwUJdOGYGDqHrRxuwz3qSSk9/E7UdSrTMN+b3YcP+ADwGVKzeiszaYu8Dr3plSAYm+Lb3nZKltyYuBb1dl3kjku4msmzdgrnEUKYNgrOTSGJ+s3kGeYTw1ND8ukUvqVTjfcyYpAtLrgAQ==-----END CERTIFICATE REQUEST-----');
    fetch(createURL, {
        method: 'POST',
        body: formData
    }).then(response => response.json()).then(result => {
        certID = result.id;
        verifyInfo = result.validation.other_methods['p2pmes.ru'].file_validation_content;
        console.log(result)
    })
}

function getCert(id) {
    let certInfo = {};
    fetch(getURL + id + '?' + accessKey, {
        method: 'GET'
    }).then(response => response.json()).then(result => certInfo = result);
    return certInfo;
}

function checkCert(certInfo) {
    return certInfo.status === 'issued' && (certInfo.validation_type === 'HTTP_CSR_HASH' || certInfo.validation_type === 'HTTPS_CSR_HASH');
}

function find() {
    //ws.send(JSON.stringify({type:'get-crypto', name: username.name}))
    companion.name = document.getElementsByClassName('username')[0].value;
    dc.onmessage = (e) => console.log(e.data);
    dc.onopen = (e) => {
        console.log("Data Channel was opened.")
        dc.send(certID)
    };

    lc.ondatachannel = e => {
        e.channel.onmessage = message => {
            console.log(message);
            insertMessageToDOM({name: companion.name, emoji: companion.emoji, content:message.data}, false)
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

    dc.send(value);

    insertMessageToDOM({name: username.name, emoji: username.emoji, content:value}, true)
});

ws.onopen = () => {
    console.log("It works!!!");
    createCert();
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
                // ws.send(JSON.stringify({type:'get-crypto', name: username.name}))
                // setTimeout(() => {
                //     ws.send(JSON.stringify({type:'get-public', name: username.name}))
                // }, 3000)
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
                        e.channel.send(certID)
                    };
                    e.channel.onmessage = message => {
                        console.log(message);
                        insertMessageToDOM({name: companion.name, emoji: companion.emoji, content:message.data}, false)
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

            // case 'get-crypto':
            //     key = message.key;
            //     cert = message.cert;
            //     break;
            //
            // case 'get-public':
            //     publicKey = message.publicKey;
            //     break;

            case 'sdp-back':
                companion.emoji = message.emoji;
                lc.setRemoteDescription(message.sdp).then(a => console.log('Remote Description was set.'));
                break;
        }

    };

    ws.send(JSON.stringify({type:'login', name: username.name, sdp: lc.localDescription}));
}

