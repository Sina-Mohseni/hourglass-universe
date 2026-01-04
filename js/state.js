/* =============================================
   APP STATE
   ============================================= */

let appData = {
    id: 'main',
    universes: [],
    currentUniverse: null,
    currentEra: null,
    currentSaga: null,
    currentDetail: null,
    currentDetailType: null,
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
    audioFiles: []
};

let itemlineState = { parentType: null, editIndex: null };
let calendarState = { parentType: null, editIndex: null };
let deleteState = { type: null };
let audioState = { tracks: [], currentIndex: 0, isPlaying: false };

// Track active sections for each page
let activeSections = {
    universe: null,
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
