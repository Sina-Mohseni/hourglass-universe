/* =============================================
   UNIVERSES
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

    document.getElementById('universeTitle').textContent = universe.name;
    document.getElementById('universeDesc').textContent = universe.description || '';

    await renderBackground('universeBackground', universe.mediaId);

    const musicBtn = document.getElementById('universeMusicBtn');
    musicBtn.style.display = (universe.audioIds && universe.audioIds.length) ? 'flex' : 'none';

    if (universe.audioIds) await loadAudioTracks(universe.audioIds);

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
