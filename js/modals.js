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
        audioFiles: []
    };
}

function openCreateModal(type, parent = null) {
    try {
        console.log('Opening create modal for:', type);
        resetModalState();
        modalState.type = type;
        modalState.mode = 'create';
        modalState.parentType = parent;

        document.getElementById('modalTitle').textContent = 'Créer';
        document.getElementById('modalSaveBtn').textContent = 'Créer';
        document.getElementById('inputName').value = '';
        document.getElementById('inputDesc').value = '';
        document.getElementById('mediaPreview').innerHTML = '';
        document.getElementById('mediaPreview').classList.remove('active');
        document.getElementById('audioList').innerHTML = '';
        document.getElementById('audioList').style.display = 'none';
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
    if (type === 'universe') {
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
    } else if (type === 'saga') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        const era = worldData.eras[appData.currentEra];
        entity = era.sagas[appData.currentSaga];
        modalState.editIndex = appData.currentSaga;
    } else {
        // Detail (histoires, sujets, elements)
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        const era = worldData.eras[appData.currentEra];
        const saga = era.sagas[appData.currentSaga];

        if (appData.currentDetailType === 'element' && appData.currentElementTypeIndex !== undefined) {
            const elementType = saga.elementTypes[appData.currentElementTypeIndex];
            entity = elementType.elements[appData.currentDetail];
        } else {
            entity = saga[appData.currentDetailType][appData.currentDetail];
        }
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
