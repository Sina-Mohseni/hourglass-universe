/* =============================================
   TEMPORAL SYSTEM - Celestial Bodies with Internal/External Cycles
   ============================================= */

// Temporary state for editing in modal
let tempBodies = [];
let tempSystemName = '';
let editingSystemIndex = null;

function loadTemporalSystem() {
    const universe = appData.universes[appData.currentUniverse];
    // Migrate old formats
    if (universe.temporalSystem && !universe.temporalSystems) {
        if (universe.temporalSystem.naturalCycles && universe.temporalSystem.naturalCycles.length > 0) {
            universe.temporalSystems = [{
                name: 'Système principal',
                bodies: migrateOldCyclesToBodies(universe.temporalSystem.naturalCycles)
            }];
        } else {
            universe.temporalSystems = [];
        }
        delete universe.temporalSystem;
    }
    // Migrate from cycles to bodies format
    if (universe.temporalSystems) {
        universe.temporalSystems.forEach(system => {
            if (system.cycles && !system.bodies) {
                system.bodies = migrateOldCyclesToBodies(system.cycles);
                delete system.cycles;
            }
        });
    }
    if (!universe.temporalSystems) {
        universe.temporalSystems = [];
    }
    renderTemporalSystems();
}

function migrateOldCyclesToBodies(cycles) {
    return cycles.map((cycle, i) => ({
        name: cycle.name,
        internalName: cycle.name,
        externalName: i < cycles.length - 1 ? `Orbite ${cycle.name}` : '',
        internalPerExternal: cycle.unitsPerNext || 1,
        externalPerNextInternal: 1
    }));
}

// Get all cycles as a flat list for conversions
function getAllCycles(bodies) {
    const cycles = [];
    bodies.forEach((body, i) => {
        cycles.push({
            name: body.internalName || body.name,
            type: 'internal',
            bodyIndex: i,
            bodyName: body.name
        });
        if (i < bodies.length - 1 && body.externalName) {
            cycles.push({
                name: body.externalName,
                type: 'external',
                bodyIndex: i,
                bodyName: body.name
            });
        }
    });
    return cycles;
}

// Calculate cumulative values from the smallest unit (first body's internal)
function calculateAllConversions(bodies) {
    const conversions = {};
    let cumulative = 1;

    bodies.forEach((body, i) => {
        // Internal cycle of this body
        const intKey = `${i}-internal`;
        conversions[intKey] = cumulative;

        // External cycle of this body (if not last)
        if (i < bodies.length - 1) {
            cumulative *= body.internalPerExternal || 1;
            const extKey = `${i}-external`;
            conversions[extKey] = cumulative;

            // Transition to next body's internal
            cumulative *= body.externalPerNextInternal || 1;
        }
    });

    return conversions;
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
        const bodies = system.bodies || [];
        const conversions = calculateAllConversions(bodies);

        // Build bodies chain
        let bodiesHtml = '';
        bodies.forEach((body, i) => {
            const isFirst = i === 0;
            const isLast = i === bodies.length - 1;
            let posClass = isFirst ? 'alpha' : (isLast ? 'omega' : 'intermediate');

            if (i > 0) bodiesHtml += '<span class="temporal-arrow">→</span>';
            bodiesHtml += `
                <span class="temporal-body-tag ${posClass}">
                    <span class="body-name">${body.name}</span>
                    <span class="body-cycles">
                        <span class="cycle-badge internal" title="Cycle intérieur">⟳ ${body.internalName || body.name}</span>
                        ${!isLast && body.externalName ? `<span class="cycle-badge external" title="Cycle extérieur">◎ ${body.externalName}</span>` : ''}
                    </span>
                </span>
            `;
        });

        // Build conversions summary
        let conversionsHtml = '';
        if (bodies.length >= 2) {
            const allCycles = getAllCycles(bodies);
            const lastCycle = allCycles[allCycles.length - 1];
            const lastKey = `${lastCycle.bodyIndex}-${lastCycle.type}`;
            const lastValue = conversions[lastKey];

            // Show conversion from first internal to last cycle
            const firstName = bodies[0].internalName || bodies[0].name;
            conversionsHtml = `<span class="temporal-conversion-tag"><strong>${lastValue.toLocaleString()}</strong> ⟳ ${firstName} = 1 ${lastCycle.type === 'internal' ? '⟳' : '◎'} ${lastCycle.name}</span>`;
        }

        const div = document.createElement('div');
        div.className = 'temporal-system-card';
        div.onclick = () => openTemporalModal(index);
        div.innerHTML = `
            <div class="temporal-system-name">${system.name || 'Système sans nom'}</div>
            <div class="temporal-system-bodies">${bodiesHtml}</div>
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
        const system = universe.temporalSystems[index];
        tempSystemName = system.name || '';
        tempBodies = system.bodies.map(b => ({ ...b }));
        document.getElementById('temporalModalTitle').textContent = 'Modifier le système';
        document.getElementById('deleteTemporalBtn').style.display = 'block';
    } else {
        tempSystemName = '';
        tempBodies = [
            { name: '', internalName: '', externalName: '', internalPerExternal: 27, externalPerNextInternal: 1 },
            { name: '', internalName: '', externalName: '', internalPerExternal: 365, externalPerNextInternal: 1 },
            { name: '', internalName: '', externalName: '', internalPerExternal: 1, externalPerNextInternal: 1 }
        ];
        document.getElementById('temporalModalTitle').textContent = 'Nouveau Système Temporel';
        document.getElementById('deleteTemporalBtn').style.display = 'none';
    }

    document.getElementById('temporalSystemName').value = tempSystemName;
    renderModalBodies();
    updateConversionsSection();

    document.getElementById('temporalModal').classList.add('active');
}

function closeTemporalModal() {
    document.getElementById('temporalModal').classList.remove('active');
    tempBodies = [];
    tempSystemName = '';
    editingSystemIndex = null;
}

// Render bodies in the modal editor
function renderModalBodies() {
    const container = document.getElementById('temporalCyclesList');
    container.innerHTML = '';

    tempBodies.forEach((body, index) => {
        const isFirst = index === 0;
        const isLast = index === tempBodies.length - 1;

        let posClass = 'intermediate';
        let posLabel = 'Corps intermédiaire';
        if (tempBodies.length <= 2) {
            posClass = isFirst ? 'alpha' : 'omega';
            posLabel = isFirst ? 'Corps Alpha (plus petit)' : 'Corps Omega (plus grand)';
        } else {
            if (isFirst) { posClass = 'alpha'; posLabel = 'Corps Alpha (plus petit)'; }
            else if (isLast) { posClass = 'omega'; posLabel = 'Corps Omega (plus grand)'; }
        }

        const showDelete = !isFirst && !isLast && tempBodies.length > 2;

        const div = document.createElement('div');
        div.className = `cycle-editor-item body-editor ${posClass}`;
        div.innerHTML = `
            <div class="cycle-editor-header">
                <span class="cycle-editor-label">${posLabel}</span>
                ${showDelete ? `<button class="cycle-editor-delete" onclick="removeBody(${index})">✕</button>` : ''}
            </div>

            <!-- Body name -->
            <div class="body-name-row">
                <input type="text" class="form-input body-name-input"
                    value="${body.name}"
                    placeholder="Nom du corps (ex: Lune, Terre, Soleil...)"
                    onchange="updateBodyName(${index}, this.value)">
            </div>

            <!-- Internal cycle -->
            <div class="body-cycle-section internal">
                <div class="body-cycle-header">
                    <span class="body-cycle-icon">⟳</span>
                    <span class="body-cycle-label">Cycle intérieur (rotation)</span>
                </div>
                <input type="text" class="form-input"
                    value="${body.internalName}"
                    placeholder="Ex: Rotation lunaire, Jour..."
                    onchange="updateBodyInternal(${index}, this.value)">
            </div>

            ${!isLast ? `
            <!-- External cycle -->
            <div class="body-cycle-section external">
                <div class="body-cycle-header">
                    <span class="body-cycle-icon">◎</span>
                    <span class="body-cycle-label">Cycle extérieur (orbite)</span>
                </div>
                <input type="text" class="form-input"
                    value="${body.externalName}"
                    placeholder="Ex: Orbite lunaire, Mois..."
                    onchange="updateBodyExternal(${index}, this.value)">
            </div>

            <!-- Ratio: Internal per External -->
            <div class="body-ratio-section">
                <div class="body-ratio-row">
                    <input type="number" class="ratio-input"
                        value="${body.internalPerExternal || 1}"
                        min="1"
                        onchange="updateInternalPerExternal(${index}, this.value)">
                    <span class="ratio-text">⟳ ${body.internalName || 'intérieur'} = 1 ◎ ${body.externalName || 'extérieur'}</span>
                </div>
            </div>

            <!-- Ratio: External to next Internal -->
            <div class="body-ratio-section next-ratio">
                <div class="body-ratio-row">
                    <input type="number" class="ratio-input"
                        value="${body.externalPerNextInternal || 1}"
                        min="1"
                        onchange="updateExternalPerNext(${index}, this.value)">
                    <span class="ratio-text">◎ ${body.externalName || 'orbite'} = <span class="ratio-input-display">${body.externalPerNextInternal || 1}</span> ⟳ ${tempBodies[index + 1]?.internalName || tempBodies[index + 1]?.name || 'suivant'}</span>
                </div>
            </div>
            ` : ''}
        `;
        container.appendChild(div);
    });

    updateConversionsSection();
}

function updateBodyName(index, value) {
    tempBodies[index].name = value.trim();
    // Auto-fill internal name if empty
    if (!tempBodies[index].internalName) {
        tempBodies[index].internalName = value.trim();
    }
    renderModalBodies();
}

function updateBodyInternal(index, value) {
    tempBodies[index].internalName = value.trim();
    renderModalBodies();
}

function updateBodyExternal(index, value) {
    tempBodies[index].externalName = value.trim();
    renderModalBodies();
}

function updateInternalPerExternal(index, value) {
    tempBodies[index].internalPerExternal = parseInt(value) || 1;
    updateConversionsSection();
}

function updateExternalPerNext(index, value) {
    tempBodies[index].externalPerNextInternal = parseInt(value) || 1;
    updateConversionsSection();
}

function addIntermediateCycle() {
    if (tempBodies.length < 2) return;
    const lastIndex = tempBodies.length - 1;
    tempBodies.splice(lastIndex, 0, {
        name: '',
        internalName: '',
        externalName: '',
        internalPerExternal: 1,
        externalPerNextInternal: 1
    });
    renderModalBodies();
}

function removeBody(index) {
    if (index > 0 && index < tempBodies.length - 1) {
        tempBodies.splice(index, 1);
        renderModalBodies();
    }
}

// Update conversions section
function updateConversionsSection() {
    const section = document.getElementById('cycleConversions');
    const select = document.getElementById('conversionCycleSelect');

    const allCycles = getAllCycles(tempBodies);
    const namedCycles = allCycles.filter(c => c.name);

    if (namedCycles.length < 2) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    const currentValue = select.value;
    select.innerHTML = '';
    namedCycles.forEach((cycle, i) => {
        if (i > 0) { // Skip the first (smallest) cycle
            const icon = cycle.type === 'internal' ? '⟳' : '◎';
            const option = document.createElement('option');
            option.value = `${cycle.bodyIndex}-${cycle.type}`;
            option.textContent = `${icon} ${cycle.name}`;
            select.appendChild(option);
        }
    });

    if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
        select.value = currentValue;
    } else if (select.options.length > 0) {
        select.value = select.options[select.options.length - 1].value;
    }

    updateConversions();
}

function updateConversions() {
    const select = document.getElementById('conversionCycleSelect');
    const container = document.getElementById('conversionResults');
    const selectedKey = select.value;

    if (!selectedKey) {
        container.innerHTML = '';
        return;
    }

    const conversions = calculateAllConversions(tempBodies);
    const allCycles = getAllCycles(tempBodies);
    const selectedValue = conversions[selectedKey];

    // Find the selected cycle
    const [bodyIdx, cycleType] = selectedKey.split('-');
    const selectedCycle = allCycles.find(c => c.bodyIndex === parseInt(bodyIdx) && c.type === cycleType);

    let html = '';
    // Show conversions from all smaller cycles to selected
    allCycles.forEach(cycle => {
        const key = `${cycle.bodyIndex}-${cycle.type}`;
        if (key === selectedKey) return;

        const value = conversions[key];
        if (value >= selectedValue) return; // Skip larger cycles

        const ratio = selectedValue / value;
        const icon = cycle.type === 'internal' ? '⟳' : '◎';
        const selectedIcon = selectedCycle.type === 'internal' ? '⟳' : '◎';

        html += `
            <div class="conversion-result-item">
                <span class="conversion-result-value">${ratio.toLocaleString()}</span>
                <span class="conversion-result-label">${icon} <span>${cycle.name}</span> = 1 ${selectedIcon} ${selectedCycle.name}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

async function saveTemporalSystem() {
    const name = document.getElementById('temporalSystemName').value.trim();

    if (!name) {
        showToast('Entrez un nom pour le système');
        return;
    }

    // Validate all bodies have names
    for (let i = 0; i < tempBodies.length; i++) {
        if (!tempBodies[i].name) {
            showToast(`Entrez un nom pour le corps ${i + 1}`);
            return;
        }
        if (!tempBodies[i].internalName) {
            tempBodies[i].internalName = tempBodies[i].name;
        }
    }

    const universe = appData.universes[appData.currentUniverse];

    const systemData = {
        name: name,
        bodies: tempBodies.map(b => ({ ...b }))
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

// Legacy functions for compatibility
function renderNaturalCycles() {
    renderTemporalSystems();
}

function addNaturalCycle() {
    openTemporalModal();
}
