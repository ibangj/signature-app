const socket = io();
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

let drawing = false;
let lastPoint = null;

function startPosition(e) {
    drawing = true;
    lastPoint = null;
    draw(e);
}

function endPosition() {
    drawing = false;
    lastPoint = null;
    socket.emit('endPath');
}

function draw(e) {
    if (!drawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    if (lastPoint) {
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    lastPoint = { x, y };

    socket.emit('draw', { x, y, newPath: !lastPoint });
}

canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw);

let remoteLastPoint = null;

socket.on('draw', (data) => {
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    if (data.newPath || !remoteLastPoint) {
        remoteLastPoint = { x: data.x, y: data.y };
    } else {
        ctx.beginPath();
        ctx.moveTo(remoteLastPoint.x, remoteLastPoint.y);
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
        remoteLastPoint = { x: data.x, y: data.y };
    }
});

socket.on('endPath', () => {
    remoteLastPoint = null;
});
