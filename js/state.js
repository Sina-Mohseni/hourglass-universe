/* =============================================
   APP STATE
   ============================================= */

let appData = {
    id: 'main',
    universes: [],
    currentUniverse: null,
    currentEra: null,
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
    detail: null
};

// Era crossline state
let currentEraCrosslineType = 'lieux';

// Detail crossline state
let currentDetailCrosslineType = 'lieux';

// Universe crossline state
let universeCrosslineState = { editIndex: null };
