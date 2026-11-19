const audio = document.getElementById('audio');
const fileInput = document.getElementById('fileInput');
const trackList = document.getElementById('trackList');
const emptyState = document.getElementById('emptyState');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const coverWrap = document.getElementById('coverWrap');
const playButton = document.getElementById('playButton');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const volumeBar = document.getElementById('volumeBar');
const volumeValue = document.getElementById('volumeValue');
const trackCount = document.getElementById('trackCount');
const likeButton = document.getElementById('likeButton');

let playlist = [];
let currentIndex = -1;
let isShuffle = false;
let isRepeat = false;
let liked = false;

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function renderPlaylist() {
  trackList.innerHTML = '';
  emptyState.hidden = playlist.length > 0;
  trackCount.textContent = `${playlist.length} TRACK${playlist.length === 1 ? '' : 'S'}`;
  playlist.forEach((track, index) => {
    const item = document.createElement('li');
    item.className = `track-item${index === currentIndex ? ' active' : ''}`;
    item.innerHTML = `
      <span class="track-number">${index === currentIndex ? '♫' : String(index + 1).padStart(2, '0')}</span>
      <span class="mini-cover">♫</span>
      <span class="track-info"><strong></strong><span>Local audio file</span></span>
      <span class="track-duration">${formatTime(track.duration)}</span>
      <button class="remove-track" aria-label="Remove track" title="Remove track">×</button>`;
    item.querySelector('.track-info strong').textContent = track.name;
    item.addEventListener('click', (event) => {
      if (event.target.closest('.remove-track')) return;
      loadTrack(index, true);
    });
    item.querySelector('.remove-track').addEventListener('click', (event) => {
      event.stopPropagation();
      removeTrack(index);
    });
    trackList.appendChild(item);
  });
}

function loadTrack(index, autoplay = false) {
  if (!playlist.length || index < 0 || index >= playlist.length) return;
  currentIndex = index;
  const track = playlist[index];
  audio.src = track.url;
  trackTitle.textContent = track.name;
  trackArtist.textContent = 'From your device';
  coverWrap.innerHTML = '<div class="cover-placeholder"><span>♫</span><small>NOW PLAYING</small></div>';
  progressBar.value = 0;
  currentTimeEl.textContent = '0:00';
  durationEl.textContent = formatTime(track.duration);
  liked = false;
  likeButton.classList.remove('liked');
  likeButton.textContent = '♡';
  renderPlaylist();
  if (autoplay) playAudio();
}

function playAudio() {
  if (currentIndex === -1 && playlist.length) loadTrack(0);
  if (currentIndex === -1) {
    alert('Add audio files to your playlist first.');
    return;
  }
  audio.play().then(() => {
    playButton.textContent = 'Ⅱ';
    playButton.setAttribute('aria-label', 'Pause');
  }).catch(() => {
    playButton.textContent = '▶';
  });
}

function pauseAudio() {
  audio.pause();
  playButton.textContent = '▶';
  playButton.setAttribute('aria-label', 'Play');
}

function nextTrack() {
  if (!playlist.length) return;
  let next = isShuffle && playlist.length > 1 ? currentIndex : (currentIndex + 1) % playlist.length;
  if (isShuffle && playlist.length > 1) {
    while (next === currentIndex) next = Math.floor(Math.random() * playlist.length);
  }
  loadTrack(next, true);
}

function previousTrack() {
  if (!playlist.length) return;
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  loadTrack((currentIndex - 1 + playlist.length) % playlist.length, true);
}

function removeTrack(index) {
  const removed = playlist.splice(index, 1)[0];
  URL.revokeObjectURL(removed.url);
  if (index === currentIndex) {
    audio.pause();
    currentIndex = -1;
    if (playlist.length) loadTrack(Math.min(index, playlist.length - 1));
    else {
      trackTitle.textContent = 'Choose a track';
      trackArtist.textContent = 'Your playlist is waiting';
      coverWrap.innerHTML = '<div class="cover-placeholder"><span>♫</span><small>YOUR MUSIC</small></div>';
      pauseAudio();
    }
  } else if (index < currentIndex) currentIndex--;
  renderPlaylist();
}

fileInput.addEventListener('change', (event) => {
  const files = [...event.target.files].filter(file => file.type.startsWith('audio/'));
  files.forEach(file => {
    playlist.push({ name: file.name.replace(/\.[^/.]+$/, ''), url: URL.createObjectURL(file), duration: 0 });
  });
  renderPlaylist();
  if (currentIndex === -1 && playlist.length) loadTrack(0);
  files.forEach((file, i) => {
    const track = playlist[playlist.length - files.length + i];
    const probe = new Audio();
    probe.src = track.url;
    probe.addEventListener('loadedmetadata', () => {
      track.duration = probe.duration;
      renderPlaylist();
      if (playlist[currentIndex] === track) durationEl.textContent = formatTime(track.duration);
    }, { once: true });
  });
  fileInput.value = '';
});

playButton.addEventListener('click', () => audio.paused ? playAudio() : pauseAudio());
document.getElementById('nextButton').addEventListener('click', nextTrack);
document.getElementById('previousButton').addEventListener('click', previousTrack);
document.getElementById('shuffleButton').addEventListener('click', (event) => {
  isShuffle = !isShuffle;
  event.currentTarget.style.color = isShuffle ? 'var(--blue)' : '';
});
document.getElementById('repeatButton').addEventListener('click', (event) => {
  isRepeat = !isRepeat;
  audio.loop = isRepeat;
  event.currentTarget.style.color = isRepeat ? 'var(--blue)' : '';
});
likeButton.addEventListener('click', () => {
  liked = !liked;
  likeButton.textContent = liked ? '♥' : '♡';
  likeButton.classList.toggle('liked', liked);
});
volumeBar.addEventListener('input', () => {
  audio.volume = Number(volumeBar.value);
  volumeValue.textContent = `${Math.round(audio.volume * 100)}%`;
});
audio.volume = Number(volumeBar.value);
audio.addEventListener('timeupdate', () => {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
});
audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audio.duration);
  if (playlist[currentIndex]) playlist[currentIndex].duration = audio.duration;
  renderPlaylist();
});
progressBar.addEventListener('input', () => {
  if (Number.isFinite(audio.duration)) audio.currentTime = (Number(progressBar.value) / 100) * audio.duration;
});
audio.addEventListener('ended', () => {
  if (!isRepeat) nextTrack();
});
document.getElementById('exploreButton').addEventListener('click', () => {
  document.getElementById('library').scrollIntoView({ behavior: 'smooth' });
});
renderPlaylist();
