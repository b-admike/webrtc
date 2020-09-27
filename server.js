const express = require('express');

var io = require('socket.io')({
    path: '/webrtc'
})

const app = express();
const port = 8080;

app.use(express.static(__dirname + '/build'));
app.get('/', (req, res, next) => {
    res.sendFile(__dirname + '/build/index.html')
})

const server = app.listen(port, () => {console.log(`listening on http://localhost:8080`)});

io.listen(server);

const peers = io.of('/webrtcPeer');
let connectedPeers = new Map();

peers.on('connection', socket => {
    console.log('server socket ', socket.id);
    socket.emit('connection-success', {success: socket.id})
    connectedPeers.set(socket.id, socket)
    socket.on('disconnect', () => {
        console.log('disconnected');
        connectedPeers.delete(socket.id);
    })

    socket.on('offerOrAnswer', (data) => {
        // send to all peers except self
        for (const [socketId, socket] of connectedPeers.entries()) {
            if (socketId !== data.socketID) {
                console.log(socketId, data.payload.type);
                socket.emit('offerOrAnswer', data.payload);
            }
        }
    })

    socket.on('candidate', (data) => {
        // send to all peers except self
        for (const [socketId, socket] of connectedPeers.entries()) {
            if (socketId !== data.socketID) {
                console.log(socketId, data.payload.type);
                socket.emit('candidate', data.payload);
            }
        }
    })
})
