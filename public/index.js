const socket = io();
const backgroundSelect = document.getElementById('backgroundSelect');

// Load saved background
const savedBackground = localStorage.getItem('selectedBackground');
if (savedBackground) {
    backgroundSelect.value = savedBackground;
}

backgroundSelect.addEventListener('change', (e) => {
    const selectedBackground = e.target.value;
    localStorage.setItem('selectedBackground', selectedBackground);
    socket.emit('backgroundChange', selectedBackground);
});

