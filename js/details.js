/* =============================================
   DETAIL PAGE
   ============================================= */

async function openDetail(index, type) {
    appData.currentDetail = index;
    appData.currentDetailType = type;
    appData.navStack.push('detail');
    await renderDetailPage();
    navigateTo('detailPage');
    saveAppData();
}

// Helper function to get the current detail object
function getCurrentDetail() {
    // New structure: sagas are at root level
    const saga = appData.sagas[appData.currentSaga];
    if (!saga) return null;

    const detailType = appData.currentDetailType;

    // Handle element type details
    if (detailType === 'element' && appData.currentElementTypeIndex !== undefined) {
        const elementType = saga.elementTypes[appData.currentElementTypeIndex];
        if (!elementType || !elementType.elements) return null;
        return elementType.elements[appData.currentDetail];
    }

    // Handle all other types (universes, worlds, eras, histoires, sujets)
    if (!saga[detailType]) return null;
    return saga[detailType][appData.currentDetail];
}

async function renderDetailPage() {
    const detail = getCurrentDetail();
    if (!detail) return;

    document.getElementById('detailDesc').textContent = detail.description || '';
    document.getElementById('detailFooterTitle').textContent = detail.name;

    // Always render background if mediaId exists
    await renderBackground('detailBackground', detail.mediaId);

    // Always show music button
    if (detail.audioIds && detail.audioIds.length) {
        await loadAudioTracks(detail.audioIds);
    }

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
        await renderDetailCrossline('histoires');
    } else if (section === 'timeline') {
        renderDetailCalendars();
    }
}

function renderDetailItemline() {
    const detail = getCurrentDetail();
    const container = document.getElementById('detailItemlineList');
    container.innerHTML = '';

    if (!detail || !detail.itemline || !detail.itemline.length) {
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

// Detail Crossline
async function showDetailCrosslineType(type) {
    currentDetailCrosslineType = type;
    document.querySelectorAll('#detailCrossline .sub-crossline-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    await renderDetailCrossline(type);
}

async function renderDetailCrossline(type) {
    const detail = getCurrentDetail();
    const grid = document.getElementById('detailCrosslineGrid');
    grid.innerHTML = '';

    if (!detail || !detail[type]) {
        if (detail) detail[type] = [];
    }

    if (detail && detail[type]) {
        for (let i = 0; i < detail[type].length; i++) {
            const item = detail[type][i];
            const card = document.createElement('div');
            card.className = 'card-crossline';
            card.innerHTML = `${await getCardBackground(item.mediaId)}<div class="card-overlay"></div><div class="card-content"><div class="card-title">${item.name}</div><div class="card-desc">${item.description || ''}</div></div>`;
            grid.appendChild(card);
        }
    }

    const addCard = document.createElement('div');
    addCard.className = 'card-crossline add-card';
    addCard.onclick = () => openCreateModal(type, 'detail');
    addCard.innerHTML = '<div class="add-icon">+</div><span class="add-text">Nouveau</span>';
    grid.appendChild(addCard);
}

// Detail Calendars
function renderDetailCalendars() {
    const detail = getCurrentDetail();
    const container = document.getElementById('detailCalendarsContainer');
    container.innerHTML = '';

    if (!detail || !detail.calendars || !detail.calendars.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">Aucun calendrier</div></div>';
        return;
    }

    detail.calendars.forEach((cal, index) => {
        container.appendChild(createCalendarElement(cal, index, 'detail'));
    });
}
