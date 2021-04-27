const express = require("express");
const openssl = require('openssl-nodejs')
const WebSocket = require("ws");
const fs = require('fs')
const http = require("http");
const https = require("https")
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = process.env.PORT || 9000;
let options = {
    // key: fs.readFileSync(__dirname + '/certs/privateKey.key'),
    // cert: fs.readFileSync(__dirname + '/certs/certificate.crt')
}
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

let users = {};

const sendTo = (connection, message) => {
    connection.send(JSON.stringify(message));
};

let genCert = function (id) {
    openssl( 'openssl req -nodes -new -x509 -keyout ' + id + '.key -subj /C=RU/ST=Moscow/L=Moscow/O=MIREA/OU=DevOps/CN=p2pmes.ru/emailAddress=gshaporenko200@mail.ru -out ' + id + '.cert', function (err, buffer) {
        console.log("Creating cert: " + buffer.toString(), err.toString());
    });

}
let getPublicKey = function (id) {
    openssl(`openssl x509 -pubkey -in ${id}.cert -out ${id + '-public'}.pem`, function (buffer, err) {
        console.log("Get public key: " + buffer.toString(), err.toString())
    })
}

const sendToAll = (clients, type, { id, name: userName }) => {
    Object.values(clients).forEach(client => {
        if (client.name !== userName) {
            client.send(
                JSON.stringify({
                    type,
                    user: { id, userName }
                })
            );
        }
    });
};

wss.on('open', ws => {
    console.log(1)
})

wss.on("connection", ws => {
    ws.on("message", msg => {
        let data;
        //accept only JSON messages
        try {
            data = JSON.parse(msg);
        } catch (e) {
            console.log("Invalid JSON");
            data = {};
        }
        const { type, name, offer, answer, sdp, emoji } = data;
        switch (type) {
            //when a user tries to login
            case "login":
                //Check if username is available
                if (users[name]) {
                    sendTo(ws, {
                        type: "login",
                        success: false,
                        message: "Username is unavailable"
                    });
                } else {
                    const id = uuidv4();
                    genCert(id);
                    const loggedIn = Object.values(
                        users
                    ).map(({ id, name: userName }) => ({ id, userName }));
                    users[name] = ws;
                    ws.name = name;
                    ws.id = id;
                    sendTo(ws, {
                        type: "login",
                        success: true,
                        users: loggedIn,
                        // key: fs.readFileSync(__dirname + `/openssl/${id}.key`),
                        // cert: fs.readFileSync(__dirname + `/openssl/${id}.cert`)
                    });
                    sendToAll(users, "updateUsers", ws);
                }
                break;
            case "offer":
                //Check if user to send offer to exists
                const offerRecipient = users[name];
                if (!!offerRecipient) {
                    sendTo(offerRecipient, {
                        type: "offer",
                        offer,
                        name: ws.name
                    });
                } else {
                    sendTo(ws, {
                        type: "error",
                        message: `User ${name} does not exist!`
                    });
                }
                break;
            case "answer":
                //Check if user to send answer to exists
                const answerRecipient = users[name];
                if (!!answerRecipient) {
                    sendTo(answerRecipient, {
                        type: "answer",
                        answer,
                    });
                } else {
                    sendTo(ws, {
                        type: "error",
                        message: `User ${name} does not exist!`
                    });
                }
                break;

            case "leave":
                sendToAll(users, "leave", ws);
                break;

            case 'sdp':
                const Candidate = users[name];
                console.log(data)
                if (!!Candidate) {
                    sendTo(Candidate, {type: 'sdp', name: ws.name, sdp, emoji})
                }
                break;

            case 'sdp-back':
                const backCandidate = users[name];
                if (!!backCandidate) {
                    sendTo(backCandidate, {type: 'sdp-back', name: ws.name, sdp, emoji})
                }
                break;

            case 'get-crypto':
                getPublicKey(users[name].id)
                if (!!users[name]) sendTo(users[name], {type: 'get-crypto',
                    key: fs.readFileSync(__dirname + `/openssl/${users[name].id}.key`),
                    cert: fs.readFileSync(__dirname + `/openssl/${users[name].id}.cert`)}
                    )
                break;

            case 'get-public':
                if (!!users[name]) sendTo(users[name], {type: 'get-public',
                    publicKey: fs.readFileSync(__dirname + `/openssl/${users[name].id}-public.pem`)}
                )
                break;

            default:
                sendTo(ws, {
                    type: "error",
                    message: "Command not found: " + type
                });
                break;
        }
        console.log(Object.keys(users))
    });
    ws.on("close", function() {
        console.log(ws.name + " left us.");
        delete users[ws.name];
        sendToAll(users, "leave", ws);
    });

    ws.send(
        JSON.stringify({
            type: "connect",
            message: "Connecting to signaling server was established."
        })
    );
});
//start our server
server.listen(port, () => {
    console.log(`Signalling Server running on port: ${port}`);
    console.log(users)
});

/*
<html>
<head>
    <title>
    </title>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type">
    <link rel="stylesheet" type="text/css" href="//index.from.sh/index.css" />
    <script type="text/javascript" src="//index.from.sh/index.js"></script>
</head>
<body>
</body>
</html>


 */