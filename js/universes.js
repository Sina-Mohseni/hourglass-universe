/* =============================================
   UNIVERSES - Root Level Management
   ============================================= */

/* =============================================
   ROOT UNIVERSES QUICK MENU
   ============================================= */

async function openRootUniversesQuickMenu() {
    const container = document.getElementById('creationQuickMenuList');
    container.innerHTML = '';

    document.getElementById('creationQuickMenuTitle').textContent = 'Univers';
    document.getElementById('creationQuickMenuNewBtn').textContent = '+ Nouvel Univers';
    document.getElementById('creationQuickMenuNewBtn').onclick = () => {
        closeModal('creationQuickMenuModal');
        openCreateModal('universe', 'root');
    };

    container.setAttribute('data-type', 'universes');

    const items = appData.universes || [];

    if (items.length === 0) {
        container.innerHTML = '<div class="quick-menu-empty">Aucun univers créé</div>';
    } else {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const isCurrent = i === appData.currentUniverse;
            const el = document.createElement('div');
            el.className = 'quick-menu-item' + (isCurrent ? ' current' : '');
            el.onclick = () => openUniverseFromQuickMenu(i);

            const bgHtml = await getCardBackground(item.mediaId);

            el.innerHTML = `
                ${bgHtml}
                <div class="quick-menu-item-content">
                    <div class="quick-menu-item-name">${item.name || 'Sans nom'}</div>
                    <div class="quick-menu-item-desc">${item.description || 'Aucune description'}</div>
                </div>
                ${isCurrent ? '<span class="quick-menu-item-badge">Actuel</span>' : ''}
            `;
            container.appendChild(el);
        }
    }

    document.getElementById('creationQuickMenuModal').classList.add('active');
}

async function openUniverseFromQuickMenu(index) {
    closeModal('creationQuickMenuModal');
    appData.currentUniverse = index;
    appData.navStack.push('universe');
    await renderUniversePage();
    navigateTo('universePage');
    saveAppData();
}

/* =============================================
   UNIVERSE WORLDS QUICK MENU
   ============================================= */

async function openUniverseWorldsQuickMenu() {
    const universe = appData.universes?.[appData.currentUniverse];
    if (!universe) {
        showToast('Aucun univers sélectionné');
        return;
    }

    const container = document.getElementById('creationQuickMenuList');
    container.innerHTML = '';

    document.getElementById('creationQuickMenuTitle').textContent = 'Mondes';
    document.getElementById('creationQuickMenuNewBtn').textContent = '+ Nouveau Monde';
    document.getElementById('creationQuickMenuNewBtn').onclick = () => {
        closeModal('creationQuickMenuModal');
        openCreateModal('world', 'universe');
    };

    container.setAttribute('data-type', 'worlds');

    const items = universe.worlds || [];

    if (items.length === 0) {
        container.innerHTML = '<div class="quick-menu-empty">Aucun monde créé</div>';
    } else {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const isCurrent = i === appData.currentWorld;
            const el = document.createElement('div');
            el.className = 'quick-menu-item' + (isCurrent ? ' current' : '');
            el.onclick = () => openWorldFromQuickMenu(i);

            const bgHtml = await getCardBackground(item.mediaId);

            el.innerHTML = `
                ${bgHtml}
                <div class="quick-menu-item-content">
                    <div class="quick-menu-item-name">${item.name || 'Sans nom'}</div>
                    <div class="quick-menu-item-desc">${item.description || 'Aucune description'}</div>
                </div>
                ${isCurrent ? '<span class="quick-menu-item-badge">Actuel</span>' : ''}
            `;
            container.appendChild(el);
        }
    }

    document.getElementById('creationQuickMenuModal').classList.add('active');
}

async function openWorldFromQuickMenu(index) {
    closeModal('creationQuickMenuModal');
    appData.currentWorld = index;
    appData.navStack.push('world');
    await renderWorldPage();
    navigateTo('worldPage');
    saveAppData();
}

/* =============================================
   WORLD ERAS QUICK MENU
   ============================================= */

async function openWorldErasQuickMenu() {
    const universe = appData.universes?.[appData.currentUniverse];
    const world = universe?.worlds?.[appData.currentWorld];
    if (!world) {
        showToast('Aucun monde sélectionné');
        return;
    }

    const container = document.getElementById('creationQuickMenuList');
    container.innerHTML = '';

    document.getElementById('creationQuickMenuTitle').textContent = 'Époques';
    document.getElementById('creationQuickMenuNewBtn').textContent = '+ Nouvelle Époque';
    document.getElementById('creationQuickMenuNewBtn').onclick = () => {
        closeModal('creationQuickMenuModal');
        openCreateModal('era', 'world');
    };

    container.setAttribute('data-type', 'eras');

    const items = world.eras || [];

    if (items.length === 0) {
        container.innerHTML = '<div class="quick-menu-empty">Aucune époque créée</div>';
    } else {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const isCurrent = i === appData.currentEra;
            const el = document.createElement('div');
            el.className = 'quick-menu-item' + (isCurrent ? ' current' : '');
            el.onclick = () => openEraFromQuickMenu(i);

            const bgHtml = await getCardBackground(item.mediaId);

            el.innerHTML = `
                ${bgHtml}
                <div class="quick-menu-item-content">
                    <div class="quick-menu-item-name">${item.name || 'Sans nom'}</div>
                    <div class="quick-menu-item-desc">${item.description || 'Aucune description'}</div>
                </div>
                ${isCurrent ? '<span class="quick-menu-item-badge">Actuelle</span>' : ''}
            `;
            container.appendChild(el);
        }
    }

    document.getElementById('creationQuickMenuModal').classList.add('active');
}

async function openEraFromQuickMenu(index) {
    closeModal('creationQuickMenuModal');
    appData.currentEra = index;
    appData.navStack.push('era');
    await renderEraPage();
    navigateTo('eraPage');
    saveAppData();
}

/* =============================================
   ERA SAGAS QUICK MENU
   ============================================= */

async function openEraSagasQuickMenu() {
    const universe = appData.universes?.[appData.currentUniverse];
    const world = universe?.worlds?.[appData.currentWorld];
    const era = world?.eras?.[appData.currentEra];
    if (!era) {
        showToast('Aucune époque sélectionnée');
        return;
    }

    const container = document.getElementById('creationQuickMenuList');
    container.innerHTML = '';

    document.getElementById('creationQuickMenuTitle').textContent = 'Sagas';
    document.getElementById('creationQuickMenuNewBtn').textContent = '+ Nouvelle Saga';
    document.getElementById('creationQuickMenuNewBtn').onclick = () => {
        closeModal('creationQuickMenuModal');
        openCreateModal('saga', 'era');
    };

    container.setAttribute('data-type', 'sagas');

    const items = era.sagas || [];

    if (items.length === 0) {
        container.innerHTML = '<div class="quick-menu-empty">Aucune saga créée</div>';
    } else {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const el = document.createElement('div');
            el.className = 'quick-menu-item';
            el.onclick = () => {
                closeModal('creationQuickMenuModal');
                showToast('Saga: ' + item.name);
            };

            const bgHtml = await getCardBackground(item.mediaId);

            el.innerHTML = `
                ${bgHtml}
                <div class="quick-menu-item-content">
                    <div class="quick-menu-item-name">${item.name || 'Sans nom'}</div>
                    <div class="quick-menu-item-desc">${item.description || 'Aucune description'}</div>
                </div>
            `;
            container.appendChild(el);
        }
    }

    document.getElementById('creationQuickMenuModal').classList.add('active');
}

/* =============================================
   LEGACY RENDERING FUNCTIONS
   ============================================= */

async function renderUniverses() {
    try {
        const grid = document.getElementById('universesGrid');
        if (!grid) {
            console.error('universesGrid element not found');
            return;
        }
        grid.innerHTML = '';

        // Defensive: ensure universes is an array
        if (!Array.isArray(appData.universes)) {
            appData.universes = [];
        }

        for (let i = 0; i < appData.universes.length; i++) {
            const universe = appData.universes[i];
            if (!universe) continue;
            const card = document.createElement('div');
            card.className = 'card-universe';
            card.onclick = () => openUniverse(i);
            card.innerHTML = `${await getCardBackground(universe.mediaId)}<div class="card-overlay"></div><div class="card-content"><div class="card-title">${universe.name || ''}</div><div class="card-desc">${universe.description || ''}</div></div>`;
            grid.appendChild(card);
        }

        const addCard = document.createElement('div');
        addCard.className = 'card-universe add-card';
        addCard.onclick = () => openCreateModal('universe');
        addCard.innerHTML = '<div class="add-icon">+</div><span class="add-text">Nouvel Univers</span>';
        grid.appendChild(addCard);
    } catch (error) {
        console.error('Erreur renderUniverses:', error);
    }
}

function slideUniverses(direction) {
    const track = document.getElementById('universesGrid');
    const scrollAmount = window.innerWidth * direction;
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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

    // Initialize arrays if needed
    if (!universe.worlds) universe.worlds = [];
    if (!universe.itemline) universe.itemline = [];

    document.getElementById('universeTitle').textContent = universe.name;
    document.getElementById('universeDesc').textContent = universe.description || '';

    await renderBackground('universeBackground', universe.mediaId);

    // Always show music button, load tracks if available
    if (universe.audioIds && universe.audioIds.length) {
        await loadAudioTracks(universe.audioIds);
    }

    hideAllUniverseSections();
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
        await renderWorlds();
    } else if (section === 'timeline') {
        loadTemporalSystem();
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

// Universe Crossline
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
