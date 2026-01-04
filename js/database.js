/* =============================================
   DATABASE & STORAGE
   ============================================= */

const DB_NAME = 'HourglassDB';
const DB_VERSION = 1;
let db = null;

// Cache mémoire pour tous les médias chargés
const mediaStore = new Map();

async function initDB() {
    return new Promise((resolve) => {
        if (!window.indexedDB) {
            console.log('IndexedDB non disponible, utilisation localStorage');
            resolve(null);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.log('IndexedDB erreur, fallback localStorage');
            resolve(null);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('IndexedDB connectée');
            resolve(db);
        };

        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            if (!database.objectStoreNames.contains('appData')) {
                database.createObjectStore('appData', { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains('media')) {
                database.createObjectStore('media', { keyPath: 'id' });
            }
        };
    });
}

async function saveAppData() {
    if (!db) {
        try {
            localStorage.setItem('hourglass_appData', JSON.stringify(appData));
        } catch (e) {
            console.warn('Erreur localStorage:', e);
        }
        return;
    }

    return new Promise((resolve) => {
        const tx = db.transaction('appData', 'readwrite');
        tx.objectStore('appData').put(appData);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
    });
}

async function loadAppData() {
    if (!db) {
        try {
            const data = localStorage.getItem('hourglass_appData');
            if (data) appData = JSON.parse(data);
        } catch (e) {}
        return;
    }

    return new Promise((resolve) => {
        const tx = db.transaction('appData', 'readonly');
        const request = tx.objectStore('appData').get('main');
        request.onsuccess = () => {
            if (request.result) appData = request.result;
            resolve();
        };
        request.onerror = () => resolve();
    });
}
