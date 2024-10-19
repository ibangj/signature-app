const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/tablet', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tablet.html'));
});

app.get('/tablet/:id', (req, res) => {
    const id = req.params.id;
    if (['1', '2', '3', '4', '5','6','7'].includes(id)) {
        res.sendFile(path.join(__dirname, 'public', 'tablet.html'));
    } else {
        res.status(404).send('Tablet not found');
    }
});

app.get('/display', (req, res) => {
    res.sendFile(__dirname + '/public/display.html');
});

app.get('/config', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'config.html'));
});

app.post('/saveConfig', (req, res) => {
    // Save the configuration (you might want to implement this part)
    io.emit('configUpdated');
    res.sendStatus(200);
});

let currentBackground = 'background.jpg';

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    socket.emit('currentBackground', currentBackground);

    socket.on('backgroundChange', (newBackground) => {
        currentBackground = newBackground;
        io.emit('backgroundUpdate', newBackground);
    });

    socket.on('draw', (data) => {
        console.log('Draw event received:', data);
        io.emit('draw', data);  // Broadcast to all connected clients
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
