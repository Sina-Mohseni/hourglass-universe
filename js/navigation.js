/* =============================================
   NAVIGATION
   ============================================= */

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
    document.getElementById(page).classList.add('active');
}

function goBack() {
    appData.navStack.pop();
    const page = appData.navStack[appData.navStack.length - 1];

    if (page === 'home') {
        appData.currentUniverse = null;
        appData.currentWorldSystem = null;
        appData.currentWorldPoint = null;
        appData.currentEra = null;
        appData.currentSaga = null;
        appData.currentDetail = null;
        navigateTo('homePage');
        renderUniverses();
    } else if (page === 'universe') {
        appData.currentWorldSystem = null;
        appData.currentWorldPoint = null;
        appData.currentEra = null;
        appData.currentSaga = null;
        appData.currentDetail = null;
        renderUniversePage();
        navigateTo('universePage');
    } else if (page === 'world') {
        appData.currentEra = null;
        appData.currentSaga = null;
        appData.currentDetail = null;
        renderWorldPage();
        navigateTo('worldPage');
    } else if (page === 'era') {
        appData.currentSaga = null;
        appData.currentDetail = null;
        renderEraPage();
        navigateTo('eraPage');
    } else if (page === 'saga') {
        appData.currentDetail = null;
        renderSagaPage();
        navigateTo('sagaPage');
    }

    closeAudioPlayer();
    saveAppData();
}
