/* =============================================
   CALENDARS
   ============================================= */

function renderEraCalendars() {
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const era = worldData.eras[appData.currentEra];
    const container = document.getElementById('calendarsContainer');
    container.innerHTML = '';

    if (!era || !era.calendars || !era.calendars.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">Aucun calendrier</div></div>';
        return;
    }

    era.calendars.forEach((cal, index) => {
        container.appendChild(createCalendarElement(cal, index, 'era'));
    });
}

function renderDetailCalendars() {
    const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    const era = worldData.eras[appData.currentEra];
    const saga = era.sagas[appData.currentSaga];
    const detail = saga[appData.currentDetailType][appData.currentDetail];
    const container = document.getElementById('detailCalendarsContainer');
    container.innerHTML = '';

    if (!detail.calendars || !detail.calendars.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">Aucun calendrier</div></div>';
        return;
    }

    detail.calendars.forEach((cal, index) => {
        container.appendChild(createCalendarElement(cal, index, 'detail'));
    });
}

function createCalendarElement(cal, index, parentType) {
    const div = document.createElement('div');
    div.className = 'calendar-container';

    const days = cal.daysPerWeek * cal.weeksPerMonth;
    let dayHeaders = '';

    for (let j = 1; j <= cal.daysPerWeek; j++) {
        dayHeaders += `<div class="calendar-day-header">${(cal.dayName || 'J').substring(0, 2)}${j}</div>`;
    }

    for (let j = 1; j <= days; j++) {
        dayHeaders += `<div class="calendar-day">${j}</div>`;
    }

    // Get natural cycle info if set
    let cycleInfo = '';
    const universe = appData.universes[appData.currentUniverse];
    if (cal.temporalSystemIndex !== undefined && cal.temporalSystemIndex !== null) {
        const system = universe.temporalSystems?.[cal.temporalSystemIndex];
        if (system) {
            // New bodies format
            if (system.bodies && cal.cycleKey) {
                const [bodyIdx, cycleType] = cal.cycleKey.split('-');
                const body = system.bodies[parseInt(bodyIdx)];
                if (body) {
                    const cycleName = cycleType === 'internal' ? body.internalName : body.externalName;
                    const icon = cycleType === 'internal' ? '⟳' : '◎';
                    cycleInfo = `<div class="calendar-cycle-info">Système: ${system.name} (${icon} ${cycleName})</div>`;
                }
            } else if (system.cycles && cal.naturalCycleIndex !== undefined) {
                // Legacy cycles format
                const cycleName = system.cycles[cal.naturalCycleIndex]?.name;
                cycleInfo = `<div class="calendar-cycle-info">Système: ${system.name}${cycleName ? ` (${cycleName})` : ''}</div>`;
            } else {
                cycleInfo = `<div class="calendar-cycle-info">Système: ${system.name}</div>`;
            }
        }
    }

    div.innerHTML = `
        <div class="calendar-header">
            <div class="calendar-nav">
                <div class="calendar-title">${cal.name} - ${cal.monthName || 'Mois'} 1</div>
            </div>
            <div class="itemline-item-actions">
                <button class="itemline-item-btn" onclick="editCalendar('${parentType}',${index})">✎</button>
                <button class="itemline-item-btn delete" onclick="deleteCalendar('${parentType}',${index})">✕</button>
            </div>
        </div>
        ${cycleInfo}
        <div class="calendar-grid" style="grid-template-columns:repeat(${cal.daysPerWeek},1fr)">${dayHeaders}</div>
        <div class="calendar-customize">
            <div class="calendar-setting"><span class="calendar-setting-label">${cal.dayName || 'Jours'}/${cal.weekName || 'sem'}</span><span>${cal.daysPerWeek}</span></div>
            <div class="calendar-setting"><span class="calendar-setting-label">${cal.weekName || 'Sem'}/${cal.monthName || 'mois'}</span><span>${cal.weeksPerMonth}</span></div>
            <div class="calendar-setting"><span class="calendar-setting-label">${cal.monthName || 'Mois'}/${cal.yearName || 'an'}</span><span>${cal.monthsPerYear}</span></div>
            <div class="calendar-setting"><span class="calendar-setting-label">${cal.hourName || 'H'}/${cal.dayName || 'jour'}</span><span>${cal.hoursPerDay}</span></div>
        </div>
    `;

    return div;
}

function populateTemporalSystemSelector(selectedSystemIndex = '', selectedCycleIndex = '') {
    const systemSelect = document.getElementById('calendarTemporalSystem');
    const cycleGroup = document.getElementById('calendarCycleGroup');

    // Reset system options
    systemSelect.innerHTML = '<option value="">Aucun (cycles artificiels uniquement)</option>';

    const universe = appData.universes[appData.currentUniverse];
    const systems = universe.temporalSystems || [];

    systems.forEach((system, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = system.name;
        if (selectedSystemIndex !== '' && parseInt(selectedSystemIndex) === index) {
            option.selected = true;
        }
        systemSelect.appendChild(option);
    });

    // Show/hide cycle selector
    if (selectedSystemIndex !== '' && selectedSystemIndex !== null) {
        updateCycleSelector(selectedCycleIndex);
    } else {
        cycleGroup.style.display = 'none';
    }
}

function updateCycleSelector(selectedCycleKey = '') {
    const systemSelect = document.getElementById('calendarTemporalSystem');
    const cycleSelect = document.getElementById('calendarNaturalCycle');
    const cycleGroup = document.getElementById('calendarCycleGroup');
    const helpText = document.getElementById('calendarCycleHelp');

    const systemIndex = systemSelect.value;

    if (systemIndex === '' || systemIndex === null) {
        cycleGroup.style.display = 'none';
        return;
    }

    cycleGroup.style.display = 'block';
    cycleSelect.innerHTML = '';

    const universe = appData.universes[appData.currentUniverse];
    const system = universe.temporalSystems?.[parseInt(systemIndex)];

    if (system && system.bodies) {
        // New bodies format - get all cycles
        system.bodies.forEach((body, bodyIndex) => {
            // Internal cycle
            if (body.internalName) {
                const option = document.createElement('option');
                option.value = `${bodyIndex}-internal`;
                option.textContent = `⟳ ${body.internalName}`;
                if (selectedCycleKey === `${bodyIndex}-internal`) {
                    option.selected = true;
                }
                cycleSelect.appendChild(option);
            }
            // External cycle (if not last body)
            if (bodyIndex < system.bodies.length - 1 && body.externalName) {
                const option = document.createElement('option');
                option.value = `${bodyIndex}-external`;
                option.textContent = `◎ ${body.externalName}`;
                if (selectedCycleKey === `${bodyIndex}-external`) {
                    option.selected = true;
                }
                cycleSelect.appendChild(option);
            }
        });
        helpText.textContent = 'Choisissez le cycle de base pour ce calendrier.';
    } else if (system && system.cycles) {
        // Legacy cycles format
        system.cycles.forEach((cycle, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = cycle.name;
            if (selectedCycleKey !== '' && parseInt(selectedCycleKey) === index) {
                option.selected = true;
            }
            cycleSelect.appendChild(option);
        });
        helpText.textContent = 'Choisissez le cycle de base pour ce calendrier.';
    }
}

// Legacy function for backwards compatibility
function populateNaturalCycleSelector(selectedIndex = '') {
    populateTemporalSystemSelector('', selectedIndex);
}

function openCalendarModal(parent = 'era') {
    calendarState = { parentType: parent, editIndex: null };

    ['calendarName', 'calendarYearName', 'calendarMonthName', 'calendarWeekName', 'calendarDayName', 'calendarHourName'].forEach(id => {
        document.getElementById(id).value = '';
    });

    document.getElementById('daysPerWeek').value = 7;
    document.getElementById('weeksPerMonth').value = 4;
    document.getElementById('monthsPerYear').value = 12;
    document.getElementById('hoursPerDay').value = 24;

    populateTemporalSystemSelector();

    document.getElementById('calendarModal').classList.add('active');
}

function editCalendar(parent, index) {
    calendarState = { parentType: parent, editIndex: index };

    let cal;
    if (parent === 'world') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        cal = worldData.calendars[index];
    } else if (parent === 'era') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        cal = worldData.eras[appData.currentEra].calendars[index];
    } else if (parent === 'saga') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        const era = worldData.eras[appData.currentEra];
        cal = era.sagas[appData.currentSaga].calendars[index];
    } else {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        const era = worldData.eras[appData.currentEra];
        const saga = era.sagas[appData.currentSaga];
        cal = saga[appData.currentDetailType][appData.currentDetail].calendars[index];
    }

    document.getElementById('calendarName').value = cal.name || '';
    document.getElementById('calendarYearName').value = cal.yearName || '';
    document.getElementById('calendarMonthName').value = cal.monthName || '';
    document.getElementById('calendarWeekName').value = cal.weekName || '';
    document.getElementById('calendarDayName').value = cal.dayName || '';
    document.getElementById('calendarHourName').value = cal.hourName || '';
    document.getElementById('daysPerWeek').value = cal.daysPerWeek || 7;
    document.getElementById('weeksPerMonth').value = cal.weeksPerMonth || 4;
    document.getElementById('monthsPerYear').value = cal.monthsPerYear || 12;
    document.getElementById('hoursPerDay').value = cal.hoursPerDay || 24;

    const systemIdx = cal.temporalSystemIndex !== undefined ? cal.temporalSystemIndex : '';
    // Support both new cycleKey and legacy naturalCycleIndex
    const cycleKey = cal.cycleKey || (cal.naturalCycleIndex !== undefined ? cal.naturalCycleIndex : '');
    populateTemporalSystemSelector(systemIdx, cycleKey);

    document.getElementById('calendarModal').classList.add('active');
}

async function saveCalendar() {
    const name = document.getElementById('calendarName').value.trim();

    if (!name) {
        showToast('Entrez un nom');
        return;
    }

    const systemValue = document.getElementById('calendarTemporalSystem').value;
    const cycleValue = document.getElementById('calendarNaturalCycle').value;

    const cal = {
        name: name,
        temporalSystemIndex: systemValue !== '' ? parseInt(systemValue) : null,
        cycleKey: (systemValue !== '' && cycleValue !== '') ? cycleValue : null,
        yearName: document.getElementById('calendarYearName').value.trim() || 'Année',
        monthName: document.getElementById('calendarMonthName').value.trim() || 'Mois',
        weekName: document.getElementById('calendarWeekName').value.trim() || 'Semaine',
        dayName: document.getElementById('calendarDayName').value.trim() || 'Jour',
        hourName: document.getElementById('calendarHourName').value.trim() || 'Heure',
        daysPerWeek: parseInt(document.getElementById('daysPerWeek').value) || 7,
        weeksPerMonth: parseInt(document.getElementById('weeksPerMonth').value) || 4,
        monthsPerYear: parseInt(document.getElementById('monthsPerYear').value) || 12,
        hoursPerDay: parseInt(document.getElementById('hoursPerDay').value) || 24
    };

    let target;
    if (calendarState.parentType === 'world') {
        target = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
    } else if (calendarState.parentType === 'era') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        target = worldData.eras[appData.currentEra];
    } else if (calendarState.parentType === 'saga') {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        const era = worldData.eras[appData.currentEra];
        target = era.sagas[appData.currentSaga];
    } else {
        const worldData = getWorldData(appData.currentWorldSystem, appData.currentWorldPoint);
        const era = worldData.eras[appData.currentEra];
        const saga = era.sagas[appData.currentSaga];
        target = saga[appData.currentDetailType][appData.currentDetail];
    }

    if (!target.calendars) target.calendars = [];

    if (calendarState.editIndex !== null) {
        target.calendars[calendarState.editIndex] = cal;
    } else {
        target.calendars.push(cal);
    }

    await saveAppData();
    closeModal('calendarModal');
    showToast('Calendrier enregistré');

    if (calendarState.parentType === 'world') {
        renderWorldCalendars();
        restoreActiveSection('world');
    } else if (calendarState.parentType === 'era') {
        renderEraCalendars();
        restoreActiveSection('era');
    } else if (calendarState.parentType === 'saga') {
        renderSagaCalendars();
        restoreActiveSection('saga');
    } else {
        renderDetailCalendars();
        restoreActiveSection('detail');
    }
}

async function deleteCalendar(parent, index) {
    let target;

    if (parent === 'world') {
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

    target.calendars.splice(index, 1);
    await saveAppData();
    showToast('Supprimé');

    if (parent === 'world') {
        renderWorldCalendars();
        restoreActiveSection('world');
    } else if (parent === 'era') {
        renderEraCalendars();
        restoreActiveSection('era');
    } else if (parent === 'saga') {
        renderSagaCalendars();
        restoreActiveSection('saga');
    } else {
        renderDetailCalendars();
        restoreActiveSection('detail');
    }
}
