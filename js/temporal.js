/* =============================================
   TEMPORAL SYSTEM - Multiple Systems Support
   ============================================= */

// Cycle types
const CYCLE_TYPES = {
    INTERNAL: 'internal',  // Rotation sur soi-même
    EXTERNAL: 'external'   // Orbite autour d'un autre corps
};

// Temporary state for editing in modal
let tempCycles = [];
let tempSystemName = '';
let editingSystemIndex = null;

function loadTemporalSystem() {
    const universe = appData.universes[appData.currentUniverse];
    // Migrate old single system to new array format
    if (universe.temporalSystem && !universe.temporalSystems) {
        if (universe.temporalSystem.naturalCycles && universe.temporalSystem.naturalCycles.length > 0) {
            universe.temporalSystems = [{
                name: 'Système principal',
                cycles: universe.temporalSystem.naturalCycles
            }];
        } else {
            universe.temporalSystems = [];
        }
        delete universe.temporalSystem;
    }
    if (!universe.temporalSystems) {
        universe.temporalSystems = [];
    }
    renderTemporalSystems();
}

// Calculate cumulative values from Alpha
function calculateCumulativeFromAlpha(cycles) {
    const cumulative = [1];
    for (let i = 0; i < cycles.length - 1; i++) {
        cumulative.push(cumulative[i] * (cycles[i].unitsPerNext || 1));
    }
    return cumulative;
}

// Get cycle type icon
function getCycleTypeIcon(type) {
    return type === CYCLE_TYPES.EXTERNAL ? '◎' : '⟳';
}

// Get cycle type label
function getCycleTypeLabel(type) {
    return type === CYCLE_TYPES.EXTERNAL ? 'Extérieur' : 'Intérieur';
}

// Render all temporal systems as clickable cards
function renderTemporalSystems() {
    const universe = appData.universes[appData.currentUniverse];
    const systems = universe.temporalSystems || [];
    const container = document.getElementById('temporalSystemsList');

    if (systems.length === 0) {
        container.innerHTML = `
            <div class="temporal-empty-state">
                <div class="temporal-empty-icon">🌀</div>
                <div>Aucun système temporel</div>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    systems.forEach((system, index) => {
        const cycles = system.cycles || [];
        const cumulative = calculateCumulativeFromAlpha(cycles);

        // Build cycles chain with type icons
        let cyclesHtml = '';
        cycles.forEach((cycle, i) => {
            const isFirst = i === 0;
            const isLast = i === cycles.length - 1;
            let posClass = 'intermediate';
            if (isFirst) posClass = 'alpha';
            else if (isLast) posClass = 'omega';

            const typeClass = cycle.type === CYCLE_TYPES.EXTERNAL ? 'external' : 'internal';
            const typeIcon = getCycleTypeIcon(cycle.type);

            if (i > 0) cyclesHtml += '<span class="temporal-arrow">→</span>';
            cyclesHtml += `<span class="temporal-cycle-tag ${posClass} ${typeClass}"><span class="cycle-type-icon">${typeIcon}</span>${cycle.name}</span>`;
        });

        // Build conversions (show how many Alpha make each cycle)
        let conversionsHtml = '';
        if (cycles.length >= 2) {
            for (let i = 1; i < cycles.length; i++) {
                const typeIcon = getCycleTypeIcon(cycles[i].type);
                conversionsHtml += `<span class="temporal-conversion-tag"><strong>${cumulative[i].toLocaleString()}</strong> ${cycles[0].name} = 1 ${typeIcon} ${cycles[i].name}</span>`;
            }
        }

        const div = document.createElement('div');
        div.className = 'temporal-system-card';
        div.onclick = () => openTemporalModal(index);
        div.innerHTML = `
            <div class="temporal-system-name">${system.name || 'Système sans nom'}</div>
            <div class="temporal-system-cycles">${cyclesHtml}</div>
            ${conversionsHtml ? `<div class="temporal-system-conversions">${conversionsHtml}</div>` : ''}
        `;
        container.appendChild(div);
    });
}

// Open modal for creating or editing a system
function openTemporalModal(index = null) {
    const universe = appData.universes[appData.currentUniverse];
    editingSystemIndex = index;

    if (index !== null) {
        // Editing existing system
        const system = universe.temporalSystems[index];
        tempSystemName = system.name || '';
        tempCycles = system.cycles.map(c => ({ ...c }));
        document.getElementById('temporalModalTitle').textContent = 'Modifier le système';
        document.getElementById('deleteTemporalBtn').style.display = 'block';
    } else {
        // Creating new system
        tempSystemName = '';
        tempCycles = [
            { name: '', unitsPerNext: 365, type: CYCLE_TYPES.INTERNAL },
            { name: '', unitsPerNext: 1, type: CYCLE_TYPES.EXTERNAL }
        ];
        document.getElementById('temporalModalTitle').textContent = 'Nouveau Système Temporel';
        document.getElementById('deleteTemporalBtn').style.display = 'none';
    }

    document.getElementById('temporalSystemName').value = tempSystemName;
    renderModalCycles();
    updateConversionsSection();

    document.getElementById('temporalModal').classList.add('active');
}

function closeTemporalModal() {
    document.getElementById('temporalModal').classList.remove('active');
    tempCycles = [];
    tempSystemName = '';
    editingSystemIndex = null;
}

// Render cycles in the modal editor
function renderModalCycles() {
    const container = document.getElementById('temporalCyclesList');
    container.innerHTML = '';

    tempCycles.forEach((cycle, index) => {
        const isFirst = index === 0;
        const isLast = index === tempCycles.length - 1;
        const isIntermediate = !isFirst && !isLast;

        let posClass = 'intermediate';
        let posLabel = 'Intermédiaire';
        if (tempCycles.length === 2) {
            posClass = isFirst ? 'alpha' : 'omega';
            posLabel = isFirst ? 'Alpha (plus petit)' : 'Omega (plus grand)';
        } else {
            if (isFirst) { posClass = 'alpha'; posLabel = 'Alpha (plus petit)'; }
            else if (isLast) { posClass = 'omega'; posLabel = 'Omega (plus grand)'; }
        }

        const showDelete = isIntermediate && tempCycles.length > 2;
        const showUnits = !isLast;
        const cycleType = cycle.type || CYCLE_TYPES.INTERNAL;

        const div = document.createElement('div');
        div.className = `cycle-editor-item ${posClass}`;
        div.innerHTML = `
            <div class="cycle-editor-header">
                <span class="cycle-editor-label">${posLabel}</span>
                ${showDelete ? `<button class="cycle-editor-delete" onclick="removeIntermediateCycle(${index})">✕</button>` : ''}
            </div>
            <div class="cycle-editor-row">
                <input type="text"
                    value="${cycle.name}"
                    placeholder="${isFirst ? 'Ex: Rotation, Jour...' : isLast ? 'Ex: Orbite, Année...' : 'Ex: Lunaison, Saison...'}"
                    onchange="updateCycleName(${index}, this.value)"
                    oninput="updateCycleNameLive(${index}, this.value)">
            </div>
            <div class="cycle-type-selector">
                <button class="cycle-type-btn ${cycleType === CYCLE_TYPES.INTERNAL ? 'active' : ''}"
                    onclick="updateCycleType(${index}, '${CYCLE_TYPES.INTERNAL}')" title="Rotation sur soi-même">
                    <span class="cycle-type-icon">⟳</span>
                    <span>Intérieur</span>
                </button>
                <button class="cycle-type-btn ${cycleType === CYCLE_TYPES.EXTERNAL ? 'active' : ''}"
                    onclick="updateCycleType(${index}, '${CYCLE_TYPES.EXTERNAL}')" title="Orbite autour d'un astre">
                    <span class="cycle-type-icon">◎</span>
                    <span>Extérieur</span>
                </button>
            </div>
            ${showUnits ? `
            <div class="cycle-editor-units">
                <input type="number"
                    value="${cycle.unitsPerNext || 1}"
                    min="1"
                    onchange="updateCycleUnits(${index}, this.value)">
                <span>${cycle.name || (isFirst ? 'Alpha' : 'ce cycle')}</span> = 1 <span>${tempCycles[index + 1]?.name || 'suivant'}</span>
            </div>
            ` : ''}
        `;
        container.appendChild(div);
    });

    updateConversionsSection();
}

function updateCycleName(index, value) {
    tempCycles[index].name = value.trim();
    renderModalCycles();
}

function updateCycleNameLive(index, value) {
    tempCycles[index].name = value.trim();
    updateConversionsSection();
}

function updateCycleUnits(index, value) {
    tempCycles[index].unitsPerNext = parseInt(value) || 1;
    updateConversionsSection();
}

function updateCycleType(index, type) {
    tempCycles[index].type = type;
    renderModalCycles();
}

function addIntermediateCycle() {
    if (tempCycles.length < 2) return;
    const omegaIndex = tempCycles.length - 1;
    tempCycles.splice(omegaIndex, 0, { name: '', unitsPerNext: 1, type: CYCLE_TYPES.INTERNAL });
    renderModalCycles();
}

function removeIntermediateCycle(index) {
    if (index > 0 && index < tempCycles.length - 1) {
        tempCycles.splice(index, 1);
        renderModalCycles();
    }
}

// Update conversions section
function updateConversionsSection() {
    const section = document.getElementById('cycleConversions');
    const select = document.getElementById('conversionCycleSelect');

    // Check if we have at least 2 named cycles
    const namedCycles = tempCycles.filter(c => c.name);
    if (namedCycles.length < 2) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    // Populate select with cycles (excluding Alpha which is index 0)
    const currentValue = select.value;
    select.innerHTML = '';
    tempCycles.forEach((cycle, i) => {
        if (i > 0 && cycle.name) {
            const typeIcon = getCycleTypeIcon(cycle.type);
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${typeIcon} ${cycle.name}`;
            select.appendChild(option);
        }
    });

    // Restore selection or select last (Omega)
    if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
        select.value = currentValue;
    } else {
        select.value = select.options[select.options.length - 1]?.value || '';
    }

    updateConversions();
}

function updateConversions() {
    const select = document.getElementById('conversionCycleSelect');
    const container = document.getElementById('conversionResults');
    const selectedIndex = parseInt(select.value);

    if (isNaN(selectedIndex) || selectedIndex <= 0) {
        container.innerHTML = '';
        return;
    }

    const cumulative = calculateCumulativeFromAlpha(tempCycles);
    const selectedCycle = tempCycles[selectedIndex];

    let html = '';
    // Show how many of each lower cycle make 1 of the selected cycle
    for (let i = 0; i < selectedIndex; i++) {
        const cycle = tempCycles[i];
        if (!cycle.name) continue;

        const ratio = cumulative[selectedIndex] / cumulative[i];
        const typeIcon = getCycleTypeIcon(cycle.type);
        html += `
            <div class="conversion-result-item">
                <span class="conversion-result-value">${ratio.toLocaleString()}</span>
                <span class="conversion-result-label"><span>${typeIcon} ${cycle.name}</span> = 1 ${selectedCycle.name}</span>
            </div>
        `;
    }

    container.innerHTML = html;
}

async function saveTemporalSystem() {
    const name = document.getElementById('temporalSystemName').value.trim();

    if (!name) {
        showToast('Entrez un nom pour le système');
        return;
    }

    // Validate all cycles have names
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

    const systemData = {
        name: name,
        cycles: tempCycles.map(c => ({ ...c }))
    };

    if (editingSystemIndex !== null) {
        universe.temporalSystems[editingSystemIndex] = systemData;
    } else {
        universe.temporalSystems.push(systemData);
    }

    await saveAppData();
    closeTemporalModal();
    renderTemporalSystems();
    showToast(editingSystemIndex !== null ? 'Système modifié' : 'Système créé');
}

async function deleteTemporalSystem() {
    if (editingSystemIndex === null) return;

    if (!confirm('Supprimer ce système temporel ?')) return;

    const universe = appData.universes[appData.currentUniverse];
    universe.temporalSystems.splice(editingSystemIndex, 1);

    await saveAppData();
    closeTemporalModal();
    renderTemporalSystems();
    showToast('Système supprimé');
}

// Legacy function for compatibility
function renderNaturalCycles() {
    renderTemporalSystems();
}

function addNaturalCycle() {
    openTemporalModal();
}
