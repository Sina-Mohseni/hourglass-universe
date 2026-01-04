/* =============================================
   SAGAS
   ============================================= */

async function renderSagas() {
    const universe = appData.universes[appData.currentUniverse];
    const era = universe.eras[appData.currentEra];
    const grid = document.getElementById('sagasGrid');
    grid.innerHTML = '';

    if (!era.sagas) era.sagas = [];

    for (let i = 0; i < era.sagas.length; i++) {
        const saga = era.sagas[i];
        const card = document.createElement('div');
        card.className = 'card-era';
        card.onclick = () => openSaga(i);
        card.innerHTML = `${await getCardBackground(saga.mediaId)}<div class="card-content"><div class="card-title">${saga.name}</div><div class="card-desc">${saga.description || ''}</div></div>`;
        grid.appendChild(card);
    }

    const addCard = document.createElement('div');
    addCard.className = 'card-era add-card';
    addCard.onclick = () => openCreateModal('saga');
    addCard.innerHTML = '<div class="add-icon">+</div><span class="add-text">Nouvelle Saga</span>';
    grid.appendChild(addCard);
}

async function openSaga(index) {
    appData.currentSaga = index;
    appData.navStack.push('saga');
    await renderSagaPage();
    navigateTo('sagaPage');
    saveAppData();
}

async function renderSagaPage() {
    const universe = appData.universes[appData.currentUniverse];
    const era = universe.eras[appData.currentEra];
    const saga = era.sagas[appData.currentSaga];
    if (!saga) return;

    document.getElementById('sagaTitle').textContent = saga.name;
    document.getElementById('sagaDesc').textContent = saga.description || '';
    document.getElementById('sagaParentContext').textContent = era.name;

    await renderBackground('sagaBackground', saga.mediaId);

    const musicBtn = document.getElementById('sagaMusicBtn');
    musicBtn.style.display = (saga.audioIds && saga.audioIds.length) ? 'flex' : 'none';

    if (saga.audioIds) await loadAudioTracks(saga.audioIds);

    hideAllSagaSections();
}

function hideAllSagaSections() {
    ['sagaItemline', 'sagaCrossline', 'sagaTimeline'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    document.querySelectorAll('#sagaPage .sub-menu-btn').forEach(b => b.classList.remove('active'));
    const container = document.getElementById('sagaSubMenus');
    if (container) container.setAttribute('data-active', '0');
}

async function showSagaSection(section) {
    hideAllSagaSections();
    activeSections.saga = section;
    document.getElementById('saga' + section.charAt(0).toUpperCase() + section.slice(1)).style.display = 'block';

    setActiveButton('#sagaPage', section);

    if (section === 'itemline') {
        renderSagaItemline();
    } else if (section === 'crossline') {
        await renderSagaCrossline('histoires');
    } else if (section === 'timeline') {
        renderSagaCalendars();
    }
}

function renderSagaItemline() {
    const universe = appData.universes[appData.currentUniverse];
    const era = universe.eras[appData.currentEra];
    const saga = era.sagas[appData.currentSaga];
    const container = document.getElementById('sagaItemlineList');
    container.innerHTML = '';

    if (!saga.itemline || !saga.itemline.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">Aucune info</div></div>';
        return;
    }

    saga.itemline.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'itemline-item';
        el.innerHTML = `
            <div class="itemline-item-header">
                <div class="itemline-item-title">${item.title}</div>
                <div class="itemline-item-actions">
                    <button class="itemline-item-btn" onclick="editItemline('saga',${index})">✎</button>
                    <button class="itemline-item-btn delete" onclick="deleteItemline('saga',${index})">✕</button>
                </div>
            </div>
            <div class="itemline-item-content">${item.content}</div>
        `;
        container.appendChild(el);
    });
}

// Saga Crossline
async function showSagaCrosslineType(type) {
    currentSagaCrosslineType = type;
    document.querySelectorAll('#sagaCrossline .sub-crossline-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    await renderSagaCrossline(type);
}

async function renderSagaCrossline(type) {
    const universe = appData.universes[appData.currentUniverse];
    const era = universe.eras[appData.currentEra];
    const saga = era.sagas[appData.currentSaga];
    const grid = document.getElementById('sagaCrosslineGrid');
    grid.innerHTML = '';

    if (!saga[type]) saga[type] = [];

    for (let i = 0; i < saga[type].length; i++) {
        const item = saga[type][i];
        const card = document.createElement('div');
        card.className = 'card-crossline';
        card.onclick = () => openDetail(i, type);
        card.innerHTML = `${await getCardBackground(item.mediaId)}<div class="card-overlay"></div><div class="card-content"><div class="card-title">${item.name}</div><div class="card-desc">${item.description || ''}</div></div>`;
        grid.appendChild(card);
    }

    const addCard = document.createElement('div');
    addCard.className = 'card-crossline add-card';
    addCard.onclick = () => openCreateModal(type, 'saga');
    addCard.innerHTML = '<div class="add-icon">+</div><span class="add-text">Nouveau</span>';
    grid.appendChild(addCard);
}

// Saga Calendars
function renderSagaCalendars() {
    const universe = appData.universes[appData.currentUniverse];
    const era = universe.eras[appData.currentEra];
    const saga = era.sagas[appData.currentSaga];
    const container = document.getElementById('sagaCalendarsContainer');
    container.innerHTML = '';

    if (!saga.calendars || !saga.calendars.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">Aucun calendrier</div></div>';
        return;
    }

    saga.calendars.forEach((cal, index) => {
        container.appendChild(createCalendarElement(cal, index, 'saga'));
    });
}
