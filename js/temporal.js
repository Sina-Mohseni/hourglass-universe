/* =============================================
   TEMPORAL SYSTEM
   ============================================= */

function loadTemporalSystem() {
    const universe = appData.universes[appData.currentUniverse];
    if (!universe.temporalSystem) {
        universe.temporalSystem = {
            hasNaturalCycles: false,
            hasArtificialCycles: false,
            naturalCycles: []
        };
    }

    const ts = universe.temporalSystem;
    document.getElementById('hasNaturalCycles').checked = ts.hasNaturalCycles;
    document.getElementById('hasArtificialCycles').checked = ts.hasArtificialCycles;

    toggleNaturalCycles();
    toggleArtificialCycles();
    renderNaturalCycles();
}

function toggleNaturalCycles() {
    const checked = document.getElementById('hasNaturalCycles').checked;
    document.getElementById('naturalCyclesConfig').style.display = checked ? 'block' : 'none';
    document.getElementById('simpleTimelineInfo').style.display = !checked ? 'block' : 'none';

    if (checked) {
        const universe = appData.universes[appData.currentUniverse];
        if (!universe.temporalSystem.naturalCycles || universe.temporalSystem.naturalCycles.length === 0) {
            // Add default Alpha and Omega cycles
            universe.temporalSystem.naturalCycles = [
                { name: 'Cycle Alpha', type: 'alpha', unitsPerNext: 1 },
                { name: 'Cycle Omega', type: 'omega', unitsPerNext: null }
            ];
            renderNaturalCycles();
        }
    }
}

function toggleArtificialCycles() {
    // Just for visual feedback, artificial cycles are managed in calendars
}

function renderNaturalCycles() {
    const universe = appData.universes[appData.currentUniverse];
    if (!universe.temporalSystem) return;

    const cycles = universe.temporalSystem.naturalCycles || [];
    const container = document.getElementById('naturalCyclesList');
    container.innerHTML = '';

    // Calculate cumulative values from Alpha to each cycle
    const cumulativeFromAlpha = calculateCumulativeCycles(cycles);

    cycles.forEach((cycle, index) => {
        const isFirst = index === 0;
        const isLast = index === cycles.length - 1;

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
                <span class="cycle-type">${isFirst ? 'Alpha (Plus petit)' : isLast ? 'Omega (Plus grand)' : 'Intermédiaire'}</span>
                ${!isFirst && !isLast ? `<button class="cycle-delete-btn" onclick="removeNaturalCycle(${index})">✕</button>` : ''}
            </div>
            <div class="cycle-item-row">
                <input type="text" value="${cycle.name}" placeholder="Nom du cycle" onchange="updateCycleName(${index}, this.value)">
            </div>
            ${!isLast ? `
            <div class="cycle-relation">
                <input type="number" value="${cycle.unitsPerNext || 1}" min="1" onchange="updateCycleUnits(${index}, this.value)" style="width:80px">
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

function updateCycleName(index, name) {
    const universe = appData.universes[appData.currentUniverse];
    universe.temporalSystem.naturalCycles[index].name = name;
    renderNaturalCycles();
}

function updateCycleUnits(index, units) {
    const universe = appData.universes[appData.currentUniverse];
    universe.temporalSystem.naturalCycles[index].unitsPerNext = parseInt(units) || 1;
    renderNaturalCycles();
}

function addNaturalCycle() {
    const universe = appData.universes[appData.currentUniverse];
    const cycles = universe.temporalSystem.naturalCycles;

    // Insert before the last (Omega) cycle
    const newCycle = {
        name: 'Nouveau cycle',
        type: 'intermediate',
        unitsPerNext: 1
    };

    cycles.splice(cycles.length - 1, 0, newCycle);
    renderNaturalCycles();
}

function removeNaturalCycle(index) {
    const universe = appData.universes[appData.currentUniverse];
    universe.temporalSystem.naturalCycles.splice(index, 1);
    renderNaturalCycles();
}

async function saveTemporalSystem() {
    const universe = appData.universes[appData.currentUniverse];
    universe.temporalSystem.hasNaturalCycles = document.getElementById('hasNaturalCycles').checked;
    universe.temporalSystem.hasArtificialCycles = document.getElementById('hasArtificialCycles').checked;

    await saveAppData();
    showToast('Système temporel enregistré');
}
