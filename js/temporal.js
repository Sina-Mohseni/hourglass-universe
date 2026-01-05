/* =============================================
   TEMPORAL SYSTEM
   ============================================= */

// Temporary state for editing in modal
let tempCycles = [];

function loadTemporalSystem() {
    const universe = appData.universes[appData.currentUniverse];
    if (!universe.temporalSystem) {
        universe.temporalSystem = { naturalCycles: [] };
    }
    renderTemporalBlock();
}

// Render the single clickable block in the main view
function renderTemporalBlock() {
    const universe = appData.universes[appData.currentUniverse];
    const cycles = universe.temporalSystem?.naturalCycles || [];
    const container = document.getElementById('temporalBlockContent');

    if (cycles.length === 0) {
        container.innerHTML = `
            <div class="temporal-block-empty">
                <span class="temporal-block-icon">🌀</span>
                <span>Cliquez pour créer votre système temporel</span>
            </div>
        `;
    } else {
        // Show summary with cycle tags
        let cyclesHtml = '';
        cycles.forEach((cycle, i) => {
            const isFirst = i === 0;
            const isLast = i === cycles.length - 1;
            let typeClass = 'intermediate';
            if (isFirst) typeClass = 'alpha';
            else if (isLast) typeClass = 'omega';

            if (i > 0) {
                cyclesHtml += '<span class="temporal-arrow">→</span>';
            }
            cyclesHtml += `<span class="temporal-cycle-tag ${typeClass}">${cycle.name}</span>`;
        });

        container.innerHTML = `
            <div class="temporal-block-summary">
                <div class="temporal-block-title">Système Temporel</div>
                <div class="temporal-block-cycles">${cyclesHtml}</div>
                <div class="temporal-block-hint">Cliquez pour modifier</div>
            </div>
        `;
    }
}

// Open the temporal modal
function openTemporalModal() {
    const universe = appData.universes[appData.currentUniverse];
    const cycles = universe.temporalSystem?.naturalCycles || [];

    // Copy cycles to temp state for editing
    if (cycles.length === 0) {
        // Initialize with Alpha and Omega
        tempCycles = [
            { name: '', unitsPerNext: 365 },
            { name: '', unitsPerNext: 1 }
        ];
    } else {
        tempCycles = cycles.map(c => ({ ...c }));
    }

    renderModalCycles();

    // Show/hide buttons based on state
    document.getElementById('addIntermediateBtn').style.display = 'block';
    document.getElementById('deleteTemporalBtn').style.display = cycles.length > 0 ? 'block' : 'none';

    document.getElementById('temporalModal').classList.add('active');
}

function closeTemporalModal() {
    document.getElementById('temporalModal').classList.remove('active');
    tempCycles = [];
}

// Render cycles in the modal editor
function renderModalCycles() {
    const container = document.getElementById('temporalCyclesList');
    container.innerHTML = '';

    tempCycles.forEach((cycle, index) => {
        const isFirst = index === 0;
        const isLast = index === tempCycles.length - 1;
        const isIntermediate = !isFirst && !isLast;

        let typeClass = 'intermediate';
        let typeLabel = 'Intermédiaire';
        if (tempCycles.length === 2) {
            if (isFirst) {
                typeClass = 'alpha';
                typeLabel = 'Alpha (plus petit)';
            } else {
                typeClass = 'omega';
                typeLabel = 'Omega (plus grand)';
            }
        } else {
            if (isFirst) {
                typeClass = 'alpha';
                typeLabel = 'Alpha (plus petit)';
            } else if (isLast) {
                typeClass = 'omega';
                typeLabel = 'Omega (plus grand)';
            }
        }

        const showDelete = isIntermediate && tempCycles.length > 2;
        const showUnits = !isLast; // Don't show units for Omega

        const div = document.createElement('div');
        div.className = `cycle-editor-item ${typeClass}`;
        div.innerHTML = `
            <div class="cycle-editor-header">
                <span class="cycle-editor-label">${typeLabel}</span>
                ${showDelete ? `<button class="cycle-editor-delete" onclick="removeIntermediateCycle(${index})">✕</button>` : ''}
            </div>
            <div class="cycle-editor-row">
                <input type="text"
                    value="${cycle.name}"
                    placeholder="${isFirst ? 'Ex: Rotation, Jour...' : isLast ? 'Ex: Orbite, Année...' : 'Ex: Lunaison, Saison...'}"
                    onchange="updateCycleName(${index}, this.value)">
            </div>
            ${showUnits ? `
            <div class="cycle-editor-units">
                <input type="number"
                    value="${cycle.unitsPerNext || 1}"
                    min="1"
                    onchange="updateCycleUnits(${index}, this.value)">
                <span>${cycle.name || (isFirst ? 'Alpha' : 'ce cycle')}</span> = 1 <span>${tempCycles[index + 1]?.name || (isLast ? 'Omega' : 'cycle suivant')}</span>
            </div>
            ` : ''}
        `;
        container.appendChild(div);
    });
}

function updateCycleName(index, value) {
    tempCycles[index].name = value.trim();
    // Re-render to update the unit labels
    renderModalCycles();
}

function updateCycleUnits(index, value) {
    tempCycles[index].unitsPerNext = parseInt(value) || 1;
}

function addIntermediateCycle() {
    if (tempCycles.length < 2) return;

    // Insert before Omega (last element)
    const omegaIndex = tempCycles.length - 1;
    tempCycles.splice(omegaIndex, 0, {
        name: '',
        unitsPerNext: 1
    });

    renderModalCycles();
}

function removeIntermediateCycle(index) {
    if (index > 0 && index < tempCycles.length - 1) {
        tempCycles.splice(index, 1);
        renderModalCycles();
    }
}

async function saveTemporalSystem() {
    // Validate that all cycles have names
    for (let i = 0; i < tempCycles.length; i++) {
        if (!tempCycles[i].name) {
            const isFirst = i === 0;
            const isLast = i === tempCycles.length - 1;
            const label = isFirst ? 'Alpha' : isLast ? 'Omega' : 'intermédiaire';
            showToast(`Entrez un nom pour le cycle ${label}`);
            return;
        }
    }

    const universe = appData.universes[appData.currentUniverse];
    universe.temporalSystem.naturalCycles = tempCycles.map(c => ({ ...c }));

    await saveAppData();
    closeTemporalModal();
    renderTemporalBlock();
    showToast('Système temporel enregistré');
}

async function deleteTemporalSystem() {
    if (!confirm('Supprimer le système temporel complet ?')) {
        return;
    }

    const universe = appData.universes[appData.currentUniverse];
    universe.temporalSystem.naturalCycles = [];

    await saveAppData();
    closeTemporalModal();
    renderTemporalBlock();
    showToast('Système temporel supprimé');
}

// Legacy function names for compatibility
function renderNaturalCycles() {
    renderTemporalBlock();
}

function addNaturalCycle() {
    openTemporalModal();
}
