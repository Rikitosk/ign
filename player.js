// Sample music data
const music = [
    { title: "Parasite", artist: "Darx", src: "/music/Darx - Parasite.mp3" },
    { title: "Lost in the City Lights", artist: "Cosmo Sheldrake", src: "/music/Lost_in_the_City_Lights.mp3" },
    { title: "A New Beginning", artist: "Benjamin Tissot", src: "/music/A_New_Beginning.mp3" },
    { title: "The Epic Journey", artist: "Scott Buckley", src: "/music/The_Epic_Journey.mp3" },
    { title: "Cinematic Chillout", artist: "A.V.A.", src: "/music/Cinematic_Chillout.mp3" },
    { title: "Inspiring Corporate", artist: "Bensound", src: "/music/Inspiring_Corporate.mp3" },
    { title: "Dreamy Atmosphere", artist: "Serge Quadrado", src: "/music/Dreamy_Atmosphere.mp3" },
    { title: "Ambient Background", artist: "Lofi", src: "/music/Ambient_Background.mp3" },
    { title: "Upbeat Corporate", artist: "Corporate Music", src: "/music/Upbeat_Corporate.mp3" },
    { title: "Acoustic Pop", artist: "Acoustic Guitar", src: "/music/Acoustic_Pop.mp3" },
];

// Add random rating and plays to each track
music.forEach(track => {
    track.rating = Math.floor(Math.random() * 5) + 1;
    track.plays = Math.floor(Math.random() * (1000000 - 10000 + 1)) + 10000;
});

let currentTrackIndex = 0;
let isPlaying = false;
let audioContext;
let analyser;
let dataArray;
let canvasCtx;
let canvas;
let animationId;

const audio = document.getElementById('audio-element');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const trackName = document.getElementById('track-name');
const artistName = document.getElementById('artist-name');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const musicListContainer = document.getElementById('music-list-container');
const showAllBtn = document.getElementById('show-all-btn');

// Initialize audio context and analyzer
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.7;
        
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        canvas = document.getElementById('equalizer-canvas');
        canvasCtx = canvas.getContext('2d');
        
        updateCanvasSize();
    }
}

function updateCanvasSize() {
    const container = document.getElementById('equalizer-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

function getColor(index, total, value) {
    const normalizedValue = value / 255;
    const hueBase = 200 + (index / total) * 60;
    return `hsla(${hueBase}, 100%, ${50 + normalizedValue * 20}%, ${0.5 + normalizedValue * 0.5})`;
}

function drawCircle() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    // Увеличиваем радиус круга на 20%
    const radius = Math.min(canvas.width, canvas.height) * 0.4; // было 0.3
    
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Увеличиваем количество сегментов для более плавного круга
    const segmentCount = 180; // было 150
    
    const segmentAngle = (Math.PI * 2) / segmentCount;
    
    // Увеличиваем толщину внешнего круга
    canvasCtx.strokeStyle = 'rgba(100, 220, 255, 0.2)'; // увеличили прозрачность
    canvasCtx.lineWidth = 3; // было 2
    canvasCtx.beginPath();
    canvasCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    canvasCtx.stroke();
    
    for (let i = 0; i < segmentCount; i++) {
        const value = dataArray[i % dataArray.length];
        // Увеличиваем длину сегментов на 30%
        const segmentHeight = (value / 255) * radius * 0.8; // было 0.6
        
        const angle = segmentAngle * i;
        const startX = centerX + Math.cos(angle) * radius;
        const startY = centerY + Math.sin(angle) * radius;
        const endX = centerX + Math.cos(angle) * (radius + segmentHeight);
        const endY = centerY + Math.sin(angle) * (radius + segmentHeight);
        
        // Увеличиваем толщину линий и их свечение
        const lineGradient = canvasCtx.createLinearGradient(startX, startY, endX, endY);
        lineGradient.addColorStop(0, getColor(i, segmentCount, value));
        lineGradient.addColorStop(0.7, getColor(i, segmentCount, value * 0.8)); // добавили промежуточный стоп
        lineGradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        canvasCtx.strokeStyle = lineGradient;
        // Увеличиваем базовую толщину линий
        canvasCtx.lineWidth = 3 + (value / 255) * 8; // было 2 + (value / 255) * 6
        canvasCtx.beginPath();
        canvasCtx.moveTo(startX, startY);
        canvasCtx.lineTo(endX, endY);
        canvasCtx.stroke();
        
        // Увеличиваем точки на концах
        if (value > 10) { // было 20
            canvasCtx.fillStyle = getColor(i, segmentCount, value);
            canvasCtx.beginPath();
            // Увеличиваем размер точек
            canvasCtx.arc(endX, endY, canvasCtx.lineWidth * 0.8, 0, Math.PI * 2); // было / 2
            canvasCtx.fill();
        }
    }
    
    // Увеличиваем внутренний градиентный круг
    const innerGradient = canvasCtx.createRadialGradient(
        centerX, centerY, radius * 0.4, // было 0.3
        centerX, centerY, radius * 0.8 // было 0.6
    );
    innerGradient.addColorStop(0, 'rgba(100, 220, 255, 0.1)'); // увеличили прозрачность
    innerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    canvasCtx.fillStyle = innerGradient;
    canvasCtx.beginPath();
    canvasCtx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2); // было 0.6
    canvasCtx.fill();
}

function visualize() {
    if (!analyser || !canvas) return;
    
    analyser.getByteFrequencyData(dataArray);
    drawCircle();
    
    if (isPlaying) {
        animationId = requestAnimationFrame(visualize);
    }
}

function loadTrack(trackIndex) {
    if (trackIndex < 0) {
        trackIndex = music.length - 1;
    } else if (trackIndex >= music.length) {
        trackIndex = 0;
    }

    currentTrackIndex = trackIndex;
    const track = music[currentTrackIndex];
    audio.src = track.src;
    trackName.textContent = track.title;
    artistName.textContent = track.artist;

    document.querySelectorAll('.music-list-item').forEach(item => {
        item.classList.remove('active');
    });

    const currentItem = document.querySelector(`.music-list-item[data-index="${currentTrackIndex}"]`);
    if (currentItem) {
        currentItem.classList.add('active');
    }
    
    if (!audioContext) {
        initAudioContext();
    }
}

function playTrack() {
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            isPlaying = true;
            
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            visualize();
        }).catch(error => {
            console.error("Playback failed:", error);
        });
    }
}

function pauseTrack() {
    audio.pause();
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    isPlaying = false;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
}

function nextTrack() {
    loadTrack(currentTrackIndex + 1);
    if (isPlaying) {
        playTrack();
    }
}

function prevTrack() {
    loadTrack(currentTrackIndex - 1);
    if (isPlaying) {
        playTrack();
    }
}

function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    const progressPercent = (currentTime / duration) * 100;
    progressBar.style.width = `${progressPercent}%`;

    let currentMinutes = Math.floor(currentTime / 60);
    let currentSeconds = Math.floor(currentTime % 60);
    if (currentSeconds < 10) {
        currentSeconds = `0${currentSeconds}`;
    }
    currentTimeEl.textContent = `${currentMinutes}:${currentSeconds}`;
}

function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
}

function displayDuration() {
    let durationMinutes = Math.floor(audio.duration / 60);
    let durationSeconds = Math.floor(audio.duration % 60);
    if (durationSeconds < 10) {
        durationSeconds = `0${durationSeconds}`;
    }
    durationEl.textContent = `${durationMinutes}:${durationSeconds}`;
}

function renderMusicList(limit = music.length) {
    musicListContainer.innerHTML = '';
    const tracksToDisplay = music.slice(0, limit);

    tracksToDisplay.forEach((track, index) => {
        const listItem = document.createElement('div');
        listItem.className = 'music-list-item';
        listItem.setAttribute('data-index', index);
        listItem.innerHTML = `
            <div class="flex-grow min-w-0">
                <h3 class="font-semibold truncate text-sm sm:text-base">${track.title}</h3>
                <p class="text-gray-400 truncate text-xs sm:text-sm">${track.artist}</p>
            </div>
            <div class="flex flex-col items-end">
                <div class="flex space-x-1 text-yellow-400">
                    ${Array(track.rating).fill('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>').join('')}
                    ${Array(5 - track.rating).fill('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>').join('')}
                </div>
                <div class="flex items-center space-x-1 text-gray-400 text-xs">
                    <span>${track.plays.toLocaleString()}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
                </div>
            </div>
        `;
        musicListContainer.appendChild(listItem);

        listItem.addEventListener('click', () => {
            const selectedIndex = parseInt(listItem.getAttribute('data-index'));
            loadTrack(selectedIndex);
            playTrack();
        });
    });
    
    if (music.length > limit) {
        showAllBtn.classList.remove('hidden');
    } else {
        showAllBtn.classList.add('hidden');
    }
}

// Event Listeners
playPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
});

nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);
audio.addEventListener('ended', nextTrack);
audio.addEventListener('timeupdate', updateProgress);
progressContainer.addEventListener('click', setProgress);
audio.addEventListener('loadedmetadata', displayDuration);
showAllBtn.addEventListener('click', () => {
    renderMusicList();
    showAllBtn.classList.add('hidden');
});

// Handle window resize
window.addEventListener('resize', () => {
    if (canvas) {
        updateCanvasSize();
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isPlaying) {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }
});

// Initialize player
document.addEventListener('DOMContentLoaded', () => {
    renderMusicList(7);
    loadTrack(0);
    
    // Add keyboard controls
    document.addEventListener('keydown', (e) => {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                if (isPlaying) pauseTrack(); else playTrack();
                break;
            case 'ArrowRight':
                nextTrack();
                break;
            case 'ArrowLeft':
                prevTrack();
                break;
        }
    });
});