const socket = io();
const canvas = document.getElementById('displayCanvas');
const ctx = canvas.getContext('2d');

let tabletAreas = {};
let lastPoints = {};

// Load tablet areas configuration
function loadTabletAreas() {
    const storedConfig = localStorage.getItem('tabletAreasConfig');
    return storedConfig ? JSON.parse(storedConfig) : {
        '1': { x: 0, y: 0.7, width: 0.3, height: 0.3 * (9/16) },
        '2': { x: 0.35, y: 0.7, width: 0.3, height: 0.3 * (9/16) },
        '3': { x: 0.7, y: 0.7, width: 0.3, height: 0.3 * (9/16) }
    };
}

tabletAreas = loadTabletAreas();

// Set canvas size
function resizeCanvas() {
    const container = document.getElementById('container');
    const aspectRatio = 16 / 9;
    let canvasWidth, canvasHeight;

    if (window.innerWidth / window.innerHeight > aspectRatio) {
        canvasHeight = window.innerHeight;
        canvasWidth = canvasHeight * aspectRatio;
    } else {
        canvasWidth = window.innerWidth;
        canvasHeight = canvasWidth / aspectRatio;
    }

    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    canvas.width = canvasWidth * window.devicePixelRatio;
    canvas.height = canvasHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    console.log('Canvas resized to:', canvas.width, 'x', canvas.height);
}

function applyTabletAreas() {
    const backgroundImage = document.getElementById('backgroundImage');
    const imgRect = backgroundImage.getBoundingClientRect();

    Object.keys(tabletAreas).forEach(key => {
        const area = tabletAreas[key];
        tabletAreas[key] = {
            x: area.x * imgRect.width + imgRect.left,
            y: area.y * imgRect.height + imgRect.top,
            width: area.width * imgRect.width,
            height: area.height * imgRect.height
        };
    });
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Reload tablet areas when receiving a 'configUpdated' event
socket.on('configUpdated', () => {
    tabletAreas = loadTabletAreas();
});

socket.on('draw', (data) => {
    console.log('Received draw event:', data);

    const area = tabletAreas[data.tabletId];
    if (!area) {
        console.warn('No area defined for tablet:', data.tabletId);
        return;
    }

    const x = (area.x + data.x * area.width) * canvas.width;
    const y = (area.y + data.y * area.height) * canvas.height;

    console.log('Drawing at:', x, y, 'in area:', area);

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    if (data.type === 'start') {
        ctx.beginPath();
        ctx.moveTo(x, y);
        lastPoints[data.tabletId] = { x, y };
        console.log('Starting new path at:', x, y);
    } else if (data.type === 'draw') {
        if (lastPoints[data.tabletId]) {
            ctx.beginPath();
            ctx.moveTo(lastPoints[data.tabletId].x, lastPoints[data.tabletId].y);
            ctx.lineTo(x, y);
            ctx.stroke();
            console.log('Drawing line from', lastPoints[data.tabletId], 'to', { x, y });
        }
        lastPoints[data.tabletId] = { x, y };
    } else if (data.type === 'end') {
        lastPoints[data.tabletId] = null;
        console.log('Ending path');
    }
});

socket.on('connect', () => {
    console.log('Display connected to server');
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});
