/* =============================================
   WORLD PAGE - Worlds from Temporal System Points
   ============================================= */

/**
 * World data is stored within temporal system points.
 * A World is a point with isWorld = true
 * Each World can have:
 * - eras: Array of eras within this world
 * - itemline: Array of info items
 * - calendars: Array of calendars
 * - mediaId: Optional background image/video
 * - audioIds: Optional audio tracks
 */

// Render worlds in Universe crossline
async function renderWorlds() {
    const universe = appData.universes[appData.currentUniverse];
    const grid = document.getElementById('worldsGrid');
    grid.innerHTML = '';

    // Get all worlds from temporal systems
    const worlds = getWorldsWithData();

    if (worlds.length === 0) {
        grid.innerHTML = `
            <div class="empty-state-full">
                <div class="empty-icon">🌍</div>
                <div class="empty-text">Aucun Monde</div>
                <p class="empty-hint">Créez un système temporel et activez des points comme Mondes dans la Timeline.</p>
            </div>
        `;
        return;
    }

    for (let i = 0; i < worlds.length; i++) {
        const worldInfo = worlds[i];
        const worldData = getWorldData(worldInfo.systemIndex, worldInfo.pointIndex);

        const card = document.createElement('div');
        card.className = 'card-world';
        card.onclick = () => openWorld(worldInfo.systemIndex, worldInfo.pointIndex);
        card.innerHTML = `
            ${await getCardBackground(worldData.mediaId)}
            <div class="card-overlay"></div>
            <div class="card-content">
                <div class="card-title">${worldInfo.point.name}</div>
                <div class="card-desc">${worldData.description || ''}</div>
                <div class="card-meta">
                    <span class="world-system-badge">${worldInfo.systemName}</span>
                    ${worldData.eras && worldData.eras.length > 0 ? `<span class="world-eras-count">${worldData.eras.length} ère(s)</span>` : ''}
                </div>
            </div>
        `;
        grid.appendChild(card);
    }
}

// Get all worlds with their temporal system info
function getWorldsWithData() {
    const universe = appData.universes[appData.currentUniverse];
    if (!universe || !universe.temporalSystems) return [];

    const worlds = [];
    universe.temporalSystems.forEach((system, systemIndex) => {
        if (system.points) {
            system.points.forEach((point, pointIndex) => {
                if (point.isWorld) {
                    worlds.push({
                        systemIndex,
                        pointIndex,
                        point,
                        systemName: system.name
                    });
                }
            });
        }
    });

    return worlds;
}

// Get world data (eras, itemline, etc.) from universe.worlds
function getWorldData(systemIndex, pointIndex) {
    const universe = appData.universes[appData.currentUniverse];
    const worldKey = `${systemIndex}_${pointIndex}`;

    if (!universe.worlds) universe.worlds = {};
    if (!universe.worlds[worldKey]) {
        universe.worlds[worldKey] = {
            eras: [],
            itemline: [],
            calendars: [],
            description: '',
            mediaId: null,
            audioIds: []
        };
    }

    return universe.worlds[worldKey];
}

// Open a world page
async function openWorld(systemIndex, pointIndex) {
    appData.currentWorldSystem = systemIndex;
    appData.currentWorldPoint = pointIndex;
    appData.navStack.push('world');
    await renderWorldPage();
    navigateTo('worldPage');
    saveAppData();
}

// Render the world page
async function renderWorldPage() {
    const universe = appData.universes[appData.currentUniverse];
    const system = universe.temporalSystems[appData.currentWorldSystem];
    const point = system.points[appData.currentWorldPoint];
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);

    document.getElementById('worldTitle').textContent = point.name;
    document.getElementById('worldDesc').textContent = worldData.description || '';
    document.getElementById('worldParentContext').textContent = `${universe.name} - ${system.name}`;
    document.getElementById('worldFooterTitle').textContent = point.name;

    await renderBackground('worldBackground', worldData.mediaId);

    const musicBtn = document.getElementById('worldMusicBtn');
    musicBtn.style.display = (worldData.audioIds && worldData.audioIds.length) ? 'flex' : 'none';

    if (worldData.audioIds) await loadAudioTracks(worldData.audioIds);

    hideAllWorldSections();
}

function hideAllWorldSections() {
    ['worldItemline', 'worldCrossline', 'worldTimeline'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    document.querySelectorAll('#worldPage .sub-menu-btn').forEach(b => b.classList.remove('active'));
    const container = document.getElementById('worldSubMenus');
    if (container) container.setAttribute('data-active', '0');
}

async function showWorldSection(section) {
    hideAllWorldSections();
    activeSections.world = section;
    document.getElementById('world' + section.charAt(0).toUpperCase() + section.slice(1)).style.display = 'block';

    setActiveButton('#worldPage', section);

    if (section === 'itemline') {
        renderWorldItemline();
    } else if (section === 'crossline') {
        await renderEras();
    } else if (section === 'timeline') {
        renderWorldCalendars();
    }
}

function renderWorldItemline() {
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const container = document.getElementById('worldItemlineList');
    container.innerHTML = '';

    if (!worldData.itemline || !worldData.itemline.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">Aucune info</div></div>';
        return;
    }

    worldData.itemline.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'itemline-item';
        el.innerHTML = `
            <div class="itemline-item-header">
                <div class="itemline-item-title">${item.title}</div>
                <div class="itemline-item-actions">
                    <button class="itemline-item-btn" onclick="editItemline('world',${index})">✎</button>
                    <button class="itemline-item-btn delete" onclick="deleteItemline('world',${index})">✕</button>
                </div>
            </div>
            <div class="itemline-item-content">${item.content}</div>
        `;
        container.appendChild(el);
    });
}

function renderWorldCalendars() {
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const container = document.getElementById('worldCalendarsContainer');
    container.innerHTML = '';

    if (!worldData.calendars || !worldData.calendars.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">Aucun calendrier</div></div>';
        return;
    }

    worldData.calendars.forEach((cal, index) => {
        container.appendChild(createCalendarElement(cal, index, 'world'));
    });
}

// Get current world name for context
function getCurrentWorldName() {
    const universe = appData.universes[appData.currentUniverse];
    if (!universe || !universe.temporalSystems) return '';

    const system = universe.temporalSystems[appData.currentWorldSystem];
    if (!system || !system.points) return '';

    const point = system.points[appData.currentWorldPoint];
    return point ? point.name : '';
}
