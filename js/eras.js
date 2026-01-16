/* =============================================
   ERAS - Now inside Worlds
   ============================================= */

async function renderEras() {
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const grid = document.getElementById('erasGrid');
    grid.innerHTML = '';

    if (!worldData.eras) worldData.eras = [];

    for (let i = 0; i < worldData.eras.length; i++) {
        const era = worldData.eras[i];
        const card = document.createElement('div');
        card.className = 'card-era';
        card.onclick = () => openEra(i);
        card.innerHTML = `${await getCardBackground(era.mediaId)}<div class="card-overlay"></div><div class="card-content"><div class="card-title">${era.name}</div><div class="card-desc">${era.description || ''}</div></div>`;
        grid.appendChild(card);
    }

    const addCard = document.createElement('div');
    addCard.className = 'card-era add-card';
    addCard.onclick = () => openCreateModal('era');
    addCard.innerHTML = '<div class="add-icon">+</div><span class="add-text">Nouvelle Ère</span>';
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
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const era = worldData.eras[appData.currentEra];
    if (!era) return;

    document.getElementById('eraTitle').textContent = era.name;
    document.getElementById('eraDesc').textContent = era.description || '';
    document.getElementById('eraParentContext').textContent = getCurrentWorldName();
    document.getElementById('eraFooterTitle').textContent = era.name;

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
        await renderSagas();
    } else if (section === 'timeline') {
        renderEraCalendars();
    }
}

function renderEraItemline() {
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const era = worldData.eras[appData.currentEra];
    const container = document.getElementById('eraItemlineList');
    container.innerHTML = '';

    if (!era || !era.itemline || !era.itemline.length) {
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

