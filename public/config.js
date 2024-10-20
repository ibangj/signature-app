const socket = io();

const container = document.getElementById('container');
const areas = document.querySelectorAll('.tablet-area');
const saveButton = document.getElementById('saveButton');

let activeArea = null;
let isResizing = false;
let startX, startY, startWidth, startHeight;

const ASPECT_RATIO = 16 / 9;

// Load existing configuration or set defaults
const storedConfig = localStorage.getItem('tabletAreasConfig');
const config = storedConfig ? JSON.parse(storedConfig) : {
    '1': { x: 0, y: 0.7, width: 0.14285714, height: 0.14285714 * (9/16) },
    '2': { x: 0.14285714, y: 0.7, width: 0.14285714, height: 0.14285714 * (9/16) },
    '3': { x: 0.28571428, y: 0.7, width: 0.14285714, height: 0.14285714 * (9/16) },
    '4': { x: 0.42857142, y: 0.7, width: 0.14285714, height: 0.14285714 * (9/16) },
    '5': { x: 0.57142857, y: 0.7, width: 0.14285714, height: 0.14285714 * (9/16) },
    '6': { x: 0.71428571, y: 0.7, width: 0.14285714, height: 0.14285714 * (9/16) },
    '7': { x: 0.85714285, y: 0.7, width: 0.14285714, height: 0.14285714 * (9/16) }
};

// Apply configuration to areas
function applyConfig() {
    areas.forEach((area, index) => {
        const areaConfig = config[index + 1];
        area.style.left = `${areaConfig.x * 100}%`;
        area.style.top = `${areaConfig.y * 100}%`;
        area.style.width = `${areaConfig.width * 100}%`;
        area.style.height = `${(areaConfig.width * 100) / ASPECT_RATIO}%`; // Ensure 16:9 aspect ratio
    });
    updateAspectRatioIndicators();
}

areas.forEach(area => {
    const handle = area.querySelector('.resize-handle');

    area.addEventListener('mousedown', (e) => {
        if (e.target === handle) {
            startResize(e, area);
        } else {
            startDrag(e, area);
        }
    });

    area.addEventListener('touchstart', (e) => {
        if (e.target === handle) {
            startResize(e.touches[0], area);
        } else {
            startDrag(e.touches[0], area);
        }
    });
});

function startDrag(e, area) {
    activeArea = area;
    startX = e.clientX - area.offsetLeft;
    startY = e.clientY - area.offsetTop;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopAction);
}

function startResize(e, area) {
    activeArea = area;
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = area.offsetWidth;
    startHeight = area.offsetHeight;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopAction);
}

function handleMouseMove(e) {
    if (!activeArea) return;
    if (isResizing) {
        resize(e);
    } else {
        drag(e);
    }
}

function drag(e) {
    const newLeft = e.clientX - startX;
    const newTop = e.clientY - startY;
    activeArea.style.left = `${newLeft}px`;
    activeArea.style.top = `${newTop}px`;
}

function resize(e) {
    const width = startWidth + (e.clientX - startX);
    const height = width / ASPECT_RATIO;
    activeArea.style.width = `${width}px`;
    activeArea.style.height = `${height}px`;
}

function stopAction() {
    activeArea = null;
    isResizing = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopAction);
    updateAspectRatioIndicators();
}

saveButton.addEventListener('click', saveConfig);

function saveConfig() {
    const config = {};
    const containerRect = container.getBoundingClientRect();
    areas.forEach((area, index) => {
        const rect = area.getBoundingClientRect();
        config[index + 1] = {
            x: (rect.left - containerRect.left) / containerRect.width,
            y: (rect.top - containerRect.top) / containerRect.height,
            width: rect.width / containerRect.width,
            height: rect.height / containerRect.height
        };
    });
    localStorage.setItem('tabletAreasConfig', JSON.stringify(config));
    
    fetch('/saveConfig', { method: 'POST', body: JSON.stringify(config), headers: {'Content-Type': 'application/json'} })
        .then(() => {
            alert('Configuration saved!');
            socket.emit('configUpdated', config);
        })
        .catch(error => console.error('Error saving configuration:', error));
}

function updateAspectRatioIndicators() {
    areas.forEach(area => {
        const indicator = area.querySelector('.aspect-ratio-indicator');
        const width = area.offsetWidth;
        const height = width / ASPECT_RATIO;
        indicator.style.width = `${width}px`;
        indicator.style.height = `${height}px`;
    });
}

// Set container size to match the aspect ratio of the background image
function resizeContainer() {
    const img = document.getElementById('backgroundImage');
    const container = document.getElementById('container');
    
    if (!img || !container) {
        console.error('Background image or container not found');
        return;
    }

    img.onload = function() {
        const imgAspectRatio = this.naturalWidth / this.naturalHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let containerWidth, containerHeight;
        if (windowWidth / windowHeight > imgAspectRatio) {
            containerHeight = windowHeight;
            containerWidth = containerHeight * imgAspectRatio;
        } else {
            containerWidth = windowWidth;
            containerHeight = containerWidth / imgAspectRatio;
        }
        
        container.style.width = `${containerWidth}px`;
        container.style.height = `${containerHeight}px`;
        applyConfig();
    };

    // Trigger the onload function if the image is already loaded
    if (img.complete) {
        img.onload();
    }
}

// Call resizeContainer when the window loads and resizes
document.addEventListener('DOMContentLoaded', () => {
    resizeContainer();
    window.addEventListener('resize', resizeContainer);
});

const backgroundImage = document.getElementById('backgroundImage');

socket.on('currentBackground', (background) => {
    backgroundImage.src = background;
    container.style.backgroundImage = `url(${background})`;
});

socket.on('backgroundUpdate', (newBackground) => {
    backgroundImage.src = newBackground;
    container.style.backgroundImage = `url(${newBackground})`;
});
