/* =============================================
   APP STATE
   ============================================= */

let appData = {
    id: 'main',
    sagas: [],           // Root level sagas (new structure)
    universes: [],       // Legacy support
    currentSaga: null,
    currentUniverse: null,
    currentWorld: null,
    currentEra: null,
    currentWorldSystem: null,
    currentWorldPoint: null,
    currentDetail: null,
    currentDetailType: null,
    currentElementTypeIndex: null,
    navStack: ['home']
};

let modalState = {
    type: null,
    mode: null,
    editIndex: null,
    parentType: null,
    mediaId: null,
    mediaBase64: null,
    mediaType: null,
    audioFiles: [],
    linkedEntities: []  // Sujets liés
};

let itemlineState = { parentType: null, editIndex: null };
let calendarState = { parentType: null, editIndex: null };
let deleteState = { type: null };
let audioState = { tracks: [], currentIndex: 0, isPlaying: false };

// Track active sections for each page
let activeSections = {
    universe: null,
    world: null,
    era: null,
    saga: null,
    detail: null
};

// Saga crossline state
let currentSagaCrosslineType = 'histoires';

// Detail crossline state
let currentDetailCrosslineType = 'histoires';

// Universe crossline state
let universeCrosslineState = { editIndex: null };
