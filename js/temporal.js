/* =============================================
   TEMPORAL SYSTEM
   ============================================= */

function loadTemporalSystem() {
    const universe = appData.universes[appData.currentUniverse];
    if (!universe.temporalSystem) {
        universe.temporalSystem = {
            naturalCycles: []
        };
    }

    renderNaturalCycles();
}

function renderNaturalCycles() {
    const universe = appData.universes[appData.currentUniverse];
    if (!universe.temporalSystem) return;

    const cycles = universe.temporalSystem.naturalCycles || [];
    const container = document.getElementById('naturalCyclesList');
    container.innerHTML = '';

    if (cycles.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🌀</div><div class="empty-text">Aucun cycle naturel</div></div>';
        return;
    }

    // Calculate cumulative values from Alpha to each cycle
    const cumulativeFromAlpha = calculateCumulativeCycles(cycles);

    cycles.forEach((cycle, index) => {
        const isFirst = index === 0;
        const isLast = index === cycles.length - 1;
        const isSingle = cycles.length === 1;

        // Determine cycle type label
        let typeLabel = 'Intermédiaire';
        if (isSingle) {
            typeLabel = 'Cycle unique';
        } else if (isFirst) {
            typeLabel = 'Alpha (Plus petit)';
        } else if (isLast) {
            typeLabel = 'Omega (Plus grand)';
        }

        // Generate all conversions for this cycle
        let conversionsHtml = '';
        if (index > 0) {
            const conversions = [];
            for (let i = 0; i < index; i++) {
                const ratio = cumulativeFromAlpha[index] / cumulativeFromAlpha[i];
                conversions.push(`<span class="conversion-item"><span class="conversion-value">${ratio.toLocaleString()}</span> ${cycles[i].name}</span>`);
            }
            conversionsHtml = `
            <div class="cycle-total">
                <div class="cycle-total-header">= 1 ${cycle.name}</div>
                <div class="cycle-conversions">${conversions.join('')}</div>
            </div>
            `;
        }

        const div = document.createElement('div');
        div.className = 'cycle-item';
        div.innerHTML = `
            <div class="cycle-item-header">
                <span class="cycle-type">${typeLabel}</span>
                <div class="cycle-actions">
                    <button class="cycle-action-btn edit" onclick="openEditCycleModal(${index})" title="Modifier">✎</button>
                    <button class="cycle-action-btn delete" onclick="confirmDeleteCycle(${index})" title="Supprimer">✕</button>
                </div>
            </div>
            <div class="cycle-name">${cycle.name}</div>
            ${!isLast && cycles.length > 1 ? `
            <div class="cycle-relation">
                <span class="cycle-relation-value">${cycle.unitsPerNext || 1}</span>
                <span>${cycle.name}</span> = 1 <span>${cycles[index + 1]?.name || 'cycle suivant'}</span>
            </div>
            ` : ''}
            ${conversionsHtml}
        `;
        container.appendChild(div);
    });
}

function calculateCumulativeCycles(cycles) {
    const cumulative = [1]; // Alpha = 1 Alpha

    for (let i = 0; i < cycles.length - 1; i++) {
        const prevCumulative = cumulative[i];
        const unitsPerNext = cycles[i].unitsPerNext || 1;
        cumulative.push(prevCumulative * unitsPerNext);
    }

    return cumulative;
}

// Modal state for cycle editing
let cycleModalState = {
    mode: 'create',
    editIndex: null
};

function openCreateCycleModal() {
    cycleModalState = { mode: 'create', editIndex: null };

    document.getElementById('cycleModalTitle').textContent = 'Nouveau cycle naturel';
    document.getElementById('cycleName').value = '';
    document.getElementById('cycleUnitsPerNext').value = '1';
    document.getElementById('cycleUnitsRow').style.display = 'block';
    document.getElementById('cycleSaveBtn').textContent = 'Créer';

    document.getElementById('cycleModal').classList.add('active');
}

function openEditCycleModal(index) {
    const universe = appData.universes[appData.currentUniverse];
    const cycle = universe.temporalSystem.naturalCycles[index];
    const cycles = universe.temporalSystem.naturalCycles;
    const isLast = index === cycles.length - 1;

    cycleModalState = { mode: 'edit', editIndex: index };

    document.getElementById('cycleModalTitle').textContent = 'Modifier le cycle';
    document.getElementById('cycleName').value = cycle.name;
    document.getElementById('cycleUnitsPerNext').value = cycle.unitsPerNext || 1;

    // Hide units field for the last cycle (Omega)
    if (isLast && cycles.length > 1) {
        document.getElementById('cycleUnitsRow').style.display = 'none';
    } else {
        document.getElementById('cycleUnitsRow').style.display = 'block';
    }

    document.getElementById('cycleSaveBtn').textContent = 'Enregistrer';

    document.getElementById('cycleModal').classList.add('active');
}

function closeCycleModal() {
    document.getElementById('cycleModal').classList.remove('active');
}

function saveCycle() {
    const name = document.getElementById('cycleName').value.trim();
    const unitsPerNext = parseInt(document.getElementById('cycleUnitsPerNext').value) || 1;

    if (!name) {
        showToast('Entrez un nom pour le cycle');
        return;
    }

    const universe = appData.universes[appData.currentUniverse];
    if (!universe.temporalSystem) {
        universe.temporalSystem = { naturalCycles: [] };
    }

    const cycles = universe.temporalSystem.naturalCycles;

    if (cycleModalState.mode === 'create') {
        const newCycle = {
            name: name,
            unitsPerNext: unitsPerNext
        };

        // Add at the end (becomes the new Omega)
        cycles.push(newCycle);
    } else {
        // Edit existing
        cycles[cycleModalState.editIndex].name = name;
        cycles[cycleModalState.editIndex].unitsPerNext = unitsPerNext;
    }

    closeCycleModal();
    renderNaturalCycles();
    showToast('Cycle enregistré');
}

function confirmDeleteCycle(index) {
    const universe = appData.universes[appData.currentUniverse];
    const cycle = universe.temporalSystem.naturalCycles[index];

    if (confirm(`Supprimer le cycle "${cycle.name}" ?`)) {
        removeNaturalCycle(index);
    }
}

function removeNaturalCycle(index) {
    const universe = appData.universes[appData.currentUniverse];
    universe.temporalSystem.naturalCycles.splice(index, 1);
    renderNaturalCycles();
    showToast('Cycle supprimé');
}

// Keep for backwards compatibility
function addNaturalCycle() {
    openCreateCycleModal();
}

async function saveTemporalSystem() {
    const universe = appData.universes[appData.currentUniverse];
    await saveAppData();
    showToast('Cycles enregistrés');
}
