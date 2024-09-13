const socket = io();
const canvas = document.getElementById('displayCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    console.log('Display canvas resized:', canvas.width, canvas.height);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let lastPoint = null;

socket.on('connect', () => {
    console.log('Display connected to server:', socket.id);
});

socket.on('draw', (data) => {
    console.log('Received draw event on display:', data);

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = data.color;

    const x = data.x * canvas.width;
    const y = data.y * canvas.height;

    console.log('Drawing at:', x, y);

    if (!lastPoint) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        lastPoint = { x, y };
        console.log('Starting new path at:', x, y);
    } else {
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        console.log('Drawing line from', lastPoint, 'to', { x, y });
        lastPoint = { x, y };
    }
});

socket.on('endPath', () => {
    console.log('Received end path event');
    lastPoint = null;
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

