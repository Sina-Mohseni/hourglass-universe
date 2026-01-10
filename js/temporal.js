/* =============================================
   TEMPORAL SYSTEM - Column-based Points with Interior/Exterior/Double Cycles
   ============================================= */

// Temporary state for editing in modal
let tempPoints = [];
let tempSystemName = '';
let editingSystemIndex = null;
let selectedPointIndex = null;

/**
 * Data Structure:
 * temporalSystem = {
 *   name: "System Name",
 *   points: [
 *     {
 *       id: "unique-id",
 *       name: "Point Name (e.g., Soleil, Terre, Lune)",
 *       isWorld: false, // If true, appears in Universe crossline as a World
 *       interiorCycle: {
 *         name: "Cycle Name (e.g., Jour, Rotation)",
 *         duration: 1 // Duration in base units
 *       },
 *       exteriorCycles: [
 *         {
 *           targetPointId: "id-of-point-above",
 *           name: "Cycle Name (e.g., Année, Orbite)",
 *           duration: 365 // Duration in base units
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * Points are ordered from top (center, nothing orbits around it) to bottom (outermost)
 */

function generatePointId() {
    return 'pt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function loadTemporalSystem() {
    const universe = appData.universes[appData.currentUniverse];

    // Migrate old formats
    if (universe.temporalSystem && !universe.temporalSystems) {
        if (universe.temporalSystem.naturalCycles && universe.temporalSystem.naturalCycles.length > 0) {
            universe.temporalSystems = [{
                name: 'Système principal',
                points: migrateOldCyclesToPoints(universe.temporalSystem.naturalCycles)
            }];
        } else {
            universe.temporalSystems = [];
        }
        delete universe.temporalSystem;
    }

    // Migrate from bodies to points format
    if (universe.temporalSystems) {
        universe.temporalSystems.forEach(system => {
            if (system.bodies && !system.points) {
                system.points = migrateBodiesToPoints(system.bodies);
                delete system.bodies;
            }
            if (system.cycles && !system.points) {
                system.points = migrateOldCyclesToPoints(system.cycles);
                delete system.cycles;
            }
        });
    }

    if (!universe.temporalSystems) {
        universe.temporalSystems = [];
    }

    renderTemporalSystems();
}

function migrateOldCyclesToPoints(cycles) {
    const points = [];
    cycles.forEach((cycle, i) => {
        const point = {
            id: generatePointId(),
            name: cycle.name,
            isWorld: false,
            interiorCycle: {
                name: cycle.name,
                duration: 1
            },
            exteriorCycles: []
        };

        // Link to previous point if exists
        if (i > 0) {
            point.exteriorCycles.push({
                targetPointId: points[i - 1].id,
                name: `Orbite ${points[i - 1].name}`,
                duration: cycle.unitsPerNext || 1
            });
        }

        points.push(point);
    });

    return points.reverse(); // Reverse to have center at top
}

function migrateBodiesToPoints(bodies) {
    const points = [];

    // Bodies were ordered from smallest (alpha) to largest (omega)
    // New order: center (top) to external (bottom) - so we reverse
    const reversedBodies = [...bodies].reverse();

    reversedBodies.forEach((body, i) => {
        const point = {
            id: generatePointId(),
            name: body.name || `Point ${i + 1}`,
            isWorld: false,
            interiorCycle: {
                name: body.internalName || body.name || 'Rotation',
                duration: 1
            },
            exteriorCycles: []
        };

        // Link to previous point (the one above in new order)
        if (i > 0) {
            point.exteriorCycles.push({
                targetPointId: points[i - 1].id,
                name: body.externalName || `Orbite ${points[i - 1].name}`,
                duration: body.internalPerExternal || 1
            });
        }

        points.push(point);
    });

    return points;
}

// Render all temporal systems as clickable cards
function renderTemporalSystems() {
    const universe = appData.universes[appData.currentUniverse];
    const systems = universe.temporalSystems || [];
    const container = document.getElementById('temporalSystemsList');

    if (!container) return;

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
        const points = system.points || [];
        const worlds = points.filter(p => p.isWorld);

        // Build points chain
        let pointsHtml = '';
        points.forEach((point, i) => {
            const isFirst = i === 0;
            const isLast = i === points.length - 1;
            let posClass = isFirst ? 'center' : (isLast ? 'external' : 'intermediate');

            if (i > 0) pointsHtml += '<span class="temporal-arrow">↓</span>';
            pointsHtml += `
                <span class="temporal-point-tag ${posClass} ${point.isWorld ? 'is-world' : ''}">
                    <span class="point-name">${point.name || 'Sans nom'}</span>
                    ${point.isWorld ? '<span class="world-badge">🌍</span>' : ''}
                </span>
            `;
        });

        // Build cycles summary
        let cyclesHtml = '';
        points.forEach(point => {
            if (point.interiorCycle && point.interiorCycle.name) {
                cyclesHtml += `<span class="cycle-tag interior">⟳ ${point.interiorCycle.name}</span>`;
            }
            point.exteriorCycles.forEach(ext => {
                if (ext.name) {
                    cyclesHtml += `<span class="cycle-tag exterior">◎ ${ext.name}</span>`;
                }
            });
        });

        const div = document.createElement('div');
        div.className = 'temporal-system-card';
        div.onclick = () => openTemporalModal(index);
        div.innerHTML = `
            <div class="temporal-system-name">${system.name || 'Système sans nom'}</div>
            <div class="temporal-system-points">${pointsHtml}</div>
            <div class="temporal-system-cycles">${cyclesHtml}</div>
            ${worlds.length > 0 ? `<div class="temporal-system-worlds"><span class="worlds-label">Mondes:</span> ${worlds.map(w => w.name).join(', ')}</div>` : ''}
        `;
        container.appendChild(div);
    });
}

// Open modal for creating or editing a system
function openTemporalModal(index = null) {
    const universe = appData.universes[appData.currentUniverse];
    editingSystemIndex = index;
    selectedPointIndex = null;

    if (index !== null) {
        const system = universe.temporalSystems[index];
        tempSystemName = system.name || '';
        tempPoints = system.points.map(p => ({
            ...p,
            exteriorCycles: p.exteriorCycles ? p.exteriorCycles.map(e => ({ ...e })) : [],
            interiorCycle: p.interiorCycle ? { ...p.interiorCycle } : { name: '', duration: 1 }
        }));
        document.getElementById('temporalModalTitle').textContent = 'Modifier le système';
        document.getElementById('deleteTemporalBtn').style.display = 'block';
    } else {
        tempSystemName = '';
        // Create default 3 points (e.g., Soleil -> Terre -> Lune)
        const id1 = generatePointId();
        const id2 = generatePointId();
        const id3 = generatePointId();
        tempPoints = [
            {
                id: id1,
                name: '',
                isWorld: false,
                interiorCycle: { name: '', duration: 1 },
                exteriorCycles: []
            },
            {
                id: id2,
                name: '',
                isWorld: false,
                interiorCycle: { name: '', duration: 1 },
                exteriorCycles: [{ targetPointId: id1, name: '', duration: 365 }]
            },
            {
                id: id3,
                name: '',
                isWorld: false,
                interiorCycle: { name: '', duration: 1 },
                exteriorCycles: [{ targetPointId: id2, name: '', duration: 27 }]
            }
        ];
        document.getElementById('temporalModalTitle').textContent = 'Nouveau Système Temporel';
        document.getElementById('deleteTemporalBtn').style.display = 'none';
    }

    document.getElementById('temporalSystemName').value = tempSystemName;
    renderTemporalPoints();
    hidePointDetail();
    updateConversionsSummary();

    document.getElementById('temporalModal').classList.add('active');
}

function closeTemporalModal() {
    document.getElementById('temporalModal').classList.remove('active');
    tempPoints = [];
    tempSystemName = '';
    editingSystemIndex = null;
    selectedPointIndex = null;
}

// Render points in vertical column
function renderTemporalPoints() {
    const container = document.getElementById('temporalPointsList');
    container.innerHTML = '';

    tempPoints.forEach((point, index) => {
        const isFirst = index === 0;
        const isLast = index === tempPoints.length - 1;

        let posLabel = 'Intermédiaire';
        let posClass = 'intermediate';
        if (isFirst) {
            posLabel = 'Centre';
            posClass = 'center';
        } else if (isLast) {
            posLabel = 'Externe';
            posClass = 'external';
        }

        const isSelected = selectedPointIndex === index;

        const div = document.createElement('div');
        div.className = `temporal-point ${posClass} ${isSelected ? 'selected' : ''} ${point.isWorld ? 'is-world' : ''}`;
        div.onclick = () => selectPoint(index);
        div.innerHTML = `
            <div class="temporal-point-marker"></div>
            <div class="temporal-point-content">
                <input type="text" class="temporal-point-name"
                    value="${point.name || ''}"
                    placeholder="${posLabel}"
                    onclick="event.stopPropagation()"
                    onchange="updatePointName(${index}, this.value)">
                <div class="temporal-point-info">
                    ${point.interiorCycle && point.interiorCycle.name ? `<span class="cycle-mini interior">⟳ ${point.interiorCycle.name}</span>` : ''}
                    ${point.exteriorCycles && point.exteriorCycles.length > 0 ? point.exteriorCycles.filter(e => e.name).map(e => `<span class="cycle-mini exterior">◎ ${e.name}</span>`).join('') : ''}
                    ${point.isWorld ? '<span class="world-mini">🌍</span>' : ''}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function updatePointName(index, value) {
    tempPoints[index].name = value.trim();
    // Update exterior cycles that reference this point
    tempPoints.forEach(point => {
        point.exteriorCycles.forEach(ext => {
            if (ext.targetPointId === tempPoints[index].id) {
                // Optionally update the cycle name if it was auto-generated
            }
        });
    });
    updateConversionsSummary();
}

function addTemporalPoint() {
    const newId = generatePointId();
    const lastPoint = tempPoints[tempPoints.length - 1];

    // New point is added at the bottom (external)
    const newPoint = {
        id: newId,
        name: '',
        isWorld: false,
        interiorCycle: { name: '', duration: 1 },
        exteriorCycles: lastPoint ? [{ targetPointId: lastPoint.id, name: '', duration: 1 }] : []
    };

    tempPoints.push(newPoint);
    renderTemporalPoints();

    // Select the new point
    selectPoint(tempPoints.length - 1);
}

function selectPoint(index) {
    selectedPointIndex = index;
    renderTemporalPoints();
    showPointDetail(index);
}

function showPointDetail(index) {
    const point = tempPoints[index];
    if (!point) return;

    const panel = document.getElementById('pointDetailPanel');
    panel.style.display = 'block';

    document.getElementById('pointDetailTitle').textContent = point.name || `Point ${index + 1}`;

    // Interior cycle
    document.getElementById('pointInteriorName').value = point.interiorCycle?.name || '';
    document.getElementById('pointInteriorDuration').value = point.interiorCycle?.duration || 1;

    // Exterior cycles - show all possible targets (points above this one)
    const exteriorContainer = document.getElementById('pointExteriorCycles');
    exteriorContainer.innerHTML = '';

    if (index === 0) {
        // Center point has no exterior cycles (nothing to orbit)
        exteriorContainer.innerHTML = '<p class="form-help">Le point central ne peut pas orbiter autour d\'autres points.</p>';
    } else {
        // Can orbit around any point above (index 0 to index-1)
        for (let i = 0; i < index; i++) {
            const targetPoint = tempPoints[i];
            const existingCycle = point.exteriorCycles.find(e => e.targetPointId === targetPoint.id);

            const cycleDiv = document.createElement('div');
            cycleDiv.className = 'exterior-cycle-row';
            cycleDiv.innerHTML = `
                <div class="exterior-cycle-target">
                    <span class="exterior-target-label">Orbite autour de:</span>
                    <span class="exterior-target-name">${targetPoint.name || `Point ${i + 1}`}</span>
                </div>
                <input type="text" class="form-input"
                    placeholder="Nom du cycle (ex: Année, Orbite...)"
                    value="${existingCycle?.name || ''}"
                    onchange="updateExteriorCycle(${index}, '${targetPoint.id}', 'name', this.value)">
                <div class="exterior-cycle-duration">
                    <label>Durée:</label>
                    <input type="number" class="form-input"
                        value="${existingCycle?.duration || 1}"
                        min="1"
                        onchange="updateExteriorCycle(${index}, '${targetPoint.id}', 'duration', this.value)">
                    <span class="duration-unit">unités de base</span>
                </div>
            `;
            exteriorContainer.appendChild(cycleDiv);
        }
    }

    // Double cycles - calculated combinations
    const doubleContainer = document.getElementById('pointDoubleCycles');
    doubleContainer.innerHTML = '';

    if (index === 0 || !point.exteriorCycles || point.exteriorCycles.length === 0) {
        doubleContainer.innerHTML = '<p class="form-help">Les cycles doubles sont calculés à partir des cycles intérieurs et extérieurs.</p>';
    } else {
        // Calculate double cycles
        const doubleCycles = calculateDoubleCycles(point);
        if (doubleCycles.length === 0) {
            doubleContainer.innerHTML = '<p class="form-help">Définissez les cycles intérieurs et extérieurs pour voir les combinaisons.</p>';
        } else {
            doubleCycles.forEach(dc => {
                const div = document.createElement('div');
                div.className = 'double-cycle-item';
                div.innerHTML = `
                    <span class="double-cycle-name">${dc.name}</span>
                    <span class="double-cycle-value">${dc.value.toLocaleString()} unités de base</span>
                `;
                doubleContainer.appendChild(div);
            });
        }
    }

    // Activate as World toggle
    document.getElementById('pointIsWorld').checked = point.isWorld || false;

    // Delete button visibility (can't delete if only 2 points)
    document.getElementById('deletePointBtn').style.display = tempPoints.length > 2 ? 'block' : 'none';
}

function calculateDoubleCycles(point) {
    const doubleCycles = [];

    if (!point.interiorCycle || !point.interiorCycle.name) return doubleCycles;

    point.exteriorCycles.forEach(ext => {
        if (!ext.name || !ext.duration) return;

        const targetPoint = tempPoints.find(p => p.id === ext.targetPointId);
        if (!targetPoint) return;

        // Double cycle: interior cycles per exterior cycle
        const interiorDuration = point.interiorCycle.duration || 1;
        const exteriorDuration = ext.duration || 1;

        // How many interior cycles fit in one exterior cycle
        const ratio = exteriorDuration / interiorDuration;

        doubleCycles.push({
            name: `${point.interiorCycle.name} par ${ext.name}`,
            value: ratio
        });

        // Also calculate with target's interior cycle if exists
        if (targetPoint.interiorCycle && targetPoint.interiorCycle.name) {
            const targetDuration = targetPoint.interiorCycle.duration || 1;
            doubleCycles.push({
                name: `${point.interiorCycle.name} par ${targetPoint.interiorCycle.name} (via ${ext.name})`,
                value: exteriorDuration / interiorDuration
            });
        }
    });

    return doubleCycles;
}

function updateExteriorCycle(pointIndex, targetId, field, value) {
    const point = tempPoints[pointIndex];
    let cycle = point.exteriorCycles.find(e => e.targetPointId === targetId);

    if (!cycle) {
        cycle = { targetPointId: targetId, name: '', duration: 1 };
        point.exteriorCycles.push(cycle);
    }

    if (field === 'name') {
        cycle.name = value.trim();
    } else if (field === 'duration') {
        cycle.duration = parseInt(value) || 1;
    }

    // Refresh double cycles
    showPointDetail(pointIndex);
    updateConversionsSummary();
}

function hidePointDetail() {
    document.getElementById('pointDetailPanel').style.display = 'none';
    selectedPointIndex = null;
}

function closePointDetail() {
    hidePointDetail();
    renderTemporalPoints();
}

function savePointDetail() {
    if (selectedPointIndex === null) return;

    const point = tempPoints[selectedPointIndex];

    // Save interior cycle
    point.interiorCycle = {
        name: document.getElementById('pointInteriorName').value.trim(),
        duration: parseInt(document.getElementById('pointInteriorDuration').value) || 1
    };

    // Save world status
    point.isWorld = document.getElementById('pointIsWorld').checked;

    renderTemporalPoints();
    updateConversionsSummary();
    showToast('Point mis à jour');
}

function togglePointWorld() {
    if (selectedPointIndex === null) return;
    tempPoints[selectedPointIndex].isWorld = document.getElementById('pointIsWorld').checked;
    renderTemporalPoints();
}

function deleteSelectedPoint() {
    if (selectedPointIndex === null || tempPoints.length <= 2) return;

    const deletedPoint = tempPoints[selectedPointIndex];

    // Remove exterior cycles referencing this point
    tempPoints.forEach(point => {
        point.exteriorCycles = point.exteriorCycles.filter(e => e.targetPointId !== deletedPoint.id);
    });

    tempPoints.splice(selectedPointIndex, 1);
    hidePointDetail();
    renderTemporalPoints();
    updateConversionsSummary();
    showToast('Point supprimé');
}

// Update conversions summary
function updateConversionsSummary() {
    const section = document.getElementById('cycleConversions');
    const container = document.getElementById('conversionResults');

    // Collect all named cycles with their durations
    const cycles = [];

    tempPoints.forEach((point, i) => {
        if (point.interiorCycle && point.interiorCycle.name) {
            cycles.push({
                name: point.interiorCycle.name,
                type: 'interior',
                pointName: point.name || `Point ${i + 1}`,
                duration: point.interiorCycle.duration || 1
            });
        }

        point.exteriorCycles.forEach(ext => {
            if (ext.name) {
                const target = tempPoints.find(p => p.id === ext.targetPointId);
                cycles.push({
                    name: ext.name,
                    type: 'exterior',
                    pointName: point.name || `Point ${i + 1}`,
                    targetName: target ? (target.name || 'Point') : 'Point',
                    duration: ext.duration || 1
                });
            }
        });
    });

    if (cycles.length < 2) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    // Find smallest duration as base unit
    const minDuration = Math.min(...cycles.map(c => c.duration));

    // Show conversions
    let html = '';
    cycles.sort((a, b) => a.duration - b.duration);

    for (let i = 1; i < cycles.length; i++) {
        const cycle = cycles[i];
        const baseCycle = cycles[0];
        const ratio = cycle.duration / baseCycle.duration;

        if (ratio > 1) {
            const icon = cycle.type === 'interior' ? '⟳' : '◎';
            const baseIcon = baseCycle.type === 'interior' ? '⟳' : '◎';

            html += `
                <div class="conversion-result-item">
                    <span class="conversion-result-value">${ratio.toLocaleString()}</span>
                    <span class="conversion-result-label">${baseIcon} ${baseCycle.name} = 1 ${icon} ${cycle.name}</span>
                </div>
            `;
        }
    }

    container.innerHTML = html || '<p class="form-help">Aucune conversion disponible</p>';
}

async function saveTemporalSystem() {
    const name = document.getElementById('temporalSystemName').value.trim();

    if (!name) {
        showToast('Entrez un nom pour le système');
        return;
    }

    // Validate all points have names
    for (let i = 0; i < tempPoints.length; i++) {
        if (!tempPoints[i].name) {
            showToast(`Entrez un nom pour le point ${i + 1}`);
            return;
        }
    }

    const universe = appData.universes[appData.currentUniverse];

    const systemData = {
        name: name,
        points: tempPoints.map(p => ({
            ...p,
            exteriorCycles: p.exteriorCycles.map(e => ({ ...e })),
            interiorCycle: { ...p.interiorCycle }
        }))
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

// Get all worlds from temporal systems
function getWorlds() {
    const universe = appData.universes[appData.currentUniverse];
    if (!universe || !universe.temporalSystems) return [];

    const worlds = [];
    universe.temporalSystems.forEach((system, systemIndex) => {
        if (system.points) {
            system.points.forEach((point, pointIndex) => {
                if (point.isWorld) {
                    worlds.push({
                        systemIndex,
                        pointIndex,
                        point,
                        systemName: system.name
                    });
                }
            });
        }
    });

    return worlds;
}

// Legacy functions for compatibility
function renderNaturalCycles() {
    renderTemporalSystems();
}

function addNaturalCycle() {
    openTemporalModal();
}

// Helper to get cycle conversions between two cycles
function getCycleConversion(fromCycle, toCycle, points) {
    // Find both cycles
    let fromDuration = null;
    let toDuration = null;

    points.forEach(point => {
        if (point.interiorCycle && point.interiorCycle.name === fromCycle) {
            fromDuration = point.interiorCycle.duration;
        }
        point.exteriorCycles.forEach(ext => {
            if (ext.name === fromCycle) {
                fromDuration = ext.duration;
            }
        });

        if (point.interiorCycle && point.interiorCycle.name === toCycle) {
            toDuration = point.interiorCycle.duration;
        }
        point.exteriorCycles.forEach(ext => {
            if (ext.name === toCycle) {
                toDuration = ext.duration;
            }
        });
    });

    if (fromDuration && toDuration) {
        return toDuration / fromDuration;
    }

    return null;
}
