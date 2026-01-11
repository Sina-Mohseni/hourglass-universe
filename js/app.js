/* =============================================
   APP INITIALIZATION
   ============================================= */

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        await loadAppData();

        // Defensive: ensure appData has all required properties
        if (!appData.sagas) appData.sagas = [];
        if (!appData.universes) appData.universes = [];
        if (!appData.navStack) appData.navStack = ['home'];

        await renderSagasHome();
        createParticles();
        console.log('Application initialisée');
    } catch (error) {
        console.error('Erreur initialisation:', error);
        // Fallback: reset appData if corrupted
        appData = {
            id: 'main',
            sagas: [],
            universes: [],
            currentSaga: null,
            currentUniverse: null,
            currentWorld: null,
            currentEra: null,
            currentDetail: null,
            currentDetailType: null,
            navStack: ['home']
        };
        await renderSagasHome();
    }
});
