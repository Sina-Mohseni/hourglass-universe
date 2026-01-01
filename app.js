// =============================================
// DATABASE & STORAGE
// =============================================
const DB_NAME = 'HourglassDB';
const DB_VERSION = 1;
let db = null;

// Cache mémoire pour tous les médias chargés
const mediaStore = new Map();

async function initDB() {
    return new Promise((resolve) => {
        if (!window.indexedDB) {
            console.log('IndexedDB non disponible, utilisation localStorage');
            resolve(null);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.log('IndexedDB erreur, fallback localStorage');
            resolve(null);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('IndexedDB connectée');
            resolve(db);
        };

        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            if (!database.objectStoreNames.contains('appData')) {
                database.createObjectStore('appData', { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains('media')) {
                database.createObjectStore('media', { keyPath: 'id' });
            }
        };
    });
}

async function saveAppData() {
    if (!db) {
        try {
            localStorage.setItem('hourglass_appData', JSON.stringify(appData));
        } catch (e) {
            console.warn('Erreur localStorage:', e);
        }
        return;
    }

    return new Promise((resolve) => {
        const tx = db.transaction('appData', 'readwrite');
        tx.objectStore('appData').put(appData);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
    });
}

async function loadAppData() {
    if (!db) {
        try {
            const data = localStorage.getItem('hourglass_appData');
            if (data) appData = JSON.parse(data);
        } catch (e) {}
        return;
    }

    return new Promise((resolve) => {
        const tx = db.transaction('appData', 'readonly');
        const request = tx.objectStore('appData').get('main');
        request.onsuccess = () => {
            if (request.result) appData = request.result;
            resolve();
        };
        request.onerror = () => resolve();
    });
}

// =============================================
// MEDIA SYSTEM - Nouveau système simplifié
// =============================================

// Convertir File en base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Erreur lecture fichier'));
        reader.readAsDataURL(file);
    });
}

// Sauvegarder un média
async function saveMedia(base64Data, type, name) {
    const id = 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const mediaData = { id, base64: base64Data, type, name };

    // Toujours mettre en cache d'abord
    mediaStore.set(id, mediaData);

    if (!db) {
        try {
            localStorage.setItem('media_' + id, JSON.stringify(mediaData));
        } catch (e) {
            console.error('Erreur sauvegarde localStorage:', e);
            mediaStore.delete(id);
            return null;
        }
        return id;
    }

    return new Promise((resolve) => {
        const tx = db.transaction('media', 'readwrite');
        tx.objectStore('media').put(mediaData);
        tx.oncomplete = () => resolve(id);
        tx.onerror = () => {
            mediaStore.delete(id);
            resolve(null);
        };
    });
}

// Récupérer un média
async function getMedia(id) {
    if (!id) return null;

    // Vérifier le cache d'abord
    if (mediaStore.has(id)) {
        return mediaStore.get(id);
    }

    if (!db) {
        try {
            const data = localStorage.getItem('media_' + id);
            if (data) {
                const parsed = JSON.parse(data);
                mediaStore.set(id, parsed);
                return parsed;
            }
        } catch (e) {}
        return null;
    }

    return new Promise((resolve) => {
        const tx = db.transaction('media', 'readonly');
        const request = tx.objectStore('media').get(id);
        request.onsuccess = () => {
            if (request.result) {
                mediaStore.set(id, request.result);
                resolve(request.result);
            } else {
                resolve(null);
            }
        };
        request.onerror = () => resolve(null);
    });
}

// Supprimer un média
async function deleteMedia(id) {
    if (!id) return;

    mediaStore.delete(id);

    if (!db) {
        localStorage.removeItem('media_' + id);
        return;
    }

    return new Promise((resolve) => {
        const tx = db.transaction('media', 'readwrite');
        tx.objectStore('media').delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
    });
}

// =============================================
// APP STATE
// =============================================
let appData = {
    id: 'main',
    universes: [],
    currentUniverse: null,
    currentEra: null,
    currentDetail: null,
    currentDetailType: null,
    navStack: ['home']
};

let modalState = {
    type: null,
    mode: null,
    editIndex: null,
    parentType: null,
    mediaId: null,
    mediaBase64: null,
    mediaType: null,
    audioFiles: []
};

let itemlineState = { parentType: null, editIndex: null };
let calendarState = { parentType: null, editIndex: null };
let deleteState = { type: null };
let audioState = { tracks: [], currentIndex: 0, isPlaying: false };

// Track active sections for each page
let activeSections = {
    universe: null,
    era: null,
    detail: null
};

// =============================================
// INITIALIZATION
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    await loadAppData();
    await renderUniverses();
    createParticles();
    console.log('Application initialisée');
});

// =============================================
// UTILITIES
// =============================================
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'sand-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (5 + Math.random() * 10) + 's';
        particle.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(particle);
    }
}

// =============================================
// NAVIGATION
// =============================================
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
    document.getElementById(page).classList.add('active');
}

function goBack() {
    appData.navStack.pop();
    const page = appData.navStack[appData.navStack.length - 1];

    if (page === 'home') {
        appData.currentUniverse = null;
        appData.currentEra = null;
        appData.currentDetail = null;
        navigateTo('homePage');
        renderUniverses();
    } else if (page === 'universe') {
        appData.currentEra = null;
        appData.currentDetail = null;
        renderUniversePage();
        navigateTo('universePage');
    } else if (page === 'era') {
        appData.currentDetail = null;
        renderEraPage();
        navigateTo('eraPage');
    }

    closeAudioPlayer();
    saveAppData();
}

// =============================================
// BACKGROUND RENDERING
// =============================================
async function renderBackground(containerId, mediaId) {
    const container = document.getElementById(containerId);

    if (!mediaId) {
        container.innerHTML = '';
        return;
    }

    const media = await getMedia(mediaId);

    if (!media || !media.base64) {
        console.warn('Média non trouvé:', mediaId);
        return;
    }

    container.innerHTML = '';

    if (media.type && media.type.startsWith('video')) {
        const video = document.createElement('video');
        video.src = media.base64;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.style.cssText = 'width:100%;height:100%;object-fit:cover';
        container.appendChild(video);
        video.play().catch(() => {});
    } else {
        const img = document.createElement('img');
        img.src = media.base64;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover';
        container.appendChild(img);
    }
}

// =============================================
// CARD BACKGROUND HELPER
// =============================================
async function getCardBackground(mediaId) {
    if (!mediaId) return '<div class="card-overlay"></div>';

    const media = await getMedia(mediaId);
    if (!media || !media.base64) return '<div class="card-overlay"></div>';

    if (media.type && media.type.startsWith('video')) {
        return `<video class="card-bg" src="${media.base64}" autoplay loop muted playsinline></video><div class="card-overlay"></div>`;
    }
    return `<img class="card-bg" src="${media.base64}"><div class="card-overlay"></div>`;
}

// =============================================
// UNIVERSES
// =============================================
async function renderUniverses() {
    const grid = document.getElementById('universesGrid');
    grid.innerHTML = '';

    for (let i = 0; i < appData.universes.length; i++) {
        const universe = appData.universes[i];
        const card = document.createElement('div');
        card.className = 'card-universe';
        card.onclick = () => openUniverse(i);
        card.innerHTML = `${await getCardBackground(universe.mediaId)}<div class="card-content"><div class="card-title">${universe.name}</div><div class="card-desc">${universe.description || ''}</div></div>`;
        grid.appendChild(card);
    }

    const addCard = document.createElement('div');
    addCard.className = 'card-universe add-card';
    addCard.onclick = () => openCreateModal('universe');
    addCard.innerHTML = '<div class="add-icon">+</div><span class="add-text">Nouvel Univers</span>';
    grid.appendChild(addCard);
}

async function openUniverse(index) {
    appData.currentUniverse = index;
    appData.navStack.push('universe');
    await renderUniversePage();
    navigateTo('universePage');
    saveAppData();
}

async function renderUniversePage() {
    const universe = appData.universes[appData.currentUniverse];
    if (!universe) return;

    document.getElementById('universeTitle').textContent = universe.name;
    document.getElementById('universeDesc').textContent = universe.description || '';

    await renderBackground('universeBackground', universe.mediaId);

    const musicBtn = document.getElementById('universeMusicBtn');
    musicBtn.style.display = (universe.audioIds && universe.audioIds.length) ? 'flex' : 'none';

    if (universe.audioIds) await loadAudioTracks(universe.audioIds);

    hideAllUniverseSections();
    updateTimelineSelection(universe.timeSystem);
}

function hideAllUniverseSections() {
    ['universeItemline', 'universeCrossline', 'universeTimeline'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    document.querySelectorAll('#universePage .sub-menu-btn').forEach(b => b.classList.remove('active'));
    const container = document.getElementById('universeSubMenus');
    if (container) container.setAttribute('data-active', '0');
}

async function showUniverseSection(section) {
    hideAllUniverseSections();
    activeSections.universe = section;
    document.getElementById('universe' + section.charAt(0).toUpperCase() + section.slice(1)).style.display = 'block';

    // Find and activate the correct button
    setActiveButton('#universePage', section);

    if (section === 'itemline') {
        renderUniverseItemline();
    } else if (section === 'crossline') {
        renderUniverseCrossline();
    } else if (section === 'timeline') {
        await renderEras();
    }
}

function setActiveButton(pageSelector, section) {
    const container = document.querySelector(`${pageSelector} .sub-menus-container`);
    const buttons = document.querySelectorAll(`${pageSelector} .sub-menu-btn`);

    let activeIndex = 0;
    buttons.forEach((btn, index) => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-section') === section) {
            btn.classList.add('active');
            activeIndex = index + 1;
        }
    });

    // Update the sliding indicator position
    if (container) {
        container.setAttribute('data-active', activeIndex);
    }
}

function renderUniverseItemline() {
    const universe = appData.universes[appData.currentUniverse];
    const container = document.getElementById('universeItemlineList');
    container.innerHTML = '';

    if (!universe.itemline || !universe.itemline.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">Aucune info</div></div>';
        return;
    }

    universe.itemline.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'itemline-item';
        el.innerHTML = `
            <div class="itemline-item-header">
                <div class="itemline-item-title">${item.title}</div>
                <div class="itemline-item-actions">
                    <button class="itemline-item-btn" onclick="editItemline('universe',${index})">✎</button>
                    <button class="itemline-item-btn delete" onclick="deleteItemline('universe',${index})">✕</button>
                </div>
            </div>
            <div class="itemline-item-content">${item.content}</div>
        `;
        container.appendChild(el);
    });
}

// =============================================
// UNIVERSE CROSSLINE (itemline style)
// =============================================
let universeCrosslineState = { editIndex: null };

function renderUniverseCrossline() {
    const universe = appData.universes[appData.currentUniverse];
    const container = document.getElementById('universeCrosslineList');
    container.innerHTML = '';

    if (!universe.crossline || !universe.crossline.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🌐</div><div class="empty-text">Aucun élément</div></div>';
        return;
    }

    universe.crossline.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'itemline-item';
        el.innerHTML = `
            <div class="itemline-item-header">
                <div class="itemline-item-title">${item.title}</div>
                <div class="itemline-item-actions">
                    <button class="itemline-item-btn" onclick="editUniverseCrossline(${index})">✎</button>
                    <button class="itemline-item-btn delete" onclick="deleteUniverseCrossline(${index})">✕</button>
                </div>
            </div>
            <div class="itemline-item-content">${item.content}</div>
        `;
        container.appendChild(el);
    });
}

function openUniverseCrosslineModal() {
    universeCrosslineState = { editIndex: null };
    document.getElementById('itemlineTitle').value = '';
    document.getElementById('itemlineContent').value = '';
    document.getElementById('itemlineModal').classList.add('active');
    itemlineState = { parentType: 'universeCrossline', editIndex: null };
}

function editUniverseCrossline(index) {
    const universe = appData.universes[appData.currentUniverse];
    const item = universe.crossline[index];

    document.getElementById('itemlineTitle').value = item.title;
    document.getElementById('itemlineContent').value = item.content;
    document.getElementById('itemlineModal').classList.add('active');
    itemlineState = { parentType: 'universeCrossline', editIndex: index };
}

async function deleteUniverseCrossline(index) {
    const universe = appData.universes[appData.currentUniverse];
    universe.crossline.splice(index, 1);
    await saveAppData();
    showToast('Supprimé');
    renderUniverseCrossline();
    restoreActiveSection('universe');
}

// =============================================
// ERAS
// =============================================
async function renderEras() {
    const universe = appData.universes[appData.currentUniverse];
    const grid = document.getElementById('erasGrid');
    grid.innerHTML = '';

    if (!universe.eras) universe.eras = [];

    for (let i = 0; i < universe.eras.length; i++) {
        const era = universe.eras[i];
        const card = document.createElement('div');
        card.className = 'card-era';
        card.onclick = () => openEra(i);
        card.innerHTML = `${await getCardBackground(era.mediaId)}<div class="card-content"><div class="card-title">${era.name}</div><div class="card-desc">${era.description || ''}</div></div>`;
        grid.appendChild(card);
    }

    const addCard = document.createElement('div');
    addCard.className = 'card-era add-card';
    addCard.onclick = () => openCreateModal('era');
    addCard.innerHTML = '<div class="add-icon">+</div><span class="add-text">Nouvelle Era</span>';
    grid.appendChild(addCard);
}

async function openEra(index) {
    appData.currentEra = index;
    appData.navStack.push('era');
    await renderEraPage();
    navigateTo('eraPage');
    saveAppData();
}

async function renderEraPage() {
    const universe = appData.universes[appData.currentUniverse];
    const era = universe.eras[appData.currentEra];
    if (!era) return;

    document.getElementById('eraTitle').textContent = era.name;
    document.getElementById('eraDesc').textContent = era.description || '';

    await renderBackground('eraBackground', era.mediaId);

    const musicBtn = document.getElementById('eraMusicBtn');
    musicBtn.style.display = (era.audioIds && era.audioIds.length) ? 'flex' : 'none';

    if (era.audioIds) await loadAudioTracks(era.audioIds);

    hideAllEraSections();
}

function hideAllEraSections() {
    ['eraItemline', 'eraCrossline', 'eraTimeline'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    document.querySelectorAll('#eraPage .sub-menu-btn').forEach(b => b.classList.remove('active'));
    const container = document.getElementById('eraSubMenus');
    if (container) container.setAttribute('data-active', '0');
}

async function showEraSection(section) {
    hideAllEraSections();
    activeSections.era = section;
    document.getElementById('era' + section.charAt(0).toUpperCase() + section.slice(1)).style.display = 'block';

    // Find and activate the correct button
    setActiveButton('#eraPage', section);

    if (section === 'itemline') {
        renderEraItemline();
    } else if (section === 'crossline') {
        await renderEraCrossline('lieux');
    } else if (section === 'timeline') {
        renderEraCalendars();
    }
}

function renderEraItemline() {
    const universe = appData.universes[appData.currentUniverse];
    const era = universe.eras[appData.currentEra];
    const container = document.getElementById('eraItemlineList');
    container.innerHTML = '';

    if (!era.itemline || !era.itemline.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">Aucune info</div></div>';
        return;
    }

    era.itemline.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'itemline-item';
        el.innerHTML = `
            <div class="itemline-item-header">
                <div class="itemline-item-title">${item.title}</div>
                <div class="itemline-item-actions">
                    <button class="itemline-item-btn" onclick="editItemline('era',${index})">✎</button>
                    <button class="itemline-item-btn delete" onclick="deleteItemline('era',${index})">✕</button>
                </div>
            </div>
            <div class="itemline-item-content">${item.content}</div>
        `;
        container.appendChild(el);
    });
}

// =============================================
// ERA CROSSLINE
// =============================================
let currentEraCrosslineType = 'lieux';

async function showEraCrosslineType(type) {
    currentEraCrosslineType = type;
    document.querySelectorAll('#eraCrossline .sub-crossline-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    await renderEraCrossline(type);
}

async function renderEraCrossline(type) {
    const universe = appData.universes[appData.currentUniverse];
    const era = universe.eras[appData.currentEra];
    const grid = document.getElementById('eraCrosslineGrid');
    grid.innerHTML = '';

    if (!era[type]) era[type] = [];

    for (let i = 0; i < era[type].length; i++) {
        const item = era[type][i];
        const card = document.createElement('div');
        card.className = 'card-era';
        card.onclick = () => openDetail(i, type);
        card.innerHTML = `${await getCardBackground(item.mediaId)}<div class="card-content"><div class="card-title">${item.name}</div><div class="card-desc">${item.description || ''}</div></div>`;
        grid.appendChild(card);
    }

    const addCard = document.createElement('div');
    addCard.className = 'card-era add-card';
    addCard.onclick = () => openCreateModal(type);
    addCard.innerHTML = '<div class="add-icon">+</div><span class="add-text">Nouveau</span>';
    grid.appendChild(addCard);
}

// =============================================
// DETAIL PAGE
// =============================================
async function openDetail(index, type) {
    appData.currentDetail = index;
    appData.currentDetailType = type;
    appData.navStack.push('detail');
    await renderDetailPage();
    navigateTo('detailPage');
    saveAppData();
}

async function renderDetailPage() {
    const universe = appData.universes[appData.currentUniverse];
    const era = universe.eras[appData.currentEra];
    const detail = era[appData.currentDetailType][appData.currentDetail];
    if (!detail) return;

    document.getElementById('detailTitle').textContent = detail.name;
    document.getElementById('detailDesc').textContent = detail.description || '';

    await renderBackground('detailBackground', detail.mediaId);

    const musicBtn = document.getElementById('detailMusicBtn');
    musicBtn.style.display = (detail.audioIds && detail.audioIds.length) ? 'flex' : 'none';

    if (detail.audioIds) await loadAudioTracks(detail.audioIds);

    hideAllDetailSections();
}

function hideAllDetailSections() {
    ['detailItemline', 'detailCrossline', 'detailTimeline'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    document.querySelectorAll('#detailPage .sub-menu-btn').forEach(b => b.classList.remove('active'));
    const container = document.getElementById('detailSubMenus');
    if (container) container.setAttribute('data-active', '0');
}

async function showDetailSection(section) {
    hideAllDetailSections();
    activeSections.detail = section;
    document.getElementById('detail' + section.charAt(0).toUpperCase() + section.slice(1)).style.display = 'block';

    // Find and activate the correct button
    setActiveButton('#detailPage', section);

    if (section === 'itemline') {
        renderDetailItemline();
    } else if (section === 'crossline') {
        await renderDetailCrossline('lieux');
    } else if (section === 'timeline') {
        renderDetailCalendars();
    }
}

function renderDetailItemline() {
    const universe = appData.universes[appData.currentUniverse];
    const era = universe.eras[appData.currentEra];
    const detail = era[appData.currentDetailType][appData.currentDetail];
    const container = document.getElementById('detailItemlineList');
    container.innerHTML = '';

    if (!detail.itemline || !detail.itemline.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">Aucune info</div></div>';
        return;
    }

    detail.itemline.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'itemline-item';
        el.innerHTML = `
            <div class="itemline-item-header">
                <div class="itemline-item-title">${item.title}</div>
                <div class="itemline-item-actions">
                    <button class="itemline-item-btn" onclick="editItemline('detail',${index})">✎</button>
                    <button class="itemline-item-btn delete" onclick="deleteItemline('detail',${index})">✕</button>
                </div>
            </div>
            <div class="itemline-item-content">${item.content}</div>
        `;
        container.appendChild(el);
    });
}

// =============================================
// DETAIL CROSSLINE
// =============================================
let currentDetailCrosslineType = 'lieux';

async function showDetailCrosslineType(type) {
    currentDetailCrosslineType = type;
    document.querySelectorAll('#detailCrossline .sub-crossline-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    await renderDetailCrossline(type);
}

async function renderDetailCrossline(type) {
    const universe = appData.universes[appData.currentUniverse];
    const era = universe.eras[appData.currentEra];
    const detail = era[appData.currentDetailType][appData.currentDetail];
    const grid = document.getElementById('detailCrosslineGrid');
    grid.innerHTML = '';

    if (!detail[type]) detail[type] = [];

    for (let i = 0; i < detail[type].length; i++) {
        const item = detail[type][i];
        const card = document.createElement('div');
        card.className = 'card-era';
        card.innerHTML = `${await getCardBackground(item.mediaId)}<div class="card-content"><div class="card-title">${item.name}</div><div class="card-desc">${item.description || ''}</div></div>`;
        grid.appendChild(card);
    }

    const addCard = document.createElement('div');
    addCard.className = 'card-era add-card';
    addCard.onclick = () => openCreateModal(type, 'detail');
    addCard.innerHTML = '<div class="add-icon">+</div><span class="add-text">Nouveau</span>';
    grid.appendChild(addCard);
}

// =============================================
// TIMELINE
// =============================================
async function selectTimeSystem(type) {
    appData.universes[appData.currentUniverse].timeSystem = type;
    await saveAppData();
    updateTimelineSelection(type);
    showToast('Système temporel enregistré');
}

function updateTimelineSelection(type) {
    document.querySelectorAll('.timeline-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.type === type) {
            option.classList.add('selected');
        }
    });
}

// =============================================
// CALENDARS
// =============================================
function renderEraCalendars() {
    const universe = appData.universes[appData.currentUniverse];
    const era = universe.eras[appData.currentEra];
    const container = document.getElementById('calendarsContainer');
    container.innerHTML = '';

    if (!era.calendars || !era.calendars.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">Aucun calendrier</div></div>';
        return;
    }

    era.calendars.forEach((cal, index) => {
        container.appendChild(createCalendarElement(cal, index, 'era'));
    });
}

function renderDetailCalendars() {
    const universe = appData.universes[appData.currentUniverse];
    const era = universe.eras[appData.currentEra];
    const detail = era[appData.currentDetailType][appData.currentDetail];
    const container = document.getElementById('detailCalendarsContainer');
    container.innerHTML = '';

    if (!detail.calendars || !detail.calendars.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">Aucun calendrier</div></div>';
        return;
    }

    detail.calendars.forEach((cal, index) => {
        container.appendChild(createCalendarElement(cal, index, 'detail'));
    });
}

function createCalendarElement(cal, index, parentType) {
    const div = document.createElement('div');
    div.className = 'calendar-container';

    const days = cal.daysPerWeek * cal.weeksPerMonth;
    let dayHeaders = '';

    for (let j = 1; j <= cal.daysPerWeek; j++) {
        dayHeaders += `<div class="calendar-day-header">${(cal.dayName || 'J').substring(0, 2)}${j}</div>`;
    }

    for (let j = 1; j <= days; j++) {
        dayHeaders += `<div class="calendar-day">${j}</div>`;
    }

    div.innerHTML = `
        <div class="calendar-header">
            <div class="calendar-nav">
                <div class="calendar-title">${cal.name} - ${cal.monthName || 'Mois'} 1</div>
            </div>
            <div class="itemline-item-actions">
                <button class="itemline-item-btn" onclick="editCalendar('${parentType}',${index})">✎</button>
                <button class="itemline-item-btn delete" onclick="deleteCalendar('${parentType}',${index})">✕</button>
            </div>
        </div>
        <div class="calendar-grid" style="grid-template-columns:repeat(${cal.daysPerWeek},1fr)">${dayHeaders}</div>
        <div class="calendar-customize">
            <div class="calendar-setting"><span class="calendar-setting-label">${cal.dayName || 'Jours'}/${cal.weekName || 'sem'}</span><span>${cal.daysPerWeek}</span></div>
            <div class="calendar-setting"><span class="calendar-setting-label">${cal.weekName || 'Sem'}/${cal.monthName || 'mois'}</span><span>${cal.weeksPerMonth}</span></div>
            <div class="calendar-setting"><span class="calendar-setting-label">${cal.monthName || 'Mois'}/${cal.yearName || 'an'}</span><span>${cal.monthsPerYear}</span></div>
            <div class="calendar-setting"><span class="calendar-setting-label">${cal.hourName || 'H'}/${cal.dayName || 'jour'}</span><span>${cal.hoursPerDay}</span></div>
        </div>
    `;

    return div;
}

// =============================================
// MODALS - CREATE/EDIT
// =============================================
function resetModalState() {
    modalState = {
        type: null,
        mode: null,
        editIndex: null,
        parentType: null,
        mediaId: null,
        mediaBase64: null,
        mediaType: null,
        audioFiles: []
    };
}

function openCreateModal(type, parent = null) {
    resetModalState();
    modalState.type = type;
    modalState.mode = 'create';
    modalState.parentType = parent;

    document.getElementById('modalTitle').textContent = 'Créer';
    document.getElementById('modalSaveBtn').textContent = 'Créer';
    document.getElementById('inputName').value = '';
    document.getElementById('inputDesc').value = '';
    document.getElementById('mediaPreview').innerHTML = '';
    document.getElementById('mediaPreview').classList.remove('active');
    document.getElementById('audioList').innerHTML = '';
    document.getElementById('audioList').style.display = 'none';
    document.getElementById('createModal').classList.add('active');
}

async function openEditModal(type) {
    resetModalState();
    modalState.type = type;
    modalState.mode = 'edit';

    let entity;
    if (type === 'universe') {
        entity = appData.universes[appData.currentUniverse];
        modalState.editIndex = appData.currentUniverse;
    } else if (type === 'era') {
        entity = appData.universes[appData.currentUniverse].eras[appData.currentEra];
        modalState.editIndex = appData.currentEra;
    } else {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        entity = era[appData.currentDetailType][appData.currentDetail];
        modalState.editIndex = appData.currentDetail;
        modalState.type = appData.currentDetailType;
    }

    modalState.mediaId = entity.mediaId || null;

    // Charger les audios existants
    if (entity.audioIds) {
        for (const id of entity.audioIds) {
            const audio = await getMedia(id);
            if (audio) {
                modalState.audioFiles.push({
                    id,
                    name: audio.name || 'Audio',
                    base64: audio.base64,
                    type: audio.type
                });
            }
        }
    }

    document.getElementById('modalTitle').textContent = 'Modifier';
    document.getElementById('modalSaveBtn').textContent = 'Enregistrer';
    document.getElementById('inputName').value = entity.name;
    document.getElementById('inputDesc').value = entity.description || '';

    // Afficher le média existant
    const preview = document.getElementById('mediaPreview');
    if (entity.mediaId) {
        const media = await getMedia(entity.mediaId);
        if (media && media.base64) {
            preview.classList.add('active');
            if (media.type && media.type.startsWith('video')) {
                preview.innerHTML = `<video src="${media.base64}" controls style="width:100%;height:100%;object-fit:cover"></video><button class="remove-btn" onclick="removeMedia()">✕</button>`;
            } else {
                preview.innerHTML = `<img src="${media.base64}" style="width:100%;height:100%;object-fit:cover"><button class="remove-btn" onclick="removeMedia()">✕</button>`;
            }
        }
    } else {
        preview.classList.remove('active');
        preview.innerHTML = '';
    }

    updateAudioListModal();
    document.getElementById('createModal').classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// =============================================
// MEDIA UPLOAD - Système simplifié
// =============================================
async function handleMediaUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        // Convertir immédiatement en base64
        const base64 = await fileToBase64(file);

        modalState.mediaBase64 = base64;
        modalState.mediaType = file.type;
        modalState.mediaId = null; // Nouveau média, pas encore d'ID

        const preview = document.getElementById('mediaPreview');
        preview.classList.add('active');

        if (file.type.startsWith('video')) {
            preview.innerHTML = `<video src="${base64}" controls style="width:100%;height:100%;object-fit:cover"></video><button class="remove-btn" onclick="removeMedia()">✕</button>`;
        } else {
            preview.innerHTML = `<img src="${base64}" style="width:100%;height:100%;object-fit:cover"><button class="remove-btn" onclick="removeMedia()">✕</button>`;
        }

        showToast('Média ajouté');
    } catch (err) {
        console.error('Erreur upload:', err);
        showToast('Erreur lors du chargement');
    }

    e.target.value = '';
}

function removeMedia() {
    modalState.mediaBase64 = null;
    modalState.mediaType = null;
    modalState.mediaId = null;

    const preview = document.getElementById('mediaPreview');
    preview.classList.remove('active');
    preview.innerHTML = '';
}

async function handleAudioUpload(e) {
    const files = e.target.files;
    if (!files || !files.length) return;

    for (const file of files) {
        try {
            const base64 = await fileToBase64(file);
            modalState.audioFiles.push({
                id: null,
                name: file.name,
                base64: base64,
                type: file.type
            });
        } catch (err) {
            console.error('Erreur audio:', err);
        }
    }

    e.target.value = '';
    updateAudioListModal();
    showToast(files.length + ' piste(s) ajoutée(s)');
}

function updateAudioListModal() {
    const list = document.getElementById('audioList');
    if (!list) return;

    if (modalState.audioFiles && modalState.audioFiles.length) {
        list.style.display = 'block';
        list.innerHTML = modalState.audioFiles.map((audio, index) =>
            `<div class="audio-list-item">
                <span class="audio-list-item-name">${audio.name}</span>
                <button class="itemline-item-btn delete" onclick="removeAudioModal(${index})">✕</button>
            </div>`
        ).join('');
    } else {
        list.style.display = 'none';
        list.innerHTML = '';
    }
}

async function removeAudioModal(index) {
    const audio = modalState.audioFiles[index];
    if (audio.id) await deleteMedia(audio.id);
    modalState.audioFiles.splice(index, 1);
    updateAudioListModal();
}

// =============================================
// SAVE ENTITY
// =============================================
async function saveEntity() {
    const name = document.getElementById('inputName').value.trim();
    if (!name) {
        showToast('Entrez un nom');
        return;
    }

    let mediaId = modalState.mediaId;

    // Si nouveau média uploadé, le sauvegarder
    if (modalState.mediaBase64) {
        mediaId = await saveMedia(modalState.mediaBase64, modalState.mediaType, 'media');
        if (!mediaId) {
            showToast('Erreur sauvegarde média');
            return;
        }
    }

    // Sauvegarder les nouveaux audios
    const audioIds = [];
    for (const audio of modalState.audioFiles) {
        if (audio.id) {
            audioIds.push(audio.id);
        } else if (audio.base64) {
            const id = await saveMedia(audio.base64, audio.type, audio.name);
            if (id) audioIds.push(id);
        }
    }

    const entity = {
        name: name,
        description: document.getElementById('inputDesc').value.trim(),
        mediaId: mediaId,
        audioIds: audioIds,
        itemline: [],
        calendars: []
    };

    if (modalState.mode === 'edit') {
        if (modalState.type === 'universe' || (appData.navStack[appData.navStack.length - 1] === 'universe' && modalState.type !== 'era')) {
            const existing = appData.universes[modalState.editIndex];
            if (existing.mediaId && existing.mediaId !== mediaId) {
                await deleteMedia(existing.mediaId);
            }
            entity.eras = existing.eras || [];
            entity.itemline = existing.itemline || [];
            entity.timeSystem = existing.timeSystem;
            appData.universes[modalState.editIndex] = entity;
            await saveAppData();
            await renderUniversePage();
        } else if (modalState.type === 'era') {
            const universe = appData.universes[appData.currentUniverse];
            const existing = universe.eras[modalState.editIndex];
            if (existing.mediaId && existing.mediaId !== mediaId) {
                await deleteMedia(existing.mediaId);
            }
            entity.itemline = existing.itemline || [];
            entity.lieux = existing.lieux || [];
            entity.sagas = existing.sagas || [];
            entity.elements = existing.elements || [];
            entity.calendars = existing.calendars || [];
            universe.eras[modalState.editIndex] = entity;
            await saveAppData();
            await renderEraPage();
        } else {
            const universe = appData.universes[appData.currentUniverse];
            const era = universe.eras[appData.currentEra];
            const existing = era[modalState.type][modalState.editIndex];
            if (existing.mediaId && existing.mediaId !== mediaId) {
                await deleteMedia(existing.mediaId);
            }
            entity.itemline = existing.itemline || [];
            entity.lieux = existing.lieux || [];
            entity.sagas = existing.sagas || [];
            entity.elements = existing.elements || [];
            entity.calendars = existing.calendars || [];
            era[modalState.type][modalState.editIndex] = entity;
            await saveAppData();
            await renderDetailPage();
        }
    } else {
        if (modalState.type === 'universe') {
            entity.eras = [];
            appData.universes.push(entity);
            await saveAppData();
            await renderUniverses();
        } else if (modalState.type === 'era') {
            const universe = appData.universes[appData.currentUniverse];
            if (!universe.eras) universe.eras = [];
            entity.lieux = [];
            entity.sagas = [];
            entity.elements = [];
            universe.eras.push(entity);
            await saveAppData();
            await renderEras();
        } else if (modalState.parentType === 'detail') {
            const universe = appData.universes[appData.currentUniverse];
            const era = universe.eras[appData.currentEra];
            const detail = era[appData.currentDetailType][appData.currentDetail];
            if (!detail[modalState.type]) detail[modalState.type] = [];
            entity.lieux = [];
            entity.sagas = [];
            entity.elements = [];
            detail[modalState.type].push(entity);
            await saveAppData();
            await renderDetailCrossline(modalState.type);
        } else {
            const universe = appData.universes[appData.currentUniverse];
            const era = universe.eras[appData.currentEra];
            if (!era[modalState.type]) era[modalState.type] = [];
            entity.lieux = [];
            entity.sagas = [];
            entity.elements = [];
            era[modalState.type].push(entity);
            await saveAppData();
            await renderEraCrossline(modalState.type);
        }
    }

    showToast('Enregistré');
    closeModal('createModal');
}

// =============================================
// DELETE
// =============================================
function openDeleteConfirm(type) {
    deleteState.type = type;
    document.getElementById('deleteModal').classList.add('active');
}

async function confirmDelete() {
    if (deleteState.type === 'universe') {
        const universe = appData.universes[appData.currentUniverse];
        if (universe.mediaId) await deleteMedia(universe.mediaId);
        if (universe.audioIds) {
            for (const id of universe.audioIds) await deleteMedia(id);
        }
        appData.universes.splice(appData.currentUniverse, 1);
        appData.currentUniverse = null;
        await saveAppData();
        await renderUniverses();
        navigateTo('homePage');
        appData.navStack = ['home'];
    } else if (deleteState.type === 'era') {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        if (era.mediaId) await deleteMedia(era.mediaId);
        if (era.audioIds) {
            for (const id of era.audioIds) await deleteMedia(id);
        }
        universe.eras.splice(appData.currentEra, 1);
        appData.currentEra = null;
        await saveAppData();
        goBack();
    } else {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        const detail = era[appData.currentDetailType][appData.currentDetail];
        if (detail.mediaId) await deleteMedia(detail.mediaId);
        if (detail.audioIds) {
            for (const id of detail.audioIds) await deleteMedia(id);
        }
        era[appData.currentDetailType].splice(appData.currentDetail, 1);
        appData.currentDetail = null;
        await saveAppData();
        goBack();
    }

    showToast('Supprimé');
    closeModal('deleteModal');
}

// =============================================
// ITEMLINE
// =============================================
function openItemlineModal(parent) {
    itemlineState = { parentType: parent, editIndex: null };
    document.getElementById('itemlineTitle').value = '';
    document.getElementById('itemlineContent').value = '';
    document.getElementById('itemlineModal').classList.add('active');
}

function editItemline(parent, index) {
    itemlineState = { parentType: parent, editIndex: index };

    let item;
    if (parent === 'universe') {
        item = appData.universes[appData.currentUniverse].itemline[index];
    } else if (parent === 'era') {
        item = appData.universes[appData.currentUniverse].eras[appData.currentEra].itemline[index];
    } else {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        item = era[appData.currentDetailType][appData.currentDetail].itemline[index];
    }

    document.getElementById('itemlineTitle').value = item.title;
    document.getElementById('itemlineContent').value = item.content;
    document.getElementById('itemlineModal').classList.add('active');
}

async function saveItemline() {
    const title = document.getElementById('itemlineTitle').value.trim();
    const content = document.getElementById('itemlineContent').value.trim();

    if (!title) {
        showToast('Entrez un titre');
        return;
    }

    const item = { title, content };

    // Handle universe crossline separately
    if (itemlineState.parentType === 'universeCrossline') {
        const universe = appData.universes[appData.currentUniverse];
        if (!universe.crossline) universe.crossline = [];

        if (itemlineState.editIndex !== null) {
            universe.crossline[itemlineState.editIndex] = item;
        } else {
            universe.crossline.push(item);
        }

        await saveAppData();
        closeModal('itemlineModal');
        showToast('Élément enregistré');
        renderUniverseCrossline();
        restoreActiveSection('universe');
        return;
    }

    let target;

    if (itemlineState.parentType === 'universe') {
        target = appData.universes[appData.currentUniverse];
    } else if (itemlineState.parentType === 'era') {
        target = appData.universes[appData.currentUniverse].eras[appData.currentEra];
    } else {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        target = era[appData.currentDetailType][appData.currentDetail];
    }

    if (!target.itemline) target.itemline = [];

    if (itemlineState.editIndex !== null) {
        target.itemline[itemlineState.editIndex] = item;
    } else {
        target.itemline.push(item);
    }

    await saveAppData();
    closeModal('itemlineModal');
    showToast('Info enregistrée');

    if (itemlineState.parentType === 'universe') {
        renderUniverseItemline();
        restoreActiveSection('universe');
    } else if (itemlineState.parentType === 'era') {
        renderEraItemline();
        restoreActiveSection('era');
    } else {
        renderDetailItemline();
        restoreActiveSection('detail');
    }
}

function restoreActiveSection(pageType) {
    const section = activeSections[pageType];
    if (section) {
        const pageSelector = pageType === 'universe' ? '#universePage' :
                            pageType === 'era' ? '#eraPage' : '#detailPage';
        setActiveButton(pageSelector, section);
    }
}

async function deleteItemline(parent, index) {
    let target;

    if (parent === 'universe') {
        target = appData.universes[appData.currentUniverse];
    } else if (parent === 'era') {
        target = appData.universes[appData.currentUniverse].eras[appData.currentEra];
    } else {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        target = era[appData.currentDetailType][appData.currentDetail];
    }

    target.itemline.splice(index, 1);
    await saveAppData();
    showToast('Supprimé');

    if (parent === 'universe') {
        renderUniverseItemline();
        restoreActiveSection('universe');
    } else if (parent === 'era') {
        renderEraItemline();
        restoreActiveSection('era');
    } else {
        renderDetailItemline();
        restoreActiveSection('detail');
    }
}

// =============================================
// CALENDAR MODAL
// =============================================
function openCalendarModal(parent = 'era') {
    calendarState = { parentType: parent, editIndex: null };

    ['calendarName', 'calendarYearName', 'calendarMonthName', 'calendarWeekName', 'calendarDayName', 'calendarHourName'].forEach(id => {
        document.getElementById(id).value = '';
    });

    document.getElementById('daysPerWeek').value = 7;
    document.getElementById('weeksPerMonth').value = 4;
    document.getElementById('monthsPerYear').value = 12;
    document.getElementById('hoursPerDay').value = 24;
    document.getElementById('calendarModal').classList.add('active');
}

function editCalendar(parent, index) {
    calendarState = { parentType: parent, editIndex: index };

    let cal;
    if (parent === 'era') {
        cal = appData.universes[appData.currentUniverse].eras[appData.currentEra].calendars[index];
    } else {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        cal = era[appData.currentDetailType][appData.currentDetail].calendars[index];
    }

    document.getElementById('calendarName').value = cal.name || '';
    document.getElementById('calendarYearName').value = cal.yearName || '';
    document.getElementById('calendarMonthName').value = cal.monthName || '';
    document.getElementById('calendarWeekName').value = cal.weekName || '';
    document.getElementById('calendarDayName').value = cal.dayName || '';
    document.getElementById('calendarHourName').value = cal.hourName || '';
    document.getElementById('daysPerWeek').value = cal.daysPerWeek || 7;
    document.getElementById('weeksPerMonth').value = cal.weeksPerMonth || 4;
    document.getElementById('monthsPerYear').value = cal.monthsPerYear || 12;
    document.getElementById('hoursPerDay').value = cal.hoursPerDay || 24;
    document.getElementById('calendarModal').classList.add('active');
}

async function saveCalendar() {
    const name = document.getElementById('calendarName').value.trim();

    if (!name) {
        showToast('Entrez un nom');
        return;
    }

    const cal = {
        name: name,
        yearName: document.getElementById('calendarYearName').value.trim() || 'Année',
        monthName: document.getElementById('calendarMonthName').value.trim() || 'Mois',
        weekName: document.getElementById('calendarWeekName').value.trim() || 'Semaine',
        dayName: document.getElementById('calendarDayName').value.trim() || 'Jour',
        hourName: document.getElementById('calendarHourName').value.trim() || 'Heure',
        daysPerWeek: parseInt(document.getElementById('daysPerWeek').value) || 7,
        weeksPerMonth: parseInt(document.getElementById('weeksPerMonth').value) || 4,
        monthsPerYear: parseInt(document.getElementById('monthsPerYear').value) || 12,
        hoursPerDay: parseInt(document.getElementById('hoursPerDay').value) || 24
    };

    let target;
    if (calendarState.parentType === 'era') {
        target = appData.universes[appData.currentUniverse].eras[appData.currentEra];
    } else {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        target = era[appData.currentDetailType][appData.currentDetail];
    }

    if (!target.calendars) target.calendars = [];

    if (calendarState.editIndex !== null) {
        target.calendars[calendarState.editIndex] = cal;
    } else {
        target.calendars.push(cal);
    }

    await saveAppData();
    closeModal('calendarModal');
    showToast('Calendrier enregistré');

    if (calendarState.parentType === 'era') {
        renderEraCalendars();
        restoreActiveSection('era');
    } else {
        renderDetailCalendars();
        restoreActiveSection('detail');
    }
}

async function deleteCalendar(parent, index) {
    let target;

    if (parent === 'era') {
        target = appData.universes[appData.currentUniverse].eras[appData.currentEra];
    } else {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        target = era[appData.currentDetailType][appData.currentDetail];
    }

    target.calendars.splice(index, 1);
    await saveAppData();
    showToast('Supprimé');

    if (parent === 'era') {
        renderEraCalendars();
        restoreActiveSection('era');
    } else {
        renderDetailCalendars();
        restoreActiveSection('detail');
    }
}

// =============================================
// AUDIO PLAYER
// =============================================
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
