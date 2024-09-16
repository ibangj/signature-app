const socket = io();
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const canvasContainer = document.getElementById('canvasContainer');

let isDrawing = false;
let lastX = 0;
let lastY = 0;

console.log('Using Tablet ID:', window.tabletId);

function resizeCanvas() {
    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = canvasContainer.clientHeight;
    const aspectRatio = 16 / 9;

    let canvasWidth, canvasHeight;

    // Always use landscape orientation
    if (containerWidth / containerHeight > aspectRatio) {
        canvasHeight = containerHeight;
        canvasWidth = canvasHeight * aspectRatio;
    } else {
        canvasWidth = containerWidth;
        canvasHeight = canvasWidth / aspectRatio;
    }

    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    canvas.width = canvasWidth * window.devicePixelRatio;
    canvas.height = canvasHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set line style
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    console.log('Canvas resized to:', canvasWidth, 'x', canvasHeight);
}

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    socket.emit('draw', {
        tabletId: window.tabletId,
        x: x,
        y: y,
        type: 'start'
    });
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    ctx.lineTo(x * rect.width, y * rect.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x * rect.width, y * rect.height);

    socket.emit('draw', {
        tabletId: window.tabletId,
        x: x,
        y: y,
        type: 'draw'
    });
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        ctx.beginPath();
        socket.emit('draw', {
            tabletId: window.tabletId,
            type: 'end'
        });
    }
}

function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    return [
        e.clientX - rect.left,
        e.clientY - rect.top
    ];
}

// Add event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrawing(e.touches[0]);
});
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e.touches[0]);
});
canvas.addEventListener('touchend', stopDrawing);

// Initial canvas setup
resizeCanvas();

// Handle window resizing
window.addEventListener('resize', resizeCanvas);

console.log('Drawing setup complete');

socket.on('connect', () => {
    console.log('Connected to server');
});
