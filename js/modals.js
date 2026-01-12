/* =============================================
   MODALS - CREATE/EDIT
   ============================================= */

function resetModalState() {
    modalState = {
        type: null,
        mode: null,
        editIndex: null,
        parentType: null,
        mediaId: null,
        mediaBase64: null,
        mediaType: null,
        audioFiles: [],
        linkedEntities: []
    };
}

function openCreateModal(type, parent = null) {
    try {
        console.log('Opening create modal for:', type);
        resetModalState();
        modalState.type = type;
        modalState.mode = 'create';
        modalState.parentType = parent;

        document.getElementById('modalTitle').textContent = 'Ajouter';
        document.getElementById('modalSaveBtn').textContent = 'Créer';
        document.getElementById('inputName').value = '';
        document.getElementById('inputDesc').value = '';
        document.getElementById('mediaPreview').innerHTML = '';
        document.getElementById('mediaPreview').classList.remove('active');
        document.getElementById('audioList').innerHTML = '';
        document.getElementById('audioList').style.display = 'none';
        updateLinkedEntitiesList();

        // Show tabs and switch to create mode
        document.getElementById('modalTabs').classList.remove('hidden');
        switchModalTab('create');

        document.getElementById('createModal').classList.add('active');
    } catch (error) {
        console.error('Erreur openCreateModal:', error);
        showToast('Erreur ouverture formulaire');
    }
}

async function openEditModal(type) {
    resetModalState();
    modalState.type = type;
    modalState.mode = 'edit';

    let entity;
    if (type === 'saga' && appData.navStack[appData.navStack.length - 1] === 'saga') {
        // Edit saga at root level
        entity = appData.sagas[appData.currentSaga];
        modalState.editIndex = appData.currentSaga;
    } else if (type === 'universe') {
        entity = appData.universes[appData.currentUniverse];
        modalState.editIndex = appData.currentUniverse;
    } else if (type === 'world') {
        const universe = appData.universes[appData.currentUniverse];
        const system = universe.temporalSystems[appData.currentWorldSystem];
        const point = system.points[appData.currentWorldPoint];
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        entity = {
            name: point.name,
            description: worldData.description || '',
            mediaId: worldData.mediaId,
            audioIds: worldData.audioIds || []
        };
        modalState.editIndex = appData.currentWorldPoint;
    } else if (type === 'era') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        entity = worldData.eras[appData.currentEra];
        modalState.editIndex = appData.currentEra;
    } else if (type === 'detail') {
        // Detail (histoires, sujets, elements, universes, worlds, eras in saga)
        const saga = appData.sagas[appData.currentSaga];

        if (appData.currentDetailType === 'element' && appData.currentElementTypeIndex !== undefined) {
            const elementType = saga.elementTypes[appData.currentElementTypeIndex];
            entity = elementType.elements[appData.currentDetail];
        } else {
            entity = saga[appData.currentDetailType][appData.currentDetail];
        }
        modalState.editIndex = appData.currentDetail;
        modalState.type = appData.currentDetailType;
    } else {
        // Fallback to saga details
        const saga = appData.sagas[appData.currentSaga];
        entity = saga[appData.currentDetailType][appData.currentDetail];
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

    // Charger les sujets liés existants
    if (entity.linkedEntities) {
        modalState.linkedEntities = entity.linkedEntities.map(item => ({
            ...item,
            _type: item.type,
            _index: item.index,
            _universeIndex: item.universeIndex,
            _worldIndex: item.worldIndex,
            _sagaIndex: item.sagaIndex
        }));
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
    await updateLinkedEntitiesList();

    // Hide tabs in edit mode and show create form
    document.getElementById('modalTabs').classList.add('hidden');
    document.getElementById('createFormSection').style.display = 'block';
    document.getElementById('existingEntitySection').style.display = 'none';

    document.getElementById('createModal').classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Media Upload
async function handleMediaUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const base64 = await fileToBase64(file);

        modalState.mediaBase64 = base64;
        modalState.mediaType = file.type;
        modalState.mediaId = null;

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

/* =============================================
   ENTITY LINKING
   ============================================= */

function openEntityPicker() {
    document.getElementById('entityPickerType').value = '';
    document.getElementById('entityPickerList').innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Sélectionnez un type de sujet</p>';
    document.getElementById('entityPickerModal').classList.add('active');
}

async function loadEntityPickerItems() {
    const type = document.getElementById('entityPickerType').value;
    const listEl = document.getElementById('entityPickerList');

    if (!type) {
        listEl.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Sélectionnez un type de sujet</p>';
        return;
    }

    let items = [];
    const typeLabels = {
        sagas: 'Saga',
        universes: 'Univers',
        worlds: 'Monde',
        eras: 'Époque',
        histoires: 'Histoire',
        sujets: 'Sujet'
    };

    // Collect all items of the selected type
    if (type === 'sagas') {
        items = (appData.sagas || []).map((item, index) => ({ ...item, _index: index, _type: type }));
    } else if (type === 'universes') {
        items = (appData.universes || []).map((item, index) => ({ ...item, _index: index, _type: type }));
    } else if (type === 'worlds') {
        // Collect worlds from all universes
        (appData.universes || []).forEach((universe, uIndex) => {
            (universe.worlds || []).forEach((world, wIndex) => {
                items.push({ ...world, _universeIndex: uIndex, _index: wIndex, _type: type, _parentName: universe.name });
            });
        });
    } else if (type === 'eras') {
        // Collect eras from all worlds in all universes
        (appData.universes || []).forEach((universe, uIndex) => {
            (universe.worlds || []).forEach((world, wIndex) => {
                (world.eras || []).forEach((era, eIndex) => {
                    items.push({ ...era, _universeIndex: uIndex, _worldIndex: wIndex, _index: eIndex, _type: type, _parentName: world.name });
                });
            });
        });
    } else if (type === 'histoires' || type === 'sujets') {
        // Collect from all sagas
        (appData.sagas || []).forEach((saga, sIndex) => {
            (saga[type] || []).forEach((item, iIndex) => {
                items.push({ ...item, _sagaIndex: sIndex, _index: iIndex, _type: type, _parentName: saga.name });
            });
        });
    }

    if (items.length === 0) {
        listEl.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Aucun ${typeLabels[type].toLowerCase()} trouvé</p>`;
        return;
    }

    // Filter out already linked items
    const alreadyLinked = modalState.linkedEntities.map(e => `${e._type}-${e._index}`);
    items = items.filter(item => !alreadyLinked.includes(`${item._type}-${item._index}`));

    if (items.length === 0) {
        listEl.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Tous les ${typeLabels[type].toLowerCase()}s sont déjà liés</p>`;
        return;
    }

    // Build the list
    let html = '';
    for (const item of items) {
        const thumbHtml = await getEntityThumbnail(item.mediaId);
        const parentInfo = item._parentName ? ` (${item._parentName})` : '';

        html += `
            <div class="entity-picker-item" onclick="addLinkedEntity(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                <div class="entity-picker-item-thumb">${thumbHtml}</div>
                <div class="entity-picker-item-info">
                    <div class="entity-picker-item-name">${item.name}${parentInfo}</div>
                    <div class="entity-picker-item-type">${typeLabels[type]}</div>
                </div>
            </div>
        `;
    }

    listEl.innerHTML = html;
}

async function getEntityThumbnail(mediaId) {
    if (!mediaId) {
        return '<span style="color: var(--text-secondary); font-size: 16px;">📄</span>';
    }

    const media = await getMedia(mediaId);
    if (!media || !media.base64) {
        return '<span style="color: var(--text-secondary); font-size: 16px;">📄</span>';
    }

    if (media.type && media.type.startsWith('video')) {
        return `<video src="${media.base64}" muted style="width:100%;height:100%;object-fit:cover"></video>`;
    } else {
        return `<img src="${media.base64}" style="width:100%;height:100%;object-fit:cover">`;
    }
}

function addLinkedEntity(item) {
    // Check if already added
    const exists = modalState.linkedEntities.some(e =>
        e._type === item._type && e._index === item._index
    );

    if (!exists) {
        modalState.linkedEntities.push(item);
        updateLinkedEntitiesList();
        showToast('Sujet lié ajouté');
    }

    closeModal('entityPickerModal');
}

function removeLinkedEntity(index) {
    modalState.linkedEntities.splice(index, 1);
    updateLinkedEntitiesList();
}

async function updateLinkedEntitiesList() {
    const listEl = document.getElementById('linkedEntitiesList');
    if (!listEl) return;

    if (!modalState.linkedEntities || modalState.linkedEntities.length === 0) {
        listEl.style.display = 'none';
        listEl.innerHTML = '';
        return;
    }

    const typeLabels = {
        sagas: 'Saga',
        universes: 'Univers',
        worlds: 'Monde',
        eras: 'Époque',
        histoires: 'Histoire',
        sujets: 'Sujet'
    };

    listEl.style.display = 'block';
    let html = '';

    for (let i = 0; i < modalState.linkedEntities.length; i++) {
        const item = modalState.linkedEntities[i];
        const thumbHtml = await getEntityThumbnail(item.mediaId);
        const typeLabel = typeLabels[item._type] || item._type;

        html += `
            <div class="linked-entity-item">
                <div class="linked-entity-item-thumb">${thumbHtml}</div>
                <div class="linked-entity-item-info">
                    <div class="linked-entity-item-name">${item.name}</div>
                    <div class="linked-entity-item-type">${typeLabel}</div>
                </div>
                <button class="delete" onclick="removeLinkedEntity(${i})">✕</button>
            </div>
        `;
    }

    listEl.innerHTML = html;
}

/* =============================================
   MODAL TABS - CREATE / ADD EXISTING
   ============================================= */

function switchModalTab(tab) {
    const tabCreate = document.getElementById('tabCreate');
    const tabExisting = document.getElementById('tabExisting');
    const createSection = document.getElementById('createFormSection');
    const existingSection = document.getElementById('existingEntitySection');
    const saveBtn = document.getElementById('modalSaveBtn');

    if (tab === 'create') {
        tabCreate.classList.add('active');
        tabExisting.classList.remove('active');
        createSection.style.display = 'block';
        existingSection.style.display = 'none';
        saveBtn.style.display = 'block';
        saveBtn.textContent = 'Créer';
    } else {
        tabCreate.classList.remove('active');
        tabExisting.classList.add('active');
        createSection.style.display = 'none';
        existingSection.style.display = 'block';
        saveBtn.style.display = 'none'; // Hide save button, selection is direct
        loadExistingEntities();
    }
}

async function loadExistingEntities() {
    const listEl = document.getElementById('existingEntityList');
    const type = modalState.type;

    // Normalize type for collection lookup
    const typeMapping = {
        'saga': 'sagas',
        'universe': 'universes',
        'world': 'worlds',
        'era': 'eras',
        'histoire': 'histoires',
        'sujet': 'sujets'
    };

    const collectionType = typeMapping[type] || type;

    const typeLabels = {
        sagas: 'Saga',
        saga: 'Saga',
        universes: 'Univers',
        universe: 'Univers',
        worlds: 'Monde',
        world: 'Monde',
        eras: 'Époque',
        era: 'Époque',
        histoires: 'Histoire',
        histoire: 'Histoire',
        sujets: 'Sujet',
        sujet: 'Sujet'
    };

    let items = [];

    // Collect all items of the selected type
    if (collectionType === 'sagas') {
        items = (appData.sagas || []).map((item, index) => ({
            ...item,
            _index: index,
            _type: 'sagas'
        }));
    } else if (collectionType === 'universes') {
        items = (appData.universes || []).map((item, index) => ({
            ...item,
            _index: index,
            _type: 'universes'
        }));
    } else if (collectionType === 'worlds') {
        // Collect worlds from all universes
        (appData.universes || []).forEach((universe, uIndex) => {
            (universe.worlds || []).forEach((world, wIndex) => {
                items.push({
                    ...world,
                    _universeIndex: uIndex,
                    _index: wIndex,
                    _type: 'worlds',
                    _parentName: universe.name
                });
            });
        });
    } else if (collectionType === 'eras') {
        // Collect eras from all worlds in all universes
        (appData.universes || []).forEach((universe, uIndex) => {
            (universe.worlds || []).forEach((world, wIndex) => {
                (world.eras || []).forEach((era, eIndex) => {
                    items.push({
                        ...era,
                        _universeIndex: uIndex,
                        _worldIndex: wIndex,
                        _index: eIndex,
                        _type: 'eras',
                        _parentName: world.name
                    });
                });
            });
        });
    } else if (collectionType === 'histoires' || collectionType === 'sujets') {
        // Collect from all sagas
        (appData.sagas || []).forEach((saga, sIndex) => {
            (saga[collectionType] || []).forEach((item, iIndex) => {
                items.push({
                    ...item,
                    _sagaIndex: sIndex,
                    _index: iIndex,
                    _type: collectionType,
                    _parentName: saga.name
                });
            });
        });
    }

    if (items.length === 0) {
        listEl.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 40px 20px;">Aucun ${typeLabels[type]?.toLowerCase() || 'sujet'} existant trouvé.<br><br>Créez-en un nouveau via l'onglet "Créer nouveau".</p>`;
        return;
    }

    // Build the list
    let html = '';
    for (const item of items) {
        const thumbHtml = await getEntityThumbnail(item.mediaId);
        const parentInfo = item._parentName ? ` (${item._parentName})` : '';

        html += `
            <div class="entity-picker-item" onclick="selectExistingEntity(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                <div class="entity-picker-item-thumb">${thumbHtml}</div>
                <div class="entity-picker-item-info">
                    <div class="entity-picker-item-name">${item.name}${parentInfo}</div>
                    <div class="entity-picker-item-type">${typeLabels[item._type] || item._type}</div>
                </div>
            </div>
        `;
    }

    listEl.innerHTML = html;
}

async function selectExistingEntity(item) {
    try {
        // Add the existing entity to the current context
        const parentType = modalState.parentType;
        const type = modalState.type;

        // Deep copy the item to avoid reference issues
        const entityCopy = JSON.parse(JSON.stringify(item));
        // Remove internal properties
        delete entityCopy._index;
        delete entityCopy._type;
        delete entityCopy._parentName;
        delete entityCopy._universeIndex;
        delete entityCopy._worldIndex;
        delete entityCopy._sagaIndex;

        // Add to appropriate location based on context
        if (type === 'world' && parentType === 'universe') {
            const universe = appData.universes[appData.currentUniverse];
            if (!universe.worlds) universe.worlds = [];
            universe.worlds.push(entityCopy);
            await saveAppData();
            await showUniverseSection('crossline');
            showToast('Monde ajouté');
        } else if (type === 'era' && parentType === 'world') {
            const universe = appData.universes[appData.currentUniverse];
            const world = universe.worlds[appData.currentWorld];
            if (!world.eras) world.eras = [];
            world.eras.push(entityCopy);
            await saveAppData();
            await showWorldSection('timeline');
            showToast('Époque ajoutée');
        } else if (type === 'saga' && parentType === 'era') {
            const universe = appData.universes[appData.currentUniverse];
            const world = universe.worlds[appData.currentWorld];
            const era = world.eras[appData.currentEra];
            if (!era.sagas) era.sagas = [];
            era.sagas.push(entityCopy);
            await saveAppData();
            await showEraSection('crossline');
            showToast('Saga ajoutée');
        } else if (type === 'saga' && (parentType === 'home' || !parentType)) {
            // Add saga at root level
            appData.sagas.push(entityCopy);
            await saveAppData();
            await renderSagasHome();
            showToast('Saga ajoutée');
        } else if (type === 'universe' && (parentType === 'root' || !parentType)) {
            // Add universe at root level
            appData.universes.push(entityCopy);
            await saveAppData();
            if (typeof renderUniverses === 'function') {
                await renderUniverses();
            }
            showToast('Univers ajouté');
        } else if ((type === 'histoires' || type === 'sujets') && parentType === 'saga') {
            const saga = appData.sagas[appData.currentSaga];
            if (!saga[type]) saga[type] = [];
            saga[type].push(entityCopy);
            await saveAppData();
            await renderSagaCreationBlocks();
            showToast('Sujet ajouté');
        } else if (parentType === 'detail') {
            const detail = getCurrentDetail();
            if (!detail[type]) detail[type] = [];
            detail[type].push(entityCopy);
            await saveAppData();
            await renderDetailCrossline(type);
            showToast('Sujet ajouté');
        } else {
            showToast('Contexte non supporté');
            return;
        }

        closeModal('createModal');
    } catch (error) {
        console.error('Erreur selectExistingEntity:', error);
        showToast('Erreur lors de l\'ajout');
    }
}
