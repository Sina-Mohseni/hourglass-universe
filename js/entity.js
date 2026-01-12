/* =============================================
   SAVE & DELETE ENTITY
   ============================================= */

async function saveEntity() {
    try {
        console.log('Saving entity, mode:', modalState.mode, 'type:', modalState.type, 'parentType:', modalState.parentType);
        const name = document.getElementById('inputName').value.trim();
        if (!name) {
            showToast('Entrez un nom');
            return;
        }

        let mediaId = modalState.mediaId;

        // Si nouveau média uploadé, le sauvegarder
        if (modalState.mediaBase64) {
            mediaId = await saveMedia(modalState.mediaBase64, modalState.mediaType, 'media');
            if (!mediaId) {
                showToast('Erreur sauvegarde média');
                return;
            }
        }

        // Sauvegarder les nouveaux audios
        const audioIds = [];
        for (const audio of modalState.audioFiles) {
            if (audio.id) {
                audioIds.push(audio.id);
            } else if (audio.base64) {
                const id = await saveMedia(audio.base64, audio.type, audio.name);
                if (id) audioIds.push(id);
            }
        }

        // Préparer les sujets liés (nettoyer les propriétés internes)
        const linkedEntities = (modalState.linkedEntities || []).map(item => ({
            type: item._type,
            name: item.name,
            mediaId: item.mediaId,
            index: item._index,
            universeIndex: item._universeIndex,
            worldIndex: item._worldIndex,
            sagaIndex: item._sagaIndex
        }));

        const entity = {
            name: name,
            description: document.getElementById('inputDesc').value.trim(),
            mediaId: mediaId,
            audioIds: audioIds,
            itemline: [],
            calendars: [],
            linkedEntities: linkedEntities
        };

        if (modalState.mode === 'edit') {
            await handleEditEntity(entity, mediaId, audioIds);
        } else {
            await handleCreateEntity(entity);
        }

        showToast('Enregistré');
        closeModal('createModal');
    } catch (error) {
        console.error('Erreur saveEntity:', error);
        showToast('Erreur lors de la sauvegarde');
    }
}

async function handleEditEntity(entity, mediaId, audioIds) {
    // Edit saga at root level
    if (modalState.type === 'saga' && appData.navStack[appData.navStack.length - 1] === 'saga') {
        const existing = appData.sagas[appData.currentSaga];
        if (existing.mediaId && existing.mediaId !== mediaId) {
            await deleteMedia(existing.mediaId);
        }
        entity.itemline = existing.itemline || [];
        entity.universes = existing.universes || [];
        entity.worlds = existing.worlds || [];
        entity.eras = existing.eras || [];
        entity.histoires = existing.histoires || [];
        entity.sujets = existing.sujets || [];
        entity.elementTypes = existing.elementTypes || [];
        entity.calendars = existing.calendars || [];
        appData.sagas[appData.currentSaga] = entity;
        await saveAppData();
        await renderSagaPage();
    }
    // Edit universe (legacy)
    else if (modalState.type === 'universe') {
        const existing = appData.universes[modalState.editIndex];
        if (existing.mediaId && existing.mediaId !== mediaId) {
            await deleteMedia(existing.mediaId);
        }
        entity.eras = existing.eras || [];
        entity.itemline = existing.itemline || [];
        entity.crossline = existing.crossline || [];
        entity.temporalSystem = existing.temporalSystem;
        appData.universes[modalState.editIndex] = entity;
        await saveAppData();
        await renderUniversePage();
    }
    // Edit world
    else if (modalState.type === 'world') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        if (worldData.mediaId && worldData.mediaId !== mediaId) {
            await deleteMedia(worldData.mediaId);
        }
        worldData.description = entity.description;
        worldData.mediaId = mediaId;
        worldData.audioIds = audioIds;
        await saveAppData();
        await renderWorldPage();
    }
    // Edit era
    else if (modalState.type === 'era') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        const existing = worldData.eras[modalState.editIndex];
        if (existing.mediaId && existing.mediaId !== mediaId) {
            await deleteMedia(existing.mediaId);
        }
        entity.itemline = existing.itemline || [];
        entity.sagas = existing.sagas || [];
        entity.calendars = existing.calendars || [];
        worldData.eras[modalState.editIndex] = entity;
        await saveAppData();
        await renderEraPage();
    }
    // Edit element in saga
    else if (modalState.type === 'element' && appData.currentElementTypeIndex !== undefined) {
        const saga = appData.sagas[appData.currentSaga];
        const elementType = saga.elementTypes[appData.currentElementTypeIndex];
        const existing = elementType.elements[modalState.editIndex];
        if (existing.mediaId && existing.mediaId !== mediaId) {
            await deleteMedia(existing.mediaId);
        }
        entity.itemline = existing.itemline || [];
        entity.calendars = existing.calendars || [];
        elementType.elements[modalState.editIndex] = entity;
        await saveAppData();
        await renderDetailPage();
    }
    // Edit detail in saga (histoires, sujets, universes, worlds, eras)
    else {
        const saga = appData.sagas[appData.currentSaga];
        const existing = saga[modalState.type][modalState.editIndex];
        if (existing.mediaId && existing.mediaId !== mediaId) {
            await deleteMedia(existing.mediaId);
        }
        entity.itemline = existing.itemline || [];
        entity.calendars = existing.calendars || [];
        saga[modalState.type][modalState.editIndex] = entity;
        await saveAppData();
        await renderDetailPage();
    }
}

async function handleCreateEntity(entity) {
    // Create saga at root level
    if (modalState.type === 'saga' && (modalState.parentType === 'home' || appData.navStack[appData.navStack.length - 1] === 'home')) {
        entity.universes = [];
        entity.worlds = [];
        entity.eras = [];
        entity.histoires = [];
        entity.sujets = [];
        entity.elementTypes = [];
        entity.calendars = [];
        appData.sagas.push(entity);
        await saveAppData();
        await renderSagasHome();
    }
    // Create universe at root level (from home page or universe page)
    else if (modalState.type === 'universe' && (modalState.parentType === 'root' || !modalState.parentType)) {
        entity.worlds = [];
        entity.itemline = [];
        entity.temporalSystems = [];
        appData.universes.push(entity);
        await saveAppData();
        if (typeof renderUniverses === 'function') {
            await renderUniverses();
        }
        showToast('Univers créé');
    }
    // Create world in universe
    else if (modalState.type === 'world' && modalState.parentType === 'universe') {
        const universe = appData.universes[appData.currentUniverse];
        if (!universe.worlds) universe.worlds = [];
        entity.eras = [];
        entity.itemline = [];
        entity.crosslineInfo = [];
        universe.worlds.push(entity);
        await saveAppData();
        await showUniverseSection('crossline');
    }
    // Create era in world
    else if (modalState.type === 'era' && modalState.parentType === 'world') {
        const universe = appData.universes[appData.currentUniverse];
        const world = universe.worlds[appData.currentWorld];
        if (!world.eras) world.eras = [];
        entity.sagas = [];
        entity.itemline = [];
        entity.calendars = [];
        world.eras.push(entity);
        await saveAppData();
        await showWorldSection('timeline');
    }
    // Create saga in era
    else if (modalState.type === 'saga' && modalState.parentType === 'era') {
        const universe = appData.universes[appData.currentUniverse];
        const world = universe.worlds[appData.currentWorld];
        const era = world.eras[appData.currentEra];
        if (!era.sagas) era.sagas = [];
        entity.histoires = [];
        entity.sujets = [];
        entity.elementTypes = [];
        entity.calendars = [];
        era.sagas.push(entity);
        await saveAppData();
        await showEraSection('crossline');
    }
    // Create in saga crossline (universes, worlds, eras)
    else if ((modalState.type === 'universes' || modalState.type === 'worlds' || modalState.type === 'eras') && modalState.parentType === 'saga') {
        const saga = appData.sagas[appData.currentSaga];
        if (!saga[modalState.type]) saga[modalState.type] = [];
        saga[modalState.type].push(entity);
        await saveAppData();
        await renderSagaCreationBlocks();
    }
    // Create era in world (legacy)
    else if (modalState.type === 'era' && !modalState.parentType) {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        if (!worldData.eras) worldData.eras = [];
        entity.sagas = [];
        worldData.eras.push(entity);
        await saveAppData();
        await renderEras();
    }
    // Create element within an element type
    else if (modalState.type === 'element' && modalState.parentType === 'saga') {
        const saga = appData.sagas[appData.currentSaga];
        const elementType = saga.elementTypes[modalState.elementTypeIndex];
        if (!elementType.elements) elementType.elements = [];
        elementType.elements.push(entity);
        await saveAppData();
        renderSagaElementTypes();
    }
    // Create detail in saga (histoires, sujets)
    else if ((modalState.type === 'histoires' || modalState.type === 'sujets') && modalState.parentType === 'saga') {
        const saga = appData.sagas[appData.currentSaga];
        if (!saga[modalState.type]) saga[modalState.type] = [];
        saga[modalState.type].push(entity);
        await saveAppData();
        await renderSagaScenariiBlocks();
    }
    // Create in detail page
    else if (modalState.parentType === 'detail') {
        const saga = appData.sagas[appData.currentSaga];
        const detail = saga[appData.currentDetailType][appData.currentDetail];
        if (!detail[modalState.type]) detail[modalState.type] = [];
        detail[modalState.type].push(entity);
        await saveAppData();
        await renderDetailCrossline(modalState.type);
    }
}

// Delete
function openDeleteConfirm(type) {
    deleteState.type = type;
    document.getElementById('deleteModal').classList.add('active');
}

async function confirmDelete() {
    // Delete saga from root level
    if (deleteState.type === 'saga' && appData.navStack[appData.navStack.length - 1] === 'saga') {
        const saga = appData.sagas[appData.currentSaga];
        if (saga.mediaId) await deleteMedia(saga.mediaId);
        if (saga.audioIds) {
            for (const id of saga.audioIds) await deleteMedia(id);
        }
        appData.sagas.splice(appData.currentSaga, 1);
        appData.currentSaga = null;
        await saveAppData();
        await renderSagasHome();
        navigateTo('homePage');
        appData.navStack = ['home'];
    }
    // Delete universe (legacy)
    else if (deleteState.type === 'universe') {
        const universe = appData.universes[appData.currentUniverse];
        if (universe.mediaId) await deleteMedia(universe.mediaId);
        if (universe.audioIds) {
            for (const id of universe.audioIds) await deleteMedia(id);
        }
        appData.universes.splice(appData.currentUniverse, 1);
        appData.currentUniverse = null;
        await saveAppData();
        await renderUniverses();
        navigateTo('homePage');
        appData.navStack = ['home'];
    }
    // Delete world (managed via temporal system)
    else if (deleteState.type === 'world') {
        showToast('Les Mondes sont gérés dans le système temporel');
        closeModal('deleteModal');
        return;
    }
    // Delete era
    else if (deleteState.type === 'era') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        const era = worldData.eras[appData.currentEra];
        if (era.mediaId) await deleteMedia(era.mediaId);
        if (era.audioIds) {
            for (const id of era.audioIds) await deleteMedia(id);
        }
        worldData.eras.splice(appData.currentEra, 1);
        appData.currentEra = null;
        await saveAppData();
        goBack();
    }
    // Delete detail (histoires, sujets, elements, universes, worlds, eras in saga)
    else if (deleteState.type === 'detail') {
        const saga = appData.sagas[appData.currentSaga];

        let detail;
        if (appData.currentDetailType === 'element' && appData.currentElementTypeIndex !== undefined) {
            const elementType = saga.elementTypes[appData.currentElementTypeIndex];
            detail = elementType.elements[appData.currentDetail];
            if (detail.mediaId) await deleteMedia(detail.mediaId);
            if (detail.audioIds) {
                for (const id of detail.audioIds) await deleteMedia(id);
            }
            elementType.elements.splice(appData.currentDetail, 1);
        } else {
            detail = saga[appData.currentDetailType][appData.currentDetail];
            if (detail.mediaId) await deleteMedia(detail.mediaId);
            if (detail.audioIds) {
                for (const id of detail.audioIds) await deleteMedia(id);
            }
            saga[appData.currentDetailType].splice(appData.currentDetail, 1);
        }
        appData.currentDetail = null;
        await saveAppData();
        goBack();
    }

    showToast('Supprimé');
    closeModal('deleteModal');
}
