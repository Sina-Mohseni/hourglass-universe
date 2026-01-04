/* =============================================
   APP INITIALIZATION
   ============================================= */

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        await loadAppData();

        // Defensive: ensure appData has all required properties
        if (!appData.universes) appData.universes = [];
        if (!appData.navStack) appData.navStack = ['home'];

        await renderUniverses();
        createParticles();
        console.log('Application initialisée');
    } catch (error) {
        console.error('Erreur initialisation:', error);
        // Fallback: reset appData if corrupted
        appData = {
            id: 'main',
            universes: [],
            currentUniverse: null,
            currentEra: null,
            currentDetail: null,
            currentDetailType: null,
            navStack: ['home']
        };
        await renderUniverses();
    }
});
