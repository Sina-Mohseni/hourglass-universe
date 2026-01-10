/* =============================================
   ITEMLINE
   ============================================= */

function openItemlineModal(parent) {
    itemlineState = { parentType: parent, editIndex: null };
    document.getElementById('itemlineTitle').value = '';
    document.getElementById('itemlineContent').value = '';
    document.getElementById('itemlineModal').classList.add('active');
}

function editItemline(parent, index) {
    itemlineState = { parentType: parent, editIndex: index };

    let item;
    if (parent === 'universe') {
        item = appData.universes[appData.currentUniverse].itemline[index];
    } else if (parent === 'world') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        item = worldData.itemline[index];
    } else if (parent === 'era') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        item = worldData.eras[appData.currentEra].itemline[index];
    } else if (parent === 'saga') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        const era = worldData.eras[appData.currentEra];
        item = era.sagas[appData.currentSaga].itemline[index];
    } else {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        const era = worldData.eras[appData.currentEra];
        const saga = era.sagas[appData.currentSaga];
        item = saga[appData.currentDetailType][appData.currentDetail].itemline[index];
    }

    document.getElementById('itemlineTitle').value = item.title;
    document.getElementById('itemlineContent').value = item.content;
    document.getElementById('itemlineModal').classList.add('active');
}

async function saveItemline() {
    const title = document.getElementById('itemlineTitle').value.trim();
    const content = document.getElementById('itemlineContent').value.trim();

    if (!title) {
        showToast('Entrez un titre');
        return;
    }

    const item = { title, content };

    // Handle universe crossline separately
    if (itemlineState.parentType === 'universeCrossline') {
        const universe = appData.universes[appData.currentUniverse];
        if (!universe.crossline) universe.crossline = [];

        if (itemlineState.editIndex !== null) {
            universe.crossline[itemlineState.editIndex] = item;
        } else {
            universe.crossline.push(item);
        }

        await saveAppData();
        closeModal('itemlineModal');
        showToast('Élément enregistré');
        renderUniverseCrossline();
        restoreActiveSection('universe');
        return;
    }

    let target;

    if (itemlineState.parentType === 'universe') {
        target = appData.universes[appData.currentUniverse];
    } else if (itemlineState.parentType === 'world') {
        target = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    } else if (itemlineState.parentType === 'era') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        target = worldData.eras[appData.currentEra];
    } else if (itemlineState.parentType === 'saga') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        const era = worldData.eras[appData.currentEra];
        target = era.sagas[appData.currentSaga];
    } else {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        const era = worldData.eras[appData.currentEra];
        const saga = era.sagas[appData.currentSaga];
        target = saga[appData.currentDetailType][appData.currentDetail];
    }

    if (!target.itemline) target.itemline = [];

    if (itemlineState.editIndex !== null) {
        target.itemline[itemlineState.editIndex] = item;
    } else {
        target.itemline.push(item);
    }

    await saveAppData();
    closeModal('itemlineModal');
    showToast('Info enregistrée');

    if (itemlineState.parentType === 'universe') {
        renderUniverseItemline();
        restoreActiveSection('universe');
    } else if (itemlineState.parentType === 'world') {
        renderWorldItemline();
        restoreActiveSection('world');
    } else if (itemlineState.parentType === 'era') {
        renderEraItemline();
        restoreActiveSection('era');
    } else if (itemlineState.parentType === 'saga') {
        renderSagaItemline();
        restoreActiveSection('saga');
    } else {
        renderDetailItemline();
        restoreActiveSection('detail');
    }
}

async function deleteItemline(parent, index) {
    let target;

    if (parent === 'universe') {
        target = appData.universes[appData.currentUniverse];
    } else if (parent === 'world') {
        target = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    } else if (parent === 'era') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        target = worldData.eras[appData.currentEra];
    } else if (parent === 'saga') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        const era = worldData.eras[appData.currentEra];
        target = era.sagas[appData.currentSaga];
    } else {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        const era = worldData.eras[appData.currentEra];
        const saga = era.sagas[appData.currentSaga];
        target = saga[appData.currentDetailType][appData.currentDetail];
    }

    target.itemline.splice(index, 1);
    await saveAppData();
    showToast('Supprimé');

    if (parent === 'universe') {
        renderUniverseItemline();
        restoreActiveSection('universe');
    } else if (parent === 'world') {
        renderWorldItemline();
        restoreActiveSection('world');
    } else if (parent === 'era') {
        renderEraItemline();
        restoreActiveSection('era');
    } else if (parent === 'saga') {
        renderSagaItemline();
        restoreActiveSection('saga');
    } else {
        renderDetailItemline();
        restoreActiveSection('detail');
    }
}
