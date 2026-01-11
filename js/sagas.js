/* =============================================
   SAGAS - Root Level with Crossline & Timeline
   ============================================= */

// Current state for saga crossline
let currentSagaCrosslineMain = 'scenarii';
let currentSagaScenarioType = 'histoires';
let editingElementTypeIndex = null;

// Calendar accordion state
let calendarAccordionData = {
    name: '',
    years: [],
    editingCalendarIndex: null
};
let editingYearIndex = null;
let editingSubCycleIndex = null;
let editingSubCycleYearIndex = null;

/* =============================================
   HOME PAGE - Sagas Slider
   ============================================= */

async function renderSagasHome() {
    try {
        const grid = document.getElementById('sagasHomeGrid');
        if (!grid) {
            console.error('sagasHomeGrid element not found');
            return;
        }
        grid.innerHTML = '';

        // Ensure sagas array exists
        if (!Array.isArray(appData.sagas)) {
            appData.sagas = [];
        }

        for (let i = 0; i < appData.sagas.length; i++) {
            const saga = appData.sagas[i];
            if (!saga) continue;
            const card = document.createElement('div');
            card.className = 'card-universe';
            card.onclick = () => openSagaFromHome(i);
            card.innerHTML = `${await getCardBackground(saga.mediaId)}<div class="card-overlay"></div><div class="card-content"><div class="card-title">${saga.name || ''}</div><div class="card-desc">${saga.description || ''}</div></div>`;
            grid.appendChild(card);
        }

        const addCard = document.createElement('div');
        addCard.className = 'card-universe add-card';
        addCard.onclick = () => openCreateModal('saga');
        addCard.innerHTML = '<div class="add-icon">+</div><span class="add-text">Nouvelle Saga</span>';
        grid.appendChild(addCard);
    } catch (error) {
        console.error('Erreur renderSagasHome:', error);
    }
}

function slideSagas(direction) {
    const track = document.getElementById('sagasHomeGrid');
    const scrollAmount = window.innerWidth * direction;
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
}

/* =============================================
   SAGAS QUICK MENU - Switch between sagas
   ============================================= */

async function openSagasQuickMenu() {
    const container = document.getElementById('sagasQuickMenuList');
    container.innerHTML = '';

    if (!appData.sagas || appData.sagas.length === 0) {
        container.innerHTML = '<div class="quick-menu-empty">Aucune saga créée</div>';
    } else {
        for (let i = 0; i < appData.sagas.length; i++) {
            const saga = appData.sagas[i];
            const isCurrent = i === appData.currentSaga;

            const item = document.createElement('div');
            item.className = 'quick-menu-item' + (isCurrent ? ' current' : '');
            item.onclick = () => switchToSaga(i);

            let iconHtml = '<span>📖</span>';
            if (saga.mediaId) {
                try {
                    const media = await getMedia(saga.mediaId);
                    if (media && media.data) {
                        iconHtml = `<img src="${media.data}" alt="">`;
                    }
                } catch (e) {}
            }

            item.innerHTML = `
                <div class="quick-menu-item-icon">${iconHtml}</div>
                <div class="quick-menu-item-info">
                    <div class="quick-menu-item-name">${saga.name || 'Sans nom'}</div>
                    <div class="quick-menu-item-desc">${saga.description || 'Aucune description'}</div>
                </div>
                ${isCurrent ? '<span class="quick-menu-item-badge">Actuelle</span>' : ''}
            `;
            container.appendChild(item);
        }
    }

    document.getElementById('sagasQuickMenuModal').classList.add('active');
}

async function switchToSaga(index) {
    closeModal('sagasQuickMenuModal');

    if (index === appData.currentSaga) return;

    appData.currentSaga = index;
    await renderSagaPage();
    saveAppData();
    showToast('Saga changée');
}

async function openSagaFromHome(index) {
    appData.currentSaga = index;
    appData.navStack.push('saga');
    await renderSagaPage();
    navigateTo('sagaPage');
    saveAppData();
}

/* =============================================
   SAGA PAGE
   ============================================= */

async function renderSagaPage() {
    const saga = appData.sagas[appData.currentSaga];
    if (!saga) return;

    // Initialize saga data structure if needed
    if (!saga.itemline) saga.itemline = [];
    if (!saga.universes) saga.universes = [];
    if (!saga.worlds) saga.worlds = [];
    if (!saga.eras) saga.eras = [];
    if (!saga.histoires) saga.histoires = [];
    if (!saga.sujets) saga.sujets = [];
    if (!saga.elementTypes) saga.elementTypes = [];
    if (!saga.calendars) saga.calendars = [];

    document.getElementById('sagaTitle').textContent = saga.name;
    document.getElementById('sagaDesc').textContent = saga.description || '';

    // Hide parent context since saga is now root level
    const parentContext = document.getElementById('sagaParentContext');
    if (parentContext) parentContext.style.display = 'none';

    await renderBackground('sagaBackground', saga.mediaId);

    // Always show music button, load tracks if available
    if (saga.audioIds && saga.audioIds.length) {
        await loadAudioTracks(saga.audioIds);
    }

    // Reset crossline state
    currentSagaCrosslineMain = 'scenarii';
    currentSagaScenarioType = 'histoires';

    hideAllSagaSections();
}

function hideAllSagaSections() {
    ['sagaItemline', 'sagaCrossline', 'sagaTimeline'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    document.querySelectorAll('#sagaPage .sub-menu-btn').forEach(b => b.classList.remove('active'));
    const container = document.getElementById('sagaSubMenus');
    if (container) container.setAttribute('data-active', '0');
}

async function showSagaSection(section) {
    hideAllSagaSections();
    activeSections.saga = section;
    const sectionEl = document.getElementById('saga' + section.charAt(0).toUpperCase() + section.slice(1));
    if (sectionEl) sectionEl.style.display = 'block';

    setActiveButton('#sagaPage', section);

    if (section === 'itemline') {
        renderSagaItemline();
    } else if (section === 'crossline') {
        await showSagaCrosslineMain(currentSagaCrosslineMain);
    } else if (section === 'timeline') {
        renderSagaCalendarsAccordion();
    }
}

/* =============================================
   SAGA ITEMLINE - Descriptions
   ============================================= */

function renderSagaItemline() {
    const saga = appData.sagas[appData.currentSaga];
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

    // Show/hide sections (only scenarii and elements now)
    const scenariiSection = document.getElementById('sagaScenariiSection');
    const elementsSection = document.getElementById('sagaElementsSection');

    if (scenariiSection) scenariiSection.style.display = mainTab === 'scenarii' ? 'block' : 'none';
    if (elementsSection) elementsSection.style.display = mainTab === 'elements' ? 'block' : 'none';

    if (mainTab === 'scenarii') {
        await renderSagaScenariiBlocks();
    } else {
        renderSagaElementTypes();
    }
}

/* =============================================
   SAGA CRÉATION - Univers, Monde, Époque
   ============================================= */

const creationTypes = [
    { key: 'universes', name: 'Univers', icon: '🌌', desc: 'Les univers contenant vos mondes' },
    { key: 'worlds', name: 'Mondes', icon: '🌍', desc: 'Les mondes et planètes de votre saga' },
    { key: 'eras', name: 'Époques', icon: '⏳', desc: 'Les périodes historiques de votre saga' }
];

async function renderSagaCreationBlocks() {
    const saga = appData.sagas[appData.currentSaga];
    const container = document.getElementById('sagaCreationContainer');
    container.innerHTML = '';

    for (const creationType of creationTypes) {
        if (!saga[creationType.key]) saga[creationType.key] = [];
        const count = saga[creationType.key].length;

        const block = document.createElement('div');
        block.className = 'element-type-block creation-type-block';
        block.innerHTML = `
            <div class="element-type-header" onclick="toggleCreationTypeExpand('${creationType.key}')">
                <div class="element-type-icon">${creationType.icon}</div>
                <div class="element-type-info">
                    <div class="element-type-name">${creationType.name}</div>
                    <div class="element-type-count">${count} ${creationType.key === 'universes' ? 'univers' : creationType.key === 'worlds' ? 'monde' : 'époque'}${count > 1 ? 's' : ''}</div>
                </div>
                <div class="element-type-actions">
                    <svg class="element-type-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </div>
            </div>
            <div class="element-type-content" id="creationTypeContent_${creationType.key}">
                <p class="scenario-type-desc">${creationType.desc}</p>
                <div class="element-type-elements" id="creationTypeItems_${creationType.key}"></div>
                <button class="btn btn-secondary btn-small" onclick="openCreateModal('${creationType.key}', 'saga')" style="margin-top:12px;width:100%">+ ${creationType.key === 'universes' ? 'Nouvel univers' : creationType.key === 'worlds' ? 'Nouveau monde' : 'Nouvelle époque'}</button>
            </div>
        `;
        container.appendChild(block);

        // Render items for this creation type
        await renderCreationItems(creationType.key);
    }
}

function toggleCreationTypeExpand(typeKey) {
    const content = document.getElementById(`creationTypeContent_${typeKey}`);
    const block = content.parentElement;
    block.classList.toggle('expanded');
}

async function renderCreationItems(typeKey) {
    const saga = appData.sagas[appData.currentSaga];
    const container = document.getElementById(`creationTypeItems_${typeKey}`);
    container.innerHTML = '';

    if (!saga[typeKey] || saga[typeKey].length === 0) {
        const emptyText = typeKey === 'universes' ? 'Aucun univers' :
                         typeKey === 'worlds' ? 'Aucun monde' : 'Aucune époque';
        container.innerHTML = `<div class="empty-elements">${emptyText}</div>`;
        return;
    }

    for (let i = 0; i < saga[typeKey].length; i++) {
        const item = saga[typeKey][i];
        const card = document.createElement('div');
        card.className = 'element-card';
        card.onclick = () => openCreationDetail(typeKey, i);

        const bgHtml = await getCardBackground(item.mediaId);

        card.innerHTML = `
            ${bgHtml}
            <div class="element-card-content">
                <div class="element-card-name">${item.name}</div>
            </div>
        `;
        container.appendChild(card);
    }
}

function openCreationDetail(typeKey, index) {
    appData.currentDetail = index;
    appData.currentDetailType = typeKey;
    appData.navStack.push('detail');
    renderDetailPage();
    navigateTo('detailPage');
    saveAppData();
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
    const saga = appData.sagas[appData.currentSaga];
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
    const saga = appData.sagas[appData.currentSaga];
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

        const bgHtml = await getCardBackground(item.mediaId);

        card.innerHTML = `
            ${bgHtml}
            <div class="element-card-content">
                <div class="element-card-name">${item.name}</div>
            </div>
        `;
        container.appendChild(card);
    }
}

function openDetail(index, typeKey) {
    appData.currentDetail = index;
    appData.currentDetailType = typeKey;
    appData.navStack.push('detail');
    renderDetailPage();
    navigateTo('detailPage');
    saveAppData();
}

// Legacy function for compatibility
async function renderSagaScenarii(type) {
    await renderSagaScenariiBlocks();
}

/* =============================================
   SAGA ÉLÉMENTS - Types & Elements
   ============================================= */

function renderSagaElementTypes() {
    const saga = appData.sagas[appData.currentSaga];
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
    const saga = appData.sagas[appData.currentSaga];
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

        const bgHtml = await getCardBackground(el.mediaId);

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
        const saga = appData.sagas[appData.currentSaga];
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

    const saga = appData.sagas[appData.currentSaga];

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

    const saga = appData.sagas[appData.currentSaga];

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

    const saga = appData.sagas[appData.currentSaga];
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
   SAGA TIMELINE - Calendar Accordion System
   ============================================= */

function renderSagaCalendarsAccordion() {
    const saga = appData.sagas[appData.currentSaga];
    const container = document.getElementById('sagaCalendarAccordion');
    container.innerHTML = '';

    if (!saga.calendars) saga.calendars = [];

    if (saga.calendars.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <div class="empty-text">Aucun calendrier</div>
                <p style="color:var(--text-muted);margin-top:8px;font-size:12px">Créez des calendriers avec des cycles personnalisables</p>
            </div>
        `;
        return;
    }

    saga.calendars.forEach((calendar, calIndex) => {
        const calEl = document.createElement('div');
        calEl.className = 'calendar-accordion-item';

        const yearsCount = calendar.years ? calendar.years.length : 0;

        calEl.innerHTML = `
            <div class="calendar-accordion-header" onclick="toggleCalendarAccordionExpand(${calIndex})">
                <div class="calendar-accordion-icon">📅</div>
                <div class="calendar-accordion-info">
                    <div class="calendar-accordion-name">${calendar.name}</div>
                    <div class="calendar-accordion-count">${yearsCount} cycle${yearsCount > 1 ? 's' : ''}</div>
                </div>
                <div class="calendar-accordion-actions">
                    <button class="element-type-btn" onclick="event.stopPropagation(); editCalendarAccordion(${calIndex})">✎</button>
                    <button class="element-type-btn delete" onclick="event.stopPropagation(); deleteCalendarFromList(${calIndex})">✕</button>
                    <svg class="element-type-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </div>
            </div>
            <div class="calendar-accordion-content" id="calendarAccordionContent_${calIndex}">
                ${renderCalendarYearsPreview(calendar.years || [])}
            </div>
        `;
        container.appendChild(calEl);
    });
}

function renderCalendarYearsPreview(years) {
    if (!years || years.length === 0) {
        return '<div class="empty-elements">Aucun cycle défini</div>';
    }

    let html = '<div class="calendar-years-preview">';
    years.forEach((year, yIdx) => {
        const subCount = countAllSubCycles(year);
        html += `
            <div class="year-preview-block">
                <div class="year-preview-header">
                    <span class="year-preview-name">${year.name || 'Cycle'} ${year.number || (yIdx + 1)}</span>
                    <span class="year-preview-count">${subCount} sous-cycle${subCount > 1 ? 's' : ''}</span>
                </div>
                ${year.subCycles && year.subCycles.length > 0 ? `
                    <div class="year-preview-subs">
                        ${year.subCycles.slice(0, 3).map(sub => `<span class="sub-preview">${sub.name || 'Sous-cycle'} ${sub.number || ''}</span>`).join('')}
                        ${year.subCycles.length > 3 ? `<span class="sub-preview more">+${year.subCycles.length - 3}</span>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function countAllSubCycles(cycle) {
    if (!cycle.subCycles || cycle.subCycles.length === 0) return 0;
    let count = cycle.subCycles.length;
    for (const sub of cycle.subCycles) {
        count += countAllSubCycles(sub);
    }
    return count;
}

function toggleCalendarAccordionExpand(calIndex) {
    const content = document.getElementById(`calendarAccordionContent_${calIndex}`);
    const item = content.parentElement;
    item.classList.toggle('expanded');
}

/* =============================================
   CALENDAR ACCORDION MODAL - Flat List System
   ============================================= */

function openCalendarAccordionModal(editIndex = null) {
    calendarAccordionData = {
        name: '',
        years: [],
        editingCalendarIndex: editIndex
    };

    const modal = document.getElementById('calendarAccordionModal');
    const title = document.getElementById('calendarAccordionModalTitle');
    const deleteBtn = document.getElementById('deleteCalendarAccordionBtn');

    document.getElementById('accordionCalendarName').value = '';
    document.getElementById('calendarYearsAccordion').innerHTML = '';

    if (editIndex !== null) {
        const saga = appData.sagas[appData.currentSaga];
        const calendar = saga.calendars[editIndex];

        title.textContent = 'Modifier le calendrier';
        deleteBtn.style.display = 'inline-flex';

        calendarAccordionData.name = calendar.name || '';
        calendarAccordionData.years = JSON.parse(JSON.stringify(calendar.years || []));

        document.getElementById('accordionCalendarName').value = calendar.name || '';
    } else {
        title.textContent = 'Nouveau Calendrier';
        deleteBtn.style.display = 'none';
    }

    renderFlatCyclesList();
    modal.classList.add('active');
}

function editCalendarAccordion(calIndex) {
    openCalendarAccordionModal(calIndex);
}

// Flatten all cycles into a single list for display
function flattenCycles(cycles, parentPath = [], depth = 0) {
    const result = [];
    if (!cycles) return result;

    cycles.forEach((cycle, index) => {
        const path = [...parentPath, index];
        result.push({
            cycle,
            path,
            pathStr: path.join('-'),
            depth,
            index
        });
        if (cycle.subCycles && cycle.subCycles.length > 0) {
            result.push(...flattenCycles(cycle.subCycles, path, depth + 1));
        }
    });
    return result;
}

function renderFlatCyclesList() {
    const container = document.getElementById('calendarYearsAccordion');
    container.innerHTML = '';

    if (calendarAccordionData.years.length === 0) {
        container.innerHTML = '<div class="empty-elements">Aucun cycle. Cliquez sur "+ Ajouter un cycle" pour commencer.</div>';
        return;
    }

    const flatList = flattenCycles(calendarAccordionData.years);

    flatList.forEach(item => {
        container.appendChild(createFlatCycleBlock(item));
    });
}

function createFlatCycleBlock(item) {
    const { cycle, pathStr, depth, index } = item;
    const subCount = cycle.subCycles ? cycle.subCycles.length : 0;

    const block = document.createElement('div');
    block.className = 'cycle-flat-block';
    block.setAttribute('data-path', pathStr);
    block.setAttribute('data-depth', depth);

    // Depth indicator (visual hierarchy)
    const depthIndicator = depth > 0 ? '└'.padStart(depth * 2, ' ') + ' ' : '';
    const depthClass = `depth-${Math.min(depth, 4)}`;

    block.innerHTML = `
        <div class="cycle-flat-depth ${depthClass}">
            <span class="depth-line">${'─'.repeat(depth)}</span>
        </div>
        <div class="cycle-flat-content">
            <div class="cycle-flat-name">${cycle.name || 'Cycle'} ${cycle.number || (index + 1)}</div>
            <div class="cycle-flat-meta">${subCount > 0 ? `${subCount} sous-cycle${subCount > 1 ? 's' : ''}` : 'Aucun sous-cycle'}</div>
        </div>
        <div class="cycle-flat-actions">
            <button class="cycle-flat-btn add" onclick="addSubCycleAtPath('${pathStr}')" title="Ajouter sous-cycle">+</button>
            <button class="cycle-flat-btn" onclick="editCycle('${pathStr}')" title="Modifier">✎</button>
            <button class="cycle-flat-btn" onclick="copyCycle('${pathStr}')" title="Copier">📋</button>
            <button class="cycle-flat-btn delete" onclick="deleteCycle('${pathStr}')" title="Supprimer">✕</button>
        </div>
    `;

    return block;
}

// Legacy function kept for compatibility
function renderAccordionYears() {
    renderFlatCyclesList();
}

function toggleCycleExpand(pathStr) {
    // No longer needed with flat design
}

// Get cycle at path
function getCycleAtPath(path) {
    if (typeof path === 'string') {
        path = path.split('-').map(Number);
    }

    let current = calendarAccordionData.years[path[0]];
    for (let i = 1; i < path.length; i++) {
        if (!current || !current.subCycles) return null;
        current = current.subCycles[path[i]];
    }
    return current;
}

// Get parent cycles array at path
function getParentArrayAtPath(path) {
    if (typeof path === 'string') {
        path = path.split('-').map(Number);
    }

    if (path.length === 1) {
        return calendarAccordionData.years;
    }

    let current = calendarAccordionData.years[path[0]];
    for (let i = 1; i < path.length - 1; i++) {
        if (!current || !current.subCycles) return null;
        current = current.subCycles[path[i]];
    }
    return current.subCycles;
}

function addCalendarYear() {
    calendarAccordionData.years.push({
        name: 'An',
        number: String(calendarAccordionData.years.length + 1),
        subCycles: []
    });
    renderAccordionYears();
}

function addSubCycleAtPath(pathStr) {
    const cycle = getCycleAtPath(pathStr);
    if (!cycle) return;

    if (!cycle.subCycles) cycle.subCycles = [];

    const depth = pathStr.split('-').length;
    const defaultName = depth === 1 ? 'Mois' : depth === 2 ? 'Semaine' : depth === 3 ? 'Jour' : 'Période';

    cycle.subCycles.push({
        name: defaultName,
        number: String(cycle.subCycles.length + 1),
        subCycles: []
    });
    renderAccordionYears();
}

function editCycle(pathStr) {
    const cycle = getCycleAtPath(pathStr);
    if (!cycle) return;

    editingYearIndex = pathStr;

    document.getElementById('yearEditName').value = cycle.name || '';
    document.getElementById('yearEditNumber').value = cycle.number || '';
    document.getElementById('yearEditModal').classList.add('active');
}

function saveYearEdit() {
    if (editingYearIndex === null) return;

    const cycle = getCycleAtPath(editingYearIndex);
    if (!cycle) return;

    cycle.name = document.getElementById('yearEditName').value.trim() || 'Cycle';
    cycle.number = document.getElementById('yearEditNumber').value.trim() || '';

    closeModal('yearEditModal');
    renderAccordionYears();
    editingYearIndex = null;
}

function copyCycle(pathStr) {
    const path = pathStr.split('-').map(Number);
    const parentArray = getParentArrayAtPath(path);
    const index = path[path.length - 1];

    if (!parentArray || !parentArray[index]) return;

    const cycleToCopy = parentArray[index];
    const copiedCycle = JSON.parse(JSON.stringify(cycleToCopy));
    copiedCycle.number = String(parentArray.length + 1);
    parentArray.push(copiedCycle);
    renderAccordionYears();
    showToast('Cycle copié');
}

function deleteCycle(pathStr) {
    const path = pathStr.split('-').map(Number);
    const parentArray = getParentArrayAtPath(path);
    const index = path[path.length - 1];

    if (!parentArray) return;

    parentArray.splice(index, 1);
    renderAccordionYears();
}

// Legacy functions for backwards compatibility
function toggleYearExpand(yearIndex) {
    toggleCycleExpand(String(yearIndex));
}

function renderYearSubcycles(yearIndex) {
    renderAccordionYears();
}

function editYear(yearIndex) {
    editCycle(String(yearIndex));
}

function copyYear(yearIndex) {
    copyCycle(String(yearIndex));
}

function deleteYear(yearIndex) {
    deleteCycle(String(yearIndex));
}

function addSubCycle(yearIndex) {
    addSubCycleAtPath(String(yearIndex));
}

function editSubCycle(yearIndex, subIndex) {
    editCycle(`${yearIndex}-${subIndex}`);
}

function deleteSubCycle(yearIndex, subIndex) {
    deleteCycle(`${yearIndex}-${subIndex}`);
}

function saveSubCycleEdit() {
    saveYearEdit();
}

async function saveCalendarAccordion() {
    const name = document.getElementById('accordionCalendarName').value.trim();

    if (!name) {
        showToast('Veuillez entrer un nom pour le calendrier');
        return;
    }

    const saga = appData.sagas[appData.currentSaga];
    if (!saga.calendars) saga.calendars = [];

    const calendarData = {
        name: name,
        years: calendarAccordionData.years
    };

    if (calendarAccordionData.editingCalendarIndex !== null) {
        saga.calendars[calendarAccordionData.editingCalendarIndex] = calendarData;
    } else {
        saga.calendars.push(calendarData);
    }

    await saveAppData();
    closeModal('calendarAccordionModal');
    renderSagaCalendarsAccordion();
    showToast(calendarAccordionData.editingCalendarIndex !== null ? 'Calendrier modifié' : 'Calendrier créé');
}

async function deleteCalendarAccordion() {
    if (calendarAccordionData.editingCalendarIndex === null) return;

    const saga = appData.sagas[appData.currentSaga];
    saga.calendars.splice(calendarAccordionData.editingCalendarIndex, 1);

    await saveAppData();
    closeModal('calendarAccordionModal');
    renderSagaCalendarsAccordion();
    showToast('Calendrier supprimé');
}

async function deleteCalendarFromList(calIndex) {
    const saga = appData.sagas[appData.currentSaga];
    saga.calendars.splice(calIndex, 1);
    await saveAppData();
    renderSagaCalendarsAccordion();
    showToast('Calendrier supprimé');
}

/* =============================================
   LEGACY FUNCTIONS FOR ERA-BASED SAGAS
   ============================================= */

// Keep for backward compatibility with old data structure
async function renderSagas() {
    // This was for era-based sagas, now redirect to home sagas
    await renderSagasHome();
}

async function openSaga(index) {
    await openSagaFromHome(index);
}

// Legacy calendar selection (if needed)
function renderSagaCalendarSelection() {
    renderSagaCalendarsAccordion();
}
