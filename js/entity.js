/* =============================================
   SAVE & DELETE ENTITY
   ============================================= */

async function saveEntity() {
    try {
        console.log('Saving entity, mode:', modalState.mode, 'type:', modalState.type);
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

        const entity = {
            name: name,
            description: document.getElementById('inputDesc').value.trim(),
            mediaId: mediaId,
            audioIds: audioIds,
            itemline: [],
            calendars: []
        };

        if (modalState.mode === 'edit') {
            if (modalState.type === 'universe' || (appData.navStack[appData.navStack.length - 1] === 'universe' && modalState.type !== 'era')) {
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
            } else if (modalState.type === 'era') {
                const universe = appData.universes[appData.currentUniverse];
                const existing = universe.eras[modalState.editIndex];
                if (existing.mediaId && existing.mediaId !== mediaId) {
                    await deleteMedia(existing.mediaId);
                }
                entity.itemline = existing.itemline || [];
                entity.lieux = existing.lieux || [];
                entity.sagas = existing.sagas || [];
                entity.elements = existing.elements || [];
                entity.calendars = existing.calendars || [];
                universe.eras[modalState.editIndex] = entity;
                await saveAppData();
                await renderEraPage();
            } else {
                const universe = appData.universes[appData.currentUniverse];
                const era = universe.eras[appData.currentEra];
                const existing = era[modalState.type][modalState.editIndex];
                if (existing.mediaId && existing.mediaId !== mediaId) {
                    await deleteMedia(existing.mediaId);
                }
                entity.itemline = existing.itemline || [];
                entity.lieux = existing.lieux || [];
                entity.sagas = existing.sagas || [];
                entity.elements = existing.elements || [];
                entity.calendars = existing.calendars || [];
                era[modalState.type][modalState.editIndex] = entity;
                await saveAppData();
                await renderDetailPage();
            }
        } else {
            if (modalState.type === 'universe') {
                entity.eras = [];
                appData.universes.push(entity);
                await saveAppData();
                await renderUniverses();
            } else if (modalState.type === 'era') {
                const universe = appData.universes[appData.currentUniverse];
                if (!universe.eras) universe.eras = [];
                entity.lieux = [];
                entity.sagas = [];
                entity.elements = [];
                universe.eras.push(entity);
                await saveAppData();
                await renderEras();
            } else if (modalState.parentType === 'detail') {
                const universe = appData.universes[appData.currentUniverse];
                const era = universe.eras[appData.currentEra];
                const detail = era[appData.currentDetailType][appData.currentDetail];
                if (!detail[modalState.type]) detail[modalState.type] = [];
                entity.lieux = [];
                entity.sagas = [];
                entity.elements = [];
                detail[modalState.type].push(entity);
                await saveAppData();
                await renderDetailCrossline(modalState.type);
            } else {
                const universe = appData.universes[appData.currentUniverse];
                const era = universe.eras[appData.currentEra];
                if (!era[modalState.type]) era[modalState.type] = [];
                entity.lieux = [];
                entity.sagas = [];
                entity.elements = [];
                era[modalState.type].push(entity);
                await saveAppData();
                await renderEraCrossline(modalState.type);
            }
        }

        showToast('Enregistré');
        closeModal('createModal');
    } catch (error) {
        console.error('Erreur saveEntity:', error);
        showToast('Erreur lors de la sauvegarde');
    }
}

// Delete
function openDeleteConfirm(type) {
    deleteState.type = type;
    document.getElementById('deleteModal').classList.add('active');
}

async function confirmDelete() {
    if (deleteState.type === 'universe') {
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
    } else if (deleteState.type === 'era') {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        if (era.mediaId) await deleteMedia(era.mediaId);
        if (era.audioIds) {
            for (const id of era.audioIds) await deleteMedia(id);
        }
        universe.eras.splice(appData.currentEra, 1);
        appData.currentEra = null;
        await saveAppData();
        goBack();
    } else {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        const detail = era[appData.currentDetailType][appData.currentDetail];
        if (detail.mediaId) await deleteMedia(detail.mediaId);
        if (detail.audioIds) {
            for (const id of detail.audioIds) await deleteMedia(id);
        }
        era[appData.currentDetailType].splice(appData.currentDetail, 1);
        appData.currentDetail = null;
        await saveAppData();
        goBack();
    }

    showToast('Supprimé');
    closeModal('deleteModal');
}
