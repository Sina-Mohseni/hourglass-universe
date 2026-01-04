/* =============================================
   AUDIO PLAYER
   ============================================= */

const audioEl = document.getElementById('audioElement');

async function loadAudioTracks(ids) {
    audioState.tracks = [];

    for (const id of ids) {
        const audio = await getMedia(id);
        if (audio && audio.base64) {
            audioState.tracks.push({
                id,
                name: audio.name || 'Piste',
                base64: audio.base64
            });
        }
    }
}

function toggleAudioPlayer() {
    const overlay = document.getElementById('audioPlayerOverlay');
    overlay.classList.toggle('active');

    if (overlay.classList.contains('active')) {
        renderPlayerList();
        if (audioState.tracks.length && !audioEl.src) {
            loadTrack(0);
        }
    }
}

function closeAudioPlayerOverlay(e) {
    if (e.target === e.currentTarget) {
        document.getElementById('audioPlayerOverlay').classList.remove('active');
    }
}

function closeAudioPlayer() {
    document.getElementById('audioPlayerOverlay').classList.remove('active');
    audioEl.pause();
    audioState.isPlaying = false;
}

function renderPlayerList() {
    const list = document.getElementById('playerAudioList');
    list.innerHTML = audioState.tracks.map((track, index) =>
        `<div class="audio-list-item ${index === audioState.currentIndex ? 'active' : ''}" onclick="loadTrack(${index})">
            <span class="audio-list-item-name">${track.name}</span>
        </div>`
    ).join('');
}

function loadTrack(index) {
    if (!audioState.tracks.length) return;

    audioState.currentIndex = index;
    const track = audioState.tracks[index];

    audioEl.src = track.base64;
    document.getElementById('audioCurrentTitle').textContent = track.name;
    renderPlayerList();

    if (audioState.isPlaying) {
        audioEl.play();
    }
}

function togglePlay() {
    if (!audioState.tracks.length) return;

    if (audioState.isPlaying) {
        audioEl.pause();
        audioState.isPlaying = false;
        document.getElementById('playIcon').innerHTML = '<path d="M8 5v14l11-7z"/>';
    } else {
        audioEl.play();
        audioState.isPlaying = true;
        document.getElementById('playIcon').innerHTML = '<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>';
    }
}

function previousTrack() {
    if (!audioState.tracks.length) return;
    audioState.currentIndex = (audioState.currentIndex - 1 + audioState.tracks.length) % audioState.tracks.length;
    loadTrack(audioState.currentIndex);
    if (audioState.isPlaying) audioEl.play();
}

function nextTrack() {
    if (!audioState.tracks.length) return;
    audioState.currentIndex = (audioState.currentIndex + 1) % audioState.tracks.length;
    loadTrack(audioState.currentIndex);
    if (audioState.isPlaying) audioEl.play();
}

function seekAudio(e) {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioEl.currentTime = percent * audioEl.duration;
}

audioEl.addEventListener('timeupdate', () => {
    const percent = (audioEl.currentTime / audioEl.duration) * 100;
    document.getElementById('audioProgressBar').style.width = percent + '%';
    document.getElementById('audioCurrentTime').textContent = formatTime(audioEl.currentTime);
});

audioEl.addEventListener('loadedmetadata', () => {
    document.getElementById('audioDuration').textContent = formatTime(audioEl.duration);
});

audioEl.addEventListener('ended', nextTrack);

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
