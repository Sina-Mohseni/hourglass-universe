/* =============================================
   CALENDARS
   ============================================= */

function renderEraCalendars() {
    const universe = appData.universes[appData.currentUniverse];
    const era = universe.eras[appData.currentEra];
    const container = document.getElementById('calendarsContainer');
    container.innerHTML = '';

    if (!era.calendars || !era.calendars.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">Aucun calendrier</div></div>';
        return;
    }

    era.calendars.forEach((cal, index) => {
        container.appendChild(createCalendarElement(cal, index, 'era'));
    });
}

function renderDetailCalendars() {
    const universe = appData.universes[appData.currentUniverse];
    const era = universe.eras[appData.currentEra];
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
    if (cal.naturalCycleIndex !== undefined && cal.naturalCycleIndex !== null && cal.naturalCycleIndex !== '') {
        const universe = appData.universes[appData.currentUniverse];
        if (universe.temporalSystem && universe.temporalSystem.naturalCycles) {
            const cycle = universe.temporalSystem.naturalCycles[cal.naturalCycleIndex];
            if (cycle) {
                cycleInfo = `<div class="calendar-cycle-info">Basé sur: ${cycle.name}</div>`;
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

function populateNaturalCycleSelector(selectedIndex = '') {
    const select = document.getElementById('calendarNaturalCycle');
    const helpText = document.getElementById('calendarCycleHelp');

    // Reset options
    select.innerHTML = '<option value="">Aucun (cycles artificiels uniquement)</option>';

    const universe = appData.universes[appData.currentUniverse];
    if (universe.temporalSystem && universe.temporalSystem.naturalCycles) {
        const cycles = universe.temporalSystem.naturalCycles;
        cycles.forEach((cycle, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = cycle.name;
            if (selectedIndex !== '' && parseInt(selectedIndex) === index) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        if (cycles.length === 0) {
            helpText.textContent = 'Aucun cycle naturel défini. Créez-en dans la timeline de l\'univers.';
        } else {
            helpText.textContent = 'Choisissez un cycle naturel comme base ou laissez vide pour un calendrier purement artificiel.';
        }
    } else {
        helpText.textContent = 'Aucun cycle naturel défini. Créez-en dans la timeline de l\'univers.';
    }
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

    populateNaturalCycleSelector();

    document.getElementById('calendarModal').classList.add('active');
}

function editCalendar(parent, index) {
    calendarState = { parentType: parent, editIndex: index };

    let cal;
    if (parent === 'era') {
        cal = appData.universes[appData.currentUniverse].eras[appData.currentEra].calendars[index];
    } else if (parent === 'saga') {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        cal = era.sagas[appData.currentSaga].calendars[index];
    } else {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
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

    populateNaturalCycleSelector(cal.naturalCycleIndex !== undefined ? cal.naturalCycleIndex : '');

    document.getElementById('calendarModal').classList.add('active');
}

async function saveCalendar() {
    const name = document.getElementById('calendarName').value.trim();

    if (!name) {
        showToast('Entrez un nom');
        return;
    }

    const naturalCycleValue = document.getElementById('calendarNaturalCycle').value;

    const cal = {
        name: name,
        naturalCycleIndex: naturalCycleValue !== '' ? parseInt(naturalCycleValue) : null,
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
    if (calendarState.parentType === 'era') {
        target = appData.universes[appData.currentUniverse].eras[appData.currentEra];
    } else if (calendarState.parentType === 'saga') {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        target = era.sagas[appData.currentSaga];
    } else {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
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

    if (calendarState.parentType === 'era') {
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

    if (parent === 'era') {
        target = appData.universes[appData.currentUniverse].eras[appData.currentEra];
    } else if (parent === 'saga') {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        target = era.sagas[appData.currentSaga];
    } else {
        const universe = appData.universes[appData.currentUniverse];
        const era = universe.eras[appData.currentEra];
        const saga = era.sagas[appData.currentSaga];
        target = saga[appData.currentDetailType][appData.currentDetail];
    }

    target.calendars.splice(index, 1);
    await saveAppData();
    showToast('Supprimé');

    if (parent === 'era') {
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
