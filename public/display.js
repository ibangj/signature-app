const socket = io();
const canvas = document.getElementById('displayCanvas');
const ctx = canvas.getContext('2d');

let tabletAreas = {};
let lastPoints = {};

// Load tablet areas configuration
function loadTabletAreas() {
    const storedConfig = localStorage.getItem('tabletAreasConfig');
    return storedConfig ? JSON.parse(storedConfig) : {
        '1': { x: 0, y: 0.7, width: 0.2, height: 0.2 * (9/16) },
        '2': { x: 0.2, y: 0.7, width: 0.2, height: 0.2 * (9/16) },
        '3': { x: 0.4, y: 0.7, width: 0.2, height: 0.2 * (9/16) },
        '4': { x: 0.6, y: 0.7, width: 0.2, height: 0.2 * (9/16) },
        '5': { x: 0.8, y: 0.7, width: 0.2, height: 0.2 * (9/16) }
    };
}

tabletAreas = loadTabletAreas();

// Set canvas size
function resizeCanvas() {
    const backgroundImage = document.getElementById('backgroundImage');
    const imgRect = backgroundImage.getBoundingClientRect();

    canvas.width = imgRect.width;
    canvas.height = imgRect.height;
    canvas.style.width = `${imgRect.width}px`;
    canvas.style.height = `${imgRect.height}px`;

    // Reset the scale to 1 to avoid cumulative scaling
    ctx.setTransform(1, 0, 0, 1, 0, 0);

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
window.addEventListener('load', resizeCanvas);
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

    const backgroundImage = document.getElementById('backgroundImage');
    const imgRect = backgroundImage.getBoundingClientRect();

    const x = area.x * imgRect.width + data.x * area.width * imgRect.width;
    const y = area.y * imgRect.height + data.y * area.height * imgRect.height;

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

/*function visualizeTabletAreas() {
    const container = document.getElementById('container');
    const backgroundImage = document.getElementById('backgroundImage');
    const imgRect = backgroundImage.getBoundingClientRect();

    Object.keys(tabletAreas).forEach(key => {
        const area = tabletAreas[key];
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = `${area.x * imgRect.width}px`;
        div.style.top = `${area.y * imgRect.height}px`;
        div.style.width = `${area.width * imgRect.width}px`;
        div.style.height = `${area.height * imgRect.height}px`;
        div.style.border = '2px solid red';
        div.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
        div.style.zIndex = '1000';
        container.appendChild(div);
    });
}

visualizeTabletAreas();
*/