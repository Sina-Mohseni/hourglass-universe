/* =============================================
   ERAS
   ============================================= */

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
    document.getElementById('eraParentContext').textContent = universe.name;

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

// Era Crossline
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
        card.className = 'card-crossline';
        card.onclick = () => openDetail(i, type);
        card.innerHTML = `${await getCardBackground(item.mediaId)}<div class="card-overlay"></div><div class="card-content"><div class="card-title">${item.name}</div><div class="card-desc">${item.description || ''}</div></div>`;
        grid.appendChild(card);
    }

    const addCard = document.createElement('div');
    addCard.className = 'card-crossline add-card';
    addCard.onclick = () => openCreateModal(type);
    addCard.innerHTML = '<div class="add-icon">+</div><span class="add-text">Nouveau</span>';
    grid.appendChild(addCard);
}
