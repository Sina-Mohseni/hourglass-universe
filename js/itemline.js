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
    } else if (parent === 'era') {
        item = appData.universes[appData.currentUniverse].eras[appData.currentEra].itemline[index];
    } else {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        item = era[appData.currentDetailType][appData.currentDetail].itemline[index];
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
    } else if (itemlineState.parentType === 'era') {
        target = appData.universes[appData.currentUniverse].eras[appData.currentEra];
    } else {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        target = era[appData.currentDetailType][appData.currentDetail];
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
    } else if (itemlineState.parentType === 'era') {
        renderEraItemline();
        restoreActiveSection('era');
    } else {
        renderDetailItemline();
        restoreActiveSection('detail');
    }
}

async function deleteItemline(parent, index) {
    let target;

    if (parent === 'universe') {
        target = appData.universes[appData.currentUniverse];
    } else if (parent === 'era') {
        target = appData.universes[appData.currentUniverse].eras[appData.currentEra];
    } else {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        target = era[appData.currentDetailType][appData.currentDetail];
    }

    target.itemline.splice(index, 1);
    await saveAppData();
    showToast('Supprimé');

    if (parent === 'universe') {
        renderUniverseItemline();
        restoreActiveSection('universe');
    } else if (parent === 'era') {
        renderEraItemline();
        restoreActiveSection('era');
    } else {
        renderDetailItemline();
        restoreActiveSection('detail');
    }
}
