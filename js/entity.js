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
                entity.sagas = existing.sagas || [];
                entity.calendars = existing.calendars || [];
                universe.eras[modalState.editIndex] = entity;
                await saveAppData();
                await renderEraPage();
            } else if (modalState.type === 'saga') {
                const universe = appData.universes[appData.currentUniverse];
                const era = universe.eras[appData.currentEra];
                const existing = era.sagas[modalState.editIndex];
                if (existing.mediaId && existing.mediaId !== mediaId) {
                    await deleteMedia(existing.mediaId);
                }
                entity.itemline = existing.itemline || [];
                entity.histoires = existing.histoires || [];
                entity.sujets = existing.sujets || [];
                entity.elementTypes = existing.elementTypes || [];
                entity.selectedCalendars = existing.selectedCalendars || [];
                era.sagas[modalState.editIndex] = entity;
                await saveAppData();
                await renderSagaPage();
            } else if (modalState.type === 'element' && appData.currentElementTypeIndex !== undefined) {
                // Element edit within element type
                const universe = appData.universes[appData.currentUniverse];
                const era = universe.eras[appData.currentEra];
                const saga = era.sagas[appData.currentSaga];
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
            } else {
                // Detail edit (histoires, sujets)
                const universe = appData.universes[appData.currentUniverse];
                const era = universe.eras[appData.currentEra];
                const saga = era.sagas[appData.currentSaga];
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
        } else {
            if (modalState.type === 'universe') {
                entity.eras = [];
                appData.universes.push(entity);
                await saveAppData();
                await renderUniverses();
            } else if (modalState.type === 'era') {
                const universe = appData.universes[appData.currentUniverse];
                if (!universe.eras) universe.eras = [];
                entity.sagas = [];
                universe.eras.push(entity);
                await saveAppData();
                await renderEras();
            } else if (modalState.type === 'saga') {
                const universe = appData.universes[appData.currentUniverse];
                const era = universe.eras[appData.currentEra];
                if (!era.sagas) era.sagas = [];
                entity.histoires = [];
                entity.sujets = [];
                entity.elementTypes = [];
                entity.selectedCalendars = [];
                era.sagas.push(entity);
                await saveAppData();
                await renderSagas();
            } else if (modalState.type === 'element' && modalState.parentType === 'saga') {
                // Create element within an element type
                const universe = appData.universes[appData.currentUniverse];
                const era = universe.eras[appData.currentEra];
                const saga = era.sagas[appData.currentSaga];
                const elementType = saga.elementTypes[modalState.elementTypeIndex];
                if (!elementType.elements) elementType.elements = [];
                elementType.elements.push(entity);
                await saveAppData();
                renderSagaElementTypes();
            } else if (modalState.parentType === 'saga') {
                // Create detail from saga page (histoires, sujets)
                const universe = appData.universes[appData.currentUniverse];
                const era = universe.eras[appData.currentEra];
                const saga = era.sagas[appData.currentSaga];
                if (!saga[modalState.type]) saga[modalState.type] = [];
                saga[modalState.type].push(entity);
                await saveAppData();
                await renderSagaScenarii(modalState.type);
            } else if (modalState.parentType === 'detail') {
                const universe = appData.universes[appData.currentUniverse];
                const era = universe.eras[appData.currentEra];
                const saga = era.sagas[appData.currentSaga];
                const detail = saga[appData.currentDetailType][appData.currentDetail];
                if (!detail[modalState.type]) detail[modalState.type] = [];
                detail[modalState.type].push(entity);
                await saveAppData();
                await renderDetailCrossline(modalState.type);
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
    } else if (deleteState.type === 'saga') {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        const saga = era.sagas[appData.currentSaga];
        if (saga.mediaId) await deleteMedia(saga.mediaId);
        if (saga.audioIds) {
            for (const id of saga.audioIds) await deleteMedia(id);
        }
        era.sagas.splice(appData.currentSaga, 1);
        appData.currentSaga = null;
        await saveAppData();
        goBack();
    } else {
        // Delete detail (histoires, sujets, elements)
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        const saga = era.sagas[appData.currentSaga];

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
