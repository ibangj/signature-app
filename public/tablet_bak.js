const socket = io();
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');

let drawing = false;
let currentColor = '#000000'; // Default color is black

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    console.log('Canvas resized:', canvas.width, canvas.height);
}

function startDrawing(e) {
    drawing = true;
    draw(e);
    console.log('Started drawing');
}

function stopDrawing() {
    drawing = false;
    ctx.beginPath();
    socket.emit('endPath');
    console.log('Stopped drawing');
}

function draw(e) {
    if (!drawing) return;
    
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.strokeStyle = currentColor;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    const drawEvent = {
        x: x / canvas.width,
        y: y / canvas.height,
        color: currentColor
    };
    console.log('Emitting draw event', drawEvent);
    socket.emit('draw', drawEvent, (acknowledgement) => {
        if (acknowledgement) {
            console.log('Draw event acknowledged by server');
        } else {
            console.warn('No acknowledgement received for draw event');
        }
    });
}

colorPicker.addEventListener('change', (e) => {
    currentColor = e.target.value;
    console.log('Color changed:', currentColor);
});

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

socket.on('connect', () => {
    console.log('Tablet connected to server:', socket.id);
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});
