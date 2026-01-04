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
    mode: 'first', // 'first', 'intermediate', 'edit'
    editIndex: null
};

function addNaturalCycle() {
    const universe = appData.universes[appData.currentUniverse];
    if (!universe.temporalSystem) {
        universe.temporalSystem = { naturalCycles: [] };
    }

    const cycles = universe.temporalSystem.naturalCycles;

    // Hide all sections first
    document.getElementById('cycleFirstCreation').style.display = 'none';
    document.getElementById('cycleIntermediateCreation').style.display = 'none';
    document.getElementById('cycleEditMode').style.display = 'none';

    if (cycles.length === 0) {
        // First creation: Alpha + Omega pair
        cycleModalState = { mode: 'first', editIndex: null };
        document.getElementById('cycleModalTitle').textContent = 'Créer les cycles Alpha et Omega';
        document.getElementById('cycleFirstCreation').style.display = 'block';
        document.getElementById('cycleAlphaName').value = '';
        document.getElementById('cycleOmegaName').value = '';
        document.getElementById('cycleAlphaPerOmega').value = '365';
        document.getElementById('cycleSaveBtn').textContent = 'Créer';
    } else {
        // Intermediate creation
        cycleModalState = { mode: 'intermediate', editIndex: null };
        document.getElementById('cycleModalTitle').textContent = 'Ajouter un cycle intermédiaire';
        document.getElementById('cycleIntermediateCreation').style.display = 'block';
        document.getElementById('cycleName').value = '';
        document.getElementById('cycleUnitsPerNext').value = '1';

        // Update label to show Alpha name
        const alphaName = cycles[0].name;
        document.getElementById('cycleUnitsLabel').textContent = `Combien de ${alphaName} font 1 de ce cycle ?`;
        document.getElementById('cycleSaveBtn').textContent = 'Ajouter';
    }

    document.getElementById('cycleModal').classList.add('active');
}

function openEditCycleModal(index) {
    const universe = appData.universes[appData.currentUniverse];
    const cycle = universe.temporalSystem.naturalCycles[index];
    const cycles = universe.temporalSystem.naturalCycles;
    const isLast = index === cycles.length - 1;

    cycleModalState = { mode: 'edit', editIndex: index };

    // Hide all sections first
    document.getElementById('cycleFirstCreation').style.display = 'none';
    document.getElementById('cycleIntermediateCreation').style.display = 'none';
    document.getElementById('cycleEditMode').style.display = 'block';

    document.getElementById('cycleModalTitle').textContent = 'Modifier le cycle';
    document.getElementById('cycleEditName').value = cycle.name;
    document.getElementById('cycleEditUnitsPerNext').value = cycle.unitsPerNext || 1;

    // Hide units field for the last cycle (Omega) if more than one cycle
    if (isLast && cycles.length > 1) {
        document.getElementById('cycleEditUnitsRow').style.display = 'none';
    } else {
        document.getElementById('cycleEditUnitsRow').style.display = 'block';
        // Update label
        if (index < cycles.length - 1) {
            document.getElementById('cycleEditUnitsLabel').textContent = `Combien de ${cycle.name} font 1 ${cycles[index + 1].name} ?`;
        } else {
            document.getElementById('cycleEditUnitsLabel').textContent = 'Unités pour le cycle suivant';
        }
    }

    document.getElementById('cycleSaveBtn').textContent = 'Enregistrer';

    document.getElementById('cycleModal').classList.add('active');
}

function closeCycleModal() {
    document.getElementById('cycleModal').classList.remove('active');
}

function saveCycle() {
    const universe = appData.universes[appData.currentUniverse];
    if (!universe.temporalSystem) {
        universe.temporalSystem = { naturalCycles: [] };
    }

    const cycles = universe.temporalSystem.naturalCycles;

    if (cycleModalState.mode === 'first') {
        // Creating Alpha + Omega pair
        const alphaName = document.getElementById('cycleAlphaName').value.trim();
        const omegaName = document.getElementById('cycleOmegaName').value.trim();
        const alphaPerOmega = parseInt(document.getElementById('cycleAlphaPerOmega').value) || 1;

        if (!alphaName) {
            showToast('Entrez un nom pour le cycle Alpha');
            return;
        }
        if (!omegaName) {
            showToast('Entrez un nom pour le cycle Omega');
            return;
        }

        // Add Alpha (index 0)
        cycles.push({
            name: alphaName,
            unitsPerNext: alphaPerOmega
        });

        // Add Omega (index 1)
        cycles.push({
            name: omegaName,
            unitsPerNext: 1 // Omega has no next
        });

        showToast('Cycles Alpha et Omega créés');

    } else if (cycleModalState.mode === 'intermediate') {
        // Adding intermediate cycle
        const name = document.getElementById('cycleName').value.trim();
        const unitsFromAlpha = parseInt(document.getElementById('cycleUnitsPerNext').value) || 1;

        if (!name) {
            showToast('Entrez un nom pour le cycle');
            return;
        }

        // Insert before Omega (last element)
        // We need to calculate how many of this cycle make one Omega
        // Current: Alpha.unitsPerNext = how many Alpha per Omega
        // New: Alpha.unitsPerNext = unitsFromAlpha (how many Alpha per New)
        //      New.unitsPerNext = oldAlphaPerOmega / unitsFromAlpha (how many New per Omega)

        const omegaIndex = cycles.length - 1;
        const previousCycle = cycles[omegaIndex - 1];
        const oldUnitsPerOmega = previousCycle.unitsPerNext;

        // Calculate how many of the new cycle fit in one Omega
        const newUnitsPerOmega = Math.max(1, Math.round(oldUnitsPerOmega / unitsFromAlpha));

        // Update previous cycle to point to new cycle
        previousCycle.unitsPerNext = unitsFromAlpha;

        // Insert new intermediate cycle before Omega
        cycles.splice(omegaIndex, 0, {
            name: name,
            unitsPerNext: newUnitsPerOmega
        });

        showToast('Cycle intermédiaire ajouté');

    } else if (cycleModalState.mode === 'edit') {
        // Editing existing cycle
        const name = document.getElementById('cycleEditName').value.trim();
        const unitsPerNext = parseInt(document.getElementById('cycleEditUnitsPerNext').value) || 1;

        if (!name) {
            showToast('Entrez un nom pour le cycle');
            return;
        }

        cycles[cycleModalState.editIndex].name = name;
        cycles[cycleModalState.editIndex].unitsPerNext = unitsPerNext;

        showToast('Cycle modifié');
    }

    closeCycleModal();
    renderNaturalCycles();
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
    const cycles = universe.temporalSystem.naturalCycles;

    // If deleting Alpha or Omega and there are only 2 cycles, delete both
    if (cycles.length === 2) {
        cycles.length = 0; // Clear array
        showToast('Cycles supprimés');
    } else if (index === 0) {
        // Deleting Alpha: next cycle becomes new Alpha
        cycles.splice(0, 1);
        showToast('Cycle Alpha supprimé');
    } else if (index === cycles.length - 1) {
        // Deleting Omega: previous becomes new Omega
        cycles.splice(index, 1);
        showToast('Cycle Omega supprimé');
    } else {
        // Deleting intermediate: recalculate units
        const prevCycle = cycles[index - 1];
        const deletedCycle = cycles[index];
        // Merge the units: prev now goes directly to what deleted pointed to
        prevCycle.unitsPerNext = prevCycle.unitsPerNext * deletedCycle.unitsPerNext;
        cycles.splice(index, 1);
        showToast('Cycle supprimé');
    }

    renderNaturalCycles();
}

// Keep for backwards compatibility
function openCreateCycleModal() {
    addNaturalCycle();
}

async function saveTemporalSystem() {
    const universe = appData.universes[appData.currentUniverse];
    await saveAppData();
    showToast('Cycles enregistrés');
}
