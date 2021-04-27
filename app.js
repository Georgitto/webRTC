const ws = new WebSocket('ws://localhost:9000');
let SDP = {};
let backSDP = {};
let companion = {name:'', emoji:'', content:''};
const lc = new RTCPeerConnection();
const dc = lc.createDataChannel('channel');
const username = {name:'', emoji:'', content:''};
let key, cert, publicKey;
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

function find() {
    ws.send(JSON.stringify({type:'get-crypto', name: username.name}))
    setTimeout(() => {
        ws.send(JSON.stringify({type:'get-public', name: username.name}))
    }, 3000)
    companion.name = document.getElementsByClassName('username')[0].value;
    dc.onmessage = (e) => console.log(e.data);
    dc.onopen = (e) => console.log("Data Channel was opened.");

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
                ws.send(JSON.stringify({type:'get-crypto', name: username.name}))
                setTimeout(() => {
                    ws.send(JSON.stringify({type:'get-public', name: username.name}))
                }, 3000)
                backSDP = message.sdp;
                companion.name = message.name;
                companion.emoji = message.emoji;
                lc.onicecandidate = (e) => {
                    SDP = lc.localDescription;
                    console.log("New Ice Candidate. Reprinting SDP: ", JSON.stringify(lc.localDescription));
                };
                lc.ondatachannel = e => {
                    e.channel.onopen = d => console.log("Data Channel was opened successfully.");
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

            case 'get-crypto':
                key = message.key;
                cert = message.cert;
                break;

            case 'get-public':
                publicKey = message.publicKey;
                break;

            case 'sdp-back':
                companion.emoji = message.emoji;
                lc.setRemoteDescription(message.sdp).then(a => console.log('Remote Description was set.'));
                break;
        }

    };

    ws.send(JSON.stringify({type:'login', name: username.name, sdp: lc.localDescription}));
}
