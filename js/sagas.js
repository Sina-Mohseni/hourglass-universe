/* =============================================
   SAGAS - Restructured with Scénarii & Éléments
   ============================================= */

// Current state for saga crossline
let currentSagaCrosslineMain = 'scenarii';
let currentSagaScenarioType = 'histoires';
let editingElementTypeIndex = null;

async function renderSagas() {
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const era = worldData.eras[appData.currentEra];
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
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const era = worldData.eras[appData.currentEra];
    const saga = era.sagas[appData.currentSaga];
    if (!saga) return;

    // Initialize saga data structure if needed
    if (!saga.histoires) saga.histoires = [];
    if (!saga.sujets) saga.sujets = [];
    if (!saga.elementTypes) saga.elementTypes = [];
    if (!saga.selectedCalendars) saga.selectedCalendars = [];

    document.getElementById('sagaTitle').textContent = saga.name;
    document.getElementById('sagaDesc').textContent = saga.description || '';
    document.getElementById('sagaParentContext').textContent = era.name;

    await renderBackground('sagaBackground', saga.mediaId);

    const musicBtn = document.getElementById('sagaMusicBtn');
    musicBtn.style.display = (saga.audioIds && saga.audioIds.length) ? 'flex' : 'none';

    if (saga.audioIds) await loadAudioTracks(saga.audioIds);

    // Reset crossline state
    currentSagaCrosslineMain = 'scenarii';
    currentSagaScenarioType = 'histoires';

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
        await showSagaCrosslineMain(currentSagaCrosslineMain);
    } else if (section === 'timeline') {
        renderSagaCalendarSelection();
    }
}

/* =============================================
   SAGA ITEMLINE - Descriptions
   ============================================= */

function renderSagaItemline() {
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const era = worldData.eras[appData.currentEra];
    const saga = era.sagas[appData.currentSaga];
    const container = document.getElementById('sagaItemlineList');
    container.innerHTML = '';

    if (!saga.itemline || !saga.itemline.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">Aucune description</div></div>';
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

/* =============================================
   SAGA CROSSLINE - Main Tabs (Scénarii / Éléments)
   ============================================= */

async function showSagaCrosslineMain(mainTab) {
    currentSagaCrosslineMain = mainTab;

    // Update main tab buttons
    document.querySelectorAll('#sagaCrossline .crossline-main-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === mainTab);
    });

    // Show/hide sections
    document.getElementById('sagaScenariiSection').style.display = mainTab === 'scenarii' ? 'block' : 'none';
    document.getElementById('sagaElementsSection').style.display = mainTab === 'elements' ? 'block' : 'none';

    if (mainTab === 'scenarii') {
        await renderSagaScenariiBlocks();
    } else {
        renderSagaElementTypes();
    }
}

/* =============================================
   SAGA SCÉNARII - Histoires & Sujets (Collapsible Blocks)
   ============================================= */

// Scenario type definitions
const scenarioTypes = [
    { key: 'histoires', name: 'Histoires', icon: '📖', desc: 'Scénarios du point de vue d\'ensemble' },
    { key: 'sujets', name: 'Sujets', icon: '👤', desc: 'Scénarios du point de vue du sujet' }
];

async function renderSagaScenariiBlocks() {
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const era = worldData.eras[appData.currentEra];
    const saga = era.sagas[appData.currentSaga];
    const container = document.getElementById('sagaScenariiContainer');
    container.innerHTML = '';

    for (const scenarioType of scenarioTypes) {
        if (!saga[scenarioType.key]) saga[scenarioType.key] = [];
        const count = saga[scenarioType.key].length;

        const block = document.createElement('div');
        block.className = 'element-type-block scenario-type-block';
        block.innerHTML = `
            <div class="element-type-header" onclick="toggleScenarioTypeExpand('${scenarioType.key}')">
                <div class="element-type-icon">${scenarioType.icon}</div>
                <div class="element-type-info">
                    <div class="element-type-name">${scenarioType.name}</div>
                    <div class="element-type-count">${count} ${scenarioType.key === 'histoires' ? 'histoire' : 'sujet'}${count > 1 ? 's' : ''}</div>
                </div>
                <div class="element-type-actions">
                    <svg class="element-type-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </div>
            </div>
            <div class="element-type-content" id="scenarioTypeContent_${scenarioType.key}">
                <p class="scenario-type-desc">${scenarioType.desc}</p>
                <div class="element-type-elements" id="scenarioTypeItems_${scenarioType.key}"></div>
                <button class="btn btn-secondary btn-small" onclick="openCreateModal('${scenarioType.key}', 'saga')" style="margin-top:12px;width:100%">+ ${scenarioType.key === 'histoires' ? 'Nouvelle histoire' : 'Nouveau sujet'}</button>
            </div>
        `;
        container.appendChild(block);

        // Render items for this scenario type
        await renderScenarioItems(scenarioType.key);
    }
}

function toggleScenarioTypeExpand(typeKey) {
    const content = document.getElementById(`scenarioTypeContent_${typeKey}`);
    const block = content.parentElement;
    block.classList.toggle('expanded');
}

async function renderScenarioItems(typeKey) {
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const era = worldData.eras[appData.currentEra];
    const saga = era.sagas[appData.currentSaga];
    const container = document.getElementById(`scenarioTypeItems_${typeKey}`);
    container.innerHTML = '';

    if (!saga[typeKey] || saga[typeKey].length === 0) {
        container.innerHTML = `<div class="empty-elements">Aucun${typeKey === 'histoires' ? 'e histoire' : ' sujet'}</div>`;
        return;
    }

    for (let i = 0; i < saga[typeKey].length; i++) {
        const item = saga[typeKey][i];
        const card = document.createElement('div');
        card.className = 'element-card';
        card.onclick = () => openDetail(i, typeKey);

        let bgHtml = '';
        if (item.mediaId) {
            bgHtml = await getCardBackground(item.mediaId);
        }

        card.innerHTML = `
            ${bgHtml}
            <div class="element-card-content">
                <div class="element-card-name">${item.name}</div>
            </div>
        `;
        container.appendChild(card);
    }
}

// Legacy function for compatibility - now calls the block renderer
async function renderSagaScenarii(type) {
    await renderSagaScenariiBlocks();
}

/* =============================================
   SAGA ÉLÉMENTS - Types & Elements
   ============================================= */

function renderSagaElementTypes() {
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const era = worldData.eras[appData.currentEra];
    const saga = era.sagas[appData.currentSaga];
    const container = document.getElementById('sagaElementTypesContainer');
    container.innerHTML = '';

    if (!saga.elementTypes) saga.elementTypes = [];

    if (saga.elementTypes.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-text">Aucun type d\'élément créé</div></div>';
        return;
    }

    saga.elementTypes.forEach((type, typeIndex) => {
        const typeEl = document.createElement('div');
        typeEl.className = 'element-type-block';

        const elementsCount = type.elements ? type.elements.length : 0;

        typeEl.innerHTML = `
            <div class="element-type-header" onclick="toggleElementTypeExpand(${typeIndex})">
                <div class="element-type-icon">${type.icon || '📁'}</div>
                <div class="element-type-info">
                    <div class="element-type-name">${type.name}</div>
                    <div class="element-type-count">${elementsCount} élément${elementsCount > 1 ? 's' : ''}</div>
                </div>
                <div class="element-type-actions">
                    <button class="element-type-btn" onclick="event.stopPropagation(); editElementType(${typeIndex})">✎</button>
                    <svg class="element-type-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </div>
            </div>
            <div class="element-type-content" id="elementTypeContent_${typeIndex}">
                <div class="element-type-elements" id="elementTypeElements_${typeIndex}"></div>
                <button class="btn btn-secondary btn-small" onclick="openCreateElementModal(${typeIndex})" style="margin-top:12px;width:100%">+ Ajouter un élément</button>
            </div>
        `;
        container.appendChild(typeEl);

        // Render elements for this type
        renderElementsForType(typeIndex);
    });
}

function toggleElementTypeExpand(typeIndex) {
    const content = document.getElementById(`elementTypeContent_${typeIndex}`);
    const block = content.parentElement;
    block.classList.toggle('expanded');
}

async function renderElementsForType(typeIndex) {
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const era = worldData.eras[appData.currentEra];
    const saga = era.sagas[appData.currentSaga];
    const type = saga.elementTypes[typeIndex];
    const container = document.getElementById(`elementTypeElements_${typeIndex}`);
    container.innerHTML = '';

    if (!type.elements || type.elements.length === 0) {
        container.innerHTML = '<div class="empty-elements">Aucun élément</div>';
        return;
    }

    for (let i = 0; i < type.elements.length; i++) {
        const el = type.elements[i];
        const card = document.createElement('div');
        card.className = 'element-card';
        card.onclick = () => openElementDetail(typeIndex, i);

        let bgHtml = '';
        if (el.mediaId) {
            bgHtml = await getCardBackground(el.mediaId);
        }

        card.innerHTML = `
            ${bgHtml}
            <div class="element-card-content">
                <div class="element-card-name">${el.name}</div>
            </div>
        `;
        container.appendChild(card);
    }
}

/* =============================================
   EMOJI PICKER & ELEMENT TYPE MODAL
   ============================================= */

function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.classList.toggle('active');
}

function selectEmoji(emoji) {
    document.getElementById('selectedEmoji').textContent = emoji;
    document.getElementById('elementTypeIcon').value = emoji;
    document.getElementById('emojiPicker').classList.remove('active');
}

// Close emoji picker when clicking outside
document.addEventListener('click', function(e) {
    const picker = document.getElementById('emojiPicker');
    const selected = document.getElementById('selectedEmoji');
    if (picker && selected && !picker.contains(e.target) && !selected.contains(e.target)) {
        picker.classList.remove('active');
    }
});

/* =============================================
   ELEMENT TYPE MODAL
   ============================================= */

function openElementTypeModal(editIndex = null) {
    editingElementTypeIndex = editIndex;

    const modal = document.getElementById('elementTypeModal');
    const title = document.getElementById('elementTypeModalTitle');
    const deleteBtn = document.getElementById('deleteElementTypeBtn');

    document.getElementById('elementTypeName').value = '';
    document.getElementById('elementTypeDesc').value = '';
    document.getElementById('elementTypeIcon').value = '📁';
    document.getElementById('selectedEmoji').textContent = '📁';
    document.getElementById('emojiPicker').classList.remove('active');

    if (editIndex !== null) {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        const era = worldData.eras[appData.currentEra];
        const saga = era.sagas[appData.currentSaga];
        const type = saga.elementTypes[editIndex];

        title.textContent = 'Modifier le type';
        deleteBtn.style.display = 'inline-flex';

        document.getElementById('elementTypeName').value = type.name || '';
        document.getElementById('elementTypeDesc').value = type.description || '';
        document.getElementById('elementTypeIcon').value = type.icon || '📁';
        document.getElementById('selectedEmoji').textContent = type.icon || '📁';
    } else {
        title.textContent = 'Nouveau type d\'élément';
        deleteBtn.style.display = 'none';
    }

    modal.classList.add('active');
}

function editElementType(index) {
    openElementTypeModal(index);
}

async function saveElementType() {
    const name = document.getElementById('elementTypeName').value.trim();
    const description = document.getElementById('elementTypeDesc').value.trim();
    const icon = document.getElementById('elementTypeIcon').value.trim() || '📁';

    if (!name) {
        showToast('Veuillez entrer un nom pour le type');
        return;
    }

    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const era = worldData.eras[appData.currentEra];
    const saga = era.sagas[appData.currentSaga];

    if (!saga.elementTypes) saga.elementTypes = [];

    if (editingElementTypeIndex !== null) {
        // Update existing
        saga.elementTypes[editingElementTypeIndex].name = name;
        saga.elementTypes[editingElementTypeIndex].description = description;
        saga.elementTypes[editingElementTypeIndex].icon = icon;
    } else {
        // Create new
        saga.elementTypes.push({
            name,
            description,
            icon,
            elements: []
        });
    }

    await saveAppData();
    closeModal('elementTypeModal');
    renderSagaElementTypes();
    showToast(editingElementTypeIndex !== null ? 'Type modifié' : 'Type créé');
}

async function deleteElementType() {
    if (editingElementTypeIndex === null) return;

    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const era = worldData.eras[appData.currentEra];
    const saga = era.sagas[appData.currentSaga];

    saga.elementTypes.splice(editingElementTypeIndex, 1);

    await saveAppData();
    closeModal('elementTypeModal');
    renderSagaElementTypes();
    showToast('Type supprimé');
}

/* =============================================
   ELEMENT CREATION & DETAIL
   ============================================= */

let currentElementTypeIndex = null;
let editingElementIndex = null;

function openCreateElementModal(typeIndex) {
    currentElementTypeIndex = typeIndex;

    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const era = worldData.eras[appData.currentEra];
    const saga = era.sagas[appData.currentSaga];
    const type = saga.elementTypes[typeIndex];

    // Reset and configure modal state for element creation
    resetModalState();
    modalState.type = 'element';
    modalState.mode = 'create';
    modalState.parentType = 'saga';
    modalState.elementTypeIndex = typeIndex;

    document.getElementById('modalTitle').textContent = `Nouvel élément - ${type.name}`;
    document.getElementById('inputName').value = '';
    document.getElementById('inputDesc').value = '';
    document.getElementById('mediaPreview').innerHTML = '';
    document.getElementById('mediaPreview').classList.remove('active');
    document.getElementById('audioList').innerHTML = '';
    document.getElementById('audioList').style.display = 'none';

    document.getElementById('modalSaveBtn').textContent = 'Créer';
    document.getElementById('createModal').classList.add('active');
}

function openElementDetail(typeIndex, elementIndex) {
    currentElementTypeIndex = typeIndex;
    appData.currentDetail = elementIndex;
    appData.currentDetailType = 'element';
    appData.currentElementTypeIndex = typeIndex;
    appData.navStack.push('detail');
    renderDetailPage();
    navigateTo('detailPage');
    saveAppData();
}

/* =============================================
   SAGA TIMELINE - Calendar Selection
   ============================================= */

function renderSagaCalendarSelection() {
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const era = worldData.eras[appData.currentEra];
    const saga = era.sagas[appData.currentSaga];
    const container = document.getElementById('sagaCalendarSelection');
    container.innerHTML = '';

    if (!saga.selectedCalendars) saga.selectedCalendars = [];

    // Collect all available calendars from Universe and Era
    const availableCalendars = [];

    // Universe calendars (from era timeline)
    if (era.calendars && era.calendars.length > 0) {
        era.calendars.forEach((cal, idx) => {
            availableCalendars.push({
                source: 'era',
                sourceLabel: era.name,
                calendar: cal,
                index: idx
            });
        });
    }

    if (availableCalendars.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <div class="empty-text">Aucun calendrier disponible</div>
                <p style="color:var(--text-muted);margin-top:8px;font-size:12px">Créez des calendriers depuis la timeline de l'Époque</p>
            </div>
        `;
        return;
    }

    // Create calendar selection grid
    const grid = document.createElement('div');
    grid.className = 'calendar-selection-grid';

    availableCalendars.forEach((item, idx) => {
        const isSelected = saga.selectedCalendars.some(
            sel => sel.source === item.source && sel.index === item.index
        );

        const card = document.createElement('div');
        card.className = `calendar-select-card ${isSelected ? 'selected' : ''}`;
        card.onclick = () => toggleCalendarSelection(item.source, item.index);

        card.innerHTML = `
            <div class="calendar-select-check">${isSelected ? '✓' : ''}</div>
            <div class="calendar-select-icon">📅</div>
            <div class="calendar-select-info">
                <div class="calendar-select-name">${item.calendar.name}</div>
                <div class="calendar-select-source">${item.sourceLabel}</div>
            </div>
        `;
        grid.appendChild(card);
    });

    container.appendChild(grid);

    // Show selected calendars details
    if (saga.selectedCalendars.length > 0) {
        const selectedSection = document.createElement('div');
        selectedSection.className = 'selected-calendars-section';
        selectedSection.innerHTML = '<h4 class="selected-calendars-title">Calendriers sélectionnés</h4>';

        const selectedList = document.createElement('div');
        selectedList.className = 'selected-calendars-list';

        saga.selectedCalendars.forEach(sel => {
            let cal = null;
            if (sel.source === 'era' && era.calendars && era.calendars[sel.index]) {
                cal = era.calendars[sel.index];
            }
            if (cal) {
                selectedList.appendChild(createCalendarDisplayElement(cal));
            }
        });

        selectedSection.appendChild(selectedList);
        container.appendChild(selectedSection);
    }
}

async function toggleCalendarSelection(source, index) {
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const era = worldData.eras[appData.currentEra];
    const saga = era.sagas[appData.currentSaga];

    if (!saga.selectedCalendars) saga.selectedCalendars = [];

    const existingIdx = saga.selectedCalendars.findIndex(
        sel => sel.source === source && sel.index === index
    );

    if (existingIdx >= 0) {
        saga.selectedCalendars.splice(existingIdx, 1);
    } else {
        saga.selectedCalendars.push({ source, index });
    }

    await saveAppData();
    renderSagaCalendarSelection();
}

function createCalendarDisplayElement(cal) {
    const el = document.createElement('div');
    el.className = 'calendar-display-item';

    const daysPerYear = (cal.daysPerWeek || 7) * (cal.weeksPerMonth || 4) * (cal.monthsPerYear || 12);

    el.innerHTML = `
        <div class="calendar-display-name">${cal.name}</div>
        <div class="calendar-display-structure">
            <span>${cal.monthsPerYear || 12} ${cal.monthName || 'mois'}</span>
            <span>×</span>
            <span>${cal.weeksPerMonth || 4} ${cal.weekName || 'semaines'}</span>
            <span>×</span>
            <span>${cal.daysPerWeek || 7} ${cal.dayName || 'jours'}</span>
            <span>=</span>
            <span class="calendar-display-total">${daysPerYear} ${cal.dayName || 'jours'}/${cal.yearName || 'an'}</span>
        </div>
    `;

    return el;
}
